"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonitorUp, X } from "lucide-react";

interface ScreenShareProps {
  stream: MediaStream;
  onStopSharing: () => void;
}

export function ScreenShare({ stream, onStopSharing }: ScreenShareProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative h-full bg-black">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Badge variant="default" className="flex items-center gap-1">
          <MonitorUp className="h-3 w-3" />
          Screen Sharing
        </Badge>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="destructive"
          size="sm"
          onClick={onStopSharing}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Stop Sharing
        </Button>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}
