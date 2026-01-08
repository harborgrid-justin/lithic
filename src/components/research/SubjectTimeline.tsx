/**
 * Subject Timeline Component
 */

"use client";

import { StudySubject } from "@/types/research";

export function SubjectTimeline({ subject }: { subject: StudySubject }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Visit Timeline</h2>
      <div className="space-y-4">
        {subject.visits.map((visit) => (
          <div key={visit.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
            <div className={`w-3 h-3 rounded-full mt-1 ${visit.status === "COMPLETED" ? "bg-green-500" : "bg-gray-300"}`} />
            <div className="flex-1">
              <p className="font-medium">{visit.visitName}</p>
              <p className="text-sm text-gray-600">Scheduled: {new Date(visit.scheduledDate).toLocaleDateString()}</p>
              {visit.actualDate && <p className="text-sm text-gray-600">Completed: {new Date(visit.actualDate).toLocaleDateString()}</p>}
              <span className={`text-xs px-2 py-1 rounded ${visit.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {visit.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
