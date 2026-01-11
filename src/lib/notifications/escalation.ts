/**
 * Escalation Engine
 * Lithic Healthcare Platform v0.5
 *
 * Manages escalation rules for critical notifications that require
 * acknowledgment or action within specified timeframes.
 */

import {
  Notification,
  EscalationRule,
  EscalationStep,
  NotificationPriority,
  NotificationCategory,
  NotificationStatus,
  CreateNotificationRequest,
} from '@/types/notifications';

export class EscalationEngine {
  private notificationHub: any; // Reference to NotificationHub
  private escalationTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();

  constructor(notificationHub: any) {
    this.notificationHub = notificationHub;
    this.initializeDefaultRules();
  }

  /**
   * Setup escalation for a notification
   */
  async setupEscalation(notification: Notification): Promise<void> {
    // Find applicable escalation rules
    const rules = this.findApplicableRules(notification);

    if (rules.length === 0) {
      return;
    }

    // Setup escalation timers for each rule
    for (const rule of rules) {
      await this.setupRuleEscalation(notification, rule);
    }
  }

  /**
   * Setup escalation timers for a specific rule
   */
  private async setupRuleEscalation(
    notification: Notification,
    rule: EscalationRule
  ): Promise<void> {
    const timers: NodeJS.Timeout[] = [];

    // Sort steps by order
    const sortedSteps = [...rule.steps].sort((a, b) => a.order - b.order);

    for (const step of sortedSteps) {
      const timer = setTimeout(async () => {
        await this.executeEscalationStep(notification, step, rule);
      }, step.delayMinutes * 60 * 1000);

      timers.push(timer);
    }

    // Store timers for later cancellation
    const existingTimers = this.escalationTimers.get(notification.id) || [];
    this.escalationTimers.set(notification.id, [...existingTimers, ...timers]);
  }

  /**
   * Execute an escalation step
   */
  private async executeEscalationStep(
    notification: Notification,
    step: EscalationStep,
    rule: EscalationRule
  ): Promise<void> {
    // Check if escalation should still proceed
    if (!(await this.shouldEscalate(notification, step))) {
      return;
    }

    switch (step.action) {
      case 'resend':
        await this.resendNotification(notification, step);
        break;

      case 'add_channel':
        await this.addChannels(notification, step);
        break;

      case 'notify_supervisor':
        await this.notifySupervisor(notification, step, rule);
        break;

      case 'page':
        await this.pageRecipients(notification, step);
        break;
    }

    // Log escalation event
    await this.logEscalationEvent(notification, step, rule);
  }

  /**
   * Check if escalation should proceed
   */
  private async shouldEscalate(
    notification: Notification,
    step: EscalationStep
  ): Promise<boolean> {
    // Get current notification status
    const current = await this.notificationHub.getNotification(notification.id);

    if (!current) {
      return false; // Notification deleted
    }

    // Check conditions
    if (step.conditions) {
      // Check if notification was read
      if (
        step.conditions.notReadAfterMinutes &&
        current.readAt &&
        Date.now() - current.readAt.getTime() <
          step.conditions.notReadAfterMinutes * 60 * 1000
      ) {
        return false; // Was read in time
      }

      // Check status
      if (
        step.conditions.status &&
        !step.conditions.status.includes(current.status)
      ) {
        return false; // Status doesn't match
      }
    }

    // Check if already read or acknowledged
    if (current.readAt || current.dismissedAt) {
      return false;
    }

    return true;
  }

  /**
   * Resend notification through existing channels
   */
  private async resendNotification(
    notification: Notification,
    step: EscalationStep
  ): Promise<void> {
    const request: CreateNotificationRequest = {
      recipients: [{ userId: notification.recipientId }],
      title: `[REMINDER] ${notification.title}`,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      channels: step.channels || notification.channels,
      metadata: {
        ...notification.metadata,
        escalationStep: step.order,
        originalNotificationId: notification.id,
      },
    };

    await this.notificationHub.send(request);
  }

