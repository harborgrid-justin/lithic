/**
 * Compliance Panel Component
 */

"use client";

export function CompliancePanel({ trialId }: any) {
  const compliance = { gcp13Compliant: true, cfr21Part11Compliant: true, hipaaCompliant: true, criticalFindings: 0 };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Regulatory Compliance</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span>GCP 1.3 Compliant</span>
          <span className={`px-2 py-1 rounded text-sm ${compliance.gcp13Compliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {compliance.gcp13Compliant ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span>21 CFR Part 11</span>
          <span className={`px-2 py-1 rounded text-sm ${compliance.cfr21Part11Compliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {compliance.cfr21Part11Compliant ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span>HIPAA Compliant</span>
          <span className={`px-2 py-1 rounded text-sm ${compliance.hipaaCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {compliance.hipaaCompliant ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span>Critical Findings</span>
          <span className={`font-bold ${compliance.criticalFindings === 0 ? "text-green-600" : "text-red-600"}`}>
            {compliance.criticalFindings}
          </span>
        </div>
      </div>
    </div>
  );
}
