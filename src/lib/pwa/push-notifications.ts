/**
 * Push Notifications Manager for PWA
 * Handles push notification subscriptions and delivery for clinical alerts
 *
 * Features:
 * - Push subscription management
 * - Notification categories (clinical alerts, appointments, messages)
 * - Permission handling with graceful degradation
 * - Notification priority levels
 * - HIPAA-compliant notification content
 */

// ============================================================================
// Types
// ============================================================================

export type NotificationCategory =
  | 'clinical-alert'
  | 'appointment'
  | 'message'
  | 'lab-result'
  | 'medication'
  | 'task'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceId: string;
  createdAt: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  subscribed: boolean;
  subscription: PushSubscription | null;
}

// ============================================================================
// Configuration
// ============================================================================

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const NOTIFICATION_ICONS: Record<NotificationCategory, string> = {
  'clinical-alert': '/icons/notification-alert.png',
  'appointment': '/icons/notification-appointment.png',
  'message': '/icons/notification-message.png',
  'lab-result': '/icons/notification-lab.png',
  'medication': '/icons/notification-medication.png',
  'task': '/icons/notification-task.png',
  'system': '/icons/notification-system.png',
};

const NOTIFICATION_BADGES: Record<NotificationPriority, string> = {
  low: '/icons/badge-low.png',
  normal: '/icons/badge-normal.png',
  high: '/icons/badge-high.png',
  critical: '/icons/badge-critical.png',
};

// ============================================================================
// Push Notification Manager Class
// ============================================================================

class PushNotificationManager {
  private subscription: PushSubscription | null = null;
  private permissionCallbacks: Set<(permission: NotificationPermission) => void> = new Set();

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Get current notification permission state
   */
  async getPermissionState(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) {
      return {
        permission: 'denied',
        supported: false,
        subscribed: false,
        subscription: null,
      };
    }

    const permission = Notification.permission;
    const subscription = await this.getSubscription();

