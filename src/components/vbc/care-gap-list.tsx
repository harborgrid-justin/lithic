"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, Phone, Mail, Calendar } from "lucide-react";

interface CareGapListProps {
  patientId?: string;
}

export function CareGapList({ patientId }: CareGapListProps) {
  const [selectedGap, setSelectedGap] = useState<string | null>(null);

  // Mock data - would come from API
  const patients = [
    {
      patientId: "P-001",
      patientName: "John Smith",
      age: 68,
      riskScore: 2.1,
      openGaps: 3,
      criticalGaps: 1,
      priorityScore: 245,
      contactability: "easy" as const,
      gaps: [
        {
          gapId: "GAP-001",
          measureName: "Colorectal Cancer Screening",
          category: "preventive-screening" as const,
          priority: "critical" as const,
          dueDate: new Date(2024, 2, 15),
          overdueBy: 90,
          qualityImpact: 75,
          closureComplexity: "moderate" as const,
        },
        {
          gapId: "GAP-002",
          measureName: "Diabetes HbA1c Testing",
          category: "chronic-disease-management" as const,
          priority: "high" as const,
          dueDate: new Date(2024, 4, 1),
          overdueBy: 45,
          qualityImpact: 50,
          closureComplexity: "easy" as const,
        },
        {
          gapId: "GAP-003",
          measureName: "Blood Pressure Control",
          category: "chronic-disease-management" as const,
          priority: "medium" as const,
          dueDate: new Date(2024, 5, 15),
          overdueBy: 0,
          qualityImpact: 25,
          closureComplexity: "moderate" as const,
        },
      ],
    },
    {
      patientId: "P-002",
      patientName: "Mary Johnson",
      age: 72,
      riskScore: 1.8,
      openGaps: 2,
      criticalGaps: 0,
      priorityScore: 180,
      contactability: "moderate" as const,
      gaps: [
        {
          gapId: "GAP-004",
          measureName: "Breast Cancer Screening",
          category: "preventive-screening" as const,
          priority: "high" as const,
          dueDate: new Date(2024, 3, 20),
          overdueBy: 60,
          qualityImpact: 60,
          closureComplexity: "easy" as const,
        },
        {
          gapId: "GAP-005",
          measureName: "Statin Therapy for CVD",
          category: "medication-adherence" as const,
          priority: "high" as const,
          dueDate: new Date(2024, 4, 5),
          overdueBy: 40,
          qualityImpact: 55,
          closureComplexity: "moderate" as const,
        },
      ],
    },
    {
      patientId: "P-003",
      patientName: "Robert Williams",
      age: 65,
      riskScore: 1.5,
      openGaps: 4,
      criticalGaps: 2,
      priorityScore: 320,
      contactability: "difficult" as const,
      gaps: [
        {
          gapId: "GAP-006",
          measureName: "Depression Screening",
          category: "behavioral-health" as const,
          priority: "critical" as const,
          dueDate: new Date(2024, 1, 1),
          overdueBy: 135,
          qualityImpact: 80,
          closureComplexity: "difficult" as const,
        },
      ],
    },
  ];

  const priorityColors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4" />,
    high: <Clock className="w-4 h-4" />,
    medium: <Clock className="w-4 h-4" />,
    low: <Clock className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-gray-500 mt-1">With open care gaps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.reduce((sum, p) => sum + p.openGaps, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Open care gaps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Critical Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {patients.reduce((sum, p) => sum + p.criticalGaps, 0)}
            </div>
            <p className="text-xs text-red-600 mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Closure Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">52%</div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>High-Priority Patients</CardTitle>
          <CardDescription>
            Sorted by priority score - patients most likely to benefit from outreach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map((patient, idx) => (
                <div
                  key={patient.patientId}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedGap === patient.patientId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {patient.patientName}
                        </h3>
                        <div className="flex gap-3 mt-1 text-sm text-gray-600">
                          <span>Age: {patient.age}</span>
                          <span>Risk Score: {patient.riskScore.toFixed(1)}</span>
                          <span>
                            Contactability:{" "}
                            <span
                              className={
                                patient.contactability === "easy"
                                  ? "text-green-600"
                                  : patient.contactability === "moderate"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {patient.contactability}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>

                  {/* Care Gaps */}
                  <div className="space-y-2 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <span>{patient.openGaps} Open Care Gaps:</span>
                      {patient.criticalGaps > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {patient.criticalGaps} Critical
                        </Badge>
                      )}
                    </div>

                    {patient.gaps.map((gap) => (
                      <div
                        key={gap.gapId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[gap.priority]}`}
                      >
                        <div className="flex items-center gap-3">
                          {priorityIcons[gap.priority]}
                          <div>
                            <div className="font-medium">{gap.measureName}</div>
                            <div className="text-xs mt-1">
                              {gap.overdueBy > 0 ? (
                                <span className="text-red-700">
                                  Overdue by {gap.overdueBy} days
                                </span>
                              ) : (
                                <span>Due soon</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs">
                            <div className="font-medium">Impact: {gap.qualityImpact} pts</div>
                            <div className="text-gray-600 capitalize">
                              {gap.closureComplexity} to close
                            </div>
                          </div>
                          <Button size="sm" variant="default">
                            Close Gap
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
