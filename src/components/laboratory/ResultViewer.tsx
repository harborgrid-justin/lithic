'use client';

import React, { useEffect, useState } from 'react';
import { LabResult } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import LaboratoryService from '@/services/laboratory.service';

interface ResultViewerProps {
  orderId?: string;
  patientId?: string;
}

export default function ResultViewer({ orderId, patientId }: ResultViewerProps) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [orderId, patientId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await LaboratoryService.getResults({ orderId, patientId });
      setResults(data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PRELIMINARY: 'warning',
      FINAL: 'success',
      CORRECTED: 'default',
      CANCELLED: 'destructive',
      AMENDED: 'default',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getFlagBadge = (flag: string, isCritical: boolean) => {
    if (isCritical) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          CRITICAL
        </Badge>
      );
    }

    const variants: Record<string, any> = {
      NORMAL: 'outline',
      LOW: 'warning',
      HIGH: 'warning',
      CRITICAL_LOW: 'destructive',
      CRITICAL_HIGH: 'destructive',
      ABNORMAL: 'warning',
    };

    const icons: Record<string, any> = {
      LOW: <TrendingDown className="h-3 w-3" />,
      HIGH: <TrendingUp className="h-3 w-3" />,
      CRITICAL_LOW: <TrendingDown className="h-3 w-3" />,
      CRITICAL_HIGH: <TrendingUp className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[flag] || 'outline'} className="gap-1">
        {icons[flag]}
        {flag}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading results...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Laboratory Results ({results.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Name</TableHead>
              <TableHead>LOINC</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performed</TableHead>
              <TableHead>Verified By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No results available
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow 
                  key={result.id}
                  className={result.isCritical ? 'bg-destructive/5' : ''}
                >
                  <TableCell className="font-medium">{result.testName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {result.loincCode}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {result.value}
                  </TableCell>
                  <TableCell>{result.unit}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {result.referenceRange || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {getFlagBadge(result.flag, result.isCritical)}
                  </TableCell>
                  <TableCell>{getStatusBadge(result.status)}</TableCell>
                  <TableCell className="text-sm">
                    {result.performedAt ? formatDateTime(result.performedAt) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {result.verifiedBy || 'Pending'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {results.length > 0 && results.some(r => r.comments) && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold">Comments:</h4>
            {results
              .filter(r => r.comments)
              .map((result) => (
                <div key={result.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                  <span className="font-medium">{result.testName}:</span> {result.comments}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
