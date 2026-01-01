"use client";

import { CareGapList } from "@/components/vbc/care-gap-list";

export default function CareGapsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Care Gap Management</h1>
        <p className="text-gray-500 mt-1">
          Identify and close quality measure care gaps with targeted patient outreach
        </p>
      </div>

      <CareGapList />
    </div>
  );
}
