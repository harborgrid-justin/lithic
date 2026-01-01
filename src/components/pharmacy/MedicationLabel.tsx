/**
 * Medication Label Component
 * Display and print medication labels
 */

"use client";

import { useEffect, useState } from "react";
import { prescriptionService } from "@/services/prescription.service";

interface MedicationLabelProps {
  prescriptionId: string;
}

export function MedicationLabel({ prescriptionId }: MedicationLabelProps) {
  const [labelData, setLabelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLabelData();
  }, [prescriptionId]);

  const loadLabelData = async () => {
    try {
      setLoading(true);
      const data =
        await prescriptionService.generateMedicationLabel(prescriptionId);
      setLabelData(data);
    } catch (error) {
      console.error("Failed to generate label:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Generating label...</div>
    );
  }

  if (!labelData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to generate label
      </div>
    );
  }

  const { labelData: label } = labelData;

  return (
    <div className="space-y-4">
      {/* Label Preview */}
      <div
        className="border-2 border-gray-800 p-6 bg-white"
        style={{ width: "4in", minHeight: "3in" }}
      >
        {/* Pharmacy Info */}
        <div className="border-b-2 border-gray-800 pb-2 mb-3">
          <div className="font-bold text-lg">{label.pharmacyInfo.name}</div>
          <div className="text-xs">{label.pharmacyInfo.address}</div>
          <div className="text-xs">Phone: {label.pharmacyInfo.phone}</div>
          <div className="text-xs">NPI: {label.pharmacyInfo.npi}</div>
        </div>

        {/* Rx Number and Date */}
        <div className="mb-3 flex justify-between">
          <div>
            <div className="text-sm font-semibold">Rx #: {label.rxNumber}</div>
            <div className="text-xs">
              Filled: {new Date(label.dispensedDate).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs">Refills: {label.refillsRemaining}</div>
            <div className="text-xs">
              Exp: {new Date(label.expirationDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="mb-3">
          <div className="font-bold">{label.patientName}</div>
        </div>

        {/* Medication */}
        <div className="mb-3">
          <div className="font-bold text-base">{label.medicationName}</div>
          <div className="text-sm">{label.strength}</div>
          <div className="text-xs text-gray-600">Qty: {label.quantity}</div>
        </div>

        {/* Directions */}
        <div className="border-t border-gray-400 pt-2 mb-3">
          <div className="text-xs font-semibold mb-1">DIRECTIONS:</div>
          <div className="text-sm">{label.sig}</div>
        </div>

        {/* Prescriber */}
        <div className="text-xs mb-3">
          <strong>Prescriber:</strong> {label.prescriberName}
        </div>

        {/* Warnings */}
        {label.warnings && label.warnings.length > 0 && (
          <div className="border-t border-gray-400 pt-2 mt-3">
            <div className="text-xs font-bold mb-1">WARNINGS:</div>
            {label.warnings.map((warning: string, index: number) => (
              <div key={index} className="text-xs mb-1">
                • {warning}
              </div>
            ))}
          </div>
        )}

        {/* Barcode */}
        <div className="mt-3 text-center">
          <div className="text-xs font-mono">{labelData.barcodeData}</div>
        </div>

        {/* NDC and Lot */}
        <div className="mt-2 text-xs text-gray-600">
          <div>NDC: {label.ndc}</div>
          <div>Lot: {label.lotNumber}</div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-end gap-2 no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Label
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
