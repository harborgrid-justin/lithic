/**
 * AI Documentation Helper Component
 * Real-time documentation assistance and auto-completion
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Lightbulb, Check, X } from 'lucide-react';
import { DocumentationRequest } from '@/types/ai';
import { AISuggestionCard } from './AISuggestionCard';

interface AIDocumentationHelperProps {
  context: 'soap' | 'history' | 'physical' | 'assessment' | 'plan';
  currentText: string;
  chiefComplaint?: string;
  symptoms?: string[];
  vitalSigns?: Record<string, string | number>;
  onApplySuggestion?: (text: string) => void;
  className?: string;
}

export function AIDocumentationHelper({
  context,
  currentText,
  chiefComplaint,
  symptoms = [],
  vitalSigns = {},
  onApplySuggestion,
  className = '',
}: AIDocumentationHelperProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    section: string;
    content: string;
    type: 'completion' | 'enhancement' | 'template';
    confidence: number;
    reasoning?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce the suggestions request
  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (text.length < 10) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const request: DocumentationRequest = {
          context,
          existingText: text,
          chiefComplaint,
          symptoms,
          vitalSigns,
        };

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

        if (data.suggestions) {
          setSuggestions(
            data.suggestions.map((s: any, idx: number) => ({
              id: `${Date.now()}-${idx}`,
              ...s,
            }))
          );
          setShowSuggestions(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [context, chiefComplaint, symptoms, vitalSigns]
  );

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentText !== undefined) {
        fetchSuggestions(currentText);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentText, fetchSuggestions]);

  const handleApplySuggestion = (content: string) => {
    if (onApplySuggestion) {
      onApplySuggestion(content);
    }
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.content !== content));
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleManualRequest = () => {
    fetchSuggestions(currentText);
  };

  if (!showSuggestions && suggestions.length === 0 && !isLoading && !error) {
    return (
      <div className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <button
          type="button"
          onClick={handleManualRequest}
          className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          <span>Get AI Documentation Suggestions</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">AI Suggestions</h4>
          {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
        </div>
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showSuggestions ? 'Hide' : 'Show'} ({suggestions.length})
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map(suggestion => (
            <AISuggestionCard
              key={suggestion.id}
              title={`${suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Suggestion`}
              content={suggestion.content}
              type="suggestion"
              confidence={suggestion.confidence}
              reasoning={suggestion.reasoning}
              onApply={() => handleApplySuggestion(suggestion.content)}
              onDismiss={() => handleDismissSuggestion(suggestion.id)}
            />
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {!isLoading && !error && showSuggestions && suggestions.length === 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">No suggestions available at this time.</p>
          <button
            type="button"
            onClick={handleManualRequest}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            Refresh Suggestions
          </button>
        </div>
      )}
    </div>
  );
}

export default AIDocumentationHelper;
