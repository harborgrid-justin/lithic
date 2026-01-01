"use client";

import RadiologyWorklist from "@/components/imaging/RadiologyWorklist";

export default function WorklistPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Radiology Worklist</h1>
        <p className="text-gray-600 mt-1">
          Manage scheduled imaging procedures
        </p>
      </div>

      <RadiologyWorklist />
    </div>
  );
}
