/**
 * Notification Engine
 * Multi-channel notification system with template management and escalation
 */

import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationCategory,
  NotificationTemplate,
  NotificationPreference,
  NotificationFrequency,
  RecipientType,
} from "@/types/workflow";

// ============================================================================
// Notification Manager Class
// ============================================================================

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference[]> = new Map();
  private digestQueues: Map<string, Notification[]> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private deliveryProviders: Map<NotificationChannel, DeliveryProvider> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.startDigestProcessors();
  }

  /**
   * Send notification
   */
  async sendNotification(params: SendNotificationParams): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      recipientId: params.recipientId,
      recipientType: params.recipientType || RecipientType.USER,
      channel: params.channel,
      priority: params.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      title: params.title,
      message: params.message,
      templateId: params.templateId || null,
      templateData: params.templateData || {},
      category: params.category,
      actionUrl: params.actionUrl || null,
      actionLabel: params.actionLabel || null,
      expiresAt: params.expiresAt || null,
      readAt: null,
      deliveredAt: null,
      failedAt: null,
      error: null,
      attempts: 0,
      metadata: params.metadata || {},
      organizationId: params.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.createdBy || "system",
      updatedBy: params.createdBy || "system",
    };

    this.notifications.set(notification.id, notification);

    // Check user preferences
    const shouldSend = await this.checkPreferences(notification);
    if (!shouldSend) {
      notification.status = NotificationStatus.CANCELLED;
      notification.metadata.reason = "User preferences";
      return notification;
    }

    // Send immediately or queue for digest
    const preference = this.getUserPreference(
      notification.recipientId,
      notification.category
    );

    if (
      preference &&
      preference.frequency !== NotificationFrequency.IMMEDIATE &&
      notification.priority !== NotificationPriority.URGENT &&
      notification.priority !== NotificationPriority.HIGH
    ) {
      await this.queueForDigest(notification, preference.frequency);
    } else {
      await this.deliverNotification(notification);
    }

    this.emitEvent("notification:created", notification);

    return notification;
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(
    templateId: string,
    params: Omit<SendNotificationParams, "title" | "message" | "templateId"> & {
      data: Record<string, any>;
    }
  ): Promise<Notification> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isActive) {
      throw new Error("Template is not active");
    }

    const title = this.renderTemplate(template.subject, params.data);
    const message = this.renderTemplate(template.bodyTemplate, params.data);

    return this.sendNotification({
      ...params,
      title,
      message,
      templateId,
      templateData: params.data,
      channel: template.channel,
      category: template.category,
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    recipientIds: string[],
    params: Omit<SendNotificationParams, "recipientId">
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      recipientIds.map((recipientId) =>
        this.sendNotification({ ...params, recipientId })
      )
    );

    this.emitEvent("notification:bulk:sent", { notifications, count: notifications.length });

    return notifications;
  }

  /**
   * Send escalation chain
   */
  async sendEscalation(params: EscalationParams): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const level of params.chain) {
      // Wait for delay before sending
      if (level.delayMinutes > 0) {
        await this.delay(level.delayMinutes * 60000);
      }

      // Check if escalation is still needed
      if (params.checkCondition && !(await params.checkCondition())) {
        break;
      }

      // Send to all recipients in this level
      const levelNotifications = await this.sendBulk(level.recipientIds, {
        title: params.title,
        message: params.message,
        channel: params.channel,
        priority: level.priority || NotificationPriority.HIGH,
        category: params.category,
        actionUrl: params.actionUrl,
        actionLabel: params.actionLabel,
        organizationId: params.organizationId,
        createdBy: params.createdBy,
      });

      notifications.push(...levelNotifications);

      this.emitEvent("notification:escalation:level", {
        level: level.level,
        notifications: levelNotifications,
      });
    }

    return notifications;
  }

  /**
   * Deliver notification
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    notification.status = NotificationStatus.SENT;
    notification.attempts++;

    try {
      const provider = this.deliveryProviders.get(notification.channel);
      if (!provider) {
        throw new Error(`No delivery provider for channel: ${notification.channel}`);
      }

      await provider.deliver(notification);

      notification.status = NotificationStatus.DELIVERED;
      notification.deliveredAt = new Date();

      this.emitEvent("notification:delivered", notification);
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.failedAt = new Date();
      notification.error = error instanceof Error ? error.message : String(error);

      this.emitEvent("notification:failed", { notification, error });

      // Retry logic
      if (notification.attempts < 3) {
        setTimeout(() => {
          this.deliverNotification(notification);
        }, Math.pow(2, notification.attempts) * 1000);
      }
    }

    notification.updatedAt = new Date();
  }

  /**
   * Queue notification for digest
   */
  private async queueForDigest(
    notification: Notification,
    frequency: NotificationFrequency
  ): Promise<void> {
    const queueKey = `${notification.recipientId}:${frequency}`;

    if (!this.digestQueues.has(queueKey)) {
      this.digestQueues.set(queueKey, []);
    }

    this.digestQueues.get(queueKey)!.push(notification);
    notification.metadata.digestFrequency = frequency;
    notification.status = NotificationStatus.PENDING;
  }

  /**
   * Process digest queue
   */
  private async processDigest(recipientId: string, frequency: NotificationFrequency): Promise<void> {
    const queueKey = `${recipientId}:${frequency}`;
    const queue = this.digestQueues.get(queueKey) || [];

    if (queue.length === 0) return;

    // Group notifications by category
    const grouped = this.groupBy(queue, (n) => n.category);

    // Create digest notification
    const digestMessage = this.createDigestMessage(grouped);

    await this.sendNotification({
      recipientId,
      channel: NotificationChannel.EMAIL,
      priority: NotificationPriority.NORMAL,
      title: `Your ${frequency.toLowerCase()} digest`,
      message: digestMessage,
      category: NotificationCategory.SYSTEM,
      organizationId: queue[0].organizationId,
      createdBy: "system",
    });

    // Mark individual notifications as sent
    queue.forEach((n) => {
      n.status = NotificationStatus.SENT;
      n.deliveredAt = new Date();
    });

    // Clear queue
    this.digestQueues.set(queueKey, []);

    this.emitEvent("notification:digest:sent", {
      recipientId,
      frequency,
      count: queue.length,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.recipientId !== userId) {
      throw new Error("Unauthorized");
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    notification.updatedAt = new Date();

    this.emitEvent("notification:read", notification);

    return notification;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;

    this.notifications.forEach((notification) => {
      if (
        notification.recipientId === userId &&
        notification.status !== NotificationStatus.READ
      ) {
        notification.status = NotificationStatus.READ;
        notification.readAt = new Date();
        notification.updatedAt = new Date();
        count++;
      }
    });

    this.emitEvent("notification:mark_all_read", { userId, count });

    return count;
  }

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, filters?: NotificationFilters): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.recipientId === userId)
      .filter((n) => this.matchesFilters(n, filters))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values()).filter(
      (n) =>
        n.recipientId === userId &&
        n.status !== NotificationStatus.READ &&
        n.status !== NotificationStatus.CANCELLED
    ).length;
  }

  /**
   * Create or update notification template
   */
  async saveTemplate(params: SaveTemplateParams): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      id: params.id || this.generateId(),
      name: params.name,
      category: params.category,
      channel: params.channel,
      subject: params.subject,
      bodyTemplate: params.bodyTemplate,
      htmlTemplate: params.htmlTemplate || null,
      variables: params.variables,
      isActive: params.isActive ?? true,
      metadata: params.metadata || {},
      organizationId: params.organizationId,
      createdAt: params.id ? this.templates.get(params.id)?.createdAt || new Date() : new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
    };

    this.templates.set(template.id, template);
    this.emitEvent("template:saved", template);

    return template;
  }

  /**
   * Set user notification preferences
   */
  async setPreferences(
    userId: string,
    preferences: Omit<NotificationPreference, "userId">[]
  ): Promise<void> {
    const userPreferences = preferences.map((p) => ({
      ...p,
      userId,
    }));

    this.preferences.set(userId, userPreferences);
    this.emitEvent("preferences:updated", { userId, preferences: userPreferences });
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): NotificationPreference[] {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Get user preference for category
   */
  private getUserPreference(
    userId: string,
    category: NotificationCategory
  ): NotificationPreference | undefined {
    const preferences = this.getUserPreferences(userId);
    return preferences.find((p) => p.category === category);
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private async checkPreferences(notification: Notification): Promise<boolean> {
    const preference = this.getUserPreference(
      notification.recipientId,
      notification.category
    );

    if (!preference) return true;

    // Check if category is enabled
    if (!preference.enabled) return false;

    // Check if channel is allowed
    if (!preference.channels.includes(notification.channel)) return false;

    // Check quiet hours
    if (
      preference.quietHoursStart &&
      preference.quietHoursEnd &&
      notification.priority !== NotificationPriority.URGENT
    ) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      if (
        currentTime >= preference.quietHoursStart &&
        currentTime <= preference.quietHoursEnd
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : "";
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * Create digest message
   */
  private createDigestMessage(
    grouped: Record<NotificationCategory, Notification[]>
  ): string {
    let message = "Summary of your notifications:\n\n";

    Object.entries(grouped).forEach(([category, notifications]) => {
      message += `${category}: ${notifications.length} notification(s)\n`;
      notifications.slice(0, 5).forEach((n) => {
        message += `  - ${n.title}\n`;
      });
      if (notifications.length > 5) {
        message += `  ... and ${notifications.length - 5} more\n`;
      }
      message += "\n";
    });

    return message;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Partial<NotificationTemplate>[] = [
      {
        name: "Task Assigned",
        category: NotificationCategory.TASK_ASSIGNED,
        channel: NotificationChannel.IN_APP,
        subject: "New Task Assigned: {{taskTitle}}",
        bodyTemplate: "You have been assigned a new task: {{taskTitle}}. Priority: {{priority}}. Due: {{dueDate}}",
        variables: ["taskTitle", "priority", "dueDate"],
        isActive: true,
      },
      {
        name: "Task Due Soon",
        category: NotificationCategory.TASK_DUE,
        channel: NotificationChannel.IN_APP,
        subject: "Task Due Soon: {{taskTitle}}",
        bodyTemplate: "Task '{{taskTitle}}' is due in {{hoursRemaining}} hours.",
        variables: ["taskTitle", "hoursRemaining"],
        isActive: true,
      },
      {
        name: "Approval Request",
        category: NotificationCategory.APPROVAL_REQUESTED,
        channel: NotificationChannel.EMAIL,
        subject: "Approval Required: {{requestTitle}}",
        bodyTemplate: "Your approval is required for: {{requestTitle}}. Requested by: {{requestedBy}}",
        variables: ["requestTitle", "requestedBy"],
        isActive: true,
      },
      {
        name: "Critical Alert",
        category: NotificationCategory.CRITICAL_ALERT,
        channel: NotificationChannel.SMS,
        subject: "CRITICAL: {{alertTitle}}",
        bodyTemplate: "CRITICAL ALERT: {{alertMessage}}. Immediate action required.",
        variables: ["alertTitle", "alertMessage"],
        isActive: true,
      },
    ];

    defaultTemplates.forEach((template) => {
      const fullTemplate: NotificationTemplate = {
        id: this.generateId(),
        organizationId: "default",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: "system",
        updatedBy: "system",
        htmlTemplate: null,
        metadata: {},
        ...template,
      } as NotificationTemplate;

      this.templates.set(fullTemplate.id, fullTemplate);
    });
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreference[] {
    return [
      {
        userId,
        category: NotificationCategory.TASK_ASSIGNED,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        enabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        frequency: NotificationFrequency.IMMEDIATE,
      },
      {
        userId,
        category: NotificationCategory.CRITICAL_ALERT,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ],
        enabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        frequency: NotificationFrequency.IMMEDIATE,
      },
    ];
  }

  /**
   * Start digest processors
   */
  private startDigestProcessors(): void {
    // Hourly digest
    setInterval(() => {
      Array.from(this.preferences.values()).forEach((prefs) => {
        prefs.forEach((pref) => {
          if (pref.frequency === NotificationFrequency.DIGEST_HOURLY) {
            this.processDigest(pref.userId, NotificationFrequency.DIGEST_HOURLY);
          }
        });
      });
    }, 60 * 60 * 1000);

    // Daily digest (at 8 AM)
    const now = new Date();
    const next8AM = new Date(now);
    next8AM.setHours(8, 0, 0, 0);
    if (next8AM <= now) {
      next8AM.setDate(next8AM.getDate() + 1);
    }
    const timeUntil8AM = next8AM.getTime() - now.getTime();

    setTimeout(() => {
      Array.from(this.preferences.values()).forEach((prefs) => {
        prefs.forEach((pref) => {
          if (pref.frequency === NotificationFrequency.DIGEST_DAILY) {
            this.processDigest(pref.userId, NotificationFrequency.DIGEST_DAILY);
          }
        });
      });

      // Then repeat daily
      setInterval(() => {
        Array.from(this.preferences.values()).forEach((prefs) => {
          prefs.forEach((pref) => {
            if (pref.frequency === NotificationFrequency.DIGEST_DAILY) {
              this.processDigest(pref.userId, NotificationFrequency.DIGEST_DAILY);
            }
          });
        });
      }, 24 * 60 * 60 * 1000);
    }, timeUntil8AM);
  }

  /**
   * Register delivery provider
   */
  registerProvider(channel: NotificationChannel, provider: DeliveryProvider): void {
    this.deliveryProviders.set(channel, provider);
  }

  /**
   * Match filters
   */
  private matchesFilters(notification: Notification, filters?: NotificationFilters): boolean {
    if (!filters) return true;

    if (filters.status && !filters.status.includes(notification.status)) return false;
    if (filters.category && !filters.category.includes(notification.category)) return false;
    if (filters.channel && !filters.channel.includes(notification.channel)) return false;
    if (filters.unreadOnly && notification.status === NotificationStatus.READ) return false;

    return true;
  }

  /**
   * Group by key function
   */
  private groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    items.forEach((item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    });
    return result;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Register event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Default Delivery Providers
// ============================================================================

export const inAppProvider: DeliveryProvider = {
  async deliver(notification: Notification): Promise<void> {
    // In-app notifications are stored in database and delivered via WebSocket
    console.log("In-app notification:", notification.title);
  },
};

export const emailProvider: DeliveryProvider = {
  async deliver(notification: Notification): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log("Email notification to:", notification.recipientId);
    console.log("Subject:", notification.title);
    console.log("Body:", notification.message);
  },
};

export const smsProvider: DeliveryProvider = {
  async deliver(notification: Notification): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log("SMS notification to:", notification.recipientId);
    console.log("Message:", notification.message);
  },
};

export const pushProvider: DeliveryProvider = {
  async deliver(notification: Notification): Promise<void> {
    // In production, integrate with push notification service (Firebase, OneSignal, etc.)
    console.log("Push notification to:", notification.recipientId);
    console.log("Title:", notification.title);
    console.log("Body:", notification.message);
  },
};

// ============================================================================
// Types
// ============================================================================

interface SendNotificationParams {
  recipientId: string;
  recipientType?: RecipientType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  title: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  category: NotificationCategory;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  organizationId: string;
  createdBy?: string;
}

interface SaveTemplateParams {
  id?: string;
  name: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  variables: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
  organizationId: string;
  createdBy: string;
}

interface NotificationFilters {
  status?: NotificationStatus[];
  category?: NotificationCategory[];
  channel?: NotificationChannel[];
  unreadOnly?: boolean;
}

interface EscalationParams {
  chain: EscalationLevel[];
  title: string;
  message: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  actionUrl?: string;
  actionLabel?: string;
  organizationId: string;
  createdBy: string;
  checkCondition?: () => Promise<boolean>;
}

interface EscalationLevel {
  level: number;
  recipientIds: string[];
  delayMinutes: number;
  priority?: NotificationPriority;
}

interface DeliveryProvider {
  deliver(notification: Notification): Promise<void>;
}

type EventHandler = (data: any) => void;

// ============================================================================
// Singleton Instance
// ============================================================================

export const notificationManager = new NotificationManager();

// Register default providers
notificationManager.registerProvider(NotificationChannel.IN_APP, inAppProvider);
notificationManager.registerProvider(NotificationChannel.EMAIL, emailProvider);
notificationManager.registerProvider(NotificationChannel.SMS, smsProvider);
notificationManager.registerProvider(NotificationChannel.PUSH, pushProvider);
