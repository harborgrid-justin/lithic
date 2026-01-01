"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { VideoCall } from "@/components/telehealth/VideoCall";
import { VirtualExamRoom } from "@/components/telehealth/VirtualExamRoom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TelehealthSession } from "@/types/telehealth";
import { PhoneOff, AlertCircle } from "lucide-react";

export default function VideoRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<TelehealthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/telehealth/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error("Session not found");
      }

      const data = await response.json();
      setSession(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!session) return;

    try {
      await fetch(`/api/telehealth/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      setCallEnded(true);

      setTimeout(() => {
        router.push("/telehealth");
      }, 3000);
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Card className="max-w-md p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "The session you are trying to join does not exist."}
            </p>
            <Button onClick={() => router.push("/telehealth")}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Card className="max-w-md p-6">
          <div className="text-center">
            <PhoneOff className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Call Ended</h2>
            <p className="text-gray-600 mb-4">
              The telehealth session has ended. Redirecting...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 flex gap-4 p-4">
        <div className="flex-1">
          <VideoCall
            sessionId={session.id}
            onEndCall={handleEndCall}
            patientName={session.patientName}
            providerName={session.providerName}
          />
        </div>
        <div className="w-96">
          <VirtualExamRoom
            sessionId={session.id}
            patientId={session.patientId}
          />
        </div>
      </div>
    </div>
  );
}
