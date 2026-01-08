/**
 * RPM Data Aggregator
 * Aggregates and processes RPM data for analysis and reporting
 */

import type {
  VitalSignReading,
  AggregatedData,
  ReadingType,
  TimePeriod,
  DataStatistics,
  RPMQueryParams,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { vitalSignsCollector } from "./vital-signs-collector";

export class DataAggregator {
  /**
   * Aggregate readings for a specific period
   */
  async aggregateReadings(
    patientId: string,
    readingType: ReadingType,
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date
  ): Promise<AggregatedData> {
    const dateRange = this.calculateDateRange(period, startDate, endDate);

    const readings = await vitalSignsCollector.getPatientReadings(patientId, {
      readingType,
      startDate: dateRange.start,
      endDate: dateRange.end,
      includeOutliers: false,
    });

    const statistics = this.calculateStatistics(readings);
    const trendAnalysis = await this.analyzeTrend(readings, period);

    return {
      patientId,
      readingType,
      period,
      startDate: dateRange.start,
      endDate: dateRange.end,
      statistics,
      readings,
      trendAnalysis,
      generatedAt: new Date(),
    };
  }

  /**
   * Aggregate multiple reading types
   */
  async aggregateMultipleTypes(
    patientId: string,
    readingTypes: ReadingType[],
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<ReadingType, AggregatedData>> {
    const aggregated: Record<string, AggregatedData> = {};

    for (const readingType of readingTypes) {
      try {
        aggregated[readingType] = await this.aggregateReadings(
          patientId,
          readingType,
          period,
          startDate,
          endDate
        );
      } catch (error) {
        console.error(`Error aggregating ${readingType}:`, error);
      }
    }

    return aggregated as Record<ReadingType, AggregatedData>;
  }

  /**
   * Get time-series data grouped by intervals
   */
  async getTimeSeriesData(
    patientId: string,
    readingType: ReadingType,
    interval: "hour" | "day" | "week" | "month",
    startDate: Date,
    endDate: Date
  ) {
    const readings = await vitalSignsCollector.getPatientReadings(patientId, {
      readingType,
      startDate,
      endDate,
      includeOutliers: false,
    });

    const grouped = this.groupByInterval(readings, interval);

    return grouped.map((group) => ({
      timestamp: group.timestamp,
      count: group.readings.length,
      average: this.average(group.readings.map((r) => r.value)),
      min: Math.min(...group.readings.map((r) => r.value)),
      max: Math.max(...group.readings.map((r) => r.value)),
      readings: group.readings,
    }));
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    overallCompliance: number;
    deviceCompliance: Record<string, number>;
    readingCompliance: Record<ReadingType, number>;
    missedReadings: number;
    consecutiveDaysCompliant: number;
    complianceByDay: Array<{ date: Date; compliant: boolean; readingsCount: number }>;
  }> {
    // Get all devices for patient
    const devices = await db.rpmDevice.findMany({
      where: { patientId, deletedAt: null },
    });

    // Get all readings in period
    const readings = await db.rpmReading.findMany({
      where: {
        patientId,
        timestamp: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      orderBy: { timestamp: "asc" },
    });

    // Calculate daily compliance
    const complianceByDay = this.calculateDailyCompliance(readings as VitalSignReading[], startDate, endDate);

    // Calculate device-specific compliance
    const deviceCompliance: Record<string, number> = {};
    for (const device of devices) {
      const deviceReadings = readings.filter((r) => r.deviceId === device.id);
      const expectedReadings = this.getExpectedReadings(device, startDate, endDate);
      deviceCompliance[device.id] = expectedReadings > 0 ? (deviceReadings.length / expectedReadings) * 100 : 0;
    }

    // Calculate reading type compliance
    const readingCompliance: Record<string, number> = {};
    const readingTypes = [...new Set(readings.map((r) => r.readingType))];

    for (const type of readingTypes) {
      const typeReadings = readings.filter((r) => r.readingType === type);
      const expectedReadings = this.getExpectedReadingsForType(type as ReadingType, startDate, endDate);
      readingCompliance[type] = expectedReadings > 0 ? (typeReadings.length / expectedReadings) * 100 : 0;
    }

    // Calculate consecutive compliant days
    const consecutiveDaysCompliant = this.calculateConsecutiveCompliantDays(complianceByDay);

    // Calculate missed readings
    const totalExpectedReadings = this.getTotalExpectedReadings(devices, startDate, endDate);
    const missedReadings = Math.max(0, totalExpectedReadings - readings.length);

    // Overall compliance
    const overallCompliance = totalExpectedReadings > 0 ? (readings.length / totalExpectedReadings) * 100 : 0;

    return {
      overallCompliance,
      deviceCompliance,
      readingCompliance: readingCompliance as Record<ReadingType, number>,
      missedReadings,
      consecutiveDaysCompliant,
      complianceByDay,
    };
  }

  /**
   * Get summary statistics for all vital signs
   */
  async getSummaryStatistics(
    patientId: string,
    days: number = 30
  ): Promise<Record<ReadingType, DataStatistics>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const allReadings = await db.rpmReading.findMany({
      where: {
        patientId,
        timestamp: { gte: startDate, lte: endDate },
        isOutlier: false,
        deletedAt: null,
      },
    });

    const byType: Record<string, VitalSignReading[]> = {};

    (allReadings as VitalSignReading[]).forEach((reading) => {
      if (!byType[reading.readingType]) {
        byType[reading.readingType] = [];
      }
      byType[reading.readingType].push(reading);
    });

    const statistics: Record<string, DataStatistics> = {};

    for (const [type, readings] of Object.entries(byType)) {
      statistics[type] = this.calculateStatistics(readings);
    }

    return statistics as Record<ReadingType, DataStatistics>;
  }

  /**
   * Export data for reporting
   */
  async exportData(
    patientId: string,
    params: RPMQueryParams
  ): Promise<{
    patient: any;
    devices: any[];
    readings: VitalSignReading[];
    alerts: any[];
    statistics: Record<ReadingType, DataStatistics>;
    exportedAt: Date;
  }> {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    const devices = await db.rpmDevice.findMany({ where: { patientId, deletedAt: null } });

    const where: any = { patientId, deletedAt: null };

    if (params.readingType) {
      where.readingType = params.readingType;
    }

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = params.startDate;
      }
      if (params.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }

    const readings = await db.rpmReading.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    const alerts = await db.rpmAlert.findMany({
      where: {
        patientId,
        triggeredAt: where.timestamp || undefined,
        deletedAt: null,
      },
      orderBy: { triggeredAt: "desc" },
    });

    const statistics = await this.getSummaryStatistics(
      patientId,
      params.endDate && params.startDate
        ? Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30
    );

    return {
      patient,
      devices,
      readings: readings as VitalSignReading[],
      alerts,
      statistics,
      exportedAt: new Date(),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate date range for period
   */
  private calculateDateRange(
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const end = endDate || new Date();
    let start: Date;

    switch (period) {
      case TimePeriod.HOUR:
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case TimePeriod.DAY:
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case TimePeriod.WEEK:
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case TimePeriod.MONTH:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case TimePeriod.QUARTER:
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case TimePeriod.YEAR:
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case TimePeriod.CUSTOM:
        start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * Calculate statistics from readings
   */
  private calculateStatistics(readings: VitalSignReading[]): DataStatistics {
    if (readings.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        mode: null,
        standardDeviation: 0,
        variance: 0,
        percentile25: 0,
        percentile75: 0,
        percentile90: 0,
        percentile95: 0,
        inRangeCount: 0,
        outOfRangeCount: 0,
        complianceRate: 0,
      };
    }

    const values = readings.map((r) => r.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const median = values[Math.floor(values.length / 2)];
    const mode = this.calculateMode(values);

    const inRange = readings.filter((r) => !r.isFlagged).length;
    const outOfRange = readings.length - inRange;

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean,
      median,
      mode,
      standardDeviation: stdDev,
      variance,
      percentile25: values[Math.floor(values.length * 0.25)],
      percentile75: values[Math.floor(values.length * 0.75)],
      percentile90: values[Math.floor(values.length * 0.90)],
      percentile95: values[Math.floor(values.length * 0.95)],
      inRangeCount: inRange,
      outOfRangeCount: outOfRange,
      complianceRate: (inRange / values.length) * 100,
    };
  }

  /**
   * Calculate mode
   */
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
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Group readings by interval
   */
  private groupByInterval(
    readings: VitalSignReading[],
    interval: "hour" | "day" | "week" | "month"
  ): Array<{ timestamp: Date; readings: VitalSignReading[] }> {
    const grouped = new Map<string, VitalSignReading[]>();

    readings.forEach((reading) => {
      const key = this.getIntervalKey(reading.timestamp, interval);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(reading);
    });

    return Array.from(grouped.entries())
      .map(([key, readings]) => ({
        timestamp: new Date(key),
        readings,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get interval key for grouping
   */
  private getIntervalKey(date: Date, interval: "hour" | "day" | "week" | "month"): string {
    const d = new Date(date);

    switch (interval) {
      case "hour":
        d.setMinutes(0, 0, 0);
        return d.toISOString();
      case "day":
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      case "week":
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      case "month":
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      default:
        return d.toISOString();
    }
  }

  /**
   * Calculate daily compliance
   */
  private calculateDailyCompliance(
    readings: VitalSignReading[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; compliant: boolean; readingsCount: number }> {
    const days: Array<{ date: Date; compliant: boolean; readingsCount: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const dayReadings = readings.filter(
        (r) => r.timestamp >= dayStart && r.timestamp <= dayEnd
      );

      // Consider compliant if at least one reading per day
      days.push({
        date: new Date(current),
        compliant: dayReadings.length > 0,
        readingsCount: dayReadings.length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Calculate consecutive compliant days
   */
  private calculateConsecutiveCompliantDays(
    complianceByDay: Array<{ date: Date; compliant: boolean; readingsCount: number }>
  ): number {
    let consecutive = 0;
    let current = 0;

    // Count from most recent day backwards
    for (let i = complianceByDay.length - 1; i >= 0; i--) {
      if (complianceByDay[i].compliant) {
        current++;
      } else {
        break;
      }
    }

    return current;
  }

  /**
   * Get expected readings for device
   */
  private getExpectedReadings(device: any, startDate: Date, endDate: Date): number {
    // Simplified: expect 1 reading per day
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }

  /**
   * Get expected readings for type
   */
  private getExpectedReadingsForType(type: ReadingType, startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Different reading types have different expected frequencies
    const frequencies: Partial<Record<ReadingType, number>> = {
      [ReadingType.BLOOD_GLUCOSE]: 3, // 3 times per day
      [ReadingType.BLOOD_PRESSURE_MONITOR]: 2, // 2 times per day
      [ReadingType.WEIGHT]: 1, // Once per day
      [ReadingType.OXYGEN_SATURATION]: 2, // 2 times per day
    };

    return days * (frequencies[type] || 1);
  }

  /**
   * Get total expected readings
   */
  private getTotalExpectedReadings(devices: any[], startDate: Date, endDate: Date): number {
    return devices.reduce((total, device) => {
      return total + this.getExpectedReadings(device, startDate, endDate);
    }, 0);
  }

  /**
   * Analyze trend (delegated to trend analyzer)
   */
  private async analyzeTrend(readings: VitalSignReading[], period: TimePeriod): Promise<any> {
    // This will be implemented by the trend analyzer
    return {
      direction: "STABLE",
      strength: 0,
      slope: 0,
      rSquared: 0,
      forecast: [],
      changePoints: [],
      seasonality: null,
      anomalies: [],
      insights: [],
    };
  }
}

export const dataAggregator = new DataAggregator();
