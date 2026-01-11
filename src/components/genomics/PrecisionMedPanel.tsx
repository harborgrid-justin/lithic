/**
 * Precision Medicine Panel Component
 */

"use client";

import React from "react";
import type { PrecisionMedicineProfile } from "@/types/genomics";

interface PrecisionMedPanelProps {
  profile: PrecisionMedicineProfile;
}

export function PrecisionMedPanel({ profile }: PrecisionMedPanelProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Precision Medicine Profile</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Actionable Variants</p>
          <p className="text-2xl font-bold text-blue-600">{profile.genomicData.actionableVariants}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">PGx Alerts</p>
          <p className="text-2xl font-bold text-purple-600">{profile.pgxProfile.activeAlerts}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Clinical Trials</p>
          <p className="text-2xl font-bold text-green-600">{profile.clinicalTrials.length}</p>
        </div>
      </div>

      {profile.targetedTherapies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Targeted Therapies</h3>
          <div className="space-y-2">
            {profile.targetedTherapies.slice(0, 3).map((therapy, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{therapy.drug}</p>
                    <p className="text-sm text-gray-600">{therapy.indication}</p>
                  </div>
                  {therapy.fdaApproved && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">FDA Approved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.activeRecommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Active Recommendations</h3>
          <div className="space-y-2">
            {profile.activeRecommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="border-l-4 border-blue-500 bg-blue-50 p-3">
                <p className="font-medium text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PrecisionMedPanel;
