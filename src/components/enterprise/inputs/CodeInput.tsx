'use client';

/**
 * Enterprise CodeInput Component
 *
 * ICD/CPT code input with:
 * - Code lookup/autocomplete
 * - Code validation
 * - Description display
 * - Recent codes
 * - Favorites
 * - Multi-code support
 * - WCAG 2.1 AA compliant
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Star, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export interface MedicalCode {
  code: string;
  description: string;
  type: 'ICD-10' | 'CPT' | 'HCPCS' | 'LOINC';
  category?: string;
  billable?: boolean;
}

export interface CodeInputProps {
  value: string[];
  onChange: (codes: string[]) => void;
  type?: 'ICD-10' | 'CPT' | 'HCPCS' | 'LOINC' | 'ALL';
  onLookup?: (query: string) => Promise<MedicalCode[]>;
  recentCodes?: MedicalCode[];
  favoriteCodes?: MedicalCode[];
  multiSelect?: boolean;
  maxCodes?: number;
  placeholder?: string;
  className?: string;
}

// Mock code database (in real app, this would be from an API)
const mockCodes: MedicalCode[] = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'ICD-10', billable: true },
  { code: 'I10', description: 'Essential (primary) hypertension', type: 'ICD-10', billable: true },
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', type: 'ICD-10', billable: true },
  { code: '99213', description: 'Office/outpatient visit, est patient, 20-29 min', type: 'CPT', billable: true },
  { code: '99214', description: 'Office/outpatient visit, est patient, 30-39 min', type: 'CPT', billable: true },
  { code: '36415', description: 'Routine venipuncture', type: 'CPT', billable: true },
];

export function CodeInput({
  value,
  onChange,
  type = 'ALL',
  onLookup,
  recentCodes = [],
  favoriteCodes = [],
  multiSelect = true,
  maxCodes,
  placeholder = 'Enter code or search...',
  className = '',
}: CodeInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MedicalCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lookup codes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const performLookup = async () => {
      setLoading(true);

      try {
        if (onLookup) {
          const results = await onLookup(query);
          setSuggestions(results);
        } else {
          // Mock lookup
          const filtered = mockCodes.filter(code =>
            (type === 'ALL' || code.type === type) &&
            (code.code.toLowerCase().includes(query.toLowerCase()) ||
             code.description.toLowerCase().includes(query.toLowerCase()))
          );
          setSuggestions(filtered);
        }
      } catch (error) {
        console.error('Code lookup failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(performLookup, 300);
    return () => clearTimeout(debounce);
  }, [query, type, onLookup]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCode = (code: string) => {
    if (maxCodes && value.length >= maxCodes) {
      return;
    }

    if (multiSelect) {
      if (!value.includes(code)) {
        onChange([...value, code]);
      }
    } else {
      onChange([code]);
    }

    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveCode = (code: string) => {
    onChange(value.filter(c => c !== code));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(-1, i - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleAddCode(suggestions[selectedIndex].code);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCodeDetails = (code: string): MedicalCode | undefined => {
    return mockCodes.find(c => c.code === code);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected Codes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(code => {
            const details = getCodeDetails(code);
            return (
              <div
                key={code}
                className="
                  inline-flex items-center gap-2 px-3 py-2
                  bg-primary/10 border border-primary/20 rounded-lg
                "
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{code}</div>
                  {details && (
                    <div className="text-xs text-muted-foreground truncate">
                      {details.description}
                    </div>
                  )}
                </div>
                {details?.billable && (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" title="Billable" />
                )}
                <button
                  onClick={() => handleRemoveCode(code)}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label={`Remove ${code}`}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={maxCodes !== undefined && value.length >= maxCodes}
            className="
              w-full pl-10 pr-10 py-3 border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label="Medical code search"
            aria-autocomplete="list"
            aria-controls="code-suggestions"
            aria-expanded={isOpen}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            id="code-suggestions"
            className="
              absolute top-full left-0 right-0 mt-2 py-2
              bg-card border border-border rounded-lg shadow-xl
              max-h-96 overflow-y-auto z-50
            "
          >
            {/* Favorites */}
            {!query && favoriteCodes.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  Favorites
                </div>
                {favoriteCodes.map(code => (
                  <CodeSuggestionItem
                    key={code.code}
                    code={code}
                    onSelect={() => handleAddCode(code.code)}
                    isSelected={false}
                  />
                ))}
                <div className="border-t border-border my-2" />
              </div>
            )}

            {/* Recent */}
            {!query && recentCodes.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recent
                </div>
                {recentCodes.map(code => (
                  <CodeSuggestionItem
                    key={code.code}
                    code={code}
                    onSelect={() => handleAddCode(code.code)}
                    isSelected={false}
                  />
                ))}
                <div className="border-t border-border my-2" />
              </div>
            )}

            {/* Search Results */}
            {query && suggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  Results ({suggestions.length})
                </div>
                {suggestions.map((code, index) => (
                  <CodeSuggestionItem
                    key={code.code}
                    code={code}
                    onSelect={() => handleAddCode(code.code)}
                    isSelected={index === selectedIndex}
                  />
                ))}
              </div>
            )}

            {query && suggestions.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No codes found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {maxCodes && (
        <div className="text-xs text-muted-foreground">
          {value.length} / {maxCodes} codes selected
        </div>
      )}
    </div>
  );
}

interface CodeSuggestionItemProps {
  code: MedicalCode;
  onSelect: () => void;
  isSelected: boolean;
}

function CodeSuggestionItem({ code, onSelect, isSelected }: CodeSuggestionItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full px-4 py-3 text-left
        transition-colors
        ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{code.code}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted">
              {code.type}
            </span>
            {code.billable && (
              <CheckCircle2 className="w-3 h-3 text-success" title="Billable" />
            )}
          </div>
          <div className="text-sm opacity-90">
            {code.description}
          </div>
        </div>
      </div>
    </button>
  );
}
