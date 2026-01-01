/**
 * Patient Appointments Page
 * Agent 1: Patient Portal & Experience Expert
 * View/schedule appointments, virtual visits, pre-visit questionnaires
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Video, MapPin, Clock, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/utils";
import type { PatientAppointment, AppointmentStatus } from "@/types/patient-portal";

const mockAppointments: PatientAppointment[] = [
  {
    id: "1",
    patientId: "patient-1",
    providerId: "provider-1",
    providerName: "Dr. Michael Chen",
    providerSpecialty: "Internal Medicine",
    appointmentType: "Follow-up",
    appointmentTypeId: "type-1",
    scheduledDate: new Date("2026-01-15"),
    scheduledTime: "10:30 AM",
    duration: 30,
    location: {
      facilityId: "facility-1",
      facilityName: "Main Clinic",
      address: {
        line1: "123 Medical Center Dr",
        line2: "Suite 205",
        city: "Boston",
        state: "MA",
        postalCode: "02115",
        country: "USA",
        county: null,
      },
      roomNumber: "205",
    },
    status: "CONFIRMED",
    reasonForVisit: "Diabetes follow-up",
    telehealth: false,
    confirmationSent: true,
    remindersSent: 1,
    organizationId: "org-1",
    createdAt: new Date("2025-12-01"),
    updatedAt: new Date("2025-12-01"),
    deletedAt: null,
    createdBy: "patient-1",
    updatedBy: "patient-1",
  },
  {
    id: "2",
    patientId: "patient-1",
    providerId: "provider-2",
    providerName: "Dr. Sarah Johnson",
    providerSpecialty: "Cardiology",
    appointmentType: "Consultation",
    appointmentTypeId: "type-2",
    scheduledDate: new Date("2026-01-22"),
    scheduledTime: "2:00 PM",
    duration: 60,
    location: {
      facilityId: "facility-1",
      facilityName: "Cardiology Center",
      address: {
        line1: "456 Heart Ave",
        line2: null,
        city: "Boston",
        state: "MA",
        postalCode: "02116",
        country: "USA",
        county: null,
      },
    },
    status: "SCHEDULED",
    reasonForVisit: "Annual cardiac checkup",
    telehealth: true,
    telehealthLink: "https://telehealth.lithic.health/session/abc123",
    confirmationSent: true,
    remindersSent: 0,
    organizationId: "org-1",
    createdAt: new Date("2025-12-15"),
    updatedAt: new Date("2025-12-15"),
    deletedAt: null,
    createdBy: "patient-1",
    updatedBy: "patient-1",
  },
];

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 border-green-200";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "CHECKED_IN":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcomingAppointments = mockAppointments.filter(
    (apt) => apt.scheduledDate >= new Date(),
  );
  const pastAppointments = mockAppointments.filter(
    (apt) => apt.scheduledDate < new Date(),
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your healthcare appointments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="schedule">Schedule New</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming appointments</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Schedule your next appointment to get started
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {appointment.appointmentType}
                        {appointment.telehealth && (
                          <Badge variant="outline" className="gap-1">
                            <Video className="h-3 w-3" />
                            Telehealth
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {appointment.providerName} • {appointment.providerSpecialty}
                      </CardDescription>
                    </div>
                    <Badge className={cn(getStatusColor(appointment.status))}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {formatDate(appointment.scheduledDate, "long")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.scheduledTime} • {appointment.duration} minutes
                        </p>
                      </div>
                    </div>
                    {!appointment.telehealth && appointment.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{appointment.location.facilityName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.location.address.line1}
                            {appointment.location.roomNumber && ` - Room ${appointment.location.roomNumber}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">Reason for Visit</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {appointment.reasonForVisit}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {appointment.telehealth && appointment.telehealthLink && (
                      <Button className="flex-1">
                        <Video className="mr-2 h-4 w-4" />
                        Join Virtual Visit
                      </Button>
                    )}
                    {!appointment.telehealth && (
                      <Button variant="outline" className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Check In
                      </Button>
                    )}
                    <Button variant="outline">Reschedule</Button>
                    <Button variant="outline">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No past appointments</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your appointment history will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
              <CardDescription>
                Book an appointment with your healthcare provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Primary Care</CardTitle>
                    <CardDescription>Annual physical, routine care</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Specialist</CardTitle>
                    <CardDescription>See a specialist physician</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Telehealth
                    </CardTitle>
                    <CardDescription>Virtual video appointment</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">Lab Work</CardTitle>
                    <CardDescription>Schedule lab tests</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
