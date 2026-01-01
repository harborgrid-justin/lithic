/**
 * AppointmentSlot Component - Individual Appointment Display
 * Compact appointment card for calendar views
 */

"use client";

import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/types/scheduling";
import { Clock, User, MapPin } from "lucide-react";

interface AppointmentSlotProps {
  appointment: Appointment;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  compact?: boolean;
}

export function AppointmentSlot({
  appointment,
  onClick,
  onDragStart,
  onDragEnd,
  className,
  compact = false,
}: AppointmentSlotProps) {
  const statusColors: Record<AppointmentStatus, string> = {
    SCHEDULED: "bg-blue-100 border-blue-300 text-blue-900",
    CONFIRMED: "bg-green-100 border-green-300 text-green-900",
    ARRIVED: "bg-purple-100 border-purple-300 text-purple-900",
    IN_PROGRESS: "bg-yellow-100 border-yellow-300 text-yellow-900",
    COMPLETED: "bg-gray-100 border-gray-300 text-gray-700",
    CANCELLED: "bg-red-100 border-red-300 text-red-700 line-through opacity-60",
    NO_SHOW: "bg-orange-100 border-orange-300 text-orange-700 opacity-60",
    RESCHEDULED: "bg-indigo-100 border-indigo-300 text-indigo-900",
    WAITLIST: "bg-pink-100 border-pink-300 text-pink-900",
  };

  const typeIcons: Record<AppointmentType, string> = {
    NEW_PATIENT: "🆕",
    FOLLOW_UP: "🔄",
    ANNUAL_PHYSICAL: "📋",
    WELL_CHILD: "👶",
    SICK_VISIT: "🤒",
    CONSULTATION: "💬",
    PROCEDURE: "🏥",
    SURGERY: "⚕️",
    THERAPY: "🧘",
    LAB_ONLY: "🧪",
    IMAGING_ONLY: "📸",
    VACCINE: "💉",
    TELEHEALTH: "💻",
    WALK_IN: "🚶",
  };

  if (compact) {
    return (
      <div
        className={cn(
          "rounded px-2 py-1 text-xs cursor-pointer border transition-all hover:shadow-md",
          statusColors[appointment.status],
          className
        )}
        onClick={onClick}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title={`${format(appointment.startTime, "h:mm a")} - ${appointment.reason}`}
      >
        <div className="flex items-center gap-1 truncate">
          <span>{typeIcons[appointment.appointmentType]}</span>
          <span className="truncate font-medium">{appointment.reason}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border p-2 cursor-pointer transition-all hover:shadow-md",
        statusColors[appointment.status],
        className
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">{typeIcons[appointment.appointmentType]}</span>
            <span className="text-xs font-medium truncate">
              {appointment.reason}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(appointment.startTime, "h:mm a")}</span>
            </div>

            <div className="flex items-center gap-1 truncate">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Patient</span>
            </div>
          </div>

          {appointment.roomId && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>Room {appointment.roomId}</span>
            </div>
          )}

          {appointment.chiefComplaint && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {appointment.chiefComplaint}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-background/50">
            {appointment.duration}m
          </span>

          {appointment.priority !== "ROUTINE" && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              appointment.priority === "STAT" && "bg-red-500 text-white",
              appointment.priority === "URGENT" && "bg-orange-500 text-white",
              appointment.priority === "ASAP" && "bg-yellow-500 text-yellow-900"
            )}>
              {appointment.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
