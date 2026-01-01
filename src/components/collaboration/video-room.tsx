/**
 * Video Conference Room Component
 * Main video room interface with participant grid and controls
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { WebRTCClient } from "@/lib/collaboration/video/webrtc-client";
import { Room, Participant } from "@/lib/collaboration/video/room-manager";
import { VideoTile } from "./video-tile";
import { ParticipantList } from "./participant-list";
import { ChatPanel } from "./chat-panel";
import { ScreenShareViewer } from "./screen-share-viewer";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  Users,
  MessageSquare,
  Settings,
  MoreVertical,
} from "lucide-react";

interface VideoRoomProps {
  room: Room;
  currentUserId: string;
  currentUserName: string;
  onLeave: () => void;
}

export function VideoRoom({
  room,
  currentUserId,
  currentUserName,
  onLeave,
}: VideoRoomProps) {
  const [webrtcClient, setWebrtcClient] = useState<WebRTCClient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeWebRTC();

    return () => {
      cleanup();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      const client = new WebRTCClient({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
            ],
          },
        ],
        signalingUrl: process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:3001",
        roomId: room.id,
        userId: currentUserId,
        userName: currentUserName,
      });

      await client.initialize();

      // Start local media
      const stream = await client.startLocalStream({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Handle remote tracks
      client.on("track:added", ({ userId, track }: any) => {
        // Get or create remote stream for this user
        const existingStream = remoteStreams.get(userId);
        if (existingStream) {
          existingStream.addTrack(track);
        } else {
          const newStream = new MediaStream([track]);
          setRemoteStreams((prev) => new Map(prev).set(userId, newStream));
        }
      });

      // Handle user left
      client.on("user:left", ({ userId }: any) => {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      setWebrtcClient(client);
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
    }
  };

  const cleanup = async () => {
    if (webrtcClient) {
      await webrtcClient.leave();
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
  };

  const toggleAudio = () => {
    if (webrtcClient) {
      const enabled = webrtcClient.toggleAudio();
      setAudioEnabled(enabled);
    }
  };

  const toggleVideo = () => {
    if (webrtcClient) {
      const enabled = webrtcClient.toggleVideo();
      setVideoEnabled(enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!webrtcClient) return;

    try {
      if (isScreenSharing) {
        await webrtcClient.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await webrtcClient.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const handleLeave = async () => {
    await cleanup();
    onLeave();
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{room.name}</h1>
          <p className="text-sm text-gray-400">
            {participants.length} {participants.length === 1 ? "participant" : "participants"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowParticipants(!showParticipants)}
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Local Video */}
            <VideoTile
              userId={currentUserId}
              userName={currentUserName}
              stream={localStream}
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
              isLocal
            />

            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <VideoTile
                key={userId}
                userId={userId}
                userName={userId} // Should get from participant data
                stream={stream}
                audioEnabled={true}
                videoEnabled={true}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {showParticipants && (
          <div className="w-80 border-l border-gray-800 bg-gray-950">
            <ParticipantList
              participants={participants}
              currentUserId={currentUserId}
              onClose={() => setShowParticipants(false)}
            />
          </div>
        )}

        {showChat && (
          <div className="w-80 border-l border-gray-800 bg-gray-950">
            <ChatPanel
              roomId={room.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 border-t border-gray-800 bg-gray-950 px-6 py-4">
        <Button
          variant={audioEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleAudio}
          className="h-12 w-12 rounded-full"
        >
          {audioEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant={videoEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleVideo}
          className="h-12 w-12 rounded-full"
        >
          {videoEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant={isScreenSharing ? "secondary" : "default"}
          size="icon"
          onClick={toggleScreenShare}
          className="h-12 w-12 rounded-full"
        >
          {isScreenSharing ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={() => setShowChat(!showChat)}
          className="h-12 w-12 rounded-full"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        <div className="mx-4 h-8 w-px bg-gray-700" />

        <Button
          variant="destructive"
          size="icon"
          onClick={handleLeave}
          className="h-12 w-12 rounded-full"
        >
          <Phone className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
