"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PopulationSDOHInsight } from "@/types/sdoh";

interface PopulationInsightsProps {
  insights: PopulationSDOHInsight[];
}

export function PopulationInsights({ insights }: PopulationInsightsProps) {
  const severityColors = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Population Health Insights</h2>
      {insights.map((insight) => (
        <Card key={insight.id} className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{insight.title}</h3>
                <Badge className={severityColors[insight.severity]}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{insight.description}</p>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Affected Population: </span>
                  {insight.affectedPopulation.size} patients
                </div>
                <div className="text-sm">
                  <span className="font-medium">Trend: </span>
                  <Badge variant="outline">{insight.trend}</Badge>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {insight.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
