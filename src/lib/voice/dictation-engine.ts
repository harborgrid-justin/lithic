/**
 * Clinical Dictation Engine
 * Advanced dictation with medical templates, auto-formatting, and section management
 */

import {
  DictationSession,
  DictationDocumentType,
  DictationStatus,
  DictationSection,
  DictationSectionType,
  DictationMetadata,
  DictationCommand,
  DictationAction,
} from "@/types/voice";
import { getSpeechRecognitionService } from "./speech-recognition";
import { VoiceRecognitionResult } from "@/types/voice";

// ============================================================================
// Dictation Templates
// ============================================================================

const SECTION_TEMPLATES: Record<
  DictationDocumentType,
  DictationSectionType[]
> = {
  [DictationDocumentType.SOAP_NOTE]: [
    DictationSectionType.SUBJECTIVE,
    DictationSectionType.OBJECTIVE,
    DictationSectionType.ASSESSMENT,
    DictationSectionType.PLAN,
  ],
  [DictationDocumentType.PROGRESS_NOTE]: [
    DictationSectionType.CHIEF_COMPLAINT,
    DictationSectionType.HISTORY_PRESENT_ILLNESS,
    DictationSectionType.REVIEW_OF_SYSTEMS,
    DictationSectionType.PHYSICAL_EXAM,
    DictationSectionType.ASSESSMENT,
    DictationSectionType.PLAN,
  ],
  [DictationDocumentType.HISTORY_PHYSICAL]: [
    DictationSectionType.CHIEF_COMPLAINT,
    DictationSectionType.HISTORY_PRESENT_ILLNESS,
    DictationSectionType.PAST_MEDICAL_HISTORY,
    DictationSectionType.MEDICATIONS,
    DictationSectionType.ALLERGIES,
    DictationSectionType.SOCIAL_HISTORY,
    DictationSectionType.FAMILY_HISTORY,
    DictationSectionType.REVIEW_OF_SYSTEMS,
    DictationSectionType.PHYSICAL_EXAM,
    DictationSectionType.ASSESSMENT,
    DictationSectionType.PLAN,
  ],
  [DictationDocumentType.OPERATIVE_NOTE]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.DISCHARGE_SUMMARY]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.CONSULTATION]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.PROCEDURE_NOTE]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.RADIOLOGY_REPORT]: [
    DictationSectionType.TECHNIQUE,
    DictationSectionType.COMPARISON,
    DictationSectionType.FINDINGS,
    DictationSectionType.IMPRESSION,
  ],
  [DictationDocumentType.PATHOLOGY_REPORT]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.LETTER]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.PRESCRIPTION]: [
    DictationSectionType.CUSTOM,
  ],
  [DictationDocumentType.ORDER]: [
    DictationSectionType.CUSTOM,
  ],
};

// ============================================================================
// Dictation Commands
// ============================================================================

const DICTATION_COMMANDS: DictationCommand[] = [
  { phrase: "new paragraph", action: DictationAction.NEW_PARAGRAPH },
  { phrase: "new line", action: DictationAction.NEW_LINE },
  { phrase: "delete word", action: DictationAction.DELETE_WORD },
  { phrase: "delete sentence", action: DictationAction.DELETE_SENTENCE },
  { phrase: "delete paragraph", action: DictationAction.DELETE_PARAGRAPH },
  { phrase: "undo", action: DictationAction.UNDO },
  { phrase: "redo", action: DictationAction.REDO },
  { phrase: "period", action: DictationAction.INSERT_PERIOD },
  { phrase: "comma", action: DictationAction.INSERT_COMMA },
  { phrase: "question mark", action: DictationAction.INSERT_QUESTION_MARK },
  { phrase: "capitalize", action: DictationAction.CAPITALIZE },
  { phrase: "all caps", action: DictationAction.ALL_CAPS },
  { phrase: "no caps", action: DictationAction.NO_CAPS },
  { phrase: "scratch that", action: DictationAction.SCRATCH_THAT },
  { phrase: "pause dictation", action: DictationAction.PAUSE_DICTATION },
  { phrase: "resume dictation", action: DictationAction.RESUME_DICTATION },
  { phrase: "save dictation", action: DictationAction.SAVE_DICTATION },
  { phrase: "discard dictation", action: DictationAction.DISCARD_DICTATION },
];

