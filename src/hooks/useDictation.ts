"use client";

/**
 * Dictation Hook
 * React hook for clinical dictation with section management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getDictationEngine } from "@/lib/voice/dictation-engine";
import { useAuth } from "./useAuth";
import {
  DictationSession,
  DictationDocumentType,
  DictationStatus,
  DictationSection,
  DictationCommand,
} from "@/types/voice";

interface UseDictationOptions {
  onSessionStart?: (session: DictationSession) => void;
  onSessionEnd?: (session: DictationSession) => void;
  onTranscript?: (data: { transcript: string; isFinal: boolean }) => void;
  onCommand?: (command: DictationCommand) => void;
  onSectionChange?: (section: DictationSection) => void;
  onSave?: (session: DictationSession) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export function useDictation(options: UseDictationOptions = {}) {
  const [session, setSession] = useState<DictationSession | null>(null);
  const [currentSection, setCurrentSection] = useState<DictationSection | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const dictationEngine = useRef(getDictationEngine());
  const isInitialized = useRef(false);

  // Initialize dictation engine
  useEffect(() => {
    if (isInitialized.current) return;

    const engine = dictationEngine.current;

    // Setup event listeners
    engine.on("sessionstarted", (newSession: DictationSession) => {
      setSession(newSession);
      setIsRecording(true);
      options.onSessionStart?.(newSession);
    });

    engine.on("transcript", (data: { transcript: string; isFinal: boolean }) => {
      // Update session state
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev };
      });
      options.onTranscript?.(data);
    });

    engine.on("interimtranscript", (data: { transcript: string; isFinal: boolean }) => {
      options.onTranscript?.(data);
    });

    engine.on("command", (command: DictationCommand) => {
      options.onCommand?.(command);
    });

    engine.on("sectionchange", (section: DictationSection) => {
      setCurrentSection(section);
      options.onSectionChange?.(section);
    });

    engine.on("sectionadded", () => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev };
      });
    });

    engine.on("paused", () => {
      setIsRecording(false);
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, status: DictationStatus.PAUSED };
      });
    });

    engine.on("resumed", () => {
      setIsRecording(true);
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, status: DictationStatus.ACTIVE };
      });
    });

    engine.on("saved", (savedSession: DictationSession) => {
      setSession(savedSession);
      setIsRecording(false);
      options.onSave?.(savedSession);
    });

    engine.on("completed", (completedSession: DictationSession) => {
      setSession(completedSession);
      setIsRecording(false);
      options.onSessionEnd?.(completedSession);
    });

    engine.on("discarded", () => {
      setSession(null);
      setCurrentSection(null);
      setIsRecording(false);
    });

    engine.on("error", (err: any) => {
      setError(err.message || "Dictation error");
      setIsRecording(false);
    });

    isInitialized.current = true;

    return () => {
      engine.destroy();
    };
  }, [options]);

  // Start dictation session
  const startSession = useCallback(
    async (
      documentType: DictationDocumentType,
      patientId?: string,
      encounterId?: string,
      templateId?: string
    ) => {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      setError(null);

      try {
        const newSession = await dictationEngine.current.startSession(
          user.id,
          user.id, // providerId - in real app, would be different
          `${user.firstName} ${user.lastName}`,
          user.specialty || "General Practice",
          user.organizationId,
          documentType,
          patientId,
          encounterId,
          templateId
        );

        setSession(newSession);
        setCurrentSection(newSession.sections[0] || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start dictation");
      }
    },
    [user]
  );

  // Stop dictation
  const stopSession = useCallback(() => {
    dictationEngine.current.complete();
  }, []);

  // Pause dictation
  const pause = useCallback(() => {
    dictationEngine.current.pause();
  }, []);

  // Resume dictation
  const resume = useCallback(async () => {
    try {
      await dictationEngine.current.resume();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume dictation");
    }
  }, []);

  // Save dictation
  const save = useCallback(() => {
    dictationEngine.current.save();
  }, []);

  // Discard dictation
  const discard = useCallback(() => {
    dictationEngine.current.discard();
  }, []);

  // Navigate to section
  const navigateToSection = useCallback((sectionId: string) => {
    const success = dictationEngine.current.navigateToSection(sectionId);
    if (success && session) {
      const section = session.sections.find((s) => s.id === sectionId);
      if (section) {
        setCurrentSection(section);
      }
    }
  }, [session]);

  // Add custom section
  const addSection = useCallback((title: string) => {
    dictationEngine.current.addSection(title);
  }, []);

  // Get session transcript
  const getTranscript = useCallback(() => {
    return session?.transcript || "";
  }, [session]);

  // Get current section content
  const getCurrentSectionContent = useCallback(() => {
    return currentSection?.content || "";
  }, [currentSection]);

  // Get word count
  const getWordCount = useCallback(() => {
    return session?.wordCount || 0;
  }, [session]);

  // Get duration
  const getDuration = useCallback(() => {
    return session?.duration || 0;
  }, [session]);

  return {
    // State
    session,
    currentSection,
    isRecording,
    error,
    isActive: session?.status === DictationStatus.ACTIVE,
    isPaused: session?.status === DictationStatus.PAUSED,
    isCompleted: session?.status === DictationStatus.COMPLETED,
    isSaved: session?.status === DictationStatus.SAVED,

    // Methods
    startSession,
    stopSession,
    pause,
    resume,
    save,
    discard,
    navigateToSection,
    addSection,
    getTranscript,
    getCurrentSectionContent,
    getWordCount,
    getDuration,

    // Computed values
    sections: session?.sections || [],
    wordCount: session?.wordCount || 0,
    duration: session?.duration || 0,
    documentType: session?.documentType,
  };
}
