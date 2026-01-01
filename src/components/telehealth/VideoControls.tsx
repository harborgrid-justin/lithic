"use client";

import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Settings,
  MessageSquare,
} from "lucide-react";

interface VideoControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export function VideoControls({
  audioEnabled,
  videoEnabled,
  screenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant={audioEnabled ? "default" : "destructive"}
        size="lg"
        className="rounded-full w-14 h-14"
        onClick={onToggleAudio}
        title={audioEnabled ? "Mute" : "Unmute"}
      >
        {audioEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      <Button
        variant={videoEnabled ? "default" : "destructive"}
        size="lg"
        className="rounded-full w-14 h-14"
        onClick={onToggleVideo}
        title={videoEnabled ? "Stop Video" : "Start Video"}
      >
        {videoEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      <Button
        variant={screenSharing ? "default" : "outline"}
        size="lg"
        className="rounded-full w-14 h-14"
        onClick={onToggleScreenShare}
        title={screenSharing ? "Stop Sharing" : "Share Screen"}
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="rounded-full w-14 h-14"
        title="Chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="rounded-full w-14 h-14"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Button
        variant="danger"
        size="lg"
        className="rounded-full w-14 h-14 ml-4"
        onClick={onEndCall}
        title="End Call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
