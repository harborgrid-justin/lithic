/**
 * Vital Signs Data Collector
 * Handles collection, validation, and storage of vital sign readings
 */

import type {
  VitalSignReading,
  ReadingType,
  ReadingSource,
  ReadingMetadata,
  CreateReadingDto,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit-logger";
import { realtimeEngine } from "@/lib/realtime/engine";
import { deviceManager } from "./device-manager";

interface ValidationResult {
  isValid: boolean;
  isOutlier: boolean;
  isFlagged: boolean;
  flagReason?: string;
  normalizedValue?: number;
}

export class VitalSignsCollector {
  /**
   * Collect and store a vital sign reading
   */
  async collectReading(
    dto: CreateReadingDto,
    userId: string,
    organizationId: string
  ): Promise<VitalSignReading> {
    // Validate the reading
    const validation = await this.validateReading(dto);

    if (!validation.isValid) {
      throw new Error(`Invalid reading: ${validation.flagReason}`);
    }

    // Update device last reading time
    if (dto.deviceId) {
      await deviceManager.recordConnection(dto.deviceId, {});
      await db.rpmDevice.update({
        where: { id: dto.deviceId },
        data: { lastReading: new Date() },
      });
    }

    const reading: VitalSignReading = {
      id: crypto.randomUUID(),
      patientId: dto.patientId,
      deviceId: dto.deviceId || null,
      readingType: dto.readingType,
      value: dto.value,
      unit: dto.unit,
      timestamp: dto.timestamp || new Date(),
      source: dto.source,
      metadata: dto.metadata || {},
      isValidated: dto.source === ReadingSource.DEVICE,
      validatedBy: dto.source === ReadingSource.DEVICE ? "system" : null,
      validatedAt: dto.source === ReadingSource.DEVICE ? new Date() : null,
      isFlagged: validation.isFlagged,
      flagReason: validation.flagReason || null,
      isOutlier: validation.isOutlier,
      notes: null,
      fhirObservationId: null,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    // Store in database
    await db.rpmReading.create({ data: reading });

    // Create FHIR Observation resource
    const fhirObservationId = await this.createFHIRObservation(reading);
    if (fhirObservationId) {
      await db.rpmReading.update({
        where: { id: reading.id },
        data: { fhirObservationId },
      });
      reading.fhirObservationId = fhirObservationId;
    }

    // Audit log
    await auditLog({
      action: "READING_COLLECTED",
      entityType: "RPM_READING",
      entityId: reading.id,
      userId,
      organizationId,
      metadata: {
        readingType: dto.readingType,
        value: dto.value,
        source: dto.source,
      },
    });

    // Emit real-time event
    await realtimeEngine.emit({
      event: "reading:new",
      channel: `patient:${dto.patientId}`,
      data: reading,
    });

    // Trigger alert evaluation
    await this.evaluateForAlerts(reading);

    return reading;
  }

  /**
   * Collect batch readings (e.g., from device sync)
   */
  async collectBatchReadings(
    readings: CreateReadingDto[],
    userId: string,
    organizationId: string
  ): Promise<VitalSignReading[]> {
    const collected: VitalSignReading[] = [];

    for (const dto of readings) {
      try {
        const reading = await this.collectReading(dto, userId, organizationId);
        collected.push(reading);
      } catch (error) {
        console.error(`Error collecting reading:`, error);
        // Continue with other readings
      }
    }

    return collected;
  }

  /**
   * Get readings for a patient
   */
  async getPatientReadings(
    patientId: string,
    options?: {
      readingType?: ReadingType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      includeOutliers?: boolean;
    }
  ): Promise<VitalSignReading[]> {
    const where: any = {
      patientId,
      deletedAt: null,
    };

    if (options?.readingType) {
      where.readingType = options.readingType;
    }

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    if (options?.includeOutliers === false) {
      where.isOutlier = false;
    }

    const readings = await db.rpmReading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: options?.limit || 100,
    });

    return readings as VitalSignReading[];
  }

  /**
   * Get latest reading for each type
   */
  async getLatestReadings(patientId: string): Promise<Record<ReadingType, VitalSignReading>> {
    const readings = await db.rpmReading.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { timestamp: "desc" },
    });

    const latest: Record<string, VitalSignReading> = {};

    for (const reading of readings) {
      if (!latest[reading.readingType]) {
        latest[reading.readingType] = reading as VitalSignReading;
      }
    }

    return latest as Record<ReadingType, VitalSignReading>;
  }

  /**
   * Validate a reading
   */
  private async validateReading(dto: CreateReadingDto): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      isOutlier: false,
      isFlagged: false,
    };

    // Check for physiologically impossible values
    const ranges = this.getPhysiologicalRanges(dto.readingType);

    if (dto.value < ranges.absoluteMin || dto.value > ranges.absoluteMax) {
      result.isValid = false;
      result.isFlagged = true;
      result.flagReason = `Value ${dto.value} is outside physiologically possible range (${ranges.absoluteMin}-${ranges.absoluteMax})`;
      return result;
    }

    // Check for outliers using recent readings
    const isOutlier = await this.detectOutlier(dto);
    if (isOutlier) {
      result.isOutlier = true;
      result.isFlagged = true;
      result.flagReason = "Statistical outlier detected based on patient history";
    }

    // Check for abnormal values
    if (dto.value < ranges.normalMin || dto.value > ranges.normalMax) {
      result.isFlagged = true;
      if (!result.flagReason) {
        result.flagReason = `Value outside normal range (${ranges.normalMin}-${ranges.normalMax})`;
      }
    }

    return result;
  }

  /**
   * Get physiological ranges for reading types
   */
  private getPhysiologicalRanges(readingType: ReadingType) {
    const ranges: Record<
      ReadingType,
      { absoluteMin: number; absoluteMax: number; normalMin: number; normalMax: number }
    > = {
      [ReadingType.SYSTOLIC_BP]: { absoluteMin: 40, absoluteMax: 250, normalMin: 90, normalMax: 140 },
      [ReadingType.DIASTOLIC_BP]: { absoluteMin: 20, absoluteMax: 180, normalMin: 60, normalMax: 90 },
      [ReadingType.HEART_RATE]: { absoluteMin: 20, absoluteMax: 250, normalMin: 60, normalMax: 100 },
      [ReadingType.OXYGEN_SATURATION]: { absoluteMin: 50, absoluteMax: 100, normalMin: 95, normalMax: 100 },
      [ReadingType.BLOOD_GLUCOSE]: { absoluteMin: 20, absoluteMax: 600, normalMin: 70, normalMax: 130 },
      [ReadingType.WEIGHT]: { absoluteMin: 20, absoluteMax: 500, normalMin: 50, normalMax: 300 },
      [ReadingType.TEMPERATURE]: { absoluteMin: 90, absoluteMax: 110, normalMin: 97, normalMax: 99 },
      [ReadingType.RESPIRATORY_RATE]: { absoluteMin: 4, absoluteMax: 60, normalMin: 12, normalMax: 20 },
      [ReadingType.PEAK_FLOW]: { absoluteMin: 50, absoluteMax: 800, normalMin: 300, normalMax: 600 },
      [ReadingType.FEV1]: { absoluteMin: 0.5, absoluteMax: 8, normalMin: 2, normalMax: 6 },
      [ReadingType.INR]: { absoluteMin: 0.5, absoluteMax: 10, normalMin: 0.8, normalMax: 1.2 },
      [ReadingType.STEPS]: { absoluteMin: 0, absoluteMax: 100000, normalMin: 0, normalMax: 50000 },
      [ReadingType.CALORIES]: { absoluteMin: 0, absoluteMax: 10000, normalMin: 1200, normalMax: 3500 },
      [ReadingType.SLEEP_HOURS]: { absoluteMin: 0, absoluteMax: 24, normalMin: 6, normalMax: 9 },
      [ReadingType.ACTIVITY_MINUTES]: { absoluteMin: 0, absoluteMax: 1440, normalMin: 30, normalMax: 180 },
    };

    return ranges[readingType] || { absoluteMin: 0, absoluteMax: 1000000, normalMin: 0, normalMax: 1000 };
  }

  /**
   * Detect outliers using statistical methods
   */
  private async detectOutlier(dto: CreateReadingDto): Promise<boolean> {
    // Get recent readings of the same type
    const recentReadings = await db.rpmReading.findMany({
      where: {
        patientId: dto.patientId,
        readingType: dto.readingType,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        isOutlier: false,
        deletedAt: null,
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    if (recentReadings.length < 10) {
      return false; // Not enough data for outlier detection
    }

    const values = recentReadings.map((r) => r.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Use Z-score method: if |z-score| > 3, it's an outlier
    const zScore = Math.abs((dto.value - mean) / stdDev);

    return zScore > 3;
  }

  /**
   * Create FHIR Observation resource
   */
  private async createFHIRObservation(reading: VitalSignReading): Promise<string | null> {
    try {
      const fhirObservation = {
        resourceType: "Observation",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: this.getLOINCCode(reading.readingType),
              display: reading.readingType,
            },
          ],
        },
        subject: {
          reference: `Patient/${reading.patientId}`,
        },
        effectiveDateTime: reading.timestamp.toISOString(),
        issued: reading.createdAt.toISOString(),
        valueQuantity: {
          value: reading.value,
          unit: reading.unit,
          system: "http://unitsofmeasure.org",
          code: reading.unit,
        },
        device: reading.deviceId
          ? {
              reference: `Device/${reading.deviceId}`,
            }
          : undefined,
      };

      // Store in FHIR server (implementation depends on FHIR server setup)
      // const response = await fhirClient.create(fhirObservation);
      // return response.id;

      return null; // Placeholder
    } catch (error) {
      console.error("Error creating FHIR observation:", error);
      return null;
    }
  }

  /**
   * Get LOINC code for reading type
   */
  private getLOINCCode(readingType: ReadingType): string {
    const codes: Record<ReadingType, string> = {
      [ReadingType.SYSTOLIC_BP]: "8480-6",
      [ReadingType.DIASTOLIC_BP]: "8462-4",
      [ReadingType.HEART_RATE]: "8867-4",
      [ReadingType.OXYGEN_SATURATION]: "59408-5",
      [ReadingType.BLOOD_GLUCOSE]: "2339-0",
      [ReadingType.WEIGHT]: "29463-7",
      [ReadingType.TEMPERATURE]: "8310-5",
      [ReadingType.RESPIRATORY_RATE]: "9279-1",
      [ReadingType.PEAK_FLOW]: "33452-4",
      [ReadingType.FEV1]: "20150-9",
      [ReadingType.INR]: "6301-6",
      [ReadingType.STEPS]: "41950-7",
      [ReadingType.CALORIES]: "41979-6",
      [ReadingType.SLEEP_HOURS]: "93832-4",
      [ReadingType.ACTIVITY_MINUTES]: "55411-3",
    };
    return codes[readingType] || "unknown";
  }

  /**
   * Evaluate reading for alerts
   */
  private async evaluateForAlerts(reading: VitalSignReading): Promise<void> {
    // This will be handled by the alert engine
    // Import and call alert engine here
    console.log(`Evaluating reading ${reading.id} for alerts`);
  }

  /**
   * Get reading statistics for a time period
   */
  async getReadingStatistics(
    patientId: string,
    readingType: ReadingType,
    startDate: Date,
    endDate: Date
  ) {
    const readings = await this.getPatientReadings(patientId, {
      readingType,
      startDate,
      endDate,
      includeOutliers: false,
    });

    if (readings.length === 0) {
      return null;
    }

    const values = readings.map((r) => r.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean,
      median: values[Math.floor(values.length / 2)],
      mode: this.calculateMode(values),
      standardDeviation: stdDev,
      variance,
      percentile25: values[Math.floor(values.length * 0.25)],
      percentile75: values[Math.floor(values.length * 0.75)],
      percentile90: values[Math.floor(values.length * 0.90)],
      percentile95: values[Math.floor(values.length * 0.95)],
    };
  }

  private calculateMode(values: number[]): number | null {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let mode: number | null = null;

    values.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    });

    return maxFreq > 1 ? mode : null;
  }

  /**
   * Normalize reading to standard units
   */
  normalizeReading(value: number, currentUnit: string, readingType: ReadingType): number {
    // Implement unit conversion logic
    switch (readingType) {
      case ReadingType.TEMPERATURE:
        if (currentUnit === "C") {
          return (value * 9) / 5 + 32; // Convert to Fahrenheit
        }
        return value;

      case ReadingType.WEIGHT:
        if (currentUnit === "kg") {
          return value * 2.20462; // Convert to pounds
        }
        return value;

      case ReadingType.BLOOD_GLUCOSE:
        if (currentUnit === "mmol/L") {
          return value * 18.0182; // Convert to mg/dL
        }
        return value;

      default:
        return value;
    }
  }
}

export const vitalSignsCollector = new VitalSignsCollector();
