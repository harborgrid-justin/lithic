"use client";

import { MIPSScorecard } from "@/components/vbc/mips-scorecard";

export default function MIPSReportingPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MIPS Reporting Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Track quality, cost, improvement activities, and promoting interoperability
        </p>
      </div>

      <MIPSScorecard npi="1234567890" performanceYear={2024} />
    </div>
  );
}
