"use client";

import ModalityStatus from "@/components/imaging/ModalityStatus";

export default function ModalitiesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Modality Status</h1>
        <p className="text-gray-600 mt-1">
          Monitor imaging equipment and connectivity
        </p>
      </div>

      <ModalityStatus />
    </div>
  );
}
