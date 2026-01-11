/**
 * useDeviceStatus Hook
 * Custom hook for managing medical device status and connections
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
  MedicalDevice,
  DeviceStatus,
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceFilters,
} from "@/types/rpm";

export function useDeviceStatus(patientId?: string, deviceId?: string) {
  const queryClient = useQueryClient();

  // Fetch patient devices
  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useQuery({
    queryKey: ["rpm", "devices", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/devices?patientId=${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch devices");
      return response.json() as Promise<MedicalDevice[]>;
    },
    enabled: !!patientId,
    refetchInterval: 30000, // Refetch every 30 seconds for device status
  });

  // Fetch single device
  const {
    data: device,
    isLoading: isLoadingDevice,
    error: deviceError,
  } = useQuery({
    queryKey: ["rpm", "device", deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/devices/${deviceId}`);
      if (!response.ok) throw new Error("Failed to fetch device");
      return response.json() as Promise<MedicalDevice>;
    },
    enabled: !!deviceId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Register device mutation
  const registerDevice = useMutation({
    mutationFn: async (data: CreateDeviceDto) => {
      const response = await fetch("/api/rpm/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to register device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpm", "devices"] });
    },
  });

  // Update device mutation
  const updateDevice = useMutation({
    mutationFn: async (data: UpdateDeviceDto) => {
      const response = await fetch(`/api/rpm/devices/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update device");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rpm", "device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["rpm", "devices"] });
    },
  });

  // Deactivate device mutation
  const deactivateDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/rpm/devices/${deviceId}/deactivate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to deactivate device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpm", "devices"] });
    },
  });

  // Real-time status updates via WebSocket
  useEffect(() => {
    if (!patientId) return;

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/rpm/devices/${patientId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "device_status_changed") {
        queryClient.invalidateQueries({ queryKey: ["rpm", "devices", patientId] });
        if (data.deviceId) {
          queryClient.invalidateQueries({ queryKey: ["rpm", "device", data.deviceId] });
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [patientId, queryClient]);

  // Get device status summary
  const getDevicesSummary = () => {
    if (!devices) return null;

    return {
      total: devices.length,
      online: devices.filter((d) => d.status === DeviceStatus.ACTIVE).length,
      offline: devices.filter((d) => d.status === DeviceStatus.OFFLINE).length,
      lowBattery: devices.filter((d) => d.status === DeviceStatus.LOW_BATTERY).length,
      needsCalibration: devices.filter((d) => d.status === DeviceStatus.NEEDS_CALIBRATION).length,
    };
  };

  return {
    devices,
    device,
    isLoading: isLoadingDevices || isLoadingDevice,
    error: devicesError || deviceError,
    registerDevice: registerDevice.mutate,
    updateDevice: updateDevice.mutate,
    deactivateDevice: deactivateDevice.mutate,
    isRegistering: registerDevice.isPending,
    isUpdating: updateDevice.isPending,
    isDeactivating: deactivateDevice.isPending,
    devicesSummary: getDevicesSummary(),
  };
}

export function useDeviceFilters(patientId: string, filters: DeviceFilters) {
  return useQuery({
    queryKey: ["rpm", "devices", patientId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ patientId });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });

      const response = await fetch(`/api/rpm/devices?${params}`);
      if (!response.ok) throw new Error("Failed to fetch filtered devices");
      return response.json() as Promise<MedicalDevice[]>;
    },
    enabled: !!patientId,
  });
}
