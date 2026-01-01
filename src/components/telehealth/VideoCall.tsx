"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { VideoControls } from "./VideoControls";
import { ScreenShare } from "./ScreenShare";
import { MediaManager } from "@/lib/webrtc/media-manager";
import { PeerConnectionManager } from "@/lib/webrtc/peer-connection";
import { ConnectionStatus } from "@/types/telehealth";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCallProps {
  sessionId: string;
  onEndCall: () => void;
  patientName: string;
  providerName: string;
}

export function VideoCall({
  sessionId,
  onEndCall,
  patientName,
  providerName,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const mediaManagerRef = useRef<MediaManager | null>(null);
  const peerConnectionRef = useRef<PeerConnectionManager | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("CONNECTING");
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (screenStream && screenShareRef.current) {
      screenShareRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mediaManagerRef.current) {
        const level = mediaManagerRef.current.getAudioLevel();
        setAudioLevel(level);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const initializeMedia = async () => {
    try {
      const mediaManager = new MediaManager();
      mediaManagerRef.current = mediaManager;

      const stream = await mediaManager.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setLocalStream(stream);
      setConnectionStatus("CONNECTED");

      initializePeerConnection(stream);
    } catch (error: any) {
      console.error("Error initializing media:", error);
      setConnectionStatus("FAILED");
    }
  };

  const initializePeerConnection = async (stream: MediaStream) => {
    const peerConnection = new PeerConnectionManager({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      onIceCandidate: (candidate) => {
        sendSignalingMessage({
          type: "ICE_CANDIDATE",
          data: candidate.toJSON(),
        });
      },
      onTrack: (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      },
      onConnectionStateChange: (state) => {
        if (state === "connected") {
          setConnectionStatus("CONNECTED");
        } else if (state === "disconnected") {
          setConnectionStatus("RECONNECTING");
        } else if (state === "failed") {
          setConnectionStatus("FAILED");
        }
      },
    });

    await peerConnection.initialize();
    peerConnection.addLocalStream(stream);

    peerConnectionRef.current = peerConnection;
  };

  const sendSignalingMessage = async (message: any) => {
    try {
      await fetch("/api/telehealth/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          from: "current-user",
          to: null,
          ...message,
        }),
      });
    } catch (error) {
      console.error("Error sending signaling message:", error);
    }
  };

  const handleToggleAudio = () => {
    if (mediaManagerRef.current) {
      const enabled = mediaManagerRef.current.toggleAudio();
      setAudioEnabled(enabled);
    }
  };

  const handleToggleVideo = () => {
    if (mediaManagerRef.current) {
      const enabled = mediaManagerRef.current.toggleVideo();
      setVideoEnabled(enabled);
    }
  };

  const handleStartScreenShare = async () => {
    if (mediaManagerRef.current) {
      try {
        const stream = await mediaManagerRef.current.startScreenShare();
        setScreenStream(stream);

        if (peerConnectionRef.current && stream.getVideoTracks()[0]) {
          peerConnectionRef.current.replaceVideoTrack(
            stream.getVideoTracks()[0],
          );
        }
      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    }
  };

  const handleStopScreenShare = () => {
    if (mediaManagerRef.current) {
      mediaManagerRef.current.stopScreenShare();
      setScreenStream(null);

      if (peerConnectionRef.current && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionRef.current.replaceVideoTrack(videoTrack);
        }
      }
    }
  };

  const cleanup = () => {
    if (mediaManagerRef.current) {
      mediaManagerRef.current.stopAllStreams();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const getConnectionBadge = () => {
    const config = {
      CONNECTING: {
        variant: "secondary" as const,
        icon: Wifi,
        text: "Connecting...",
      },
      CONNECTED: { variant: "default" as const, icon: Wifi, text: "Connected" },
      RECONNECTING: {
        variant: "secondary" as const,
        icon: Wifi,
        text: "Reconnecting...",
      },
      DISCONNECTED: {
        variant: "destructive" as const,
        icon: WifiOff,
        text: "Disconnected",
      },
      FAILED: {
        variant: "destructive" as const,
        icon: WifiOff,
        text: "Connection Failed",
      },
    };

    const { variant, icon: Icon, text } = config[connectionStatus];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  return (
    <Card className="h-full bg-black border-gray-800">
      <div className="relative h-full flex flex-col">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {getConnectionBadge()}
          <Badge
            variant="outline"
            className="bg-black/50 text-white border-white/20"
          >
            {providerName}
          </Badge>
        </div>

        <div className="flex-1 relative">
          {screenStream ? (
            <ScreenShare
              stream={screenStream}
              onStopSharing={handleStopScreenShare}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full p-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {localStream && videoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="bg-gray-800 rounded-full p-8 mx-auto w-32 h-32 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-600" />
                      </div>
                      <p className="text-white mt-4">You (Camera Off)</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-black/50 text-white border-white/20"
                  >
                    You
                  </Badge>
                  {audioEnabled && (
                    <div className="bg-black/50 px-2 py-1 rounded flex items-center gap-1">
                      <Mic className="h-3 w-3 text-white" />
                      <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="bg-gray-800 rounded-full p-8 mx-auto w-32 h-32 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-600" />
                      </div>
                      <p className="text-white mt-4">{patientName}</p>
                      <p className="text-gray-500 text-sm">
                        Waiting to connect...
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 left-4">
                  <Badge
                    variant="outline"
                    className="bg-black/50 text-white border-white/20"
                  >
                    {patientName}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <VideoControls
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            screenSharing={screenStream !== null}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={
              screenStream ? handleStopScreenShare : handleStartScreenShare
            }
            onEndCall={onEndCall}
          />
        </div>
      </div>
    </Card>
  );
}