// ============================================================================
// Dictation Engine
// ============================================================================

export class DictationEngine {
  private session: DictationSession | null = null;
  private recognition = getSpeechRecognitionService({
    continuous: true,
    interimResults: true,
    medicalVocabulary: true,
    punctuation: true,
  });
  private currentSection: DictationSection | null = null;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private listeners: Map<string, Set<Function>> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private startTime: Date | null = null;

  constructor() {
    this.setupRecognitionHandlers();
  }

  /**
   * Setup recognition event handlers
   */
  private setupRecognitionHandlers(): void {
    this.recognition.on("finalresult", (result: VoiceRecognitionResult) => {
      this.handleTranscript(result.transcript, true);
    });

    this.recognition.on("interimresult", (result: VoiceRecognitionResult) => {
      this.handleTranscript(result.transcript, false);
    });

    this.recognition.on("error", (error: any) => {
      this.emit("error", error);
    });
  }

  /**
   * Start new dictation session
   */
  async startSession(
    userId: string,
    providerId: string,
    providerName: string,
    specialty: string,
    facilityId: string,
    documentType: DictationDocumentType,
    patientId?: string,
    encounterId?: string,
    templateId?: string
  ): Promise<DictationSession> {
    if (this.session && this.session.status === DictationStatus.ACTIVE) {
      throw new Error("Dictation session already active");
    }

    this.startTime = new Date();

    // Create session
    this.session = {
      id: this.generateId(),
      userId,
      patientId,
      encounterId,
      documentType,
      status: DictationStatus.ACTIVE,
      transcript: "",
      sections: this.initializeSections(documentType),
      startedAt: this.startTime,
      duration: 0,
      wordCount: 0,
      metadata: {
        providerId,
        providerName,
        specialty,
        facilityId,
        templateId,
        correctionCount: 0,
        aiAssisted: false,
      },
    };

    // Set first section as current
    if (this.session.sections.length > 0) {
      this.currentSection = this.session.sections[0];
    }

    // Start recognition
    await this.recognition.initialize();
    await this.recognition.start();

    this.emit("sessionstarted", this.session);

    return this.session;
  }

  /**
   * Initialize sections based on document type
   */
  private initializeSections(
    documentType: DictationDocumentType
  ): DictationSection[] {
    const sectionTypes = SECTION_TEMPLATES[documentType] || [];
    return sectionTypes.map((type, index) => ({
      id: this.generateId(),
      type,
      title: this.getSectionTitle(type),
      content: "",
      order: index,
      timestamp: new Date(),
      autoGenerated: false,
    }));
  }

  /**
   * Get section title
   */
  private getSectionTitle(type: DictationSectionType): string {
    const titles: Record<DictationSectionType, string> = {
      [DictationSectionType.CHIEF_COMPLAINT]: "Chief Complaint",
      [DictationSectionType.HISTORY_PRESENT_ILLNESS]:
        "History of Present Illness",
      [DictationSectionType.REVIEW_OF_SYSTEMS]: "Review of Systems",
      [DictationSectionType.PAST_MEDICAL_HISTORY]: "Past Medical History",
      [DictationSectionType.MEDICATIONS]: "Medications",
      [DictationSectionType.ALLERGIES]: "Allergies",
      [DictationSectionType.SOCIAL_HISTORY]: "Social History",
      [DictationSectionType.FAMILY_HISTORY]: "Family History",
      [DictationSectionType.PHYSICAL_EXAM]: "Physical Examination",
      [DictationSectionType.ASSESSMENT]: "Assessment",
      [DictationSectionType.PLAN]: "Plan",
      [DictationSectionType.SUBJECTIVE]: "Subjective",
      [DictationSectionType.OBJECTIVE]: "Objective",
      [DictationSectionType.IMPRESSION]: "Impression",
      [DictationSectionType.FINDINGS]: "Findings",
      [DictationSectionType.TECHNIQUE]: "Technique",
      [DictationSectionType.COMPARISON]: "Comparison",
      [DictationSectionType.RECOMMENDATION]: "Recommendation",
      [DictationSectionType.CUSTOM]: "Custom",
    };
    return titles[type] || "Untitled";
  }

