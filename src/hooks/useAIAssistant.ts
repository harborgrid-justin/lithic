/**
 * useAIAssistant Hook
 * React hook for AI assistant functionality
 *
 * Features: Conversational AI, context-aware assistance, message history
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  AIAssistantContext,
  AIAssistantRequest,
  LLMMessage,
} from '@/types/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Array<{
    type: string;
    content: string;
    action?: string;
  }>;
  timestamp: Date;
}

interface UseAIAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (query: string, mode?: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useAIAssistant(
  context: AIAssistantContext
): UseAIAssistantReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<string>('');

  const sendMessage = useCallback(
    async (query: string, mode: string = 'general') => {
      if (!query.trim()) return;

      lastQueryRef.current = query;
      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      try {
        // Build previous messages context
        const previousMessages: LLMMessage[] = messages.slice(-4).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // Build request
        const request: AIAssistantRequest = {
          query,
          context,
          previousMessages: previousMessages.length > 0 ? previousMessages : undefined,
          mode: mode as any,
        };

        // Call API
        const response = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`
          );
        }

        const data = await response.json();

        // Add assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || 'No response received',
          suggestions: data.suggestions,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMessage);

        // Add error message
        const errorMsg: Message = {
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [context, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastQueryRef.current) {
      // Remove last two messages (user and assistant error)
      setMessages(prev => prev.slice(0, -2));
      await sendMessage(lastQueryRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

/**
 * useClinicalSummarization Hook
 * Hook for clinical note summarization
 */
export function useClinicalSummarization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(
    async (
      noteContent: string,
      format: 'brief' | 'detailed' = 'brief'
    ): Promise<any> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: {
              content: noteContent,
              type: 'progress',
            },
            format,
          }),
        });

        if (!response.ok) {
          throw new Error('Summarization failed');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to summarize';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    summarize,
    isLoading,
    error,
  };
}

/**
 * useCodingSuggestions Hook
 * Hook for medical coding suggestions
 */
export function useCodingSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = useCallback(
    async (
      clinicalText: string,
      options?: {
        encounterType?: string;
        chiefComplaint?: string;
        codingType?: 'icd10' | 'cpt' | 'both';
      }
    ): Promise<any> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/suggest-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicalText,
            ...options,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get coding suggestions');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get suggestions';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getSuggestions,
    isLoading,
    error,
  };
}

/**
 * useDocumentationAssistant Hook
 * Hook for documentation assistance
 */
export function useDocumentationAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = useCallback(
    async (request: any): Promise<any> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'documentation',
            request,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get documentation suggestions');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get suggestions';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getSuggestions,
    isLoading,
    error,
  };
}

/**
 * useStreamingResponse Hook
 * Hook for streaming AI responses
 */
export function useStreamingResponse() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (endpoint: string, payload: any) => {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    streamingContent,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}

export default useAIAssistant;
