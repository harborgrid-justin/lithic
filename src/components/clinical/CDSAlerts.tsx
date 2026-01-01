"use client";

import { useState } from "react";
import {
  CDSAlert,
  AlertSeverity,
  AlertStatus,
  OverrideReasonCode,
} from "@/types/cds";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  ShieldAlert,
  ExternalLink,
  Clock,
} from "lucide-react";

interface CDSAlertsProps {
  alerts: CDSAlert[];
  onAcknowledge?: (alertId: string, notes?: string) => Promise<void>;
  onOverride?: (
    alertId: string,
    reason: string,
    reasonCode: OverrideReasonCode,
    notes?: string,
  ) => Promise<void>;
  onDismiss?: (alertId: string, reason?: string) => Promise<void>;
  showHistory?: boolean;
}

export function CDSAlerts({
  alerts,
  onAcknowledge,
  onOverride,
  onDismiss,
  showHistory = false,
}: CDSAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<CDSAlert | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideReasonCode, setOverrideReasonCode] =
    useState<OverrideReasonCode>(OverrideReasonCode.CLINICALLY_APPROPRIATE);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const getSeverityIcon = (severity: AlertSeverity) => {
    const iconClass = "h-5 w-5";
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      case AlertSeverity.HIGH:
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case AlertSeverity.MODERATE:
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case AlertSeverity.LOW:
        return <Info className={`${iconClass} text-blue-500`} />;
      case AlertSeverity.INFO:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return "destructive";
      case AlertSeverity.HIGH:
        return "destructive";
      case AlertSeverity.MODERATE:
        return "warning";
      case AlertSeverity.LOW:
        return "secondary";
      case AlertSeverity.INFO:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case AlertStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>;
      case AlertStatus.ACKNOWLEDGED:
        return <Badge variant="secondary">Acknowledged</Badge>;
      case AlertStatus.OVERRIDDEN:
        return <Badge variant="outline">Overridden</Badge>;
      case AlertStatus.DISMISSED:
        return <Badge variant="outline">Dismissed</Badge>;
      case AlertStatus.EXPIRED:
        return <Badge variant="outline">Expired</Badge>;
      case AlertStatus.RESOLVED:
        return <Badge variant="secondary">Resolved</Badge>;
    }
  };

  const handleAcknowledge = async (alert: CDSAlert) => {
    if (!onAcknowledge) return;

    setLoading(true);
    try {
      await onAcknowledge(alert.id);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideClick = (alert: CDSAlert) => {
    setSelectedAlert(alert);
    setOverrideDialogOpen(true);
    setOverrideReason("");
    setOverrideNotes("");
  };

  const handleOverrideSubmit = async () => {
    if (!selectedAlert || !onOverride) return;

    setLoading(true);
    try {
      await onOverride(
        selectedAlert.id,
        overrideReason,
        overrideReasonCode,
        overrideNotes,
      );
      setOverrideDialogOpen(false);
      setSelectedAlert(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alert: CDSAlert) => {
    if (!onDismiss) return;

    setLoading(true);
    try {
      await onDismiss(alert.id);
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts based on showHistory
  const displayAlerts = showHistory
    ? alerts
    : alerts.filter((a) => a.status === AlertStatus.ACTIVE);

  // Group alerts by severity
  const groupedAlerts = {
    critical: displayAlerts.filter(
      (a) => a.severity === AlertSeverity.CRITICAL,
    ),
    high: displayAlerts.filter((a) => a.severity === AlertSeverity.HIGH),
    moderate: displayAlerts.filter(
      (a) => a.severity === AlertSeverity.MODERATE,
    ),
    low: displayAlerts.filter((a) => a.severity === AlertSeverity.LOW),
    info: displayAlerts.filter((a) => a.severity === AlertSeverity.INFO),
  };

  const totalActiveAlerts = displayAlerts.filter(
    (a) => a.status === AlertStatus.ACTIVE,
  ).length;

  if (displayAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Clinical Decision Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-green-600">
              No Active Alerts
            </p>
            <p className="text-sm text-gray-500 mt-1">
              All clinical safety checks passed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Clinical Decision Support
              {totalActiveAlerts > 0 && (
                <Badge variant="danger" className="ml-2">
                  {totalActiveAlerts} Active
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critical Alerts */}
          {groupedAlerts.critical.map((alert) => (
            <Alert key={alert.id} variant="danger" className="border-2">
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <AlertTitle className="text-lg font-bold">
                        {alert.title}
                      </AlertTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.category.replace(/_/g, " ")}
                        </Badge>
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                  </div>

                  <AlertDescription className="text-base">
                    {alert.message}
                  </AlertDescription>

                  {alert.recommendation && (
                    <div className="bg-white/10 p-3 rounded">
                      <p className="font-semibold text-sm mb-1">
                        Recommendation:
                      </p>
                      <p className="text-sm">{alert.recommendation}</p>
                    </div>
                  )}

                  {alert.alternatives && alert.alternatives.length > 0 && (
                    <div className="bg-white/10 p-3 rounded">
                      <p className="font-semibold text-sm mb-1">
                        Alternatives:
                      </p>
                      <ul className="list-disc list-inside text-sm">
                        {alert.alternatives.map((alt, idx) => (
                          <li key={idx}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alert.evidence.references &&
                    alert.evidence.references.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <ExternalLink className="h-3 w-3" />
                        <span>
                          Evidence Level: {alert.evidence.evidenceLevel}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(alert.triggeredAt)}</span>
                  </div>

                  {alert.status === AlertStatus.ACTIVE && (
                    <div className="flex gap-2 pt-2">
                      {onAcknowledge && !alert.requiresOverride && (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(alert)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {onOverride && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOverrideClick(alert)}
                          disabled={loading}
                        >
                          Override
                        </Button>
                      )}
                      {onDismiss && !alert.requiresOverride && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(alert)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      )}
                    </div>
                  )}

                  {alert.status === AlertStatus.OVERRIDDEN &&
                    alert.overrideReason && (
                      <div className="text-xs text-gray-500">
                        Overridden by {alert.overriddenBy}:{" "}
                        {alert.overrideReason}
                      </div>
                    )}
                </div>
              </div>
            </Alert>
          ))}

          {/* High Priority Alerts */}
          {groupedAlerts.high.map((alert) => (
            <Alert key={alert.id} variant="danger">
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <AlertTitle>{alert.title}</AlertTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.category.replace(/_/g, " ")}
                        </Badge>
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                  </div>

                  <AlertDescription>{alert.message}</AlertDescription>

                  {alert.recommendation && (
                    <div className="bg-white/10 p-2 rounded text-sm">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </div>
                  )}

                  {alert.status === AlertStatus.ACTIVE && (
                    <div className="flex gap-2">
                      {onAcknowledge && !alert.requiresOverride && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert)}
                          disabled={loading}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {onOverride && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOverrideClick(alert)}
                          disabled={loading}
                        >
                          Override
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}

          {/* Moderate Priority Alerts */}
          {groupedAlerts.moderate.map((alert) => (
            <Alert key={alert.id}>
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                    <div className="flex gap-1">
                      <Badge
                        variant={getSeverityColor(alert.severity)}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                      {getStatusBadge(alert.status)}
                    </div>
                  </div>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                  {alert.status === AlertStatus.ACTIVE && onAcknowledge && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcknowledge(alert)}
                      disabled={loading}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            </Alert>
          ))}

          {/* Low/Info Alerts - Collapsed */}
          {(groupedAlerts.low.length > 0 || groupedAlerts.info.length > 0) && (
            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer font-medium">
                {groupedAlerts.low.length + groupedAlerts.info.length}{" "}
                Additional Information Alerts
              </summary>
              <div className="mt-4 space-y-2">
                {[...groupedAlerts.low, ...groupedAlerts.info].map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 text-sm border-l-2 border-blue-500 pl-3 py-2"
                  >
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-gray-600">{alert.message}</div>
                    </div>
                    {alert.status === AlertStatus.ACTIVE && onAcknowledge && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAcknowledge(alert)}
                        disabled={loading}
                      >
                        OK
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Clinical Alert</DialogTitle>
            <DialogDescription>
              Please provide a reason for overriding this alert. This action
              will be logged for compliance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Override Reason</Label>
              <Select
                value={overrideReasonCode}
                onValueChange={(value) =>
                  setOverrideReasonCode(value as OverrideReasonCode)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OverrideReasonCode.CLINICALLY_APPROPRIATE}>
                    Clinically Appropriate
                  </SelectItem>
                  <SelectItem
                    value={OverrideReasonCode.PATIENT_SPECIFIC_FACTORS}
                  >
                    Patient-Specific Factors
                  </SelectItem>
                  <SelectItem value={OverrideReasonCode.BENEFIT_OUTWEIGHS_RISK}>
                    Benefit Outweighs Risk
                  </SelectItem>
                  <SelectItem
                    value={OverrideReasonCode.ALTERNATIVE_NOT_AVAILABLE}
                  >
                    Alternative Not Available
                  </SelectItem>
                  <SelectItem value={OverrideReasonCode.PATIENT_PREFERENCE}>
                    Patient Preference
                  </SelectItem>
                  <SelectItem value={OverrideReasonCode.ALERT_NOT_APPLICABLE}>
                    Alert Not Applicable
                  </SelectItem>
                  <SelectItem value={OverrideReasonCode.DUPLICATE_ALERT}>
                    Duplicate Alert
                  </SelectItem>
                  <SelectItem value={OverrideReasonCode.OTHER}>
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="override-notes">
                Additional Notes (Required)
              </Label>
              <Textarea
                id="override-notes"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="Provide detailed justification for overriding this alert..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOverrideDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOverrideSubmit}
              disabled={loading || !overrideNotes.trim()}
            >
              {loading ? "Processing..." : "Confirm Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
