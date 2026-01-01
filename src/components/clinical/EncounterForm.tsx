"use client";

import { useState } from "react";
import { Encounter, Diagnosis, Procedure } from "@/types/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EncounterFormProps {
  encounter?: Encounter;
  onSubmit: (data: Partial<Encounter>) => void;
  onCancel: () => void;
}

export function EncounterForm({
  encounter,
  onSubmit,
  onCancel,
}: EncounterFormProps) {
  const [formData, setFormData] = useState<Partial<Encounter>>({
    patientId: encounter?.patientId || "",
    patientName: encounter?.patientName || "",
    providerId: encounter?.providerId || "",
    providerName: encounter?.providerName || "",
    type: encounter?.type || "office-visit",
    status: encounter?.status || "scheduled",
    date: encounter?.date || new Date().toISOString().slice(0, 16),
    chiefComplaint: encounter?.chiefComplaint || "",
    notes: encounter?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof Encounter, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {encounter ? "Edit Encounter" : "New Encounter"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                value={formData.patientId}
                onChange={(e) => handleChange("patientId", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleChange("patientName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerId">Provider ID</Label>
              <Input
                id="providerId"
                value={formData.providerId}
                onChange={(e) => handleChange("providerId", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input
                id="providerName"
                value={formData.providerName}
                onChange={(e) => handleChange("providerName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                required
              >
                <option value="office-visit">Office Visit</option>
                <option value="telehealth">Telehealth</option>
                <option value="emergency">Emergency</option>
                <option value="hospital">Hospital</option>
                <option value="consultation">Consultation</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date?.slice(0, 16)}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Chief Complaint</Label>
            <Input
              id="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={(e) => handleChange("chiefComplaint", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {encounter ? "Update" : "Create"} Encounter
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
