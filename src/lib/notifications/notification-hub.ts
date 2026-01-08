/**
 * Notification Hub - Central Notification Service
 * Lithic Healthcare Platform v0.5
 *
 * Orchestrates all notification delivery across multiple channels
 * with deduplication, priority routing, and analytics tracking.
 */

import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  CreateNotificationRequest,
  SendNotificationResponse,
  NotificationRecipient,
  NotificationMetadata,
} from '@/types/notifications';
import { InAppNotificationChannel } from './channels/in-app';
import { PushNotificationChannel } from './channels/push';
import { SMSNotificationChannel } from './channels/sms';
import { EmailNotificationChannel } from './channels/email';
import { PreferenceManager } from './preference-manager';
import { PriorityRouter } from './priority-router';
import { TemplateEngine } from './templates';
import { QuietHoursManager } from './quiet-hours';
import { EscalationEngine } from './escalation';
import { NotificationAnalytics } from './analytics';
import { BatchProcessor } from './batch-processor';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export class NotificationHub extends EventEmitter {
  private redis: Redis;
  private channels: Map<NotificationChannel, any>;
  private preferenceManager: PreferenceManager;
  private priorityRouter: PriorityRouter;
  private templateEngine: TemplateEngine;
  private quietHoursManager: QuietHoursManager;
  private escalationEngine: EscalationEngine;
  private analytics: NotificationAnalytics;
  private batchProcessor: BatchProcessor;

  // Deduplication cache
  private deduplicationCache: Map<string, string> = new Map();
  private readonly DEDUP_TTL = 60 * 60 * 1000; // 1 hour

  // Rate limiting
  private rateLimitCache: Map<string, number[]> = new Map();

  constructor(redisClient?: Redis) {
    super();

    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Initialize channels
    this.channels = new Map();
    this.channels.set(NotificationChannel.IN_APP, new InAppNotificationChannel(this.redis));
    this.channels.set(NotificationChannel.PUSH, new PushNotificationChannel());
    this.channels.set(NotificationChannel.SMS, new SMSNotificationChannel());
    this.channels.set(NotificationChannel.EMAIL, new EmailNotificationChannel());

    // Initialize managers
    this.preferenceManager = new PreferenceManager(this.redis);
    this.priorityRouter = new PriorityRouter();
    this.templateEngine = new TemplateEngine();
    this.quietHoursManager = new QuietHoursManager();
    this.escalationEngine = new EscalationEngine(this);
    this.analytics = new NotificationAnalytics(this.redis);
    this.batchProcessor = new BatchProcessor(this);

    this.setupEventListeners();
  }

  /**
   * Send a notification to one or more recipients
   */
  async send(request: CreateNotificationRequest): Promise<SendNotificationResponse> {
    const notificationIds: string[] = [];
    const errors: Array<{ recipientId: string; error: string }> = [];

    try {
      // Process template if provided
      let content = {
        title: request.title,
        message: request.message,
        subtitle: request.subtitle,
      };

      if (request.templateId) {
        const template = await this.templateEngine.render(
          request.templateId,
          request.templateVariables || {}
        );
        content = { ...content, ...template };
      }

      // Send to each recipient
      for (const recipient of request.recipients) {
        try {
          const notificationId = await this.sendToRecipient(recipient, {
            ...request,
            ...content,
          });
          notificationIds.push(notificationId);
        } catch (error) {
          errors.push({
            recipientId: recipient.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: errors.length === 0,
        notificationIds,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notification to a single recipient
   */
  private async sendToRecipient(
    recipient: NotificationRecipient,
    request: CreateNotificationRequest & { subtitle?: string }
  ): Promise<string> {
    // Generate notification ID
    const notificationId = this.generateNotificationId();

    // Check deduplication
    if (request.deduplicationKey) {
      const existing = this.deduplicationCache.get(request.deduplicationKey);
      if (existing) {
        return existing; // Return existing notification ID
      }
    }

    // Get user preferences
    const preferences = await this.preferenceManager.getPreferences(
      recipient.userId,
      request.tenantId || 'default'
    );

    // Check if notifications are enabled
    if (!preferences.enabled) {
      throw new Error('Notifications disabled for user');
    }

    // Check if paused
    if (preferences.pausedUntil && new Date(preferences.pausedUntil) > new Date()) {
      throw new Error('Notifications paused for user');
    }

    // Check rate limiting
    if (!this.checkRateLimit(recipient.userId, preferences)) {
      throw new Error('Rate limit exceeded');
    }

    // Determine channels based on preferences and priority
    const channels = await this.priorityRouter.determineChannels(
      request.priority || NotificationPriority.MEDIUM,
      request.category,
      request.channels || [NotificationChannel.IN_APP],
      preferences
    );

    // Check quiet hours
    const quietHoursActive = this.quietHoursManager.isQuietHoursActive(
      preferences.quietHours,
      request.priority || NotificationPriority.MEDIUM
    );

    if (quietHoursActive) {
      // For non-critical notifications during quiet hours
      if (request.priority !== NotificationPriority.CRITICAL) {
        // Schedule for later or suppress
        return this.scheduleForLater(notificationId, recipient, request);
      }
    }

    // Create notification object
    const notification: Notification = {
      id: notificationId,
      tenantId: request.tenantId || 'default',
      recipientId: recipient.userId,
      recipientType: 'user',
      title: request.title,
      message: request.message,
      subtitle: request.subtitle,
      category: request.category,
      priority: request.priority || NotificationPriority.MEDIUM,
      channels,
      metadata: request.metadata,
      actions: request.actions,
      status: NotificationStatus.PENDING,
      deliveryStatus: {},
      groupKey: request.groupKey,
      deduplicationKey: request.deduplicationKey,
      createdAt: new Date(),
      scheduledFor: request.scheduledFor,
      expiresAt: request.expiresAt,
      templateId: request.templateId,
      templateVariables: request.templateVariables,
    };

    // Store notification
    await this.storeNotification(notification);

    // Add to deduplication cache
    if (request.deduplicationKey) {
      this.deduplicationCache.set(request.deduplicationKey, notificationId);
      setTimeout(() => {
        this.deduplicationCache.delete(request.deduplicationKey!);
      }, this.DEDUP_TTL);
    }

    // Deliver through channels
    if (request.scheduledFor && request.scheduledFor > new Date()) {
      // Schedule for later
      await this.scheduleNotification(notification);
    } else {
      // Send immediately
      await this.deliverNotification(notification);
    }

    // Set up escalation if applicable
    await this.escalationEngine.setupEscalation(notification);

    // Track analytics
    this.analytics.trackNotificationSent(notification);

    // Emit event
    this.emit('notification:sent', notification);

    return notificationId;
  }

  /**
   * Deliver notification through all configured channels
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    notification.status = NotificationStatus.SENDING;
    await this.updateNotification(notification);

    const deliveryPromises = notification.channels.map(async (channel) => {
      try {
        const channelHandler = this.channels.get(channel);
        if (!channelHandler) {
          throw new Error(`Channel ${channel} not configured`);
        }

        notification.deliveryStatus[channel] = {
          status: NotificationStatus.SENDING,
          sentAt: new Date(),
        };

        await channelHandler.send(notification);

        notification.deliveryStatus[channel] = {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        };

        this.analytics.trackChannelDelivery(notification.id, channel, true);
      } catch (error) {
        notification.deliveryStatus[channel] = {
          status: NotificationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        this.analytics.trackChannelDelivery(notification.id, channel, false, error instanceof Error ? error.message : undefined);
      }
    });

    await Promise.allSettled(deliveryPromises);

    // Update overall status
    const allFailed = notification.channels.every(
      (ch) => notification.deliveryStatus[ch]?.status === NotificationStatus.FAILED
    );
    const allSent = notification.channels.every(
      (ch) => notification.deliveryStatus[ch]?.status === NotificationStatus.SENT
    );

    notification.status = allFailed
      ? NotificationStatus.FAILED
      : allSent
      ? NotificationStatus.SENT
      : NotificationStatus.SENT; // Partial success

    await this.updateNotification(notification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    await this.updateNotification(notification);
    this.analytics.trackNotificationRead(notification);
    this.emit('notification:read', notification);

    // Cancel escalation
    await this.escalationEngine.cancelEscalation(notificationId);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<void> {
    await Promise.all(
      notificationIds.map((id) => this.markAsRead(id, userId))
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    const notifications = await this.getNotifications({
      userId,
      tenantId,
      status: [NotificationStatus.SENT, NotificationStatus.DELIVERED],
    });

    await this.markMultipleAsRead(
      notifications.map((n) => n.id),
      userId
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.redis.del(`notification:${notificationId}`);
    await this.redis.zrem(`notifications:user:${userId}`, notificationId);

    this.emit('notification:deleted', notification);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(params: {
    userId?: string;
    tenantId?: string;
    status?: NotificationStatus[];
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const { userId, tenantId, status, limit = 50, offset = 0 } = params;

    if (!userId) {
      throw new Error('userId required');
    }

    // Get notification IDs from sorted set (sorted by timestamp)
    const notificationIds = await this.redis.zrevrange(
      `notifications:user:${userId}`,
      offset,
      offset + limit - 1
    );

    // Get notification data
    const notifications: Notification[] = [];
    for (const id of notificationIds) {
      const data = await this.redis.get(`notification:${id}`);
      if (data) {
        const notification = JSON.parse(data) as Notification;

        // Filter by status if provided
        if (status && !status.includes(notification.status)) {
          continue;
        }

        // Filter by tenant if provided
        if (tenantId && notification.tenantId !== tenantId) {
          continue;
        }

        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications({
      userId,
      status: [NotificationStatus.SENT, NotificationStatus.DELIVERED],
    });

    return notifications.filter((n) => !n.readAt).length;
  }

  /**
   * Send batch notifications
   */
  async sendBatch(
    recipients: NotificationRecipient[],
    notification: Omit<CreateNotificationRequest, 'recipients'>
  ): Promise<string> {
    return this.batchProcessor.processBatch(recipients, notification);
  }

  /**
   * Helper methods
   */

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeNotification(notification: Notification): Promise<void> {
    // Store notification data
    await this.redis.set(
      `notification:${notification.id}`,
      JSON.stringify(notification),
      'EX',
      30 * 24 * 60 * 60 // 30 days
    );

    // Add to user's sorted set (sorted by timestamp)
    await this.redis.zadd(
      `notifications:user:${notification.recipientId}`,
      notification.createdAt.getTime(),
      notification.id
    );

    // Add to tenant's sorted set
    await this.redis.zadd(
      `notifications:tenant:${notification.tenantId}`,
      notification.createdAt.getTime(),
      notification.id
    );
  }

  private async updateNotification(notification: Notification): Promise<void> {
    await this.redis.set(
      `notification:${notification.id}`,
      JSON.stringify(notification),
      'KEEPTTL'
    );
  }

  private async getNotification(notificationId: string): Promise<Notification | null> {
    const data = await this.redis.get(`notification:${notificationId}`);
    return data ? JSON.parse(data) : null;
  }

  private checkRateLimit(
    userId: string,
    preferences: any
  ): boolean {
    if (!preferences.maxNotificationsPerHour) {
      return true;
    }

    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    // Get or create rate limit entry
    let timestamps = this.rateLimitCache.get(userId) || [];

    // Remove old timestamps
    timestamps = timestamps.filter((ts) => ts > hourAgo);

    // Check limit
    if (timestamps.length >= preferences.maxNotificationsPerHour) {
      return false;
    }

    // Add new timestamp
    timestamps.push(now);
    this.rateLimitCache.set(userId, timestamps);

    return true;
  }

  private async scheduleForLater(
    notificationId: string,
    recipient: NotificationRecipient,
    request: CreateNotificationRequest & { subtitle?: string }
  ): Promise<string> {
    // Schedule for next day at 8 AM
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 1);
    scheduledFor.setHours(8, 0, 0, 0);

    const notification: Notification = {
      id: notificationId,
      tenantId: request.tenantId || 'default',
      recipientId: recipient.userId,
      recipientType: 'user',
      title: request.title,
      message: request.message,
      subtitle: request.subtitle,
      category: request.category,
      priority: request.priority || NotificationPriority.MEDIUM,
      channels: request.channels || [NotificationChannel.IN_APP],
      metadata: request.metadata,
      actions: request.actions,
      status: NotificationStatus.PENDING,
      deliveryStatus: {},
      createdAt: new Date(),
      scheduledFor,
      expiresAt: request.expiresAt,
    };

    await this.storeNotification(notification);
    await this.scheduleNotification(notification);

    return notificationId;
  }

  private async scheduleNotification(notification: Notification): Promise<void> {
    if (!notification.scheduledFor) return;

    const delay = notification.scheduledFor.getTime() - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        await this.deliverNotification(notification);
      }, delay);
    }
  }

  private setupEventListeners(): void {
    // Set up periodic cleanup of expired notifications
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // Every hour
  }

  private async cleanupExpiredNotifications(): Promise<void> {
    // This would be implemented to clean up expired notifications
    // from Redis to prevent memory bloat
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let hubInstance: NotificationHub | null = null;

export function getNotificationHub(): NotificationHub {
  if (!hubInstance) {
    hubInstance = new NotificationHub();
  }
  return hubInstance;
}
