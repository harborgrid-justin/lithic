/**
 * Team Communication Module for Lithic Enterprise Healthcare Platform
 * Team channels, direct messages, and group conversations
 */

import { getRealtimeEngine } from './engine';
import { getSecureMessaging } from './messaging';
import {
  Channel,
  ChannelMember,
  Conversation,
  ConversationType,
  ConversationParticipant,
  Message,
  RealtimeEvent,
} from '@/types/communication';

export class TeamChat {
  private engine = getRealtimeEngine();
  private messaging = getSecureMessaging();
  private channels = new Map<string, Channel>();
  private conversations = new Map<string, Conversation>();

  constructor() {
    this.setupTeamListeners();
  }

  /**
   * Create a new channel
   */
  public async createChannel(params: {
    name: string;
    description?: string;
    type: 'public' | 'private' | 'clinical';
    topic?: string;
    members?: string[];
  }): Promise<Channel> {
    const { name, description, type, topic, members = [] } = params;

    const channel: Partial<Channel> = {
      id: this.generateChannelId(),
      name,
      description,
      type,
      topic,
      members: [],
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.engine.send('create_channel', {
      channel,
      memberIds: members,
    });

    return channel as Channel;
  }

  /**
   * Join a channel
   */
  public async joinChannel(channelId: string): Promise<void> {
    this.engine.send('join_channel', { channelId });
    this.engine.joinRoom(channelId);
  }

  /**
   * Leave a channel
   */
  public async leaveChannel(channelId: string): Promise<void> {
    this.engine.send('leave_channel', { channelId });
    this.engine.leaveRoom(channelId);
    this.channels.delete(channelId);
  }

  /**
   * Update channel
   */
  public async updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, 'name' | 'description' | 'topic'>>
  ): Promise<void> {
    this.engine.send('update_channel', {
      channelId,
      updates: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Archive channel
   */
  public async archiveChannel(channelId: string): Promise<void> {
    this.engine.send('archive_channel', { channelId });
  }

  /**
   * Add member to channel
   */
  public async addChannelMember(channelId: string, userId: string): Promise<void> {
    this.engine.send('add_channel_member', {
      channelId,
      userId,
      joinedAt: new Date(),
    });
  }

  /**
   * Remove member from channel
   */
  public async removeChannelMember(channelId: string, userId: string): Promise<void> {
    this.engine.send('remove_channel_member', {
      channelId,
      userId,
    });
  }

  /**
   * Update member role
   */
  public async updateMemberRole(
    channelId: string,
    userId: string,
    role: 'owner' | 'admin' | 'moderator' | 'member'
  ): Promise<void> {
    this.engine.send('update_member_role', {
      channelId,
      userId,
      role,
    });
  }

  /**
   * Create direct message conversation
   */
  public async createDirectMessage(userId: string): Promise<Conversation> {
    const conversation: Partial<Conversation> = {
      id: this.generateConversationId(),
      type: ConversationType.DIRECT,
      participants: [],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.engine.send('create_conversation', {
      conversation,
      participantIds: [userId],
    });

    return conversation as Conversation;
  }

  /**
   * Create group conversation
   */
  public async createGroup(params: {
    name: string;
    description?: string;
    participants: string[];
    avatar?: string;
  }): Promise<Conversation> {
    const { name, description, participants, avatar } = params;

    const conversation: Partial<Conversation> = {
      id: this.generateConversationId(),
      type: ConversationType.GROUP,
      name,
      description,
      avatar,
      participants: [],
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.engine.send('create_conversation', {
      conversation,
      participantIds: participants,
    });

    return conversation as Conversation;
  }

  /**
   * Add participant to conversation
   */
  public async addParticipant(conversationId: string, userId: string): Promise<void> {
    this.engine.send('add_participant', {
      conversationId,
      userId,
      joinedAt: new Date(),
    });
  }

  /**
   * Remove participant from conversation
   */
  public async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    this.engine.send('remove_participant', {
      conversationId,
      userId,
    });
  }

  /**
   * Pin conversation
   */
  public async pinConversation(conversationId: string): Promise<void> {
    this.engine.send('pin_conversation', { conversationId });
  }

  /**
   * Unpin conversation
   */
  public async unpinConversation(conversationId: string): Promise<void> {
    this.engine.send('unpin_conversation', { conversationId });
  }

  /**
   * Mute conversation
   */
  public async muteConversation(conversationId: string): Promise<void> {
    this.engine.send('mute_conversation', { conversationId });
  }

  /**
   * Unmute conversation
   */
  public async unmuteConversation(conversationId: string): Promise<void> {
    this.engine.send('unmute_conversation', { conversationId });
  }

  /**
   * Archive conversation
   */
  public async archiveConversation(conversationId: string): Promise<void> {
    this.engine.send('archive_conversation', { conversationId });
  }

  /**
   * Unarchive conversation
   */
  public async unarchiveConversation(conversationId: string): Promise<void> {
    this.engine.send('unarchive_conversation', { conversationId });
  }

  /**
   * Send message with @mentions
   */
  public async sendMention(params: {
    conversationId: string;
    content: string;
    mentions: string[];
  }): Promise<Message> {
    const { conversationId, content, mentions } = params;

    return this.messaging.sendMessage({
      conversationId,
      content,
      mentions,
      metadata: {
        urgency: mentions.length > 0 ? 'HIGH' as any : 'NORMAL' as any,
      },
    });
  }

  /**
   * Get channel members
   */
  public async getChannelMembers(channelId: string): Promise<ChannelMember[]> {
    return new Promise((resolve) => {
      const handler = (data: { members: ChannelMember[] }) => {
        resolve(data.members);
      };

      this.engine.send('get_channel_members', { channelId });
      // In real implementation, this would be handled by the store
    });
  }

  /**
   * Search channels
   */
  public async searchChannels(query: string): Promise<Channel[]> {
    return new Promise((resolve) => {
      const handler = (data: { results: Channel[] }) => {
        resolve(data.results);
      };

      this.engine.send('search_channels', { query });
      // In real implementation, this would be handled by the store
    });
  }

  /**
   * Get conversation participants
   */
  public async getConversationParticipants(
    conversationId: string
  ): Promise<ConversationParticipant[]> {
    return new Promise((resolve) => {
      const handler = (data: { participants: ConversationParticipant[] }) => {
        resolve(data.participants);
      };

      this.engine.send('get_conversation_participants', { conversationId });
      // In real implementation, this would be handled by the store
    });
  }

  /**
   * Update conversation settings
   */
  public async updateConversationSettings(
    conversationId: string,
    settings: {
      name?: string;
      description?: string;
      avatar?: string;
    }
  ): Promise<void> {
    this.engine.send('update_conversation', {
      conversationId,
      updates: {
        ...settings,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for conversation
   */
  public getUnreadCount(conversationId: string): number {
    const conversation = this.conversations.get(conversationId);
    return conversation?.unreadCount || 0;
  }

  /**
   * Get total unread count
   */
  public getTotalUnreadCount(): number {
    let total = 0;
    this.conversations.forEach((conversation) => {
      if (!conversation.isMuted) {
        total += conversation.unreadCount;
      }
    });
    return total;
  }

  /**
   * Mark all as read
   */
  public async markAllAsRead(): Promise<void> {
    this.engine.send('mark_all_read', {
      timestamp: new Date(),
    });
  }

  /**
   * Get channel by ID
   */
  public getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get conversation by ID
   */
  public getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all channels
   */
  public getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get all conversations
   */
  public getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  /**
   * Share file in channel
   */
  public async shareFile(
    channelId: string,
    file: File,
    caption?: string
  ): Promise<Message> {
    return this.messaging.sendFile({
      conversationId: channelId,
      file,
      caption,
    });
  }

  /**
   * Create announcement in channel
   */
  public async createAnnouncement(
    channelId: string,
    content: string
  ): Promise<Message> {
    return this.messaging.sendMessage({
      conversationId: channelId,
      content,
      type: 'SYSTEM' as any,
      metadata: {
        urgency: 'HIGH' as any,
      },
    });
  }

  /**
   * Setup team event listeners
   */
  private setupTeamListeners(): void {
    // Channel events
    this.engine.on(RealtimeEvent.CONVERSATION_CREATED, (data: { conversation: Conversation }) => {
      this.conversations.set(data.conversation.id, data.conversation);
    });

    this.engine.on(RealtimeEvent.CONVERSATION_UPDATED, (data: { conversation: Conversation }) => {
      this.conversations.set(data.conversation.id, data.conversation);
    });

    this.engine.on(RealtimeEvent.CONVERSATION_DELETED, (data: { conversationId: string }) => {
      this.conversations.delete(data.conversationId);
    });

    this.engine.on(RealtimeEvent.PARTICIPANT_JOINED, (data) => {
      console.log('Participant joined:', data);
    });

    this.engine.on(RealtimeEvent.PARTICIPANT_LEFT, (data) => {
      console.log('Participant left:', data);
    });

    // Message events to update unread counts
    this.engine.on(RealtimeEvent.MESSAGE_RECEIVED, (data: { message: Message }) => {
      const conversation = this.conversations.get(data.message.conversationId);
      if (conversation && !conversation.isMuted) {
        conversation.unreadCount++;
        conversation.lastMessage = data.message;
        this.conversations.set(conversation.id, conversation);
      }
    });

    this.engine.on(RealtimeEvent.MESSAGE_READ, (data: { conversationId: string }) => {
      const conversation = this.conversations.get(data.conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
        this.conversations.set(conversation.id, conversation);
      }
    });
  }

  /**
   * Generate unique channel ID
   */
  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.channels.clear();
    this.conversations.clear();
  }
}

// Singleton instance
let teamChatInstance: TeamChat | null = null;

/**
 * Get team chat instance
 */
export function getTeamChat(): TeamChat {
  if (!teamChatInstance) {
    teamChatInstance = new TeamChat();
  }
  return teamChatInstance;
}

/**
 * Destroy team chat instance
 */
export function destroyTeamChat(): void {
  if (teamChatInstance) {
    teamChatInstance.destroy();
    teamChatInstance = null;
  }
}
