/**
 * Randomization Tool Component
 */

"use client";

import { useState } from "react";

export function RandomizationTool({ subjectId, trialId, studyArms }: any) {
  const [randomizing, setRandomizing] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);

  const handleRandomize = async () => {
    setRandomizing(true);
    try {
      const response = await fetch("/api/research/randomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, trialId }),
      });
      const result = await response.json();
      setAssignment(result);
    } catch (error) {
      console.error("Randomization failed:", error);
    } finally {
      setRandomizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Subject Randomization</h2>
      {!assignment ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Subject has not been randomized yet</p>
          <button onClick={handleRandomize} disabled={randomizing} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {randomizing ? "Randomizing..." : "Randomize Subject"}
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="font-medium">Subject randomized to:</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{assignment.armName}</p>
          <p className="text-sm text-gray-600 mt-4">Assignment Number: {assignment.assignmentNumber}</p>
          <p className="text-sm text-gray-600">Assigned: {new Date(assignment.assignedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
