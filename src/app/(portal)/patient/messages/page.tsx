/**
 * Patient Messaging Center Page
 * Agent 1: Patient Portal & Experience Expert
 * Secure messaging with care team, threading, attachments, and read receipts
 */

"use client";

import React, { useEffect, useState } from "react";
import { usePatientPortalStore } from "@/stores/patient-portal-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Paperclip,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  Filter,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/utils";
import type { MessageThread, Message, MessageCategory } from "@/types/patient-portal";

const MESSAGE_CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: "GENERAL_QUESTION", label: "General Question" },
  { value: "APPOINTMENT_REQUEST", label: "Appointment Request" },
  { value: "PRESCRIPTION_REFILL", label: "Prescription Refill" },
  { value: "TEST_RESULTS", label: "Test Results" },
  { value: "BILLING_INQUIRY", label: "Billing Inquiry" },
  { value: "TECHNICAL_SUPPORT", label: "Technical Support" },
];

export default function MessagesPage() {
  const {
    session,
    messageThreads,
    setMessageThreads,
    activeThread,
    setActiveThread,
  } = usePatientPortalStore();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New Message Form
  const [newMessageForm, setNewMessageForm] = useState({
    subject: "",
    body: "",
    category: "GENERAL_QUESTION" as MessageCategory,
    recipientId: "",
  });

  useEffect(() => {
    async function fetchMessages() {
      if (!session?.patientId) return;

      try {
        const response = await fetch(
          `/api/patient-portal/messages?patientId=${session.patientId}`,
        );
        const data = await response.json();

        if (data.success) {
          setMessageThreads(data.data);
          if (data.data.length > 0 && !activeThread) {
            setActiveThread(data.data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [session?.patientId, setMessageThreads, activeThread, setActiveThread]);

  const filteredThreads = messageThreads.filter((thread) => {
    const matchesSearch =
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesCategory =
      filterCategory === "all" || thread.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread || !session?.patientId) return;

    setSendingReply(true);
    try {
      const response = await fetch("/api/patient-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: session.patientId,
          threadId: activeThread.id,
          subject: `Re: ${activeThread.subject}`,
          messageBody: replyText,
          recipientId: activeThread.participants.find((p) => p.type !== "PATIENT")?.id,
          category: activeThread.category,
        }),
      });

      if (response.ok) {
        setReplyText("");
        // Refresh messages
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleNewMessage = async () => {
    if (!newMessageForm.subject || !newMessageForm.body || !session?.patientId)
      return;

    try {
      const response = await fetch("/api/patient-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: session.patientId,
          subject: newMessageForm.subject,
          messageBody: newMessageForm.body,
          recipientId: "provider-1", // In production, this would be selected
          category: newMessageForm.category,
        }),
      });

      if (response.ok) {
        setNewMessageOpen(false);
        setNewMessageForm({
          subject: "",
          body: "",
          category: "GENERAL_QUESTION",
          recipientId: "",
        });
        // Refresh messages
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.readAt) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] p-6">
      <div className="flex h-full flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Secure messaging with your care team
            </p>
          </div>
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
                <DialogDescription>
                  Send a secure message to your care team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newMessageForm.category}
                    onValueChange={(value) =>
                      setNewMessageForm({
                        ...newMessageForm,
                        category: value as MessageCategory,
                      })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject"
                    value={newMessageForm.subject}
                    onChange={(e) =>
                      setNewMessageForm({
                        ...newMessageForm,
                        subject: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={6}
                    value={newMessageForm.body}
                    onChange={(e) =>
                      setNewMessageForm({
                        ...newMessageForm,
                        body: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleNewMessage}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messages Interface */}
        <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-3">
          {/* Thread List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {MESSAGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1 p-2">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                      activeThread?.id === thread.id && "bg-accent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-sm">
                            {thread.subject}
                          </p>
                          {thread.unreadCount > 0 && (
                            <Badge variant="danger" className="shrink-0">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {thread.participants
                            .filter((p) => p.type !== "PATIENT")
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(thread.lastMessageAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {MESSAGE_CATEGORIES.find(
                          (c) => c.value === thread.category,
                        )?.label}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            {activeThread ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{activeThread.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        {activeThread.participants
                          .filter((p) => p.type !== "PATIENT")
                          .map((p) => p.name)
                          .join(", ")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>
                        {MESSAGE_CATEGORIES.find(
                          (c) => c.value === activeThread.category,
                        )?.label}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <ScrollArea className="h-[calc(100vh-28rem)] p-4">
                  <div className="space-y-4">
                    {activeThread.messages.map((message) => {
                      const isPatient = message.senderType === "PATIENT";
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            isPatient && "flex-row-reverse",
                          )}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback>
                              {message.senderName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "flex-1 space-y-1",
                              isPatient && "items-end",
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">
                                {message.senderName}
                              </span>
                              <span className="text-muted-foreground">
                                {formatDate(message.createdAt)} at{" "}
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg p-3 text-sm",
                                isPatient
                                  ? "bg-primary text-primary-foreground ml-12"
                                  : "bg-muted mr-12",
                              )}
                            >
                              {message.body}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {getMessageStatusIcon(message)}
                              {message.readAt && (
                                <span>
                                  Read {formatDate(message.readAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="icon"
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sendingReply}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No conversation selected
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choose a conversation from the list or start a new one
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
