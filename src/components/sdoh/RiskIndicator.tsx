"use client";

/**
 * Risk Level Indicator Component
 *
 * Visual indicator for SDOH risk levels with color coding
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/types/sdoh";

interface RiskIndicatorProps {
  riskLevel: RiskLevel;
  riskScore?: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; label: string; bgColor: string }
> = {
  NONE: {
    color: "text-green-700",
    label: "No Risk",
    bgColor: "bg-green-100",
  },
  LOW: {
    color: "text-lime-700",
    label: "Low Risk",
    bgColor: "bg-lime-100",
  },
  MODERATE: {
    color: "text-amber-700",
    label: "Moderate Risk",
    bgColor: "bg-amber-100",
  },
  HIGH: {
    color: "text-orange-700",
    label: "High Risk",
    bgColor: "bg-orange-100",
  },
  CRITICAL: {
    color: "text-red-700",
    label: "Critical Risk",
    bgColor: "bg-red-100",
  },
};

export function RiskIndicator({
  riskLevel,
  riskScore,
  showScore = false,
  size = "md",
  className = "",
}: RiskIndicatorProps) {
  const config = RISK_CONFIG[riskLevel];

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge
        className={`${config.bgColor} ${config.color} ${sizeClasses[size]} font-semibold border-0`}
      >
        {config.label}
      </Badge>
      {showScore && riskScore !== undefined && (
        <span className="text-sm text-muted-foreground">
          Score: {riskScore}
        </span>
      )}
    </div>
  );
}
