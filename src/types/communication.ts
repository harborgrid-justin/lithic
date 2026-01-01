/**
 * Communication Types for Lithic Enterprise Healthcare Platform
 * Complete type definitions for real-time communication, messaging, and telehealth
 */

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  SYSTEM = 'SYSTEM',
  CLINICAL = 'CLINICAL',
  URGENT = 'URGENT',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
  CLINICAL_TEAM = 'CLINICAL_TEAM',
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  OFFLINE = 'OFFLINE',
  IN_CALL = 'IN_CALL',
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  MENTION = 'MENTION',
  CLINICAL_ALERT = 'CLINICAL_ALERT',
  TASK = 'TASK',
  APPOINTMENT = 'APPOINTMENT',
  SYSTEM = 'SYSTEM',
  URGENT = 'URGENT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum CallStatus {
  INITIATING = 'INITIATING',
  RINGING = 'RINGING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ON_HOLD = 'ON_HOLD',
  ENDED = 'ENDED',
  FAILED = 'FAILED',
  MISSED = 'MISSED',
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  SCREEN_SHARE = 'SCREEN_SHARE',
}

// User Presence
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  statusMessage?: string;
  currentActivity?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  mentions?: string[];
  threadId?: string;
  replyToId?: string;
  status: MessageStatus;
  encrypted: boolean;
  encryptionKey?: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  readBy: MessageReadReceipt[];
  reactions?: MessageReaction[];
}

export interface MessageMetadata {
  clinicalContext?: ClinicalContext;
  patientId?: string;
  encounterId?: string;
  urgency?: NotificationPriority;
  expiresAt?: Date;
  [key: string]: any;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'document';
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface MessageReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
}

export interface MessageReaction {
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

export interface ClinicalContext {
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  careTeamId?: string;
  urgency?: NotificationPriority;
  category?: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  metadata?: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  presence?: UserPresence;
}

export interface ConversationMetadata {
  clinicalTeamId?: string;
  departmentId?: string;
  specialty?: string;
  patientContext?: string;
  [key: string]: any;
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'clinical';
  topic?: string;
  avatar?: string;
  members: ChannelMember[];
  messageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  notificationsEnabled: boolean;
}

// Typing Indicator
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  startedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  avatar?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  messageNotifications: boolean;
  mentionNotifications: boolean;
  clinicalAlertNotifications: boolean;
  mutedConversations: string[];
  mutedChannels: string[];
}

// Video/Telehealth Types
export interface VideoCall {
  id: string;
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  initiatorName: string;
  participants: CallParticipant[];
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingConsent?: RecordingConsent[];
  virtualRoom?: VirtualRoom;
  quality?: CallQuality;
  metadata?: CallMetadata;
}

export interface CallParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'host' | 'participant';
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RecordingConsent {
  userId: string;
  userName: string;
  consented: boolean;
  consentedAt: Date;
}

export interface VirtualRoom {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  waitingRoomEnabled: boolean;
  waitingRoomParticipants: WaitingRoomParticipant[];
  requiresApproval: boolean;
  password?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

export interface WaitingRoomParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: Date;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CallQuality {
  audioQuality: number; // 0-5
  videoQuality: number; // 0-5
  connectionLatency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  bandwidth: number; // kbps
  lastUpdated: Date;
}

export interface CallMetadata {
  patientId?: string;
  encounterId?: string;
  appointmentId?: string;
  visitType?: string;
  specialty?: string;
  isEmergency?: boolean;
  [key: string]: any;
}

// Real-time Events
export enum RealtimeEvent {
  // Connection
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',

  // Presence
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
  USER_ONLINE = 'USER_ONLINE',
  USER_OFFLINE = 'USER_OFFLINE',

  // Messages
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  MESSAGE_UPDATED = 'MESSAGE_UPDATED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  MESSAGE_READ = 'MESSAGE_READ',
  MESSAGE_REACTION = 'MESSAGE_REACTION',

  // Typing
  TYPING_START = 'TYPING_START',
  TYPING_STOP = 'TYPING_STOP',

  // Conversations
  CONVERSATION_CREATED = 'CONVERSATION_CREATED',
  CONVERSATION_UPDATED = 'CONVERSATION_UPDATED',
  CONVERSATION_DELETED = 'CONVERSATION_DELETED',
  PARTICIPANT_JOINED = 'PARTICIPANT_JOINED',
  PARTICIPANT_LEFT = 'PARTICIPANT_LEFT',

  // Notifications
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  NOTIFICATION_CLEARED = 'NOTIFICATION_CLEARED',

  // Calls
  CALL_INITIATED = 'CALL_INITIATED',
  CALL_INCOMING = 'CALL_INCOMING',
  CALL_ACCEPTED = 'CALL_ACCEPTED',
  CALL_REJECTED = 'CALL_REJECTED',
  CALL_ENDED = 'CALL_ENDED',
  PARTICIPANT_JOINED_CALL = 'PARTICIPANT_JOINED_CALL',
  PARTICIPANT_LEFT_CALL = 'PARTICIPANT_LEFT_CALL',
  CALL_QUALITY_UPDATE = 'CALL_QUALITY_UPDATE',
}

export interface RealtimeEventPayload<T = any> {
  event: RealtimeEvent;
  data: T;
  timestamp: Date;
  userId?: string;
}

// WebSocket Types
export interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

export interface SocketConnection {
  id: string;
  userId: string;
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
}

// Search Types
export interface MessageSearchQuery {
  query: string;
  conversationId?: string;
  userId?: string;
  type?: MessageType;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  limit?: number;
  offset?: number;
}

export interface MessageSearchResult {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

// Clinical Collaboration Types
export interface CareTeamMessage {
  id: string;
  careTeamId: string;
  patientId: string;
  patientName: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: 'update' | 'handoff' | 'alert' | 'consult';
  priority: NotificationPriority;
  subject: string;
  content: string;
  attachments?: MessageAttachment[];
  acknowledgments: CareTeamAcknowledgment[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface CareTeamAcknowledgment {
  userId: string;
  userName: string;
  userRole: string;
  acknowledgedAt: Date;
  note?: string;
}

export interface HandoffCommunication {
  id: string;
  patientId: string;
  patientName: string;
  fromProviderId: string;
  fromProviderName: string;
  toProviderId: string;
  toProviderName: string;
  type: 'shift' | 'transfer' | 'consult';
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  summary: string;
  clinicalContext: string;
  actionItems: HandoffActionItem[];
  acceptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface HandoffActionItem {
  id: string;
  description: string;
  priority: NotificationPriority;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

// File Upload Types
export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  uploaded: number;
  total: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Export all types
export type {
  Message,
  Conversation,
  Channel,
  Notification,
  VideoCall,
  UserPresence,
};
