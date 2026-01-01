"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CaseStatus {
  caseId: string;
  patient: string;
  procedure: string;
  surgeon: string;
  status: string;
  startTime: string;
  progress: number;
}

interface ORBoardProps {
  cases: CaseStatus[];
}

export function ORBoard({ cases }: ORBoardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      IN_ROOM: "bg-yellow-100 text-yellow-800",
      PROCEDURE_START: "bg-green-100 text-green-800",
      RECOVERY: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((c) => (
        <Card key={c.caseId} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{c.patient}</h3>
              <p className="text-sm text-gray-600">{c.surgeon}</p>
            </div>
            <Badge className={getStatusColor(c.status)}>
              {c.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm mb-2">{c.procedure}</p>
          <p className="text-xs text-gray-500">Start: {c.startTime}</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${c.progress}%` }}
            />
          </div>
          <p className="text-xs text-right mt-1 text-gray-600">{c.progress}% Complete</p>
        </Card>
      ))}
    </div>
  );
}
