/**
 * Notification Center for Lithic Enterprise Healthcare Platform
 * Push notifications, in-app notifications, email/SMS fallback, and preference management
 */

import { getRealtimeEngine } from './engine';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  RealtimeEvent,
} from '@/types/communication';

export class NotificationCenter {
  private engine = getRealtimeEngine();
  private notifications = new Map<string, Notification>();
  private preferences: NotificationPreferences | null = null;
  private notificationQueue: Notification[] = [];
  private isDoNotDisturb = false;

  constructor() {
    this.setupNotificationListeners();
    this.loadPreferences();
    this.requestPushPermission();
  }

  /**
   * Send notification
   */
  public async sendNotification(params: {
    userId: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    icon?: string;
    avatar?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  }): Promise<Notification> {
    const {
      userId,
      type,
      priority,
      title,
      message,
      icon,
      avatar,
      actionUrl,
      metadata,
      expiresAt,
    } = params;

    const notification: Notification = {
      id: this.generateNotificationId(),
      userId,
      type,
      priority,
      title,
      message,
      icon,
      avatar,
      actionUrl,
      metadata,
      isRead: false,
      isDismissed: false,
      createdAt: new Date(),
      expiresAt,
    };

    // Check do not disturb
    if (this.shouldSuppressNotification(notification)) {
      this.queueNotification(notification);
      return notification;
    }

    // Send notification
    await this.deliverNotification(notification);

    // Store notification
    this.notifications.set(notification.id, notification);

    return notification;
  }

