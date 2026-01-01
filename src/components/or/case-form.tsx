"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CaseForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [formData, setFormData] = useState({
    patientId: "",
    surgeonId: "",
    procedureId: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: "",
    roomId: "",
    priority: "ELECTIVE",
    anesthesiaType: "GENERAL",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Schedule Surgical Case</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Patient</Label>
            <Input
              placeholder="Search patient..."
              value={formData.patientId}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Surgeon</Label>
            <Select
              value={formData.surgeonId}
              onValueChange={(value) =>
                setFormData({ ...formData, surgeonId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select surgeon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surgeon1">Dr. Smith</SelectItem>
                <SelectItem value="surgeon2">Dr. Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Procedure</Label>
            <Select
              value={formData.procedureId}
              onValueChange={(value) =>
                setFormData({ ...formData, procedureId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select procedure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proc1">Total Knee Replacement</SelectItem>
                <SelectItem value="proc2">Hip Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>OR Room</Label>
            <Select
              value={formData.roomId}
              onValueChange={(value) =>
                setFormData({ ...formData, roomId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room1">OR 1</SelectItem>
                <SelectItem value="room2">OR 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledTime: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDuration: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ELECTIVE">Elective</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="EMERGENT">Emergent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" className="w-full">
          Schedule Case
        </Button>
      </form>
    </Card>
  );
}
