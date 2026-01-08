/**
 * Comprehensive Notification System Types
 * Lithic Healthcare Platform v0.5
 *
 * Defines all types for the unified notification hub including
 * channels, preferences, templates, analytics, and escalation.
 */

import { z } from 'zod';

// ============================================================================
// Core Notification Types
// ============================================================================

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationPriority {
  CRITICAL = 'critical',    // Immediate delivery, bypass DND
  HIGH = 'high',           // High priority, respect limited DND
  MEDIUM = 'medium',       // Normal priority
  LOW = 'low',            // Low priority, can be batched
}

export enum NotificationCategory {
  CLINICAL_ALERT = 'clinical_alert',
  APPOINTMENT = 'appointment',
  LAB_RESULT = 'lab_result',
  MEDICATION = 'medication',
  MESSAGE = 'message',
  SYSTEM = 'system',
  BILLING = 'billing',
  DOCUMENT = 'document',
  TASK = 'task',
  WORKFLOW = 'workflow',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired',
  SUPPRESSED = 'suppressed',
}

export enum NotificationAction {
  VIEW = 'view',
  APPROVE = 'approve',
  REJECT = 'reject',
  RESPOND = 'respond',
  SCHEDULE = 'schedule',
  ACKNOWLEDGE = 'acknowledge',
  DISMISS = 'dismiss',
}

// ============================================================================
// Notification Interfaces
// ============================================================================

export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  deviceTokens?: string[];
  preferredChannels?: NotificationChannel[];
}

export interface NotificationMetadata {
  patientId?: string;
  appointmentId?: string;
  orderId?: string;
  taskId?: string;
  documentId?: string;
  workflowId?: string;
  organizationId?: string;
  departmentId?: string;
  [key: string]: any;
}

export interface NotificationAction {
  type: NotificationAction;
  label: string;
  url?: string;
  handler?: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  tenantId: string;

  // Recipient
  recipientId: string;
  recipientType: 'user' | 'group' | 'role';

  // Content
  title: string;
  message: string;
  subtitle?: string;
  icon?: string;
  imageUrl?: string;

  // Classification
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];

  // Metadata
  metadata?: NotificationMetadata;
  actions?: NotificationAction[];

  // Status
  status: NotificationStatus;
  deliveryStatus: {
    [key in NotificationChannel]?: {
      status: NotificationStatus;
      sentAt?: Date;
      deliveredAt?: Date;
      readAt?: Date;
      error?: string;
    };
  };

  // Grouping and deduplication
  groupKey?: string;
  deduplicationKey?: string;

  // Lifecycle
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  readAt?: Date;
  dismissedAt?: Date;

  // Template
  templateId?: string;
  templateVariables?: Record<string, any>;
}

// ============================================================================
// Notification Preferences
// ============================================================================

export interface ChannelPreference {
  enabled: boolean;
  priority?: NotificationPriority;
  categories?: NotificationCategory[];
  excludeCategories?: NotificationCategory[];
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
  days: number[];    // 0-6, Sunday = 0
  allowCritical: boolean;
}

export interface NotificationPreferences {
  userId: string;
  tenantId: string;

  // Global settings
  enabled: boolean;
  pausedUntil?: Date;

  // Channel preferences
  channels: {
    [key in NotificationChannel]: ChannelPreference;
  };

  // Category preferences (override channel settings)
  categories: {
    [key in NotificationCategory]?: {
      enabled: boolean;
      channels: NotificationChannel[];
      priority?: NotificationPriority;
    };
  };

  // Quiet hours
  quietHours: QuietHours;

  // Batching
  batchingEnabled: boolean;
  batchInterval?: number; // minutes
  batchCategories?: NotificationCategory[];

  // Rate limiting
  maxNotificationsPerHour?: number;
  maxNotificationsPerDay?: number;

  // Digest
  dailyDigestEnabled: boolean;
  dailyDigestTime?: string; // HH:mm
  weeklyDigestEnabled: boolean;
  weeklyDigestDay?: number; // 0-6

  updatedAt: Date;
}

// ============================================================================
// Notification Templates
// ============================================================================

export interface NotificationTemplate {
  id: string;
  tenantId: string;

  // Identification
  name: string;
  description?: string;
  category: NotificationCategory;

  // Content templates
  templates: {
    [key in NotificationChannel]?: {
      subject?: string;      // For email
      title?: string;        // For push/in-app
      message: string;
      htmlBody?: string;     // For email
      actions?: NotificationAction[];
    };
  };

  // Configuration
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];

  // Variables and validation
  requiredVariables: string[];
  optionalVariables?: string[];
  variableSchema?: Record<string, any>;

  // Lifecycle
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Escalation Rules
// ============================================================================

export interface EscalationRule {
  id: string;
  tenantId: string;

  // Identification
  name: string;
  description?: string;

  // Conditions
  conditions: {
    categories?: NotificationCategory[];
    priorities?: NotificationPriority[];
    metadata?: Record<string, any>;
  };

