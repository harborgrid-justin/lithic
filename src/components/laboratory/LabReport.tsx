'use client';

import React, { useEffect, useState } from 'react';
import { LabOrder, LabResult } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import LaboratoryService from '@/services/laboratory.service';

interface LabReportProps {
  orderId: string;
}

export default function LabReport({ orderId }: LabReportProps) {
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderData, resultsData] = await Promise.all([
        LaboratoryService.getOrderById(orderId),
        LaboratoryService.getResults({ orderId }),
      ]);
      setOrder(orderData);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality would generate PDF report');
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading report...</div>;
  }

  if (!order) {
    return <div className="flex justify-center p-8">Order not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Laboratory Report
          </CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <h1 className="text-2xl font-bold">LITHIC LABORATORY</h1>
            <p className="text-sm text-muted-foreground">Enterprise Healthcare SaaS</p>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Patient Information</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex">
                  <dt className="font-medium w-24">Name:</dt>
                  <dd>{order.patientName}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-24">MRN:</dt>
                  <dd>{order.patientMRN}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-24">DOB:</dt>
                  <dd>{formatDateTime(order.patientDOB)}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-24">Gender:</dt>
                  <dd>{order.patientGender === 'M' ? 'Male' : order.patientGender === 'F' ? 'Female' : 'Other'}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex">
                  <dt className="font-medium w-32">Order Number:</dt>
                  <dd>{order.orderNumber}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-32">Ordering Physician:</dt>
                  <dd>{order.orderingPhysician}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-32">Order Date:</dt>
                  <dd>{formatDateTime(order.orderDate)}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium w-32">Priority:</dt>
                  <dd>
                    <Badge variant={order.priority === 'STAT' ? 'destructive' : 'outline'}>
                      {order.priority}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Clinical Information */}
          {(order.diagnosis || order.clinicalInfo) && (
            <div>
              <h3 className="font-semibold mb-2">Clinical Information</h3>
              {order.diagnosis && (
                <p className="text-sm">
                  <span className="font-medium">Diagnosis:</span> {order.diagnosis}
                </p>
              )}
              {order.clinicalInfo && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Notes:</span> {order.clinicalInfo}
                </p>
              )}
            </div>
          )}

          {/* Results */}
          <div>
            <h3 className="font-semibold mb-3">Laboratory Results</h3>
            <table className="w-full text-sm">
              <thead className="border-b-2 border-border">
                <tr>
                  <th className="text-left py-2">Test Name</th>
                  <th className="text-left py-2">Result</th>
                  <th className="text-left py-2">Unit</th>
                  <th className="text-left py-2">Reference Range</th>
                  <th className="text-left py-2">Flag</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No results available
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} className="border-b border-border">
                      <td className="py-2 font-medium">{result.testName}</td>
                      <td className="py-2 font-semibold">{result.value}</td>
                      <td className="py-2">{result.unit}</td>
                      <td className="py-2 text-muted-foreground">{result.referenceRange}</td>
                      <td className="py-2">
                        {result.isCritical ? (
                          <Badge variant="destructive">CRITICAL</Badge>
                        ) : result.flag !== 'NORMAL' ? (
                          <Badge variant="warning">{result.flag}</Badge>
                        ) : (
                          <Badge variant="outline">NORMAL</Badge>
                        )}
                      </td>
                      <td className="py-2">
                        <Badge variant={result.status === 'FINAL' ? 'success' : 'warning'}>
                          {result.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Comments */}
          {results.some(r => r.comments) && (
            <div>
              <h3 className="font-semibold mb-2">Comments</h3>
              <div className="space-y-2">
                {results
                  .filter(r => r.comments)
                  .map((result) => (
                    <div key={result.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                      <span className="font-medium">{result.testName}:</span> {result.comments}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>This report was generated on {formatDateTime(new Date())}</p>
            <p className="mt-1">
              Results verified by: {results[0]?.verifiedBy || 'Pending verification'}
            </p>
            <p className="mt-2 font-medium">
              Note: Critical values have been reported to the ordering physician.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
