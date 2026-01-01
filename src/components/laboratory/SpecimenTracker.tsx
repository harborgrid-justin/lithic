'use client';

import React, { useEffect, useState } from 'react';
import { Specimen, SpecimenStatus } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TestTube, Barcode, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import SpecimenService from '@/services/specimen.service';

interface SpecimenTrackerProps {
  orderId?: string;
  patientId?: string;
  onScan?: () => void;
}

export default function SpecimenTracker({ orderId, patientId, onScan }: SpecimenTrackerProps) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecimens();
  }, [orderId, patientId]);

  const loadSpecimens = async () => {
    try {
      setLoading(true);
      const data = await SpecimenService.getSpecimens({ orderId, patientId });
      setSpecimens(data);
    } catch (error) {
      console.error('Failed to load specimens:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SpecimenStatus) => {
    const variants: Record<SpecimenStatus, any> = {
      COLLECTED: 'default',
      RECEIVED: 'default',
      PROCESSING: 'warning',
      STORED: 'success',
      REJECTED: 'destructive',
      DISPOSED: 'outline',
    };

    const colors: Record<SpecimenStatus, string> = {
      COLLECTED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      STORED: 'bg-purple-100 text-purple-800',
      REJECTED: 'bg-red-100 text-red-800',
      DISPOSED: 'bg-gray-100 text-gray-800',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getAgeDisplay = (specimen: Specimen) => {
    const hours = SpecimenService.getSpecimenAgeInHours(specimen);
    if (hours < 1) return 'Just collected';
    if (hours < 24) return `${hours} hours old`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} old`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading specimens...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Specimen Tracking ({specimens.length})
          </div>
          {onScan && (
            <Button onClick={onScan} size="sm">
              <Barcode className="h-4 w-4 mr-2" />
              Scan Specimen
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Accession #</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Collected By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specimens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No specimens found
                </TableCell>
              </TableRow>
            ) : (
              specimens.map((specimen) => (
                <TableRow 
                  key={specimen.id}
                  className={specimen.status === 'REJECTED' ? 'bg-destructive/5' : ''}
                >
                  <TableCell className="font-medium font-mono">
                    {specimen.accessionNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {specimen.barcode}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{specimen.type}</Badge>
                  </TableCell>
                  <TableCell>{specimen.patientName}</TableCell>
                  <TableCell>{getStatusBadge(specimen.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(specimen.collectedAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {specimen.receivedAt ? formatDateTime(specimen.receivedAt) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getAgeDisplay(specimen)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {specimen.volume} {specimen.volumeUnit}
                  </TableCell>
                  <TableCell className="text-sm">{specimen.collectedBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {specimens.some(s => s.status === 'REJECTED') && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <h4 className="font-semibold text-sm mb-2">Rejected Specimens:</h4>
            {specimens
              .filter(s => s.status === 'REJECTED')
              .map((specimen) => (
                <div key={specimen.id} className="text-sm">
                  {specimen.accessionNumber}: {specimen.rejectionReason}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
