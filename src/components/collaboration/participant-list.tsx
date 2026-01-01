/**
 * Participant List Component
 * Displays all meeting participants with actions
 */

"use client";

import React from "react";
import { Participant } from "@/lib/collaboration/video/room-manager";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Mic, MicOff, Video, VideoOff, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  onClose: () => void;
}

export function ParticipantList({
  participants,
  currentUserId,
  onClose,
}: ParticipantListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-white">
          Participants ({participants.length})
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-800"
            >
              <Avatar>
                <AvatarFallback>
                  {participant.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {participant.userName}
                  {participant.userId === currentUserId && " (You)"}
                </p>
                <p className="text-xs text-gray-400">{participant.role}</p>
              </div>

              <div className="flex gap-1">
                {participant.audioEnabled ? (
                  <Mic className="h-4 w-4 text-gray-400" />
                ) : (
                  <MicOff className="h-4 w-4 text-red-500" />
                )}
                {participant.videoEnabled ? (
                  <Video className="h-4 w-4 text-gray-400" />
                ) : (
                  <VideoOff className="h-4 w-4 text-red-500" />
                )}
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
