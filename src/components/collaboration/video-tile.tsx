/**
 * Video Tile Component
 * Individual participant video display
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface VideoTileProps {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isLocal?: boolean;
}

export function VideoTile({
  userId,
  userName,
  stream,
  audioEnabled,
  videoEnabled,
  isLocal = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
      {videoEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-2xl">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {userName} {isLocal && "(You)"}
          </span>
          <div className="flex gap-2">
            {!audioEnabled && (
              <div className="rounded-full bg-red-500 p-1">
                <MicOff className="h-4 w-4 text-white" />
              </div>
            )}
            {!videoEnabled && (
              <div className="rounded-full bg-red-500 p-1">
                <VideoOff className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