  /**
   * Add additional channels to notification
   */
  private async addChannels(
    notification: Notification,
    step: EscalationStep
  ): Promise<void> {
    if (!step.channels || step.channels.length === 0) {
      return;
    }

    const request: CreateNotificationRequest = {
      recipients: [{ userId: notification.recipientId }],
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      channels: step.channels,
      metadata: {
        ...notification.metadata,
        escalationStep: step.order,
        originalNotificationId: notification.id,
      },
    };

    await this.notificationHub.send(request);
  }

  /**
   * Notify supervisor or escalation recipients
   */
  private async notifySupervisor(
    notification: Notification,
    step: EscalationStep,
    rule: EscalationRule
  ): Promise<void> {
    const recipients: Array<{ userId: string }> = [];

    // Add specific recipients
    if (step.recipientIds && step.recipientIds.length > 0) {
      recipients.push(...step.recipientIds.map((userId) => ({ userId })));
    }

    // Add recipients by role
    if (step.recipientRoles && step.recipientRoles.length > 0) {
      const roleRecipients = await this.getUsersByRoles(step.recipientRoles);
      recipients.push(...roleRecipients.map((userId) => ({ userId })));
    }

    if (recipients.length === 0) {
      return;
    }

    const request: CreateNotificationRequest = {
      recipients,
      title: `[ESCALATED] ${notification.title}`,
      message: `Escalated notification from ${notification.recipientId}: ${notification.message}`,
      category: notification.category,
      priority: NotificationPriority.HIGH,
      channels: step.channels || notification.channels,
      metadata: {
        ...notification.metadata,
        escalationStep: step.order,
        escalationRule: rule.id,
        originalNotificationId: notification.id,
        originalRecipient: notification.recipientId,
      },
    };

    await this.notificationHub.send(request);
  }

  /**
   * Send page notification (highest priority)
   */
  private async pageRecipients(
    notification: Notification,
    step: EscalationStep
  ): Promise<void> {
    const recipients: Array<{ userId: string }> = [];

    if (step.recipientIds && step.recipientIds.length > 0) {
      recipients.push(...step.recipientIds.map((userId) => ({ userId })));
    }

    if (step.recipientRoles && step.recipientRoles.length > 0) {
      const roleRecipients = await this.getUsersByRoles(step.recipientRoles);
      recipients.push(...roleRecipients.map((userId) => ({ userId })));
    }

    if (recipients.length === 0) {
      recipients.push({ userId: notification.recipientId });
    }

    const request: CreateNotificationRequest = {
      recipients,
      title: `[URGENT PAGE] ${notification.title}`,
      message: notification.message,
      category: notification.category,
      priority: NotificationPriority.CRITICAL,
      channels: step.channels || ['push', 'sms', 'in_app'] as any,
      metadata: {
        ...notification.metadata,
        escalationStep: step.order,
        isPage: true,
        originalNotificationId: notification.id,
      },
    };

    await this.notificationHub.send(request);
  }

  /**
   * Cancel escalation for a notification
   */
  async cancelEscalation(notificationId: string): Promise<void> {
    const timers = this.escalationTimers.get(notificationId);

    if (timers) {
      timers.forEach((timer) => clearTimeout(timer));
      this.escalationTimers.delete(notificationId);
    }
  }

  /**
   * Find applicable escalation rules for a notification
   */
  private findApplicableRules(notification: Notification): EscalationRule[] {
    const rules: EscalationRule[] = [];

    for (const rule of this.escalationRules.values()) {
      if (!rule.enabled) {
        continue;
      }

      // Check if rule applies to this notification
      if (this.doesRuleApply(rule, notification)) {
        rules.push(rule);
      }
    }

    return rules;
  }

