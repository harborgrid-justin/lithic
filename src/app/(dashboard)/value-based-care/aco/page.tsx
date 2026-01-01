"use client";

import { ACODashboard } from "@/components/vbc/aco-dashboard";

export default function ACOManagementPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ACO Management</h1>
        <p className="text-gray-500 mt-1">
          Monitor ACO performance, attribution, and shared savings calculations
        </p>
      </div>

      <ACODashboard acoId="ACO-123" performanceYear={2024} />
    </div>
  );
}
