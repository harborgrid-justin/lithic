/**
 * Alert Stream Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

interface AlertStreamProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export function AlertStream({ alerts, onAcknowledge, onDismiss, className = '' }: AlertStreamProps) {
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Alert Stream</h3>
        <Badge variant="secondary">{alerts.length} alerts</Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 rounded-lg ${
                alert.acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white'
              }`}
              style={{ borderLeftColor: `var(--${alert.severity})` }}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {alert.acknowledged && (
                      <Badge variant="outline">Acknowledged</Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{alert.source}</span>
                    <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {!alert.acknowledged && onAcknowledge && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active alerts
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
