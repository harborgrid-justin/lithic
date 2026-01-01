"use client";

import { useEffect, useState } from "react";
import { VitalSigns } from "@/types/clinical";
import { getVitals } from "@/services/clinical.service";
import { VitalsPanel } from "@/components/clinical/VitalsPanel";
import { VitalsChart } from "@/components/clinical/VitalsChart";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function VitalsPage() {
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<
    "bloodPressure" | "heartRate" | "weight" | "temperature"
  >("bloodPressure");

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    try {
      // In production, pass actual patient ID
      const data = await getVitals("P001");
      setVitals(data);
    } catch (error) {
      console.error("Failed to load vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading vitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vital Signs</h1>
          <p className="text-gray-600 mt-1">
            Track and monitor patient vital signs
          </p>
        </div>

        <VitalsPanel vitals={vitals} />

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="metric">Chart Metric:</Label>
            <Select
              id="metric"
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value as any)}
              className="w-48"
            >
              <option value="bloodPressure">Blood Pressure</option>
              <option value="heartRate">Heart Rate</option>
              <option value="weight">Weight</option>
              <option value="temperature">Temperature</option>
            </Select>
          </div>

          {vitals.length > 1 && (
            <VitalsChart vitals={vitals} metric={chartMetric} />
          )}
        </div>
      </div>
    </div>
  );
}
