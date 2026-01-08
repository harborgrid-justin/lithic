/**
 * Advanced Search Engine
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive search engine with:
 * - Full-text search
 * - Faceted filtering
 * - Fuzzy matching
 * - Result ranking
 * - Search suggestions
 * - Query history
 * - Advanced caching
 */

import { v4 as uuidv4 } from 'uuid';

export type SearchableEntity =
  | 'patient'
  | 'encounter'
  | 'document'
  | 'appointment'
  | 'medication'
  | 'lab_result'
  | 'diagnosis'
  | 'procedure'
  | 'provider'
  | 'organization'
  | 'all';

export interface SearchQuery {
  id: string;
  query: string;
  entityTypes: SearchableEntity[];
  filters: SearchFilter[];
  facets: string[];
  fuzzy: boolean;
  maxResults: number;
  offset: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  highlightFields: string[];
  userId: string;
  organizationId: string;
  timestamp: Date;
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

export interface SearchResult<T = unknown> {
  id: string;
  entityType: SearchableEntity;
  score: number;
  data: T;
  highlights: Record<string, string[]>;
  metadata: {
    indexed: Date;
    updated: Date;
    version: number;
  };
}

export interface SearchResponse<T = unknown> {
  query: SearchQuery;
  results: SearchResult<T>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: FacetResult[];
  suggestions: string[];
  executionTime: number;
  cached: boolean;
}

export interface FacetResult {
  field: string;
  values: FacetValue[];
  type: 'terms' | 'range' | 'date';
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  lastUsed: Date;
}

export class AdvancedSearchEngine {
  private organizationId: string;
  private userId: string;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Execute search query
   */
  async search<T = unknown>(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse<T>> {
    const startTime = Date.now();

    const searchQuery: SearchQuery = {
      id: uuidv4(),
      query: query.trim(),
      entityTypes: options.entityTypes || ['all'],
      filters: options.filters || [],
      facets: options.facets || [],
      fuzzy: options.fuzzy !== false,
      maxResults: options.maxResults || 20,
      offset: options.offset || 0,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder || 'desc',
      highlightFields: options.highlightFields || [],
      userId: this.userId,
      organizationId: this.organizationId,
      timestamp: new Date(),
    };

    // Check cache
    const cacheKey = this.getCacheKey(searchQuery);
    const cachedResult = this.getFromCache<T>(cacheKey);

    if (cachedResult) {
      cachedResult.executionTime = Date.now() - startTime;
      cachedResult.cached = true;
      return cachedResult;
    }

    // Execute search
    const results = await this.executeSearch<T>(searchQuery);

    // Calculate facets
    const facets = await this.calculateFacets(searchQuery, results);

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query);

    const response: SearchResponse<T> = {
      query: searchQuery,
      results,
      total: results.length,
      page: Math.floor(searchQuery.offset / searchQuery.maxResults) + 1,
      pageSize: searchQuery.maxResults,
      totalPages: Math.ceil(results.length / searchQuery.maxResults),
      facets,
      suggestions,
      executionTime: Date.now() - startTime,
      cached: false,
    };

    // Cache result
    this.addToCache(cacheKey, response);

    // Save to search history
    await this.saveToHistory(searchQuery, response);

    return response;
  }

  /**
   * Search with autocomplete
   */
  async autocomplete(
    query: string,
    entityTypes: SearchableEntity[] = ['all'],
    limit: number = 10
  ): Promise<AutocompleteResult[]> {
    if (query.length < 2) {
      return [];
    }

    // Get suggestions from index
    const suggestions = await this.getAutocompleteSuggestions(
      query,
      entityTypes,
      limit
    );

    return suggestions;
  }

