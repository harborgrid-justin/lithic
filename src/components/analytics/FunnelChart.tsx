"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps {
  title?: string;
  stages: FunnelStage[];
  showPercentages?: boolean;
  showConversionRates?: boolean;
  className?: string;
}

export function FunnelChart({
  title,
  stages,
  showPercentages = true,
  showConversionRates = true,
  className,
}: FunnelChartProps) {
  const maxValue = stages.length > 0 ? stages[0].value : 1;
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);

  const defaultColors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-red-500",
  ];

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {stages.map((stage, index) => {
          const percentage = (stage.value / maxValue) * 100;
          const conversionRate =
            index > 0 ? ((stage.value / stages[index - 1].value) * 100).toFixed(1) : 100;
          const color = stage.color || defaultColors[index % defaultColors.length];

          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stage.name}</span>
                  {showConversionRates && index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({conversionRate}% conversion)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {stage.value.toLocaleString()}
                  </span>
                  {showPercentages && (
                    <span className="text-xs text-muted-foreground">
                      ({((stage.value / totalValue) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="relative h-12 flex items-center justify-center">
                <div
                  className={cn(
                    "relative h-full rounded-lg transition-all duration-300",
                    color
                  )}
                  style={{
                    width: `${percentage}%`,
                    clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="flex items-center justify-center my-1">
                  <div className="h-4 w-0.5 bg-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
