/**
 * RPM Billing Panel Component
 * Displays billing codes and reimbursement tracking
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

interface RPMBillingPanelProps {
  patientId: string;
}

export default function RPMBillingPanel({ patientId }: RPMBillingPanelProps) {
  const { data: billingSummary, isLoading } = useQuery({
    queryKey: ["rpm", "billing", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/rpm/billing?patientId=${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch billing data");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading billing data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingSummary?.period?.periodStart
                ? new Date(billingSummary.period.periodStart).toLocaleDateString()
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {billingSummary?.period?.daysWithReadings || 0} days with readings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingSummary?.period?.totalMinutes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Interactive communication time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Reimbursement</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${billingSummary?.estimatedReimbursement?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {billingSummary?.codes?.filter((c: any) => c.isBillable).length || 0} billable codes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CPT Codes</CardTitle>
          <CardDescription>Billing codes for current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billingSummary?.codes?.map((code: any, index: number) => (
              <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                {code.isBillable ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{code.code}</span>
                    <Badge variant={code.isBillable ? "default" : "secondary"}>
                      {code.isBillable ? "Billable" : "Not Billable"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{code.description}</p>
                  {!code.isBillable && code.reason && (
                    <p className="text-xs text-red-500 mt-1">{code.reason}</p>
                  )}
                </div>
                {code.quantity > 0 && (
                  <div className="text-right">
                    <div className="font-semibold">x{code.quantity}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
