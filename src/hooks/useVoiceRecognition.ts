"use client";

/**
 * Voice Recognition Hook
 * React hook for speech recognition with medical vocabulary
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSpeechRecognitionService,
  isSpeechRecognitionSupported,
} from "@/lib/voice/speech-recognition";
import {
  VoiceRecognitionConfig,
  VoiceRecognitionResult,
  VoiceRecognitionStatus,
  VoiceRecognitionError,
} from "@/types/voice";

interface UseVoiceRecognitionOptions extends Partial<VoiceRecognitionConfig> {
  onStart?: () => void;
  onStop?: () => void;
  onResult?: (result: VoiceRecognitionResult) => void;
  onFinalResult?: (result: VoiceRecognitionResult) => void;
  onInterimResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: VoiceRecognitionError) => void;
  autoStart?: boolean;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const [status, setStatus] = useState<VoiceRecognitionStatus>(
    VoiceRecognitionStatus.IDLE
  );
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [results, setResults] = useState<VoiceRecognitionResult[]>([]);
  const [error, setError] = useState<VoiceRecognitionError | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionService = useRef(getSpeechRecognitionService(options));
  const isInitialized = useRef(false);

  // Initialize service
  useEffect(() => {
    if (isInitialized.current) return;

    const checkSupport = () => {
      const supported = isSpeechRecognitionSupported();
      setIsSupported(supported);

      if (!supported) {
        setError({
          code: "SERVICE_NOT_ALLOWED" as any,
          message: "Speech recognition not supported in this browser",
          recoverable: false,
        });
      }
    };

    checkSupport();
    isInitialized.current = true;

    const service = recognitionService.current;

    // Setup event listeners
    service.on("start", () => {
      setStatus(VoiceRecognitionStatus.LISTENING);
      options.onStart?.();
    });

    service.on("end", () => {
      setStatus(VoiceRecognitionStatus.IDLE);
      options.onStop?.();
    });

    service.on("statuschange", (newStatus: VoiceRecognitionStatus) => {
      setStatus(newStatus);
    });

    service.on("result", (resultArray: VoiceRecognitionResult[]) => {
      setResults((prev) => [...prev, ...resultArray]);
      resultArray.forEach((result) => {
        options.onResult?.(result);
      });
    });

    service.on("finalresult", (result: VoiceRecognitionResult) => {
      setTranscript((prev) => prev + result.transcript + " ");
      setInterimTranscript("");
      options.onFinalResult?.(result);
    });

    service.on("interimresult", (result: VoiceRecognitionResult) => {
      setInterimTranscript(result.transcript);
      options.onInterimResult?.(result);
    });

    service.on("error", (err: VoiceRecognitionError) => {
      setError(err);
      options.onError?.(err);
    });

    // Auto-start if requested
    if (options.autoStart && supported) {
      service.initialize().then(() => service.start());
    }

    return () => {
      service.destroy();
    };
  }, []);

  // Start recognition
  const start = useCallback(async () => {
    setError(null);
    setResults([]);
    setTranscript("");
    setInterimTranscript("");

    try {
      await recognitionService.current.start();
    } catch (err) {
      setError(err as VoiceRecognitionError);
    }
  }, []);

  // Stop recognition
  const stop = useCallback(() => {
    recognitionService.current.stop();
  }, []);

  // Pause recognition
  const pause = useCallback(() => {
    recognitionService.current.pause();
  }, []);

  // Resume recognition
  const resume = useCallback(async () => {
    try {
      await recognitionService.current.resume();
    } catch (err) {
      setError(err as VoiceRecognitionError);
    }
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setResults([]);
    recognitionService.current.clearTranscript();
  }, []);

  // Update configuration
  const updateConfig = useCallback(
    (newConfig: Partial<VoiceRecognitionConfig>) => {
      recognitionService.current.updateConfig(newConfig);
    },
    []
  );

  // Get audio level (0-100)
  const getAudioLevel = useCallback(() => {
    return recognitionService.current.getAudioLevel();
  }, []);

  return {
    // State
    status,
    transcript,
    interimTranscript,
    results,
    error,
    isSupported,
    isListening: status === VoiceRecognitionStatus.LISTENING,
    isProcessing: status === VoiceRecognitionStatus.PROCESSING,
    isPaused: status === VoiceRecognitionStatus.PAUSED,

    // Methods
    start,
    stop,
    pause,
    resume,
    clearTranscript,
    updateConfig,
    getAudioLevel,
  };
}
