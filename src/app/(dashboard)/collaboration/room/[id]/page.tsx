/**
 * Video Room Page
 * Individual video conference room
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoRoom } from "@/components/collaboration/video-room";
import { Room } from "@/lib/collaboration/video/room-manager";

export default function VideoRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [params.id]);

  const loadRoom = async () => {
    try {
      const response = await fetch(`/api/collaboration/rooms/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setRoom(data.data.room);
      }
    } catch (error) {
      console.error("Error loading room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    router.push("/collaboration");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Room not found</h1>
          <p className="mt-2 text-gray-600">
            The room you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/collaboration")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Collaboration Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoRoom
      room={room}
      currentUserId="current-user-id" // Should come from auth
      currentUserName="Current User" // Should come from auth
      onLeave={handleLeave}
    />
  );
}
