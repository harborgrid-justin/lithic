"use client";

/**
 * Voice Activation Button Component
 * Provides voice recognition toggle with visual feedback
 */

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { VoiceRecognitionStatus } from "@/types/voice";

interface VoiceButtonProps {
  status: VoiceRecognitionStatus;
  onStart: () => void;
  onStop: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

export function VoiceButton({
  status,
  onStart,
  onStop,
  variant = "default",
  size = "default",
  showLabel = false,
  className,
  disabled = false,
}: VoiceButtonProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const isListening = status === VoiceRecognitionStatus.LISTENING;
  const isProcessing = status === VoiceRecognitionStatus.PROCESSING;
  const isError = status === VoiceRecognitionStatus.ERROR;

  useEffect(() => {
    // Simulate audio level animation when listening
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening]);

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  const getButtonVariant = () => {
    if (isError) return "destructive";
    if (isListening) return "default";
    return variant;
  };

  const getTooltipText = () => {
    if (disabled) return "Voice recognition not available";
    if (isError) return "Voice recognition error";
    if (isProcessing) return "Processing...";
    if (isListening) return "Click to stop listening";
    return "Click to start voice recognition";
  };

  const getButtonIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isListening) {
      return <Mic className="h-4 w-4" />;
    }
    return <MicOff className="h-4 w-4" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={getButtonVariant()}
            size={size}
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className={cn(
              "relative transition-all",
              isListening && "animate-pulse",
              className
            )}
          >
            <div className="relative">
              {getButtonIcon()}
              {isListening && (
                <div
                  className="absolute inset-0 rounded-full bg-current opacity-20"
                  style={{
                    transform: `scale(${1 + audioLevel / 100})`,
                    transition: "transform 0.1s ease-out",
                  }}
                />
              )}
            </div>
            {showLabel && (
              <span className="ml-2">
                {isListening ? "Listening..." : "Voice"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Floating Voice Button
 * Fixed position button for global voice access
 */

interface FloatingVoiceButtonProps {
  status: VoiceRecognitionStatus;
  onStart: () => void;
  onStop: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

export function FloatingVoiceButton({
  status,
  onStart,
  onStop,
  position = "bottom-right",
  className,
}: FloatingVoiceButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <VoiceButton
        status={status}
        onStart={onStart}
        onStop={onStop}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg"
      />
    </div>
  );
}
