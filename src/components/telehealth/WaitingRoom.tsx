"use client";

import { WaitingRoomEntry, WaitingRoomStatus } from "@/types/telehealth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
} from "lucide-react";

interface WaitingRoomProps {
  entries: WaitingRoomEntry[];
  onAdmitPatient: (entryId: string) => void;
  loading?: boolean;
}

export function WaitingRoom({
  entries,
  onAdmitPatient,
  loading,
}: WaitingRoomProps) {
  const getStatusBadge = (status: WaitingRoomStatus) => {
    const config = {
      WAITING: { variant: "secondary" as const, icon: Clock, text: "Waiting" },
      READY: { variant: "default" as const, icon: CheckCircle, text: "Ready" },
      PROVIDER_NOTIFIED: {
        variant: "default" as const,
        icon: AlertCircle,
        text: "Notified",
      },
      ADMITTED: { variant: "default" as const, icon: Video, text: "Admitted" },
      CANCELLED: {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Cancelled",
      },
    };

    const { variant, icon: Icon, text } = config[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading waiting room...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No patients waiting</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <Card key={entry.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-blue-600">
                  {entry.position}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{entry.patientName}</h3>
                  {getStatusBadge(entry.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Appointment Time</p>
                    <p>{formatTime(entry.appointmentTime)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Checked In</p>
                    <p>{formatTime(entry.checkedInAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Estimated Wait</p>
                    <p>{entry.estimatedWaitTime} minutes</p>
                  </div>
                  <div>
                    <p className="font-medium">Position</p>
                    <p>#{entry.position} in queue</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  {entry.preVisitCompleted && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Pre-visit Complete
                    </Badge>
                  )}
                  {entry.technicalCheckCompleted && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Tech Check Passed
                    </Badge>
                  )}
                </div>

                {entry.preVisitData && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm mb-1">Chief Complaint</p>
                    <p className="text-sm text-gray-700">
                      {entry.preVisitData.chiefComplaint}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {entry.status === WaitingRoomStatus.WAITING && (
                <Button
                  onClick={() => onAdmitPatient(entry.id)}
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Admit to Call
                </Button>
              )}
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
