"use client";

/**
 * Transcription Viewer Component
 * Live transcription display with timestamps and confidence scores
 */

import React, { useEffect, useRef } from "react";
import { MessageSquare, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { VoiceRecognitionResult } from "@/types/voice";

interface TranscriptionViewerProps {
  results: VoiceRecognitionResult[];
  interimTranscript?: string;
  showTimestamps?: boolean;
  showConfidence?: boolean;
  autoScroll?: boolean;
  className?: string;
}

export function TranscriptionViewer({
  results,
  interimTranscript = "",
  showTimestamps = true,
  showConfidence = true,
  autoScroll = true,
  className,
}: TranscriptionViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results, interimTranscript, autoScroll]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.7) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Live Transcription
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea ref={scrollRef} className="h-[500px]">
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg",
                  result.confidence >= 0.9
                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                    : result.confidence >= 0.7
                    ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                )}
              >
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {showTimestamps && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(result.timestamp)}
                        </div>
                      )}
                      {showConfidence && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getConfidenceColor(result.confidence)
                          )}
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          {getConfidenceLabel(result.confidence)}
                        </Badge>
                      )}
                    </div>
                    {result.isFinal && (
                      <Badge variant="default" className="text-xs">
                        Final
                      </Badge>
                    )}
                  </div>

                  {/* Transcript */}
                  <p className="text-sm leading-relaxed">{result.transcript}</p>

                  {/* Confidence Bar */}
                  {showConfidence && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Confidence
                        </span>
                        <span className={getConfidenceColor(result.confidence)}>
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={result.confidence * 100}
                        className="h-1"
                      />
                    </div>
                  )}

                  {/* Alternatives */}
                  {result.alternatives &&
                    result.alternatives.length > 1 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          {result.alternatives.length - 1} alternative
                          {result.alternatives.length > 2 ? "s" : ""}
                        </summary>
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                          {result.alternatives.slice(1).map((alt, altIndex) => (
                            <div
                              key={altIndex}
                              className="text-xs text-muted-foreground"
                            >
                              <span className="font-medium">
                                {Math.round(alt.confidence * 100)}%:
                              </span>{" "}
                              {alt.transcript}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                </div>
              </div>
            ))}

            {/* Interim Transcript */}
            {interimTranscript && (
              <div className="p-3 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {interimTranscript}
                </p>
              </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !interimTranscript && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No transcription yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start speaking to see live transcription
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Stats */}
        {results.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{results.length}</p>
                <p className="text-xs text-muted-foreground">Segments</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {results
                    .reduce((acc, r) => acc + r.transcript.split(/\s+/).length, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {Math.round(
                    (results.reduce((acc, r) => acc + r.confidence, 0) /
                      results.length) *
                      100
                  )}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Transcription Display
 */

interface CompactTranscriptionProps {
  currentTranscript: string;
  interimTranscript?: string;
  className?: string;
}

export function CompactTranscription({
  currentTranscript,
  interimTranscript = "",
  className,
}: CompactTranscriptionProps) {
  return (
    <div className={cn("p-4 bg-muted rounded-lg", className)}>
      <div className="flex items-start gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          {currentTranscript && (
            <p className="text-sm leading-relaxed">{currentTranscript}</p>
          )}
          {interimTranscript && (
            <p className="text-sm text-muted-foreground italic mt-1">
              {interimTranscript}
            </p>
          )}
          {!currentTranscript && !interimTranscript && (
            <p className="text-sm text-muted-foreground italic">
              Listening...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
