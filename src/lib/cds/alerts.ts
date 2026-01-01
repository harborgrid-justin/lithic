/**
 * Alert Management and Fatigue Prevention
 * Manages CDS alerts to minimize alert fatigue
 */

import {
  CDSAlert,
  AlertStatus,
  AlertSeverity,
  AlertFatigueMetrics,
  AlertSuppressionRule,
  SuppressionType,
  RuleCategory,
} from "@/types/cds";
import { auditLogger } from "@/lib/audit-logger";

/**
 * Alert Manager - Manages alert lifecycle and fatigue prevention
 */
export class AlertManager {
  private activeAlerts: Map<string, CDSAlert> = new Map();
  private suppressionRules: Map<string, AlertSuppressionRule> = new Map();
  private alertHistory: CDSAlert[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.loadDefaultSuppressionRules();
  }

  /**
   * Load default suppression rules
   */
  private loadDefaultSuppressionRules(): void {
    // Suppress duplicate alerts within 24 hours
    this.suppressionRules.set("duplicate-24h", {
      id: "duplicate-24h",
      ruleId: "*",
      suppressionType: SuppressionType.DUPLICATE,
      suppressionPeriod: 24 * 60, // 24 hours
      maxOccurrences: 1,
      conditions: {},
      enabled: true,
    });

    // Suppress info alerts if too many critical alerts
    this.suppressionRules.set("info-during-critical", {
      id: "info-during-critical",
      ruleId: "*",
      suppressionType: SuppressionType.CONTEXT_BASED,
      suppressionPeriod: 0,
      maxOccurrences: null,
      conditions: {
        suppressWhen: "criticalAlertsPresent",
        severityToSuppress: [AlertSeverity.INFO],
      },
      enabled: true,
    });

    // Limit frequency of same alert type per patient
    this.suppressionRules.set("frequency-limit", {
      id: "frequency-limit",
      ruleId: "*",
      suppressionType: SuppressionType.FREQUENCY_BASED,
      suppressionPeriod: 60, // 1 hour
      maxOccurrences: 3,
      conditions: {},
      enabled: true,
    });
  }

  /**
   * Process and filter alerts to prevent fatigue
   */
  processAlerts(
    alerts: CDSAlert[],
    patientId: string,
    encounterId: string | null,
  ): CDSAlert[] {
    const processedAlerts: CDSAlert[] = [];

    for (const alert of alerts) {
      // Check if alert should be suppressed
      if (this.shouldSuppressAlert(alert, patientId)) {
        continue;
      }

      // Check for duplicates
      if (this.isDuplicateAlert(alert, patientId)) {
        continue;
      }

      // Add to processed alerts
      processedAlerts.push(alert);

      // Store in active alerts
      this.activeAlerts.set(alert.id, alert);

      // Add to history
      this.addToHistory(alert);
    }

    // Apply priority-based filtering
    return this.prioritizeAlerts(processedAlerts);
  }

  /**
   * Check if alert should be suppressed
   */
  private shouldSuppressAlert(alert: CDSAlert, patientId: string): boolean {
    for (const [_, rule] of this.suppressionRules) {
      if (!rule.enabled) {
        continue;
      }

      // Check if rule applies to this alert
      if (rule.ruleId !== "*" && rule.ruleId !== alert.ruleId) {
        continue;
      }

      switch (rule.suppressionType) {
        case SuppressionType.DUPLICATE:
          if (
            this.hasDuplicateInWindow(alert, patientId, rule.suppressionPeriod)
          ) {
            return true;
          }
          break;

        case SuppressionType.FREQUENCY_BASED:
          if (
            this.exceedsFrequencyLimit(
              alert,
              patientId,
              rule.suppressionPeriod,
              rule.maxOccurrences || 3,
            )
          ) {
            return true;
          }
          break;

        case SuppressionType.CONTEXT_BASED:
          if (this.shouldSuppressBasedOnContext(alert, rule.conditions)) {
            return true;
          }
          break;
      }
    }

    return false;
  }

  /**
   * Check for duplicate alert in time window
   */
  private hasDuplicateInWindow(
    alert: CDSAlert,
    patientId: string,
    windowMinutes: number,
  ): boolean {
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

    return this.alertHistory.some(
      (historicalAlert) =>
        historicalAlert.patientId === patientId &&
        historicalAlert.ruleId === alert.ruleId &&
        historicalAlert.category === alert.category &&
        new Date(historicalAlert.triggeredAt) > cutoffTime &&
        historicalAlert.status !== AlertStatus.DISMISSED,
    );
  }

  /**
   * Check if alert exceeds frequency limit
   */
  private exceedsFrequencyLimit(
    alert: CDSAlert,
    patientId: string,
    windowMinutes: number,
    maxOccurrences: number,
  ): boolean {
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = this.alertHistory.filter(
      (historicalAlert) =>
        historicalAlert.patientId === patientId &&
        historicalAlert.ruleId === alert.ruleId &&
        new Date(historicalAlert.triggeredAt) > cutoffTime,
    ).length;

    return count >= maxOccurrences;
  }

