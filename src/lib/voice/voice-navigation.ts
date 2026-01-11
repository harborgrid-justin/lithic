/**
 * Voice Navigation Service
 * Hands-free navigation system with route recognition and confirmation
 */

import {
  VoiceNavigationConfig,
  VoiceNavigationShortcut,
  VoiceNavigationResult,
} from "@/types/voice";

// ============================================================================
// Navigation Shortcuts
// ============================================================================

const DEFAULT_SHORTCUTS: VoiceNavigationShortcut[] = [
  // Dashboard & Home
  {
    id: "nav-dashboard",
    phrases: [
      "go to dashboard",
      "open dashboard",
      "show dashboard",
      "dashboard",
      "go home",
      "home",
    ],
    route: "/dashboard",
  },

  // Patient Management
  {
    id: "nav-patients",
    phrases: [
      "go to patients",
      "open patient list",
      "show patients",
      "patients",
      "patient list",
    ],
    route: "/patients",
  },
  {
    id: "nav-patient-search",
    phrases: ["search patients", "find patient", "patient search"],
    route: "/patients?search=true",
  },
  {
    id: "nav-new-patient",
    phrases: ["new patient", "add patient", "create patient"],
    route: "/patients/new",
    requiresPermission: "patient:create",
  },

  // Scheduling
  {
    id: "nav-schedule",
    phrases: [
      "go to schedule",
      "open schedule",
      "show schedule",
      "schedule",
      "calendar",
      "appointments",
    ],
    route: "/schedule",
  },
  {
    id: "nav-new-appointment",
    phrases: [
      "new appointment",
      "schedule appointment",
      "create appointment",
    ],
    route: "/schedule/new",
  },

  // Clinical
  {
    id: "nav-encounters",
    phrases: ["go to encounters", "open encounters", "encounters"],
    route: "/encounters",
  },
  {
    id: "nav-orders",
    phrases: ["go to orders", "open orders", "orders", "order entry"],
    route: "/orders",
  },
  {
    id: "nav-medications",
    phrases: ["go to medications", "open medications", "medications", "meds"],
    route: "/medications",
  },
  {
    id: "nav-allergies",
    phrases: ["go to allergies", "open allergies", "allergies"],
    route: "/allergies",
  },
  {
    id: "nav-problems",
    phrases: [
      "go to problems",
      "open problems",
      "problems",
      "problem list",
    ],
    route: "/problems",
  },

  // Lab & Imaging
  {
    id: "nav-lab-results",
    phrases: [
      "go to lab results",
      "open lab results",
      "lab results",
      "labs",
    ],
    route: "/lab-results",
  },
  {
    id: "nav-imaging",
    phrases: [
      "go to imaging",
      "open imaging",
      "imaging",
      "radiology",
      "x-rays",
    ],
    route: "/imaging",
  },

  // Billing
  {
    id: "nav-billing",
    phrases: ["go to billing", "open billing", "billing"],
    route: "/billing",
  },
  {
    id: "nav-claims",
    phrases: ["go to claims", "open claims", "claims"],
    route: "/billing/claims",
  },

  // Reports & Analytics
  {
    id: "nav-reports",
    phrases: ["go to reports", "open reports", "reports"],
    route: "/reports",
  },
  {
    id: "nav-analytics",
    phrases: ["go to analytics", "open analytics", "analytics"],
    route: "/analytics",
  },

  // Administration
  {
    id: "nav-settings",
    phrases: ["go to settings", "open settings", "settings"],
    route: "/settings",
  },
  {
    id: "nav-users",
    phrases: ["go to users", "open users", "users", "user management"],
    route: "/admin/users",
    requiresPermission: "admin:users",
  },
  {
    id: "nav-organization",
    phrases: [
      "go to organization",
      "organization settings",
      "organization",
    ],
    route: "/admin/organization",
    requiresPermission: "admin:organization",
  },

  // Documentation
  {
    id: "nav-documents",
    phrases: ["go to documents", "open documents", "documents"],
    route: "/documents",
  },
  {
    id: "nav-templates",
    phrases: ["go to templates", "open templates", "templates"],
    route: "/templates",
  },

  // Communication
  {
    id: "nav-messages",
    phrases: ["go to messages", "open messages", "messages", "inbox"],
    route: "/messages",
  },
  {
    id: "nav-tasks",
    phrases: ["go to tasks", "open tasks", "tasks", "task list"],
    route: "/tasks",
  },

  // Special Actions
  {
    id: "nav-back",
    phrases: ["go back", "back", "previous page"],
    route: "__back__",
  },
  {
    id: "nav-refresh",
    phrases: ["refresh", "reload page", "reload"],
    route: "__refresh__",
  },
];

// ============================================================================
// Voice Navigation Service
// ============================================================================

export class VoiceNavigationService {
  private config: VoiceNavigationConfig;
  private shortcuts: VoiceNavigationShortcut[];
  private listeners: Map<string, Set<Function>> = new Map();
  private navigationHistory: string[] = [];
  private pendingNavigation: VoiceNavigationShortcut | null = null;

  constructor(config?: Partial<VoiceNavigationConfig>) {
    this.config = {
      enabled: true,
      shortcuts: [],
      contextAware: true,
      confirmNavigation: false,
      ...config,
    };

    this.shortcuts = [
      ...DEFAULT_SHORTCUTS,
      ...(this.config.shortcuts || []),
    ];
  }

