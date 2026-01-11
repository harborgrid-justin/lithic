/**
 * useAdvancedSearch Hook
 * Lithic Healthcare Platform v0.5
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { SearchableEntity } from '@/lib/search/advanced-search';

export function useAdvancedSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [facets, setFacets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (
    query: string,
    entityTypes: SearchableEntity[] = ['all'],
    filters: any[] = [],
    options: any = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          entityTypes,
          filters,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setFacets(data.facets);
      setTotal(data.total);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setFacets([]);
    setTotal(0);
  }, []);

  return {
    results,
    facets,
    total,
    loading,
    error,
    search,
    clearResults,
  };
}
