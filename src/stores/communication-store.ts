/**
 * Communication Store for Lithic Enterprise Healthcare Platform
 * Zustand store for real-time communication state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Message,
  Conversation,
  Channel,
  Notification,
  VideoCall,
  UserPresence,
  TypingIndicator,
  PresenceStatus,
  RealtimeEvent,
} from '@/types/communication';
import { initializeRealtimeEngine, getRealtimeEngine } from '@/lib/realtime/engine';
import { getSecureMessaging } from '@/lib/realtime/messaging';
import { getTeamChat } from '@/lib/realtime/team-chat';
import { getClinicalCollaboration } from '@/lib/realtime/clinical-collab';
import { getTelehealthManager } from '@/lib/realtime/telehealth';
import { getNotificationCenter } from '@/lib/realtime/notification-center';

interface CommunicationState {
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;

  // Messages
  messages: Map<string, Message[]>; // conversationId -> messages
  activeConversationId: string | null;

  // Conversations
  conversations: Map<string, Conversation>;

  // Channels
  channels: Map<string, Channel>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;

  // Presence
  presenceMap: Map<string, UserPresence>;
  currentUserPresence: UserPresence | null;

  // Typing indicators
  typingIndicators: Map<string, TypingIndicator[]>; // conversationId -> indicators

  // Video calls
  activeCalls: Map<string, VideoCall>;
  incomingCall: VideoCall | null;

  // Search
  searchResults: Message[];
  isSearching: boolean;

  // Actions - Connection
  initialize: (userId: string, wsUrl?: string) => Promise<void>;
  disconnect: () => void;

  // Actions - Messages
  sendMessage: (conversationId: string, content: string, type?: any) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string, conversationId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  loadMessages: (conversationId: string, limit?: number) => Promise<void>;

  // Actions - Conversations
  setActiveConversation: (conversationId: string | null) => void;
  createDirectMessage: (userId: string) => Promise<void>;
  createGroup: (name: string, participantIds: string[]) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string) => Promise<void>;
  pinConversation: (conversationId: string) => Promise<void>;

  // Actions - Channels
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  createChannel: (name: string, type: 'public' | 'private' | 'clinical') => Promise<void>;

  // Actions - Typing
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;

  // Actions - Presence
  updatePresence: (status: PresenceStatus, statusMessage?: string) => void;
  subscribeToPresence: (userIds: string[]) => void;

  // Actions - Notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;

  // Actions - Video Calls
  initiateCall: (participantIds: string[], type?: any) => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  toggleVideo: (callId: string) => void;
  toggleAudio: (callId: string) => void;

  // Actions - Search
  searchMessages: (query: string, conversationId?: string) => Promise<void>;
  clearSearch: () => void;

  // Getters
  getConversation: (conversationId: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
  getUnreadCount: (conversationId: string) => number;
  getTotalUnreadCount: () => number;
  getTypingUsers: (conversationId: string) => TypingIndicator[];
  getUserPresence: (userId: string) => UserPresence | undefined;
}

export const useCommunicationStore = create<CommunicationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        messages: new Map(),
        activeConversationId: null,
        conversations: new Map(),
        channels: new Map(),
        notifications: [],
        unreadNotificationCount: 0,
        presenceMap: new Map(),
        currentUserPresence: null,
        typingIndicators: new Map(),
        activeCalls: new Map(),
        incomingCall: null,
        searchResults: [],
        isSearching: false,

        // Initialize real-time connection
        initialize: async (userId: string, wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001') => {
          try {
            // Initialize engine
            const engine = initializeRealtimeEngine({
              url: wsUrl,
              autoConnect: true,
              reconnection: true,
              reconnectionAttempts: 10,
            });

            await engine.connect(userId);

            // Setup event listeners
            engine.on(RealtimeEvent.CONNECTED, () => {
              set({ isConnected: true, isReconnecting: false, reconnectAttempts: 0 });
            });

            engine.on(RealtimeEvent.DISCONNECTED, () => {
              set({ isConnected: false });
            });

            engine.on(RealtimeEvent.RECONNECTING, (data: any) => {
              set({ isReconnecting: true, reconnectAttempts: data.attemptNumber });
            });

            engine.on(RealtimeEvent.MESSAGE_RECEIVED, (data: { message: Message }) => {
              const { messages } = get();
              const conversationMessages = messages.get(data.message.conversationId) || [];
              conversationMessages.push(data.message);
              messages.set(data.message.conversationId, conversationMessages);
              set({ messages: new Map(messages) });

              // Update conversation
              const { conversations } = get();
              const conversation = conversations.get(data.message.conversationId);
              if (conversation) {
                conversation.lastMessage = data.message;
                conversation.unreadCount++;
                conversations.set(conversation.id, conversation);
                set({ conversations: new Map(conversations) });
              }
            });

            engine.on(RealtimeEvent.MESSAGE_UPDATED, (data: { message: Message }) => {
              const { messages } = get();
              const conversationMessages = messages.get(data.message.conversationId) || [];
              const index = conversationMessages.findIndex((m) => m.id === data.message.id);
              if (index !== -1) {
                conversationMessages[index] = data.message;
                messages.set(data.message.conversationId, conversationMessages);
                set({ messages: new Map(messages) });
              }
            });

            engine.on(RealtimeEvent.MESSAGE_DELETED, (data: { messageId: string; conversationId: string }) => {
              const { messages } = get();
              const conversationMessages = messages.get(data.conversationId) || [];
              const filtered = conversationMessages.filter((m) => m.id !== data.messageId);
              messages.set(data.conversationId, filtered);
              set({ messages: new Map(messages) });
            });

            engine.on(RealtimeEvent.TYPING_START, (data: TypingIndicator) => {
              const { typingIndicators } = get();
              const indicators = typingIndicators.get(data.conversationId) || [];
              if (!indicators.find((i) => i.userId === data.userId)) {
                indicators.push(data);
                typingIndicators.set(data.conversationId, indicators);
                set({ typingIndicators: new Map(typingIndicators) });
              }
            });

            engine.on(RealtimeEvent.TYPING_STOP, (data: { conversationId: string; userId: string }) => {
              const { typingIndicators } = get();
              const indicators = typingIndicators.get(data.conversationId) || [];
              const filtered = indicators.filter((i) => i.userId !== data.userId);
              typingIndicators.set(data.conversationId, filtered);
              set({ typingIndicators: new Map(typingIndicators) });
            });

            engine.on(RealtimeEvent.PRESENCE_UPDATE, (data: UserPresence) => {
              const { presenceMap } = get();
              presenceMap.set(data.userId, data);
              set({ presenceMap: new Map(presenceMap) });
            });

            engine.on(RealtimeEvent.CONVERSATION_CREATED, (data: { conversation: Conversation }) => {
              const { conversations } = get();
              conversations.set(data.conversation.id, data.conversation);
              set({ conversations: new Map(conversations) });
            });

            engine.on(RealtimeEvent.NOTIFICATION_RECEIVED, (data: Notification) => {
              const { notifications } = get();
              set({
                notifications: [data, ...notifications],
                unreadNotificationCount: get().unreadNotificationCount + 1,
              });
            });

            engine.on(RealtimeEvent.CALL_INCOMING, (data: { call: VideoCall }) => {
              set({ incomingCall: data.call });
            });

            engine.on(RealtimeEvent.CALL_ENDED, (data: { callId: string }) => {
              const { activeCalls } = get();
              activeCalls.delete(data.callId);
              set({ activeCalls: new Map(activeCalls), incomingCall: null });
            });

            // Initialize modules
            getSecureMessaging();
            getTeamChat();
            getClinicalCollaboration();
            getTelehealthManager();
            getNotificationCenter();

            // Set initial presence
            engine.updatePresence(PresenceStatus.ONLINE);
            set({
              currentUserPresence: {
                userId,
                status: PresenceStatus.ONLINE,
                lastSeen: new Date(),
              },
            });
          } catch (error) {
            console.error('Failed to initialize communication:', error);
            throw error;
          }
        },

        // Disconnect
        disconnect: () => {
          try {
            const engine = getRealtimeEngine();
            engine.disconnect();
            set({
              isConnected: false,
              messages: new Map(),
              conversations: new Map(),
              channels: new Map(),
              activeCalls: new Map(),
              incomingCall: null,
            });
          } catch (error) {
            console.error('Disconnect error:', error);
          }
        },

        // Send message
        sendMessage: async (conversationId: string, content: string, type?: any) => {
          const messaging = getSecureMessaging();
          await messaging.sendMessage({
            conversationId,
            content,
            type,
          });
        },

        // Edit message
        editMessage: async (messageId: string, content: string) => {
          const messaging = getSecureMessaging();
          await messaging.editMessage(messageId, content);
        },

        // Delete message
        deleteMessage: async (messageId: string) => {
          const messaging = getSecureMessaging();
          await messaging.deleteMessage(messageId);
        },

        // Mark as read
        markAsRead: async (messageId: string, conversationId: string) => {
          const messaging = getSecureMessaging();
          await messaging.markAsRead(messageId, conversationId);

          // Update local state
          const { conversations } = get();
          const conversation = conversations.get(conversationId);
          if (conversation) {
            conversation.unreadCount = 0;
            conversations.set(conversationId, conversation);
            set({ conversations: new Map(conversations) });
          }
        },

        // Add reaction
        addReaction: async (messageId: string, emoji: string) => {
          const messaging = getSecureMessaging();
          await messaging.addReaction(messageId, emoji);
        },

        // Load messages
        loadMessages: async (conversationId: string, limit = 50) => {
          // In production, fetch from API
          // For now, just ensure conversation is active
          set({ activeConversationId: conversationId });
        },

        // Set active conversation
        setActiveConversation: (conversationId: string | null) => {
          set({ activeConversationId: conversationId });
        },

        // Create direct message
        createDirectMessage: async (userId: string) => {
          const teamChat = getTeamChat();
          const conversation = await teamChat.createDirectMessage(userId);
          const { conversations } = get();
          conversations.set(conversation.id, conversation);
          set({ conversations: new Map(conversations), activeConversationId: conversation.id });
        },

        // Create group
        createGroup: async (name: string, participantIds: string[]) => {
          const teamChat = getTeamChat();
          const conversation = await teamChat.createGroup({
            name,
            participants: participantIds,
          });
          const { conversations } = get();
          conversations.set(conversation.id, conversation);
          set({ conversations: new Map(conversations), activeConversationId: conversation.id });
        },

        // Archive conversation
        archiveConversation: async (conversationId: string) => {
          const teamChat = getTeamChat();
          await teamChat.archiveConversation(conversationId);
          const { conversations } = get();
          const conversation = conversations.get(conversationId);
          if (conversation) {
            conversation.isArchived = true;
            conversations.set(conversationId, conversation);
            set({ conversations: new Map(conversations) });
          }
        },

        // Mute conversation
        muteConversation: async (conversationId: string) => {
          const teamChat = getTeamChat();
          await teamChat.muteConversation(conversationId);
          const { conversations } = get();
          const conversation = conversations.get(conversationId);
          if (conversation) {
            conversation.isMuted = true;
            conversations.set(conversationId, conversation);
            set({ conversations: new Map(conversations) });
          }
        },

        // Pin conversation
        pinConversation: async (conversationId: string) => {
          const teamChat = getTeamChat();
          await teamChat.pinConversation(conversationId);
          const { conversations } = get();
          const conversation = conversations.get(conversationId);
          if (conversation) {
            conversation.isPinned = true;
            conversations.set(conversationId, conversation);
            set({ conversations: new Map(conversations) });
          }
        },

        // Join channel
        joinChannel: async (channelId: string) => {
          const teamChat = getTeamChat();
          await teamChat.joinChannel(channelId);
        },

        // Leave channel
        leaveChannel: async (channelId: string) => {
          const teamChat = getTeamChat();
          await teamChat.leaveChannel(channelId);
          const { channels } = get();
          channels.delete(channelId);
          set({ channels: new Map(channels) });
        },

        // Create channel
        createChannel: async (name: string, type: 'public' | 'private' | 'clinical') => {
          const teamChat = getTeamChat();
          const channel = await teamChat.createChannel({ name, type });
          const { channels } = get();
          channels.set(channel.id, channel);
          set({ channels: new Map(channels) });
        },

        // Start typing
        startTyping: (conversationId: string) => {
          const messaging = getSecureMessaging();
          messaging.startTyping(conversationId);
        },

        // Stop typing
        stopTyping: (conversationId: string) => {
          const messaging = getSecureMessaging();
          messaging.stopTyping(conversationId);
        },

        // Update presence
        updatePresence: (status: PresenceStatus, statusMessage?: string) => {
          const engine = getRealtimeEngine();
          engine.updatePresence(status, statusMessage);
          const { currentUserPresence } = get();
          if (currentUserPresence) {
            set({
              currentUserPresence: {
                ...currentUserPresence,
                status,
                statusMessage,
                lastSeen: new Date(),
              },
            });
          }
        },

        // Subscribe to presence
        subscribeToPresence: (userIds: string[]) => {
          const engine = getRealtimeEngine();
          engine.subscribeToPresence(userIds);
        },

        // Mark notification as read
        markNotificationAsRead: async (notificationId: string) => {
          const notificationCenter = getNotificationCenter();
          await notificationCenter.markAsRead(notificationId);
          const { notifications } = get();
          const updated = notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          set({
            notifications: updated,
            unreadNotificationCount: updated.filter((n) => !n.isRead).length,
          });
        },

        // Mark all notifications as read
        markAllNotificationsAsRead: async () => {
          const notificationCenter = getNotificationCenter();
          await notificationCenter.markAllAsRead();
          const { notifications } = get();
          const updated = notifications.map((n) => ({ ...n, isRead: true }));
          set({ notifications: updated, unreadNotificationCount: 0 });
        },

        // Dismiss notification
        dismissNotification: async (notificationId: string) => {
          const notificationCenter = getNotificationCenter();
          await notificationCenter.dismissNotification(notificationId);
          const { notifications } = get();
          const filtered = notifications.filter((n) => n.id !== notificationId);
          set({
            notifications: filtered,
            unreadNotificationCount: filtered.filter((n) => !n.isRead).length,
          });
        },

        // Initiate call
        initiateCall: async (participantIds: string[], type?: any) => {
          const telehealth = getTelehealthManager();
          const call = await telehealth.initiateCall({ participantIds, type });
          const { activeCalls } = get();
          activeCalls.set(call.id, call);
          set({ activeCalls: new Map(activeCalls) });
        },

        // Answer call
        answerCall: async (callId: string) => {
          const telehealth = getTelehealthManager();
          await telehealth.answerCall(callId);
          set({ incomingCall: null });
        },

        // Reject call
        rejectCall: async (callId: string) => {
          const telehealth = getTelehealthManager();
          await telehealth.rejectCall(callId);
          set({ incomingCall: null });
        },

        // End call
        endCall: async (callId: string) => {
          const telehealth = getTelehealthManager();
          await telehealth.endCall(callId);
          const { activeCalls } = get();
          activeCalls.delete(callId);
          set({ activeCalls: new Map(activeCalls) });
        },

        // Toggle video
        toggleVideo: (callId: string) => {
          const telehealth = getTelehealthManager();
          telehealth.toggleVideo(callId);
        },

        // Toggle audio
        toggleAudio: (callId: string) => {
          const telehealth = getTelehealthManager();
          telehealth.toggleAudio(callId);
        },

        // Search messages
        searchMessages: async (query: string, conversationId?: string) => {
          set({ isSearching: true });
          const messaging = getSecureMessaging();
          const results = await messaging.searchMessages({
            query,
            conversationId,
          });
          set({ searchResults: results, isSearching: false });
        },

        // Clear search
        clearSearch: () => {
          set({ searchResults: [], isSearching: false });
        },

        // Getters
        getConversation: (conversationId: string) => {
          return get().conversations.get(conversationId);
        },

        getMessages: (conversationId: string) => {
          return get().messages.get(conversationId) || [];
        },

        getUnreadCount: (conversationId: string) => {
          const conversation = get().conversations.get(conversationId);
          return conversation?.unreadCount || 0;
        },

        getTotalUnreadCount: () => {
          let total = 0;
          get().conversations.forEach((conversation) => {
            if (!conversation.isMuted) {
              total += conversation.unreadCount;
            }
          });
          return total;
        },

        getTypingUsers: (conversationId: string) => {
          return get().typingIndicators.get(conversationId) || [];
        },

        getUserPresence: (userId: string) => {
          return get().presenceMap.get(userId);
        },
      }),
      {
        name: 'communication-storage',
        partialize: (state) => ({
          // Only persist necessary data
          conversations: Array.from(state.conversations.entries()),
          channels: Array.from(state.channels.entries()),
        }),
      }
    ),
    { name: 'CommunicationStore' }
  )
);
