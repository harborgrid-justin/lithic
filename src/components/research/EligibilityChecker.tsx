/**
 * Eligibility Checker Component
 * Lithic Healthcare Platform v0.5
 */

"use client";

import { useState } from "react";
import { useResearchData } from "@/hooks/useResearchData";
import { EligibilityAssessment } from "@/types/research";

interface EligibilityCheckerProps {
  patientId: string;
  trialId: string;
}

export function EligibilityChecker({ patientId, trialId }: EligibilityCheckerProps) {
  const { assessEligibility, loading } = useResearchData();
  const [assessment, setAssessment] = useState<EligibilityAssessment | null>(null);

  const handleAssess = async () => {
    try {
      const result = await assessEligibility(patientId, trialId);
      setAssessment(result);
    } catch (error) {
      console.error("Failed to assess eligibility:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Eligibility Assessment</h2>

      {!assessment ? (
        <button
          onClick={handleAssess}
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Assessing..." : "Check Eligibility"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${assessment.overallEligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <h3 className={`font-semibold ${assessment.overallEligible ? "text-green-800" : "text-red-800"}`}>
              {assessment.overallEligible ? "Eligible" : "Not Eligible"}
            </h3>
            <p className="text-sm mt-1">Eligibility Score: {assessment.score.toFixed(1)}%</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Criteria Results</h4>
            <div className="space-y-2">
              {assessment.results.map((result, i) => (
                <div key={i} className="flex items-center space-x-2 text-sm">
                  <span className={`w-4 h-4 rounded-full ${result.met ? "bg-green-500" : "bg-red-500"}`} />
                  <span className={result.met ? "text-green-700" : "text-red-700"}>
                    Criterion {result.criterionId}: {result.met ? "Met" : "Not Met"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">{assessment.notes}</p>
            <p className="text-sm font-medium mt-2">
              Recommended Action: {assessment.recommendedAction}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
