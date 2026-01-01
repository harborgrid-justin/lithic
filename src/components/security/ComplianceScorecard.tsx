/**
 * Compliance Scorecard Component
 * Display compliance metrics across frameworks
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

interface ComplianceScore {
  framework: string;
  score: number;
  status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
  criticalFindings: number;
}

export function ComplianceScorecard() {
  const scores: ComplianceScore[] = [
    {
      framework: "HIPAA Security Rule",
      score: 95,
      status: "COMPLIANT",
      criticalFindings: 0,
    },
    {
      framework: "SOC 2 Type II",
      score: 88,
      status: "PARTIALLY_COMPLIANT",
      criticalFindings: 2,
    },
    {
      framework: "HITRUST CSF",
      score: 92,
      status: "COMPLIANT",
      criticalFindings: 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Scorecard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scores.map((item) => (
          <div key={item.framework} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.framework}</span>
              <div className="flex items-center gap-2">
                {item.status === "COMPLIANT" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <Badge
                  variant={
                    item.status === "COMPLIANT" ? "default" : "secondary"
                  }
                >
                  {item.score}%
                </Badge>
              </div>
            </div>
            <Progress value={item.score} />
            {item.criticalFindings > 0 && (
              <p className="text-xs text-muted-foreground">
                {item.criticalFindings} critical findings
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
