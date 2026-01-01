/**
 * Screen Sharing Manager
 * Handles screen sharing, application sharing, and remote control
 */

import { z } from "zod";

export const ScreenShareSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  roomId: z.string(),
  type: z.enum(["FULL_SCREEN", "WINDOW", "TAB", "APPLICATION"]),
  status: z.enum(["STARTING", "ACTIVE", "PAUSED", "STOPPED"]),
  startTime: z.date(),
  endTime: z.date().optional(),
  hasAudio: z.boolean().default(false),
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  frameRate: z.number().optional(),
  annotations: z.array(z.object({
    id: z.string(),
    type: z.enum(["ARROW", "TEXT", "CIRCLE", "RECTANGLE", "FREEHAND"]),
    x: z.number(),
    y: z.number(),
    data: z.any(),
    userId: z.string(),
    timestamp: z.date(),
  })).default([]),
  remoteControlEnabled: z.boolean().default(false),
  remoteControlRequests: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    requestedAt: z.date(),
    status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  })).default([]),
});

export type ScreenShare = z.infer<typeof ScreenShareSchema>;

export interface ScreenShareOptions {
  preferCurrentTab?: boolean;
  audio?: boolean;
  video?: boolean | MediaTrackConstraints;
  surfaceSwitching?: "include" | "exclude";
  selfBrowserSurface?: "include" | "exclude";
  systemAudio?: "include" | "exclude";
}

export interface Annotation {
  id: string;
  type: "ARROW" | "TEXT" | "CIRCLE" | "RECTANGLE" | "FREEHAND";
  x: number;
  y: number;
  data: any;
  userId: string;
  timestamp: Date;
}

export class ScreenShareManager {
  private screenShares: Map<string, ScreenShare> = new Map();
  private mediaStreams: Map<string, MediaStream> = new Map();
  private annotationLayers: Map<string, HTMLCanvasElement> = new Map();
  private remoteControlSessions: Map<string, RTCDataChannel> = new Map();

  /**
   * Start screen sharing
   */
  async startScreenShare(
    userId: string,
    userName: string,
    roomId: string,
    options: ScreenShareOptions = {}
  ): Promise<ScreenShare> {
    try {
      // Request display media
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: options.video || {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: options.audio || false,
        // @ts-ignore - These are experimental features
        preferCurrentTab: options.preferCurrentTab,
        surfaceSwitching: options.surfaceSwitching || "include",
        selfBrowserSurface: options.selfBrowserSurface || "exclude",
        systemAudio: options.systemAudio || "exclude",
      });

      const screenShareId = this.generateScreenShareId();
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      const screenShare: ScreenShare = {
        id: screenShareId,
        userId,
        userName,
        roomId,
        type: this.detectShareType(videoTrack),
        status: "ACTIVE",
        startTime: new Date(),
        hasAudio: stream.getAudioTracks().length > 0,
        resolution: {
          width: settings.width || 1920,
          height: settings.height || 1080,
        },
        frameRate: settings.frameRate || 30,
        annotations: [],
        remoteControlEnabled: false,
        remoteControlRequests: [],
      };

      this.screenShares.set(screenShareId, screenShare);
      this.mediaStreams.set(screenShareId, stream);

      // Handle stream ended (user clicked browser's stop sharing button)
      videoTrack.onended = () => {
        this.stopScreenShare(screenShareId);
      };

      return screenShare;
    } catch (error: any) {
      console.error("Error starting screen share:", error);

      if (error.name === "NotAllowedError") {
        throw new Error("Screen sharing permission denied");
      } else if (error.name === "NotFoundError") {
        throw new Error("No screen sharing source found");
      } else {
        throw new Error("Failed to start screen sharing");
      }
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(screenShareId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    const stream = this.mediaStreams.get(screenShareId);

    if (!screenShare || !stream) return false;

    // Stop all tracks
    stream.getTracks().forEach((track) => track.stop());

    // Update screen share status
    screenShare.status = "STOPPED";
    screenShare.endTime = new Date();
    this.screenShares.set(screenShareId, screenShare);

    // Cleanup
    this.mediaStreams.delete(screenShareId);
    this.annotationLayers.delete(screenShareId);

    // Close remote control session if active
    const remoteControl = this.remoteControlSessions.get(screenShareId);
    if (remoteControl) {
      remoteControl.close();
      this.remoteControlSessions.delete(screenShareId);
    }

    return true;
  }

  /**
   * Pause screen sharing
   */
  pauseScreenShare(screenShareId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    const stream = this.mediaStreams.get(screenShareId);

    if (!screenShare || !stream) return false;

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = false;
      screenShare.status = "PAUSED";
      this.screenShares.set(screenShareId, screenShare);
      return true;
    }

    return false;
  }

  /**
   * Resume screen sharing
   */
  resumeScreenShare(screenShareId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    const stream = this.mediaStreams.get(screenShareId);

    if (!screenShare || !stream) return false;

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = true;
      screenShare.status = "ACTIVE";
      this.screenShares.set(screenShareId, screenShare);
      return true;
    }

