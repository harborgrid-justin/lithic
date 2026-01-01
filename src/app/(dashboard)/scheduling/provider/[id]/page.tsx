/**
 * Provider Schedule Page
 * Individual provider calendar with availability management, time-off, productivity metrics
 */

"use client";

import React, { useState } from "react";
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useSchedulingStore } from "@/stores/scheduling-store";
import { ProviderColumn } from "@/components/scheduling/ProviderColumn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  Settings,
  Plus,
  Download,
} from "lucide-react";
import type { AppointmentStatus } from "@/types/scheduling";

interface ProviderSchedulePageProps {
  params: {
    id: string;
  };
}

export default function ProviderSchedulePage({ params }: ProviderSchedulePageProps) {
  const providerId = params.id;

  const {
    currentDate,
    appointments,
    schedules,
    setCurrentDate,
    selectTimeSlot,
  } = useSchedulingStore();

  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 0 }));

  // Mock provider data - in real app, would fetch from API
  const provider = {
    id: providerId,
    name: "Dr. Sarah Johnson",
    specialty: "Primary Care",
    email: "sarah.johnson@lithic.health",
    phone: "(555) 123-4567",
    avatar: null,
  };

  const providerSchedule = schedules.find((s) => s.providerId === providerId);
  const providerAppointments = appointments.filter((a) => a.providerId === providerId);

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 0 }),
  });

  const handlePreviousWeek = () => {
    setWeekStart(addWeeks(weekStart, -1));
  };

  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const handleThisWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleSlotClick = (time: Date) => {
    selectTimeSlot({
      providerId,
      startTime: time,
      duration: 30,
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log("Appointment clicked:", appointment);
  };

  // Calculate metrics
  const totalAppointments = providerAppointments.length;
  const completedAppointments = providerAppointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const cancelledAppointments = providerAppointments.filter(
    (a) => a.status === "CANCELLED"
  ).length;
  const noShowAppointments = providerAppointments.filter(
    (a) => a.status === "NO_SHOW"
  ).length;
  const utilizationRate = totalAppointments > 0
    ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
    : "0";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{provider.name}</h1>
                <p className="text-sm text-muted-foreground">{provider.specialty}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Schedule
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Block Time
              </Button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleThisWeek}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-3">
                {format(weekStart, "MMMM d")} - {format(endOfWeek(weekStart, { weekStartsOn: 0 }), "MMMM d, yyyy")}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Completed: {completedAppointments}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Scheduled: {totalAppointments - completedAppointments}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">No Show: {noShowAppointments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="schedule" className="h-full">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Productivity
              </TabsTrigger>
              <TabsTrigger value="availability">
                <Clock className="h-4 w-4 mr-2" />
                Availability
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="schedule" className="p-4 space-y-4 m-0">
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayAppointments = providerAppointments.filter((appt) => {
                  const apptDate = new Date(appt.startTime);
                  return format(apptDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                });

                return (
                  <ProviderColumn
                    key={day.toISOString()}
                    provider={provider}
                    date={day}
                    schedule={providerSchedule}
                    appointments={dayAppointments}
                    onSlotClick={handleSlotClick}
                    onAppointmentClick={handleAppointmentClick}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="p-4 space-y-4 m-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{utilizationRate}%</div>
                  <Progress value={parseFloat(utilizationRate)} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(0) : 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No Shows</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{noShowAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalAppointments > 0 ? ((noShowAppointments / totalAppointments) * 100).toFixed(0) : 0}% no-show rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>Appointment breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-green-500" />
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="font-medium">{completedAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-red-500" />
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <span className="font-medium">{cancelledAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-orange-500" />
                      <span className="text-sm">No Show</span>
                    </div>
                    <span className="font-medium">{noShowAppointments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Availability Management</CardTitle>
                <CardDescription>
                  Configure your working hours and time-off
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Weekly Schedule</h3>
                  {providerSchedule?.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-24">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.dayOfWeek]}
                        </span>
                        <span className="text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                        {slot.isAvailable ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Off
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Schedule Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
