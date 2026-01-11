/**
 * Device Card Component
 * Individual device status card
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Battery, Signal } from "lucide-react";
import type { MedicalDevice } from "@/types/rpm";

interface DeviceCardProps {
  device: MedicalDevice;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{device.manufacturer} {device.model}</h3>
            <p className="text-sm text-muted-foreground">{device.deviceType}</p>
          </div>
          <Badge>{device.status}</Badge>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {device.batteryLevel && (
            <span className="flex items-center gap-1">
              <Battery className="h-3 w-3" />
              {device.batteryLevel}%
            </span>
          )}
          <span className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            {device.connectionType}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