  /**
   * Get search history
   */
  async getSearchHistory(limit: number = 20): Promise<SearchQuery[]> {
    // Query from database
    return [];
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(
    entityType?: SearchableEntity,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    // Query from database
    return [];
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    // Delete from database
  }

  /**
   * Build search index
   */
  async buildIndex(
    entityType: SearchableEntity,
    entities: unknown[]
  ): Promise<void> {
    // Index entities for search
    for (const entity of entities) {
      await this.indexEntity(entityType, entity);
    }
  }

  /**
   * Update search index
   */
  async updateIndex(
    entityType: SearchableEntity,
    entityId: string,
    entity: unknown
  ): Promise<void> {
    await this.indexEntity(entityType, entity);
  }

  /**
   * Delete from search index
   */
  async deleteFromIndex(
    entityType: SearchableEntity,
    entityId: string
  ): Promise<void> {
    // Remove from index
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get search statistics
   */
  async getSearchStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<SearchStatistics> {
    // Query statistics from database
    return {
      totalSearches: 0,
      uniqueUsers: 0,
      topQueries: [],
      topEntityTypes: [],
      averageResultCount: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      noResultsRate: 0,
    };
  }

  // Private helper methods

  private async executeSearch<T>(
    query: SearchQuery
  ): Promise<SearchResult<T>[]> {
    const results: SearchResult<T>[] = [];

    // This would use Elasticsearch, Algolia, or similar in production
    // For now, we'll return a placeholder

    // Apply filters
    let filteredResults = results;

    for (const filter of query.filters) {
      filteredResults = this.applyFilter(filteredResults, filter);
    }

    // Apply fuzzy matching if enabled
    if (query.fuzzy) {
      filteredResults = this.applyFuzzyMatching(filteredResults, query.query);
    }

    // Sort results
    if (query.sortBy) {
      filteredResults = this.sortResults(
        filteredResults,
        query.sortBy,
        query.sortOrder
      );
    } else {
      // Sort by relevance score
      filteredResults.sort((a, b) => b.score - a.score);
    }

    // Apply pagination
    const start = query.offset;
    const end = start + query.maxResults;
    filteredResults = filteredResults.slice(start, end);

    // Apply highlighting
    if (query.highlightFields.length > 0) {
      filteredResults = this.applyHighlighting(
        filteredResults,
        query.query,
        query.highlightFields
      );
    }

    return filteredResults;
  }

  private applyFilter<T>(
    results: SearchResult<T>[],
    filter: SearchFilter
  ): SearchResult<T>[] {
    return results.filter((result) => {
      const fieldValue = this.getFieldValue(result.data, filter.field);

      switch (filter.operator) {
        case 'eq':
          return fieldValue === filter.value;
        case 'ne':
          return fieldValue !== filter.value;
        case 'gt':
          return fieldValue > filter.value;
        case 'gte':
          return fieldValue >= filter.value;
        case 'lt':
          return fieldValue < filter.value;
        case 'lte':
          return fieldValue <= filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'nin':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        case 'contains':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().includes(String(filter.value).toLowerCase());
        case 'startsWith':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().startsWith(String(filter.value).toLowerCase());
        case 'endsWith':
          return typeof fieldValue === 'string' &&
            fieldValue.toLowerCase().endsWith(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  }

  private applyFuzzyMatching<T>(
    results: SearchResult<T>[],
    query: string
  ): SearchResult<T>[] {
    // Apply Levenshtein distance or similar fuzzy matching
    return results;
  }

  private sortResults<T>(
    results: SearchResult<T>[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): SearchResult<T>[] {
    return results.sort((a, b) => {
      const aValue = this.getFieldValue(a.data, sortBy);
      const bValue = this.getFieldValue(b.data, sortBy);

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applyHighlighting<T>(
    results: SearchResult<T>[],
    query: string,
    fields: string[]
  ): SearchResult<T>[] {
    const queryTerms = query.toLowerCase().split(' ');

    return results.map((result) => {
      const highlights: Record<string, string[]> = {};

      for (const field of fields) {
        const fieldValue = this.getFieldValue(result.data, field);

        if (typeof fieldValue === 'string') {
          const highlighted = this.highlightText(fieldValue, queryTerms);
          if (highlighted !== fieldValue) {
            highlights[field] = [highlighted];
          }
        }
      }

      return {
        ...result,
        highlights,
      };
    });
  }

  private highlightText(text: string, terms: string[]): string {
    let highlighted = text;

    for (const term of terms) {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    }

    return highlighted;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async calculateFacets<T>(
    query: SearchQuery,
    results: SearchResult<T>[]
  ): Promise<FacetResult[]> {
    const facets: FacetResult[] = [];

    for (const facetField of query.facets) {
      const values = new Map<string, number>();

      for (const result of results) {
        const fieldValue = this.getFieldValue(result.data, facetField);
        const valueKey = String(fieldValue);
        values.set(valueKey, (values.get(valueKey) || 0) + 1);
      }

      facets.push({
        field: facetField,
        type: 'terms',
        values: Array.from(values.entries()).map(([value, count]) => ({
          value,
          count,
          selected: false,
        })),
      });
    }

    return facets;
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    // Generate search suggestions based on query
    return [];
  }

  private async getAutocompleteSuggestions(
    query: string,
    entityTypes: SearchableEntity[],
    limit: number
  ): Promise<AutocompleteResult[]> {
    // Get autocomplete suggestions
    return [];
  }

  private getFieldValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private getCacheKey(query: SearchQuery): string {
    return `${query.query}:${query.entityTypes.join(',')}:${JSON.stringify(query.filters)}:${query.offset}:${query.maxResults}`;
  }

  private getFromCache<T>(key: string): SearchResponse<T> | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as SearchResponse<T>;
  }

  private addToCache<T>(key: string, data: SearchResponse<T>): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private async saveToHistory(
    query: SearchQuery,
    response: SearchResponse
  ): Promise<void> {
    // Save to database
  }

  private async indexEntity(
    entityType: SearchableEntity,
    entity: unknown
  ): Promise<void> {
    // Index entity in search engine
  }
}

interface SearchOptions {
  entityTypes?: SearchableEntity[];
  filters?: SearchFilter[];
  facets?: string[];
  fuzzy?: boolean;
  maxResults?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  highlightFields?: string[];
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface AutocompleteResult {
  text: string;
  entityType: SearchableEntity;
  score: number;
  highlight?: string;
}

interface SearchStatistics {
  totalSearches: number;
  uniqueUsers: number;
  topQueries: Array<{ query: string; count: number }>;
  topEntityTypes: Array<{ type: SearchableEntity; count: number }>;
  averageResultCount: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  noResultsRate: number;
}

export default AdvancedSearchEngine;
