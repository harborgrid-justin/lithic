'use client';

/**
 * ConversationList Component
 * Sidebar list of conversations with search and filters
 */

import React, { useState } from 'react';
import { useCommunicationStore } from '@/stores/communication-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PresenceIndicator } from './PresenceIndicator';

export function ConversationList() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    getUnreadCount,
  } = useCommunicationStore();

  const conversationList = Array.from(conversations.values())
    .filter((conv) => !conv.isArchived)
    .filter((conv) =>
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by pinned, then by last message time
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return bTime.getTime() - aTime.getTime();
    });

  return (
    <div className="flex h-full w-80 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversationList.map((conversation) => {
              const unreadCount = getUnreadCount(conversation.id);
              const isActive = activeConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  className={cn(
                    'w-full rounded-lg p-3 text-left transition-colors hover:bg-accent',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with presence */}
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {conversation.name?.[0] || 'C'}
                      </div>
                      {conversation.participants.length === 1 && (
                        <div className="absolute bottom-0 right-0">
                          <PresenceIndicator
                            status={conversation.participants[0]?.presence?.status}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate font-medium">
                          {conversation.name || 'Unnamed'}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(conversation.lastMessage.createdAt, {
                              addSuffix: false,
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
