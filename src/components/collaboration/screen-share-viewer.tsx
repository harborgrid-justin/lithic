/**
 * Screen Share Viewer Component
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, X } from "lucide-react";

interface ScreenShareViewerProps {
  stream: MediaStream;
  userName: string;
  onClose: () => void;
}

export function ScreenShareViewer({
  stream,
  userName,
  onClose,
}: ScreenShareViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between bg-gray-900 p-4">
          <h2 className="text-lg font-semibold text-white">
            {userName} is sharing their screen
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-h-full max-w-full"
          />
        </div>
      </div>
    </div>
  );
}
