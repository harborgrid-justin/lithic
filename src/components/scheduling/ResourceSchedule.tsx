"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Resource, Appointment } from "@/types/scheduling";
import { schedulingService } from "@/services/scheduling.service";
import AppointmentCard from "./AppointmentCard";

interface ResourceScheduleProps {
  resource: Resource;
  date: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export default function ResourceSchedule({
  resource,
  date,
  onAppointmentClick,
}: ResourceScheduleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [resource.id, date]);

  const loadSchedule = async () => {
    try {
      const startDate = format(date, "yyyy-MM-dd");
      const endDate = format(date, "yyyy-MM-dd");

      const data = await schedulingService.getResourceSchedule(
        resource.id,
        startDate,
        endDate,
      );
      setAppointments(data);
    } catch (error) {
      console.error("Failed to load resource schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{resource.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {resource.description}
              </p>
            </div>
            <Badge variant={resource.isAvailable ? "default" : "destructive"}>
              {resource.isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold">{resource.location}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-gray-400 flex items-center justify-center font-semibold">
                T
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-semibold capitalize">{resource.type}</div>
              </div>
            </div>

            {resource.capacity && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Capacity</div>
                  <div className="font-semibold">{resource.capacity}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bookings for {format(date, "MMM d, yyyy")}</CardTitle>
            <Badge>{appointments.length} bookings</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading bookings...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings scheduled for this day
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick?.(appointment)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
