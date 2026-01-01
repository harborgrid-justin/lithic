"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Barcode, Search, CheckCircle2, XCircle } from "lucide-react";
import SpecimenService from "@/services/specimen.service";
import { Specimen } from "@/types/laboratory";

interface BarcodeScannerProps {
  onSpecimenFound?: (specimen: Specimen) => void;
}

export default function BarcodeScanner({
  onSpecimenFound,
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!barcode.trim()) {
      setError("Please enter a barcode");
      return;
    }

    setLoading(true);
    setError(null);
    setSpecimen(null);

    try {
      const foundSpecimen = await SpecimenService.getSpecimenByBarcode(barcode);
      setSpecimen(foundSpecimen);
      onSpecimenFound?.(foundSpecimen);
    } catch (err) {
      setError("Specimen not found");
      setSpecimen(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COLLECTED: "bg-blue-100 text-blue-800",
      RECEIVED: "bg-green-100 text-green-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      STORED: "bg-purple-100 text-purple-800",
      REJECTED: "bg-red-100 text-red-800",
      DISPOSED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode className="h-5 w-5" />
          Barcode Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scanner Input */}
        <div className="space-y-3">
          <Label htmlFor="barcode">Scan or Enter Barcode</Label>
          <div className="flex gap-2">
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scan barcode or enter manually"
              className="font-mono"
              autoFocus
            />
            <Button onClick={handleScan} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Specimen Found */}
        {specimen && (
          <div className="space-y-4 p-4 border-2 border-green-500 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Specimen Found</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Accession Number</div>
                <div className="font-mono font-semibold">
                  {specimen.accessionNumber}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Barcode</div>
                <div className="font-mono font-semibold">
                  {specimen.barcode}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Patient</div>
                <div className="font-semibold">{specimen.patientName}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Specimen Type</div>
                <Badge variant="outline">{specimen.type}</Badge>
              </div>

              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge className={getStatusColor(specimen.status)}>
                  {specimen.status}
                </Badge>
              </div>

              <div>
                <div className="text-muted-foreground">Volume</div>
                <div>
                  {specimen.volume} {specimen.volumeUnit}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-muted-foreground">Container</div>
                <div>{specimen.container}</div>
              </div>

              <div className="col-span-2">
                <div className="text-muted-foreground">Collected By</div>
                <div>{specimen.collectedBy}</div>
              </div>

              {specimen.notes && (
                <div className="col-span-2">
                  <div className="text-muted-foreground">Notes</div>
                  <div className="text-sm">{specimen.notes}</div>
                </div>
              )}
            </div>

            {specimen.status === "REJECTED" && specimen.rejectionReason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="text-sm font-semibold text-destructive">
                  Rejection Reason:
                </div>
                <div className="text-sm">{specimen.rejectionReason}</div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-muted rounded-md text-sm">
          <h4 className="font-semibold mb-2">Scanner Instructions:</h4>
          <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
            <li>Place cursor in the barcode field</li>
            <li>Scan the specimen barcode using the scanner</li>
            <li>Or manually enter the barcode and click Search</li>
            <li>Press Enter to search after manual entry</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