  /**
   * Check if a rule applies to a notification
   */
  private doesRuleApply(rule: EscalationRule, notification: Notification): boolean {
    const conditions = rule.conditions;

    // Check category
    if (
      conditions.categories &&
      conditions.categories.length > 0 &&
      !conditions.categories.includes(notification.category)
    ) {
      return false;
    }

    // Check priority
    if (
      conditions.priorities &&
      conditions.priorities.length > 0 &&
      !conditions.priorities.includes(notification.priority)
    ) {
      return false;
    }

    // Check metadata conditions
    if (conditions.metadata) {
      for (const [key, value] of Object.entries(conditions.metadata)) {
        if (notification.metadata?.[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Register a new escalation rule
   */
  registerRule(rule: EscalationRule): void {
    this.escalationRules.set(rule.id, rule);
  }

  /**
   * Get escalation rule by ID
   */
  getRule(ruleId: string): EscalationRule | undefined {
    return this.escalationRules.get(ruleId);
  }

  /**
   * Get all escalation rules
   */
  getAllRules(): EscalationRule[] {
    return Array.from(this.escalationRules.values());
  }

  /**
   * Delete escalation rule
   */
  deleteRule(ruleId: string): boolean {
    return this.escalationRules.delete(ruleId);
  }

  /**
   * Initialize default escalation rules
   */
  private initializeDefaultRules(): void {
    // Critical Alert Escalation
    this.registerRule({
      id: 'critical-alert-escalation',
      tenantId: 'default',
      name: 'Critical Alert Escalation',
      description: 'Escalate unacknowledged critical alerts',
      conditions: {
        priorities: [NotificationPriority.CRITICAL],
        categories: [NotificationCategory.CLINICAL_ALERT],
      },
      steps: [
        {
          order: 1,
          delayMinutes: 5,
          action: 'resend',
          channels: ['push', 'sms'] as any,
          conditions: {
            notReadAfterMinutes: 5,
          },
        },
        {
          order: 2,
          delayMinutes: 10,
          action: 'notify_supervisor',
          recipientRoles: ['supervisor', 'on-call'],
          channels: ['push', 'sms', 'in_app'] as any,
          conditions: {
            notReadAfterMinutes: 10,
          },
        },
        {
          order: 3,
          delayMinutes: 15,
          action: 'page',
          recipientRoles: ['supervisor', 'on-call', 'admin'],
          channels: ['sms'] as any,
          conditions: {
            notReadAfterMinutes: 15,
          },
        },
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // High Priority Escalation
    this.registerRule({
      id: 'high-priority-escalation',
      tenantId: 'default',
      name: 'High Priority Escalation',
      description: 'Escalate unread high priority notifications',
      conditions: {
        priorities: [NotificationPriority.HIGH],
      },
      steps: [
        {
          order: 1,
          delayMinutes: 30,
          action: 'resend',
          channels: ['push'] as any,
          conditions: {
            notReadAfterMinutes: 30,
          },
        },
        {
          order: 2,
          delayMinutes: 60,
          action: 'add_channel',
          channels: ['email'] as any,
          conditions: {
            notReadAfterMinutes: 60,
          },
        },
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Helper: Get users by roles
   */
  private async getUsersByRoles(roles: string[]): Promise<string[]> {
    // In production, this would query the database for users with these roles
    // For now, return empty array
    return [];
  }

  /**
   * Helper: Log escalation event
   */
  private async logEscalationEvent(
    notification: Notification,
    step: EscalationStep,
    rule: EscalationRule
  ): Promise<void> {
    // In production, this would log to database/analytics
    console.log('Escalation executed:', {
      notificationId: notification.id,
      ruleId: rule.id,
      step: step.order,
      action: step.action,
      timestamp: new Date(),
    });
  }

  /**
   * Get escalation status for a notification
   */
  async getEscalationStatus(notificationId: string): Promise<{
    hasEscalation: boolean;
    activeSteps: number;
    nextStepIn?: number; // milliseconds
  }> {
    const timers = this.escalationTimers.get(notificationId);

    if (!timers || timers.length === 0) {
      return {
        hasEscalation: false,
        activeSteps: 0,
      };
    }

    return {
      hasEscalation: true,
      activeSteps: timers.length,
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    // Cancel all escalation timers
    for (const timers of this.escalationTimers.values()) {
      timers.forEach((timer) => clearTimeout(timer));
    }
    this.escalationTimers.clear();
  }
}
