/**
 * Bluetooth Medical Devices Integration
 * Handles communication with Bluetooth LE medical devices
 */

import type {
  MedicalDevice,
  DeviceType,
  CreateReadingDto,
  ReadingType,
  ReadingSource,
} from "@/types/rpm";
import { vitalSignsCollector } from "../vital-signs-collector";
import { deviceManager } from "../device-manager";

interface BluetoothDeviceProfile {
  serviceUUID: string;
  characteristicUUID: string;
  deviceType: DeviceType;
  parseData: (data: ArrayBuffer) => ParsedReading[];
}

interface ParsedReading {
  type: ReadingType;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export class BluetoothDeviceManager {
  private deviceProfiles: Map<DeviceType, BluetoothDeviceProfile> = new Map();
  private connectedDevices: Map<string, any> = new Map();

  constructor() {
    this.initializeDeviceProfiles();
  }

  /**
   * Scan for nearby Bluetooth medical devices
   */
  async scanForDevices(): Promise<Array<{ id: string; name: string; type: DeviceType }>> {
    // Check if Web Bluetooth API is available
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth API is not available");
    }

    const devices: Array<{ id: string; name: string; type: DeviceType }> = [];

    // Scan for each device type
    for (const [deviceType, profile] of this.deviceProfiles.entries()) {
      try {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [profile.serviceUUID] }],
          optionalServices: [profile.characteristicUUID],
        });

        if (device.id && device.name) {
          devices.push({
            id: device.id,
            name: device.name,
            type: deviceType,
          });
        }
      } catch (error) {
        console.log(`No ${deviceType} devices found`);
      }
    }

    return devices;
  }

  /**
   * Connect to a Bluetooth device
   */
  async connectDevice(
    deviceId: string,
    device: MedicalDevice,
    patientId: string,
    organizationId: string
  ): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth API is not available");
    }

    const profile = this.deviceProfiles.get(device.deviceType);
    if (!profile) {
      throw new Error(`Unsupported device type: ${device.deviceType}`);
    }

    try {
      // Request device
      const btDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [profile.serviceUUID] }],
        optionalServices: [profile.characteristicUUID],
      });

      // Connect to GATT server
      const server = await btDevice.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Get service and characteristic
      const service = await server.getPrimaryService(profile.serviceUUID);
      const characteristic = await service.getCharacteristic(profile.characteristicUUID);

      // Set up notifications
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", async (event: any) => {
        await this.handleDataReceived(
          device.id,
          device.deviceType,
          event.target.value,
          patientId,
          organizationId
        );
      });

      // Store connection
      this.connectedDevices.set(deviceId, {
        device: btDevice,
        server,
        service,
        characteristic,
      });

      // Update device status
      await deviceManager.recordConnection(device.id, {});

      console.log(`Connected to Bluetooth device: ${device.deviceType}`);
    } catch (error) {
      console.error(`Error connecting to Bluetooth device:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a Bluetooth device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const connection = this.connectedDevices.get(deviceId);
    if (!connection) {
      return;
    }

    try {
      if (connection.characteristic) {
        await connection.characteristic.stopNotifications();
      }

      if (connection.server) {
        connection.server.disconnect();
      }

      this.connectedDevices.delete(deviceId);
      console.log(`Disconnected from device: ${deviceId}`);
    } catch (error) {
      console.error(`Error disconnecting from device:`, error);
    }
  }

  /**
   * Read data from device manually
   */
  async readData(
    deviceId: string,
    device: MedicalDevice,
    patientId: string,
    organizationId: string
  ): Promise<void> {
    const connection = this.connectedDevices.get(deviceId);
    if (!connection) {
      throw new Error("Device not connected");
    }

    try {
      const value = await connection.characteristic.readValue();
      await this.handleDataReceived(device.id, device.deviceType, value, patientId, organizationId);
    } catch (error) {
      console.error(`Error reading from device:`, error);
      throw error;
    }
  }

  /**
   * Check if device is connected
   */
  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Initialize device profiles for different device types
   */
  private initializeDeviceProfiles(): void {
    // Blood Pressure Monitor - Bluetooth SIG standard
    this.deviceProfiles.set(DeviceType.BLOOD_PRESSURE_MONITOR, {
      serviceUUID: "00001810-0000-1000-8000-00805f9b34fb", // Blood Pressure Service
      characteristicUUID: "00002a35-0000-1000-8000-00805f9b34fb", // Blood Pressure Measurement
      deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
      parseData: this.parseBloodPressureData.bind(this),
    });

    // Pulse Oximeter
    this.deviceProfiles.set(DeviceType.PULSE_OXIMETER, {
      serviceUUID: "00001822-0000-1000-8000-00805f9b34fb", // Pulse Oximeter Service
      characteristicUUID: "00002a5f-0000-1000-8000-00805f9b34fb", // PLX Continuous Measurement
      deviceType: DeviceType.PULSE_OXIMETER,
      parseData: this.parsePulseOximeterData.bind(this),
    });

    // Glucometer
    this.deviceProfiles.set(DeviceType.GLUCOMETER, {
      serviceUUID: "00001808-0000-1000-8000-00805f9b34fb", // Glucose Service
      characteristicUUID: "00002a18-0000-1000-8000-00805f9b34fb", // Glucose Measurement
      deviceType: DeviceType.GLUCOMETER,
      parseData: this.parseGlucoseData.bind(this),
    });

    // Weight Scale
    this.deviceProfiles.set(DeviceType.WEIGHT_SCALE, {
      serviceUUID: "0000181d-0000-1000-8000-00805f9b34fb", // Weight Scale Service
      characteristicUUID: "00002a9d-0000-1000-8000-00805f9b34fb", // Weight Measurement
      deviceType: DeviceType.WEIGHT_SCALE,
      parseData: this.parseWeightData.bind(this),
    });

    // Thermometer
    this.deviceProfiles.set(DeviceType.THERMOMETER, {
      serviceUUID: "00001809-0000-1000-8000-00805f9b34fb", // Health Thermometer Service
      characteristicUUID: "00002a1c-0000-1000-8000-00805f9b34fb", // Temperature Measurement
      deviceType: DeviceType.THERMOMETER,
      parseData: this.parseTemperatureData.bind(this),
    });

    // Heart Rate Monitor
    this.deviceProfiles.set(DeviceType.HEART_RATE_MONITOR, {
      serviceUUID: "0000180d-0000-1000-8000-00805f9b34fb", // Heart Rate Service
      characteristicUUID: "00002a37-0000-1000-8000-00805f9b34fb", // Heart Rate Measurement
      deviceType: DeviceType.HEART_RATE_MONITOR,
      parseData: this.parseHeartRateData.bind(this),
    });
  }

  /**
   * Handle data received from device
   */
  private async handleDataReceived(
    deviceId: string,
    deviceType: DeviceType,
    dataValue: DataView,
    patientId: string,
    organizationId: string
  ): Promise<void> {
    const profile = this.deviceProfiles.get(deviceType);
    if (!profile) {
      console.error(`No profile for device type: ${deviceType}`);
      return;
    }

    try {
      const readings = profile.parseData(dataValue.buffer);

      for (const reading of readings) {
        const dto: CreateReadingDto = {
          patientId,
          deviceId,
          readingType: reading.type,
          value: reading.value,
          unit: reading.unit,
          source: ReadingSource.DEVICE,
          metadata: {
            deviceType,
            ...reading.metadata,
          },
        };

        await vitalSignsCollector.collectReading(dto, "system", organizationId);
      }

      // Update device connection status
      await deviceManager.recordConnection(deviceId, {});
    } catch (error) {
      console.error(`Error processing device data:`, error);
    }
  }

  /**
   * Parse blood pressure data (IEEE 11073 format)
   */
  private parseBloodPressureData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    const systolic = view.getUint16(1, true); // Little endian
    const diastolic = view.getUint16(3, true);
    const map = view.getUint16(5, true); // Mean Arterial Pressure

    const readings: ParsedReading[] = [
      {
        type: ReadingType.SYSTOLIC_BP,
        value: systolic,
        unit: "mmHg",
        metadata: { map },
      },
      {
        type: ReadingType.DIASTOLIC_BP,
        value: diastolic,
        unit: "mmHg",
        metadata: { map },
      },
    ];

    // Check if heart rate is included
    if (flags & 0x04) {
      const heartRate = view.getUint16(7, true);
      readings.push({
        type: ReadingType.HEART_RATE,
        value: heartRate,
        unit: "bpm",
      });
    }

    return readings;
  }

  /**
   * Parse pulse oximeter data
   */
  private parsePulseOximeterData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    const spO2 = view.getUint16(1, true);
    const pulseRate = view.getUint16(3, true);

    return [
      {
        type: ReadingType.OXYGEN_SATURATION,
        value: spO2,
        unit: "%",
        metadata: { pulseRate },
      },
      {
        type: ReadingType.HEART_RATE,
        value: pulseRate,
        unit: "bpm",
      },
    ];
  }

  /**
   * Parse glucose data
   */
  private parseGlucoseData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    // Glucose concentration in mg/dL
    const glucose = view.getUint16(3, true);

    return [
      {
        type: ReadingType.BLOOD_GLUCOSE,
        value: glucose,
        unit: "mg/dL",
      },
    ];
  }

  /**
   * Parse weight data
   */
  private parseWeightData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    // Weight in kilograms
    const weight = view.getUint16(1, true) / 100; // Convert to kg

    return [
      {
        type: ReadingType.WEIGHT,
        value: weight,
        unit: "kg",
      },
    ];
  }

  /**
   * Parse temperature data
   */
  private parseTemperatureData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    // Temperature in Celsius
    const tempValue = view.getInt32(1, true);
    const temperature = tempValue / 10; // Convert to actual temperature

    const unit = flags & 0x01 ? "F" : "C";

    return [
      {
        type: ReadingType.TEMPERATURE,
        value: temperature,
        unit,
      },
    ];
  }

  /**
   * Parse heart rate data
   */
  private parseHeartRateData(data: ArrayBuffer): ParsedReading[] {
    const view = new DataView(data);
    const flags = view.getUint8(0);

    // Heart rate format (1 byte or 2 bytes)
    const heartRate = flags & 0x01 ? view.getUint16(1, true) : view.getUint8(1);

    return [
      {
        type: ReadingType.HEART_RATE,
        value: heartRate,
        unit: "bpm",
      },
    ];
  }
}

export const bluetoothDeviceManager = new BluetoothDeviceManager();
