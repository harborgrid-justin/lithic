'use client';

/**
 * Messages Page
 * Main messaging interface with conversation list and chat window
 */

import React, { useEffect, useState } from 'react';
import { useCommunicationStore } from '@/stores/communication-store';
import { ConversationList } from '@/components/communication/ConversationList';
import { ChatWindow } from '@/components/communication/ChatWindow';
import { ContactCard } from '@/components/communication/ContactCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquarePlus,
  Users,
  Archive,
  Settings,
  Search,
  Star,
} from 'lucide-react';

export default function MessagesPage() {
  const {
    activeConversationId,
    initialize,
    isConnected,
    getTotalUnreadCount,
    initiateCall,
  } = useCommunicationStore();

  const [activeTab, setActiveTab] = useState('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const totalUnread = getTotalUnreadCount();

  // Initialize communication on mount
  useEffect(() => {
    // Get user ID from session (in production)
    const userId = 'current-user-id'; // Replace with actual user ID
    initialize(userId).catch((error) => {
      console.error('Failed to initialize communication:', error);
    });
  }, [initialize]);

  const handleVideoCall = () => {
    if (activeConversationId) {
      initiateCall([activeConversationId], 'VIDEO' as any);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
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
            {totalUnread > 0 && (
              <Badge variant="danger">{totalUnread} unread</Badge>
            )}
            <Button onClick={() => setShowNewMessage(true)}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New Message
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList>
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="starred">
              <Star className="mr-2 h-4 w-4" />
              Starred
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list sidebar */}
        <ConversationList />

        {/* Chat window */}
        <div className="flex-1">
          {activeConversationId ? (
            <ChatWindow
              conversationId={activeConversationId}
              onCallInitiate={handleVideoCall}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageSquarePlus className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No conversation selected</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a conversation from the list or start a new one
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowNewMessage(true)}
                >
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Contact info */}
        <div className="w-80 border-l bg-background p-4">
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 font-semibold">Conversation Details</h3>
              {activeConversationId ? (
                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Participants</h4>
                      <div className="mt-2 space-y-2">
                        {/* Participants list */}
                        <p className="text-sm text-muted-foreground">
                          Loading participants...
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Shared Files</h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        No files shared yet
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium">Actions</h4>
                      <div className="mt-2 space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Search className="mr-2 h-4 w-4" />
                          Search in conversation
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Star className="mr-2 h-4 w-4" />
                          Star conversation
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a conversation to view details
                </p>
              )}
            </div>

            {/* Quick contacts */}
            <div>
              <h3 className="mb-4 font-semibold">Quick Contacts</h3>
              <div className="space-y-2">
                <ContactCard
                  userId="user-1"
                  name="Dr. Sarah Johnson"
                  role="Cardiologist"
                  department="Cardiology"
                  presence={{
                    userId: 'user-1',
                    status: 'ONLINE' as any,
                    lastSeen: new Date(),
                  }}
                  onMessage={() => {}}
                  onVideoCall={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
