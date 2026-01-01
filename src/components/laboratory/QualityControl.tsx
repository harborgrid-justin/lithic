"use client";

import React, { useState } from "react";
import { QualityControl as QCType } from "@/types/laboratory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function QualityControl() {
  const [qcRecords, setQcRecords] = useState<QCType[]>([
    {
      id: "1",
      testId: "WBC",
      testName: "White Blood Cell Count",
      loincCode: "6690-2",
      controlLevel: "NORMAL",
      lotNumber: "LOT2026001",
      expirationDate: new Date("2026-12-31"),
      expectedValue: 7.5,
      expectedRange: { low: 6.5, high: 8.5 },
      measuredValue: 7.3,
      unit: "10^9/L",
      isInRange: true,
      performedBy: "QC Tech 01",
      performedAt: new Date(),
      instrument: "Hematology Analyzer A1",
      createdAt: new Date(),
    },
    {
      id: "2",
      testId: "GLUCOSE",
      testName: "Glucose",
      loincCode: "2345-7",
      controlLevel: "HIGH",
      lotNumber: "LOT2026002",
      expirationDate: new Date("2026-11-30"),
      expectedValue: 250,
      expectedRange: { low: 240, high: 260 },
      measuredValue: 265,
      unit: "mg/dL",
      isInRange: false,
      performedBy: "QC Tech 01",
      performedAt: new Date(),
      instrument: "Chemistry Analyzer C1",
      notes: "Out of range - instrument recalibrated",
      createdAt: new Date(),
    },
  ]);

  const getStatusBadge = (isInRange: boolean) => {
    return isInRange ? (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Pass
      </Badge>
    ) : (
      <Badge variant="danger" className="gap-1">
        <XCircle className="h-3 w-3" />
        Fail
      </Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, any> = {
      LOW: "outline",
      NORMAL: "default",
      HIGH: "outline",
    };

    return <Badge variant={colors[level]}>{level}</Badge>;
  };

  const passRate =
    qcRecords.length > 0
      ? (
          (qcRecords.filter((r) => r.isInRange).length / qcRecords.length) *
          100
        ).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quality Control Records
          </CardTitle>
          <div className="text-sm">
            <span className="text-muted-foreground">Pass Rate:</span>{" "}
            <span className="font-semibold text-lg">{passRate}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test</TableHead>
              <TableHead>Control Level</TableHead>
              <TableHead>Lot Number</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Measured</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performed</TableHead>
              <TableHead>Instrument</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qcRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No QC records available
                </TableCell>
              </TableRow>
            ) : (
              qcRecords.map((qc) => (
                <TableRow
                  key={qc.id}
                  className={!qc.isInRange ? "bg-destructive/5" : ""}
                >
                  <TableCell className="font-medium">{qc.testName}</TableCell>
                  <TableCell>{getLevelBadge(qc.controlLevel)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {qc.lotNumber}
                  </TableCell>
                  <TableCell>
                    {qc.expectedValue} {qc.unit}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {qc.measuredValue} {qc.unit}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {qc.expectedRange.low}-{qc.expectedRange.high}
                  </TableCell>
                  <TableCell>{getStatusBadge(qc.isInRange)}</TableCell>
                  <TableCell className="text-sm">
                    <div>{formatDateTime(qc.performedAt)}</div>
                    <div className="text-xs text-muted-foreground">
                      {qc.performedBy}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{qc.instrument}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {qcRecords.some((qc) => qc.notes) && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">QC Notes:</h4>
            {qcRecords
              .filter((qc) => qc.notes)
              .map((qc) => (
                <div
                  key={qc.id}
                  className="text-sm border-l-2 border-primary pl-3 py-1"
                >
                  <span className="font-medium">
                    {qc.testName} ({qc.controlLevel}):
                  </span>{" "}
                  {qc.notes}
                </div>
              ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-semibold text-sm mb-2">QC Requirements:</h4>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>Run QC at least once per shift before patient testing</li>
            <li>Document all QC results, including out-of-range values</li>
            <li>
              Investigate and resolve any QC failures before reporting patient
              results
            </li>
            <li>Verify control lot numbers and expiration dates</li>
            <li>
              Follow manufacturer&apos;s instructions for control handling
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
