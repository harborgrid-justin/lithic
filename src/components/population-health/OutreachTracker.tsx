"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface OutreachTrackerProps {
  patientId: string;
}

export function OutreachTracker({ patientId }: OutreachTrackerProps) {
  const outreachHistory = [
    {
      id: "1",
      date: "2024-11-20",
      method: "PHONE_CALL",
      purpose: "Care gap closure - Annual wellness visit",
      status: "COMPLETED",
      outcome: "APPOINTMENT_SCHEDULED",
      duration: 8,
      assignedTo: "Sarah Johnson, RN",
    },
    {
      id: "2",
      date: "2024-11-15",
      method: "SMS",
      purpose: "Appointment reminder",
      status: "COMPLETED",
      outcome: "SUCCESSFUL",
      assignedTo: "System",
    },
    {
      id: "3",
      date: "2024-11-10",
      method: "PHONE_CALL",
      purpose: "Medication adherence check",
      status: "NO_ANSWER",
      outcome: "LEFT_MESSAGE",
      duration: 0,
      assignedTo: "Sarah Johnson, RN",
    },
    {
      id: "4",
      date: "2024-11-05",
      method: "EMAIL",
      purpose: "Health education materials",
      status: "COMPLETED",
      outcome: "SUCCESSFUL",
      assignedTo: "Care Team",
    },
  ];

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "PHONE_CALL":
        return <Phone className="w-4 h-4" />;
      case "SMS":
        return <MessageSquare className="w-4 h-4" />;
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "SCHEDULED":
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <XCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Outreach History</CardTitle>
        <Button size="sm">Schedule Outreach</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {outreachHistory.map((outreach) => (
            <div key={outreach.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMethodIcon(outreach.method)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {outreach.method.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(outreach.date).toLocaleDateString()} -{" "}
                      {outreach.assignedTo}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(outreach.status)}
                  <Badge className={getStatusColor(outreach.status)}>
                    {outreach.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Purpose:</span>{" "}
                  {outreach.purpose}
                </div>
                {outreach.outcome && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Outcome:</span>{" "}
                    {outreach.outcome.replace(/_/g, " ")}
                  </div>
                )}
                {outreach.duration !== undefined && outreach.duration > 0 && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Duration:</span>{" "}
                    {outreach.duration} minutes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
