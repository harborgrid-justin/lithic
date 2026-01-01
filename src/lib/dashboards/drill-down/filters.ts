/**
 * Dashboard Filters
 * Global filter management, cross-widget filtering, and date range presets
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const FilterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'between',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
]);

export const FilterTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'datetime',
  'select',
  'multiselect',
  'boolean',
  'range',
]);

export const FilterDefinitionSchema = z.object({
  id: z.string(),
  field: z.string(),
  label: z.string(),
  type: FilterTypeSchema,
  operator: FilterOperatorSchema.optional(),
  value: z.any(),
  options: z.array(z.object({
    value: z.any(),
    label: z.string(),
  })).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

export const DateRangePresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type FilterOperator = z.infer<typeof FilterOperatorSchema>;
export type FilterType = z.infer<typeof FilterTypeSchema>;
export type FilterDefinition = z.infer<typeof FilterDefinitionSchema>;
export type DateRangePreset = z.infer<typeof DateRangePresetSchema>;

// ============================================================================
// Date Range Presets
// ============================================================================

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    id: 'today',
    label: 'Today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  },
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'last-90-days',
    label: 'Last 90 Days',
    startDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'month-to-date',
    label: 'Month to Date',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'quarter-to-date',
    label: 'Quarter to Date',
    startDate: getQuarterStart(new Date()).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'year-to-date',
    label: 'Year to Date',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'last-month',
    label: 'Last Month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
  },
  {
    id: 'last-quarter',
    label: 'Last Quarter',
    startDate: getLastQuarterStart().toISOString().split('T')[0],
    endDate: getLastQuarterEnd().toISOString().split('T')[0],
  },
  {
    id: 'last-year',
    label: 'Last Year',
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0],
  },
];

// ============================================================================
// Filter Manager
// ============================================================================

export class FilterManager {
  private filters: Map<string, FilterDefinition>;
  private subscriptions: Map<string, Set<(filters: Map<string, FilterDefinition>) => void>>;

  constructor() {
    this.filters = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Add or update filter
   */
  setFilter(filter: FilterDefinition): void {
    const validated = FilterDefinitionSchema.parse(filter);
    this.filters.set(validated.id, validated);
    this.notifySubscribers();
  }

  /**
   * Remove filter
   */
  removeFilter(filterId: string): void {
    this.filters.delete(filterId);
    this.notifySubscribers();
  }

  /**
   * Update filter value
   */
  updateFilterValue(filterId: string, value: any): void {
    const filter = this.filters.get(filterId);
    if (filter) {
      filter.value = value;
      this.filters.set(filterId, filter);
      this.notifySubscribers();
    }
  }

  /**
   * Get filter by ID
   */
  getFilter(filterId: string): FilterDefinition | undefined {
    return this.filters.get(filterId);
  }

  /**
   * Get all filters
   */
  getAllFilters(): FilterDefinition[] {
    return Array.from(this.filters.values());
  }

  /**
   * Get active filters (with values)
   */
  getActiveFilters(): FilterDefinition[] {
    return Array.from(this.filters.values()).filter(
      f => f.value !== undefined && f.value !== null && f.value !== ''
    );
  }

  /**
   * Clear all filters
   */
  clearAll(): void {
    this.filters.clear();
    this.notifySubscribers();
  }

  /**
   * Clear filter values (keep definitions)
   */
  clearValues(): void {
    this.filters.forEach(filter => {
      filter.value = undefined;
    });
    this.notifySubscribers();
  }

  /**
   * Get filter values as object
   */
  getFilterValues(): Record<string, any> {
    const values: Record<string, any> = {};
    this.filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        values[filter.field] = filter.value;
      }
    });
    return values;
  }

  /**
   * Set multiple filter values
   */
  setFilterValues(values: Record<string, any>): void {
    Object.entries(values).forEach(([field, value]) => {
      const filter = Array.from(this.filters.values()).find(f => f.field === field);
      if (filter) {
        this.updateFilterValue(filter.id, value);
      }
    });
  }

  /**
   * Apply filters to data
   */
  applyFilters(data: any[]): any[] {
    const activeFilters = this.getActiveFilters();

    if (activeFilters.length === 0) {
      return data;
    }

    return data.filter(row => {
      return activeFilters.every(filter => {
        return this.evaluateFilter(row, filter);
      });
    });
  }

  /**
   * Evaluate single filter against row
   */
  private evaluateFilter(row: any, filter: FilterDefinition): boolean {
    const value = row[filter.field];
    const filterValue = filter.value;
    const operator = filter.operator || 'equals';

    switch (operator) {
      case 'equals':
        return value === filterValue;

      case 'not_equals':
        return value !== filterValue;

      case 'contains':
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'not_contains':
        return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());

      case 'ends_with':
        return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());

      case 'greater_than':
        return Number(value) > Number(filterValue);

      case 'greater_than_or_equal':
        return Number(value) >= Number(filterValue);

      case 'less_than':
        return Number(value) < Number(filterValue);

      case 'less_than_or_equal':
        return Number(value) <= Number(filterValue);

      case 'between':
        if (!Array.isArray(filterValue) || filterValue.length !== 2) return false;
        return Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1]);

      case 'in':
        if (!Array.isArray(filterValue)) return false;
        return filterValue.includes(value);

      case 'not_in':
        if (!Array.isArray(filterValue)) return false;
        return !filterValue.includes(value);

      case 'is_null':
        return value === null || value === undefined;

      case 'is_not_null':
        return value !== null && value !== undefined;

      default:
        return true;
    }
  }

  /**
   * Subscribe to filter changes
   */
  subscribe(
    widgetId: string,
    callback: (filters: Map<string, FilterDefinition>) => void
  ): () => void {
    if (!this.subscriptions.has(widgetId)) {
      this.subscriptions.set(widgetId, new Set());
    }

    this.subscriptions.get(widgetId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(widgetId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(widgetId);
        }
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.subscriptions.forEach(callbacks => {
      callbacks.forEach(callback => callback(this.filters));
    });
  }

  /**
   * Export filters to JSON
   */
  toJSON(): string {
    return JSON.stringify(Array.from(this.filters.values()));
  }

  /**
   * Import filters from JSON
   */
  fromJSON(json: string): void {
    const filters = JSON.parse(json);
    this.filters.clear();
    filters.forEach((f: FilterDefinition) => this.setFilter(f));
  }
}