    return false;
  }

  /**
   * Add annotation to screen share
   */
  addAnnotation(
    screenShareId: string,
    annotation: Omit<Annotation, "id" | "timestamp">
  ): Annotation | undefined {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return undefined;

    const fullAnnotation: Annotation = {
      id: this.generateAnnotationId(),
      timestamp: new Date(),
      ...annotation,
    };

    screenShare.annotations.push(fullAnnotation);
    this.screenShares.set(screenShareId, screenShare);

    // Draw annotation on canvas
    this.drawAnnotation(screenShareId, fullAnnotation);

    return fullAnnotation;
  }

  /**
   * Remove annotation
   */
  removeAnnotation(screenShareId: string, annotationId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    const index = screenShare.annotations.findIndex((a) => a.id === annotationId);
    if (index === -1) return false;

    screenShare.annotations.splice(index, 1);
    this.screenShares.set(screenShareId, screenShare);

    // Redraw all annotations
    this.redrawAnnotations(screenShareId);

    return true;
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(screenShareId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    screenShare.annotations = [];
    this.screenShares.set(screenShareId, screenShare);

    // Clear canvas
    const canvas = this.annotationLayers.get(screenShareId);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return true;
  }

  /**
   * Initialize annotation layer
   */
  initializeAnnotationLayer(
    screenShareId: string,
    canvas: HTMLCanvasElement
  ): void {
    this.annotationLayers.set(screenShareId, canvas);
  }

  /**
   * Draw annotation on canvas
   */
  private drawAnnotation(screenShareId: string, annotation: Annotation): void {
    const canvas = this.annotationLayers.get(screenShareId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#FF0000";

    switch (annotation.type) {
      case "ARROW":
        this.drawArrow(ctx, annotation);
        break;
      case "TEXT":
        this.drawText(ctx, annotation);
        break;
      case "CIRCLE":
        this.drawCircle(ctx, annotation);
        break;
      case "RECTANGLE":
        this.drawRectangle(ctx, annotation);
        break;
      case "FREEHAND":
        this.drawFreehand(ctx, annotation);
        break;
    }
  }

  /**
   * Redraw all annotations
   */
  private redrawAnnotations(screenShareId: string): void {
    const canvas = this.annotationLayers.get(screenShareId);
    const screenShare = this.screenShares.get(screenShareId);

    if (!canvas || !screenShare) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all annotations
    screenShare.annotations.forEach((annotation) => {
      this.drawAnnotation(screenShareId, annotation);
    });
  }

  /**
   * Drawing helpers
   */
  private drawArrow(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const { x, y, data } = annotation;
    const { endX, endY } = data;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(endY - y, endX - x);
    const headLength = 15;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  private drawText(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const { x, y, data } = annotation;
    ctx.font = data.fontSize || "16px Arial";
    ctx.fillText(data.text, x, y);
  }

  private drawCircle(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const { x, y, data } = annotation;
    ctx.beginPath();
    ctx.arc(x, y, data.radius || 20, 0, 2 * Math.PI);
    ctx.stroke();
  }

  private drawRectangle(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const { x, y, data } = annotation;
    ctx.strokeRect(x, y, data.width || 100, data.height || 100);
  }

  private drawFreehand(ctx: CanvasRenderingContext2D, annotation: Annotation): void {
    const { data } = annotation;
    const points = data.points || [];

    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  }

  /**
   * Request remote control
   */
  requestRemoteControl(
    screenShareId: string,
    userId: string,
    userName: string
  ): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    screenShare.remoteControlRequests.push({
      userId,
      userName,
      requestedAt: new Date(),
      status: "PENDING",
    });

    this.screenShares.set(screenShareId, screenShare);
    return true;
  }

  /**
   * Approve remote control request
   */
  approveRemoteControl(screenShareId: string, userId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    const request = screenShare.remoteControlRequests.find(
      (r) => r.userId === userId && r.status === "PENDING"
    );

    if (!request) return false;

    request.status = "APPROVED";
    screenShare.remoteControlEnabled = true;
    this.screenShares.set(screenShareId, screenShare);

    return true;
  }

  /**
   * Deny remote control request
   */
  denyRemoteControl(screenShareId: string, userId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    const request = screenShare.remoteControlRequests.find(
      (r) => r.userId === userId && r.status === "PENDING"
    );

    if (!request) return false;

    request.status = "DENIED";
    this.screenShares.set(screenShareId, screenShare);

    return true;
  }

  /**
   * Revoke remote control
   */
  revokeRemoteControl(screenShareId: string): boolean {
    const screenShare = this.screenShares.get(screenShareId);
    if (!screenShare) return false;

    screenShare.remoteControlEnabled = false;
    this.screenShares.set(screenShareId, screenShare);

    const remoteControl = this.remoteControlSessions.get(screenShareId);
    if (remoteControl) {
      remoteControl.close();
      this.remoteControlSessions.delete(screenShareId);
    }

    return true;
  }

  /**
   * Get screen share by ID
   */
  getScreenShare(screenShareId: string): ScreenShare | undefined {
    return this.screenShares.get(screenShareId);
  }

  /**
   * Get media stream
   */
  getMediaStream(screenShareId: string): MediaStream | undefined {
    return this.mediaStreams.get(screenShareId);
  }

  /**
   * Get active screen shares for room
   */
  getActiveScreenShares(roomId: string): ScreenShare[] {
    return Array.from(this.screenShares.values()).filter(
      (s) => s.roomId === roomId && s.status === "ACTIVE"
    );
  }

  /**
   * Detect share type from video track
   */
  private detectShareType(track: MediaStreamTrack): ScreenShare["type"] {
    const settings = track.getSettings();

    // @ts-ignore - displaySurface is experimental
    const displaySurface = settings.displaySurface;

    switch (displaySurface) {
      case "monitor":
        return "FULL_SCREEN";
      case "window":
        return "WINDOW";
      case "browser":
        return "TAB";
      default:
        return "APPLICATION";
    }
  }

  /**
   * Generate screen share ID
   */
  private generateScreenShareId(): string {
    return `ss_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate annotation ID
   */
  private generateAnnotationId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Singleton instance
 */
export const screenShareManager = new ScreenShareManager();
