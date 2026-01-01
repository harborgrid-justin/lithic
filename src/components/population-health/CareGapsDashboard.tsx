"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Mail } from "lucide-react";

interface CareGapsDashboardProps {
  filter: string;
  searchQuery: string;
}

export function CareGapsDashboard({
  filter,
  searchQuery,
}: CareGapsDashboardProps) {
  const gaps = [
    {
      id: "1",
      patient: "John Smith",
      mrn: "MRN-001234",
      gapType: "PREVENTIVE_SCREENING",
      title: "Annual Wellness Visit Due",
      priority: "MEDIUM",
      dueDate: "2024-12-01",
      status: "IDENTIFIED",
      category: "PREVENTIVE",
    },
    {
      id: "2",
      patient: "Mary Johnson",
      mrn: "MRN-002345",
      gapType: "CHRONIC_CARE_MONITORING",
      title: "HbA1c Test Due",
      priority: "HIGH",
      dueDate: "2024-11-25",
      status: "OUTREACH_SCHEDULED",
      category: "CHRONIC_DISEASE",
    },
    {
      id: "3",
      patient: "Robert Williams",
      mrn: "MRN-003456",
      gapType: "IMMUNIZATION",
      title: "Flu Vaccine Due",
      priority: "MEDIUM",
      dueDate: "2024-12-15",
      status: "IDENTIFIED",
      category: "PREVENTIVE",
    },
    {
      id: "4",
      patient: "Patricia Brown",
      mrn: "MRN-004567",
      gapType: "SPECIALIST_REFERRAL",
      title: "Diabetic Eye Exam Due",
      priority: "HIGH",
      dueDate: "2024-11-30",
      status: "IN_PROGRESS",
      category: "CHRONIC_DISEASE",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLOSED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "IN_PROGRESS":
      case "OUTREACH_SCHEDULED":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {gaps.map((gap) => (
        <Card key={gap.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(gap.status)}
                  <h3 className="font-semibold text-gray-900">{gap.title}</h3>
                  <Badge className={getPriorityColor(gap.priority)}>
                    {gap.priority}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                  <div>
                    <span className="text-gray-500">Patient:</span>
                    <div className="font-medium text-gray-900">
                      {gap.patient}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">MRN:</span>
                    <div className="font-medium text-gray-900">{gap.mrn}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(gap.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium text-gray-900">
                      {gap.status.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Outreach
                </Button>
                <Button size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
