/**
 * Vital Signs Chart Component
 * Real-time chart for displaying vital sign trends
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useRPMData } from "@/hooks/useRPMData";
import type { ReadingType, TimePeriod } from "@/types/rpm";

interface VitalSignsChartProps {
  patientId: string;
  readingType: ReadingType;
}

export default function VitalSignsChart({ patientId, readingType }: VitalSignsChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("WEEK");
  const { readings, isLoading } = useRPMData(patientId, readingType);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = readings?.slice(0, 50).reverse().map((reading) => ({
    timestamp: new Date(reading.timestamp).toLocaleDateString(),
    value: reading.value,
    flagged: reading.isFlagged,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{readingType.replace(/_/g, " ")}</CardTitle>
            <CardDescription>Showing last {chartData.length} readings</CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">24 Hours</SelectItem>
              <SelectItem value="WEEK">7 Days</SelectItem>
              <SelectItem value="MONTH">30 Days</SelectItem>
              <SelectItem value="QUARTER">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: "#8884d8", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