  /**
   * Check if should suppress based on context
   */
  private shouldSuppressBasedOnContext(
    alert: CDSAlert,
    conditions: Record<string, any>,
  ): boolean {
    if (conditions.suppressWhen === "criticalAlertsPresent") {
      const hasCriticalAlerts = Array.from(this.activeAlerts.values()).some(
        (a) =>
          a.severity === AlertSeverity.CRITICAL &&
          a.status === AlertStatus.ACTIVE,
      );

      if (
        hasCriticalAlerts &&
        conditions.severityToSuppress?.includes(alert.severity)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if alert is duplicate
   */
  private isDuplicateAlert(alert: CDSAlert, patientId: string): boolean {
    return Array.from(this.activeAlerts.values()).some(
      (existingAlert) =>
        existingAlert.patientId === patientId &&
        existingAlert.ruleId === alert.ruleId &&
        existingAlert.category === alert.category &&
        existingAlert.status === AlertStatus.ACTIVE &&
        this.isSimilarMessage(existingAlert.message, alert.message),
    );
  }

  /**
   * Check if messages are similar
   */
  private isSimilarMessage(message1: string, message2: string): boolean {
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
    return normalize(message1) === normalize(message2);
  }

  /**
   * Prioritize alerts based on severity and context
   */
  private prioritizeAlerts(alerts: CDSAlert[]): CDSAlert[] {
    // Sort by severity
    const sorted = alerts.sort((a, b) => {
      const severityOrder = {
        [AlertSeverity.CRITICAL]: 5,
        [AlertSeverity.HIGH]: 4,
        [AlertSeverity.MODERATE]: 3,
        [AlertSeverity.LOW]: 2,
        [AlertSeverity.INFO]: 1,
      };

      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // Limit number of alerts per severity level
    const maxCritical = 5;
    const maxHigh = 10;
    const maxModerate = 15;

    const filtered: CDSAlert[] = [];
    const counts = {
      [AlertSeverity.CRITICAL]: 0,
      [AlertSeverity.HIGH]: 0,
      [AlertSeverity.MODERATE]: 0,
      [AlertSeverity.LOW]: 0,
      [AlertSeverity.INFO]: 0,
    };

    for (const alert of sorted) {
      const count = counts[alert.severity];

      // Check limits
      if (alert.severity === AlertSeverity.CRITICAL && count >= maxCritical)
        continue;
      if (alert.severity === AlertSeverity.HIGH && count >= maxHigh) continue;
      if (alert.severity === AlertSeverity.MODERATE && count >= maxModerate)
        continue;

      filtered.push(alert);
      counts[alert.severity]++;
    }

    return filtered;
  }

  /**
   * Add alert to history
   */
  private addToHistory(alert: CDSAlert): void {
    this.alertHistory.push(alert);

    // Limit history size
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string,
    notes?: string,
  ): Promise<CDSAlert | null> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    // Audit log
    await this.auditAlertAction(alert, "acknowledge", userId, notes);

    return alert;
  }

  /**
   * Override alert
   */
  async overrideAlert(
    alertId: string,
    userId: string,
    reason: string,
    notes?: string,
  ): Promise<CDSAlert | null> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = AlertStatus.OVERRIDDEN;
    alert.overriddenAt = new Date();
    alert.overriddenBy = userId;
    alert.overrideReason = reason;

    // Audit log
    await this.auditAlertAction(
      alert,
      "override",
      userId,
      `${reason}. ${notes || ""}`,
    );

    return alert;
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(
    alertId: string,
    userId: string,
    reason?: string,
  ): Promise<CDSAlert | null> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = AlertStatus.DISMISSED;
    alert.dismissedAt = new Date();
    alert.dismissedBy = userId;

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    // Audit log
    await this.auditAlertAction(alert, "dismiss", userId, reason);

    return alert;
  }

  /**
   * Get active alerts for patient
   */
  getActiveAlertsForPatient(patientId: string): CDSAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(
        (alert) =>
          alert.patientId === patientId && alert.status === AlertStatus.ACTIVE,
      )
      .sort((a, b) => {
        const severityOrder = {
          [AlertSeverity.CRITICAL]: 5,
          [AlertSeverity.HIGH]: 4,
          [AlertSeverity.MODERATE]: 3,
          [AlertSeverity.LOW]: 2,
          [AlertSeverity.INFO]: 1,
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get alert fatigue metrics
   */
  getAlertFatigueMetrics(
    startDate: Date,
    endDate: Date,
    providerId?: string,
  ): AlertFatigueMetrics {
    const filteredAlerts = this.alertHistory.filter((alert) => {
      const alertDate = new Date(alert.triggeredAt);
      const inRange = alertDate >= startDate && alertDate <= endDate;
      const matchesProvider = !providerId || alert.triggeredBy === providerId;
      return inRange && matchesProvider;
    });

    const totalAlerts = filteredAlerts.length;
    const criticalAlerts = filteredAlerts.filter(
      (a) => a.severity === AlertSeverity.CRITICAL,
    ).length;
    const acknowledgedAlerts = filteredAlerts.filter(
      (a) => a.status === AlertStatus.ACKNOWLEDGED,
    ).length;
    const overriddenAlerts = filteredAlerts.filter(
      (a) => a.status === AlertStatus.OVERRIDDEN,
    ).length;
    const dismissedAlerts = filteredAlerts.filter(
      (a) => a.status === AlertStatus.DISMISSED,
    ).length;

    const acknowledgeRate =
      totalAlerts > 0 ? acknowledgedAlerts / totalAlerts : 0;
    const overrideRate = totalAlerts > 0 ? overriddenAlerts / totalAlerts : 0;
    const dismissRate = totalAlerts > 0 ? dismissedAlerts / totalAlerts : 0;

    // Calculate average response time
    const responseTimes = filteredAlerts
      .filter((a) => a.acknowledgedAt)
      .map((a) => {
        const triggered = new Date(a.triggeredAt).getTime();
        const acknowledged = new Date(a.acknowledgedAt!).getTime();
        return acknowledged - triggered;
      });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Group by category
    const alertsByCategory: Record<RuleCategory, number> = {} as any;
    filteredAlerts.forEach((alert) => {
      alertsByCategory[alert.category] =
        (alertsByCategory[alert.category] || 0) + 1;
    });

    // Group by severity
    const alertsBySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.CRITICAL]: 0,
      [AlertSeverity.HIGH]: 0,
      [AlertSeverity.MODERATE]: 0,
      [AlertSeverity.LOW]: 0,
      [AlertSeverity.INFO]: 0,
    };
    filteredAlerts.forEach((alert) => {
      alertsBySeverity[alert.severity]++;
    });

    // Group by provider
    const alertsByProvider: Record<string, number> = {};
    filteredAlerts.forEach((alert) => {
      alertsByProvider[alert.triggeredBy] =
        (alertsByProvider[alert.triggeredBy] || 0) + 1;
    });

    return {
      totalAlerts,
      criticalAlerts,
      acknowledgedAlerts,
      overriddenAlerts,
      dismissedAlerts,
      acknowledgeRate,
      overrideRate,
      dismissRate,
      averageResponseTime: Math.round(averageResponseTime),
      alertsByCategory,
      alertsBySeverity,
      alertsByProvider,
      timeRange: { start: startDate, end: endDate },
    };
  }

  /**
   * Audit alert action
   */
  private async auditAlertAction(
    alert: CDSAlert,
    action: string,
    userId: string,
    notes?: string,
  ): Promise<void> {
    try {
      await auditLogger.log({
        resourceType: "patient",
        resourceId: alert.patientId,
        action: "update",
        actor: {
          userId,
          username: userId,
          role: "clinician",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          alertId: alert.id,
          alertCategory: alert.category,
          alertSeverity: alert.severity,
          action,
          notes,
        },
      });
    } catch (error) {
      console.error("Failed to audit alert action:", error);
    }
  }

  /**
   * Get override reasons summary
   */
  getOverrideReasonsSummary(
    startDate: Date,
    endDate: Date,
  ): Record<string, number> {
    const overriddenAlerts = this.alertHistory.filter((alert) => {
      const alertDate = new Date(alert.triggeredAt);
      return (
        alert.status === AlertStatus.OVERRIDDEN &&
        alertDate >= startDate &&
        alertDate <= endDate &&
        alert.overrideReason
      );
    });

    const reasonCounts: Record<string, number> = {};
    overriddenAlerts.forEach((alert) => {
      if (alert.overrideReason) {
        reasonCounts[alert.overrideReason] =
          (reasonCounts[alert.overrideReason] || 0) + 1;
      }
    });

    return reasonCounts;
  }

  /**
   * Identify alerts with high override rates
   */
  getHighOverrideRateAlerts(
    threshold: number = 0.5,
  ): { ruleId: string; overrideRate: number }[] {
    const ruleStats: Record<string, { total: number; overridden: number }> = {};

    this.alertHistory.forEach((alert) => {
      if (!ruleStats[alert.ruleId]) {
        ruleStats[alert.ruleId] = { total: 0, overridden: 0 };
      }
      ruleStats[alert.ruleId].total++;
      if (alert.status === AlertStatus.OVERRIDDEN) {
        ruleStats[alert.ruleId].overridden++;
      }
    });

    const highOverrideRules: { ruleId: string; overrideRate: number }[] = [];

    Object.entries(ruleStats).forEach(([ruleId, stats]) => {
      const overrideRate = stats.total > 0 ? stats.overridden / stats.total : 0;
      if (overrideRate >= threshold && stats.total >= 10) {
        // Minimum 10 alerts for statistical significance
        highOverrideRules.push({ ruleId, overrideRate });
      }
    });

    return highOverrideRules.sort((a, b) => b.overrideRate - a.overrideRate);
  }

  /**
   * Clear expired alerts
   */
  clearExpiredAlerts(): number {
    const now = new Date();
    let cleared = 0;

    this.activeAlerts.forEach((alert, id) => {
      if (alert.expiresAt && new Date(alert.expiresAt) < now) {
        alert.status = AlertStatus.EXPIRED;
        this.activeAlerts.delete(id);
        cleared++;
      }
    });

    return cleared;
  }
}

// Export singleton instance
export const alertManager = new AlertManager();
