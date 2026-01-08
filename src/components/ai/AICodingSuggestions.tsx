/**
 * AI Coding Suggestions Component
 * Displays ICD-10 and CPT code suggestions with confidence scores
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Code, Loader2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { CodingSuggestion } from '@/types/ai';

interface AICodingSuggestionsProps {
  clinicalText: string;
  encounterType?: string;
  chiefComplaint?: string;
  codingType?: 'icd10' | 'cpt' | 'both';
  onCodeSelect?: (code: string, type: 'icd10' | 'cpt') => void;
  className?: string;
}

export function AICodingSuggestions({
  clinicalText,
  encounterType,
  chiefComplaint,
  codingType = 'both',
  onCodeSelect,
  className = '',
}: AICodingSuggestionsProps) {
  const [icd10Suggestions, setIcd10Suggestions] = useState<CodingSuggestion[]>([]);
  const [cptSuggestions, setCptSuggestions] = useState<CodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (clinicalText && clinicalText.length > 20) {
      fetchSuggestions();
    }
  }, [clinicalText, encounterType, chiefComplaint, codingType]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggest-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicalText,
          encounterType,
          chiefComplaint,
          codingType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get coding suggestions');
      }

      const data = await response.json();

      if (codingType === 'icd10' || codingType === 'both') {
        setIcd10Suggestions(data.icd10Suggestions || []);
      }
      if (codingType === 'cpt' || codingType === 'both') {
        setCptSuggestions(data.cptSuggestions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeClick = (code: string, type: 'icd10' | 'cpt') => {
    if (onCodeSelect) {
      onCodeSelect(code, type);
    }

    setSelectedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const toggleExpanded = (code: string) => {
    setExpandedCode(expandedCode === code ? null : code);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const renderSuggestion = (suggestion: CodingSuggestion, idx: number) => {
    const isExpanded = expandedCode === suggestion.code;
    const isSelected = selectedCodes.has(suggestion.code);

    return (
      <div
        key={idx}
        className={`border rounded-lg p-3 transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Code Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <button
                type="button"
                onClick={() => handleCodeClick(suggestion.code, suggestion.type)}
                className={`font-mono text-sm font-semibold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                } hover:opacity-80 transition-opacity`}
              >
                {suggestion.code}
              </button>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getConfidenceColor(
                  suggestion.confidence
                )}`}
              >
                {(suggestion.confidence * 100).toFixed(0)}% confidence
              </span>
              {suggestion.type === 'icd10' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  ICD-10
                </span>
              )}
              {suggestion.type === 'cpt' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                  CPT
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{suggestion.description}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleExpanded(suggestion.code)}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
            {/* Reasoning */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 mb-1">Reasoning:</h5>
              <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
            </div>

            {/* Supporting Evidence */}
            {suggestion.supportingEvidence && suggestion.supportingEvidence.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1">
                  Supporting Evidence:
                </h5>
                <ul className="list-disc list-inside space-y-0.5">
                  {suggestion.supportingEvidence.map((evidence, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            {suggestion.alternatives && suggestion.alternatives.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1">
                  Alternative Codes:
                </h5>
                <div className="space-y-1">
                  {suggestion.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                    >
                      <span>
                        <span className="font-mono font-medium">{alt.code}</span> -{' '}
                        {alt.description}
                      </span>
                      <span className="text-gray-500">
                        {(alt.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!clinicalText || clinicalText.length < 20) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Code className="w-5 h-5" />
          <p className="text-sm">Enter clinical documentation to get AI coding suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Coding Suggestions</h3>
          {isLoading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
        </div>
        {!isLoading && (icd10Suggestions.length > 0 || cptSuggestions.length > 0) && (
          <button
            type="button"
            onClick={fetchSuggestions}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* ICD-10 Suggestions */}
      {!isLoading && (codingType === 'icd10' || codingType === 'both') && icd10Suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <span>ICD-10 Codes</span>
            <span className="text-xs font-normal text-gray-500">
              ({icd10Suggestions.length} suggestions)
            </span>
          </h4>
          <div className="space-y-2">
            {icd10Suggestions.map((suggestion, idx) => renderSuggestion(suggestion, idx))}
          </div>
        </div>
      )}

      {/* CPT Suggestions */}
      {!isLoading && (codingType === 'cpt' || codingType === 'both') && cptSuggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
            <span>CPT Codes</span>
            <span className="text-xs font-normal text-gray-500">
              ({cptSuggestions.length} suggestions)
            </span>
          </h4>
          <div className="space-y-2">
            {cptSuggestions.map((suggestion, idx) => renderSuggestion(suggestion, idx))}
          </div>
        </div>
      )}

      {/* No Suggestions */}
      {!isLoading && !error && icd10Suggestions.length === 0 && cptSuggestions.length === 0 && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-600">No coding suggestions available</p>
          <button
            type="button"
            onClick={fetchSuggestions}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Selected Codes Summary */}
      {selectedCodes.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedCodes.size} code(s) selected
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCodes(new Set())}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICodingSuggestions;
