export class VoiceDictation {
  private recognition: any = null;
  private isRecording: boolean = false;
  private transcript: string = "";
  private onTranscript?: (text: string) => void;

  constructor() {
    // Initialize Web Speech API
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript = finalTranscript;

      if (this.onTranscript) {
        this.onTranscript(finalTranscript || interimTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.isRecording = false;
      this.updateUI();
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Restart if still recording
        this.recognition.start();
      }
    };
  }

  render(container: HTMLElement, onTranscript?: (text: string) => void) {
    this.onTranscript = onTranscript;

    container.innerHTML = `
      <div class="voice-dictation">
        <div class="dictation-controls">
          <button class="btn-record ${this.isRecording ? "recording" : ""}" data-action="toggle-record">
            <span class="record-icon">${this.isRecording ? "⏸️" : "🎤"}</span>
            <span class="record-label">${this.isRecording ? "Stop" : "Start"} Dictation</span>
          </button>

          <button class="btn btn-secondary" data-action="clear" ${!this.transcript ? "disabled" : ""}>
            Clear
          </button>

          <button class="btn btn-secondary" data-action="insert-template">
            Insert Template
          </button>
        </div>

        ${
          !this.isSupported()
            ? `
          <div class="alert alert-warning">
            Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.
          </div>
        `
            : ""
        }

        <div class="dictation-status">
          ${
            this.isRecording
              ? `
            <div class="status-indicator recording">
              <span class="status-dot"></span>
              <span class="status-text">Recording...</span>
            </div>
          `
              : `
            <div class="status-indicator">
              <span class="status-text">Ready</span>
            </div>
          `
          }
        </div>

        <div class="dictation-transcript">
          <h4>Transcript</h4>
          <div class="transcript-content" id="transcript-content">
            ${this.transcript || '<span class="placeholder">Your dictation will appear here...</span>'}
          </div>
        </div>

        <div class="dictation-commands">
          <h4>Voice Commands</h4>
          <div class="commands-list">
            <div class="command-item">
              <strong>"new line"</strong> - Insert line break
            </div>
            <div class="command-item">
              <strong>"new paragraph"</strong> - Start new paragraph
            </div>
            <div class="command-item">
              <strong>"period"</strong> - Insert period
            </div>
            <div class="command-item">
              <strong>"comma"</strong> - Insert comma
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  private attachEventListeners(container: HTMLElement) {
    const recordBtn = container.querySelector('[data-action="toggle-record"]');
    recordBtn?.addEventListener("click", () => this.toggleRecording());

    const clearBtn = container.querySelector('[data-action="clear"]');
    clearBtn?.addEventListener("click", () => this.clearTranscript());

    const templateBtn = container.querySelector(
      '[data-action="insert-template"]',
    );
    templateBtn?.addEventListener("click", () => this.insertTemplate());
  }

  private toggleRecording() {
    if (!this.isSupported()) {
      alert("Voice dictation is not supported in this browser");
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (!this.recognition) return;

    try {
      this.recognition.start();
      this.isRecording = true;
      this.updateUI();
    } catch (error) {
      console.error("Error starting recognition:", error);
    }
  }

  stopRecording() {
    if (!this.recognition) return;

    this.recognition.stop();
    this.isRecording = false;
    this.updateUI();
  }

  private clearTranscript() {
    this.transcript = "";
    this.updateTranscriptDisplay();

    if (this.onTranscript) {
      this.onTranscript("");
    }
  }

  private insertTemplate() {
    const template = `
CLINICAL HISTORY:
[Patient history]

TECHNIQUE:
[Imaging technique used]

FINDINGS:
[Detailed findings]

IMPRESSION:
[Clinical impression]

RECOMMENDATIONS:
[Follow-up recommendations]
    `.trim();

    this.transcript += "\n\n" + template;
    this.updateTranscriptDisplay();

    if (this.onTranscript) {
      this.onTranscript(this.transcript);
    }
  }

  private updateUI() {
    const recordBtn = document.querySelector(".btn-record");
    if (recordBtn) {
      recordBtn.className = `btn-record ${this.isRecording ? "recording" : ""}`;

      const icon = recordBtn.querySelector(".record-icon");
      const label = recordBtn.querySelector(".record-label");

      if (icon) icon.textContent = this.isRecording ? "⏸️" : "🎤";
      if (label)
        label.textContent =
          (this.isRecording ? "Stop" : "Start") + " Dictation";
    }

    const status = document.querySelector(".dictation-status");
    if (status) {
      status.innerHTML = this.isRecording
        ? `
        <div class="status-indicator recording">
          <span class="status-dot"></span>
          <span class="status-text">Recording...</span>
        </div>
      `
        : `
        <div class="status-indicator">
          <span class="status-text">Ready</span>
        </div>
      `;
    }
  }

  private updateTranscriptDisplay() {
    const transcriptContent = document.getElementById("transcript-content");
    if (transcriptContent) {
      transcriptContent.innerHTML =
        this.transcript ||
        '<span class="placeholder">Your dictation will appear here...</span>';
    }

    const clearBtn = document.querySelector(
      '[data-action="clear"]',
    ) as HTMLButtonElement;
    if (clearBtn) {
      clearBtn.disabled = !this.transcript;
    }
  }

  isSupported(): boolean {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }

  getTranscript(): string {
    return this.transcript;
  }

  setTranscript(text: string) {
    this.transcript = text;
    this.updateTranscriptDisplay();
  }

  destroy() {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.recognition = null;
  }
}
