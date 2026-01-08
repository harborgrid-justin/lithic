/**
 * Global Search Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, FileText, User, Calendar, Pill } from 'lucide-react';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';

export function GlobalSearch({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { search, results, loading } = useAdvancedSearch();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      search(query);
    }
  }, [query, search]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient': return <User className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'medication': return <Pill className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground bg-background border rounded-lg hover:bg-accent ${className}`}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search patients, documents, appointments..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && <CommandEmpty>Searching...</CommandEmpty>}
          {!loading && results.length === 0 && query.length > 2 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.slice(0, 10).map((result: any) => (
                <CommandItem key={result.id}>
                  <div className="flex items-center gap-2 w-full">
                    {getIcon(result.entityType)}
                    <div className="flex-1">
                      <p className="font-medium">{result.data.name || result.data.title}</p>
                      <p className="text-xs text-muted-foreground">{result.entityType}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
