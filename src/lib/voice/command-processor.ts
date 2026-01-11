/**
 * Voice Command Processor
 * Natural language command recognition and execution for clinical workflows
 */

import {
  VoiceCommand,
  VoiceCommandCategory,
  VoiceCommandContext,
  VoiceCommandMatch,
  VoiceCommandExecution,
  VoiceCommandResult,
} from "@/types/voice";

// ============================================================================
// Predefined Voice Commands
// ============================================================================

export const VOICE_COMMANDS: VoiceCommand[] = [
  // Navigation Commands
  {
    id: "nav-dashboard",
    command: "Go to dashboard",
    pattern: /^(go to|open|show|navigate to)\s+(the\s+)?(dashboard|home)/i,
    category: VoiceCommandCategory.NAVIGATION,
    action: "navigate",
    parameters: { route: "/dashboard" },
    requiresConfirmation: false,
    description: "Navigate to dashboard",
    examples: ["Go to dashboard", "Open dashboard", "Show dashboard"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "nav-patient-list",
    command: "Go to patient list",
    pattern: /^(go to|open|show)\s+(the\s+)?(patient\s+list|patients)/i,
    category: VoiceCommandCategory.NAVIGATION,
    action: "navigate",
    parameters: { route: "/patients" },
    requiresConfirmation: false,
    description: "Navigate to patient list",
    examples: ["Go to patient list", "Show patients", "Open patient list"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "nav-schedule",
    command: "Go to schedule",
    pattern: /^(go to|open|show)\s+(the\s+)?(schedule|calendar|appointments)/i,
    category: VoiceCommandCategory.NAVIGATION,
    action: "navigate",
    parameters: { route: "/schedule" },
    requiresConfirmation: false,
    description: "Navigate to schedule",
    examples: ["Go to schedule", "Show calendar", "Open appointments"],
    context: [VoiceCommandContext.GLOBAL],
  },

  // Patient Search
  {
    id: "search-patient-name",
    command: "Search patient by name",
    pattern:
      /^(search|find|look up)\s+(patient|for)\s+(.+?)(?:\s+in\s+patients)?$/i,
    category: VoiceCommandCategory.PATIENT_SEARCH,
    action: "searchPatient",
    requiresConfirmation: false,
    description: "Search for patient by name",
    examples: ["Search patient John Doe", "Find patient Smith"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "search-patient-mrn",
    command: "Search patient by MRN",
    pattern: /^(search|find|look up)\s+(mrn|medical record number)\s+(.+)$/i,
    category: VoiceCommandCategory.PATIENT_SEARCH,
    action: "searchPatientByMRN",
    requiresConfirmation: false,
    description: "Search for patient by MRN",
    examples: ["Search MRN 123456", "Find MRN 789012"],
    context: [VoiceCommandContext.GLOBAL],
  },

  // Documentation Commands
  {
    id: "start-note",
    command: "Start new note",
    pattern: /^(start|begin|create|new)\s+(a\s+)?(progress\s+)?note/i,
    category: VoiceCommandCategory.DOCUMENTATION,
    action: "startNote",
    requiresConfirmation: false,
    description: "Start new progress note",
    examples: ["Start note", "New note", "Create progress note"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "save-note",
    command: "Save note",
    pattern: /^(save|save note|save document)/i,
    category: VoiceCommandCategory.DOCUMENTATION,
    action: "saveNote",
    requiresConfirmation: true,
    description: "Save current note",
    examples: ["Save note", "Save"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "sign-note",
    command: "Sign note",
    pattern: /^(sign|sign note|sign document)/i,
    category: VoiceCommandCategory.DOCUMENTATION,
    action: "signNote",
    requiresConfirmation: true,
    description: "Sign current note",
    examples: ["Sign note", "Sign document"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "discard-note",
    command: "Discard note",
    pattern: /^(discard|cancel|delete)\s+(note|document)/i,
    category: VoiceCommandCategory.DOCUMENTATION,
    action: "discardNote",
    requiresConfirmation: true,
    description: "Discard current note",
    examples: ["Discard note", "Cancel note"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },

  // Order Entry Commands
  {
    id: "order-lab",
    command: "Order lab test",
    pattern: /^(order|add|new)\s+(lab|laboratory)\s+(.+)$/i,
    category: VoiceCommandCategory.ORDER_ENTRY,
    action: "orderLab",
    requiresConfirmation: true,
    description: "Order laboratory test",
    examples: ["Order lab CBC", "Order laboratory comprehensive metabolic panel"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "order-imaging",
    command: "Order imaging",
    pattern: /^(order|add|new)\s+(imaging|radiology|x-ray|ct|mri)\s+(.+)$/i,
    category: VoiceCommandCategory.ORDER_ENTRY,
    action: "orderImaging",
    requiresConfirmation: true,
    description: "Order imaging study",
    examples: ["Order imaging chest x-ray", "Order CT abdomen"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "order-medication",
    command: "Order medication",
    pattern: /^(order|prescribe|add)\s+(medication|med|prescription)\s+(.+)$/i,
    category: VoiceCommandCategory.ORDER_ENTRY,
    action: "orderMedication",
    requiresConfirmation: true,
    description: "Order medication",
    examples: [
      "Order medication lisinopril",
      "Prescribe medication metformin",
    ],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },

  // Scheduling Commands
  {
    id: "schedule-appointment",
    command: "Schedule appointment",
    pattern: /^(schedule|book|create)\s+(appointment|visit)\s+(.+)$/i,
    category: VoiceCommandCategory.SCHEDULING,
    action: "scheduleAppointment",
    requiresConfirmation: true,
    description: "Schedule new appointment",
    examples: ["Schedule appointment tomorrow", "Book visit next week"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.SCHEDULE],
  },
  {
    id: "cancel-appointment",
    command: "Cancel appointment",
    pattern: /^(cancel|delete|remove)\s+(appointment|visit)(\s+(.+))?$/i,
    category: VoiceCommandCategory.SCHEDULING,
    action: "cancelAppointment",
    requiresConfirmation: true,
    description: "Cancel appointment",
    examples: ["Cancel appointment", "Cancel visit tomorrow"],
    context: [VoiceCommandContext.SCHEDULE],
  },

  // Clinical Commands
  {
    id: "add-diagnosis",
    command: "Add diagnosis",
    pattern: /^(add|new)\s+(diagnosis|problem)\s+(.+)$/i,
    category: VoiceCommandCategory.CLINICAL,
    action: "addDiagnosis",
    requiresConfirmation: true,
    description: "Add diagnosis to problem list",
    examples: ["Add diagnosis hypertension", "Add problem diabetes"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },
  {
    id: "add-allergy",
    command: "Add allergy",
    pattern: /^(add|new|document)\s+allergy\s+(to\s+)?(.+)$/i,
    category: VoiceCommandCategory.CLINICAL,
    action: "addAllergy",
    requiresConfirmation: true,
    description: "Add allergy",
    examples: ["Add allergy penicillin", "Add allergy to peanuts"],
    context: [VoiceCommandContext.PATIENT_CHART],
  },
  {
    id: "record-vitals",
    command: "Record vital signs",
    pattern: /^(record|enter|add)\s+(vital signs|vitals)$/i,
    category: VoiceCommandCategory.CLINICAL,
    action: "recordVitals",
    requiresConfirmation: false,
    description: "Open vitals entry",
    examples: ["Record vital signs", "Enter vitals"],
    context: [VoiceCommandContext.PATIENT_CHART, VoiceCommandContext.ENCOUNTER],
  },

  // System Commands
  {
    id: "help",
    command: "Help",
    pattern: /^(help|what can you do|show commands)$/i,
    category: VoiceCommandCategory.SYSTEM,
    action: "showHelp",
    requiresConfirmation: false,
    description: "Show available voice commands",
    examples: ["Help", "What can you do", "Show commands"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "stop-listening",
    command: "Stop listening",
    pattern: /^(stop listening|turn off|disable voice)$/i,
    category: VoiceCommandCategory.SYSTEM,
    action: "stopListening",
    requiresConfirmation: false,
    description: "Stop voice recognition",
    examples: ["Stop listening", "Turn off", "Disable voice"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "repeat",
    command: "Repeat",
    pattern: /^(repeat|say again|what)$/i,
    category: VoiceCommandCategory.SYSTEM,
    action: "repeat",
    requiresConfirmation: false,
    description: "Repeat last response",
    examples: ["Repeat", "Say again"],
    context: [VoiceCommandContext.GLOBAL],
  },

  // Accessibility Commands
  {
    id: "read-screen",
    command: "Read screen",
    pattern: /^(read|read screen|what's on screen)$/i,
    category: VoiceCommandCategory.ACCESSIBILITY,
    action: "readScreen",
    requiresConfirmation: false,
    description: "Read current screen content",
    examples: ["Read screen", "What's on screen"],
    context: [VoiceCommandContext.GLOBAL],
  },
  {
    id: "describe-page",
    command: "Describe page",
    pattern: /^(describe|describe page|where am i)$/i,
    category: VoiceCommandCategory.ACCESSIBILITY,
    action: "describePage",
    requiresConfirmation: false,
    description: "Describe current page",
    examples: ["Describe page", "Where am I"],
    context: [VoiceCommandContext.GLOBAL],
  },
];

// ============================================================================
// Voice Command Processor
// ============================================================================

export class VoiceCommandProcessor {
  private commands: VoiceCommand[] = [];
  private customCommands: VoiceCommand[] = [];
  private currentContext: VoiceCommandContext = VoiceCommandContext.GLOBAL;
  private lastExecution: VoiceCommandExecution | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private enabled = true;

  constructor() {
    this.commands = [...VOICE_COMMANDS];
  }

  /**
   * Process voice input
   */
  process(input: string, userId: string): VoiceCommandMatch | null {
    if (!this.enabled) {
      return null;
    }

    const normalizedInput = input.trim();
    const matches: VoiceCommandMatch[] = [];

    // Check all commands
    const allCommands = [...this.commands, ...this.customCommands];

    for (const command of allCommands) {
      // Check context
      if (
        !command.context?.includes(this.currentContext) &&
        !command.context?.includes(VoiceCommandContext.GLOBAL)
      ) {
        continue;
      }

      // Match pattern
      const match = this.matchPattern(normalizedInput, command);
      if (match) {
        matches.push(match);
      }
    }

    // Return best match (highest confidence)
    if (matches.length > 0) {
      matches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = matches[0];
      this.emit("match", bestMatch);
      return bestMatch;
    }

    this.emit("nomatch", input);
    return null;
  }

  /**
   * Match input against command pattern
   */
  private matchPattern(
    input: string,
    command: VoiceCommand
  ): VoiceCommandMatch | null {
    const pattern =
      typeof command.pattern === "string"
        ? new RegExp(command.pattern, "i")
        : command.pattern;

    const match = input.match(pattern);
    if (!match) {
      return null;
    }

    // Calculate confidence based on match quality
    let confidence = 0.8; // Base confidence

    // Exact match increases confidence
    if (match[0].toLowerCase() === input.toLowerCase()) {
      confidence = 1.0;
    }

    // Extract parameters from capture groups
    const parameters: Record<string, any> = { ...command.parameters };

    if (match.length > 1) {
      // Add captured groups as parameters
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          parameters[`param${i}`] = match[i].trim();
        }
      }
    }

    return {
      command,
      confidence,
      parameters,
      rawInput: input,
    };
  }

  /**
   * Execute command
   */
  async execute(
    match: VoiceCommandMatch,
    userId: string
  ): Promise<VoiceCommandResult> {
    const execution: VoiceCommandExecution = {
      commandId: match.command.id,
      input: match.rawInput,
      match,
      result: { success: false, message: "" },
      timestamp: new Date(),
      userId,
      context: this.currentContext,
    };

    try {
      // Check permissions
      if (match.command.permissions && match.command.permissions.length > 0) {
        // Permission check would go here
        // For now, assume user has permissions
      }

      // Emit before execution
      this.emit("beforeexecute", execution);

      // Execute action
      const result = await this.executeAction(match);
      execution.result = result;

      // Store last execution
      this.lastExecution = execution;

      // Emit after execution
      this.emit("afterexecute", execution);

      return result;
    } catch (error) {
      const result: VoiceCommandResult = {
        success: false,
        message: `Failed to execute command: ${error}`,
        error: String(error),
      };

      execution.result = result;
      this.emit("error", { execution, error });

      return result;
    }
  }

  /**
   * Execute command action
   */
  private async executeAction(
    match: VoiceCommandMatch
  ): Promise<VoiceCommandResult> {
    const { command, parameters } = match;

    // Emit action event for handlers to process
    return new Promise((resolve) => {
      const handled = this.emit("action", {
        action: command.action,
        command,
        parameters,
        resolve,
      });

      if (!handled) {
        resolve({
          success: false,
          message: `No handler registered for action: ${command.action}`,
        });
      }
    });
  }

  /**
   * Add custom command
   */
  addCommand(command: VoiceCommand): void {
    this.customCommands.push(command);
    this.emit("commandadded", command);
  }

  /**
   * Remove custom command
   */
  removeCommand(commandId: string): void {
    const index = this.customCommands.findIndex((c) => c.id === commandId);
    if (index !== -1) {
      const removed = this.customCommands.splice(index, 1)[0];
      this.emit("commandremoved", removed);
    }
  }

  /**
   * Get all commands for current context
   */
  getAvailableCommands(): VoiceCommand[] {
    return [...this.commands, ...this.customCommands].filter(
      (cmd) =>
        cmd.context?.includes(this.currentContext) ||
        cmd.context?.includes(VoiceCommandContext.GLOBAL)
    );
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: VoiceCommandCategory): VoiceCommand[] {
    return [...this.commands, ...this.customCommands].filter(
      (cmd) => cmd.category === category
    );
  }

  /**
   * Set current context
   */
  setContext(context: VoiceCommandContext): void {
    this.currentContext = context;
    this.emit("contextchange", context);
  }

  /**
   * Get current context
   */
  getContext(): VoiceCommandContext {
    return this.currentContext;
  }

  /**
   * Get last execution
   */
  getLastExecution(): VoiceCommandExecution | null {
    return this.lastExecution;
  }

  /**
   * Enable/disable command processing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit("enabledchange", enabled);
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get command suggestions for partial input
   */
  getSuggestions(partialInput: string, limit: number = 5): VoiceCommand[] {
    const lower = partialInput.toLowerCase();
    const suggestions = this.getAvailableCommands().filter((cmd) =>
      cmd.command.toLowerCase().includes(lower)
    );

    return suggestions.slice(0, limit);
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

  private emit(event: string, ...args: any[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return false;
    }

    handlers.forEach((callback) => callback(...args));
    return true;
  }

  /**
   * Clear all custom commands
   */
  clearCustomCommands(): void {
    this.customCommands = [];
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.customCommands = [];
    this.currentContext = VoiceCommandContext.GLOBAL;
    this.lastExecution = null;
    this.enabled = true;
  }
}

// ============================================================================
// Global Command Processor Instance
// ============================================================================

let globalCommandProcessor: VoiceCommandProcessor | null = null;

export function getCommandProcessor(): VoiceCommandProcessor {
  if (!globalCommandProcessor) {
    globalCommandProcessor = new VoiceCommandProcessor();
  }
  return globalCommandProcessor;
}

export function resetCommandProcessor(): void {
  globalCommandProcessor = null;
}
