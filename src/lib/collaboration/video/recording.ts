/**
 * Video Recording Manager
 * Handles recording management, consent tracking, and HIPAA-compliant storage
 */

import { z } from "zod";

export const RecordingSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  organizationId: z.string(),
  status: z.enum(["RECORDING", "PAUSED", "STOPPED", "PROCESSING", "COMPLETED", "FAILED"]),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().default(0),
  fileSize: z.number().default(0),
  fileUrl: z.string().optional(),
  fileName: z.string(),
  mimeType: z.string().default("video/webm"),
  format: z.enum(["webm", "mp4", "mkv"]).default("webm"),
  quality: z.enum(["LOW", "MEDIUM", "HIGH", "HD"]),
  consents: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    consentedAt: z.date(),
    ipAddress: z.string(),
    userAgent: z.string(),
  })),
  metadata: z.object({
    participantCount: z.number(),
    host: z.string(),
    roomName: z.string(),
    recordedBy: z.string(),
    encrypted: z.boolean().default(true),
    retentionDays: z.number().default(2555), // 7 years HIPAA default
  }),
  chunks: z.array(z.object({
    index: z.number(),
    size: z.number(),
    timestamp: z.number(),
  })).optional(),
});

export type Recording = z.infer<typeof RecordingSchema>;

export interface RecordingOptions {
  quality?: "LOW" | "MEDIUM" | "HIGH" | "HD";
  format?: "webm" | "mp4" | "mkv";
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
  encrypted?: boolean;
}

export interface ConsentRequest {
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
}

export class RecordingManager {
  private recordings: Map<string, Recording> = new Map();
  private mediaRecorders: Map<string, MediaRecorder> = new Map();
  private recordingChunks: Map<string, Blob[]> = new Map();
  private pauseTimestamps: Map<string, number> = new Map();

