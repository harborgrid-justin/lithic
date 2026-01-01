/**
 * AI Documentation Helper
 *
 * In-line documentation assistance with:
 * - Smart autocomplete
 * - Template suggestions
 * - Real-time guidance
 *
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'template' | 'completion' | 'improvement';
  confidence: number;
}

interface AIDocumentationHelperProps {
  currentText: string;
  documentType?: 'progress_note' | 'h&p' | 'discharge_summary' | 'consult';
  onApplySuggestion?: (suggestion: string) => void;
}

export function AIDocumentationHelper({
  currentText,
  documentType = 'progress_note',
  onApplySuggestion,
}: AIDocumentationHelperProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Generate suggestions based on current text
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentText.length > 20) {
        generateSuggestions();
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [currentText]);

  /**
   * Generate AI suggestions
   */
  const generateSuggestions = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Provide 3 brief suggestions to improve this ${documentType}:\n\n${currentText}\n\nReturn as JSON array with: title, content, category (template/completion/improvement)`,
            },
          ],
          temperature: 0.7,
          maxTokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Parse suggestions from response
        try {
          const parsedSuggestions = JSON.parse(data.message);
          const formatted: Suggestion[] = parsedSuggestions.map(
            (s: any, index: number) => ({
              id: `sug_${Date.now()}_${index}`,
              title: s.title || 'Suggestion',
              content: s.content || '',
              category: s.category || 'improvement',
              confidence: 0.8,
            })
          );

          setSuggestions(formatted);
        } catch {
          // Fallback if response isn't valid JSON
          setSuggestions([
            {
              id: `sug_${Date.now()}`,
              title: 'AI Suggestion',
              content: data.message,
              category: 'improvement',
              confidence: 0.7,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Suggestion generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy suggestion to clipboard
   */
  const copySuggestion = async (suggestion: Suggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      setCopiedId(suggestion.id);
      toast.success('Copied to clipboard');

      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  /**
   * Apply suggestion
   */
  const applySuggestion = (suggestion: Suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.content);
      toast.success('Suggestion applied');
    }
  };

  /**
   * Get category icon and color
   */
  const getCategoryStyle = (category: Suggestion['category']) => {
    switch (category) {
      case 'template':
        return { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'completion':
        return { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'improvement':
        return { icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50' };
    }
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">AI Suggestions</h4>
        {isLoading && (
          <Badge variant="secondary" className="text-xs">
            Analyzing...
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {suggestions.map(suggestion => {
          const categoryStyle = getCategoryStyle(suggestion.category);
          const Icon = categoryStyle.icon;

          return (
            <Card
              key={suggestion.id}
              className="p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${categoryStyle.bg} ${categoryStyle.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium">{suggestion.title}</h5>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}% confident
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {suggestion.content}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copySuggestion(suggestion)}
                    >
                      {copiedId === suggestion.id ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy
                    </Button>

                    {onApplySuggestion && (
                      <Button
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
