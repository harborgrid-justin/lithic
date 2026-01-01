/**
 * Patient SDOH Needs Summary Component
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface Need {
  category: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  status: "identified" | "in_progress" | "resolved";
  identifiedDate: string;
  actions: string[];
}

interface NeedsSummaryProps {
  needs: Need[];
  onCreateReferral: (need: Need) => void;
  onViewDetails: (need: Need) => void;
}

export function NeedsSummary({
  needs,
  onCreateReferral,
  onViewDetails,
}: NeedsSummaryProps) {
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      moderate: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[severity as keyof typeof colors] || colors.moderate;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Social Needs Summary</h2>
        <Badge variant="outline">{needs.length} Total Needs</Badge>
      </div>

      {needs.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium">No Social Needs Identified</p>
          <p className="text-gray-600 mt-2">
            Patient has no identified SDOH barriers
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {needs.map((need, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(need.status)}
                    <h3 className="font-semibold">{need.category}</h3>
                    <Badge className={getSeverityColor(need.severity)}>
                      {need.severity}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{need.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {need.actions.map((action, i) => (
                      <Badge key={i} variant="secondary">
                        {action}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Identified: {new Date(need.identifiedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => onCreateReferral(need)}
                    disabled={need.status === "resolved"}
                  >
                    Create Referral
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(need)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
