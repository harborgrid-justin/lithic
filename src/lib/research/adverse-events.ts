/**
 * Adverse Event Tracking and Reporting
 * Lithic Healthcare Platform v0.5
 *
 * SAE/AE management with regulatory reporting
 */

import {
  AdverseEvent,
  AECategory,
  AESeverity,
  AESeriousness,
  AEFollowUp,
  Causality,
  AEOutcome,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class AdverseEventTracker {
  private static instance: AdverseEventTracker;
  private events: Map<string, AdverseEvent> = new Map();
  private eventsByTrial: Map<string, Set<string>> = new Map();
  private eventsBySubject: Map<string, Set<string>> = new Map();
  private seriousEvents: Set<string> = new Set();

  private constructor() {}

  static getInstance(): AdverseEventTracker {
    if (!AdverseEventTracker.instance) {
      AdverseEventTracker.instance = new AdverseEventTracker();
    }
    return AdverseEventTracker.instance;
  }

  /**
   * Report a new adverse event
   */
  async reportAdverseEvent(
    event: Omit<AdverseEvent, "id" | "aeNumber" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<AdverseEvent> {
    try {
      // Generate AE number
      const aeNumber = await this.generateAENumber(
        event.trialId,
        event.siteId
      );

      // Determine if reporting is required
      const reportingRequired = this.determineReportingRequirement(
        event.category,
        event.seriousness,
        event.causality,
        event.expectedness
      );

      const newEvent: AdverseEvent = {
        ...event,
        id: this.generateId(),
        aeNumber,
        reportingRequired,
        reportedToAuthorities: false,
        reportDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      // Store event
      this.events.set(newEvent.id, newEvent);

      // Index by trial
      if (!this.eventsByTrial.has(newEvent.trialId)) {
        this.eventsByTrial.set(newEvent.trialId, new Set());
      }
      this.eventsByTrial.get(newEvent.trialId)!.add(newEvent.id);

      // Index by subject
      if (!this.eventsBySubject.has(newEvent.subjectId)) {
        this.eventsBySubject.set(newEvent.subjectId, new Set());
      }
      this.eventsBySubject.get(newEvent.subjectId)!.add(newEvent.id);

      // Index if serious
      if (newEvent.seriousness === AESeriousness.SERIOUS) {
        this.seriousEvents.add(newEvent.id);
      }

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "adverse_event",
        resourceId: newEvent.id,
        details: {
          aeNumber: newEvent.aeNumber,
          trialId: newEvent.trialId,
          subjectId: newEvent.subjectId,
          severity: newEvent.severity,
          seriousness: newEvent.seriousness,
        },
        organizationId: newEvent.organizationId,
      });

      // Alert if serious or unexpected
      if (
        newEvent.seriousness === AESeriousness.SERIOUS ||
        newEvent.expectedness === "UNEXPECTED"
      ) {
        await this.sendAlerts(newEvent);
      }

      return newEvent;
    } catch (error) {
      throw new Error(
        `Failed to report adverse event: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update adverse event
   */
  async updateAdverseEvent(
    eventId: string,
    updates: Partial<AdverseEvent>,
    userId: string
  ): Promise<AdverseEvent> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Adverse event ${eventId} not found`);
    }

    const updatedEvent: AdverseEvent = {
      ...event,
      ...updates,
      id: event.id, // Prevent ID change
      aeNumber: event.aeNumber, // Prevent AE number change
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.events.set(eventId, updatedEvent);

    // Update serious events index if seriousness changed
    if (updates.seriousness) {
      if (updates.seriousness === AESeriousness.SERIOUS) {
        this.seriousEvents.add(eventId);
      } else {
        this.seriousEvents.delete(eventId);
      }
    }

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "adverse_event",
      resourceId: eventId,
      details: { updates },
      organizationId: event.organizationId,
    });

    return updatedEvent;
  }

  /**
   * Add follow-up to adverse event
   */
  async addFollowUp(
    eventId: string,
    followUp: Omit<AEFollowUp, "id">,
    userId: string
  ): Promise<AdverseEvent> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Adverse event ${eventId} not found`);
    }

    const newFollowUp: AEFollowUp = {
      ...followUp,
      id: this.generateId(),
    };

    event.followUps.push(newFollowUp);
    event.updatedAt = new Date();
    event.updatedBy = userId;

    // Update outcome
    event.outcome = followUp.status;

    // Update resolution date if recovered
    if (
      followUp.status === AEOutcome.RECOVERED ||
      followUp.status === AEOutcome.RECOVERED_WITH_SEQUELAE
    ) {
      event.resolutionDate = followUp.followUpDate;
      event.followUpRequired = false;
    }

    // Calculate duration
    if (event.resolutionDate) {
      event.duration = Math.ceil(
        (event.resolutionDate.getTime() - event.onsetDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    this.events.set(eventId, event);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "adverse_event_followup",
      resourceId: eventId,
      details: {
        followUpDate: followUp.followUpDate,
        status: followUp.status,
      },
      organizationId: event.organizationId,
    });

    return event;
  }

  /**
   * Mark event as reported to authorities
   */
  async markAsReported(
    eventId: string,
    reportDate: Date,
    userId: string
  ): Promise<AdverseEvent> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Adverse event ${eventId} not found`);
    }

    event.reportedToAuthorities = true;
    event.reportDate = reportDate;
    event.updatedAt = new Date();
    event.updatedBy = userId;

    this.events.set(eventId, event);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "adverse_event_reporting",
      resourceId: eventId,
      details: {
        reportDate,
        reportedToAuthorities: true,
      },
      organizationId: event.organizationId,
    });

    return event;
  }

  /**
   * Get adverse event by ID
   */
  async getAdverseEvent(eventId: string): Promise<AdverseEvent | null> {
    return this.events.get(eventId) || null;
  }

  /**
   * Get all adverse events for a trial
   */
  async getTrialAdverseEvents(trialId: string): Promise<AdverseEvent[]> {
    const eventIds = this.eventsByTrial.get(trialId) || new Set();
    const events: AdverseEvent[] = [];

    for (const eventId of eventIds) {
      const event = this.events.get(eventId);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Get all adverse events for a subject
   */
  async getSubjectAdverseEvents(subjectId: string): Promise<AdverseEvent[]> {
    const eventIds = this.eventsBySubject.get(subjectId) || new Set();
    const events: AdverseEvent[] = [];

    for (const eventId of eventIds) {
      const event = this.events.get(eventId);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Get serious adverse events
   */
  async getSeriousAdverseEvents(trialId?: string): Promise<AdverseEvent[]> {
    const events: AdverseEvent[] = [];

    for (const eventId of this.seriousEvents) {
      const event = this.events.get(eventId);
      if (event && (!trialId || event.trialId === trialId)) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Get events requiring regulatory reporting
   */
  async getEventsRequiringReporting(
    trialId: string
  ): Promise<AdverseEvent[]> {
    const events = await this.getTrialAdverseEvents(trialId);
    return events.filter(
      (e) => e.reportingRequired && !e.reportedToAuthorities
    );
  }

  /**
   * Calculate AE statistics for a trial
   */
  async calculateTrialAEStats(trialId: string): Promise<{
    totalAEs: number;
    totalSAEs: number;
    totalSUSARs: number;
    byCategory: Record<AECategory, number>;
    bySeverity: Record<AESeverity, number>;
    byCausality: Record<Causality, number>;
    byOutcome: Record<AEOutcome, number>;
    requireReporting: number;
    reportedToAuthorities: number;
  }> {
    const events = await this.getTrialAdverseEvents(trialId);

    const stats = {
      totalAEs: events.length,
      totalSAEs: events.filter((e) => e.seriousness === AESeriousness.SERIOUS)
        .length,
      totalSUSARs: events.filter(
        (e) =>
          e.category ===
          AECategory.SUSPECTED_UNEXPECTED_SERIOUS_ADVERSE_REACTION
      ).length,
      byCategory: {} as Record<AECategory, number>,
      bySeverity: {} as Record<AESeverity, number>,
      byCausality: {} as Record<Causality, number>,
      byOutcome: {} as Record<AEOutcome, number>,
      requireReporting: events.filter((e) => e.reportingRequired).length,
      reportedToAuthorities: events.filter((e) => e.reportedToAuthorities)
        .length,
    };

    // Count by category
    for (const event of events) {
      stats.byCategory[event.category] =
        (stats.byCategory[event.category] || 0) + 1;
      stats.bySeverity[event.severity] =
        (stats.bySeverity[event.severity] || 0) + 1;
      stats.byCausality[event.causality] =
        (stats.byCausality[event.causality] || 0) + 1;
      stats.byOutcome[event.outcome] =
        (stats.byOutcome[event.outcome] || 0) + 1;
    }

    return stats;
  }

  /**
   * Assess if event meets serious criteria
   */
  assessSeriousness(event: AdverseEvent): {
    isSerious: boolean;
    criteria: string[];
  } {
    const criteria: string[] = [];

    if (event.seriousnessCriteria.length > 0) {
      criteria.push(...event.seriousnessCriteria);
    }

    return {
      isSerious: event.seriousness === AESeriousness.SERIOUS,
      criteria,
    };
  }

  /**
   * Determine if SUSAR (Suspected Unexpected Serious Adverse Reaction)
   */
  isSUSAR(event: AdverseEvent): boolean {
    return (
      event.seriousness === AESeriousness.SERIOUS &&
      event.expectedness === "UNEXPECTED" &&
      (event.causality === Causality.POSSIBLE ||
        event.causality === Causality.PROBABLE ||
        event.causality === Causality.DEFINITE)
    );
  }

  // Private helper methods

  private determineReportingRequirement(
    category: AECategory,
    seriousness: AESeriousness,
    causality: Causality,
    expectedness: string
  ): boolean {
    // SAEs and SUSARs require reporting
    if (seriousness === AESeriousness.SERIOUS) {
      return true;
    }

    // Unexpected events with possible/probable causality
    if (
      expectedness === "UNEXPECTED" &&
      (causality === Causality.POSSIBLE ||
        causality === Causality.PROBABLE ||
        causality === Causality.DEFINITE)
    ) {
      return true;
    }

    // SUSARs always require reporting
    if (
      category ===
      AECategory.SUSPECTED_UNEXPECTED_SERIOUS_ADVERSE_REACTION
    ) {
      return true;
    }

    return false;
  }

  private async generateAENumber(
    trialId: string,
    siteId: string
  ): Promise<string> {
    const eventIds = this.eventsByTrial.get(trialId) || new Set();
    const count = eventIds.size + 1;

    // Format: TRIAL-SITE-NNNN
    const trialCode = trialId.substring(0, 6).toUpperCase();
    const siteCode = siteId.substring(0, 3).toUpperCase();
    const sequence = count.toString().padStart(4, "0");

    return `${trialCode}-${siteCode}-${sequence}`;
  }

  private async sendAlerts(event: AdverseEvent): Promise<void> {
    // This would integrate with notification service
    // Send alerts to:
    // - Principal Investigator
    // - Medical Monitor
    // - Safety Officer
    // - Sponsor (for SAEs/SUSARs)
    console.log(`Alert: New ${event.seriousness} AE - ${event.aeNumber}`);
  }

  private generateId(): string {
    return `ae_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const adverseEventTracker = AdverseEventTracker.getInstance();
