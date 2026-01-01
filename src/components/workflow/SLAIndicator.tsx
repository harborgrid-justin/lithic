/**
 * SLA Indicator - SLA Status Display Component
 */

"use client";

import React from "react";
import { SLAStatus, SLAConfig } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SLAIndicatorProps {
  status: SLAStatus;
  sla: SLAConfig | null;
  assignedAt: Date;
  completedAt?: Date | null;
  compact?: boolean;
}

export function SLAIndicator({
  status,
  sla,
  assignedAt,
  completedAt,
  compact = false,
}: SLAIndicatorProps) {
  if (!sla) {
    return null;
  }

  const elapsed = completedAt
    ? Math.floor((new Date(completedAt).getTime() - new Date(assignedAt).getTime()) / 60000)
    : Math.floor((Date.now() - new Date(assignedAt).getTime()) / 60000);

  const remaining = sla.resolutionTime - elapsed;
  const percentageUsed = (elapsed / sla.resolutionTime) * 100;

  const statusConfig = {
    [SLAStatus.MET]: {
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle,
      label: "SLA Met",
    },
    [SLAStatus.AT_RISK]: {
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: AlertTriangle,
      label: "At Risk",
    },
    [SLAStatus.BREACHED]: {
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      icon: XCircle,
      label: "SLA Breached",
    },
    [SLAStatus.NOT_APPLICABLE]: {
      color: "bg-gray-500",
      textColor: "text-gray-700",
      bgColor: "bg-gray-50",
      icon: Clock,
      label: "N/A",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`p-3 rounded-lg ${config.bgColor} border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.textColor}`} />
          <span className={`font-medium text-sm ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <span className="text-sm font-medium">
          {elapsed} / {sla.resolutionTime} min
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div
          className={`${config.color} h-2 transition-all`}
          style={{
            width: `${Math.min(percentageUsed, 100)}%`,
          }}
        />
      </div>

      {status !== SLAStatus.BREACHED && status !== SLAStatus.NOT_APPLICABLE && (
        <div className="mt-2 text-xs text-gray-600">
          {remaining > 0 ? `${remaining} minutes remaining` : "Time exceeded"}
        </div>
      )}

      {sla.escalationLevels && sla.escalationLevels.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          Next escalation in {sla.escalationLevels[0].triggerAfter - elapsed} min
        </div>
      )}
    </div>
  );
}
