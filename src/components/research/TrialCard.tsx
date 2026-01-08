/**
 * Trial Summary Card Component
 * Lithic Healthcare Platform v0.5
 */

"use client";

import { ClinicalTrial } from "@/types/research";
import Link from "next/link";

interface TrialCardProps {
  trial: ClinicalTrial;
}

export function TrialCard({ trial }: TrialCardProps) {
  const enrollmentPercent =
    (trial.enrollment.currentEnrollment / trial.enrollment.targetEnrollment) *
    100;

  const statusColors = {
    RECRUITING: "bg-green-100 text-green-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-yellow-100 text-yellow-800",
    TERMINATED: "bg-red-100 text-red-800",
  };

  return (
    <Link href={`/research/trials/${trial.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {trial.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{trial.trialId}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[trial.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
          >
            {trial.status}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phase:</span>
            <span className="font-medium text-gray-900">{trial.phase}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sponsor:</span>
            <span className="font-medium text-gray-900">{trial.sponsorName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sites:</span>
            <span className="font-medium text-gray-900">
              {trial.locations.length}
            </span>
          </div>
        </div>

        {/* Enrollment Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Enrollment</span>
            <span className="font-medium text-gray-900">
              {trial.enrollment.currentEnrollment} / {trial.enrollment.targetEnrollment}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min(enrollmentPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-xs text-gray-500">
            Updated {new Date(trial.updatedAt).toLocaleDateString()}
          </span>
          <span className="text-blue-600 text-sm font-medium">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
