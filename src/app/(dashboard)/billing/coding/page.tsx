"use client";

import CodingWorksheet from "@/components/billing/CodingWorksheet";
import { Code, FileText } from "lucide-react";

export default function CodingPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Medical Coding Worksheet
        </h1>
        <p className="text-gray-600 mt-2">
          Search and select CPT procedure codes and ICD-10 diagnosis codes
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Code className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                CPT/HCPCS Codes
              </h3>
              <p className="text-sm text-primary-800">
                Current Procedural Terminology (CPT) codes describe medical
                procedures and services provided. Search by code number or
                description to find the appropriate billing code.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                ICD-10 Codes
              </h3>
              <p className="text-sm text-green-800">
                International Classification of Diseases (ICD-10) codes identify
                patient diagnoses and conditions. Select one or more diagnosis
                codes to support medical necessity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coding Worksheet */}
      <CodingWorksheet />
    </div>
  );
}
