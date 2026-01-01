"use client";

import EligibilityChecker from "@/components/billing/EligibilityChecker";
import { Shield, CheckCircle } from "lucide-react";

export default function InsurancePage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Insurance Verification
        </h1>
        <p className="text-gray-600 mt-2">
          Check insurance eligibility and benefits
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              About Insurance Verification
            </h3>
            <p className="text-sm text-blue-800">
              Use this tool to verify patient insurance eligibility in real-time
              using EDI 270/271 transactions. This helps ensure coverage before
              providing services and reduces claim denials.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verify active coverage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Check deductible and out-of-pocket amounts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                View covered benefits and limitations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Identify prior authorization requirements
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Eligibility Checker */}
      <EligibilityChecker />
    </div>
  );
}