  // Escalation steps
  steps: EscalationStep[];

  // Configuration
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationStep {
  order: number;
  delayMinutes: number;

  // Escalation action
  action: 'resend' | 'add_channel' | 'notify_supervisor' | 'page';

  // Recipients
  recipientIds?: string[];
  recipientRoles?: string[];

  // Channels
  channels?: NotificationChannel[];

  // Conditions
  conditions?: {
    notReadAfterMinutes?: number;
    notAcknowledgedAfterMinutes?: number;
    status?: NotificationStatus[];
  };
}

// ============================================================================
// Analytics and Tracking
// ============================================================================

export interface NotificationAnalytics {
  id: string;
  notificationId: string;
  tenantId: string;

  // Delivery metrics
  sent: number;
  delivered: number;
  failed: number;

  // Engagement metrics
  opened: number;
  clicked: number;
  dismissed: number;
  actioned: number;

  // Timing metrics
  avgDeliveryTime?: number; // milliseconds
  avgReadTime?: number;     // milliseconds from delivery

  // Channel breakdown
  channelMetrics: {
    [key in NotificationChannel]?: {
      sent: number;
      delivered: number;
      failed: number;
      opened: number;
      clicked: number;
    };
  };

  // Events
  events: NotificationEvent[];

  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'actioned' | 'failed';
  channel: NotificationChannel;
  timestamp: Date;
  metadata?: Record<string, any>;
  error?: string;
}

// ============================================================================
// Batch Processing
// ============================================================================

export interface NotificationBatch {
  id: string;
  tenantId: string;

  // Batch info
  recipientIds: string[];
  notificationIds: string[];

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100

  // Results
  successful: number;
  failed: number;
  errors?: Array<{
    recipientId: string;
    notificationId: string;
    error: string;
  }>;

  // Timing
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;

  createdAt: Date;
}

// ============================================================================
// WebSocket Events
// ============================================================================

export interface NotificationSocketEvent {
  type: 'notification:new' | 'notification:updated' | 'notification:read' | 'notification:deleted';
  data: Notification | Partial<Notification>;
  timestamp: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateNotificationRequest {
  recipients: NotificationRecipient[];
  title: string;
  message: string;
  subtitle?: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  metadata?: NotificationMetadata;
  actions?: NotificationAction[];
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
  groupKey?: string;
  deduplicationKey?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationIds: string[];
  errors?: Array<{
    recipientId: string;
    error: string;
  }>;
}

export interface NotificationListQuery {
  userId?: string;
  tenantId?: string;
  status?: NotificationStatus[];
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byChannel: Record<NotificationChannel, number>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

// ============================================================================
// Push Subscription
// ============================================================================

export interface PushSubscription {
  userId: string;
  tenantId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: {
    userAgent: string;
    platform: string;
    browser: string;
  };
  active: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const NotificationRecipientSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  deviceTokens: z.array(z.string()).optional(),
  preferredChannels: z.array(z.nativeEnum(NotificationChannel)).optional(),
});

export const CreateNotificationSchema = z.object({
  recipients: z.array(NotificationRecipientSchema),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  subtitle: z.string().max(200).optional(),
  category: z.nativeEnum(NotificationCategory),
  priority: z.nativeEnum(NotificationPriority).optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).optional(),
  metadata: z.record(z.any()).optional(),
  actions: z.array(z.object({
    type: z.nativeEnum(NotificationAction),
    label: z.string(),
    url: z.string().optional(),
    handler: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })).optional(),
  templateId: z.string().optional(),
  templateVariables: z.record(z.any()).optional(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  groupKey: z.string().optional(),
  deduplicationKey: z.string().optional(),
});

export const UpdatePreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  pausedUntil: z.date().optional(),
  channels: z.record(z.object({
    enabled: z.boolean(),
    priority: z.nativeEnum(NotificationPriority).optional(),
    categories: z.array(z.nativeEnum(NotificationCategory)).optional(),
    excludeCategories: z.array(z.nativeEnum(NotificationCategory)).optional(),
  })).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string(),
    days: z.array(z.number().min(0).max(6)),
    allowCritical: z.boolean(),
  }).optional(),
  batchingEnabled: z.boolean().optional(),
  batchInterval: z.number().positive().optional(),
  dailyDigestEnabled: z.boolean().optional(),
  dailyDigestTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    browser: z.string(),
  }).optional(),
});

// ============================================================================
// Utility Types
// ============================================================================

export type NotificationFilter = {
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  channels?: NotificationChannel[];
  status?: NotificationStatus[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

export type NotificationGrouping = {
  groupBy: 'category' | 'priority' | 'date' | 'sender';
  notifications: Notification[];
};

export type NotificationSummary = {
  category: NotificationCategory;
  count: number;
  unreadCount: number;
  latestNotification?: Notification;
  priority: NotificationPriority;
};