  /**
   * Process voice navigation command
   */
  navigate(phrase: string): VoiceNavigationResult | null {
    if (!this.config.enabled) {
      return null;
    }

    const normalizedPhrase = phrase.toLowerCase().trim();

    // Find matching shortcut
    const shortcut = this.findShortcut(normalizedPhrase);

    if (!shortcut) {
      this.emit("nomatch", phrase);
      return null;
    }

    // Check permissions if required
    if (shortcut.requiresPermission) {
      // Permission check would go here
      // For now, assume user has permissions
    }

    // Confirmation required?
    if (this.config.confirmNavigation) {
      this.pendingNavigation = shortcut;
      this.emit("confirmationrequired", shortcut);
      return {
        success: false,
        route: shortcut.route,
        confirmed: false,
        timestamp: new Date(),
      };
    }

    return this.executeNavigation(shortcut);
  }

  /**
   * Find matching shortcut
   */
  private findShortcut(phrase: string): VoiceNavigationShortcut | null {
    for (const shortcut of this.shortcuts) {
      if (shortcut.phrases.some((p) => p.toLowerCase() === phrase)) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Confirm pending navigation
   */
  confirmNavigation(): VoiceNavigationResult | null {
    if (!this.pendingNavigation) {
      return null;
    }

    const result = this.executeNavigation(this.pendingNavigation);
    this.pendingNavigation = null;
    return result;
  }

  /**
   * Cancel pending navigation
   */
  cancelNavigation(): void {
    this.pendingNavigation = null;
    this.emit("navigationcancelled");
  }

  /**
   * Execute navigation
   */
  private executeNavigation(
    shortcut: VoiceNavigationShortcut
  ): VoiceNavigationResult {
    const result: VoiceNavigationResult = {
      success: true,
      route: shortcut.route,
      confirmed: true,
      timestamp: new Date(),
    };

    // Handle special routes
    if (shortcut.route === "__back__") {
      this.navigateBack();
    } else if (shortcut.route === "__refresh__") {
      this.refreshPage();
    } else {
      // Record in history
      this.navigationHistory.push(shortcut.route);
      if (this.navigationHistory.length > 50) {
        this.navigationHistory.shift();
      }

      // Emit navigation event for router to handle
      this.emit("navigate", shortcut);
    }

    this.emit("navigated", result);
    return result;
  }

  /**
   * Navigate back
   */
  private navigateBack(): void {
    if (typeof window !== "undefined" && window.history) {
      window.history.back();
      this.emit("back");
    }
  }

  /**
   * Refresh page
   */
  private refreshPage(): void {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  /**
   * Add custom shortcut
   */
  addShortcut(shortcut: VoiceNavigationShortcut): void {
    this.shortcuts.push(shortcut);
    this.emit("shortcutadded", shortcut);
  }

  /**
   * Remove shortcut
   */
  removeShortcut(id: string): void {
    const index = this.shortcuts.findIndex((s) => s.id === id);
    if (index !== -1) {
      const removed = this.shortcuts.splice(index, 1)[0];
      this.emit("shortcutremoved", removed);
    }
  }

  /**
   * Get all shortcuts
   */
  getShortcuts(): VoiceNavigationShortcut[] {
    return [...this.shortcuts];
  }

  /**
   * Get shortcuts for current context
   */
  getContextualShortcuts(context?: string): VoiceNavigationShortcut[] {
    if (!context || !this.config.contextAware) {
      return this.shortcuts;
    }

    return this.shortcuts.filter(
      (s) => !s.context || s.context === context
    );
  }

  /**
   * Search shortcuts
   */
  searchShortcuts(query: string): VoiceNavigationShortcut[] {
    const lower = query.toLowerCase();
    return this.shortcuts.filter((shortcut) =>
      shortcut.phrases.some((phrase) => phrase.toLowerCase().includes(lower))
    );
  }

  /**
   * Get navigation history
   */
  getHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Enable/disable navigation
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.emit("enabledchange", enabled);
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceNavigationConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit("configchange", this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): VoiceNavigationConfig {
    return { ...this.config };
  }

  /**
   * Get pending navigation
   */
  getPendingNavigation(): VoiceNavigationShortcut | null {
    return this.pendingNavigation;
  }

  /**
   * Get suggestions for partial phrase
   */
  getSuggestions(partialPhrase: string, limit: number = 5): VoiceNavigationShortcut[] {
    const lower = partialPhrase.toLowerCase();
    const matches = this.shortcuts.filter((shortcut) =>
      shortcut.phrases.some((phrase) => phrase.toLowerCase().startsWith(lower))
    );

    return matches.slice(0, limit);
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
   * Reset to default state
   */
  reset(): void {
    this.shortcuts = [...DEFAULT_SHORTCUTS, ...(this.config.shortcuts || [])];
    this.navigationHistory = [];
    this.pendingNavigation = null;
  }
}

// ============================================================================
// Global Voice Navigation Instance
// ============================================================================

let globalVoiceNavigation: VoiceNavigationService | null = null;

export function getVoiceNavigationService(
  config?: Partial<VoiceNavigationConfig>
): VoiceNavigationService {
  if (!globalVoiceNavigation) {
    globalVoiceNavigation = new VoiceNavigationService(config);
  }
  return globalVoiceNavigation;
}

export function resetVoiceNavigationService(): void {
  globalVoiceNavigation = null;
}
