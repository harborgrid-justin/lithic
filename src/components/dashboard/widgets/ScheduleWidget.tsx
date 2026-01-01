"use client";

/**
 * ScheduleWidget - Today's Schedule and Appointments
 * Displays upcoming appointments and events for the current day
 */

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  type: "in-person" | "telehealth" | "procedure";
  reason: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  location?: string;
  status:
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "in-progress"
    | "completed"
    | "cancelled";
}

interface ScheduleWidgetProps {
  className?: string;
  maxItems?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const now = new Date();
const createTime = (hours: number, minutes: number = 0) => {
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
};

const mockAppointments: Appointment[] = [
  {
    id: "apt1",
    patientName: "John Smith",
    patientId: "P-1247",
    type: "in-person",
    reason: "Annual Physical Exam",
    startTime: createTime(9, 0),
    endTime: createTime(9, 30),
    duration: 30,
    location: "Exam Room 3",
    status: "completed",
  },
  {
    id: "apt2",
    patientName: "Sarah Johnson",
    patientId: "P-2891",
    type: "in-person",
    reason: "Follow-up - Diabetes Management",
    startTime: createTime(10, 0),
    endTime: createTime(10, 30),
    duration: 30,
    location: "Exam Room 1",
    status: "in-progress",
  },
  {
    id: "apt3",
    patientName: "Michael Chen",
    patientId: "P-3456",
    type: "telehealth",
    reason: "Medication Review",
    startTime: createTime(11, 0),
    endTime: createTime(11, 20),
    duration: 20,
    status: "confirmed",
  },
  {
    id: "apt4",
    patientName: "Emily Davis",
    patientId: "P-4782",
    type: "in-person",
    reason: "Lab Results Review",
    startTime: createTime(13, 30),
    endTime: createTime(14, 0),
    duration: 30,
    location: "Exam Room 2",
    status: "confirmed",
  },
  {
    id: "apt5",
    patientName: "Robert Wilson",
    patientId: "P-5123",
    type: "procedure",
    reason: "Minor Procedure - Skin Biopsy",
    startTime: createTime(14, 30),
    endTime: createTime(15, 30),
    duration: 60,
    location: "Procedure Room",
    status: "scheduled",
  },
  {
    id: "apt6",
    patientName: "Jennifer Martinez",
    patientId: "P-6234",
    type: "in-person",
    reason: "Well Child Visit",
    startTime: createTime(16, 0),
    endTime: createTime(16, 30),
    duration: 30,
    location: "Pediatrics Wing",
    status: "scheduled",
  },
];

// ============================================================================
// Component
// ============================================================================

export function ScheduleWidget({
  className,
  maxItems = 6,
}: ScheduleWidgetProps) {
  const [appointments] = useState<Appointment[]>(mockAppointments);

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "checked-in":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: Appointment["type"]) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case "telehealth":
        return <Video className={iconClass} />;
      case "procedure":
        return <CheckCircle2 className={iconClass} />;
      default:
        return <User className={iconClass} />;
    }
  };

  const getTypeColor = (type: Appointment["type"]) => {
    switch (type) {
      case "telehealth":
        return "text-blue-600 bg-blue-50";
      case "procedure":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const isUpcoming = (appointment: Appointment) => {
    return appointment.startTime > now && appointment.status !== "completed";
  };

  const displayAppointments = appointments.slice(0, maxItems);
  const upcomingCount = appointments.filter(isUpcoming).length;
  const totalToday = appointments.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {totalToday} Appointment{totalToday !== 1 ? "s" : ""} Today
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {upcomingCount} upcoming
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          Full Schedule
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {displayAppointments.map((apt, index) => {
          const isNow = apt.status === "in-progress";
          const isPast = apt.status === "completed";

          return (
            <div
              key={apt.id}
              className={cn(
                "relative flex gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors",
                isNow && "border-blue-500 bg-blue-50",
                isPast && "opacity-60",
              )}
            >
              {/* Time */}
              <div className="flex-shrink-0 w-16 text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatTime(apt.startTime)}
                </div>
                <div className="text-xs text-gray-500">{apt.duration}min</div>
              </div>

              {/* Divider */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full border-2 mt-1.5",
                    isNow
                      ? "bg-blue-500 border-blue-500"
                      : isPast
                        ? "bg-gray-300 border-gray-300"
                        : "bg-white border-gray-300",
                  )}
                />
                {index < displayAppointments.length - 1 && (
                  <div className="w-px h-full bg-gray-200 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {apt.patientName}
                    </p>
                    <p className="text-xs text-gray-600">{apt.patientId}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs flex-shrink-0",
                      getStatusColor(apt.status),
                    )}
                  >
                    {apt.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-2">{apt.reason}</p>

                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded",
                      getTypeColor(apt.type),
                    )}
                  >
                    {getTypeIcon(apt.type)}
                    <span className="capitalize">{apt.type}</span>
                  </div>

                  {apt.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {apt.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {displayAppointments.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">
            No appointments today
          </p>
          <p className="text-xs text-gray-500 mt-1">Your schedule is clear</p>
        </div>
      )}
    </div>
  );
}
