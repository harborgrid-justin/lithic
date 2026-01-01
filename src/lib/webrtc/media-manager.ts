/**
 * Media Stream Manager
 * Handles camera, microphone, and screen sharing access and management
 */

export interface MediaConfig {
  audio: boolean | MediaTrackConstraints;
  video: boolean | VideoConfig;
}

export interface VideoConfig extends MediaTrackConstraints {
  width?: number | { min?: number; max?: number; ideal?: number };
  height?: number | { min?: number; max?: number; ideal?: number };
  frameRate?: number | { min?: number; max?: number; ideal?: number };
  facingMode?: "user" | "environment";
}

export interface AudioConfig extends MediaTrackConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  channelCount?: number;
}

export interface DeviceList {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export class MediaManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentAudioDevice: string | null = null;
  private currentVideoDevice: string | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;

  // ============================================================================
  // Device Enumeration
  // ============================================================================

  async getDevices(): Promise<DeviceList> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      audioInputs: devices.filter((d) => d.kind === "audioinput"),
      audioOutputs: devices.filter((d) => d.kind === "audiooutput"),
      videoInputs: devices.filter((d) => d.kind === "videoinput"),
    };
  }

  async hasMediaDevices(): Promise<{ hasAudio: boolean; hasVideo: boolean }> {
    const devices = await this.getDevices();
    return {
      hasAudio: devices.audioInputs.length > 0,
      hasVideo: devices.videoInputs.length > 0,
    };
  }

  // ============================================================================
  // Media Stream Access
  // ============================================================================

  async getUserMedia(config: MediaConfig): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: this.buildAudioConstraints(config.audio),
        video: this.buildVideoConstraints(config.video),
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store current device IDs
      const audioTrack = this.localStream.getAudioTracks()[0];
      const videoTrack = this.localStream.getVideoTracks()[0];

      if (audioTrack) {
        const settings = audioTrack.getSettings();
        this.currentAudioDevice = settings.deviceId || null;
      }

      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.currentVideoDevice = settings.deviceId || null;
      }

      // Set up audio analysis
      if (audioTrack) {
        this.setupAudioAnalysis(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw this.handleMediaError(error);
    }
  }

  async getDisplayMedia(config?: DisplayMediaConfig): Promise<MediaStream> {
    try {
      const constraints: DisplayMediaStreamOptions = {
        video:
          config?.video !== false
            ? {
                cursor: config?.cursor || "always",
                displaySurface: config?.displaySurface || "monitor",
                logicalSurface: config?.logicalSurface !== false,
              }
            : false,
        audio: config?.audio || false,
      };

      this.screenStream =
        await navigator.mediaDevices.getDisplayMedia(constraints);

      // Handle stop sharing when user clicks browser's stop button
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (error) {
      console.error("Error accessing display media:", error);
      throw this.handleMediaError(error);
    }
  }

  // ============================================================================
  // Device Switching
  // ============================================================================

  async switchCamera(deviceId: string): Promise<MediaStreamTrack> {
    if (!this.localStream) {
      throw new Error("No active media stream");
    }

    const oldTrack = this.localStream.getVideoTracks()[0];
    const constraints: MediaTrackConstraints = {
      deviceId: { exact: deviceId },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: constraints,
    });
    const newTrack = newStream.getVideoTracks()[0];

    // Replace old track
    this.localStream.removeTrack(oldTrack);
    this.localStream.addTrack(newTrack);
    oldTrack.stop();

    this.currentVideoDevice = deviceId;
    return newTrack;
  }

  async switchMicrophone(deviceId: string): Promise<MediaStreamTrack> {
    if (!this.localStream) {
      throw new Error("No active media stream");
    }

    const oldTrack = this.localStream.getAudioTracks()[0];
    const constraints: MediaTrackConstraints = {
      deviceId: { exact: deviceId },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: constraints,
    });
    const newTrack = newStream.getAudioTracks()[0];

    // Replace old track
    this.localStream.removeTrack(oldTrack);
    this.localStream.addTrack(newTrack);
    oldTrack.stop();

    this.currentAudioDevice = deviceId;

    // Re-setup audio analysis
    this.setupAudioAnalysis(this.localStream);

    return newTrack;
  }

  // ============================================================================
  // Track Control
  // ============================================================================

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) {
      return false;
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      return false;
    }

    audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
    return audioTrack.enabled;
  }

  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) {
      return false;
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      return false;
    }

    videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
    return videoTrack.enabled;
  }

  isAudioEnabled(): boolean {
    if (!this.localStream) {
      return false;
    }
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  isVideoEnabled(): boolean {
    if (!this.localStream) {
      return false;
    }
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }

  // ============================================================================
  // Screen Sharing
  // ============================================================================

  async startScreenShare(config?: DisplayMediaConfig): Promise<MediaStream> {
    return await this.getDisplayMedia(config);
  }

  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  isScreenSharing(): boolean {
    return this.screenStream !== null && this.screenStream.active;
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  private setupAudioAnalysis(stream: MediaStream): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        return;
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);
    } catch (error) {
      console.error("Error setting up audio analysis:", error);
    }
  }

  getAudioLevel(): number {
    if (!this.audioAnalyser) {
      return 0;
    }

    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    this.audioAnalyser.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    return Math.min(100, (average / 255) * 100);
  }

  // ============================================================================
  // Quality Settings
  // ============================================================================

  async setVideoQuality(quality: "low" | "medium" | "high"): Promise<void> {
    if (!this.localStream) {
      throw new Error("No active media stream");
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error("No video track available");
    }

    const constraints = this.getQualityConstraints(quality);
    await videoTrack.applyConstraints(constraints);
  }

  private getQualityConstraints(
    quality: "low" | "medium" | "high",
  ): MediaTrackConstraints {
    switch (quality) {
      case "low":
        return {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        };
      case "medium":
        return {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
        };
      case "high":
        return {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        };
    }
  }

  // ============================================================================
  // Stream Management
  // ============================================================================

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
    }

    this.currentAudioDevice = null;
    this.currentVideoDevice = null;
  }

  stopAllStreams(): void {
    this.stopLocalStream();
    this.stopScreenShare();
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  async checkPermissions(): Promise<{
    camera: PermissionState;
    microphone: PermissionState;
  }> {
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      const microphonePermission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      return {
        camera: cameraPermission.state,
        microphone: microphonePermission.state,
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return {
        camera: "prompt",
        microphone: "prompt",
      };
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private buildAudioConstraints(
    config: boolean | MediaTrackConstraints,
  ): MediaTrackConstraints | boolean {
    if (typeof config === "boolean") {
      return config
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false;
    }

    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...config,
    };
  }

  private buildVideoConstraints(
    config: boolean | VideoConfig,
  ): MediaTrackConstraints | boolean {
    if (typeof config === "boolean") {
      return config
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false;
    }

    return {
      width: config.width || { ideal: 1280 },
      height: config.height || { ideal: 720 },
      frameRate: config.frameRate || { ideal: 30 },
      ...config,
    };
  }

  private handleMediaError(error: any): Error {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      return new Error(
        "Permission denied. Please allow camera and microphone access.",
      );
    } else if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return new Error("No camera or microphone found.");
    } else if (
      error.name === "NotReadableError" ||
      error.name === "TrackStartError"
    ) {
      return new Error(
        "Camera or microphone is already in use by another application.",
      );
    } else if (error.name === "OverconstrainedError") {
      return new Error(
        "The requested media constraints could not be satisfied.",
      );
    } else if (error.name === "TypeError") {
      return new Error("Invalid media constraints.");
    } else {
      return new Error("Failed to access media devices: " + error.message);
    }
  }

  getCurrentDevices(): { audio: string | null; video: string | null } {
    return {
      audio: this.currentAudioDevice,
      video: this.currentVideoDevice,
    };
  }

  async testDevices(): Promise<{
    audio: boolean;
    video: boolean;
    error?: string;
  }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      const result = {
        audio: audioTrack ? audioTrack.readyState === "live" : false,
        video: videoTrack ? videoTrack.readyState === "live" : false,
      };

      stream.getTracks().forEach((track) => track.stop());
      return result;
    } catch (error: any) {
      return {
        audio: false,
        video: false,
        error: error.message,
      };
    }
  }
}

// ============================================================================
// Display Media Configuration
// ============================================================================

export interface DisplayMediaConfig {
  video?: boolean;
  audio?: boolean;
  cursor?: "always" | "motion" | "never";
  displaySurface?: "monitor" | "window" | "application" | "browser";
  logicalSurface?: boolean;
}
