"use client";

/**
 * Ambient Documentation Component
 * Panel for ambient listening and generated clinical notes
 */

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  FileText,
  Check,
  Edit,
  RefreshCw,
  Users,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AmbientSession,
  AmbientStatus,
  SpeakerRole,
} from "@/types/voice";

interface AmbientDocumentationProps {
  session: AmbientSession | null;
  onStart: () => void;
  onStop: () => void;
  onReview: () => void;
  onSign: () => void;
  onSetSpeaker: (speaker: SpeakerRole) => void;
  className?: string;
}

export function AmbientDocumentation({
  session,
  onStart,
  onStop,
  onReview,
  onSign,
  onSetSpeaker,
  className,
}: AmbientDocumentationProps) {
  const [activeTab, setActiveTab] = useState("transcript");

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = () => {
    if (!session) return null;

    const statusConfig = {
      [AmbientStatus.RECORDING]: { label: "Recording", variant: "default" as const },
      [AmbientStatus.PROCESSING]: { label: "Processing", variant: "secondary" as const },
      [AmbientStatus.READY_FOR_REVIEW]: { label: "Ready for Review", variant: "default" as const },
      [AmbientStatus.REVIEWED]: { label: "Reviewed", variant: "default" as const },
      [AmbientStatus.SIGNED]: { label: "Signed", variant: "default" as const },
      [AmbientStatus.ERROR]: { label: "Error", variant: "destructive" as const },
    };

    const config = statusConfig[session.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!session) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Ambient Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Automatically capture and document provider-patient conversations
            with AI-generated clinical notes.
          </p>
          <Button onClick={onStart} className="w-full" size="lg">
            <Mic className="mr-2 h-4 w-4" />
            Start Ambient Listening
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Ambient Documentation
          </CardTitle>
          {getStatusBadge()}
        </div>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {formatDuration(session.duration)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Buttons */}
        {session.status === AmbientStatus.RECORDING && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={onStop}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            </div>

            {/* Speaker Selection */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onSetSpeaker(SpeakerRole.PROVIDER)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <User className="mr-2 h-4 w-4" />
                Provider
              </Button>
              <Button
                onClick={() => onSetSpeaker(SpeakerRole.PATIENT)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" />
                Patient
              </Button>
            </div>
          </div>
        )}

        {session.status === AmbientStatus.PROCESSING && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Processing conversation and generating clinical note...
              </p>
            </div>
          </div>
        )}

        {session.status === AmbientStatus.READY_FOR_REVIEW && (
          <div className="flex items-center gap-2">
            <Button
              onClick={onReview}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Review & Edit
            </Button>
          </div>
        )}

        {session.status === AmbientStatus.REVIEWED && (
          <div className="flex items-center gap-2">
            <Button
              onClick={onSign}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Sign Note
            </Button>
          </div>
        )}

        <Separator />

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="note">Clinical Note</TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-4">
            <ScrollArea className="h-[400px]">
              {session.speakerDiarization.length > 0 ? (
                <div className="space-y-3">
                  {session.speakerDiarization.map((segment, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            segment.speaker === SpeakerRole.PROVIDER
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {segment.speaker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(segment.startTime / 1000)}s
                        </span>
                      </div>
                      <p className="text-sm pl-4">{segment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No transcript yet. Start recording...
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="note" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 text-sm">
                {session.clinicalNote.chiefComplaint && (
                  <div>
                    <h4 className="font-semibold mb-1">Chief Complaint</h4>
                    <p className="text-muted-foreground">
                      {session.clinicalNote.chiefComplaint}
                    </p>
                  </div>
                )}

                {session.clinicalNote.historyPresentIllness && (
                  <div>
                    <h4 className="font-semibold mb-1">
                      History of Present Illness
                    </h4>
                    <p className="text-muted-foreground">
                      {session.clinicalNote.historyPresentIllness}
                    </p>
                  </div>
                )}

                {session.clinicalNote.physicalExam?.vitals && (
                  <div>
                    <h4 className="font-semibold mb-1">Vital Signs</h4>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      {session.clinicalNote.physicalExam.vitals.bloodPressureSystolic && (
                        <div>
                          BP:{" "}
                          {session.clinicalNote.physicalExam.vitals.bloodPressureSystolic}
                          /
                          {session.clinicalNote.physicalExam.vitals.bloodPressureDiastolic}
                        </div>
                      )}
                      {session.clinicalNote.physicalExam.vitals.heartRate && (
                        <div>
                          HR: {session.clinicalNote.physicalExam.vitals.heartRate}
                        </div>
                      )}
                      {session.clinicalNote.physicalExam.vitals.temperature && (
                        <div>
                          Temp: {session.clinicalNote.physicalExam.vitals.temperature}°
                          {session.clinicalNote.physicalExam.vitals.temperatureUnit}
                        </div>
                      )}
                      {session.clinicalNote.physicalExam.vitals.respiratoryRate && (
                        <div>
                          RR:{" "}
                          {session.clinicalNote.physicalExam.vitals.respiratoryRate}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {session.clinicalNote.assessment && session.clinicalNote.assessment.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Assessment</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {session.clinicalNote.assessment.map((assess, index) => (
                        <li key={index}>{assess.diagnosis}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.clinicalNote.plan && session.clinicalNote.plan.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Plan</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {session.clinicalNote.plan.map((planItem, index) => (
                        <li key={index}>{planItem.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!session.clinicalNote.chiefComplaint && (
                  <p className="text-muted-foreground italic">
                    Clinical note will be generated when recording is complete.
                  </p>
                )}

                {session.clinicalNote.confidence !== undefined && (
                  <div className="mt-4 pt-4 border-t">
                    <Badge variant="outline">
                      {Math.round(session.clinicalNote.confidence * 100)}%
                      Confidence
                    </Badge>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
