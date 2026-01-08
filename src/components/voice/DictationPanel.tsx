"use client";

/**
 * Dictation Panel Component
 * Clinical dictation interface with section navigation and real-time transcription
 */

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Save,
  Trash2,
  Pause,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DictationSession,
  DictationStatus,
  DictationSection,
  DictationDocumentType,
} from "@/types/voice";

interface DictationPanelProps {
  session: DictationSession | null;
  onStart: (documentType: DictationDocumentType) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onSectionChange: (sectionId: string) => void;
  currentSection: DictationSection | null;
  className?: string;
}

export function DictationPanel({
  session,
  onStart,
  onStop,
  onPause,
  onResume,
  onSave,
  onDiscard,
  onSectionChange,
  currentSection,
  className,
}: DictationPanelProps) {
  const [selectedDocType, setSelectedDocType] =
    useState<DictationDocumentType>(DictationDocumentType.PROGRESS_NOTE);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Auto-expand current section
    if (currentSection) {
      setExpandedSections((prev) => new Set(prev).add(currentSection.id));
    }
  }, [currentSection]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getStatusBadge = () => {
    if (!session) return null;

    const statusConfig = {
      [DictationStatus.ACTIVE]: { label: "Recording", variant: "default" as const },
      [DictationStatus.PAUSED]: { label: "Paused", variant: "secondary" as const },
      [DictationStatus.COMPLETED]: { label: "Completed", variant: "default" as const },
      [DictationStatus.SAVED]: { label: "Saved", variant: "default" as const },
      [DictationStatus.SIGNED]: { label: "Signed", variant: "default" as const },
      [DictationStatus.DISCARDED]: { label: "Discarded", variant: "destructive" as const },
    };

    const config = statusConfig[session.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!session) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clinical Dictation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select
              value={selectedDocType}
              onValueChange={(value) =>
                setSelectedDocType(value as DictationDocumentType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DictationDocumentType.PROGRESS_NOTE}>
                  Progress Note
                </SelectItem>
                <SelectItem value={DictationDocumentType.SOAP_NOTE}>
                  SOAP Note
                </SelectItem>
                <SelectItem value={DictationDocumentType.HISTORY_PHYSICAL}>
                  History & Physical
                </SelectItem>
                <SelectItem value={DictationDocumentType.OPERATIVE_NOTE}>
                  Operative Note
                </SelectItem>
                <SelectItem value={DictationDocumentType.DISCHARGE_SUMMARY}>
                  Discharge Summary
                </SelectItem>
                <SelectItem value={DictationDocumentType.CONSULTATION}>
                  Consultation
                </SelectItem>
                <SelectItem value={DictationDocumentType.RADIOLOGY_REPORT}>
                  Radiology Report
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => onStart(selectedDocType)}
            className="w-full"
            size="lg"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Dictation
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
            <FileText className="h-5 w-5" />
            Clinical Dictation
          </CardTitle>
          {getStatusBadge()}
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(session.duration)}
          </div>
          <div className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            {session.wordCount} words
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {session.status === DictationStatus.ACTIVE && (
            <>
              <Button
                onClick={onPause}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={onStop}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {session.status === DictationStatus.PAUSED && (
            <>
              <Button
                onClick={onResume}
                variant="default"
                size="sm"
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button
                onClick={onStop}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MicOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {(session.status === DictationStatus.COMPLETED ||
            session.status === DictationStatus.SAVED) && (
            <>
              <Button
                onClick={onSave}
                variant="default"
                size="sm"
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={onDiscard}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Sections */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {session.sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              const isCurrent = currentSection?.id === section.id;

              return (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {section.content.split(/\s+/).filter((w) => w).length} words
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      )}
                      onClick={() => onSectionChange(section.id)}
                    >
                      {section.content ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {section.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No content yet. Start dictating...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
