/**
 * Patient Device List Component
 * Displays and manages patient's medical devices
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Battery, Bluetooth, Wifi, AlertCircle, Plus } from "lucide-react";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import type { DeviceStatus } from "@/types/rpm";

interface PatientDeviceListProps {
  patientId: string;
}

const statusColors: Record<DeviceStatus, string> = {
  ACTIVE: "bg-green-500",
  OFFLINE: "bg-gray-500",
  LOW_BATTERY: "bg-yellow-500",
  NEEDS_CALIBRATION: "bg-orange-500",
  ERROR: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
  DEACTIVATED: "bg-gray-400",
};

export default function PatientDeviceList({ patientId }: PatientDeviceListProps) {
  const { devices, isLoading, deactivateDevice } = useDeviceStatus(patientId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Medical Devices</CardTitle>
            <CardDescription>Enrolled devices for remote monitoring</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : devices && devices.length > 0 ? (
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{device.manufacturer} {device.model}</h4>
                    <Badge className={statusColors[device.status]}>{device.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Serial: {device.serialNumber}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {device.connectionType === "BLUETOOTH" && <Bluetooth className="h-3 w-3" />}
                    {device.connectionType === "WIFI" && <Wifi className="h-3 w-3" />}
                    {device.batteryLevel && (
                      <span className="flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        {device.batteryLevel}%
                      </span>
                    )}
                    {device.lastConnection && (
                      <span>Last: {new Date(device.lastConnection).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deactivateDevice(device.id)}
                >
                  Deactivate
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No devices enrolled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
