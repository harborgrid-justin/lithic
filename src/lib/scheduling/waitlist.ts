/**
 * Waitlist Manager - Priority-based Slot Matching
 * Automatic slot matching, patient notification, fairness algorithm
 */

import {
  addDays,
  addHours,
  differenceInDays,
  differenceInHours,
  isBefore,
  isAfter,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";
import type {
  Waitlist,
  WaitlistStatus,
  WaitlistPriority,
  AppointmentType,
  PreferredTime,
  ReminderMethod,
  Appointment,
  Schedule,
} from "@/types/scheduling";
import { getSchedulingEngine, type SchedulingContext } from "./engine";
import { getResourceManager } from "./resources";
import { getOptimizationEngine } from "./optimization";

// ============================================================================
// Types
// ============================================================================

export interface WaitlistEntry extends Omit<Waitlist, "id" | "createdAt" | "updatedAt"> {
  id: string;
  score: number;
  waitTime: number; // hours
  notificationAttempts: number;
  maxDistance?: number;
  requiresSameDay?: boolean;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotMatch {
  waitlistEntryId: string;
  providerId: string;
  providerName: string;
  facilityId: string;
  facilityName: string;
  startTime: Date;
  endTime: Date;
  matchScore: number;
  matchReasons: string[];
  expiresAt: Date;
}

export interface WaitlistConfiguration {
  expirationHours: number; // Hours before slot offer expires
  maxNotificationAttempts: number;
  priorityWeights: {
    urgency: number;
    waitTime: number;
    patientPreference: number;
    cancellationHistory: number;
  };
  fairnessThreshold: number; // Max score difference to consider "fair"
  autoAcceptHighPriority: boolean;
}

export interface FairnessMetrics {
  totalEntries: number;
  avgWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  stdDevWaitTime: number;
  priorityDistribution: {
    [priority: string]: number;
  };
  fairnessScore: number; // 0-100, higher is more fair
}

export interface WaitlistAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalAdded: number;
  totalScheduled: number;
  totalExpired: number;
  totalDeclined: number;
  avgWaitTime: number;
  conversionRate: number;
  byPriority: {
    [priority: string]: {
      added: number;
      scheduled: number;
      avgWaitTime: number;
    };
  };
  byAppointmentType: {
    [type: string]: {
      added: number;
      scheduled: number;
      avgWaitTime: number;
    };
  };
}

// ============================================================================
// Waitlist Manager Class
// ============================================================================

export class WaitlistManager {
  private entries: Map<string, WaitlistEntry> = new Map();
  private matches: Map<string, SlotMatch[]> = new Map();
  private schedulingEngine = getSchedulingEngine();
  private resourceManager = getResourceManager();
  private optimizationEngine = getOptimizationEngine();

  private config: WaitlistConfiguration = {
    expirationHours: 24,
    maxNotificationAttempts: 3,
    priorityWeights: {
      urgency: 0.4,
      waitTime: 0.3,
      patientPreference: 0.2,
      cancellationHistory: 0.1,
    },
    fairnessThreshold: 10,
    autoAcceptHighPriority: false,
  };

  // --------------------------------------------------------------------------
  // Waitlist Entry Management
  // --------------------------------------------------------------------------

  addToWaitlist(params: {
    patientId: string;
    patientName: string;
    providerId?: string;
    appointmentType: AppointmentType;
    preferredDates?: Date[];
    preferredTimes?: PreferredTime[];
    priority: WaitlistPriority;
    reason: string;
    notes?: string;
    maxDistance?: number;
    requiresSameDay?: boolean;
  }): WaitlistEntry {
    const entry: WaitlistEntry = {
      id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: params.patientId,
      patientName: params.patientName,
      providerId: params.providerId || null,
      appointmentType: params.appointmentType,
      preferredDates: params.preferredDates || [],
      preferredTimes: params.preferredTimes || [PreferredTime.ANY],
      priority: params.priority,
      status: WaitlistStatus.ACTIVE,
      reason: params.reason,
      notes: params.notes || null,
      addedDate: new Date(),
      notifiedAt: null,
      notificationMethod: null,
      acceptedAt: null,
      declinedAt: null,
      appointmentId: null,
      score: 0,
      waitTime: 0,
      notificationAttempts: 0,
      maxDistance: params.maxDistance,
      requiresSameDay: params.requiresSameDay || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: "",
    };

    entry.score = this.calculatePriorityScore(entry);
    this.entries.set(entry.id, entry);

    return entry;
  }

  removeFromWaitlist(
    entryId: string,
    reason?: string,
  ): WaitlistEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    entry.status = WaitlistStatus.CANCELLED;
    entry.cancellationReason = reason;
    entry.updatedAt = new Date();

    this.entries.delete(entryId);
    this.matches.delete(entryId);

    return entry;
  }

  updateWaitlistEntry(
    entryId: string,
    updates: Partial<WaitlistEntry>,
  ): WaitlistEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    Object.assign(entry, updates);
    entry.updatedAt = new Date();

    // Recalculate score if priority changed
    if (updates.priority) {
      entry.score = this.calculatePriorityScore(entry);
    }

    return entry;
  }

  // --------------------------------------------------------------------------
  // Priority Scoring & Fairness
  // --------------------------------------------------------------------------

  private calculatePriorityScore(entry: WaitlistEntry): number {
    const weights = this.config.priorityWeights;
    let score = 0;

    // Urgency score (0-100)
    const urgencyScore = this.getUrgencyScore(entry.priority);
    score += urgencyScore * weights.urgency;

    // Wait time score (0-100)
    const waitTimeScore = this.getWaitTimeScore(entry.waitTime);
    score += waitTimeScore * weights.waitTime;

    // Patient preference score (0-100)
    const preferenceScore = entry.preferredDates.length > 0 ? 80 : 50;
    score += preferenceScore * weights.patientPreference;

    // Cancellation history score (would come from patient history)
    // For now, use a default
    const cancellationScore = 70;
    score += cancellationScore * weights.cancellationHistory;

    return Math.min(100, Math.max(0, score));
  }

  private getUrgencyScore(priority: WaitlistPriority): number {
    const scores: Record<WaitlistPriority, number> = {
      [WaitlistPriority.URGENT]: 100,
      [WaitlistPriority.HIGH]: 75,
      [WaitlistPriority.MEDIUM]: 50,
      [WaitlistPriority.LOW]: 25,
    };
    return scores[priority] || 50;
  }

  private getWaitTimeScore(waitTimeHours: number): number {
    // Longer wait time = higher score (up to a point)
    if (waitTimeHours < 24) return 20;
    if (waitTimeHours < 72) return 40;
    if (waitTimeHours < 168) return 60; // 1 week
    if (waitTimeHours < 336) return 80; // 2 weeks
    return 100;
  }

  calculateFairnessMetrics(): FairnessMetrics {
    const activeEntries = Array.from(this.entries.values()).filter(
      (e) => e.status === WaitlistStatus.ACTIVE,
    );

    if (activeEntries.length === 0) {
      return {
        totalEntries: 0,
        avgWaitTime: 0,
        maxWaitTime: 0,
        minWaitTime: 0,
        stdDevWaitTime: 0,
        priorityDistribution: {},
        fairnessScore: 100,
      };
    }

    const waitTimes = activeEntries.map((e) => e.waitTime);
    const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    const maxWaitTime = Math.max(...waitTimes);
    const minWaitTime = Math.min(...waitTimes);

    // Calculate standard deviation
    const variance =
      waitTimes.reduce((sum, wt) => sum + Math.pow(wt - avgWaitTime, 2), 0) /
      waitTimes.length;
    const stdDevWaitTime = Math.sqrt(variance);

    // Priority distribution
    const priorityDistribution: { [key: string]: number } = {};
    for (const entry of activeEntries) {
      const key = WaitlistPriority[entry.priority];
      priorityDistribution[key] = (priorityDistribution[key] || 0) + 1;
    }

    // Fairness score: lower std dev and balanced priorities = higher score
    const normalizedStdDev = Math.min(100, (stdDevWaitTime / avgWaitTime) * 100);
    const fairnessScore = Math.max(0, 100 - normalizedStdDev);

    return {
      totalEntries: activeEntries.length,
      avgWaitTime,
      maxWaitTime,
      minWaitTime,
      stdDevWaitTime,
      priorityDistribution,
      fairnessScore,
    };
  }

  // --------------------------------------------------------------------------
  // Slot Matching
  // --------------------------------------------------------------------------

  findMatchingSlots(
    availableSlots: {
      providerId: string;
      providerName: string;
      facilityId: string;
      facilityName: string;
      startTime: Date;
      duration: number;
    }[],
    entryId?: string,
  ): SlotMatch[] {
    const matches: SlotMatch[] = [];

    // Get entries to match (specific entry or all active)
    const entriesToMatch = entryId
      ? [this.entries.get(entryId)].filter(Boolean) as WaitlistEntry[]
      : Array.from(this.entries.values()).filter(
          (e) => e.status === WaitlistStatus.ACTIVE,
        );

    for (const entry of entriesToMatch) {
      for (const slot of availableSlots) {
        // Check provider preference
        if (entry.providerId && entry.providerId !== slot.providerId) {
          continue;
        }

        // Check same-day requirement
        if (entry.requiresSameDay) {
          const isToday =
            format(slot.startTime, "yyyy-MM-dd") ===
            format(new Date(), "yyyy-MM-dd");
          if (!isToday) continue;
        }

        // Check preferred dates
        if (entry.preferredDates.length > 0) {
          const matchesPreferredDate = entry.preferredDates.some(
            (prefDate) =>
              format(slot.startTime, "yyyy-MM-dd") ===
              format(prefDate, "yyyy-MM-dd"),
          );
          if (!matchesPreferredDate) continue;
        }

        // Check preferred times
        const matchesPreferredTime = this.matchesPreferredTime(
          slot.startTime,
          entry.preferredTimes,
        );
        if (!matchesPreferredTime) continue;

        // Calculate match score
        const matchScore = this.calculateMatchScore(entry, slot);
        const matchReasons = this.getMatchReasons(entry, slot);

        matches.push({
          waitlistEntryId: entry.id,
          providerId: slot.providerId,
          providerName: slot.providerName,
          facilityId: slot.facilityId,
          facilityName: slot.facilityName,
          startTime: slot.startTime,
          endTime: addMinutes(slot.startTime, slot.duration),
          matchScore,
          matchReasons,
          expiresAt: addHours(new Date(), this.config.expirationHours),
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private matchesPreferredTime(
    startTime: Date,
    preferredTimes: PreferredTime[],
  ): boolean {
    if (preferredTimes.includes(PreferredTime.ANY)) return true;

    const hour = startTime.getHours();
    for (const timeRange of preferredTimes) {
      switch (timeRange) {
        case PreferredTime.EARLY_MORNING:
          if (hour >= 6 && hour < 9) return true;
          break;
        case PreferredTime.MORNING:
          if (hour >= 9 && hour < 12) return true;
          break;
        case PreferredTime.AFTERNOON:
          if (hour >= 12 && hour < 17) return true;
          break;
        case PreferredTime.EVENING:
          if (hour >= 17 && hour < 20) return true;
          break;
      }
    }
    return false;
  }

  private calculateMatchScore(
    entry: WaitlistEntry,
    slot: {
      providerId: string;
      startTime: Date;
    },
  ): number {
    let score = entry.score; // Start with priority score

    // Preferred provider bonus
    if (entry.providerId === slot.providerId) {
      score += 20;
    }

    // Sooner is better
    const hoursAway = differenceInHours(slot.startTime, new Date());
    if (hoursAway <= 24) score += 15;
    else if (hoursAway <= 72) score += 10;
    else if (hoursAway <= 168) score += 5;

    // Preferred date bonus
    if (entry.preferredDates.length > 0) {
      const matchesPreferredDate = entry.preferredDates.some(
        (prefDate) =>
          format(slot.startTime, "yyyy-MM-dd") ===
          format(prefDate, "yyyy-MM-dd"),
      );
      if (matchesPreferredDate) score += 15;
    }

    return Math.min(100, score);
  }

  private getMatchReasons(
    entry: WaitlistEntry,
    slot: {
      providerId: string;
      startTime: Date;
    },
  ): string[] {
    const reasons: string[] = [];

    if (entry.providerId === slot.providerId) {
      reasons.push("Preferred provider");
    }

    const hoursAway = differenceInHours(slot.startTime, new Date());
    if (hoursAway <= 24) {
      reasons.push("Available within 24 hours");
    } else if (hoursAway <= 72) {
      reasons.push("Available within 3 days");
    }

    if (entry.priority === WaitlistPriority.URGENT) {
      reasons.push("High priority match");
    }

    if (entry.waitTime > 168) {
      reasons.push("Long wait time");
    }

    return reasons;
  }

  // --------------------------------------------------------------------------
  // Automatic Slot Assignment
  // --------------------------------------------------------------------------

  autoAssignSlots(
    availableSlots: {
      providerId: string;
      providerName: string;
      facilityId: string;
      facilityName: string;
      startTime: Date;
      duration: number;
    }[],
  ): {
    assignments: SlotMatch[];
    notified: number;
    failed: number;
  } {
    const assignments: SlotMatch[] = [];
    let notified = 0;
    let failed = 0;

    // Get all matches
    const allMatches = this.findMatchingSlots(availableSlots);

    // Group matches by slot
    const slotMatches = new Map<string, SlotMatch[]>();
    for (const match of allMatches) {
      const slotKey = `${match.providerId}_${match.startTime.toISOString()}`;
      const existing = slotMatches.get(slotKey) || [];
      existing.push(match);
      slotMatches.set(slotKey, existing);
    }

    // For each slot, pick the best match considering fairness
    for (const [slotKey, matches] of slotMatches) {
      if (matches.length === 0) continue;

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Check fairness threshold
      const bestMatch = matches[0];
      const fairMatches = matches.filter(
        (m) =>
          bestMatch.matchScore - m.matchScore <=
          this.config.fairnessThreshold,
      );

      // If multiple fair matches, pick the one with longest wait time
      let selectedMatch = bestMatch;
      if (fairMatches.length > 1) {
        selectedMatch = fairMatches.reduce((longest, current) => {
          const longestEntry = this.entries.get(longest.waitlistEntryId);
          const currentEntry = this.entries.get(current.waitlistEntryId);
          return (currentEntry?.waitTime || 0) > (longestEntry?.waitTime || 0)
            ? current
            : longest;
        });
      }

      // Assign the slot
      const entry = this.entries.get(selectedMatch.waitlistEntryId);
      if (entry) {
        assignments.push(selectedMatch);

        // Store the match
        const entryMatches = this.matches.get(entry.id) || [];
        entryMatches.push(selectedMatch);
        this.matches.set(entry.id, entryMatches);

        // Update entry status
        entry.status = WaitlistStatus.NOTIFIED;
        entry.notifiedAt = new Date();
        entry.notificationAttempts++;
        entry.updatedAt = new Date();

        // In real implementation, send notification here
        notified++;
      } else {
        failed++;
      }
    }

    return {
      assignments,
      notified,
      failed,
    };
  }

  acceptSlotMatch(
    entryId: string,
    matchStartTime: Date,
  ): {
    success: boolean;
    appointmentId?: string;
    message: string;
  } {
    const entry = this.entries.get(entryId);
    if (!entry) {
      return {
        success: false,
        message: "Waitlist entry not found",
      };
    }

    const entryMatches = this.matches.get(entryId) || [];
    const match = entryMatches.find(
      (m) => m.startTime.getTime() === matchStartTime.getTime(),
    );

    if (!match) {
      return {
        success: false,
        message: "Slot match not found",
      };
    }

    // Check if match has expired
    if (isAfter(new Date(), match.expiresAt)) {
      return {
        success: false,
        message: "Slot offer has expired",
      };
    }

    // Create appointment (in real implementation)
    const appointmentId = `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update entry
    entry.status = WaitlistStatus.ACCEPTED;
    entry.acceptedAt = new Date();
    entry.appointmentId = appointmentId;
    entry.updatedAt = new Date();

    // Remove from active waitlist
    this.entries.delete(entryId);

    return {
      success: true,
      appointmentId,
      message: "Slot accepted and appointment created",
    };
  }

  declineSlotMatch(
    entryId: string,
    matchStartTime: Date,
    reason?: string,
  ): {
    success: boolean;
    message: string;
  } {
    const entry = this.entries.get(entryId);
    if (!entry) {
      return {
        success: false,
        message: "Waitlist entry not found",
      };
    }

    const entryMatches = this.matches.get(entryId) || [];
    const matchIndex = entryMatches.findIndex(
      (m) => m.startTime.getTime() === matchStartTime.getTime(),
    );

    if (matchIndex === -1) {
      return {
        success: false,
        message: "Slot match not found",
      };
    }

    // Remove the specific match
    entryMatches.splice(matchIndex, 1);
    this.matches.set(entryId, entryMatches);

    // Update entry status back to active
    entry.status = WaitlistStatus.ACTIVE;
    entry.notes = entry.notes
      ? `${entry.notes}\nDeclined slot: ${reason || "No reason given"}`
      : `Declined slot: ${reason || "No reason given"}`;
    entry.updatedAt = new Date();

    return {
      success: true,
      message: "Slot declined, remaining on waitlist",
    };
  }

  // --------------------------------------------------------------------------
  // Expiration Handling
  // --------------------------------------------------------------------------

  processExpirations(): {
    expired: number;
    reactivated: number;
  } {
    let expired = 0;
    let reactivated = 0;
    const now = new Date();

    for (const entry of this.entries.values()) {
      if (entry.status !== WaitlistStatus.NOTIFIED) continue;

      const entryMatches = this.matches.get(entry.id) || [];
      const activeMatches = entryMatches.filter((m) =>
        isAfter(m.expiresAt, now),
      );

      // If all matches expired
      if (activeMatches.length === 0 && entryMatches.length > 0) {
        if (
          entry.notificationAttempts >= this.config.maxNotificationAttempts
        ) {
          entry.status = WaitlistStatus.EXPIRED;
          expired++;
        } else {
          entry.status = WaitlistStatus.ACTIVE;
          reactivated++;
        }
        entry.updatedAt = new Date();
        this.matches.delete(entry.id);
      }
    }

    return { expired, reactivated };
  }

  // --------------------------------------------------------------------------
  // Analytics & Reporting
  // --------------------------------------------------------------------------

  generateAnalytics(startDate: Date, endDate: Date): WaitlistAnalytics {
    // In real implementation, would query historical data
    // For now, use current entries as approximation
    const allEntries = Array.from(this.entries.values());

    const totalAdded = allEntries.length;
    const totalScheduled = allEntries.filter(
      (e) => e.status === WaitlistStatus.ACCEPTED,
    ).length;
    const totalExpired = allEntries.filter(
      (e) => e.status === WaitlistStatus.EXPIRED,
    ).length;
    const totalDeclined = allEntries.filter(
      (e) => e.status === WaitlistStatus.DECLINED,
    ).length;

    const waitTimes = allEntries.map((e) => e.waitTime);
    const avgWaitTime =
      waitTimes.length > 0
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
        : 0;

    const conversionRate =
      totalAdded > 0 ? (totalScheduled / totalAdded) * 100 : 0;

    // By priority
    const byPriority: WaitlistAnalytics["byPriority"] = {};
    for (const priority of Object.values(WaitlistPriority)) {
      if (typeof priority === "number") continue;
      const priorityEntries = allEntries.filter(
        (e) => WaitlistPriority[e.priority] === priority,
      );
      const scheduled = priorityEntries.filter(
        (e) => e.status === WaitlistStatus.ACCEPTED,
      ).length;
      const avgWait =
        priorityEntries.length > 0
          ? priorityEntries.reduce((sum, e) => sum + e.waitTime, 0) /
            priorityEntries.length
          : 0;

      byPriority[priority] = {
        added: priorityEntries.length,
        scheduled,
        avgWaitTime: avgWait,
      };
    }

    // By appointment type
    const byAppointmentType: WaitlistAnalytics["byAppointmentType"] = {};
    for (const type of Object.values(AppointmentType)) {
      const typeEntries = allEntries.filter(
        (e) => e.appointmentType === type,
      );
      const scheduled = typeEntries.filter(
        (e) => e.status === WaitlistStatus.ACCEPTED,
      ).length;
      const avgWait =
        typeEntries.length > 0
          ? typeEntries.reduce((sum, e) => sum + e.waitTime, 0) /
            typeEntries.length
          : 0;

      byAppointmentType[type] = {
        added: typeEntries.length,
        scheduled,
        avgWaitTime: avgWait,
      };
    }

    return {
      period: { start: startDate, end: endDate },
      totalAdded,
      totalScheduled,
      totalExpired,
      totalDeclined,
      avgWaitTime,
      conversionRate,
      byPriority,
      byAppointmentType,
    };
  }

  // --------------------------------------------------------------------------
  // Update Wait Times
  // --------------------------------------------------------------------------

  updateWaitTimes(): void {
    const now = new Date();
    for (const entry of this.entries.values()) {
      if (entry.status === WaitlistStatus.ACTIVE) {
        entry.waitTime = differenceInHours(now, entry.addedDate);
        // Recalculate score as wait time changes
        entry.score = this.calculatePriorityScore(entry);
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let waitlistManagerInstance: WaitlistManager | null = null;

export function getWaitlistManager(): WaitlistManager {
  if (!waitlistManagerInstance) {
    waitlistManagerInstance = new WaitlistManager();
  }
  return waitlistManagerInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getPriorityColor(priority: WaitlistPriority): string {
  const colors: Record<WaitlistPriority, string> = {
    [WaitlistPriority.URGENT]: "red",
    [WaitlistPriority.HIGH]: "orange",
    [WaitlistPriority.MEDIUM]: "yellow",
    [WaitlistPriority.LOW]: "green",
  };
  return colors[priority] || "gray";
}

export function formatWaitTime(hours: number): string {
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week";
  return `${weeks} weeks`;
}
