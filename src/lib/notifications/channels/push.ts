/**
 * Push Notification Channel
 * Lithic Healthcare Platform v0.5
 *
 * Handles push notification delivery via Web Push API
 */

import { Notification, NotificationStatus, PushSubscription } from '@/types/notifications';
import webpush from 'web-push';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@lithic.health',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class PushNotificationChannel {
  /**
   * Send push notification
   */
  async send(notification: Notification): Promise<void> {
    try {
      // Get user's push subscriptions
      const subscriptions = await this.getUserSubscriptions(notification.recipientId);

      if (subscriptions.length === 0) {
        throw new Error('No push subscriptions found for user');
      }

      // Prepare push payload
      const payload = this.preparePushPayload(notification);

      // Send to all subscriptions
      const sendPromises = subscriptions.map((subscription) =>
        this.sendToSubscription(subscription, payload)
      );

      const results = await Promise.allSettled(sendPromises);

      // Check if at least one succeeded
      const succeeded = results.some((r) => r.status === 'fulfilled');

      if (!succeeded) {
        throw new Error('Failed to send to any subscription');
      }

      // Update delivery status
      notification.deliveryStatus.push = {
        status: NotificationStatus.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date(),
      };
    } catch (error) {
      notification.deliveryStatus.push = {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }
  }

  /**
   * Send to a specific push subscription
   */
  private async sendToSubscription(
    subscription: PushSubscription,
    payload: string
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, payload, {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'high',
      });

      // Update last used timestamp
      await this.updateSubscriptionLastUsed(subscription);
    } catch (error: any) {
      // Handle gone subscriptions (410 status)
      if (error.statusCode === 410) {
        await this.removeSubscription(subscription);
      }
      throw error;
    }
  }

  /**
   * Prepare push notification payload
   */
  private preparePushPayload(notification: Notification): string {
    const payload = {
      title: notification.title,
      body: notification.message,
      icon: notification.icon || '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      image: notification.imageUrl,
      data: {
        notificationId: notification.id,
        category: notification.category,
        priority: notification.priority,
        url: notification.metadata?.url,
        actions: notification.actions,
      },
      tag: notification.groupKey || notification.id,
      requireInteraction: notification.priority === 'critical',
      renotify: true,
      vibrate: notification.priority === 'critical' ? [200, 100, 200] : [100],
      timestamp: notification.createdAt.getTime(),
    };

    // Add actions if available
    if (notification.actions && notification.actions.length > 0) {
      payload.data.actions = notification.actions.slice(0, 2).map((action) => ({
        action: action.type,
        title: action.label,
        icon: action.metadata?.icon,
      }));
    }

    return JSON.stringify(payload);
  }

  /**
   * Get user's push subscriptions from database/cache
   */
  private async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    // This would typically fetch from database
    // For now, return empty array
    // In production, this would query Prisma:
    // const subscriptions = await prisma.pushSubscription.findMany({
    //   where: { userId, active: true }
    // });
    return [];
  }

  /**
   * Save push subscription
   */
  async saveSubscription(
    userId: string,
    tenantId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      deviceInfo?: any;
    }
  ): Promise<void> {
    // This would typically save to database
    // In production:
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId,
    //     tenantId,
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //     deviceInfo: subscription.deviceInfo,
    //     active: true,
    //   },
    // });
  }

  /**
   * Remove push subscription
   */
  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    // This would typically remove from database
    // In production:
    // await prisma.pushSubscription.update({
    //   where: { endpoint: subscription.endpoint },
    //   data: { active: false },
    // });
  }

  /**
   * Update subscription last used timestamp
   */
  private async updateSubscriptionLastUsed(subscription: PushSubscription): Promise<void> {
    // This would typically update database
    // In production:
    // await prisma.pushSubscription.update({
    //   where: { endpoint: subscription.endpoint },
    //   data: { lastUsedAt: new Date() },
    // });
  }

  /**
   * Test push subscription
   */
  async testSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const testPayload = JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test notification from Lithic',
        icon: '/icons/notification-icon.png',
      });

      await this.sendToSubscription(subscription, testPayload);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get VAPID public key
   */
  getVAPIDPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}
