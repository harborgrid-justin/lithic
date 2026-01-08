/**
 * Enrollment Wizard Component
 */

"use client";

import { useState } from "react";

export function EnrollmentWizard({ patientId, trialId }: any) {
  const [step, setStep] = useState(1);
  const steps = ["Screening", "Consent", "Enrollment", "Randomization"];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 text-center ${i + 1 <= step ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${i + 1 <= step ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                {i + 1}
              </div>
              <p className="text-xs">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-64">
        {step === 1 && <div><h3 className="text-lg font-medium mb-4">Screening</h3><p>Verify patient eligibility...</p></div>}
        {step === 2 && <div><h3 className="text-lg font-medium mb-4">Informed Consent</h3><p>Obtain patient consent...</p></div>}
        {step === 3 && <div><h3 className="text-lg font-medium mb-4">Enrollment</h3><p>Enroll patient in study...</p></div>}
        {step === 4 && <div><h3 className="text-lg font-medium mb-4">Randomization</h3><p>Assign to study arm...</p></div>}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
          Previous
        </button>
        <button onClick={() => setStep(Math.min(4, step + 1))} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {step === 4 ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
}
