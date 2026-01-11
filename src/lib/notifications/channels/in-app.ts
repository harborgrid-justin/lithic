/**
 * In-App Notification Channel
 * Lithic Healthcare Platform v0.5
 *
 * Handles in-app notification delivery via WebSocket and Redis pub/sub
 */

import { Notification, NotificationStatus } from '@/types/notifications';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export class InAppNotificationChannel extends EventEmitter {
  private redis: Redis;
  private subscriber: Redis;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.subscriber = redis.duplicate();
    this.setupSubscriber();
  }

  /**
   * Send in-app notification
   */
  async send(notification: Notification): Promise<void> {
    try {
      // Store in Redis for persistence
      await this.storeInApp(notification);

      // Publish to user's channel for real-time delivery
      await this.publishToUser(notification);

      // Update delivery status
      notification.deliveryStatus.in_app = {
        status: NotificationStatus.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date(),
      };
    } catch (error) {
      notification.deliveryStatus.in_app = {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  /**
   * Store notification in Redis for later retrieval
   */
  private async storeInApp(notification: Notification): Promise<void> {
    const key = `in_app:${notification.recipientId}`;

    // Add to user's in-app notifications list
    await this.redis.zadd(
      key,
      notification.createdAt.getTime(),
      notification.id
    );

    // Keep only last 1000 notifications per user
    await this.redis.zremrangebyrank(key, 0, -1001);

    // Set expiry on the sorted set (30 days)
    await this.redis.expire(key, 30 * 24 * 60 * 60);
  }

  /**
   * Publish notification to user's real-time channel
   */
  private async publishToUser(notification: Notification): Promise<void> {
    const channel = `notifications:${notification.recipientId}`;

    const message = JSON.stringify({
      type: 'notification:new',
      data: notification,
      timestamp: new Date(),
    });

    await this.redis.publish(channel, message);
  }

  /**
   * Get in-app notifications for a user
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const key = `in_app:${userId}`;

    // Get notification IDs
    const notificationIds = await this.redis.zrevrange(
      key,
      offset,
      offset + limit - 1
    );

    // Get notification data
    const notifications: Notification[] = [];
    for (const id of notificationIds) {
      const data = await this.redis.get(`notification:${id}`);
      if (data) {
        notifications.push(JSON.parse(data));
      }
    }

    return notifications;
  }

  /**
   * Get unread in-app notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId, 1000);
    return notifications.filter((n) => !n.readAt).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId);

    if (!notification || notification.recipientId !== userId) {
      throw new Error('Notification not found or unauthorized');
    }

    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;

    await this.redis.set(
      `notification:${notificationId}`,
      JSON.stringify(notification),
      'KEEPTTL'
    );

    // Publish update
    await this.publishToUser(notification);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const key = `in_app:${userId}`;
    await this.redis.zrem(key, notificationId);

    // Publish deletion event
    const channel = `notifications:${userId}`;
    const message = JSON.stringify({
      type: 'notification:deleted',
      data: { id: notificationId },
      timestamp: new Date(),
    });

    await this.redis.publish(channel, message);
  }

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string): Promise<void> {
    const key = `in_app:${userId}`;
    await this.redis.del(key);
  }

  /**
   * Subscribe to user's notification channel
   */
  async subscribe(userId: string, callback: (notification: any) => void): Promise<void> {
    const channel = `notifications:${userId}`;

    this.subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error('Failed to subscribe:', err);
      }
    });

    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('Failed to parse notification message:', error);
        }
      }
    });
  }

  /**
   * Unsubscribe from user's notification channel
   */
  async unsubscribe(userId: string): Promise<void> {
    const channel = `notifications:${userId}`;
    await this.subscriber.unsubscribe(channel);
  }

  /**
   * Get notification by ID
   */
  private async getNotification(notificationId: string): Promise<Notification | null> {
    const data = await this.redis.get(`notification:${notificationId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Setup subscriber
   */
  private setupSubscriber(): void {
    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });

    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected');
    });
  }

  /**
   * Cleanup
   */
  async close(): Promise<void> {
    await this.subscriber.quit();
  }
}
