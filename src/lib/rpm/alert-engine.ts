/**
 * RPM Alert Engine
 * Manages alert thresholds, evaluates readings, and handles escalation
 */

import type {
  AlertThreshold,
  RPMAlert,
  VitalSignReading,
  ReadingType,
  ThresholdCondition,
  AlertSeverity,
  AlertStatus,
  AlertType,
  EscalationRule,
  NotificationMethod,
  NotificationLog,
  AlertAction,
  CreateAlertThresholdDto,
  AcknowledgeAlertDto,
  ResolveAlertDto,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit-logger";
import { realtimeEngine } from "@/lib/realtime/engine";

export class AlertEngine {
  /**
   * Create alert threshold for patient
   */
  async createThreshold(
    dto: CreateAlertThresholdDto,
    userId: string,
    organizationId: string
  ): Promise<AlertThreshold> {
    const threshold: AlertThreshold = {
      id: crypto.randomUUID(),
      patientId: dto.patientId,
      readingType: dto.readingType,
      condition: dto.condition,
      value: dto.value,
      severity: dto.severity,
      isActive: true,
      notifyPatient: dto.notifyPatient ?? false,
      notifyCareTeam: dto.notifyCareTeam ?? true,
      escalationRules: dto.escalationRules || this.getDefaultEscalationRules(dto.severity),
      effectiveFrom: dto.effectiveFrom || new Date(),
      effectiveTo: dto.effectiveTo || null,
      createdBy: userId,
      notes: null,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      updatedBy: userId,
    };

    await db.rpmAlertThreshold.create({ data: threshold });

    await auditLog({
      action: "ALERT_THRESHOLD_CREATED",
      entityType: "RPM_ALERT_THRESHOLD",
      entityId: threshold.id,
      userId,
      organizationId,
      metadata: { readingType: dto.readingType, condition: dto.condition, value: dto.value },
    });

    return threshold;
  }

  /**
   * Evaluate a reading against all active thresholds
   */
  async evaluateReading(reading: VitalSignReading): Promise<RPMAlert[]> {
    const thresholds = await db.rpmAlertThreshold.findMany({
      where: {
        patientId: reading.patientId,
        readingType: reading.readingType,
        isActive: true,
        effectiveFrom: { lte: reading.timestamp },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: reading.timestamp } }],
        deletedAt: null,
      },
    });

    const alerts: RPMAlert[] = [];

    for (const threshold of thresholds) {
      const isTriggered = this.evaluateCondition(
        reading.value,
        threshold.condition as ThresholdCondition,
        threshold.value
      );

      if (isTriggered) {
        const alert = await this.createAlert(reading, threshold as AlertThreshold);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Create an alert
   */
  private async createAlert(
    reading: VitalSignReading,
    threshold: AlertThreshold
  ): Promise<RPMAlert> {
    // Check if similar alert already exists and is active
    const existingAlert = await db.rpmAlert.findFirst({
      where: {
        patientId: reading.patientId,
        readingType: reading.readingType,
        status: { in: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED] },
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Within last hour
      },
    });

    if (existingAlert) {
      // Update existing alert instead of creating duplicate
      return this.updateExistingAlert(existingAlert.id, reading);
    }

    const alert: RPMAlert = {
      id: crypto.randomUUID(),
      patientId: reading.patientId,
      readingId: reading.id,
      thresholdId: threshold.id,
      type: AlertType.THRESHOLD_EXCEEDED,
      severity: threshold.severity,
      title: this.generateAlertTitle(reading.readingType, threshold),
      message: this.generateAlertMessage(reading, threshold),
      value: reading.value,
      unit: reading.unit,
      thresholdValue: threshold.value,
      triggeredAt: reading.timestamp,
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      status: AlertStatus.ACTIVE,
      escalationLevel: 0,
      notificationsSent: [],
      actions: [],
      notes: null,
      organizationId: reading.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };

    await db.rpmAlert.create({ data: alert });

    // Send initial notifications
    await this.sendNotifications(alert, threshold);

    // Emit real-time event
    await realtimeEngine.emit({
      event: "alert:created",
      channel: `patient:${reading.patientId}`,
      data: alert,
    });

    // Schedule escalation if not acknowledged
    this.scheduleEscalation(alert, threshold);

    await auditLog({
      action: "RPM_ALERT_CREATED",
      entityType: "RPM_ALERT",
      entityId: alert.id,
      userId: "system",
      organizationId: reading.organizationId,
      metadata: {
        readingType: reading.readingType,
        value: reading.value,
        severity: alert.severity,
      },
    });

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(dto: AcknowledgeAlertDto, organizationId: string): Promise<RPMAlert> {
    const alert = await db.rpmAlert.findUnique({
      where: { id: dto.alertId, organizationId },
    });

    if (!alert) {
      throw new Error("Alert not found");
    }

    if (alert.status === AlertStatus.RESOLVED) {
      throw new Error("Cannot acknowledge resolved alert");
    }

    const action: AlertAction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: dto.userId,
      action: "acknowledged",
      comment: dto.comment || null,
    };

    const updated = await db.rpmAlert.update({
      where: { id: dto.alertId },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: dto.userId,
        actions: [...(alert.actions as AlertAction[]), action],
        updatedAt: new Date(),
      },
    });

    await realtimeEngine.emit({
      event: "alert:acknowledged",
      channel: `patient:${alert.patientId}`,
      data: updated,
    });

    await auditLog({
      action: "RPM_ALERT_ACKNOWLEDGED",
      entityType: "RPM_ALERT",
      entityId: alert.id,
      userId: dto.userId,
      organizationId,
      metadata: { comment: dto.comment },
    });

    return updated as RPMAlert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(dto: ResolveAlertDto, organizationId: string): Promise<RPMAlert> {
    const alert = await db.rpmAlert.findUnique({
      where: { id: dto.alertId, organizationId },
    });

    if (!alert) {
      throw new Error("Alert not found");
    }

    const action: AlertAction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: dto.userId,
      action: "resolved",
      comment: dto.resolution,
    };

    const updated = await db.rpmAlert.update({
      where: { id: dto.alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: dto.userId,
        actions: [...(alert.actions as AlertAction[]), action],
        notes: dto.actions || null,
        updatedAt: new Date(),
      },
    });

    await realtimeEngine.emit({
      event: "alert:resolved",
      channel: `patient:${alert.patientId}`,
      data: updated,
    });

    await auditLog({
      action: "RPM_ALERT_RESOLVED",
      entityType: "RPM_ALERT",
      entityId: alert.id,
      userId: dto.userId,
      organizationId,
      metadata: { resolution: dto.resolution },
    });

    return updated as RPMAlert;
  }

  /**
   * Get active alerts for patient
   */
  async getPatientAlerts(
    patientId: string,
    filters?: {
      severity?: AlertSeverity[];
      status?: AlertStatus[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<RPMAlert[]> {
    const where: any = {
      patientId,
      deletedAt: null,
    };

    if (filters?.severity) {
      where.severity = { in: filters.severity };
    }

    if (filters?.status) {
      where.status = { in: filters.status };
    }

    if (filters?.startDate || filters?.endDate) {
      where.triggeredAt = {};
      if (filters.startDate) {
        where.triggeredAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.triggeredAt.lte = filters.endDate;
      }
    }

    const alerts = await db.rpmAlert.findMany({
      where,
      orderBy: { triggeredAt: "desc" },
    });

    return alerts as RPMAlert[];
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(patientId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await db.rpmAlert.findMany({
      where: {
        patientId,
        triggeredAt: { gte: startDate },
        deletedAt: null,
      },
    });

    const stats = {
      total: alerts.length,
      active: alerts.filter((a) => a.status === AlertStatus.ACTIVE).length,
      acknowledged: alerts.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length,
      resolved: alerts.filter((a) => a.status === AlertStatus.RESOLVED).length,
      bySeverity: {
        critical: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
        high: alerts.filter((a) => a.severity === AlertSeverity.HIGH).length,
        medium: alerts.filter((a) => a.severity === AlertSeverity.MEDIUM).length,
        low: alerts.filter((a) => a.severity === AlertSeverity.LOW).length,
        info: alerts.filter((a) => a.severity === AlertSeverity.INFO).length,
      },
      byType: {} as Record<AlertType, number>,
      averageResponseTime: this.calculateAverageResponseTime(alerts),
    };

    alerts.forEach((alert) => {
      const type = alert.type as AlertType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Evaluate if a condition is met
   */
  private evaluateCondition(value: number, condition: ThresholdCondition, threshold: number): boolean {
    switch (condition) {
      case ThresholdCondition.GREATER_THAN:
        return value > threshold;
      case ThresholdCondition.LESS_THAN:
        return value < threshold;
      case ThresholdCondition.GREATER_THAN_OR_EQUAL:
        return value >= threshold;
      case ThresholdCondition.LESS_THAN_OR_EQUAL:
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(readingType: ReadingType, threshold: AlertThreshold): string {
    const readingName = readingType.replace(/_/g, " ").toLowerCase();
    const conditionText = this.getConditionText(threshold.condition);

    return `${readingName.charAt(0).toUpperCase() + readingName.slice(1)} ${conditionText} ${threshold.value}`;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(reading: VitalSignReading, threshold: AlertThreshold): string {
    const readingName = reading.readingType.replace(/_/g, " ").toLowerCase();
    const conditionText = this.getConditionText(threshold.condition);

    return `Patient's ${readingName} reading of ${reading.value} ${reading.unit} ${conditionText} the threshold of ${threshold.value} ${reading.unit}. Recorded at ${reading.timestamp.toLocaleString()}.`;
  }

  /**
   * Get condition text
   */
  private getConditionText(condition: ThresholdCondition): string {
    const texts: Record<ThresholdCondition, string> = {
      [ThresholdCondition.GREATER_THAN]: "exceeds",
      [ThresholdCondition.LESS_THAN]: "is below",
      [ThresholdCondition.GREATER_THAN_OR_EQUAL]: "meets or exceeds",
      [ThresholdCondition.LESS_THAN_OR_EQUAL]: "is at or below",
      [ThresholdCondition.OUTSIDE_RANGE]: "is outside range of",
      [ThresholdCondition.RATE_OF_CHANGE]: "changed rapidly near",
      [ThresholdCondition.CONSECUTIVE_READINGS]: "consistently near",
      [ThresholdCondition.MISSING_READINGS]: "missing readings for",
    };
    return texts[condition] || "anomaly near";
  }

  /**
   * Get default escalation rules based on severity
   */
  private getDefaultEscalationRules(severity: AlertSeverity): EscalationRule[] {
    const rules: Record<AlertSeverity, EscalationRule[]> = {
      [AlertSeverity.CRITICAL]: [
        {
          id: crypto.randomUUID(),
          level: 1,
          delayMinutes: 0,
          notifyRoles: ["nurse", "physician"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.IN_APP, NotificationMethod.SMS, NotificationMethod.PHONE_CALL],
          requireAcknowledgment: true,
        },
        {
          id: crypto.randomUUID(),
          level: 2,
          delayMinutes: 15,
          notifyRoles: ["physician", "supervisor"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.PHONE_CALL],
          requireAcknowledgment: true,
        },
      ],
      [AlertSeverity.HIGH]: [
        {
          id: crypto.randomUUID(),
          level: 1,
          delayMinutes: 0,
          notifyRoles: ["nurse"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.IN_APP, NotificationMethod.SMS],
          requireAcknowledgment: true,
        },
        {
          id: crypto.randomUUID(),
          level: 2,
          delayMinutes: 30,
          notifyRoles: ["physician"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.SMS],
          requireAcknowledgment: true,
        },
      ],
      [AlertSeverity.MEDIUM]: [
        {
          id: crypto.randomUUID(),
          level: 1,
          delayMinutes: 0,
          notifyRoles: ["nurse"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.IN_APP],
          requireAcknowledgment: false,
        },
      ],
      [AlertSeverity.LOW]: [
        {
          id: crypto.randomUUID(),
          level: 1,
          delayMinutes: 0,
          notifyRoles: ["nurse"],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.IN_APP],
          requireAcknowledgment: false,
        },
      ],
      [AlertSeverity.INFO]: [
        {
          id: crypto.randomUUID(),
          level: 1,
          delayMinutes: 0,
          notifyRoles: [],
          notifyUsers: [],
          notificationMethods: [NotificationMethod.IN_APP],
          requireAcknowledgment: false,
        },
      ],
    };

    return rules[severity] || rules[AlertSeverity.MEDIUM];
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: RPMAlert, threshold: AlertThreshold): Promise<void> {
    const rule = threshold.escalationRules[0];
    if (!rule) return;

    const notifications: NotificationLog[] = [];

    // Send to care team
    if (threshold.notifyCareTeam) {
      for (const method of rule.notificationMethods) {
        const notification = await this.sendNotification(alert, method, rule.notifyRoles);
        if (notification) {
          notifications.push(notification);
        }
      }
    }

    // Send to patient
    if (threshold.notifyPatient) {
      const patientNotification = await this.sendPatientNotification(alert);
      if (patientNotification) {
        notifications.push(patientNotification);
      }
    }

    // Update alert with notifications sent
    await db.rpmAlert.update({
      where: { id: alert.id },
      data: { notificationsSent: notifications },
    });
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    alert: RPMAlert,
    method: NotificationMethod,
    roles: string[]
  ): Promise<NotificationLog | null> {
    try {
      // Implementation would integrate with notification service
      console.log(`Sending ${method} notification for alert ${alert.id} to roles: ${roles.join(", ")}`);

      return {
        id: crypto.randomUUID(),
        sentAt: new Date(),
        method,
        recipient: roles.join(","),
        status: "sent",
        error: null,
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        sentAt: new Date(),
        method,
        recipient: roles.join(","),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send patient notification
   */
  private async sendPatientNotification(alert: RPMAlert): Promise<NotificationLog | null> {
    try {
      // Send push notification to patient
      console.log(`Sending patient notification for alert ${alert.id}`);

      return {
        id: crypto.randomUUID(),
        sentAt: new Date(),
        method: NotificationMethod.PUSH_NOTIFICATION,
        recipient: alert.patientId,
        status: "sent",
        error: null,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Schedule escalation for alert
   */
  private scheduleEscalation(alert: RPMAlert, threshold: AlertThreshold): void {
    const rules = threshold.escalationRules;

    rules.forEach((rule, index) => {
      if (index === 0) return; // Skip first rule as it's already sent

      setTimeout(async () => {
        // Check if alert is still active
        const currentAlert = await db.rpmAlert.findUnique({
          where: { id: alert.id },
        });

        if (
          currentAlert &&
          currentAlert.status === AlertStatus.ACTIVE &&
          !currentAlert.acknowledgedAt
        ) {
          await this.escalateAlert(alert, rule, index);
        }
      }, rule.delayMinutes * 60 * 1000);
    });
  }

  /**
   * Escalate alert to next level
   */
  private async escalateAlert(alert: RPMAlert, rule: EscalationRule, level: number): Promise<void> {
    await db.rpmAlert.update({
      where: { id: alert.id },
      data: {
        status: AlertStatus.ESCALATED,
        escalationLevel: level,
        updatedAt: new Date(),
      },
    });

    // Send escalation notifications
    for (const method of rule.notificationMethods) {
      await this.sendNotification(alert, method, rule.notifyRoles);
    }

    await realtimeEngine.emit({
      event: "alert:escalated",
      channel: `patient:${alert.patientId}`,
      data: { alertId: alert.id, level },
    });
  }

  /**
   * Update existing alert
   */
  private async updateExistingAlert(alertId: string, reading: VitalSignReading): Promise<RPMAlert> {
    const updated = await db.rpmAlert.update({
      where: { id: alertId },
      data: {
        readingId: reading.id,
        value: reading.value,
        triggeredAt: reading.timestamp,
        updatedAt: new Date(),
      },
    });

    return updated as RPMAlert;
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(alerts: any[]): number {
    const acknowledgedAlerts = alerts.filter((a) => a.acknowledgedAt);

    if (acknowledgedAlerts.length === 0) return 0;

    const totalTime = acknowledgedAlerts.reduce((sum, alert) => {
      const responseTime = alert.acknowledgedAt.getTime() - alert.triggeredAt.getTime();
      return sum + responseTime;
    }, 0);

    return Math.round(totalTime / acknowledgedAlerts.length / 60000); // Convert to minutes
  }
}

export const alertEngine = new AlertEngine();
