/**
 * AI Assistant Page
 *
 * Main AI assistant interface with:
 * - Full-screen chat
 * - Template library
 * - History and favorites
 * - Quick actions
 *
 * @page /ai-assistant
 */

'use client';

import React, { useState } from 'react';
import { Send, Mic, MicOff, Sparkles, FileText, History, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  safetyWarnings?: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * Predefined templates
   */
  const templates: Template[] = [
    {
      id: 'soap',
      name: 'SOAP Note',
      description: 'Generate comprehensive SOAP note',
      category: 'Documentation',
      prompt: 'Generate a SOAP note template for a patient visit',
    },
    {
      id: 'differential',
      name: 'Differential Diagnosis',
      description: 'Build differential diagnosis list',
      category: 'Clinical Decision Support',
      prompt: 'Help me develop a differential diagnosis',
    },
    {
      id: 'treatment',
      name: 'Treatment Plan',
      description: 'Evidence-based treatment recommendations',
      category: 'Treatment',
      prompt: 'Suggest an evidence-based treatment plan',
    },
    {
      id: 'medication',
      name: 'Medication Review',
      description: 'Check for drug interactions',
      category: 'Safety',
      prompt: 'Review medications for potential interactions',
    },
    {
      id: 'discharge',
      name: 'Discharge Summary',
      description: 'Complete discharge documentation',
      category: 'Documentation',
      prompt: 'Help me create a discharge summary',
    },
    {
      id: 'patient-education',
      name: 'Patient Education',
      description: 'Generate patient-friendly explanations',
      category: 'Education',
      prompt: 'Explain this condition in patient-friendly language',
    },
  ];

  /**
   * Send message to AI
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        safetyWarnings: data.safetyCheck?.warnings?.map((w: any) => w.message),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load template
   */
  const loadTemplate = (template: Template) => {
    setInput(template.prompt);
  };

  /**
   * Toggle favorite
   */
  const toggleFavorite = (messageId: string) => {
    setFavorites(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Clinical AI Assistant</h1>
            <p className="text-muted-foreground">
              GPT-4 powered clinical documentation and decision support
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge variant="secondary">HIPAA Compliant</Badge>
          <Badge variant="secondary">Evidence-Based</Badge>
          <Badge variant="secondary">Real-time Safety Checks</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[calc(100vh-250px)]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">
                    Welcome to Your AI Clinical Assistant
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Ask me anything about clinical documentation, diagnosis, or treatment
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {templates.slice(0, 4).map(template => (
                      <Button
                        key={template.id}
                        variant="outline"
                        className="h-auto p-4 text-left justify-start"
                        onClick={() => loadTemplate(template)}
                      >
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFavorite(message.id)}
                            className="shrink-0"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                favorites.includes(message.id) ? 'fill-current' : ''
                              }`}
                            />
                          </Button>
                        </div>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.safetyWarnings && message.safetyWarnings.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                            ⚠️ {message.safetyWarnings[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse">●</div>
                          <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                            ●
                          </div>
                          <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>
                            ●
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about clinical documentation, diagnosis, treatment plans..."
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isRecording ? 'destructive' : 'outline'}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-1" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-1" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {templates.map(template => (
                    <Card
                      key={template.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => loadTemplate(template)}
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {template.category}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {messages
                    .filter(m => favorites.includes(m.id))
                    .map(message => (
                      <Card key={message.id} className="p-3">
                        <p className="text-sm line-clamp-2">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleDateString()}
                        </p>
                      </Card>
                    ))}
                  {favorites.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Star messages to save them here
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
