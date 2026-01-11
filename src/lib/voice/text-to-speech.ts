/**
 * Text-to-Speech Service
 * Web Speech Synthesis API with queue management and accessibility features
 */

import { TTSConfig, TTSRequest, TTSResult, TTSPriority } from "@/types/voice";

// ============================================================================
// Text-to-Speech Service
// ============================================================================

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private config: TTSConfig;
  private queue: TTSRequest[] = [];
  private isPlaying = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(config?: Partial<TTSConfig>) {
    this.synthesis = window.speechSynthesis;
    this.config = {
      voice: "default",
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: "en-US",
      preferredVoices: {
        male: "Google US English Male",
        female: "Google US English Female",
        neutral: "Google US English",
      },
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize TTS service
   */
  private async initialize(): Promise<void> {
    // Load available voices
    await this.loadVoices();

    // Listen for voice changes
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  private async loadVoices(): Promise<void> {
    this.availableVoices = this.synthesis.getVoices();

    if (this.availableVoices.length === 0) {
      // Some browsers need a delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.availableVoices = this.synthesis.getVoices();
    }

    this.emit("voicesloaded", this.availableVoices);
  }

  /**
   * Speak text
   */
  async speak(text: string, config?: Partial<TTSConfig>): Promise<TTSResult> {
    const request: TTSRequest = {
      text,
      config,
      priority: TTSPriority.NORMAL,
      interruptible: true,
    };

    return this.speakRequest(request);
  }

  /**
   * Speak with priority
   */
  async speakWithPriority(
    text: string,
    priority: TTSPriority,
    interruptible: boolean = true
  ): Promise<TTSResult> {
    const request: TTSRequest = {
      text,
      priority,
      interruptible,
    };

    return this.speakRequest(request);
  }

  /**
   * Process speak request
   */
  private async speakRequest(request: TTSRequest): Promise<TTSResult> {
    const startTime = Date.now();

    try {
      // Add to queue
      if (request.priority === TTSPriority.CRITICAL) {
        // Critical messages go to front
        this.queue.unshift(request);
        if (this.isPlaying && this.currentUtterance) {
          this.synthesis.cancel();
        }
      } else if (request.priority === TTSPriority.HIGH) {
        // High priority after critical
        const criticalIndex = this.queue.findIndex(
          (r) => r.priority !== TTSPriority.CRITICAL
        );
        if (criticalIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(criticalIndex, 0, request);
        }
      } else {
        // Normal and low priority at end
        this.queue.push(request);
      }

      // Start processing if not already playing
      if (!this.isPlaying) {
        await this.processQueue();
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        timestamp: new Date(),
        error: String(error),
      };
    }
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.emit("queueempty");
      return;
    }

    this.isPlaying = true;
    const request = this.queue.shift()!;

    await this.speakUtterance(request);
    await this.processQueue();
  }

  /**
   * Speak single utterance
   */
  private async speakUtterance(request: TTSRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      this.currentUtterance = utterance;

      // Apply configuration
      const finalConfig = { ...this.config, ...request.config };
      utterance.rate = finalConfig.rate;
      utterance.pitch = finalConfig.pitch;
      utterance.volume = finalConfig.volume;
      utterance.lang = finalConfig.language;

      // Select voice
      const voice = this.selectVoice(finalConfig);
      if (voice) {
        utterance.voice = voice;
      }

      // Event handlers
      utterance.onstart = () => {
        this.emit("start", request);
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.emit("end", request);
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        this.emit("error", event);
        reject(event);
      };

      utterance.onpause = () => {
        this.emit("pause");
      };

      utterance.onresume = () => {
        this.emit("resume");
      };

      utterance.onboundary = (event) => {
        this.emit("boundary", event);
      };

      // Speak
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Select appropriate voice
   */
  private selectVoice(
    config: TTSConfig
  ): SpeechSynthesisVoice | undefined {
    // Try to find preferred voice
    if (config.voice !== "default") {
      const found = this.availableVoices.find((v) => v.name === config.voice);
      if (found) return found;
    }

    // Try preferred voices
    for (const preferred of Object.values(config.preferredVoices)) {
      const found = this.availableVoices.find((v) => v.name === preferred);
      if (found) return found;
    }

    // Find voice matching language
    const languageVoice = this.availableVoices.find(
      (v) => v.lang === config.language
    );
    if (languageVoice) return languageVoice;

    // Default to first available
    return this.availableVoices[0];
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.isPlaying) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop speaking
   */
  stop(): void {
    this.synthesis.cancel();
    this.queue = [];
    this.isPlaying = false;
    this.currentUtterance = null;
    this.emit("stop");
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * Get voices by language
   */
  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((v) => v.lang.startsWith(language));
  }

  /**
   * Get voice by name
   */
  getVoiceByName(name: string): SpeechSynthesisVoice | undefined {
    return this.availableVoices.find((v) => v.name === name);
  }

  /**
   * Check if speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * Speak medical alert (high priority)
   */
  async speakAlert(text: string): Promise<TTSResult> {
    return this.speakWithPriority(text, TTSPriority.HIGH, false);
  }

  /**
   * Speak critical alert (highest priority, interrupts)
   */
  async speakCriticalAlert(text: string): Promise<TTSResult> {
    return this.speakWithPriority(text, TTSPriority.CRITICAL, false);
  }

  /**
   * Speak accessibility description (low priority)
   */
  async speakDescription(text: string): Promise<TTSResult> {
    return this.speakWithPriority(text, TTSPriority.LOW);
  }

  /**
   * Speak command confirmation
   */
  async speakConfirmation(command: string): Promise<TTSResult> {
    return this.speak(`Executing ${command}`);
  }

  /**
   * Speak error message
   */
  async speakError(error: string): Promise<TTSResult> {
    return this.speakWithPriority(`Error: ${error}`, TTSPriority.HIGH);
  }

  /**
   * Spell out text (for clarity)
   */
  async spell(text: string): Promise<TTSResult> {
    const spelled = text.split("").join(" ");
    return this.speak(spelled, { rate: 0.8 });
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
    this.listeners.clear();
  }
}

// ============================================================================
// Global TTS Instance
// ============================================================================

let globalTTSService: TextToSpeechService | null = null;

export function getTTSService(config?: Partial<TTSConfig>): TextToSpeechService {
  if (!globalTTSService) {
    globalTTSService = new TextToSpeechService(config);
  }
  return globalTTSService;
}

export function resetTTSService(): void {
  if (globalTTSService) {
    globalTTSService.destroy();
    globalTTSService = null;
  }
}

// ============================================================================
// Browser Compatibility Check
// ============================================================================

export function isTTSSupported(): boolean {
  return "speechSynthesis" in window;
}

export function getTTSCapabilities() {
  const synthesis = window.speechSynthesis;
  return {
    supported: isTTSSupported(),
    voiceCount: synthesis?.getVoices()?.length || 0,
    pausing: true,
    cancel: true,
  };
}
