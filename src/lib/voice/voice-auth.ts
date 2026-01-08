/**
 * Voice Biometric Authentication Service
 * Voice print enrollment and verification for secure access
 */

import {
  VoiceAuthConfig,
  VoiceAuthProfile,
  VoiceAuthStatus,
  VoicePrint,
  VoiceAuthResult,
} from "@/types/voice";

// ============================================================================
// Voice Authentication Service
// ============================================================================

export class VoiceAuthService {
  private config: VoiceAuthConfig;
  private profiles: Map<string, VoiceAuthProfile> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;

  constructor(config?: Partial<VoiceAuthConfig>) {
    this.config = {
      enabled: true,
      enrollmentRequired: true,
      continuousVerification: false,
      threshold: 0.85,
      fallbackToPassword: true,
      ...config,
    };
  }

  /**
   * Initialize audio processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.isInitialized = true;
      this.emit("initialized");
    } catch (error) {
      throw new Error(`Voice auth initialization failed: ${error}`);
    }
  }

  /**
   * Enroll new voice profile
   */
  async enrollUser(userId: string, passphrase: string): Promise<VoiceAuthResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "enrollment",
        error: "Voice authentication is disabled",
      };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Capture voice samples
      const samples = await this.captureVoiceSamples(passphrase, 3);

      // Generate voice print from samples
      const voicePrint = await this.generateVoicePrint(samples);

      // Create profile
      const profile: VoiceAuthProfile = {
        userId,
        voicePrint,
        enrollmentDate: new Date(),
        verificationCount: 0,
        failedAttempts: 0,
        status: VoiceAuthStatus.ACTIVE,
      };

      this.profiles.set(userId, profile);

      // Store profile (would typically save to backend)
      await this.storeProfile(profile);

      this.emit("enrolled", profile);

      return {
        success: true,
        confidence: 1.0,
        userId,
        timestamp: new Date(),
        method: "enrollment",
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "enrollment",
        error: String(error),
      };
    }
  }

  /**
   * Verify user voice
   */
  async verifyUser(
    userId: string,
    passphrase: string
  ): Promise<VoiceAuthResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "verification",
        error: "Voice authentication is disabled",
      };
    }

    const profile = await this.getProfile(userId);

    if (!profile) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "verification",
        error: "User not enrolled",
      };
    }

    if (profile.status !== VoiceAuthStatus.ACTIVE) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "verification",
        error: "Voice profile is not active",
      };
    }

    try {
      // Capture voice sample
      const samples = await this.captureVoiceSamples(passphrase, 1);

      // Generate voice print from sample
      const samplePrint = await this.generateVoicePrint(samples);

      // Compare with stored voice print
      const confidence = this.compareVoicePrints(
        profile.voicePrint,
        samplePrint
      );

      const success = confidence >= this.config.threshold;

      // Update profile
      if (success) {
        profile.verificationCount++;
        profile.lastVerification = new Date();
        profile.failedAttempts = 0;
        this.emit("verified", profile);
      } else {
        profile.failedAttempts++;
        if (profile.failedAttempts >= 5) {
          profile.status = VoiceAuthStatus.SUSPENDED;
          this.emit("suspended", profile);
        }
      }

      await this.updateProfile(profile);

      return {
        success,
        confidence,
        userId,
        timestamp: new Date(),
        method: "verification",
        error: success ? undefined : "Voice verification failed",
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "verification",
        error: String(error),
      };
    }
  }

  /**
   * Capture voice samples
   */
  private async captureVoiceSamples(
    passphrase: string,
    count: number
  ): Promise<Float32Array[]> {
    const samples: Float32Array[] = [];

    for (let i = 0; i < count; i++) {
      const sample = await this.captureSingleSample(passphrase, i + 1);
      samples.push(sample);

      // Wait between samples
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return samples;
  }

  /**
   * Capture single voice sample
   */
  private async captureSingleSample(
    passphrase: string,
    attemptNumber: number
  ): Promise<Float32Array> {
    this.emit("captureprompt", { passphrase, attemptNumber });

    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!this.audioContext || !this.analyser) {
          throw new Error("Audio context not initialized");
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);

        const bufferLength = this.analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        // Record for 3 seconds
        const duration = 3000;
        const startTime = Date.now();
        const samples: Float32Array[] = [];

        const capture = () => {
          if (Date.now() - startTime < duration) {
            this.analyser!.getFloatTimeDomainData(dataArray);
            samples.push(new Float32Array(dataArray));
            requestAnimationFrame(capture);
          } else {
            // Stop recording
            stream.getTracks().forEach((track) => track.stop());
            source.disconnect();

            // Combine samples
            const combinedLength = samples.reduce(
              (acc, s) => acc + s.length,
              0
            );
            const combined = new Float32Array(combinedLength);
            let offset = 0;
            samples.forEach((s) => {
              combined.set(s, offset);
              offset += s.length;
            });

            resolve(combined);
          }
        };

        capture();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate voice print from samples
   */
  private async generateVoicePrint(
    samples: Float32Array[]
  ): Promise<VoicePrint> {
    // Extract features from voice samples
    const features = this.extractFeatures(samples);

    return {
      id: this.generateId(),
      features,
      samples: samples.length,
      quality: this.calculateQuality(samples),
      lastUpdated: new Date(),
    };
  }

  /**
   * Extract voice features
   */
  private extractFeatures(samples: Float32Array[]): number[] {
    // Simplified feature extraction
    // In production, would use more sophisticated algorithms like:
    // - MFCC (Mel-frequency cepstral coefficients)
    // - Pitch detection
    // - Formant analysis
    // - Energy distribution

    const features: number[] = [];

    samples.forEach((sample) => {
      // Calculate basic statistics
      const mean = this.calculateMean(sample);
      const variance = this.calculateVariance(sample, mean);
      const energy = this.calculateEnergy(sample);
      const zeroCrossings = this.calculateZeroCrossings(sample);

      features.push(mean, variance, energy, zeroCrossings);

      // Add frequency domain features
      const fftFeatures = this.extractFFTFeatures(sample);
      features.push(...fftFeatures);
    });

    return features;
  }

  /**
   * Calculate mean
   */
  private calculateMean(data: Float32Array): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(data: Float32Array, mean: number): number {
    const squaredDiffs = Array.from(data).map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate energy
   */
  private calculateEnergy(data: Float32Array): number {
    return (
      data.reduce((sum, val) => sum + val * val, 0) / data.length
    );
  }

  /**
   * Calculate zero crossings
   */
  private calculateZeroCrossings(data: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
        crossings++;
      }
    }
    return crossings / data.length;
  }

  /**
   * Extract FFT features
   */
  private extractFFTFeatures(data: Float32Array): number[] {
    // Simplified FFT features
    // In production, would use proper FFT implementation
    const features: number[] = [];

    // Split into frequency bands and calculate energy
    const bandSize = Math.floor(data.length / 8);
    for (let i = 0; i < 8; i++) {
      const start = i * bandSize;
      const end = Math.min(start + bandSize, data.length);
      const band = data.slice(start, end);
      const bandEnergy = this.calculateEnergy(band);
      features.push(bandEnergy);
    }

    return features;
  }

  /**
   * Compare voice prints
   */
  private compareVoicePrints(
    enrolled: VoicePrint,
    sample: VoicePrint
  ): number {
    // Calculate similarity between voice prints
    // Using cosine similarity

    const features1 = enrolled.features;
    const features2 = sample.features;

    if (features1.length !== features2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      magnitude1 += features1[i] * features1[i];
      magnitude2 += features2[i] * features2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate sample quality
   */
  private calculateQuality(samples: Float32Array[]): number {
    // Simplified quality calculation
    let totalEnergy = 0;
    let totalSamples = 0;

    samples.forEach((sample) => {
      totalEnergy += this.calculateEnergy(sample);
      totalSamples++;
    });

    const avgEnergy = totalEnergy / totalSamples;

    // Normalize to 0-100
    return Math.min(avgEnergy * 1000, 100);
  }

  /**
   * Get user profile
   */
  private async getProfile(userId: string): Promise<VoiceAuthProfile | null> {
    // Check cache
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)!;
    }

    // Load from storage (would typically fetch from backend)
    const profile = await this.loadProfile(userId);
    if (profile) {
      this.profiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Store profile (mock implementation)
   */
  private async storeProfile(profile: VoiceAuthProfile): Promise<void> {
    // In production, would store to backend
    // For now, just keep in memory
    this.emit("profilestored", profile);
  }

  /**
   * Update profile (mock implementation)
   */
  private async updateProfile(profile: VoiceAuthProfile): Promise<void> {
    // In production, would update backend
    this.profiles.set(profile.userId, profile);
    this.emit("profileupdated", profile);
  }

  /**
   * Load profile (mock implementation)
   */
  private async loadProfile(userId: string): Promise<VoiceAuthProfile | null> {
    // In production, would load from backend
    return null;
  }

  /**
   * Re-enroll user (update voice print)
   */
  async reEnrollUser(userId: string, passphrase: string): Promise<VoiceAuthResult> {
    const profile = await this.getProfile(userId);

    if (!profile) {
      return {
        success: false,
        confidence: 0,
        timestamp: new Date(),
        method: "enrollment",
        error: "User not found",
      };
    }

    // Capture new samples
    const samples = await this.captureVoiceSamples(passphrase, 3);
    const newVoicePrint = await this.generateVoicePrint(samples);

    profile.voicePrint = newVoicePrint;
    profile.enrollmentDate = new Date();
    profile.status = VoiceAuthStatus.ACTIVE;
    profile.failedAttempts = 0;

    await this.updateProfile(profile);

    this.emit("reenrolled", profile);

    return {
      success: true,
      confidence: 1.0,
      userId,
      timestamp: new Date(),
      method: "enrollment",
    };
  }

  /**
   * Revoke user voice profile
   */
  async revokeProfile(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);

    if (profile) {
      profile.status = VoiceAuthStatus.REVOKED;
      await this.updateProfile(profile);
      this.profiles.delete(userId);
      this.emit("revoked", profile);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `vp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceAuthConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit("configchange", this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): VoiceAuthConfig {
    return { ...this.config };
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
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.profiles.clear();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// ============================================================================
// Global Voice Auth Instance
// ============================================================================

let globalVoiceAuth: VoiceAuthService | null = null;

export function getVoiceAuthService(
  config?: Partial<VoiceAuthConfig>
): VoiceAuthService {
  if (!globalVoiceAuth) {
    globalVoiceAuth = new VoiceAuthService(config);
  }
  return globalVoiceAuth;
}

export function resetVoiceAuthService(): void {
  if (globalVoiceAuth) {
    globalVoiceAuth.destroy();
    globalVoiceAuth = null;
  }
}

// ============================================================================
// Browser Compatibility Check
// ============================================================================

export function isVoiceAuthSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    (window.AudioContext || (window as any).webkitAudioContext)
  );
}
