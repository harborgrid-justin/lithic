/**
 * Medical Device Manager
 * Handles device registration, connection management, and lifecycle
 */

import type {
  MedicalDevice,
  DeviceType,
  DeviceStatus,
  ConnectionType,
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceFilters,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { auditLog } from "@/lib/audit-logger";
import { realtimeEngine } from "@/lib/realtime/engine";

export class DeviceManager {
  /**
   * Register a new medical device for a patient
   */
  async registerDevice(
    dto: CreateDeviceDto,
    userId: string,
    organizationId: string
  ): Promise<MedicalDevice> {
    // Validate device doesn't already exist
    const existing = await this.findBySerialNumber(
      dto.serialNumber,
      organizationId
    );
    if (existing) {
      throw new Error(`Device with serial number ${dto.serialNumber} already registered`);
    }

    const deviceId = this.generateDeviceId(dto.deviceType, dto.serialNumber);

    const device: MedicalDevice = {
      id: crypto.randomUUID(),
      deviceId,
      patientId: dto.patientId,
      deviceType: dto.deviceType,
      manufacturer: dto.manufacturer,
      model: dto.model,
      serialNumber: dto.serialNumber,
      firmwareVersion: null,
      status: DeviceStatus.ACTIVE,
      connectionType: dto.connectionType,
      lastConnection: null,
      lastReading: null,
      batteryLevel: null,
      isActive: true,
      enrolledAt: new Date(),
      enrolledBy: userId,
      deactivatedAt: null,
      deactivatedBy: null,
      calibrationDate: null,
      nextCalibrationDate: this.calculateNextCalibration(dto.deviceType),
      metadata: dto.metadata || {},
      fhirDeviceId: null,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    // Store in database
    await db.rpmDevice.create({ data: device });

    // Create FHIR Device resource
    const fhirDeviceId = await this.createFHIRDevice(device);
    if (fhirDeviceId) {
      await db.rpmDevice.update({
        where: { id: device.id },
        data: { fhirDeviceId },
      });
      device.fhirDeviceId = fhirDeviceId;
    }

    // Audit log
    await auditLog({
      action: "DEVICE_REGISTERED",
      entityType: "RPM_DEVICE",
      entityId: device.id,
      userId,
      organizationId,
      metadata: { deviceType: dto.deviceType, serialNumber: dto.serialNumber },
    });

    // Emit real-time event
    await realtimeEngine.emit({
      event: "device:registered",
      channel: `patient:${dto.patientId}`,
      data: device,
    });

    return device;
  }

  /**
   * Update device information and status
   */
  async updateDevice(
    dto: UpdateDeviceDto,
    userId: string,
    organizationId: string
  ): Promise<MedicalDevice> {
    const device = await db.rpmDevice.findUnique({
      where: { id: dto.id, organizationId },
    });

    if (!device) {
      throw new Error("Device not found");
    }

    const updated = await db.rpmDevice.update({
      where: { id: dto.id },
      data: {
        ...dto,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Audit log
    await auditLog({
      action: "DEVICE_UPDATED",
      entityType: "RPM_DEVICE",
      entityId: device.id,
      userId,
      organizationId,
      metadata: { changes: dto },
    });

    // Emit real-time event if status changed
    if (dto.status && dto.status !== device.status) {
      await realtimeEngine.emit({
        event: "device:status_changed",
        channel: `patient:${device.patientId}`,
        data: { deviceId: device.id, oldStatus: device.status, newStatus: dto.status },
      });
    }

    return updated as MedicalDevice;
  }

  /**
   * Record device connection
   */
  async recordConnection(
    deviceId: string,
    connectionData: {
      batteryLevel?: number;
      firmwareVersion?: string;
      signal?: number;
    }
  ): Promise<void> {
    const device = await db.rpmDevice.findUnique({ where: { id: deviceId } });
    if (!device) return;

    const updates: Partial<MedicalDevice> = {
      lastConnection: new Date(),
      updatedAt: new Date(),
    };

    if (connectionData.batteryLevel !== undefined) {
      updates.batteryLevel = connectionData.batteryLevel;

      // Check battery level and update status
      if (connectionData.batteryLevel < 20 && device.status !== DeviceStatus.LOW_BATTERY) {
        updates.status = DeviceStatus.LOW_BATTERY;
      } else if (connectionData.batteryLevel >= 20 && device.status === DeviceStatus.LOW_BATTERY) {
        updates.status = DeviceStatus.ACTIVE;
      }
    }

    if (connectionData.firmwareVersion) {
      updates.firmwareVersion = connectionData.firmwareVersion;
    }

    // Update device to online if it was offline
    if (device.status === DeviceStatus.OFFLINE) {
      updates.status = DeviceStatus.ACTIVE;
    }

    await db.rpmDevice.update({
      where: { id: deviceId },
      data: updates,
    });

    // Emit real-time event
    await realtimeEngine.emit({
      event: "device:connected",
      channel: `patient:${device.patientId}`,
      data: { deviceId, connectionData },
    });
  }

  /**
   * Mark device as offline
   */
  async markOffline(deviceId: string): Promise<void> {
    const device = await db.rpmDevice.findUnique({ where: { id: deviceId } });
    if (!device) return;

    await db.rpmDevice.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.OFFLINE,
        updatedAt: new Date(),
      },
    });

    // Emit real-time event
    await realtimeEngine.emit({
      event: "device:offline",
      channel: `patient:${device.patientId}`,
      data: { deviceId },
    });

    // Create alert for offline device
    await this.createOfflineAlert(device);
  }

  /**
   * Deactivate a device
   */
  async deactivateDevice(
    deviceId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const device = await db.rpmDevice.findUnique({ where: { id: deviceId } });
    if (!device) {
      throw new Error("Device not found");
    }

    await db.rpmDevice.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.DEACTIVATED,
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Audit log
    await auditLog({
      action: "DEVICE_DEACTIVATED",
      entityType: "RPM_DEVICE",
      entityId: deviceId,
      userId,
      organizationId: device.organizationId,
      metadata: { reason },
    });

    // Emit real-time event
    await realtimeEngine.emit({
      event: "device:deactivated",
      channel: `patient:${device.patientId}`,
      data: { deviceId, reason },
    });
  }

  /**
   * Get devices for a patient
   */
  async getPatientDevices(
    patientId: string,
    filters?: DeviceFilters
  ): Promise<MedicalDevice[]> {
    const where: any = {
      patientId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = { in: filters.status };
    }

    if (filters?.deviceType) {
      where.deviceType = { in: filters.deviceType };
    }

    if (filters?.connectionType) {
      where.connectionType = { in: filters.connectionType };
    }

    if (filters?.batteryLow) {
      where.batteryLevel = { lt: 20 };
    }

    if (filters?.offline) {
      where.status = DeviceStatus.OFFLINE;
    }

    const devices = await db.rpmDevice.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
    });

    return devices as MedicalDevice[];
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string): Promise<MedicalDevice | null> {
    const device = await db.rpmDevice.findUnique({
      where: { id: deviceId, deletedAt: null },
    });
    return device as MedicalDevice | null;
  }

  /**
   * Find device by serial number
   */
  async findBySerialNumber(
    serialNumber: string,
    organizationId: string
  ): Promise<MedicalDevice | null> {
    const device = await db.rpmDevice.findFirst({
      where: {
        serialNumber,
        organizationId,
        deletedAt: null,
      },
    });
    return device as MedicalDevice | null;
  }

  /**
   * Check for devices needing calibration
   */
  async checkCalibrationNeeded(): Promise<MedicalDevice[]> {
    const devices = await db.rpmDevice.findMany({
      where: {
        isActive: true,
        nextCalibrationDate: {
          lte: new Date(),
        },
        status: {
          not: DeviceStatus.NEEDS_CALIBRATION,
        },
      },
    });

    // Update status for devices needing calibration
    for (const device of devices) {
      await this.updateDevice(
        { id: device.id, status: DeviceStatus.NEEDS_CALIBRATION },
        "system",
        device.organizationId
      );
    }

    return devices as MedicalDevice[];
  }

  /**
   * Monitor devices for offline status
   */
  async monitorDeviceHealth(): Promise<void> {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const devices = await db.rpmDevice.findMany({
      where: {
        isActive: true,
        status: DeviceStatus.ACTIVE,
        lastConnection: {
          lt: threshold,
        },
      },
    });

    for (const device of devices) {
      await this.markOffline(device.id);
    }
  }

  /**
   * Get device statistics for organization
   */
  async getDeviceStatistics(organizationId: string) {
    const devices = await db.rpmDevice.findMany({
      where: { organizationId, deletedAt: null },
    });

    const stats = {
      total: devices.length,
      active: devices.filter((d) => d.status === DeviceStatus.ACTIVE).length,
      offline: devices.filter((d) => d.status === DeviceStatus.OFFLINE).length,
      lowBattery: devices.filter((d) => d.status === DeviceStatus.LOW_BATTERY).length,
      needsCalibration: devices.filter((d) => d.status === DeviceStatus.NEEDS_CALIBRATION).length,
      byType: {} as Record<DeviceType, number>,
      byConnectionType: {} as Record<ConnectionType, number>,
    };

    devices.forEach((device) => {
      stats.byType[device.deviceType] = (stats.byType[device.deviceType] || 0) + 1;
      stats.byConnectionType[device.connectionType] =
        (stats.byConnectionType[device.connectionType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validate device connection credentials
   */
  async validateConnection(
    deviceId: string,
    credentials: Record<string, any>
  ): Promise<boolean> {
    const device = await this.getDeviceById(deviceId);
    if (!device) return false;

    // Implement connection validation based on connection type
    switch (device.connectionType) {
      case ConnectionType.BLUETOOTH:
        return this.validateBluetoothConnection(credentials);
      case ConnectionType.WIFI:
        return this.validateWifiConnection(credentials);
      case ConnectionType.API_INTEGRATION:
        return this.validateApiConnection(credentials);
      default:
        return true;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateDeviceId(deviceType: DeviceType, serialNumber: string): string {
    const prefix = deviceType.substring(0, 3).toUpperCase();
    const hash = this.hashString(serialNumber).substring(0, 8);
    return `${prefix}-${hash}-${Date.now().toString(36).toUpperCase()}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private calculateNextCalibration(deviceType: DeviceType): Date {
    const now = new Date();
    const calibrationIntervals: Record<DeviceType, number> = {
      [DeviceType.BLOOD_PRESSURE_MONITOR]: 365, // 1 year
      [DeviceType.GLUCOMETER]: 180, // 6 months
      [DeviceType.WEIGHT_SCALE]: 365, // 1 year
      [DeviceType.THERMOMETER]: 365, // 1 year
      [DeviceType.PULSE_OXIMETER]: 180, // 6 months
      [DeviceType.ECG_MONITOR]: 180, // 6 months
      [DeviceType.SPIROMETER]: 90, // 3 months
      [DeviceType.PEAK_FLOW_METER]: 90, // 3 months
      [DeviceType.INR_MONITOR]: 90, // 3 months
      [DeviceType.CONTINUOUS_GLUCOSE_MONITOR]: 90, // 3 months
      [DeviceType.HEART_RATE_MONITOR]: 365, // 1 year
      [DeviceType.SMART_WATCH]: 0, // No calibration
      [DeviceType.FITNESS_TRACKER]: 0, // No calibration
    };

    const days = calibrationIntervals[deviceType] || 365;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private async createFHIRDevice(device: MedicalDevice): Promise<string | null> {
    try {
      const fhirDevice = {
        resourceType: "Device",
        identifier: [
          {
            system: "urn:lithic:device",
            value: device.deviceId,
          },
          {
            type: {
              text: "Serial Number",
            },
            value: device.serialNumber,
          },
        ],
        status: this.mapStatusToFHIR(device.status),
        manufacturer: device.manufacturer,
        deviceName: [
          {
            name: `${device.manufacturer} ${device.model}`,
            type: "user-friendly-name",
          },
        ],
        modelNumber: device.model,
        type: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: this.getDeviceSNOMEDCode(device.deviceType),
              display: device.deviceType,
            },
          ],
        },
        patient: {
          reference: `Patient/${device.patientId}`,
        },
      };

      // Store in FHIR server (implementation depends on FHIR server setup)
      // const response = await fhirClient.create(fhirDevice);
      // return response.id;

      return null; // Placeholder
    } catch (error) {
      console.error("Error creating FHIR device:", error);
      return null;
    }
  }

  private mapStatusToFHIR(status: DeviceStatus): string {
    const mapping: Record<DeviceStatus, string> = {
      [DeviceStatus.ACTIVE]: "active",
      [DeviceStatus.OFFLINE]: "inactive",
      [DeviceStatus.LOW_BATTERY]: "active",
      [DeviceStatus.NEEDS_CALIBRATION]: "active",
      [DeviceStatus.ERROR]: "entered-in-error",
      [DeviceStatus.MAINTENANCE]: "inactive",
      [DeviceStatus.DEACTIVATED]: "inactive",
    };
    return mapping[status] || "unknown";
  }

  private getDeviceSNOMEDCode(deviceType: DeviceType): string {
    const codes: Record<DeviceType, string> = {
      [DeviceType.BLOOD_PRESSURE_MONITOR]: "43770009",
      [DeviceType.PULSE_OXIMETER]: "448703006",
      [DeviceType.GLUCOMETER]: "43252007",
      [DeviceType.WEIGHT_SCALE]: "469204003",
      [DeviceType.THERMOMETER]: "86290005",
      [DeviceType.HEART_RATE_MONITOR]: "706172005",
      [DeviceType.ECG_MONITOR]: "706767009",
      [DeviceType.CONTINUOUS_GLUCOSE_MONITOR]: "720737000",
      [DeviceType.SMART_WATCH]: "706689003",
      [DeviceType.FITNESS_TRACKER]: "706689003",
      [DeviceType.SPIROMETER]: "23426006",
      [DeviceType.PEAK_FLOW_METER]: "264920003",
      [DeviceType.INR_MONITOR]: "702873001",
    };
    return codes[deviceType] || "unknown";
  }

  private async createOfflineAlert(device: MedicalDevice): Promise<void> {
    // Create alert for offline device
    // This would integrate with the alert engine
    console.log(`Creating offline alert for device ${device.id}`);
  }

  private async validateBluetoothConnection(credentials: Record<string, any>): Promise<boolean> {
    // Implement Bluetooth validation
    return true;
  }

  private async validateWifiConnection(credentials: Record<string, any>): Promise<boolean> {
    // Implement WiFi validation
    return true;
  }

  private async validateApiConnection(credentials: Record<string, any>): Promise<boolean> {
    // Implement API validation
    return true;
  }
}

export const deviceManager = new DeviceManager();
