/**
 * Risk Assessment Component - Display genetic risk assessments
 */

"use client";

import React from "react";
import type { GeneticRiskAssessment } from "@/types/genomics";

interface RiskAssessmentProps {
  assessment: GeneticRiskAssessment;
}

export function RiskAssessment({ assessment }: RiskAssessmentProps) {
  const getRiskColor = (category: string) => {
    const colors = {
      VERY_HIGH: "bg-red-100 text-red-800 border-red-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      AVERAGE: "bg-green-100 text-green-800 border-green-200",
      LOW: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[category as keyof typeof colors] || colors.AVERAGE;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{assessment.condition}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(assessment.riskCategory)}`}>
          {assessment.riskCategory.replace("_", " ")} RISK
        </span>
      </div>

      {assessment.lifetimeRisk && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Lifetime Risk</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {(assessment.lifetimeRisk * 100).toFixed(1)}%
          </p>
          {assessment.relativeRisk && (
            <p className="text-sm text-gray-600 mt-1">
              {assessment.relativeRisk.toFixed(1)}x population average
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Interpretation</p>
          <p className="text-sm text-gray-600 mt-1">{assessment.interpretation}</p>
        </div>

        {assessment.screeningGuidelines && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Screening Guidelines</p>
            <p className="text-sm text-blue-700 mt-1">{assessment.screeningGuidelines}</p>
          </div>
        )}

        {assessment.recommendations && (
          <div>
            <p className="text-sm font-medium text-gray-700">Recommendations</p>
            <pre className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{assessment.recommendations}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskAssessment;
