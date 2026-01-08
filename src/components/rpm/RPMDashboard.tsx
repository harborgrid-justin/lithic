/**
 * RPM Dashboard Component
 * Main dashboard for Remote Patient Monitoring
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Droplet, Scale, Thermometer, Wind } from "lucide-react";
import { useRPMData, useRPMStats, useRPMCompliance } from "@/hooks/useRPMData";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import type { ReadingType } from "@/types/rpm";
import VitalSignsChart from "./VitalSignsChart";
import AlertPanel from "./AlertPanel";
import PatientDeviceList from "./PatientDeviceList";
import TrendGraph from "./TrendGraph";
import RPMBillingPanel from "./RPMBillingPanel";

interface RPMDashboardProps {
  patientId: string;
}

const vitalSigns = [
  { type: "HEART_RATE" as ReadingType, label: "Heart Rate", icon: Heart, color: "text-red-500", unit: "bpm" },
  { type: "SYSTOLIC_BP" as ReadingType, label: "Blood Pressure", icon: Activity, color: "text-blue-500", unit: "mmHg" },
  { type: "OXYGEN_SATURATION" as ReadingType, label: "SpO2", icon: Wind, color: "text-cyan-500", unit: "%" },
  { type: "BLOOD_GLUCOSE" as ReadingType, label: "Glucose", icon: Droplet, color: "text-purple-500", unit: "mg/dL" },
  { type: "WEIGHT" as ReadingType, label: "Weight", icon: Scale, color: "text-green-500", unit: "lb" },
  { type: "TEMPERATURE" as ReadingType, label: "Temperature", icon: Thermometer, color: "text-orange-500", unit: "°F" },
];

export default function RPMDashboard({ patientId }: RPMDashboardProps) {
  const [selectedVital, setSelectedVital] = useState<ReadingType>("HEART_RATE");
  const { latestReadings, isLoading: isLoadingData } = useRPMData(patientId);
  const { data: stats, isLoading: isLoadingStats } = useRPMStats(patientId);
  const { data: compliance, isLoading: isLoadingCompliance } = useRPMCompliance(patientId);
  const { devicesSummary, isLoading: isLoadingDevices } = useDeviceStatus(patientId);

  if (isLoadingData || isLoadingStats || isLoadingCompliance || isLoadingDevices) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading RPM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devicesSummary?.online || 0}/{devicesSummary?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {devicesSummary?.offline || 0} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance?.overallCompliance?.toFixed(0) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {compliance?.consecutiveDaysCompliant || 0} consecutive days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.criticalAlerts || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readings Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.readingsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all devices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vitalSigns.map((vital) => {
              const reading = latestReadings?.[vital.type];
              const Icon = vital.icon;

              return (
                <Card key={vital.type} className="cursor-pointer hover:border-primary" onClick={() => setSelectedVital(vital.type)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{vital.label}</CardTitle>
                    <Icon className={`h-4 w-4 ${vital.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reading ? `${reading.value} ${reading.unit}` : "No data"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reading ? new Date(reading.timestamp).toLocaleString() : "Never recorded"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TrendGraph patientId={patientId} readingType={selectedVital} />
            <AlertPanel patientId={patientId} maxAlerts={5} />
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {vitalSigns.map((vital) => (
              <button
                key={vital.type}
                onClick={() => setSelectedVital(vital.type)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-colors ${
                  selectedVital === vital.type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <vital.icon className="h-4 w-4" />
                {vital.label}
              </button>
            ))}
          </div>

          <VitalSignsChart patientId={patientId} readingType={selectedVital} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <PatientDeviceList patientId={patientId} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <RPMBillingPanel patientId={patientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