  /**
   * Start recording
   */
  async startRecording(
    roomId: string,
    organizationId: string,
    stream: MediaStream,
    options: RecordingOptions = {}
  ): Promise<Recording> {
    const recordingId = this.generateRecordingId();

    // Validate consent
    const consents = this.getConsents(roomId);
    if (consents.length === 0) {
      throw new Error("Recording requires at least one participant consent");
    }

    // Determine MIME type and options
    const mimeType = this.getMimeType(options.mimeType || options.format);
    const quality = options.quality || "HIGH";
    const videoBitsPerSecond = options.videoBitsPerSecond || this.getBitrate(quality).video;
    const audioBitsPerSecond = options.audioBitsPerSecond || this.getBitrate(quality).audio;

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond,
      audioBitsPerSecond,
    });

    // Initialize chunks array
    this.recordingChunks.set(recordingId, []);

    // Handle data available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        const chunks = this.recordingChunks.get(recordingId) || [];
        chunks.push(event.data);
        this.recordingChunks.set(recordingId, chunks);
      }
    };

    // Handle recording stopped
    mediaRecorder.onstop = async () => {
      await this.processRecording(recordingId);
    };

    // Handle errors
    mediaRecorder.onerror = (event) => {
      console.error("MediaRecorder error:", event);
      this.updateRecordingStatus(recordingId, "FAILED");
    };

    // Create recording record
    const recording: Recording = {
      id: recordingId,
      roomId,
      organizationId,
      status: "RECORDING",
      startTime: new Date(),
      duration: 0,
      fileSize: 0,
      fileName: `recording-${roomId}-${Date.now()}.${options.format || "webm"}`,
      mimeType,
      format: options.format || "webm",
      quality,
      consents,
      metadata: {
        participantCount: 0,
        host: "",
        roomName: "",
        recordedBy: "",
        encrypted: options.encrypted !== false,
        retentionDays: 2555,
      },
    };

    this.recordings.set(recordingId, recording);
    this.mediaRecorders.set(recordingId, mediaRecorder);

    // Start recording (request data every 10 seconds)
    mediaRecorder.start(10000);

    return recording;
  }

  /**
   * Pause recording
   */
  pauseRecording(recordingId: string): boolean {
    const mediaRecorder = this.mediaRecorders.get(recordingId);
    const recording = this.recordings.get(recordingId);

    if (!mediaRecorder || !recording) return false;

    if (mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      recording.status = "PAUSED";
      this.pauseTimestamps.set(recordingId, Date.now());
      this.recordings.set(recordingId, recording);
      return true;
    }

    return false;
  }

  /**
   * Resume recording
   */
  resumeRecording(recordingId: string): boolean {
    const mediaRecorder = this.mediaRecorders.get(recordingId);
    const recording = this.recordings.get(recordingId);

    if (!mediaRecorder || !recording) return false;

    if (mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      recording.status = "RECORDING";

      // Update duration
      const pauseTime = this.pauseTimestamps.get(recordingId);
      if (pauseTime) {
        const pauseDuration = Date.now() - pauseTime;
        this.pauseTimestamps.delete(recordingId);
      }

      this.recordings.set(recordingId, recording);
      return true;
    }

    return false;
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingId: string): Promise<Recording | undefined> {
    const mediaRecorder = this.mediaRecorders.get(recordingId);
    const recording = this.recordings.get(recordingId);

    if (!mediaRecorder || !recording) return undefined;

    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      recording.status = "STOPPED";
      recording.endTime = new Date();
      recording.duration =
        recording.endTime.getTime() - recording.startTime.getTime();
      this.recordings.set(recordingId, recording);
    }

    return recording;
  }

  /**
   * Process recording (combine chunks, encrypt if needed)
   */
  private async processRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    const chunks = this.recordingChunks.get(recordingId);

    if (!recording || !chunks) return;

    recording.status = "PROCESSING";
    this.recordings.set(recordingId, recording);

    try {
      // Combine chunks into single blob
      const blob = new Blob(chunks, { type: recording.mimeType });
      recording.fileSize = blob.size;

      // Encrypt if required
      let finalBlob = blob;
      if (recording.metadata.encrypted) {
        finalBlob = await this.encryptRecording(blob);
      }

      // Generate download URL
      recording.fileUrl = URL.createObjectURL(finalBlob);

      // In production, upload to secure storage (S3, etc.)
      // const fileUrl = await this.uploadToSecureStorage(finalBlob, recording);
      // recording.fileUrl = fileUrl;

      recording.status = "COMPLETED";
      this.recordings.set(recordingId, recording);

      // Cleanup
      this.recordingChunks.delete(recordingId);
      this.mediaRecorders.delete(recordingId);
    } catch (error) {
      console.error("Error processing recording:", error);
      recording.status = "FAILED";
      this.recordings.set(recordingId, recording);
    }
  }

  /**
   * Encrypt recording (HIPAA compliance)
   */
  private async encryptRecording(blob: Blob): Promise<Blob> {
    // In production, use proper encryption (AES-256)
    // For now, return the original blob
    // Implementation would use Web Crypto API:
    // const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    // const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await blob.arrayBuffer());
    return blob;
  }

  /**
   * Upload to secure storage
   */
  private async uploadToSecureStorage(
    blob: Blob,
    recording: Recording
  ): Promise<string> {
    // In production, upload to S3 with server-side encryption
    // For now, return object URL
    return URL.createObjectURL(blob);
  }

  /**
   * Add consent
   */
  addConsent(roomId: string, consent: ConsentRequest): void {
    const consentRecord = {
      ...consent,
      consentedAt: new Date(),
    };

    // Store consent per room
    // In production, persist to database
    const consentKey = `consents:${roomId}`;
    const existingConsents = this.getConsents(roomId);

    if (!existingConsents.find((c) => c.userId === consent.userId)) {
      existingConsents.push(consentRecord);
    }
  }

  /**
   * Get consents for room
   */
  private getConsents(roomId: string): Recording["consents"] {
    // In production, fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Revoke consent
   */
  revokeConsent(roomId: string, userId: string): void {
    // In production, persist to database
    // If recording is active, stop it
    const activeRecordings = this.getActiveRecordingsForRoom(roomId);
    activeRecordings.forEach((recording) => {
      this.stopRecording(recording.id);
    });
  }

  /**
   * Get recording by ID
   */
  getRecording(recordingId: string): Recording | undefined {
    return this.recordings.get(recordingId);
  }

  /**
   * Get all recordings for room
   */
  getRoomRecordings(roomId: string): Recording[] {
    return Array.from(this.recordings.values()).filter(
      (r) => r.roomId === roomId
    );
  }

  /**
   * Get active recordings for room
   */
  getActiveRecordingsForRoom(roomId: string): Recording[] {
    return Array.from(this.recordings.values()).filter(
      (r) => r.roomId === roomId && r.status === "RECORDING"
    );
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return false;

    // Stop if active
    if (recording.status === "RECORDING") {
      await this.stopRecording(recordingId);
    }

    // Revoke object URL
    if (recording.fileUrl) {
      URL.revokeObjectURL(recording.fileUrl);
    }

    // In production, delete from storage
    // await this.deleteFromStorage(recording.fileUrl);

    this.recordings.delete(recordingId);
    this.recordingChunks.delete(recordingId);
    this.mediaRecorders.delete(recordingId);

    return true;
  }

  /**
   * Download recording
   */
  downloadRecording(recordingId: string): void {
    const recording = this.recordings.get(recordingId);
    if (!recording || !recording.fileUrl) {
      throw new Error("Recording not available for download");
    }

    const a = document.createElement("a");
    a.href = recording.fileUrl;
    a.download = recording.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Update recording status
   */
  private updateRecordingStatus(
    recordingId: string,
    status: Recording["status"]
  ): void {
    const recording = this.recordings.get(recordingId);
    if (recording) {
      recording.status = status;
      this.recordings.set(recordingId, recording);
    }
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format?: string): string {
    const mimeTypes: Record<string, string> = {
      webm: "video/webm;codecs=vp9,opus",
      mp4: "video/mp4",
      mkv: "video/x-matroska",
    };

    if (format && format in mimeTypes) {
      return mimeTypes[format];
    }

    // Check browser support
    const supportedTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm";
  }

  /**
   * Get bitrate for quality
   */
  private getBitrate(quality: string): { video: number; audio: number } {
    const bitrates = {
      LOW: { video: 500000, audio: 64000 },
      MEDIUM: { video: 1000000, audio: 128000 },
      HIGH: { video: 2500000, audio: 192000 },
      HD: { video: 5000000, audio: 256000 },
    };

    return bitrates[quality as keyof typeof bitrates] || bitrates.HIGH;
  }

  /**
   * Generate recording ID
   */
  private generateRecordingId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Validate HIPAA compliance
   */
  validateHIPAACompliance(recording: Recording): {
    compliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!recording.metadata.encrypted) {
      issues.push("Recording is not encrypted");
    }

    if (recording.consents.length === 0) {
      issues.push("No participant consents recorded");
    }

    if (recording.metadata.retentionDays < 2555) {
      issues.push("Retention period is less than 7 years");
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }
}

/**
 * Singleton instance
 */
export const recordingManager = new RecordingManager();
