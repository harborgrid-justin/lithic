/**
 * Data Connector
 * Handles data source connections, query building, and caching for dashboard widgets
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const DataSourceSchema = z.object({
  id: z.string(),
  type: z.enum(['api', 'database', 'query', 'static', 'realtime']),
  name: z.string(),
  config: z.record(z.any()),
  cacheConfig: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().default(60000), // milliseconds
    strategy: z.enum(['memory', 'redis', 'local-storage']).default('memory'),
  }).optional(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;

export interface QueryBuilder {
  select(fields: string[]): this;
  from(table: string): this;
  where(conditions: Record<string, any>): this;
  join(table: string, on: string): this;
  groupBy(fields: string[]): this;
  orderBy(field: string, direction: 'asc' | 'desc'): this;
  limit(count: number): this;
  offset(count: number): this;
  build(): string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  private cache: Map<string, CacheEntry>;
  private static instance: CacheManager;

  private constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Cleanup expired entries periodically
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      Array.from(this.cache.entries()).forEach(([key, entry]) => {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      });
    }, 60000); // Clean up every minute
  }
}

// ============================================================================
// SQL Query Builder
// ============================================================================

export class SQLQueryBuilder implements QueryBuilder {
  private query: {
    select: string[];
    from: string;
    joins: string[];
    where: string[];
    groupBy: string[];
    orderBy: string[];
    limit?: number;
    offset?: number;
  };

  constructor() {
    this.query = {
      select: [],
      from: '',
      joins: [],
      where: [],
      groupBy: [],
      orderBy: [],
    };
  }

  select(fields: string[]): this {
    this.query.select = fields;
    return this;
  }

  from(table: string): this {
    this.query.from = table;
    return this;
  }

  where(conditions: Record<string, any>): this {
    Object.entries(conditions).forEach(([field, value]) => {
      if (value === null) {
        this.query.where.push(`${field} IS NULL`);
      } else if (Array.isArray(value)) {
        const values = value.map(v => `'${this.escape(v)}'`).join(', ');
        this.query.where.push(`${field} IN (${values})`);
      } else if (typeof value === 'object' && value.operator) {
        this.query.where.push(`${field} ${value.operator} '${this.escape(value.value)}'`);
      } else {
        this.query.where.push(`${field} = '${this.escape(value)}'`);
      }
    });
    return this;
  }

  join(table: string, on: string): this {
    this.query.joins.push(`JOIN ${table} ON ${on}`);
    return this;
  }

  groupBy(fields: string[]): this {
    this.query.groupBy = fields;
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.orderBy.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  offset(count: number): this {
    this.query.offset = count;
    return this;
  }

  build(): string {
    const parts: string[] = [];

    // SELECT
    const selectClause = this.query.select.length > 0
      ? this.query.select.join(', ')
      : '*';
    parts.push(`SELECT ${selectClause}`);

    // FROM
    if (this.query.from) {
      parts.push(`FROM ${this.query.from}`);
    }

    // JOINS
    if (this.query.joins.length > 0) {
      parts.push(this.query.joins.join(' '));
    }

    // WHERE
    if (this.query.where.length > 0) {
      parts.push(`WHERE ${this.query.where.join(' AND ')}`);
    }

    // GROUP BY
    if (this.query.groupBy.length > 0) {
      parts.push(`GROUP BY ${this.query.groupBy.join(', ')}`);
    }

    // ORDER BY
    if (this.query.orderBy.length > 0) {
      parts.push(`ORDER BY ${this.query.orderBy.join(', ')}`);
    }

    // LIMIT
    if (this.query.limit !== undefined) {
      parts.push(`LIMIT ${this.query.limit}`);
    }

    // OFFSET
    if (this.query.offset !== undefined) {
      parts.push(`OFFSET ${this.query.offset}`);
    }

    return parts.join(' ');
  }

  private escape(value: any): string {
    return String(value).replace(/'/g, "''");
  }
}

// ============================================================================
// Data Connector Class
// ============================================================================

export class DataConnector {
  private cache: CacheManager;
  private dataSources: Map<string, DataSource>;

  constructor() {
    this.cache = CacheManager.getInstance();
    this.dataSources = new Map();
  }

  /**
   * Register a data source
   */
  registerDataSource(dataSource: DataSource): void {
    const validated = DataSourceSchema.parse(dataSource);
    this.dataSources.set(validated.id, validated);
  }

  /**
   * Unregister a data source
   */
  unregisterDataSource(dataSourceId: string): void {
    this.dataSources.delete(dataSourceId);
    this.cache.invalidatePattern(new RegExp(`^${dataSourceId}:`));
  }

  /**
   * Fetch data from API
   */
  async fetchFromAPI(
    endpoint: string,
    options?: RequestInit,
    cacheConfig?: DataSource['cacheConfig']
  ): Promise<any> {
    const cacheKey = `api:${endpoint}:${JSON.stringify(options)}`;

    // Check cache
    if (cacheConfig?.enabled !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch data
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache result
    if (cacheConfig?.enabled !== false) {
      this.cache.set(cacheKey, data, cacheConfig?.ttl || 60000);
    }

    return data;
  }

  /**
   * Execute database query
   */
  async executeQuery(
    dataSourceId: string,
    query: string,
    params?: any[],
    cacheConfig?: DataSource['cacheConfig']
  ): Promise<any> {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    const cacheKey = `query:${dataSourceId}:${query}:${JSON.stringify(params)}`;

    // Check cache
    if (cacheConfig?.enabled !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query (this would connect to actual database)
    const data = await this.executeQueryInternal(dataSource, query, params);

    // Cache result
    if (cacheConfig?.enabled !== false) {
      this.cache.set(cacheKey, data, cacheConfig?.ttl || 60000);
    }

    return data;
  }

  /**
   * Internal query execution (would be implemented with actual DB driver)
   */
  private async executeQueryInternal(
    dataSource: DataSource,
    query: string,
    params?: any[]
  ): Promise<any> {
    // This would use actual database connection
    // For now, return mock data
    console.log(`Executing query on ${dataSource.name}:`, query, params);
    return [];
  }

  /**
   * Fetch data for widget
   */
  async fetchWidgetData(
    widgetId: string,
    dataSource: {
      type: 'api' | 'query' | 'static' | 'realtime';
      endpoint?: string;
      query?: string;
      data?: any;
    },
    filters?: Record<string, any>,
    cacheConfig?: DataSource['cacheConfig']
  ): Promise<any> {
    switch (dataSource.type) {
      case 'api':
        if (!dataSource.endpoint) {
          throw new Error('API endpoint required');
        }
        return this.fetchFromAPI(
          this.applyFiltersToURL(dataSource.endpoint, filters),
          undefined,
          cacheConfig
        );

      case 'query':
        if (!dataSource.query) {
          throw new Error('Query required');
        }
        return this.executeQuery(
          'default',
          this.applyFiltersToQuery(dataSource.query, filters),
          undefined,
          cacheConfig
        );

      case 'static':
        return dataSource.data || [];

      case 'realtime':
        // Real-time data would be handled by WebSocket
        return this.fetchRealtimeData(widgetId, dataSource.endpoint);

      default:
        throw new Error(`Unknown data source type: ${dataSource.type}`);
    }
  }

  /**
   * Apply filters to URL
   */
  private applyFiltersToURL(url: string, filters?: Record<string, any>): string {
    if (!filters || Object.keys(filters).length === 0) {
      return url;
    }

    const urlObj = new URL(url, window.location.origin);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.set(key, String(value));
      }
    });

    return urlObj.toString();
  }

  /**
   * Apply filters to query
   */
  private applyFiltersToQuery(query: string, filters?: Record<string, any>): string {
    if (!filters || Object.keys(filters).length === 0) {
      return query;
    }

    // Simple filter injection (would be more sophisticated in production)
    let modifiedQuery = query;
    Object.entries(filters).forEach(([key, value]) => {
      modifiedQuery = modifiedQuery.replace(
        new RegExp(`\\$\\{${key}\\}`, 'g'),
        String(value)
      );
    });

    return modifiedQuery;
  }

  /**
   * Fetch real-time data (placeholder for WebSocket integration)
   */
  private async fetchRealtimeData(widgetId: string, endpoint?: string): Promise<any> {
    // This would integrate with WebSocket or SSE
    console.log(`Fetching realtime data for widget ${widgetId} from ${endpoint}`);
    return [];
  }

  /**
   * Invalidate widget cache
   */
  invalidateWidgetCache(widgetId: string): void {
    this.cache.invalidatePattern(new RegExp(`widget:${widgetId}`));
  }

  /**
   * Invalidate all cache
   */
  invalidateAllCache(): void {
    this.cache.clear();
  }

  /**
   * Create query builder
   */
  createQueryBuilder(): QueryBuilder {
    return new SQLQueryBuilder();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const dataConnector = new DataConnector();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform data for visualization
 */
export function transformData(
  data: any[],
  transformations: {
    aggregate?: {
      groupBy: string[];
      metrics: Array<{
        field: string;
        operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
        alias?: string;
      }>;
    };
    filter?: Record<string, any>;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
  }
): any[] {
  let result = [...data];

  // Apply filters
  if (transformations.filter) {
    result = result.filter(row =>
      Object.entries(transformations.filter!).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(row[key]);
        }
        return row[key] === value;
      })
    );
  }

  // Apply aggregation
  if (transformations.aggregate) {
    const grouped = new Map<string, any[]>();

    result.forEach(row => {
      const key = transformations.aggregate!.groupBy
        .map(field => row[field])
        .join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(row);
    });

    result = Array.from(grouped.entries()).map(([key, rows]) => {
      const keyValues = key.split('|');
      const aggregated: any = {};

      transformations.aggregate!.groupBy.forEach((field, i) => {
        aggregated[field] = keyValues[i];
      });

      transformations.aggregate!.metrics.forEach(metric => {
        const values = rows.map(row => row[metric.field]).filter(v => v != null);
        const alias = metric.alias || `${metric.operation}_${metric.field}`;

        switch (metric.operation) {
          case 'sum':
            aggregated[alias] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregated[alias] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            aggregated[alias] = Math.min(...values);
            break;
          case 'max':
            aggregated[alias] = Math.max(...values);
            break;
          case 'count':
            aggregated[alias] = values.length;
            break;
        }
      });

      return aggregated;
    });
  }

  // Apply sorting
  if (transformations.sort) {
    result.sort((a, b) => {
      for (const sort of transformations.sort!) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Apply limit
  if (transformations.limit) {
    result = result.slice(0, transformations.limit);
  }

  return result;
}

/**
 * Calculate KPI from data
 */
export function calculateKPI(
  data: any[],
  config: {
    field: string;
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
    filter?: Record<string, any>;
  }
): number {
  let filtered = data;

  if (config.filter) {
    filtered = data.filter(row =>
      Object.entries(config.filter!).every(([key, value]) => row[key] === value)
    );
  }

  const values = filtered.map(row => row[config.field]).filter(v => v != null);

  switch (config.operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    default:
      return 0;
  }
}
