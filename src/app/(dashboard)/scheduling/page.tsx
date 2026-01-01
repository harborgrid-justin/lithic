"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar as CalendarIcon,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Calendar from "@/components/scheduling/Calendar";
import { schedulingService } from "@/services/scheduling.service";
import type { Appointment, Provider } from "@/types/scheduling";
import { toast } from "sonner";

export default function SchedulingPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    confirmed: 0,
    pending: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const [appointmentsData, providersData] = await Promise.all([
        schedulingService.getAppointments({
          startDate: today.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }),
        schedulingService.getProviders(),
      ]);

      setAppointments(appointmentsData);
      setProviders(providersData);

      // Calculate stats
      const todayStr = today.toISOString().split("T")[0];
      const todayAppts = appointmentsData.filter(
        (apt) => apt.startTime.split("T")[0] === todayStr,
      );
      const confirmed = appointmentsData.filter(
        (apt) => apt.status === "confirmed",
      );
      const pending = appointmentsData.filter(
        (apt) => apt.status === "scheduled",
      );

      setStats({
        today: todayAppts.length,
        upcoming: appointmentsData.length,
        confirmed: confirmed.length,
        pending: pending.length,
      });
    } catch (error) {
      toast.error("Failed to load scheduling data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/scheduling/appointments/${appointment.id}`);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/scheduling/appointments/new?date=${dateStr}&time=${time}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-gray-600 mt-1">
            Manage appointments and provider schedules
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push("/scheduling/waitlist")}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Waitlist
          </Button>
          <Button onClick={() => router.push("/scheduling/appointments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Today&apos;s Appointments
                </p>
                <p className="text-3xl font-bold mt-1">{stats.today}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-3xl font-bold mt-1">{stats.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-3xl font-bold mt-1">{stats.confirmed}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/scheduling/calendar")}
            >
              <CalendarIcon className="h-6 w-6 mb-2" />
              Calendar View
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/scheduling/appointments")}
            >
              <Clock className="h-6 w-6 mb-2" />
              All Appointments
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/scheduling/providers")}
            >
              <Users className="h-6 w-6 mb-2" />
              Provider Schedules
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => router.push("/scheduling/resources")}
            >
              <CalendarIcon className="h-6 w-6 mb-2" />
              Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <div className="h-[600px]">
        <Calendar
          appointments={appointments}
          providers={providers}
          onAppointmentClick={handleAppointmentClick}
          onTimeSlotClick={handleTimeSlotClick}
          view="week"
        />
      </div>
    </div>
  );
}
