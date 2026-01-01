"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Provider, Patient, Resource } from "@/types/scheduling";

interface AppointmentFormProps {
  providers: Provider[];
  patients?: Patient[];
  resources?: Resource[];
  defaultValues?: Partial<AppointmentInput>;
  onSubmit: (data: AppointmentInput) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function AppointmentForm({
  providers,
  patients = [],
  resources = [],
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
}: AppointmentFormProps) {
  const [showRecurrence, setShowRecurrence] = useState(
    defaultValues?.isRecurring || false,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: defaultValues || {
      duration: 30,
      type: "consultation",
      isRecurring: false,
    },
  });

  const isRecurring = watch("isRecurring");

  React.useEffect(() => {
    setShowRecurrence(isRecurring);
  }, [isRecurring]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patientId">Patient *</Label>
          <Select id="patientId" {...register("patientId")}>
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} (
                {patient.medicalRecordNumber})
              </option>
            ))}
          </Select>
          {errors.patientId && (
            <p className="text-sm text-red-600">{errors.patientId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="providerId">Provider *</Label>
          <Select id="providerId" {...register("providerId")}>
            <option value="">Select Provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.specialty}
              </option>
            ))}
          </Select>
          {errors.providerId && (
            <p className="text-sm text-red-600">{errors.providerId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Appointment Type *</Label>
          <Select id="type" {...register("type")}>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="procedure">Procedure</option>
            <option value="surgery">Surgery</option>
            <option value="therapy">Therapy</option>
            <option value="diagnostic">Diagnostic</option>
            <option value="screening">Screening</option>
            <option value="vaccination">Vaccination</option>
            <option value="telemedicine">Telemedicine</option>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input
            id="duration"
            type="number"
            {...register("duration", { valueAsNumber: true })}
          />
          {errors.duration && (
            <p className="text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            {...register("startTime")}
          />
          {errors.startTime && (
            <p className="text-sm text-red-600">{errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>
      </div>

      {resources.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="roomId">Room</Label>
          <Select id="roomId" {...register("roomId")}>
            <option value="">Select Room (Optional)</option>
            {resources
              .filter((r) => r.type === "room")
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.location}
                </option>
              ))}
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="chiefComplaint">Chief Complaint</Label>
        <Textarea
          id="chiefComplaint"
          {...register("chiefComplaint")}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} rows={3} />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRecurring"
          {...register("isRecurring")}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <Label htmlFor="isRecurring">Recurring Appointment</Label>
      </div>

      {showRecurrence && (
        <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
          <h4 className="font-semibold">Recurrence Pattern</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence.frequency">Frequency</Label>
              <Select
                id="recurrence.frequency"
                {...register("recurrenceRule.frequency")}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence.interval">Repeat Every</Label>
              <Input
                id="recurrence.interval"
                type="number"
                min="1"
                {...register("recurrenceRule.interval", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence.endDate">End Date</Label>
              <Input
                id="recurrence.endDate"
                type="date"
                {...register("recurrenceRule.endDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence.occurrences">
                Or Number of Occurrences
              </Label>
              <Input
                id="recurrence.occurrences"
                type="number"
                min="1"
                {...register("recurrenceRule.occurrences", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Appointment"}
        </Button>
      </div>
    </form>
  );
}
