/**
 * Patient Self-Scheduling Portal
 * Online appointment booking with provider selection and confirmation
 */

"use client";

import React, { useState } from "react";
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  Video,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentType } from "@/types/scheduling";

export default function PatientSchedulePage() {
  const [step, setStep] = useState<"type" | "provider" | "datetime" | "confirm">("type");
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<"in-person" | "telehealth">("in-person");
  const [reason, setReason] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  // Mock data - in real app, would come from API
  const appointmentTypes = [
    { value: "NEW_PATIENT", label: "New Patient Visit", duration: 60, icon: "🆕" },
    { value: "FOLLOW_UP", label: "Follow-up Visit", duration: 30, icon: "🔄" },
    { value: "ANNUAL_PHYSICAL", label: "Annual Physical", duration: 45, icon: "📋" },
    { value: "SICK_VISIT", label: "Sick Visit", duration: 20, icon: "🤒" },
    { value: "CONSULTATION", label: "Consultation", duration: 45, icon: "💬" },
    { value: "VACCINE", label: "Vaccination", duration: 15, icon: "💉" },
  ];

  const providers = [
    {
      id: "prov1",
      name: "Dr. Sarah Johnson",
      specialty: "Primary Care",
      rating: 4.8,
      nextAvailable: "Tomorrow",
      avatar: null,
    },
    {
      id: "prov2",
      name: "Dr. Michael Chen",
      specialty: "Primary Care",
      rating: 4.9,
      nextAvailable: "Today",
      avatar: null,
    },
    {
      id: "prov3",
      name: "Dr. Emily Davis",
      specialty: "Primary Care",
      rating: 4.7,
      nextAvailable: "In 2 days",
      avatar: null,
    },
  ];

  const facilities = [
    { id: "fac1", name: "Main Clinic", address: "123 Healthcare Blvd" },
    { id: "fac2", name: "Downtown Office", address: "456 Medical Center Dr" },
  ];

  const availableTimeSlots = selectedDate
    ? [
        "08:00 AM",
        "08:30 AM",
        "09:00 AM",
        "09:30 AM",
        "10:00 AM",
        "10:30 AM",
        "11:00 AM",
        "02:00 PM",
        "02:30 PM",
        "03:00 PM",
        "03:30 PM",
        "04:00 PM",
      ]
    : [];

  const handleBookAppointment = () => {
    setIsConfirmOpen(true);
  };

  const confirmBooking = () => {
    // In real app, would make API call
    setIsBooked(true);
    setTimeout(() => {
      setIsConfirmOpen(false);
      // Reset or redirect
    }, 2000);
  };

  const selectedApptType = appointmentTypes.find((t) => t.value === selectedType);
  const selectedProviderData = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Schedule an Appointment</h1>
          <p className="text-muted-foreground">
            Book your visit in just a few simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[
            { key: "type", label: "Visit Type" },
            { key: "provider", label: "Provider" },
            { key: "datetime", label: "Date & Time" },
            { key: "confirm", label: "Confirm" },
          ].map((s, index) => (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === s.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <span className="text-sm hidden sm:inline">{s.label}</span>
              </div>
              {index < 3 && (
                <div className="h-px w-8 bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Visit Type */}
        {step === "type" && (
          <Card>
            <CardHeader>
              <CardTitle>What type of visit do you need?</CardTitle>
              <CardDescription>Select the type of appointment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {appointmentTypes.map((type) => (
                  <Card
                    key={type.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedType === type.value && "border-primary ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedType(type.value as AppointmentType)}
                  >
                    <CardContent className="p-4">
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <h3 className="font-semibold mb-1">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.duration} minutes</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Label>Visit Method:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={visitType === "in-person" ? "default" : "outline"}
                    onClick={() => setVisitType("in-person")}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    In-Person
                  </Button>
                  <Button
                    variant={visitType === "telehealth" ? "default" : "outline"}
                    onClick={() => setVisitType("telehealth")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Telehealth
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!selectedType}
                onClick={() => setStep("provider")}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Provider Selection */}
        {step === "provider" && (
          <Card>
            <CardHeader>
              <CardTitle>Choose your provider</CardTitle>
              <CardDescription>Select from available healthcare providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <Card
                    key={provider.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedProvider === provider.id && "border-primary ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{provider.specialty}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-medium">{provider.rating}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Next: {provider.nextAvailable}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("type")}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedProvider}
                  onClick={() => setStep("datetime")}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date & Time */}
        {step === "datetime" && (
          <Card>
            <CardHeader>
              <CardTitle>Select date and time</CardTitle>
              <CardDescription>Choose your preferred appointment slot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Available Times</Label>
                  {selectedDate ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a date first
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reason" className="mb-2 block">
                  Reason for Visit (Optional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Brief description of your symptoms or reason for visit..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("provider")}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep("confirm")}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirm" && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm your appointment</CardTitle>
              <CardDescription>Review your appointment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Date & Time</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{selectedProviderData?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedProviderData?.specialty}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{selectedApptType?.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedApptType?.duration} minutes • {visitType === "telehealth" ? "Video Visit" : "In-Person"}
                    </div>
                  </div>
                </div>

                {visitType === "in-person" && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">{facilities[0].name}</div>
                      <div className="text-sm text-muted-foreground">
                        {facilities[0].address}
                      </div>
                    </div>
                  </div>
                )}

                {reason && (
                  <div className="p-4 rounded-lg border">
                    <div className="font-medium mb-1">Reason for Visit</div>
                    <div className="text-sm text-muted-foreground">{reason}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("datetime")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleBookAppointment}>
                  Book Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isBooked ? "Appointment Confirmed!" : "Confirm Booking"}
            </DialogTitle>
            <DialogDescription>
              {isBooked
                ? "Your appointment has been successfully scheduled."
                : "Are you sure you want to book this appointment?"}
            </DialogDescription>
          </DialogHeader>

          {isBooked ? (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center text-muted-foreground">
                A confirmation email has been sent to you.
              </p>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBooking}>Confirm</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
