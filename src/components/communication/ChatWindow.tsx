'use client';

/**
 * ChatWindow Component
 * Main chat interface with message display and input
 */

import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useCommunicationStore } from '@/stores/communication-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Video, Phone } from 'lucide-react';
import { Message } from '@/types/communication';

interface ChatWindowProps {
  conversationId: string;
  onCallInitiate?: () => void;
}

export function ChatWindow({ conversationId, onCallInitiate }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    getMessages,
    getConversation,
    sendMessage,
    startTyping,
    stopTyping,
    getTypingUsers,
  } = useCommunicationStore();

  const messages = getMessages(conversationId);
  const conversation = getConversation(conversationId);
  const typingUsers = getTypingUsers(conversationId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId);
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    stopTyping(conversationId);

    // Send message
    await sendMessage(conversationId, messageInput);
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{conversation?.name || 'Conversation'}</h2>
            <p className="text-sm text-muted-foreground">
              {conversation?.participants.length || 0} participants
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onCallInitiate}>
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((message: Message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-4">
            <TypingIndicator users={typingUsers} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>
          <Textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            rows={2}
          />
          <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
