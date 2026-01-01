'use client';

/**
 * VideoCall Component
 * Video call UI with controls and participant grid
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Users,
  Settings,
} from 'lucide-react';
import { VideoCall as VideoCallType, CallParticipant } from '@/types/communication';
import { useCommunicationStore } from '@/stores/communication-store';
import { getTelehealthManager } from '@/lib/realtime/telehealth';

interface VideoCallProps {
  callId: string;
  onEndCall?: () => void;
}

export function VideoCall({ callId, onEndCall }: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const { activeCalls } = useCommunicationStore();
  const call = Array.from(activeCalls.values()).find((c) => c.id === callId);
  const telehealth = getTelehealthManager();

  // Setup local video stream
  useEffect(() => {
    const stream = telehealth.getLocalMediaStream();
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [telehealth]);

  const handleToggleMute = () => {
    telehealth.toggleAudio(callId);
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    telehealth.toggleVideo(callId);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      await telehealth.stopScreenShare(callId);
    } else {
      await telehealth.startScreenShare(callId);
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const handleEndCall = async () => {
    await telehealth.endCall(callId);
    onEndCall?.();
  };

  if (!call) {
    return null;
  }

  return (
    <div className="relative flex h-full flex-col bg-black">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-semibold">Video Call</h2>
            <p className="text-sm opacity-80">
              {call.participants.length} participant{call.participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="secondary" className="bg-red-500">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
            Recording
          </Badge>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="grid h-full w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Local video */}
          <div className="relative overflow-hidden rounded-lg bg-gray-900">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
              You
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-white">
                  You
                </div>
              </div>
            )}
          </div>

          {/* Remote participants */}
          {call.participants.map((participant: CallParticipant) => (
            <div
              key={participant.userId}
              className="relative overflow-hidden rounded-lg bg-gray-900"
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideosRef.current.set(participant.userId, el);
                  }
                }}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
                {participant.userName}
              </div>
              {!participant.isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-white">
                    {participant.userName[0]}
                  </div>
                </div>
              )}
              {participant.isMuted && (
                <div className="absolute right-2 top-2 rounded-full bg-red-500 p-2">
                  <MicOff className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="h-14 w-14 rounded-full"
            onClick={handleToggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            size="lg"
            variant={!isVideoEnabled ? 'destructive' : 'secondary'}
            className="h-14 w-14 rounded-full"
            onClick={handleToggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            size="lg"
            variant={isScreenSharing ? 'default' : 'secondary'}
            className="h-14 w-14 rounded-full"
            onClick={handleScreenShare}
          >
            <MonitorUp className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            variant="danger"
            className="h-16 w-16 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full"
          >
            <Users className="h-6 w-6" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
