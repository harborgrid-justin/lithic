"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export interface SparklineChartProps {
  data: Array<{ value: number; label?: string }>;
  color?: string;
  height?: number;
  showTooltip?: boolean;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function SparklineChart({
  data,
  color = "#3b82f6",
  height = 40,
  showTooltip = true,
  trend,
  className,
}: SparklineChartProps) {
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : color;

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">
                          {payload[0].value}
                        </span>
                        {payload[0].payload.label && (
                          <span className="text-xs text-muted-foreground">
                            {payload[0].payload.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
