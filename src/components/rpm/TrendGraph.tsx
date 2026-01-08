/**
 * Trend Graph Component
 * Advanced trend visualization with forecasting
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRPMData } from "@/hooks/useRPMData";
import type { ReadingType } from "@/types/rpm";

interface TrendGraphProps {
  patientId: string;
  readingType: ReadingType;
}

export default function TrendGraph({ patientId, readingType }: TrendGraphProps) {
  const { useAggregatedData } = useRPMData(patientId, readingType);
  const { data: aggregated, isLoading } = useAggregatedData("WEEK");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = aggregated?.readings?.slice(0, 30).reverse().map((reading) => ({
    date: new Date(reading.timestamp).toLocaleDateString(),
    value: reading.value,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>{readingType.replace(/_/g, " ")} - 7 Day Trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
