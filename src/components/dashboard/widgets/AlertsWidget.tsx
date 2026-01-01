"use client";

/**
 * AlertsWidget - Critical Alerts and Notifications
 * Displays high-priority clinical and system alerts
 */

import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  category: "clinical" | "system" | "billing" | "security";
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  dismissed?: boolean;
}

interface AlertsWidgetProps {
  className?: string;
  maxItems?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAlerts: Alert[] = [
  {
    id: "a1",
    type: "critical",
    title: "Critical Lab Result",
    message: "Patient John Doe - Potassium level critically high (6.2 mEq/L)",
    timestamp: new Date(Date.now() - 5 * 60000),
    category: "clinical",
    actionable: true,
    actionUrl: "/clinical/results/lab-12345",
    actionLabel: "View Result",
  },
  {
    id: "a2",
    type: "warning",
    title: "Drug Interaction Alert",
    message: "Potential interaction between Warfarin and new prescription",
    timestamp: new Date(Date.now() - 15 * 60000),
    category: "clinical",
    actionable: true,
    actionUrl: "/pharmacy/interactions",
    actionLabel: "Review",
  },
  {
    id: "a3",
    type: "warning",
    title: "Patient Overdue for Follow-up",
    message: "Sarah Johnson - Annual physical exam overdue by 30 days",
    timestamp: new Date(Date.now() - 45 * 60000),
    category: "clinical",
    actionable: true,
    actionUrl: "/patients/patient-456",
    actionLabel: "Schedule",
  },
  {
    id: "a4",
    type: "info",
    title: "System Maintenance Scheduled",
    message: "EHR system will be unavailable tonight 11 PM - 2 AM for updates",
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    category: "system",
    actionable: false,
  },
  {
    id: "a5",
    type: "warning",
    title: "Claim Denial",
    message: "Claim #789012 denied - Missing prior authorization",
    timestamp: new Date(Date.now() - 3 * 60 * 60000),
    category: "billing",
    actionable: true,
    actionUrl: "/billing/claims/789012",
    actionLabel: "Review Claim",
  },
];

// ============================================================================
// Component
// ============================================================================

export function AlertsWidget({ className, maxItems = 5 }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const dismissAlert = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert,
      ),
    );
  };

  const getAlertIcon = (type: Alert["type"]) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "critical":
        return <AlertTriangle className={iconClass} />;
      case "warning":
        return <AlertCircle className={iconClass} />;
      case "success":
        return <CheckCircle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "warning":
        return "border-l-orange-500 bg-orange-50";
      case "success":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const getIconColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "success":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  const getCategoryBadgeColor = (category: Alert["category"]) => {
    switch (category) {
      case "clinical":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "system":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "billing":
        return "bg-green-100 text-green-700 border-green-200";
      case "security":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);
  const displayAlerts = activeAlerts.slice(0, maxItems);
  const criticalCount = activeAlerts.filter(
    (a) => a.type === "critical",
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            {activeAlerts.length} Active Alert
            {activeAlerts.length !== 1 ? "s" : ""}
          </h3>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          View All
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "relative p-3 rounded-lg border-l-4 transition-all",
              getAlertColor(alert.type),
            )}
          >
            {/* Dismiss Button */}
            <button
              onClick={() => dismissAlert(alert.id)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-white/50 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div
                className={cn("mt-0.5 flex-shrink-0", getIconColor(alert.type))}
              >
                {getAlertIcon(alert.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {alert.title}
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getCategoryBadgeColor(alert.category),
                    )}
                  >
                    {alert.category}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(alert.timestamp)}
                  </div>

                  {alert.actionable && alert.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-medium"
                      asChild
                    >
                      <a
                        href={alert.actionUrl}
                        className="flex items-center gap-1"
                      >
                        {alert.actionLabel || "View Details"}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayAlerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No active alerts</p>
          <p className="text-xs text-gray-500 mt-1">
            All systems operating normally
          </p>
        </div>
      )}
    </div>
  );
}
