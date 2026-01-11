/**
 * AI Suggestion Card Component
 * Displays AI-generated suggestions with confidence and actions
 */

'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, TrendingUp, X } from 'lucide-react';

interface AISuggestionCardProps {
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'suggestion';
  confidence?: number;
  reasoning?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AISuggestionCard({
  title,
  content,
  type = 'suggestion',
  confidence,
  reasoning,
  onApply,
  onDismiss,
  className = '',
}: AISuggestionCardProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          iconBg: 'bg-green-100',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-100',
        };
      default:
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
          iconBg: 'bg-purple-100',
        };
    }
  };

  const styles = getTypeStyles();

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`relative ${styles.bg} border ${styles.border} rounded-lg p-4 ${className}`}
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Dismiss suggestion"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <div className={`p-2 rounded-full ${styles.iconBg}`}>{styles.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {confidence !== undefined && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">Confidence:</span>
              <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
                {(confidence * 100).toFixed(0)}%
              </span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                <div
                  className={`h-full ${
                    confidence >= 0.8
                      ? 'bg-green-500'
                      : confidence >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="mb-3 p-3 bg-white bg-opacity-60 rounded-md">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Reasoning:</span> {reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      {onApply && (
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Apply Suggestion
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* AI Badge */}
      <div className="absolute bottom-2 right-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          AI Suggestion
        </span>
      </div>
    </div>
  );
}

export default AISuggestionCard;
