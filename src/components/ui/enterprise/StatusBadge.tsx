"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

export type StatusVariant =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "critical"
  | "urgent"
  | "routine";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusVariant | string;
  icon?: LucideIcon;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  icon: Icon,
  pulse = false,
  size = "md",
  className,
  ...props
}: StatusBadgeProps) {
  const statusConfigs: Record<
    StatusVariant,
    {
      label: string;
      className: string;
      dotColor: string;
    }
  > = {
    active: {
      label: "Active",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      dotColor: "bg-green-500",
    },
    inactive: {
      label: "Inactive",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
      dotColor: "bg-gray-500",
    },
    pending: {
      label: "Pending",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      dotColor: "bg-yellow-500",
    },
    success: {
      label: "Success",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      dotColor: "bg-green-500",
    },
    warning: {
      label: "Warning",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      dotColor: "bg-orange-500",
    },
    error: {
      label: "Error",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      dotColor: "bg-red-500",
    },
    info: {
      label: "Info",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      dotColor: "bg-blue-500",
    },
    scheduled: {
      label: "Scheduled",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      dotColor: "bg-blue-500",
    },
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      dotColor: "bg-green-500",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      dotColor: "bg-red-500",
    },
    critical: {
      label: "Critical",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      dotColor: "bg-red-500",
    },
    urgent: {
      label: "Urgent",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      dotColor: "bg-orange-500",
    },
    routine: {
      label: "Routine",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      dotColor: "bg-blue-500",
    },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  const config = statusConfigs[status as StatusVariant] || {
    label: status,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
    dotColor: "bg-gray-500",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <span className="relative flex">
        <span className={cn("rounded-full", config.dotColor, dotSizes[size])} />
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.dotColor,
            )}
          />
        )}
      </span>
      {Icon && (
        <Icon
          className={cn(
            "shrink-0",
            size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
          )}
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
