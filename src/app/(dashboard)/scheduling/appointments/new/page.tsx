"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppointmentForm from "@/components/scheduling/AppointmentForm";
import ConflictResolver from "@/components/scheduling/ConflictResolver";
import { schedulingService } from "@/services/scheduling.service";
import type {
  Provider,
  Patient,
  Resource,
  ScheduleConflict,
  TimeSlot,
} from "@/types/scheduling";
import type { AppointmentInput } from "@/lib/validators";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

function NewAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [conflictData, setConflictData] = useState<{
    providerId: string;
    startTime: string;
    duration: number;
  } | null>(null);

  // Get query params
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, patientsData, resourcesData] = await Promise.all([
        schedulingService.getProviders(),
        schedulingService.searchPatients(""),
        schedulingService.getResources(),
      ]);

      setProviders(providersData);
      setPatients(patientsData);
      setResources(resourcesData);
    } catch (error) {
      toast.error("Failed to load form data");
      console.error(error);
    }
  };

  const handleSubmit = async (data: AppointmentInput) => {
    setLoading(true);
    try {
      // Check for conflicts
      const conflict = await schedulingService.checkConflicts(
        data.providerId,
        data.startTime,
        data.duration,
      );

      if (conflict) {
        setConflictData({
          providerId: data.providerId,
          startTime: data.startTime,
          duration: data.duration,
        });
        setShowConflictResolver(true);
        setLoading(false);
        return;
      }

      // Create appointment
      await schedulingService.createAppointment(data);
      toast.success("Appointment created successfully");
      router.push("/scheduling/appointments");
    } catch (error) {
      toast.error("Failed to create appointment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConflictResolve = async (selectedSlot: TimeSlot) => {
    setShowConflictResolver(false);
    // Update the form with the new time slot
    // This would require passing the slot back to the form
    toast.info("Please submit the form again with the selected time");
  };

  const defaultValues: Partial<AppointmentInput> = {};
  if (date && time) {
    const [hours, minutes] = time.split(":");
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    defaultValues.startTime = startTime.toISOString().slice(0, 16);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/scheduling/appointments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Appointment</h1>
          <p className="text-gray-600 mt-1">
            Schedule a new patient appointment
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        {showConflictResolver && conflictData ? (
          <ConflictResolver
            providerId={conflictData.providerId}
            startTime={conflictData.startTime}
            duration={conflictData.duration}
            onResolve={handleConflictResolve}
            onCancel={() => setShowConflictResolver(false)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentForm
                providers={providers}
                patients={patients}
                resources={resources}
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/scheduling/appointments")}
                loading={loading}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <NewAppointmentPageContent />
    </Suspense>
  );
}
