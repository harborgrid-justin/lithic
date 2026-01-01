/**
 * Enterprise Scheduler Page
 * Multi-provider calendar with drag-and-drop, template management, bulk operations
 */

"use client";

import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { useSchedulingStore } from "@/stores/scheduling-store";
import { CalendarGrid } from "@/components/scheduling/CalendarGrid";
import { WaitlistQueue } from "@/components/scheduling/WaitlistQueue";
import { ResourceTimeline } from "@/components/scheduling/ResourceTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Settings,
  Users,
  Bed,
  Grid3x3,
  List,
  Plus,
} from "lucide-react";

export default function EnterpriseSchedulerPage() {
  const {
    view,
    currentDate,
    appointments,
    schedules,
    waitlist,
    rooms,
    selectedProviderId,
    filter,
    setView,
    setCurrentDate,
    goToPrevious,
    goToNext,
    goToToday,
    setSelectedProviderId,
    setFilter,
    selectTimeSlot,
  } = useSchedulingStore();

  const [activeTab, setActiveTab] = useState<"schedule" | "waitlist" | "resources">("schedule");
  const [providers] = useState([
    { id: "prov1", name: "Dr. Sarah Johnson", specialty: "Primary Care" },
    { id: "prov2", name: "Dr. Michael Chen", specialty: "Cardiology" },
    { id: "prov3", name: "Dr. Emily Davis", specialty: "Pediatrics" },
  ]);

  const filteredProviders = selectedProviderId
    ? providers.filter((p) => p.id === selectedProviderId)
    : providers;

  const handleSlotClick = (date: Date, hour: number, providerId?: string) => {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    selectTimeSlot({
      providerId: providerId || providers[0].id,
      startTime: slotTime,
      duration: 30,
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log("Appointment clicked:", appointment);
    // Open appointment details modal
  };

  const handleWaitlistNotify = (entryId: string) => {
    console.log("Notify waitlist entry:", entryId);
    // Send notification to patient
  };

  const handleWaitlistSchedule = (entryId: string) => {
    console.log("Schedule waitlist entry:", entryId);
    // Open scheduling modal for waitlist entry
  };

  const handleWaitlistRemove = (entryId: string) => {
    console.log("Remove waitlist entry:", entryId);
    // Remove from waitlist
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Enterprise Scheduler</h1>
            <Badge variant="outline" className="text-sm">
              {appointments.length} appointments
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-4 gap-4">
          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="text-sm font-medium px-3">
              {format(currentDate, "MMMM yyyy")}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedProviderId || "all"}
              onValueChange={(value) => setSelectedProviderId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="agenda">Agenda View</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={activeTab === "schedule" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("schedule")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button
              variant={activeTab === "waitlist" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("waitlist")}
            >
              <List className="h-4 w-4 mr-2" />
              Waitlist
              {waitlist.length > 0 && (
                <Badge variant="danger" className="ml-2">
                  {waitlist.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "resources" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("resources")}
            >
              <Bed className="h-4 w-4 mr-2" />
              Resources
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "schedule" && (
          <CalendarGrid
            view={view}
            currentDate={currentDate}
            appointments={appointments}
            providers={filteredProviders}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        {activeTab === "waitlist" && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Waitlist Management</h2>
                <p className="text-sm text-muted-foreground">
                  {waitlist.length} patients waiting for appointments
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Waitlist
              </Button>
            </div>

            <WaitlistQueue
              entries={waitlist}
              onNotify={handleWaitlistNotify}
              onSchedule={handleWaitlistSchedule}
              onRemove={handleWaitlistRemove}
            />
          </div>
        )}

        {activeTab === "resources" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Resource Management</h2>
                <p className="text-sm text-muted-foreground">
                  {rooms.length} rooms available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Resources
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </div>

            <ResourceTimeline
              date={currentDate}
              resources={rooms}
              appointments={appointments}
              onResourceClick={(id) => console.log("Resource clicked:", id)}
              onSlotClick={(id, time) => console.log("Resource slot clicked:", id, time)}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">{appointments.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Confirmed: </span>
              <span className="font-medium text-green-600">
                {appointments.filter((a) => a.status === "CONFIRMED").length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Pending: </span>
              <span className="font-medium text-yellow-600">
                {appointments.filter((a) => a.status === "SCHEDULED").length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Waitlist: </span>
              <span className="font-medium text-blue-600">{waitlist.length}</span>
            </div>
          </div>

          <div className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy • h:mm a")}
          </div>
        </div>
      </div>
    </div>
  );
}
