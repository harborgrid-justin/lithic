"use client";

/**
 * Voice Command Overlay Component
 * Visual feedback for voice commands and recognition status
 */

import React, { useState, useEffect } from "react";
import { Mic, Volume2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  VoiceCommandMatch,
  VoiceRecognitionStatus,
} from "@/types/voice";

interface VoiceCommandOverlayProps {
  isVisible: boolean;
  status: VoiceRecognitionStatus;
  transcript?: string;
  interimTranscript?: string;
  commandMatch?: VoiceCommandMatch | null;
  commandResult?: { success: boolean; message: string } | null;
  suggestions?: string[];
  className?: string;
}

export function VoiceCommandOverlay({
  isVisible,
  status,
  transcript = "",
  interimTranscript = "",
  commandMatch,
  commandResult,
  suggestions = [],
  className,
}: VoiceCommandOverlayProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (commandResult) {
      // Auto-hide result after 3 seconds
      const timer = setTimeout(() => {
        setFadeOut(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setFadeOut(false);
    }
  }, [commandResult]);

  if (!isVisible) return null;

  const isListening = status === VoiceRecognitionStatus.LISTENING;
  const isProcessing = status === VoiceRecognitionStatus.PROCESSING;

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg transition-all duration-300",
        fadeOut && "opacity-0",
        className
      )}
    >
      <Card className="shadow-lg border-2">
        <div className="p-4 space-y-3">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full",
                isListening && "bg-red-500 animate-pulse",
                isProcessing && "bg-blue-500",
                !isListening && !isProcessing && "bg-gray-500"
              )}
            >
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {isListening && "Listening..."}
                {isProcessing && "Processing..."}
                {!isListening && !isProcessing && "Voice Command"}
              </h3>
              {isListening && (
                <p className="text-sm text-muted-foreground">
                  Speak your command
                </p>
              )}
            </div>
            {commandMatch && (
              <Badge variant="default">
                {Math.round(commandMatch.confidence * 100)}% confident
              </Badge>
            )}
          </div>

          {/* Transcript Display */}
          {(transcript || interimTranscript) && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground italic">
                    {" "}
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Command Match */}
          {commandMatch && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Volume2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    {commandMatch.command.command}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {commandMatch.command.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Command Result */}
          {commandResult && (
            <div
              className={cn(
                "p-3 rounded-lg border",
                commandResult.success
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
              )}
            >
              <div className="flex items-start gap-2">
                {commandResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      commandResult.success
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    )}
                  >
                    {commandResult.success ? "Success" : "Error"}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      commandResult.success
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    )}
                  >
                    {commandResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && isListening && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>Try saying:</span>
              </div>
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-muted/50 rounded text-xs hover:bg-muted cursor-pointer transition-colors"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Simple Voice Feedback Toast
 */

interface VoiceFeedbackToastProps {
  message: string;
  type?: "info" | "success" | "error" | "warning";
  duration?: number;
  onClose?: () => void;
}

export function VoiceFeedbackToast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: VoiceFeedbackToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    info: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  const typeIcons = {
    info: <Volume2 className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    warning: <HelpCircle className="h-4 w-4" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className={cn("px-4 py-3 rounded-lg shadow-lg flex items-center gap-2", typeStyles[type])}>
        {typeIcons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
