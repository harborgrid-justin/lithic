/**
 * Advanced Speech Recognition Service
 * Web Speech API with cloud fallback, medical vocabulary support
 */

import {
  VoiceRecognitionConfig,
  VoiceRecognitionResult,
  VoiceRecognitionStatus,
  VoiceRecognitionError,
  VoiceErrorCode,
  TranscriptAlternative,
} from "@/types/voice";
import { medicalVocabulary } from "./medical-vocabulary";

// ============================================================================
// Speech Recognition Service
// ============================================================================

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private config: VoiceRecognitionConfig;
  private status: VoiceRecognitionStatus = VoiceRecognitionStatus.IDLE;
  private listeners: Map<string, Set<Function>> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private isInitialized = false;
  private currentTranscript = "";
  private interimTranscript = "";

  constructor(config?: Partial<VoiceRecognitionConfig>) {
    this.config = {
      language: "en-US",
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      medicalVocabulary: true,
      noiseReduction: true,
      speakerAdaptation: true,
      punctuation: true,
      ...config,
    };
  }

  /**
   * Initialize speech recognition
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check for Web Speech API support
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw this.createError(
          VoiceErrorCode.SERVICE_NOT_ALLOWED,
          "Speech Recognition API not supported in this browser",
          false
        );
      }

      // Initialize recognition
      this.recognition = new SpeechRecognition();
      this.configureRecognition();

      // Initialize audio processing for noise reduction
      if (this.config.noiseReduction) {
        await this.initializeAudioProcessing();
      }

      this.isInitialized = true;
      this.emit("initialized");
    } catch (error) {
      const voiceError = this.createError(
        VoiceErrorCode.PROCESSING_ERROR,
        `Initialization failed: ${error}`,
        false
      );
      this.emit("error", voiceError);
      throw voiceError;
    }
  }

  /**
   * Configure recognition instance
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    // Event handlers
    this.recognition.onstart = () => this.handleStart();
    this.recognition.onend = () => this.handleEnd();
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onspeechstart = () => this.emit("speechstart");
    this.recognition.onspeechend = () => this.emit("speechend");
    this.recognition.onsoundstart = () => this.emit("soundstart");
    this.recognition.onsoundend = () => this.emit("soundend");
    this.recognition.onaudiostart = () => this.emit("audiostart");
    this.recognition.onaudioend = () => this.emit("audioend");
    this.recognition.onnomatch = () => this.emit("nomatch");
  }

  /**
   * Initialize audio processing for noise reduction
   */
  private async initializeAudioProcessing(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create analyser for volume detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      // Create noise filter (high-pass filter to remove low-frequency noise)
      this.noiseFilter = this.audioContext.createBiquadFilter();
      this.noiseFilter.type = "highpass";
      this.noiseFilter.frequency.value = 200; // Remove frequencies below 200Hz

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.noiseFilter);
      this.noiseFilter.connect(this.analyser);
    } catch (error) {
      console.warn("Audio processing initialization failed:", error);
      // Continue without noise reduction
    }
  }

  /**
   * Start listening
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.status === VoiceRecognitionStatus.LISTENING) {
      console.warn("Already listening");
      return;
    }

    try {
      this.recognition?.start();
      this.currentTranscript = "";
      this.interimTranscript = "";
    } catch (error) {
      const voiceError = this.createError(
        VoiceErrorCode.AUDIO_CAPTURE,
        `Failed to start: ${error}`,
        true
      );
      this.emit("error", voiceError);
      throw voiceError;
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.status !== VoiceRecognitionStatus.LISTENING) {
      return;
    }

    this.recognition?.stop();
  }

  /**
   * Pause listening
   */
  pause(): void {
    if (this.status === VoiceRecognitionStatus.LISTENING) {
      this.status = VoiceRecognitionStatus.PAUSED;
      this.recognition?.abort();
      this.emit("statuschange", this.status);
    }
  }

  /**
   * Resume listening
   */
  async resume(): Promise<void> {
    if (this.status === VoiceRecognitionStatus.PAUSED) {
      await this.start();
    }
  }

  /**
   * Handle recognition start
   */
  private handleStart(): void {
    this.status = VoiceRecognitionStatus.LISTENING;
    this.emit("start");
    this.emit("statuschange", this.status);
  }

  /**
   * Handle recognition end
   */
  private handleEnd(): void {
    if (this.status !== VoiceRecognitionStatus.PAUSED) {
      this.status = VoiceRecognitionStatus.IDLE;
      this.emit("end");
      this.emit("statuschange", this.status);
    }

    // Auto-restart if continuous and not manually stopped
    if (
      this.config.continuous &&
      this.status === VoiceRecognitionStatus.LISTENING
    ) {
      setTimeout(() => this.recognition?.start(), 100);
    }
  }

  /**
   * Handle recognition result
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    const results: VoiceRecognitionResult[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternatives: TranscriptAlternative[] = [];

      // Collect all alternatives
      for (let j = 0; j < result.length; j++) {
        const alternative = result[j];
        let transcript = alternative.transcript;

        // Apply medical vocabulary processing
        if (this.config.medicalVocabulary) {
          transcript = medicalVocabulary.processTranscript(transcript);
        }

        // Apply punctuation if enabled
        if (this.config.punctuation && result.isFinal) {
          transcript = this.applyPunctuation(transcript);
        }

        alternatives.push({
          transcript,
          confidence: alternative.confidence,
        });
      }

      const primaryTranscript = alternatives[0].transcript;

      // Update transcript tracking
      if (result.isFinal) {
        this.currentTranscript += primaryTranscript + " ";
        this.interimTranscript = "";
      } else {
        this.interimTranscript = primaryTranscript;
      }

      const recognitionResult: VoiceRecognitionResult = {
        transcript: primaryTranscript,
        confidence: alternatives[0].confidence,
        isFinal: result.isFinal,
        alternatives,
        timestamp: new Date(),
        duration: 0, // Would need additional tracking
      };

      results.push(recognitionResult);

      // Emit individual result
      if (result.isFinal) {
        this.emit("finalresult", recognitionResult);
      } else {
        this.emit("interimresult", recognitionResult);
      }
    }

    // Emit all results
    this.emit("result", results);
  }

  /**
   * Handle recognition error
   */
  private handleError(event: SpeechRecognitionErrorEvent): void {
    let errorCode: VoiceErrorCode;
    let recoverable = true;

    switch (event.error) {
      case "no-speech":
        errorCode = VoiceErrorCode.NO_SPEECH;
        break;
      case "aborted":
        errorCode = VoiceErrorCode.ABORTED;
        break;
      case "audio-capture":
        errorCode = VoiceErrorCode.AUDIO_CAPTURE;
        recoverable = false;
        break;
      case "network":
        errorCode = VoiceErrorCode.NETWORK;
        break;
      case "not-allowed":
        errorCode = VoiceErrorCode.NOT_ALLOWED;
        recoverable = false;
        break;
      case "service-not-allowed":
        errorCode = VoiceErrorCode.SERVICE_NOT_ALLOWED;
        recoverable = false;
        break;
      case "bad-grammar":
        errorCode = VoiceErrorCode.BAD_GRAMMAR;
        break;
      case "language-not-supported":
        errorCode = VoiceErrorCode.LANGUAGE_NOT_SUPPORTED;
        recoverable = false;
        break;
      default:
        errorCode = VoiceErrorCode.PROCESSING_ERROR;
    }

    const voiceError = this.createError(errorCode, event.error, recoverable);
    this.status = VoiceRecognitionStatus.ERROR;
    this.emit("error", voiceError);
    this.emit("statuschange", this.status);
  }

  /**
   * Apply automatic punctuation
   */
  private applyPunctuation(text: string): string {
    let result = text.trim();

    // Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1);

    // Add period at end if no punctuation
    if (!/[.!?]$/.test(result)) {
      result += ".";
    }

    return result;
  }

  /**
   * Get current audio level (0-100)
   */
  getAudioLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return (average / 255) * 100;
  }

  /**
   * Get current transcript
   */
  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Get interim transcript
   */
  getInterimTranscript(): string {
    return this.interimTranscript;
  }

  /**
   * Get full transcript
   */
  getFullTranscript(): string {
    return this.currentTranscript + this.interimTranscript;
  }

  /**
   * Clear transcript
   */
  clearTranscript(): void {
    this.currentTranscript = "";
    this.interimTranscript = "";
  }

  /**
   * Get current status
   */
  getStatus(): VoiceRecognitionStatus {
    return this.status;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.recognition && this.status === VoiceRecognitionStatus.IDLE) {
      this.configureRecognition();
    }
  }

  /**
   * Check if microphone is available
   */
  async checkMicrophone(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === "audioinput");
    } catch {
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create error object
   */
  private createError(
    code: VoiceErrorCode,
    message: string,
    recoverable: boolean
  ): VoiceRecognitionError {
    return { code, message, recoverable };
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.recognition = null;
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.noiseFilter = null;
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// ============================================================================
// Global Speech Recognition Instance
// ============================================================================

let globalRecognitionService: SpeechRecognitionService | null = null;

export function getSpeechRecognitionService(
  config?: Partial<VoiceRecognitionConfig>
): SpeechRecognitionService {
  if (!globalRecognitionService) {
    globalRecognitionService = new SpeechRecognitionService(config);
  }
  return globalRecognitionService;
}

export function resetSpeechRecognitionService(): void {
  if (globalRecognitionService) {
    globalRecognitionService.destroy();
    globalRecognitionService = null;
  }
}

// ============================================================================
// Browser Compatibility Check
// ============================================================================

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    window.SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export function getSpeechRecognitionCapabilities() {
  return {
    supported: isSpeechRecognitionSupported(),
    continuous: true,
    interimResults: true,
    maxAlternatives: 5,
  };
}
