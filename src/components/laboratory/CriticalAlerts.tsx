'use client';

import React, { useState } from 'react';
import { CriticalAlert } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Bell, Check } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function CriticalAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([
    {
      id: '1',
      resultId: 'R001',
      orderId: '1',
      patientId: 'PT001',
      patientName: 'John Doe',
      patientMRN: 'MRN001234',
      testName: 'Potassium',
      loincCode: '2823-3',
      criticalValue: 6.8,
      unit: 'mmol/L',
      referenceRange: '3.5-5.1 mmol/L',
      severity: 'CRITICAL_HIGH',
      status: 'NEW',
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, status: 'ACKNOWLEDGED' as any, acknowledgedBy: 'Current User', acknowledgedAt: new Date() }
        : alert
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      NEW: 'destructive',
      ACKNOWLEDGED: 'warning',
      NOTIFIED: 'default',
      RESOLVED: 'success',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {severity === 'CRITICAL_HIGH' ? 'CRIT HIGH' : 'CRIT LOW'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-destructive" />
          Critical Alerts ({alerts.filter(a => a.status === 'NEW').length} New)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>MRN</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Critical Value</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No critical alerts
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow 
                  key={alert.id}
                  className={alert.status === 'NEW' ? 'bg-destructive/5' : ''}
                >
                  <TableCell className="font-medium">{alert.patientName}</TableCell>
                  <TableCell>{alert.patientMRN}</TableCell>
                  <TableCell>{alert.testName}</TableCell>
                  <TableCell className="font-bold text-destructive text-lg">
                    {alert.criticalValue} {alert.unit}
                  </TableCell>
                  <TableCell className="text-sm">{alert.referenceRange}</TableCell>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell>{getStatusBadge(alert.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(alert.detectedAt)}
                  </TableCell>
                  <TableCell>
                    {alert.status === 'NEW' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <span className="text-sm text-muted-foreground">
                        By {alert.acknowledgedBy}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {alerts.length > 0 && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Alert Protocol
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>Immediately notify ordering physician</li>
              <li>Document notification in patient record</li>
              <li>Confirm receipt of critical result</li>
              <li>Consider repeat testing if necessary</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
