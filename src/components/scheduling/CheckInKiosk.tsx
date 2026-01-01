"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Appointment, Patient } from "@/types/scheduling";
import { formatTime, formatDate } from "@/lib/utils";
import { schedulingService } from "@/services/scheduling.service";
import { toast } from "sonner";

interface CheckInKioskProps {
  onCheckInComplete?: (appointment: Appointment) => void;
}

export default function CheckInKiosk({ onCheckInComplete }: CheckInKioskProps) {
  const [step, setStep] = useState<
    "search" | "verify" | "confirm" | "complete"
  >("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a last name or date of birth");
      return;
    }

    setLoading(true);
    try {
      // Search for today's appointments by patient name
      const today = new Date().toISOString().split("T")[0];
      const results = await schedulingService.getAppointments({
        startDate: today,
        endDate: today,
        searchTerm: searchQuery,
        status: ["scheduled", "confirmed"],
      });

      if (results.length === 0) {
        toast.error("No appointments found for today");
        setAppointments([]);
      } else {
        setAppointments(results);
        setStep("verify");
      }
    } catch (error) {
      toast.error("Failed to search appointments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setStep("confirm");
  };

  const handleCheckIn = async () => {
    if (!selectedAppointment) return;

    setLoading(true);
    try {
      const updated = await schedulingService.checkInAppointment(
        selectedAppointment.id,
      );
      setSelectedAppointment(updated);
      setStep("complete");
      toast.success("Successfully checked in!");

      setTimeout(() => {
        onCheckInComplete?.(updated);
        resetKiosk();
      }, 3000);
    } catch (error) {
      toast.error("Failed to check in. Please see the front desk.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setStep("search");
    setSearchQuery("");
    setAppointments([]);
    setSelectedAppointment(null);
  };

  const renderSearchStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
        <Search className="h-8 w-8 text-primary-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
        <p className="text-gray-600">Check in for your appointment</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <Label htmlFor="search" className="text-lg">
            Enter your last name or date of birth
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Last name or MM/DD/YYYY"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="mt-2 text-lg h-12"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Appointment</h2>
        <p className="text-gray-600">
          Please select your appointment from the list below
        </p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {appointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSelectAppointment(appointment)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {appointment.patient?.firstName}{" "}
                      {appointment.patient?.lastName}
                    </h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(appointment.startTime)}</span>
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatTime(appointment.startTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {appointment.provider?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {appointment.type}
                  </div>
                  {appointment.location && (
                    <div className="text-sm text-gray-500 mt-1">
                      {appointment.location}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={resetKiosk}>
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => {
    if (!selectedAppointment) return null;

    return (
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-primary-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Confirm Your Appointment</h2>
          <p className="text-gray-600">
            Please verify your appointment details
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Patient:</span>
                <span className="font-semibold">
                  {selectedAppointment.patient?.firstName}{" "}
                  {selectedAppointment.patient?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Provider:</span>
                <span className="font-semibold">
                  {selectedAppointment.provider?.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">
                  {formatDate(selectedAppointment.startTime)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">
                  {formatTime(selectedAppointment.startTime)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold capitalize">
                  {selectedAppointment.type}
                </span>
              </div>
              {selectedAppointment.location && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">
                    {selectedAppointment.location}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setStep("verify")}
            disabled={loading}
          >
            Go Back
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            size="lg"
            className="px-8"
          >
            {loading ? "Checking In..." : "Check In"}
          </Button>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-green-600 mb-2">
          You&apos;re Checked In!
        </h2>
        <p className="text-lg text-gray-600">
          Thank you, {selectedAppointment?.patient?.firstName}
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-gray-700">
            Please have a seat in the waiting area. You will be called shortly.
          </p>
          {selectedAppointment?.location && (
            <p className="mt-3 text-sm text-gray-500">
              Your appointment is in:{" "}
              <strong>{selectedAppointment.location}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">Returning to start in a moment...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 md:p-12">
          {step === "search" && renderSearchStep()}
          {step === "verify" && renderVerifyStep()}
          {step === "confirm" && renderConfirmStep()}
          {step === "complete" && renderCompleteStep()}
        </CardContent>
      </Card>
    </div>
  );
}
