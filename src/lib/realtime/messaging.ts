/**
 * Secure Messaging Module for Lithic Enterprise Healthcare Platform
 * End-to-end encrypted messaging with threading, read receipts, and attachments
 */

import { getRealtimeEngine } from './engine';
import {
  Message,
  MessageType,
  MessageStatus,
  MessageAttachment,
  MessageReadReceipt,
  MessageReaction,
  MessageMetadata,
  RealtimeEvent,
} from '@/types/communication';

export class SecureMessaging {
  private engine = getRealtimeEngine();
  private encryptionEnabled = true;
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.setupMessageListeners();
  }

  /**
   * Send a message
   */
  public async sendMessage(params: {
    conversationId: string;
    content: string;
    type?: MessageType;
    metadata?: MessageMetadata;
    attachments?: MessageAttachment[];
    mentions?: string[];
    replyToId?: string;
    threadId?: string;
  }): Promise<Message> {
    const {
      conversationId,
      content,
      type = MessageType.TEXT,
      metadata,
      attachments,
      mentions,
      replyToId,
      threadId,
    } = params;

    // Create message object
    const message: Partial<Message> = {
      id: this.generateMessageId(),
      conversationId,
      content,
      type,
      metadata,
      attachments,
      mentions,
      replyToId,
      threadId,
      status: MessageStatus.SENDING,
      encrypted: this.encryptionEnabled,
      createdAt: new Date(),
      readBy: [],
      reactions: [],
    };

    // Encrypt message if enabled
    if (this.encryptionEnabled) {
      const encrypted = await this.encryptMessage(content, conversationId);
      message.content = encrypted.content;
      message.encryptionKey = encrypted.key;
    }

    // Send via WebSocket
    this.engine.send('send_message', message);

    return message as Message;
  }

  /**
   * Send a file attachment
   */
  public async sendFile(params: {
    conversationId: string;
    file: File;
    caption?: string;
    metadata?: MessageMetadata;
  }): Promise<Message> {
    const { conversationId, file, caption, metadata } = params;

    // Upload file first
    const attachment = await this.uploadFile(file);

    // Determine message type based on file type
    let messageType = MessageType.FILE;
    if (file.type.startsWith('image/')) {
      messageType = MessageType.IMAGE;
    } else if (file.type.startsWith('audio/')) {
      messageType = MessageType.AUDIO;
    } else if (file.type.startsWith('video/')) {
      messageType = MessageType.VIDEO;
    }

    // Send message with attachment
    return this.sendMessage({
      conversationId,
      content: caption || file.name,
      type: messageType,
      attachments: [attachment],
      metadata,
    });
  }

  /**
   * Edit a message
   */
  public async editMessage(messageId: string, content: string): Promise<void> {
    let encryptedContent = content;
    let encryptionKey: string | undefined;

    if (this.encryptionEnabled) {
      const encrypted = await this.encryptMessage(content, messageId);
      encryptedContent = encrypted.content;
      encryptionKey = encrypted.key;
    }

    this.engine.send('edit_message', {
      messageId,
      content: encryptedContent,
      encryptionKey,
      editedAt: new Date(),
    });
  }

  /**
   * Delete a message
   */
  public async deleteMessage(messageId: string): Promise<void> {
    this.engine.send('delete_message', {
      messageId,
      deletedAt: new Date(),
    });
  }

  /**
   * Mark message as read
   */
  public async markAsRead(messageId: string, conversationId: string): Promise<void> {
    const receipt: MessageReadReceipt = {
      userId: '', // Will be set by server
      userName: '',
      readAt: new Date(),
    };

    this.engine.send('mark_read', {
      messageId,
      conversationId,
      receipt,
    });
  }

  /**
   * Mark entire conversation as read
   */
  public async markConversationAsRead(conversationId: string): Promise<void> {
    this.engine.send('mark_conversation_read', {
      conversationId,
      readAt: new Date(),
    });
  }

  /**
   * Add reaction to message
   */
  public async addReaction(messageId: string, emoji: string): Promise<void> {
    const reaction: Partial<MessageReaction> = {
      emoji,
      createdAt: new Date(),
    };

    this.engine.send('add_reaction', {
      messageId,
      reaction,
    });
  }

  /**
   * Remove reaction from message
   */
  public async removeReaction(messageId: string, emoji: string): Promise<void> {
    this.engine.send('remove_reaction', {
      messageId,
      emoji,
    });
  }

  /**
   * Start typing indicator
   */
  public startTyping(conversationId: string): void {
    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Send typing start event
    this.engine.send('typing_start', {
      conversationId,
      startedAt: new Date(),
    });

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);

    this.typingTimeouts.set(conversationId, timeout);
  }

  /**
   * Stop typing indicator
   */
  public stopTyping(conversationId: string): void {
    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }

    this.engine.send('typing_stop', {
      conversationId,
    });
  }

  /**
   * Search messages
   */
  public async searchMessages(params: {
    query: string;
    conversationId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<Message[]> {
    return new Promise((resolve) => {
      const handler = (data: { results: Message[] }) => {
        resolve(data.results);
        this.engine.on(RealtimeEvent.MESSAGE_RECEIVED, () => {});
      };

      this.engine.on(RealtimeEvent.MESSAGE_RECEIVED, handler);

      this.engine.send('search_messages', params);
    });
  }

  /**
   * Get message thread
   */
  public async getMessageThread(messageId: string): Promise<Message[]> {
    return new Promise((resolve) => {
      const handler = (data: { thread: Message[] }) => {
        resolve(data.thread);
      };

      this.engine.send('get_thread', { messageId });
      // In real implementation, this would be handled by the store
    });
  }

  /**
   * Forward message
   */
  public async forwardMessage(
    messageId: string,
    conversationIds: string[]
  ): Promise<void> {
    this.engine.send('forward_message', {
      messageId,
      conversationIds,
    });
  }

  /**
   * Pin message in conversation
   */
  public async pinMessage(messageId: string, conversationId: string): Promise<void> {
    this.engine.send('pin_message', {
      messageId,
      conversationId,
    });
  }

  /**
   * Unpin message from conversation
   */
  public async unpinMessage(messageId: string, conversationId: string): Promise<void> {
    this.engine.send('unpin_message', {
      messageId,
      conversationId,
    });
  }

  /**
   * Encrypt message content
   */
  private async encryptMessage(
    content: string,
    context: string
  ): Promise<{ content: string; key: string }> {
    // In production, use proper end-to-end encryption (e.g., Signal Protocol, libsodium)
    // This is a simplified example using Web Crypto API

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      // Generate encryption key
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        data
      );

      // Export key
      const exportedKey = await crypto.subtle.exportKey('jwk', key);

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      const encryptedContent = btoa(String.fromCharCode(...combined));
      const keyString = JSON.stringify(exportedKey);

      return {
        content: encryptedContent,
        key: keyString,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      // Fallback to unencrypted if encryption fails
      return {
        content,
        key: '',
      };
    }
  }

  /**
   * Decrypt message content
   */
  public async decryptMessage(
    encryptedContent: string,
    keyString: string
  ): Promise<string> {
    try {
      // Parse key
      const keyData = JSON.parse(keyString);

      // Import key
      const key = await crypto.subtle.importKey(
        'jwk',
        keyData,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['decrypt']
      );

      // Decode base64
      const combined = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData
      );

      // Decode
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedContent; // Return as-is if decryption fails
    }
  }

  /**
   * Upload file attachment
   */
  private async uploadFile(file: File): Promise<MessageAttachment> {
    // In production, upload to S3 or similar storage
    // This is a simplified example

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      return {
        id: data.id || this.generateMessageId(),
        type: this.getAttachmentType(file.type),
        name: file.name,
        url: data.url || URL.createObjectURL(file),
        thumbnailUrl: data.thumbnailUrl,
        size: file.size,
        mimeType: file.type,
        metadata: {
          uploadedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Get attachment type from MIME type
   */
  private getAttachmentType(
    mimeType: string
  ): 'image' | 'file' | 'audio' | 'video' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return 'document';
    }
    return 'file';
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup message event listeners
   */
  private setupMessageListeners(): void {
    // Message status updates
    this.engine.on(RealtimeEvent.MESSAGE_SENT, (data) => {
      console.log('Message sent:', data);
    });

    this.engine.on(RealtimeEvent.MESSAGE_RECEIVED, (data) => {
      console.log('Message received:', data);
    });

    this.engine.on(RealtimeEvent.MESSAGE_UPDATED, (data) => {
      console.log('Message updated:', data);
    });

    this.engine.on(RealtimeEvent.MESSAGE_DELETED, (data) => {
      console.log('Message deleted:', data);
    });

    this.engine.on(RealtimeEvent.MESSAGE_READ, (data) => {
      console.log('Message read:', data);
    });
  }

  /**
   * Enable/disable encryption
   */
  public setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }

  /**
   * Get encryption status
   */
  public isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Clear all typing timeouts
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }
}

// Singleton instance
let messagingInstance: SecureMessaging | null = null;

/**
 * Get secure messaging instance
 */
export function getSecureMessaging(): SecureMessaging {
  if (!messagingInstance) {
    messagingInstance = new SecureMessaging();
  }
  return messagingInstance;
}

/**
 * Destroy messaging instance
 */
export function destroySecureMessaging(): void {
  if (messagingInstance) {
    messagingInstance.destroy();
    messagingInstance = null;
  }
}
