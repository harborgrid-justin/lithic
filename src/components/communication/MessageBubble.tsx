'use client';

/**
 * MessageBubble Component
 * Individual message display with reactions and metadata
 */

import React from 'react';
import { Message, MessageStatus } from '@/types/communication';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn?: boolean;
}

export function MessageBubble({ message, isOwn = false }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case MessageStatus.SENDING:
        return <Clock className="h-3 w-3" />;
      case MessageStatus.SENT:
        return <Check className="h-3 w-3" />;
      case MessageStatus.DELIVERED:
      case MessageStatus.READ:
        return <CheckCheck className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('mb-4 flex gap-3', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>{message.senderName[0]}</AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div className={cn('flex max-w-[70%] flex-col', isOwn && 'items-end')}>
        {/* Sender name */}
        {!isOwn && (
          <span className="mb-1 text-sm font-medium text-foreground">
            {message.senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded border bg-background/50 p-2"
                >
                  <p className="text-sm">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.reactions.map((reaction, index) => (
                <span
                  key={index}
                  className="rounded-full bg-background/50 px-2 py-1 text-xs"
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(message.createdAt, { addSuffix: true })}</span>
          {isOwn && <span className="flex items-center gap-1">{getStatusIcon()}</span>}
          {message.editedAt && <span>(edited)</span>}
        </div>
      </div>
    </div>
  );
}
