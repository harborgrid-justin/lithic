/**
 * Alert Panel Component
 * Displays and manages RPM alerts
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { RPMAlert, AlertSeverity } from "@/types/rpm";

interface AlertPanelProps {
  patientId: string;
  maxAlerts?: number;
}

const severityColors: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  INFO: "bg-gray-500",
};

export default function AlertPanel({ patientId, maxAlerts }: AlertPanelProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged">("active");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["rpm", "alerts", patientId, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ patientId });
      if (filter !== "all") params.append("status", filter.toUpperCase());

      const response = await fetch(`/api/rpm/alerts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json() as Promise<RPMAlert[]>;
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/rpm/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rpm", "alerts"] });
    },
  });

  const displayAlerts = maxAlerts ? alerts?.slice(0, maxAlerts) : alerts;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Recent RPM alerts and notifications</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : displayAlerts && displayAlerts.length > 0 ? (
          <div className="space-y-4">
            {displayAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-4">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${alert.severity === "CRITICAL" ? "text-red-500" : "text-orange-500"}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </p>
                </div>
                {alert.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No alerts to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
