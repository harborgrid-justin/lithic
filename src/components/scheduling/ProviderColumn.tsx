/**
 * ProviderColumn Component - Single Provider Schedule View
 * Displays a provider's schedule for a given day
 */

"use client";

import React from "react";
import { format, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import type { Appointment, Schedule } from "@/types/scheduling";
import { AppointmentSlot } from "./AppointmentSlot";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock } from "lucide-react";

interface ProviderColumnProps {
  provider: {
    id: string;
    name: string;
    specialty?: string;
    avatar?: string;
  };
  date: Date;
  schedule?: Schedule;
  appointments: Appointment[];
  onSlotClick?: (time: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  className?: string;
}

export function ProviderColumn({
  provider,
  date,
  schedule,
  appointments,
  onSlotClick,
  onAppointmentClick,
  className,
}: ProviderColumnProps) {
  const timeSlots = React.useMemo(() => {
    if (!schedule) {
      // Default 8am-5pm
      return Array.from({ length: 9 }, (_, i) => 8 + i);
    }

    const dayOfWeek = date.getDay();
    const daySlots = schedule.timeSlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );

    if (daySlots.length === 0) return [];

    // Get hour range from slots
    const hours: number[] = [];
    daySlots.forEach((slot) => {
      const [startHour] = slot.startTime.split(":").map(Number);
      const [endHour] = slot.endTime.split(":").map(Number);
      for (let h = startHour; h < endHour; h++) {
        if (!hours.includes(h)) hours.push(h);
      }
    });

    return hours.sort((a, b) => a - b);
  }, [schedule, date]);

  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.startTime);
      return apptDate.getHours() === hour;
    });
  };

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
  const utilizationRate = schedule
    ? ((appointments.length / (timeSlots.length * 2)) * 100).toFixed(0)
    : 0;

  if (timeSlots.length === 0) {
    return (
      <div className={cn("border rounded-lg p-6 bg-muted/50", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            {provider.specialty && (
              <p className="text-sm text-muted-foreground">{provider.specialty}</p>
            )}
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No schedule for this day</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Provider Header */}
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{provider.name}</h3>
              {provider.specialty && (
                <p className="text-sm text-muted-foreground">{provider.specialty}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {totalAppointments} {totalAppointments === 1 ? "appointment" : "appointments"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{utilizationRate}% utilized</span>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="divide-y">
        {timeSlots.map((hour) => {
          const hourAppointments = getAppointmentsForHour(hour);
          const slotTime = setMinutes(setHours(date, hour), 0);

          return (
            <div key={hour} className="flex hover:bg-accent/50 transition-colors">
              <div className="w-20 p-3 border-r flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  {format(slotTime, "h:mm a")}
                </span>
              </div>
              <div
                className="flex-1 p-2 min-h-[80px] cursor-pointer"
                onClick={() => hourAppointments.length === 0 && onSlotClick?.(slotTime)}
              >
                <div className="space-y-2">
                  {hourAppointments.map((appt) => (
                    <AppointmentSlot
                      key={appt.id}
                      appointment={appt}
                      onClick={() => onAppointmentClick?.(appt)}
                    />
                  ))}
                  {hourAppointments.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      Available
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
