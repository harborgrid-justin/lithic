"use client";

import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";

interface UtilizationChartProps {
  data: Array<{
    date: string;
    utilization: number;
    target: number;
    primeTime: number;
  }>;
}

export function UtilizationChart({ data }: UtilizationChartProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">OR Utilization Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="utilization" fill="#3b82f6" name="Overall Utilization %" />
          <Bar dataKey="primeTime" fill="#10b981" name="Prime Time Utilization %" />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#ef4444"
            name="Target %"
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data[data.length - 1]?.utilization || 0}%
          </div>
          <div className="text-sm text-gray-600">Current Utilization</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data[data.length - 1]?.primeTime || 0}%
          </div>
          <div className="text-sm text-gray-600">Prime Time Utilization</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {data[0]?.target || 85}%
          </div>
          <div className="text-sm text-gray-600">Target</div>
        </div>
      </div>
    </Card>
  );
}