  /**
   * Deliver notification through appropriate channels
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    const prefs = this.preferences;

    // In-app notification
    if (prefs?.inAppEnabled !== false) {
      this.showInAppNotification(notification);
    }

    // Push notification
    if (prefs?.pushEnabled && this.isPushSupported()) {
      await this.showPushNotification(notification);
    }

    // Email fallback for high priority
    if (
      prefs?.emailEnabled &&
      (notification.priority === NotificationPriority.HIGH ||
        notification.priority === NotificationPriority.URGENT ||
        notification.priority === NotificationPriority.CRITICAL)
    ) {
      await this.sendEmailNotification(notification);
    }

    // SMS fallback for critical
    if (
      prefs?.smsEnabled &&
      notification.priority === NotificationPriority.CRITICAL
    ) {
      await this.sendSMSNotification(notification);
    }

    // Send via WebSocket
    this.engine.send('notification', notification);
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(notification: Notification): void {
    // Emit event for UI components to display
    this.engine.emit(RealtimeEvent.NOTIFICATION_RECEIVED, notification);

    // Play sound for high priority
    if (
      notification.priority === NotificationPriority.URGENT ||
      notification.priority === NotificationPriority.CRITICAL
    ) {
      this.playNotificationSound(notification.priority);
    }
  }

  /**
   * Show browser push notification
   */
  private async showPushNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: notification.id,
        requireInteraction:
          notification.priority === NotificationPriority.CRITICAL,
        vibrate: this.getVibrationPattern(notification.priority),
        data: {
          url: notification.actionUrl,
          notificationId: notification.id,
        },
        actions:
          notification.actionUrl
            ? [
                { action: 'open', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' },
              ]
            : [{ action: 'dismiss', title: 'Dismiss' }],
      });
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
        }),
      });
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    try {
      await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notification.userId,
          message: `${notification.title}: ${notification.message}`,
          priority: notification.priority,
        }),
      });
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.notifications.set(notificationId, notification);

      this.engine.send('mark_notification_read', { notificationId });
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    this.notifications.forEach((notification) => {
      notification.isRead = true;
      notification.readAt = new Date();
    });

    this.engine.send('mark_all_notifications_read', {
      timestamp: new Date(),
    });
  }

  /**
   * Dismiss notification
   */
  public async dismissNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isDismissed = true;
      this.notifications.set(notificationId, notification);

      this.engine.send('dismiss_notification', { notificationId });
      this.engine.emit(RealtimeEvent.NOTIFICATION_CLEARED, { notificationId });
    }
  }

  /**
   * Clear all notifications
   */
  public async clearAll(): Promise<void> {
    this.notifications.forEach((notification) => {
      notification.isDismissed = true;
    });

    this.engine.send('clear_all_notifications', {
      timestamp: new Date(),
    });
  }

  /**
   * Get all notifications
   */
  public getNotifications(filter?: {
    type?: NotificationType;
    isRead?: boolean;
    isDismissed?: boolean;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filter) {
      if (filter.type !== undefined) {
        notifications = notifications.filter((n) => n.type === filter.type);
      }
      if (filter.isRead !== undefined) {
        notifications = notifications.filter((n) => n.isRead === filter.isRead);
      }
      if (filter.isDismissed !== undefined) {
        notifications = notifications.filter(
          (n) => n.isDismissed === filter.isDismissed
        );
      }
    }

    // Sort by creation date (newest first)
    return notifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get unread count
   */
  public getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(
      (n) => !n.isRead && !n.isDismissed
    ).length;
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    } as NotificationPreferences;

    // Save to server
    this.engine.send('update_notification_preferences', {
      preferences: this.preferences,
    });

    // Save to local storage
    this.savePreferences();
  }

  /**
   * Get notification preferences
   */
  public getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Enable do not disturb
   */
  public enableDoNotDisturb(until?: Date): void {
    this.isDoNotDisturb = true;

    if (this.preferences) {
      this.preferences.doNotDisturb = true;
    }

    this.engine.send('enable_do_not_disturb', {
      until,
      timestamp: new Date(),
    });

    if (until) {
      const timeout = until.getTime() - Date.now();
      setTimeout(() => {
        this.disableDoNotDisturb();
      }, timeout);
    }
  }

  /**
   * Disable do not disturb
   */
  public disableDoNotDisturb(): void {
    this.isDoNotDisturb = false;

    if (this.preferences) {
      this.preferences.doNotDisturb = false;
    }

    this.engine.send('disable_do_not_disturb', {
      timestamp: new Date(),
    });

    // Process queued notifications
    this.processNotificationQueue();
  }

  /**
   * Check if notification should be suppressed
   */
  private shouldSuppressNotification(notification: Notification): boolean {
    // Never suppress critical alerts
    if (notification.priority === NotificationPriority.CRITICAL) {
      return false;
    }

    // Check do not disturb
    if (this.isDoNotDisturb) {
      return true;
    }

    // Check preferences
    if (!this.preferences) {
      return false;
    }

    if (this.preferences.doNotDisturb) {
      // Check do not disturb schedule
      if (
        this.preferences.doNotDisturbStart &&
        this.preferences.doNotDisturbEnd
      ) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMinute] =
          this.preferences.doNotDisturbStart.split(':').map(Number);
        const [endHour, endMinute] = this.preferences.doNotDisturbEnd
          .split(':')
          .map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime <= endTime) {
          return true;
        }
      } else {
        return true;
      }
    }

    // Check notification type preferences
    switch (notification.type) {
      case NotificationType.MESSAGE:
        return !this.preferences.messageNotifications;
      case NotificationType.MENTION:
        return !this.preferences.mentionNotifications;
      case NotificationType.CLINICAL_ALERT:
        return !this.preferences.clinicalAlertNotifications;
      default:
        return false;
    }
  }

  /**
   * Queue notification for later
   */
  private queueNotification(notification: Notification): void {
    this.notificationQueue.push(notification);

    // Limit queue size
    if (this.notificationQueue.length > 100) {
      this.notificationQueue.shift();
    }
  }

  /**
   * Process queued notifications
   */
  private processNotificationQueue(): void {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.deliverNotification(notification);
        this.notifications.set(notification.id, notification);
      }
    }
  }

  /**
   * Request push notification permission
   */
  private async requestPushPermission(): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Permission request error:', error);
      }
    }
  }

  /**
   * Check if push is supported
   */
  private isPushSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      Notification.permission === 'granted'
    );
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(priority: NotificationPriority): void {
    try {
      const audio = new Audio(this.getSoundFile(priority));
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error('Audio play error:', error);
      });
    } catch (error) {
      console.error('Sound error:', error);
    }
  }

  /**
   * Get sound file for priority
   */
  private getSoundFile(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return '/sounds/critical-alert.mp3';
      case NotificationPriority.URGENT:
        return '/sounds/urgent-alert.mp3';
      case NotificationPriority.HIGH:
        return '/sounds/high-priority.mp3';
      default:
        return '/sounds/notification.mp3';
    }
  }

  /**
   * Get vibration pattern for priority
   */
  private getVibrationPattern(priority: NotificationPriority): number[] {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return [200, 100, 200, 100, 200];
      case NotificationPriority.URGENT:
        return [200, 100, 200];
      case NotificationPriority.HIGH:
        return [200, 100];
      default:
        return [100];
    }
  }

  /**
   * Load preferences from local storage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  /**
   * Save preferences to local storage
   */
  private savePreferences(): void {
    try {
      if (this.preferences) {
        localStorage.setItem(
          'notification_preferences',
          JSON.stringify(this.preferences)
        );
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    this.engine.on(RealtimeEvent.NOTIFICATION_RECEIVED, (data: Notification) => {
      this.notifications.set(data.id, data);

      if (!this.shouldSuppressNotification(data)) {
        this.deliverNotification(data);
      }
    });

    // Clean up expired notifications periodically
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired notifications
   */
  private cleanupExpiredNotifications(): void {
    const now = new Date();
    this.notifications.forEach((notification, id) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    });
  }

  /**
   * Generate notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.notifications.clear();
    this.notificationQueue = [];
  }
}

// Singleton instance
let notificationCenterInstance: NotificationCenter | null = null;

/**
 * Get notification center instance
 */
export function getNotificationCenter(): NotificationCenter {
  if (!notificationCenterInstance) {
    notificationCenterInstance = new NotificationCenter();
  }
  return notificationCenterInstance;
}

/**
 * Destroy notification center instance
 */
export function destroyNotificationCenter(): void {
  if (notificationCenterInstance) {
    notificationCenterInstance.destroy();
    notificationCenterInstance = null;
  }
}
