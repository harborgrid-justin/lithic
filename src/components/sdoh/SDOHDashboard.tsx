"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { RiskIndicator } from "./RiskIndicator";
import type { SDOHScreening, SDOHReferral } from "@/types/sdoh";

interface SDOHDashboardProps {
  patientId: string;
  recentScreening?: SDOHScreening;
  activeReferrals: SDOHReferral[];
  onStartScreening: () => void;
}

export function SDOHDashboard({
  patientId,
  recentScreening,
  activeReferrals,
  onStartScreening,
}: SDOHDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Social Determinants of Health</h2>
        <button
          onClick={onStartScreening}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          New Screening
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Last Screening</div>
          <div className="text-2xl font-bold mt-2">
            {recentScreening
              ? new Date(recentScreening.completedAt!).toLocaleDateString()
              : "Never"}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Risk Level</div>
          <div className="mt-2">
            {recentScreening?.riskLevel ? (
              <RiskIndicator riskLevel={recentScreening.riskLevel} />
            ) : (
              <span className="text-muted-foreground">No data</span>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Active Referrals</div>
          <div className="text-2xl font-bold mt-2">{activeReferrals.length}</div>
        </Card>
      </div>

      {/* Identified Needs */}
      {recentScreening && recentScreening.identifiedNeeds.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Identified Needs</h3>
          <div className="space-y-3">
            {recentScreening.identifiedNeeds.map((need) => (
              <div key={need.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{need.category}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {need.description}
                    </div>
                  </div>
                  <RiskIndicator riskLevel={need.severity} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
