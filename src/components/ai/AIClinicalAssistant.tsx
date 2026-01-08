/**
 * AI Clinical Assistant Panel
 * Main AI assistant interface for clinical workflows
 *
 * Features: Contextual suggestions, documentation help, real-time assistance
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIAssistantContext } from '@/types/ai';

interface AIClinicalAssistantProps {
  context: AIAssistantContext;
  onSuggestionApply?: (suggestion: string) => void;
  className?: string;
}

export function AIClinicalAssistant({
  context,
  onSuggestionApply,
  className = '',
}: AIClinicalAssistantProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useAIAssistant(context);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    await sendMessage(query);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion);
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Clinical Assistant</h3>
          {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-col h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Ask me anything about this patient or clinical documentation.</p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-medium text-gray-700">Try asking:</p>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setQuery('Summarize this patient\'s medical history')}
                  >
                    Summarize this patient's medical history
                  </button>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setQuery('What codes should I consider for this visit?')}
                  >
                    What codes should I consider for this visit?
                  </button>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setQuery('What are the differential diagnoses?')}
                  >
                    What are the differential diagnoses?
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && message.suggestions && (
                        <div className="mt-2 space-y-1">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="block w-full text-left text-xs px-2 py-1 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                              onClick={() => handleSuggestionClick(suggestion.content)}
                            >
                              {suggestion.type}: {suggestion.content}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Context Info (when collapsed) */}
      {!isExpanded && (
        <div className="px-4 py-2 text-xs text-gray-500">
          {context.section ? `Section: ${context.section}` : 'Click to expand'}
        </div>
      )}
    </div>
  );
}

export default AIClinicalAssistant;