    return {
      permission,
      supported: true,
      subscribed: subscription !== null,
      subscription,
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] Not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PushNotifications] Permission:', permission);

      // Notify listeners
      this.permissionCallbacks.forEach((callback) => callback(permission));

      return permission;
    } catch (error) {
      console.error('[PushNotifications] Failed to request permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] Not supported');
      return null;
    }

    try {
      // Check permission
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          return null;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('[PushNotifications] Already subscribed');
        this.subscription = subscription;
      } else {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('[PushNotifications] New subscription created');
        this.subscription = subscription;
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);

      return subscription;
    } catch (error) {
      console.error('[PushNotifications] Failed to subscribe:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const subscription = await this.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify server
        await this.removeSubscriptionFromServer(subscription);

        this.subscription = null;
        console.log('[PushNotifications] Unsubscribed');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PushNotifications] Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    if (this.subscription) {
      return this.subscription;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('[PushNotifications] Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Show local notification (without push)
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      console.warn('[PushNotifications] Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[PushNotifications] Permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || NOTIFICATION_ICONS[payload.category],
        badge: payload.badge || NOTIFICATION_BADGES[payload.priority],
        image: payload.image,
        data: {
          ...payload.data,
          category: payload.category,
          priority: payload.priority,
        },
        tag: payload.tag || payload.category,
        requireInteraction: payload.requireInteraction || payload.priority === 'critical',
        silent: payload.silent || false,
        vibrate: payload.vibrate || this.getVibrationPattern(payload.priority),
        actions: payload.actions,
      };

      await registration.showNotification(payload.title, options);

      console.log('[PushNotifications] Notification shown:', payload.title);
    } catch (error) {
      console.error('[PushNotifications] Failed to show notification:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscription,
    userId: string
  ): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const subscriptionData = this.subscriptionToJSON(subscription);

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subscriptionData,
          userId,
          deviceId,
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[PushNotifications] Subscription saved to server');
    } catch (error) {
      console.error('[PushNotifications] Failed to save subscription:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = this.subscriptionToJSON(subscription);

      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[PushNotifications] Subscription removed from server');
    } catch (error) {
      console.error('[PushNotifications] Failed to remove subscription:', error);
    }
  }

  /**
   * Convert subscription to JSON format
   */
  private subscriptionToJSON(subscription: PushSubscription): PushSubscriptionData {
    const json = subscription.toJSON();

    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      },
      userId: '',
      deviceId: '',
      createdAt: Date.now(),
    };
  }

  /**
   * Get or create device ID
   */
  private async getDeviceId(): Promise<string> {
    const storageKey = 'lithic-device-id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get vibration pattern based on priority
   */
  private getVibrationPattern(priority: NotificationPriority): number[] {
    switch (priority) {
      case 'critical':
        return [200, 100, 200, 100, 200];
      case 'high':
        return [200, 100, 200];
      case 'normal':
        return [200];
      case 'low':
        return [];
      default:
        return [200];
    }
  }

  /**
   * Add permission change listener
   */
  onPermissionChange(callback: (permission: NotificationPermission) => void): () => void {
    this.permissionCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.permissionCallbacks.delete(callback);
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const pushNotifications = new PushNotificationManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Send clinical alert notification
 */
export async function sendClinicalAlert(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await pushNotifications.showNotification({
    title,
    body,
    category: 'clinical-alert',
    priority: 'critical',
    requireInteraction: true,
    data,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

/**
 * Send appointment reminder notification
 */
export async function sendAppointmentReminder(
  title: string,
  body: string,
  appointmentId: string
): Promise<void> {
  await pushNotifications.showNotification({
    title,
    body,
    category: 'appointment',
    priority: 'normal',
    data: {
      appointmentId,
      url: `/scheduling/appointments/${appointmentId}`,
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

/**
 * Send lab result notification
 */
export async function sendLabResultNotification(
  title: string,
  body: string,
  resultId: string,
  isCritical: boolean = false
): Promise<void> {
  await pushNotifications.showNotification({
    title,
    body,
    category: 'lab-result',
    priority: isCritical ? 'critical' : 'high',
    requireInteraction: isCritical,
    data: {
      resultId,
      url: `/laboratory/results/${resultId}`,
    },
    actions: [
      { action: 'view', title: 'View Result' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  title: string,
  body: string,
  conversationId: string
): Promise<void> {
  await pushNotifications.showNotification({
    title,
    body,
    category: 'message',
    priority: 'normal',
    data: {
      conversationId,
      url: `/communication/conversations/${conversationId}`,
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'reply', title: 'Reply' },
    ],
  });
}

/**
 * Send medication reminder notification
 */
export async function sendMedicationReminder(
  medicationName: string,
  dosage: string,
  medicationId: string
): Promise<void> {
  await pushNotifications.showNotification({
    title: 'Medication Reminder',
    body: `Time to take ${medicationName} - ${dosage}`,
    category: 'medication',
    priority: 'high',
    requireInteraction: true,
    data: {
      medicationId,
      url: `/clinical/medications/${medicationId}`,
    },
    actions: [
      { action: 'taken', title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze' },
    ],
  });
}

/**
 * Test notification (for testing push setup)
 */
export async function sendTestNotification(): Promise<void> {
  await pushNotifications.showNotification({
    title: 'Test Notification',
    body: 'This is a test notification from Lithic Healthcare',
    category: 'system',
    priority: 'low',
    data: {
      test: true,
    },
  });
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return (
    pushNotifications.isSupported() &&
    Notification.permission === 'granted'
  );
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<{
  enabled: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  categories: Record<NotificationCategory, boolean>;
}> {
  const state = await pushNotifications.getPermissionState();

  // Get category preferences from localStorage
  const categories: Record<NotificationCategory, boolean> = {
    'clinical-alert': true,
    'appointment': true,
    'message': true,
    'lab-result': true,
    'medication': true,
    'task': true,
    'system': false,
  };

  const savedPreferences = localStorage.getItem('notification-categories');
  if (savedPreferences) {
    Object.assign(categories, JSON.parse(savedPreferences));
  }

  return {
    enabled: state.permission === 'granted',
    permission: state.permission,
    subscribed: state.subscribed,
    categories,
  };
}

/**
 * Update notification category preferences
 */
export function updateCategoryPreferences(
  categories: Partial<Record<NotificationCategory, boolean>>
): void {
  const current = localStorage.getItem('notification-categories');
  const updated = current ? { ...JSON.parse(current), ...categories } : categories;
  localStorage.setItem('notification-categories', JSON.stringify(updated));
}

/**
 * Check if category is enabled
 */
export function isCategoryEnabled(category: NotificationCategory): boolean {
  const saved = localStorage.getItem('notification-categories');
  if (saved) {
    const preferences = JSON.parse(saved);
    return preferences[category] !== false;
  }
  return true; // Default to enabled
}