  /**
   * Handle transcript from recognition
   */
  private handleTranscript(transcript: string, isFinal: boolean): void {
    if (!this.session || !this.currentSection) return;

    // Check for dictation commands
    const command = this.detectCommand(transcript);
    if (command) {
      this.executeCommand(command);
      return;
    }

    // Update section content
    if (isFinal) {
      this.addToCurrentSection(transcript);
      this.saveUndoState();
      this.emit("transcript", { transcript, isFinal });
    } else {
      this.emit("interimtranscript", { transcript, isFinal });
    }
  }

  /**
   * Detect dictation command
   */
  private detectCommand(transcript: string): DictationCommand | null {
    const lower = transcript.toLowerCase().trim();
    return DICTATION_COMMANDS.find((cmd) => lower === cmd.phrase) || null;
  }

  /**
   * Execute dictation command
   */
  private executeCommand(command: DictationCommand): void {
    if (!this.session || !this.currentSection) return;

    this.saveUndoState();

    switch (command.action) {
      case DictationAction.NEW_PARAGRAPH:
        this.currentSection.content += "\n\n";
        break;

      case DictationAction.NEW_LINE:
        this.currentSection.content += "\n";
        break;

      case DictationAction.DELETE_WORD:
        this.deleteLastWord();
        break;

      case DictationAction.DELETE_SENTENCE:
        this.deleteLastSentence();
        break;

      case DictationAction.DELETE_PARAGRAPH:
        this.deleteLastParagraph();
        break;

      case DictationAction.UNDO:
        this.undo();
        break;

      case DictationAction.REDO:
        this.redo();
        break;

      case DictationAction.INSERT_PERIOD:
        this.currentSection.content += ".";
        break;

      case DictationAction.INSERT_COMMA:
        this.currentSection.content += ",";
        break;

      case DictationAction.INSERT_QUESTION_MARK:
        this.currentSection.content += "?";
        break;

      case DictationAction.CAPITALIZE:
        this.capitalizeLastWord();
        break;

      case DictationAction.ALL_CAPS:
        this.allCapsLastWord();
        break;

      case DictationAction.NO_CAPS:
        this.noCapsLastWord();
        break;

      case DictationAction.SCRATCH_THAT:
        this.deleteLastSentence();
        break;

      case DictationAction.PAUSE_DICTATION:
        this.pause();
        break;

      case DictationAction.RESUME_DICTATION:
        this.resume();
        break;

      case DictationAction.SAVE_DICTATION:
        this.save();
        break;

      case DictationAction.DISCARD_DICTATION:
        this.discard();
        break;
    }

    this.emit("command", command);
  }

  /**
   * Add text to current section
   */
  private addToCurrentSection(text: string): void {
    if (!this.currentSection) return;

    if (this.currentSection.content.length > 0) {
      this.currentSection.content += " ";
    }
    this.currentSection.content += text;
    this.updateSessionStats();
  }

  /**
   * Delete last word
   */
  private deleteLastWord(): void {
    if (!this.currentSection) return;
    const words = this.currentSection.content.trim().split(/\s+/);
    words.pop();
    this.currentSection.content = words.join(" ");
  }

  /**
   * Delete last sentence
   */
  private deleteLastSentence(): void {
    if (!this.currentSection) return;
    const sentences = this.currentSection.content.split(/[.!?]\s+/);
    sentences.pop();
    this.currentSection.content = sentences.join(". ");
    if (sentences.length > 0) {
      this.currentSection.content += ".";
    }
  }

  /**
   * Delete last paragraph
   */
  private deleteLastParagraph(): void {
    if (!this.currentSection) return;
    const paragraphs = this.currentSection.content.split(/\n\n+/);
    paragraphs.pop();
    this.currentSection.content = paragraphs.join("\n\n");
  }

  /**
   * Capitalize last word
   */
  private capitalizeLastWord(): void {
    if (!this.currentSection) return;
    const words = this.currentSection.content.trim().split(/\s+/);
    if (words.length > 0) {
      const lastWord = words[words.length - 1];
      words[words.length - 1] =
        lastWord.charAt(0).toUpperCase() + lastWord.slice(1).toLowerCase();
      this.currentSection.content = words.join(" ");
    }
  }

