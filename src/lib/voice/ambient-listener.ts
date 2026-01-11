/**
 * Ambient Documentation Listener
 * Captures provider-patient conversations and generates clinical documentation
 */

import {
  AmbientSession,
  AmbientStatus,
  SpeakerSegment,
  SpeakerRole,
  ClinicalNote,
  AmbientMetadata,
  VitalSigns,
  Assessment,
  Plan,
  PlanCategory,
} from "@/types/voice";
import { getSpeechRecognitionService } from "./speech-recognition";
import { VoiceRecognitionResult } from "@/types/voice";

// ============================================================================
// Ambient Listener Configuration
// ============================================================================

interface AmbientConfig {
  speakerDiarization: boolean;
  realTimeProcessing: boolean;
  noiseReduction: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  minConfidence: number;
}

// ============================================================================
// Ambient Listener Service
// ============================================================================

export class AmbientListener {
  private session: AmbientSession | null = null;
  private recognition = getSpeechRecognitionService({
    continuous: true,
    interimResults: true,
    medicalVocabulary: true,
    punctuation: true,
  });
  private config: AmbientConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentSpeaker: SpeakerRole = SpeakerRole.PROVIDER;
  private startTime: Date | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AmbientConfig>) {
    this.config = {
      speakerDiarization: true,
      realTimeProcessing: true,
      noiseReduction: true,
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      minConfidence: 0.7,
      ...config,
    };

    this.setupRecognitionHandlers();
  }

  /**
   * Setup recognition event handlers
   */
  private setupRecognitionHandlers(): void {
    this.recognition.on("finalresult", (result: VoiceRecognitionResult) => {
      this.handleTranscript(result);
    });

    this.recognition.on("error", (error: any) => {
      this.handleError(error);
    });
  }

  /**
   * Start ambient documentation session
   */
  async startSession(
    encounterId: string,
    patientId: string,
    providerId: string
  ): Promise<AmbientSession> {
    if (this.session && this.session.status === AmbientStatus.RECORDING) {
      throw new Error("Ambient session already active");
    }

    this.startTime = new Date();

    // Create session
    this.session = {
      id: this.generateId(),
      encounterId,
      patientId,
      providerId,
      status: AmbientStatus.RECORDING,
      startedAt: this.startTime,
      duration: 0,
      rawTranscript: "",
      processedTranscript: "",
      speakerDiarization: [],
      clinicalNote: this.initializeClinicalNote(),
      metadata: {
        requiresReview: true,
        noiseLevel: 0,
        audioQuality: 100,
      },
    };

    // Start audio recording
    await this.startAudioRecording();

    // Start speech recognition
    await this.recognition.initialize();
    await this.recognition.start();

    // Setup auto-save
    if (this.config.autoSave) {
      this.autoSaveInterval = setInterval(() => {
        this.autoSave();
      }, this.config.autoSaveInterval);
    }

    this.emit("sessionstarted", this.session);

    return this.session;
  }

  /**
   * Initialize empty clinical note
   */
  private initializeClinicalNote(): ClinicalNote {
    return {
      generatedAt: new Date(),
      confidence: 0,
    };
  }

  /**
   * Start audio recording
   */
  private async startAudioRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: this.config.noiseReduction,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processAudioRecording();
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.warn("Audio recording failed:", error);
      // Continue without audio recording
    }
  }

  /**
   * Process audio recording
   */
  private processAudioRecording(): void {
    if (this.audioChunks.length === 0 || !this.session) return;

    const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);

    this.session.metadata.audioUrl = audioUrl;
    this.session.metadata.audioFormat = "audio/webm";

    this.emit("audioprocessed", audioUrl);
  }

  /**
   * Handle transcript from recognition
   */
  private handleTranscript(result: VoiceRecognitionResult): void {
    if (!this.session) return;

    const { transcript, confidence } = result;

    if (confidence < this.config.minConfidence) {
      return;
    }

    // Add to raw transcript
    this.session.rawTranscript += transcript + " ";

    // Create speaker segment
    if (this.config.speakerDiarization) {
      const segment = this.createSpeakerSegment(transcript, confidence);
      this.session.speakerDiarization.push(segment);
    }

    // Real-time processing
    if (this.config.realTimeProcessing) {
      this.processTranscript(transcript);
    }

    this.updateSessionDuration();
    this.emit("transcript", { transcript, confidence });
  }

  /**
   * Create speaker segment
   */
  private createSpeakerSegment(
    text: string,
    confidence: number
  ): SpeakerSegment {
    const now = Date.now();
    const startTime = this.startTime ? now - this.startTime.getTime() : 0;

    return {
      speaker: this.currentSpeaker,
      startTime,
      endTime: startTime,
      text,
      confidence,
    };
  }

  /**
   * Set current speaker (for manual diarization)
   */
  setSpeaker(speaker: SpeakerRole): void {
    this.currentSpeaker = speaker;
    this.emit("speakerchange", speaker);
  }

  /**
   * Process transcript for clinical information
   */
  private processTranscript(transcript: string): void {
    if (!this.session) return;

    const lower = transcript.toLowerCase();

    // Extract chief complaint
    if (this.matchesPattern(lower, ["chief complaint", "presenting with"])) {
      this.extractChiefComplaint(transcript);
    }

    // Extract history of present illness
    if (
      this.matchesPattern(lower, [
        "started",
        "began",
        "symptoms",
        "for the past",
      ])
    ) {
      this.extractHPI(transcript);
    }

    // Extract vital signs
    if (
      this.matchesPattern(lower, [
        "blood pressure",
        "heart rate",
        "temperature",
        "respiratory rate",
      ])
    ) {
      this.extractVitals(transcript);
    }

    // Extract assessment/diagnosis
    if (
      this.matchesPattern(lower, [
        "diagnosis",
        "diagnosed with",
        "likely",
        "assessment",
      ])
    ) {
      this.extractAssessment(transcript);
    }

    // Extract plan
    if (
      this.matchesPattern(lower, [
        "will prescribe",
        "recommend",
        "follow up",
        "order",
      ])
    ) {
      this.extractPlan(transcript);
    }

    this.session.processedTranscript += transcript + " ";
  }

  /**
   * Check if text matches any pattern
   */
  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some((pattern) => text.includes(pattern));
  }

  /**
   * Extract chief complaint
   */
  private extractChiefComplaint(transcript: string): void {
    if (!this.session) return;
    if (!this.session.clinicalNote.chiefComplaint) {
      this.session.clinicalNote.chiefComplaint = transcript;
    } else {
      this.session.clinicalNote.chiefComplaint += " " + transcript;
    }
  }

  /**
   * Extract history of present illness
   */
  private extractHPI(transcript: string): void {
    if (!this.session) return;
    if (!this.session.clinicalNote.historyPresentIllness) {
      this.session.clinicalNote.historyPresentIllness = transcript;
    } else {
      this.session.clinicalNote.historyPresentIllness += " " + transcript;
    }
  }

  /**
   * Extract vital signs from transcript
   */
  private extractVitals(transcript: string): void {
    if (!this.session) return;

    const vitals: Partial<VitalSigns> = {};

    // Blood pressure (e.g., "blood pressure 120 over 80")
    const bpMatch = transcript.match(
      /blood pressure\s+(\d+)\s+over\s+(\d+)/i
    );
    if (bpMatch) {
      vitals.bloodPressureSystolic = parseInt(bpMatch[1]);
      vitals.bloodPressureDiastolic = parseInt(bpMatch[2]);
    }

    // Heart rate (e.g., "heart rate 72")
    const hrMatch = transcript.match(/heart rate\s+(\d+)/i);
    if (hrMatch) {
      vitals.heartRate = parseInt(hrMatch[1]);
    }

    // Temperature (e.g., "temperature 98.6")
    const tempMatch = transcript.match(
      /temperature\s+(\d+\.?\d*)\s*(fahrenheit|celsius|f|c)?/i
    );
    if (tempMatch) {
      vitals.temperature = parseFloat(tempMatch[1]);
      vitals.temperatureUnit =
        tempMatch[2]?.toLowerCase().startsWith("c") ? "C" : "F";
    }

    // Respiratory rate (e.g., "respiratory rate 16")
    const rrMatch = transcript.match(/respiratory rate\s+(\d+)/i);
    if (rrMatch) {
      vitals.respiratoryRate = parseInt(rrMatch[1]);
    }

    // Oxygen saturation (e.g., "oxygen saturation 98 percent")
    const o2Match = transcript.match(/oxygen saturation\s+(\d+)/i);
    if (o2Match) {
      vitals.oxygenSaturation = parseInt(o2Match[1]);
    }

    // Update physical exam vitals
    if (!this.session.clinicalNote.physicalExam) {
      this.session.clinicalNote.physicalExam = {};
    }
    this.session.clinicalNote.physicalExam.vitals = {
      ...this.session.clinicalNote.physicalExam.vitals,
      ...vitals,
    };
  }

  /**
   * Extract assessment/diagnosis
   */
  private extractAssessment(transcript: string): void {
    if (!this.session) return;

    const assessment: Assessment = {
      diagnosis: transcript,
      status: "new",
    };

    if (!this.session.clinicalNote.assessment) {
      this.session.clinicalNote.assessment = [];
    }
    this.session.clinicalNote.assessment.push(assessment);
  }

  /**
   * Extract plan
   */
  private extractPlan(transcript: string): void {
    if (!this.session) return;

    let category = PlanCategory.THERAPEUTIC;
    if (transcript.toLowerCase().includes("order")) {
      category = PlanCategory.DIAGNOSTIC;
    } else if (transcript.toLowerCase().includes("follow up")) {
      category = PlanCategory.FOLLOW_UP;
    }

    const plan: Plan = {
      category,
      description: transcript,
    };

    if (!this.session.clinicalNote.plan) {
      this.session.clinicalNote.plan = [];
    }
    this.session.clinicalNote.plan.push(plan);
  }

  /**
   * Update session duration
   */
  private updateSessionDuration(): void {
    if (!this.session || !this.startTime) return;
    this.session.duration =
      (new Date().getTime() - this.startTime.getTime()) / 1000;
  }

  /**
   * Auto-save session
   */
  private autoSave(): void {
    if (!this.session) return;
    this.emit("autosave", this.session);
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (!this.session) return;

    this.session.status = AmbientStatus.PROCESSING;
    this.session.endedAt = new Date();

    // Stop recognition
    this.recognition.stop();

    // Stop audio recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Clear auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    this.updateSessionDuration();
    this.emit("stopped", this.session);

    // Process final note
    this.generateFinalNote();
  }

  /**
   * Generate final clinical note
   */
  private async generateFinalNote(): Promise<void> {
    if (!this.session) return;

    this.session.status = AmbientStatus.PROCESSING;

    // Here you would typically call an AI service to generate
    // a structured clinical note from the transcript
    // For now, we'll use the extracted information

    this.session.clinicalNote.confidence = this.calculateConfidence();
    this.session.clinicalNote.generatedAt = new Date();

    this.session.status = AmbientStatus.READY_FOR_REVIEW;
    this.emit("notegenerated", this.session.clinicalNote);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(): number {
    if (!this.session) return 0;

    let score = 0;
    let count = 0;

    // Check for key components
    if (this.session.clinicalNote.chiefComplaint) {
      score += 1;
      count += 1;
    }
    if (this.session.clinicalNote.historyPresentIllness) {
      score += 1;
      count += 1;
    }
    if (this.session.clinicalNote.physicalExam?.vitals) {
      score += 1;
      count += 1;
    }
    if (
      this.session.clinicalNote.assessment &&
      this.session.clinicalNote.assessment.length > 0
    ) {
      score += 1;
      count += 1;
    }
    if (
      this.session.clinicalNote.plan &&
      this.session.clinicalNote.plan.length > 0
    ) {
      score += 1;
      count += 1;
    }

    return count > 0 ? score / count : 0;
  }

  /**
   * Mark as reviewed
   */
  markReviewed(reviewedBy: string): void {
    if (!this.session) return;

    this.session.status = AmbientStatus.REVIEWED;
    this.session.metadata.reviewedBy = reviewedBy;
    this.session.metadata.reviewedAt = new Date();
    this.session.metadata.requiresReview = false;

    this.emit("reviewed", this.session);
  }

  /**
   * Sign note
   */
  sign(): void {
    if (!this.session) return;

    this.session.status = AmbientStatus.SIGNED;
    this.emit("signed", this.session);
  }

  /**
   * Handle error
   */
  private handleError(error: any): void {
    if (!this.session) return;

    this.session.status = AmbientStatus.ERROR;
    this.emit("error", error);
  }

  /**
   * Get current session
   */
  getSession(): AmbientSession | null {
    return this.session;
  }

  /**
   * Get clinical note
   */
  getClinicalNote(): ClinicalNote | null {
    return this.session?.clinicalNote || null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ambient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.recognition.destroy();
    this.listeners.clear();
    this.session = null;
  }
}

// ============================================================================
// Global Ambient Listener Instance
// ============================================================================

let globalAmbientListener: AmbientListener | null = null;

export function getAmbientListener(
  config?: Partial<AmbientConfig>
): AmbientListener {
  if (!globalAmbientListener) {
    globalAmbientListener = new AmbientListener(config);
  }
  return globalAmbientListener;
}

export function resetAmbientListener(): void {
  if (globalAmbientListener) {
    globalAmbientListener.destroy();
    globalAmbientListener = null;
  }
}