// ============================================================================
// Global Filter Manager
// ============================================================================

let globalFilterManager: FilterManager | null = null;

/**
 * Get or create global filter manager
 */
export function getGlobalFilterManager(): FilterManager {
  if (!globalFilterManager) {
    globalFilterManager = new FilterManager();
  }
  return globalFilterManager;
}

/**
 * Reset global filter manager
 */
export function resetGlobalFilterManager(): void {
  globalFilterManager = null;
}

// ============================================================================
// Date Range Functions
// ============================================================================

/**
 * Get quarter start date
 */
function getQuarterStart(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

/**
 * Get last quarter start date
 */
function getLastQuarterStart(): Date {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return new Date(year, lastQuarter * 3, 1);
}

/**
 * Get last quarter end date
 */
function getLastQuarterEnd(): Date {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return new Date(year, (lastQuarter + 1) * 3, 0);
}

/**
 * Apply date range preset
 */
export function applyDateRangePreset(
  presetId: string,
  filterManager: FilterManager,
  startDateFilterId: string,
  endDateFilterId: string
): void {
  const preset = DATE_RANGE_PRESETS.find(p => p.id === presetId);
  if (!preset) return;

  filterManager.updateFilterValue(startDateFilterId, preset.startDate);
  filterManager.updateFilterValue(endDateFilterId, preset.endDate);
}

/**
 * Get custom date range
 */
export function getCustomDateRange(
  startDate: string,
  endDate: string
): DateRangePreset {
  return {
    id: 'custom',
    label: 'Custom Range',
    startDate,
    endDate,
  };
}

// ============================================================================
// Common Filter Definitions
// ============================================================================

export const COMMON_FILTERS: Record<string, Omit<FilterDefinition, 'id' | 'value'>> = {
  DATE_RANGE: {
    field: 'date',
    label: 'Date Range',
    type: 'range',
    operator: 'between',
  },

  FACILITY: {
    field: 'facility',
    label: 'Facility',
    type: 'multiselect',
    operator: 'in',
  },

  DEPARTMENT: {
    field: 'department',
    label: 'Department',
    type: 'multiselect',
    operator: 'in',
  },

  SERVICE_LINE: {
    field: 'serviceLine',
    label: 'Service Line',
    type: 'multiselect',
    operator: 'in',
  },

  PAYER: {
    field: 'payer',
    label: 'Payer',
    type: 'multiselect',
    operator: 'in',
  },

  PROVIDER: {
    field: 'provider',
    label: 'Provider',
    type: 'multiselect',
    operator: 'in',
  },
};

/**
 * Create filter from common definition
 */
export function createCommonFilter(
  filterKey: keyof typeof COMMON_FILTERS,
  overrides?: Partial<FilterDefinition>
): FilterDefinition {
  const common = COMMON_FILTERS[filterKey];
  return {
    id: `filter_${filterKey.toLowerCase()}_${Date.now()}`,
    ...common,
    value: undefined,
    ...overrides,
  } as FilterDefinition;
}

/**
 * Get filter SQL clause
 */
export function getFilterSQLClause(filter: FilterDefinition): string {
  const operator = filter.operator || 'equals';
  const field = filter.field;
  const value = filter.value;

  switch (operator) {
    case 'equals':
      return `${field} = '${escapeSQLValue(value)}'`;

    case 'not_equals':
      return `${field} != '${escapeSQLValue(value)}'`;

    case 'contains':
      return `${field} LIKE '%${escapeSQLValue(value)}%'`;

    case 'not_contains':
      return `${field} NOT LIKE '%${escapeSQLValue(value)}%'`;

    case 'starts_with':
      return `${field} LIKE '${escapeSQLValue(value)}%'`;

    case 'ends_with':
      return `${field} LIKE '%${escapeSQLValue(value)}'`;

    case 'greater_than':
      return `${field} > ${value}`;

    case 'greater_than_or_equal':
      return `${field} >= ${value}`;

    case 'less_than':
      return `${field} < ${value}`;

    case 'less_than_or_equal':
      return `${field} <= ${value}`;

    case 'between':
      if (!Array.isArray(value) || value.length !== 2) return '';
      return `${field} BETWEEN ${value[0]} AND ${value[1]}`;

    case 'in':
      if (!Array.isArray(value)) return '';
      const inValues = value.map(v => `'${escapeSQLValue(v)}'`).join(', ');
      return `${field} IN (${inValues})`;

    case 'not_in':
      if (!Array.isArray(value)) return '';
      const notInValues = value.map(v => `'${escapeSQLValue(v)}'`).join(', ');
      return `${field} NOT IN (${notInValues})`;

    case 'is_null':
      return `${field} IS NULL`;

    case 'is_not_null':
      return `${field} IS NOT NULL`;

    default:
      return '';
  }
}

/**
 * Escape SQL value
 */
function escapeSQLValue(value: any): string {
  return String(value).replace(/'/g, "''");
}

/**
 * Get filter WHERE clause for multiple filters
 */
export function getFiltersWhereClause(filters: FilterDefinition[]): string {
  const clauses = filters
    .map(f => getFilterSQLClause(f))
    .filter(c => c.length > 0);

  if (clauses.length === 0) return '';

  return `WHERE ${clauses.join(' AND ')}`;
}
