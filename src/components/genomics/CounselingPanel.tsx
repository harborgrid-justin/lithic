/**
 * Counseling Panel Component
 */

"use client";

import React from "react";
import type { GeneticCounselingSession } from "@/types/genomics";

interface CounselingPanelProps {
  session: GeneticCounselingSession;
}

export function CounselingPanel({ session }: CounselingPanelProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{session.sessionType.replace("_", " ")} Counseling</h3>
          <p className="text-sm text-gray-500 mt-1">{new Date(session.sessionDate).toLocaleDateString()} - {session.duration} minutes</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          session.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        }`}>
          {session.status}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Indication</p>
          <p className="text-sm text-gray-600 mt-1">{session.indication}</p>
        </div>

        {session.sessionNotes && (
          <div>
            <p className="text-sm font-medium text-gray-700">Notes</p>
            <p className="text-sm text-gray-600 mt-1">{session.sessionNotes}</p>
          </div>
        )}

        {session.informedConsentObtained && (
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Informed consent obtained
          </div>
        )}
      </div>
    </div>
  );
}

export default CounselingPanel;
