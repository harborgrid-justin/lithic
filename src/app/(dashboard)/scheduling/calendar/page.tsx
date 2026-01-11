"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import DragDropCalendar from "@/components/scheduling/DragDropCalendar";
import { schedulingService } from "@/services/scheduling.service";
import type { Appointment, Provider, CalendarView } from "@/types/scheduling";
import { toast } from "sonner";

export default function CalendarPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const [appointmentsData, providersData] = await Promise.all([
        schedulingService.getAppointments({
          startDate: startDate.toISOString().split("T")[0] || "",
          endDate: endDate.toISOString().split("T")[0] || "",
        }),
        schedulingService.getProviders(),
      ]);

      setAppointments(appointmentsData);
      setProviders(providersData);
    } catch (error) {
      toast.error("Failed to load calendar data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentMove = async (
    appointmentId: string,
    newStartTime: Date,
  ) => {
    try {
      await schedulingService.rescheduleAppointment(
        appointmentId,
        newStartTime.toISOString(),
      );
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0] || "";
    router.push(`/scheduling/appointments/new?date=${dateStr}&time=${time}`);
  };

  const filteredAppointments =
    selectedProviderId === "all"
      ? appointments
      : appointments.filter((apt) => apt.providerId === selectedProviderId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-600 mt-1">
            Drag and drop to reschedule appointments
          </p>
        </div>
        <div className="flex space-x-3">
          <Select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-64"
          >
            <option value="all">All Providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push("/scheduling/appointments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Drag-Drop Calendar */}
      <div className="h-[calc(100vh-200px)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <DragDropCalendar
            appointments={filteredAppointments}
            providers={providers}
            onAppointmentMove={handleAppointmentMove}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
      </div>
    </div>
  );
}
