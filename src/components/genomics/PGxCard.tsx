/**
 * PGx Card Component - Pharmacogenomic recommendation card
 */

"use client";

import React from "react";
import type { PGxRecommendation } from "@/types/genomics";

interface PGxCardProps {
  recommendation: PGxRecommendation;
}

export function PGxCard({ recommendation }: PGxCardProps) {
  const hasAlerts = recommendation.drugs.some(d => d.recommendation !== "USE_AS_DIRECTED");

  return (
    <div className={`rounded-lg border-2 p-4 ${hasAlerts ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{recommendation.gene}</h3>
          <p className="text-sm text-gray-600">{recommendation.phenotype.description}</p>
          <p className="text-xs text-gray-500 mt-1">Diplotype: {recommendation.diplotype}</p>
        </div>
        {hasAlerts && (
          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
            Action Required
          </span>
        )}
      </div>

      <div className="space-y-2">
        {recommendation.drugs.map((drug, idx) => (
          <div key={idx} className="bg-white rounded p-3">
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm text-gray-900">{drug.drug}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${
                drug.strength === "STRONG" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {drug.strength}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{drug.recommendationText}</p>
            {drug.alternatives.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Alternatives: {drug.alternatives.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PGxCard;
