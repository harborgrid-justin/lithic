'use client';

/**
 * Team Chat Page
 * Team channels and group collaboration
 */

import React, { useEffect, useState } from 'react';
import { useCommunicationStore } from '@/stores/communication-store';
import { ChatWindow } from '@/components/communication/ChatWindow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Hash,
  Lock,
  Plus,
  Search,
  Users,
  Settings,
  Archive,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TeamChatPage() {
  const {
    channels,
    activeConversationId,
    setActiveConversation,
    joinChannel,
    createChannel,
    isConnected,
    initialize,
  } = useCommunicationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const channelList = Array.from(channels.values()).filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize communication on mount
  useEffect(() => {
    const userId = 'current-user-id'; // Replace with actual user ID
    initialize(userId).catch((error) => {
      console.error('Failed to initialize communication:', error);
    });
  }, [initialize]);

  const handleCreateChannel = async (name: string, type: 'public' | 'private' | 'clinical') => {
    await createChannel(name, type);
    setShowCreateChannel(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Chat</h1>
            <p className="text-sm text-muted-foreground">
              {isConnected ? (
                <>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                  Connected
                </>
              ) : (
                <>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gray-400" />
                  Connecting...
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateChannel(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Channel
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Channels sidebar */}
        <div className="flex w-80 flex-col border-r bg-background">
          {/* Search */}
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Channel list */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {/* Public Channels */}
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  Public Channels
                </h3>
                <div className="space-y-1">
                  <ChannelItem
                    id="general"
                    name="general"
                    type="public"
                    memberCount={156}
                    unreadCount={5}
                    isActive={activeConversationId === 'general'}
                    onClick={() => setActiveConversation('general')}
                  />
                  <ChannelItem
                    id="emergency"
                    name="emergency"
                    type="public"
                    memberCount={89}
                    unreadCount={2}
                    isActive={activeConversationId === 'emergency'}
                    onClick={() => setActiveConversation('emergency')}
                  />
                  <ChannelItem
                    id="announcements"
                    name="announcements"
                    type="public"
                    memberCount={243}
                    unreadCount={0}
                    isActive={activeConversationId === 'announcements'}
                    onClick={() => setActiveConversation('announcements')}
                  />
                </div>
              </div>

              {/* Private Channels */}
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  Private Channels
                </h3>
                <div className="space-y-1">
                  <ChannelItem
                    id="cardiology-team"
                    name="cardiology-team"
                    type="private"
                    memberCount={12}
                    unreadCount={0}
                    isActive={activeConversationId === 'cardiology-team'}
                    onClick={() => setActiveConversation('cardiology-team')}
                  />
                  <ChannelItem
                    id="leadership"
                    name="leadership"
                    type="private"
                    memberCount={8}
                    unreadCount={3}
                    isActive={activeConversationId === 'leadership'}
                    onClick={() => setActiveConversation('leadership')}
                  />
                </div>
              </div>

              {/* Clinical Channels */}
              <div className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  Clinical Channels
                </h3>
                <div className="space-y-1">
                  <ChannelItem
                    id="patient-rounds"
                    name="patient-rounds"
                    type="clinical"
                    memberCount={45}
                    unreadCount={7}
                    isActive={activeConversationId === 'patient-rounds'}
                    onClick={() => setActiveConversation('patient-rounds')}
                  />
                  <ChannelItem
                    id="code-alerts"
                    name="code-alerts"
                    type="clinical"
                    memberCount={120}
                    unreadCount={0}
                    isActive={activeConversationId === 'code-alerts'}
                    onClick={() => setActiveConversation('code-alerts')}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1">
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Hash className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No channel selected</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a channel from the list or create a new one
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateChannel(true)}
                >
                  Create New Channel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Channel info */}
        <div className="w-80 border-l bg-background p-4">
          <div className="space-y-4">
            {activeConversationId ? (
              <>
                <div>
                  <h3 className="mb-2 font-semibold">Channel Info</h3>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            #{activeConversationId}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Public channel
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Channel settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive channel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-sm">
                        General discussion and announcements for the entire team
                      </p>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Members</h3>
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          156 members
                        </span>
                        <Button variant="ghost" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          View all
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Pinned Messages</h3>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">
                      No pinned messages
                    </p>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Shared Files</h3>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">
                      No files shared yet
                    </p>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a channel to view details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Channel item component
interface ChannelItemProps {
  id: string;
  name: string;
  type: 'public' | 'private' | 'clinical';
  memberCount: number;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

function ChannelItem({
  name,
  type,
  memberCount,
  unreadCount,
  isActive,
  onClick,
}: ChannelItemProps) {
  const icon = type === 'private' ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent ${
        isActive ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>
          {name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <Badge variant="default" className="h-5 px-2 text-xs">
            {unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}
