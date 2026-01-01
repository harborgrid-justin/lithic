"use client";

/**
 * Lithic Enterprise v0.3 - AR Aging Chart Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ARAgingChartProps {
  data: {
    current: { count: number; amount: number };
    days30: { count: number; amount: number };
    days60: { count: number; amount: number };
    days90: { count: number; amount: number };
    days120Plus: { count: number; amount: number };
    total: { count: number; amount: number };
  };
}

export function ARAgingChart({ data }: ARAgingChartProps) {
  const buckets = [
    { label: "Current", key: "current", color: "bg-green-500" },
    { label: "31-60 Days", key: "days30", color: "bg-yellow-500" },
    { label: "61-90 Days", key: "days60", color: "bg-orange-500" },
    { label: "91-120 Days", key: "days90", color: "bg-red-500" },
    { label: "120+ Days", key: "days120Plus", color: "bg-red-700" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>A/R Aging Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {buckets.map((bucket) => {
            const bucketData = data[bucket.key as keyof typeof data] as {
              count: number;
              amount: number;
            };
            const percentage =
              data.total.amount > 0
                ? (bucketData.amount / data.total.amount) * 100
                : 0;

            return (
              <div key={bucket.key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{bucket.label}</span>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${bucketData.amount.toLocaleString()}
                    </div>
                    <div className="text-gray-500">{bucketData.count} claims</div>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bucket.color} flex items-center justify-end pr-2 text-white text-xs font-semibold`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 5 && `${percentage.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total A/R:</span>
              <span>${data.total.amount.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-500 text-right">
              {data.total.count} total claims
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
