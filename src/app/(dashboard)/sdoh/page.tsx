/**
 * SDOH Dashboard Page
 */

import React from "react";
import { SDOHDashboard } from "@/components/sdoh/SDOHDashboard";
import { PopulationInsights } from "@/components/sdoh/PopulationInsights";

export default function SDOHPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Social Determinants of Health
        </h1>
        <p className="text-muted-foreground mt-2">
          Screen, assess, and address social needs that impact health outcomes
        </p>
      </div>

      {/* Dashboard Overview */}
      <SDOHDashboard
        patientId="patient-1"
        activeReferrals={[]}
        onStartScreening={() => {}}
      />

      {/* Population Insights */}
      <PopulationInsights insights={[]} />
    </div>
  );
}
