"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface RiskScoreCardProps {
  patient: {
    id: string;
    name: string;
    mrn: string;
    riskScore: number;
    level: string;
    primaryCondition?: string;
  };
}

export function RiskScoreCard({ patient }: RiskScoreCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-700 text-white";
      case "VERY_HIGH":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-orange-600 text-white";
      case "MEDIUM":
        return "bg-yellow-600 text-white";
      default:
        return "bg-green-600 text-white";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-red-700";
    if (score >= 60) return "text-red-600";
    if (score >= 40) return "text-orange-600";
    if (score >= 20) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                <p className="text-sm text-gray-500">{patient.mrn}</p>
              </div>
              <Badge className={getRiskColor(patient.level)}>
                {patient.level.replace(/_/g, " ")}
              </Badge>
            </div>
            {patient.primaryCondition && (
              <p className="text-sm text-gray-600 mt-1">
                Primary:{" "}
                <span className="font-medium">{patient.primaryCondition}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${getScoreColor(patient.riskScore)}`}
              >
                {patient.riskScore}
              </div>
              <div className="text-xs text-gray-500 mt-1">Risk Score</div>
            </div>
            <Button size="sm">View Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
