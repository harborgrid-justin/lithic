/**
 * Document Search Component
 * Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { DocumentType } from '@/types/documents';

interface DocumentSearchProps {
  onSearch: (query: string, filters: any) => void;
  className?: string;
}

export function DocumentSearch({ onSearch, className = '' }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);

  const handleSearch = () => {
    onSearch(query, { types: selectedTypes });
  };

  const handleClear = () => {
    setQuery('');
    setSelectedTypes([]);
    onSearch('', {});
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
        {(query || selectedTypes.length > 0) && (
          <Button variant="ghost" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Document Types</h4>
          <div className="flex flex-wrap gap-2">
            {(['medical_record', 'lab_result', 'imaging', 'consent_form'] as DocumentType[]).map((type) => (
              <Button
                key={type}
                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTypes((prev) =>
                    prev.includes(type)
                      ? prev.filter((t) => t !== type)
                      : [...prev, type]
                  );
                }}
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