  /**
   * Convert last word to all caps
   */
  private allCapsLastWord(): void {
    if (!this.currentSection) return;
    const words = this.currentSection.content.trim().split(/\s+/);
    if (words.length > 0) {
      words[words.length - 1] = words[words.length - 1].toUpperCase();
      this.currentSection.content = words.join(" ");
    }
  }

  /**
   * Convert last word to lowercase
   */
  private noCapsLastWord(): void {
    if (!this.currentSection) return;
    const words = this.currentSection.content.trim().split(/\s+/);
    if (words.length > 0) {
      words[words.length - 1] = words[words.length - 1].toLowerCase();
      this.currentSection.content = words.join(" ");
    }
  }

  /**
   * Save undo state
   */
  private saveUndoState(): void {
    if (!this.currentSection) return;
    this.undoStack.push(this.currentSection.content);
    this.redoStack = []; // Clear redo stack on new action
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last action
   */
  private undo(): void {
    if (!this.currentSection || this.undoStack.length === 0) return;
    this.redoStack.push(this.currentSection.content);
    this.currentSection.content = this.undoStack.pop()!;
  }

  /**
   * Redo last undone action
   */
  private redo(): void {
    if (!this.currentSection || this.redoStack.length === 0) return;
    this.undoStack.push(this.currentSection.content);
    this.currentSection.content = this.redoStack.pop()!;
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(): void {
    if (!this.session) return;

    // Update transcript
    this.session.transcript = this.session.sections
      .map((s) => `${s.title}\n${s.content}`)
      .join("\n\n");

    // Update word count
    this.session.wordCount = this.session.transcript
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // Update duration
    if (this.startTime) {
      this.session.duration =
        (new Date().getTime() - this.startTime.getTime()) / 1000;
    }
  }

  /**
   * Navigate to section
   */
  navigateToSection(sectionId: string): boolean {
    if (!this.session) return false;

    const section = this.session.sections.find((s) => s.id === sectionId);
    if (section) {
      this.currentSection = section;
      this.emit("sectionchange", section);
      return true;
    }
    return false;
  }

  /**
   * Add custom section
   */
  addSection(title: string, type: DictationSectionType = DictationSectionType.CUSTOM): void {
    if (!this.session) return;

    const section: DictationSection = {
      id: this.generateId(),
      type,
      title,
      content: "",
      order: this.session.sections.length,
      timestamp: new Date(),
      autoGenerated: false,
    };

    this.session.sections.push(section);
    this.emit("sectionadded", section);
  }

  /**
   * Pause dictation
   */
  pause(): void {
    if (!this.session) return;
    this.session.status = DictationStatus.PAUSED;
    this.recognition.pause();
    this.emit("paused");
  }

  /**
   * Resume dictation
   */
  async resume(): Promise<void> {
    if (!this.session) return;
    this.session.status = DictationStatus.ACTIVE;
    await this.recognition.resume();
    this.emit("resumed");
  }

  /**
   * Save dictation
   */
  save(): void {
    if (!this.session) return;
    this.updateSessionStats();
    this.session.status = DictationStatus.SAVED;
    this.recognition.stop();
    this.emit("saved", this.session);
  }

  /**
   * Complete dictation
   */
  complete(): void {
    if (!this.session) return;
    this.updateSessionStats();
    this.session.status = DictationStatus.COMPLETED;
    this.session.endedAt = new Date();
    this.recognition.stop();
    this.emit("completed", this.session);
  }

  /**
   * Discard dictation
   */
  discard(): void {
    if (!this.session) return;
    this.session.status = DictationStatus.DISCARDED;
    this.recognition.stop();
    this.emit("discarded");
    this.session = null;
  }

  /**
   * Get current session
   */
  getSession(): DictationSession | null {
    return this.session;
  }

  /**
   * Get current section
   */
  getCurrentSection(): DictationSection | null {
    return this.currentSection;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    this.recognition.destroy();
    this.listeners.clear();
    this.session = null;
  }
}

// ============================================================================
// Global Dictation Engine Instance
// ============================================================================

let globalDictationEngine: DictationEngine | null = null;

export function getDictationEngine(): DictationEngine {
  if (!globalDictationEngine) {
    globalDictationEngine = new DictationEngine();
  }
  return globalDictationEngine;
}

export function resetDictationEngine(): void {
  if (globalDictationEngine) {
    globalDictationEngine.destroy();
    globalDictationEngine = null;
  }
}
