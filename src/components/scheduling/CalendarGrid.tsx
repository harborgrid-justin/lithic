/**
 * CalendarGrid Component - Multi-view Calendar Display
 * Supports day, week, month, and agenda views
 */

"use client";

import React, { useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/scheduling";
import { AppointmentSlot } from "./AppointmentSlot";

interface CalendarGridProps {
  view: "day" | "week" | "month" | "agenda";
  currentDate: Date;
  appointments: Appointment[];
  providers?: { id: string; name: string }[];
  onSlotClick?: (date: Date, hour: number, providerId?: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointment: Appointment, newDate: Date, newHour: number) => void;
  className?: string;
}

export function CalendarGrid({
  view,
  currentDate,
  appointments,
  providers = [],
  onSlotClick,
  onAppointmentClick,
  onAppointmentDrop,
  className,
}: CalendarGridProps) {
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour < 20; hour++) {
      slots.push({
        hour,
        label: format(new Date().setHours(hour, 0, 0, 0), "ha"),
      });
    }
    return slots;
  }, []);

  const days = useMemo(() => {
    if (view === "day") {
      return [currentDate];
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      // Month view - simplified to week for now
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  }, [view, currentDate]);

  const getAppointmentsForSlot = (date: Date, hour: number, providerId?: string) => {
    return appointments.filter((appt) => {
      if (providerId && appt.providerId !== providerId) return false;

      const apptDate = new Date(appt.startTime);
      const apptHour = apptDate.getHours();

      return isSameDay(apptDate, date) && apptHour === hour;
    });
  };

  if (view === "agenda") {
    return (
      <div className={cn("space-y-4", className)}>
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent cursor-pointer"
            onClick={() => onAppointmentClick?.(appointment)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {format(appointment.startTime, "MMM dd, yyyy")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(appointment.startTime, "h:mm a")} - {format(appointment.endTime, "h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {appointment.reason}
              </p>
            </div>
            <div className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              appointment.status === "SCHEDULED" && "bg-blue-100 text-blue-800",
              appointment.status === "CONFIRMED" && "bg-green-100 text-green-800",
              appointment.status === "CANCELLED" && "bg-red-100 text-red-800",
            )}>
              {appointment.status}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (providers.length > 0) {
    // Multi-provider view
    return (
      <div className={cn("overflow-auto", className)}>
        <div className="min-w-max">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${providers.length * days.length}, 1fr)` }}>
            {/* Header Row */}
            <div className="sticky top-0 bg-background border-b p-2 font-medium">
              Time
            </div>
            {days.map((day) => (
              providers.map((provider) => (
                <div
                  key={`${format(day, "yyyy-MM-dd")}-${provider.id}`}
                  className="sticky top-0 bg-background border-b p-2 text-center"
                >
                  <div className="font-medium">{format(day, "EEE, MMM d")}</div>
                  <div className="text-xs text-muted-foreground">{provider.name}</div>
                </div>
              ))
            ))}

            {/* Time Slots */}
            {timeSlots.map(({ hour, label }) => (
              <React.Fragment key={hour}>
                <div className="border-r border-b p-2 text-sm text-muted-foreground">
                  {label}
                </div>
                {days.map((day) => (
                  providers.map((provider) => {
                    const appts = getAppointmentsForSlot(day, hour, provider.id);
                    return (
                      <div
                        key={`${format(day, "yyyy-MM-dd")}-${hour}-${provider.id}`}
                        className="border-r border-b p-1 hover:bg-accent cursor-pointer min-h-[60px]"
                        onClick={() => onSlotClick?.(day, hour, provider.id)}
                      >
                        {appts.map((appt) => (
                          <AppointmentSlot
                            key={appt.id}
                            appointment={appt}
                            onClick={() => onAppointmentClick?.(appt)}
                            className="mb-1"
                          />
                        ))}
                      </div>
                    );
                  })
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single column view (day/week without providers)
  return (
    <div className={cn("overflow-auto", className)}>
      <div className="min-w-max">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
          {/* Header Row */}
          <div className="sticky top-0 bg-background border-b p-2 font-medium">
            Time
          </div>
          {days.map((day) => (
            <div
              key={format(day, "yyyy-MM-dd")}
              className="sticky top-0 bg-background border-b p-2 text-center font-medium"
            >
              {format(day, "EEE, MMM d")}
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map(({ hour, label }) => (
            <React.Fragment key={hour}>
              <div className="border-r border-b p-2 text-sm text-muted-foreground">
                {label}
              </div>
              {days.map((day) => {
                const appts = getAppointmentsForSlot(day, hour);
                return (
                  <div
                    key={`${format(day, "yyyy-MM-dd")}-${hour}`}
                    className="border-r border-b p-1 hover:bg-accent cursor-pointer min-h-[60px]"
                    onClick={() => onSlotClick?.(day, hour)}
                  >
                    {appts.map((appt) => (
                      <AppointmentSlot
                        key={appt.id}
                        appointment={appt}
                        onClick={() => onAppointmentClick?.(appt)}
                        className="mb-1"
                      />
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
