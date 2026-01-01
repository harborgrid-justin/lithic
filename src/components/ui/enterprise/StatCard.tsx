"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    direction?: "up" | "down" | "neutral";
  };
  description?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "default",
  loading = false,
  className,
  ...props
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    const direction =
      trend.direction ||
      (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral");

    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";

    const direction =
      trend.direction ||
      (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral");

    switch (direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const variantColors = {
    default: "border-border",
    success:
      "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
    warning:
      "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20",
    danger:
      "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
    info: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted rounded mb-2"></div>
          <div className="h-3 w-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(variantColors[variant], className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-2xl font-bold md:text-3xl">{value}</p>

          {(trend || description) && (
            <div className="flex flex-col gap-1 text-xs">
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    getTrendColor(),
                  )}
                >
                  {getTrendIcon()}
                  <span>
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              )}

              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
