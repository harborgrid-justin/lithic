"use client";

import { useEffect, useState } from "react";
import { WaitingRoom } from "@/components/telehealth/WaitingRoom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WaitingRoomEntry } from "@/types/telehealth";

export default function WaitingRoomPage() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWaitingRoom();
    const interval = setInterval(loadWaitingRoom, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadWaitingRoom = async () => {
    try {
      // In production, get actual provider ID from auth context
      const providerId = "provider_001";

      const response = await fetch(
        `/api/telehealth/waiting-room?providerId=${providerId}`,
      );
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("Error loading waiting room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitPatient = async (entryId: string) => {
    try {
      await fetch(`/api/telehealth/waiting-room/${entryId}/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admittedBy: "provider_001" }),
      });

      loadWaitingRoom();
    } catch (error) {
      console.error("Error admitting patient:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Virtual Waiting Room</h1>
        <p className="text-gray-600 mt-1">
          Patients waiting for their appointments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waiting Patients</CardTitle>
          <CardDescription>
            {entries.length} {entries.length === 1 ? "patient" : "patients"}{" "}
            waiting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WaitingRoom
            entries={entries}
            onAdmitPatient={handleAdmitPatient}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
