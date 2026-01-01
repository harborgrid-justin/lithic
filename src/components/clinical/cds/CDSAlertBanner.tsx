/**
 * CDS Alert Banner Component
 * Real-time display of clinical decision support alerts
 *
 * Features:
 * - Severity-based color coding
 * - Expandable alert details
 * - Action buttons (acknowledge, override, dismiss)
 * - Evidence display
 * - Alternative suggestions
 */

'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, XCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CDSAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
  category: string;
  title: string;
  message: string;
  recommendation?: string;
  alternatives?: string[];
  evidence?: {
    evidenceLevel?: string;
    references?: string[];
  };
  requiresOverride?: boolean;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED' | 'OVERRIDDEN';
}

interface CDSAlertBannerProps {
  alert: CDSAlert;
  onAcknowledge?: (alertId: string) => void;
  onOverride?: (alertId: string, reason: string) => void;
  onDismiss?: (alertId: string) => void;
  showActions?: boolean;
}

export function CDSAlertBanner({
  alert,
  onAcknowledge,
  onOverride,
  onDismiss,
  showActions = true,
}: CDSAlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: <XCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-500',
          textColor: 'text-red-900 dark:text-red-100',
          badgeColor: 'bg-red-500 text-white',
        };
      case 'HIGH':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-900 dark:text-orange-100',
          badgeColor: 'bg-orange-500 text-white',
        };
      case 'MODERATE':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          badgeColor: 'bg-yellow-500 text-white',
        };
      case 'LOW':
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-900 dark:text-blue-100',
          badgeColor: 'bg-blue-500 text-white',
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-900 dark:text-gray-100',
          badgeColor: 'bg-gray-500 text-white',
        };
    }
  };

  const config = getSeverityConfig(alert.severity);

  const handleOverrideSubmit = () => {
    if (overrideReason.trim() && onOverride) {
      onOverride(alert.id, overrideReason);
      setShowOverrideDialog(false);
      setOverrideReason('');
    }
  };

  if (alert.status === 'DISMISSED' || alert.status === 'ACKNOWLEDGED') {
    return null;
  }

  return (
    <Card className={`border-l-4 ${config.borderColor} ${config.bgColor} mb-3`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={config.textColor}>{config.icon}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={config.badgeColor}>{alert.severity}</Badge>
                <Badge variant="outline">{alert.category}</Badge>
                {alert.requiresOverride && (
                  <Badge variant="danger">Requires Override</Badge>
                )}
              </div>
              <CardTitle className={`text-lg ${config.textColor}`}>
                {alert.title}
              </CardTitle>
              <p className={`mt-2 text-sm ${config.textColor}`}>{alert.message}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showActions && (
              <>
                {onAcknowledge && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className={`pt-0 ${config.textColor}`}>
          {alert.recommendation && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Recommendation:</h4>
              <p className="text-sm">{alert.recommendation}</p>
            </div>
          )}

          {alert.alternatives && alert.alternatives.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Alternatives:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {alert.alternatives.map((alt, idx) => (
                  <li key={idx}>{alt}</li>
                ))}
              </ul>
            </div>
          )}

          {alert.evidence && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Evidence:</h4>
              {alert.evidence.evidenceLevel && (
                <p className="text-sm mb-1">
                  <span className="font-medium">Level:</span> {alert.evidence.evidenceLevel}
                </p>
              )}
              {alert.evidence.references && alert.evidence.references.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">References:</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {alert.evidence.references.map((ref, idx) => (
                      <li key={idx}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {alert.requiresOverride && onOverride && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {!showOverrideDialog ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowOverrideDialog(true)}
                >
                  Override Alert
                </Button>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Override Reason (Required):
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                    rows={3}
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Provide clinical justification for overriding this alert..."
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleOverrideSubmit}
                      disabled={!overrideReason.trim()}
                    >
                      Submit Override
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowOverrideDialog(false);
                        setOverrideReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Alert List Component
 */
interface CDSAlertListProps {
  alerts: CDSAlert[];
  onAcknowledge?: (alertId: string) => void;
  onOverride?: (alertId: string, reason: string) => void;
  onDismiss?: (alertId: string) => void;
}

export function CDSAlertList({
  alerts,
  onAcknowledge,
  onOverride,
  onDismiss,
}: CDSAlertListProps) {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  if (activeAlerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
        <p>No active clinical alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeAlerts.map(alert => (
        <CDSAlertBanner
          key={alert.id}
          alert={alert}
          onAcknowledge={onAcknowledge}
          onOverride={onOverride}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
