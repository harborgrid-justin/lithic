"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SDOHIntervention } from "@/types/sdoh";

interface InterventionPanelProps {
  interventions: SDOHIntervention[];
}

export function InterventionPanel({ interventions }: InterventionPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Interventions</h3>
      {interventions.map((intervention) => (
        <Card key={intervention.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold">{intervention.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {intervention.description}
              </p>
              <div className="flex gap-2 mt-3">
                <Badge>{intervention.type}</Badge>
                <Badge variant="outline">{intervention.status}</Badge>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
