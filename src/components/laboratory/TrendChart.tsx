'use client';

import React, { useEffect, useState } from 'react';
import { LabResult } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TrendChartProps {
  patientId: string;
  loincCode: string;
  testName: string;
  referenceRange?: { low?: number; high?: number };
}

export default function TrendChart({ patientId, loincCode, testName, referenceRange }: TrendChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, fetch historical results
    const mockData = [
      { date: new Date('2025-12-01'), value: 7.2 },
      { date: new Date('2025-12-08'), value: 7.5 },
      { date: new Date('2025-12-15'), value: 6.8 },
      { date: new Date('2025-12-22'), value: 7.1 },
      { date: new Date('2025-12-29'), value: 7.3 },
    ].map(item => ({
      date: formatDate(item.date),
      value: item.value,
      timestamp: item.date.getTime(),
    }));

    setData(mockData);
  }, [patientId, loincCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trend Analysis: {testName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            No historical data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {referenceRange?.low && (
                <ReferenceLine 
                  y={referenceRange.low} 
                  stroke="orange" 
                  strokeDasharray="3 3"
                  label={{ value: 'Low', position: 'insideBottomRight' }}
                />
              )}
              
              {referenceRange?.high && (
                <ReferenceLine 
                  y={referenceRange.high} 
                  stroke="orange" 
                  strokeDasharray="3 3"
                  label={{ value: 'High', position: 'insideTopRight' }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {data.length > 1 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Latest</div>
              <div className="font-semibold text-lg">
                {data[data.length - 1].value}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Average</div>
              <div className="font-semibold text-lg">
                {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Change</div>
              <div className="font-semibold text-lg">
                {data.length > 1 && (
                  <span className={
                    data[data.length - 1].value > data[0].value
                      ? 'text-red-600'
                      : 'text-green-600'
                  }>
                    {((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
