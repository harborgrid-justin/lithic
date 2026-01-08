/**
 * Faceted Filter Service
 * Lithic Healthcare Platform v0.5
 *
 * Advanced faceted filtering with:
 * - Multi-select facets
 * - Range facets
 * - Date facets
 * - Hierarchical facets
 * - Dynamic facet generation
 * - Filter persistence
 */

export interface Facet {
  id: string;
  name: string;
  field: string;
  type: 'terms' | 'range' | 'date' | 'hierarchical';
  values: FacetValue[];
  displayType: 'checkbox' | 'radio' | 'slider' | 'dateRange' | 'tree';
  multiSelect: boolean;
  collapsed: boolean;
  order: number;
  showCount: boolean;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  children?: FacetValue[];
  range?: {
    from: number;
    to: number;
  };
}

export interface FacetConfig {
  id: string;
  name: string;
  field: string;
  type: 'terms' | 'range' | 'date' | 'hierarchical';
  displayType?: 'checkbox' | 'radio' | 'slider' | 'dateRange' | 'tree';
  multiSelect?: boolean;
  collapsed?: boolean;
  order?: number;
  showCount?: boolean;
  ranges?: Array<{ from: number; to: number; label: string }>;
  dateRanges?: Array<{ from: string; to: string; label: string }>;
  hierarchy?: string[];
}

export interface FilterState {
  facetId: string;
  values: string[];
  range?: {
    from: number;
    to: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export class FacetedFilterService {
  private facets: Map<string, Facet> = new Map();
  private filterState: Map<string, FilterState> = new Map();

  /**
   * Register a facet
   */
  registerFacet(config: FacetConfig): Facet {
    const facet: Facet = {
      id: config.id,
      name: config.name,
      field: config.field,
      type: config.type,
      values: [],
      displayType: config.displayType || this.getDefaultDisplayType(config.type),
      multiSelect: config.multiSelect !== false,
      collapsed: config.collapsed || false,
      order: config.order || 0,
      showCount: config.showCount !== false,
    };

    this.facets.set(facet.id, facet);

    return facet;
  }

  /**
   * Build facets from data
   */
  buildFacets<T>(data: T[], facetConfigs: FacetConfig[]): Facet[] {
    const facets: Facet[] = [];

    for (const config of facetConfigs) {
      const facet = this.registerFacet(config);

      switch (config.type) {
        case 'terms':
          facet.values = this.buildTermsFacet(data, config.field);
          break;
        case 'range':
          facet.values = this.buildRangeFacet(data, config.field, config.ranges);
          break;
        case 'date':
          facet.values = this.buildDateFacet(data, config.field, config.dateRanges);
          break;
        case 'hierarchical':
          facet.values = this.buildHierarchicalFacet(
            data,
            config.field,
            config.hierarchy || []
          );
          break;
      }

      facets.push(facet);
    }

    return facets.sort((a, b) => a.order - b.order);
  }

  /**
   * Apply filters to data
   */
  applyFilters<T>(data: T[], filterState: Map<string, FilterState>): T[] {
    let filtered = data;

    for (const [facetId, state] of filterState.entries()) {
      const facet = this.facets.get(facetId);

      if (!facet) continue;

      filtered = this.applyFacetFilter(filtered, facet, state);
    }

    return filtered;
  }

  /**
   * Update facet values based on current filter state
   */
  updateFacetCounts<T>(
    data: T[],
    facets: Facet[],
    currentFilterState: Map<string, FilterState>
  ): Facet[] {
    return facets.map((facet) => {
      // Create temporary filter state without current facet
      const tempFilterState = new Map(currentFilterState);
      tempFilterState.delete(facet.id);

      // Apply all other filters
      const filteredData = this.applyFilters(data, tempFilterState);

      // Recalculate counts
      const updatedValues = this.recalculateCounts(
        filteredData,
        facet.field,
        facet.values
      );

      return {
        ...facet,
        values: updatedValues,
      };
    });
  }

  /**
   * Select facet value
   */
  selectFacetValue(
    facetId: string,
    value: string,
    multiSelect: boolean = true
  ): FilterState {
    let state = this.filterState.get(facetId);

    if (!state) {
      state = {
        facetId,
        values: [],
      };
    }

    if (multiSelect) {
      if (state.values.includes(value)) {
        state.values = state.values.filter((v) => v !== value);
      } else {
        state.values.push(value);
      }
    } else {
      state.values = [value];
    }

    this.filterState.set(facetId, state);

    return state;
  }

  /**
   * Deselect facet value
   */
  deselectFacetValue(facetId: string, value: string): FilterState {
    const state = this.filterState.get(facetId);

    if (state) {
      state.values = state.values.filter((v) => v !== value);
      this.filterState.set(facetId, state);
    }

    return state || { facetId, values: [] };
  }

  /**
   * Clear facet selection
   */
  clearFacet(facetId: string): void {
    this.filterState.delete(facetId);
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.filterState.clear();
  }

  /**
   * Get active filters
   */
  getActiveFilters(): FilterState[] {
    return Array.from(this.filterState.values()).filter(
      (state) => state.values.length > 0 || state.range || state.dateRange
    );
  }

  /**
   * Get filter state
   */
  getFilterState(): Map<string, FilterState> {
    return new Map(this.filterState);
  }

  /**
   * Set filter state
   */
  setFilterState(state: Map<string, FilterState>): void {
    this.filterState = new Map(state);
  }

  /**
   * Export filter state to URL parameters
   */
  exportToURLParams(): URLSearchParams {
    const params = new URLSearchParams();

    for (const [facetId, state] of this.filterState.entries()) {
      if (state.values.length > 0) {
        params.set(facetId, state.values.join(','));
      }

      if (state.range) {
        params.set(`${facetId}_range`, `${state.range.from}-${state.range.to}`);
      }

      if (state.dateRange) {
        params.set(
          `${facetId}_date`,
          `${state.dateRange.from.toISOString()}-${state.dateRange.to.toISOString()}`
        );
      }
    }

    return params;
  }

  /**
   * Import filter state from URL parameters
   */
  importFromURLParams(params: URLSearchParams): void {
    this.clearAllFilters();

    for (const [key, value] of params.entries()) {
      if (key.endsWith('_range')) {
        const facetId = key.replace('_range', '');
        const [from, to] = value.split('-').map(Number);

        this.filterState.set(facetId, {
          facetId,
          values: [],
          range: { from, to },
        });
      } else if (key.endsWith('_date')) {
        const facetId = key.replace('_date', '');
        const [from, to] = value.split('-').map((d) => new Date(d));

        this.filterState.set(facetId, {
          facetId,
          values: [],
          dateRange: { from, to },
        });
      } else {
        const values = value.split(',');

        this.filterState.set(key, {
          facetId: key,
          values,
        });
      }
    }
  }

  // Private helper methods

  private getDefaultDisplayType(
    type: 'terms' | 'range' | 'date' | 'hierarchical'
  ): 'checkbox' | 'radio' | 'slider' | 'dateRange' | 'tree' {
    switch (type) {
      case 'terms':
        return 'checkbox';
      case 'range':
        return 'slider';
      case 'date':
        return 'dateRange';
      case 'hierarchical':
        return 'tree';
    }
  }

  private buildTermsFacet<T>(data: T[], field: string): FacetValue[] {
    const valueCounts = new Map<string, number>();

    for (const item of data) {
      const value = this.getFieldValue(item, field);

      if (value !== null && value !== undefined) {
        const valueStr = String(value);
        valueCounts.set(valueStr, (valueCounts.get(valueStr) || 0) + 1);
      }
    }

    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        value,
        label: value,
        count,
        selected: false,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private buildRangeFacet<T>(
    data: T[],
    field: string,
    ranges?: Array<{ from: number; to: number; label: string }>
  ): FacetValue[] {
    if (!ranges) {
      // Auto-generate ranges based on data
      ranges = this.generateRanges(data, field);
    }

    return ranges.map((range) => {
      const count = data.filter((item) => {
        const value = Number(this.getFieldValue(item, field));
        return value >= range.from && value < range.to;
      }).length;

      return {
        value: `${range.from}-${range.to}`,
        label: range.label,
        count,
        selected: false,
        range: {
          from: range.from,
          to: range.to,
        },
      };
    });
  }

  private buildDateFacet<T>(
    data: T[],
    field: string,
    ranges?: Array<{ from: string; to: string; label: string }>
  ): FacetValue[] {
    const defaultRanges = [
      { from: 'now-1d', to: 'now', label: 'Last 24 hours' },
      { from: 'now-7d', to: 'now', label: 'Last 7 days' },
      { from: 'now-30d', to: 'now', label: 'Last 30 days' },
      { from: 'now-90d', to: 'now', label: 'Last 90 days' },
      { from: 'now-1y', to: 'now', label: 'Last year' },
    ];

    const dateRanges = ranges || defaultRanges;

    return dateRanges.map((range) => {
      const fromDate = this.parseDateRange(range.from);
      const toDate = this.parseDateRange(range.to);

      const count = data.filter((item) => {
        const value = new Date(this.getFieldValue(item, field) as string);
        return value >= fromDate && value <= toDate;
      }).length;

      return {
        value: `${range.from}|${range.to}`,
        label: range.label,
        count,
        selected: false,
      };
    });
  }

  private buildHierarchicalFacet<T>(
    data: T[],
    field: string,
    hierarchy: string[]
  ): FacetValue[] {
    // Build tree structure
    const tree = new Map<string, Map<string, number>>();

    for (const item of data) {
      const value = this.getFieldValue(item, field);

      if (typeof value === 'string') {
        const parts = value.split('/');

        let currentLevel = tree;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]!;

          if (!currentLevel.has(part)) {
            currentLevel.set(part, new Map());
          }

          if (i === parts.length - 1) {
            // Leaf node - count it
            const count = (currentLevel.get(part) as any).count || 0;
            (currentLevel.get(part) as any).count = count + 1;
          } else {
            currentLevel = currentLevel.get(part) as any;
          }
        }
      }
    }

    return this.treeToFacetValues(tree);
  }

  private treeToFacetValues(
    tree: Map<string, any>,
    parentPath: string = ''
  ): FacetValue[] {
    const values: FacetValue[] = [];

    for (const [key, value] of tree.entries()) {
      const path = parentPath ? `${parentPath}/${key}` : key;

      const facetValue: FacetValue = {
        value: path,
        label: key,
        count: value.count || 0,
        selected: false,
      };

      if (value instanceof Map && value.size > 0) {
        facetValue.children = this.treeToFacetValues(value, path);
        facetValue.count = facetValue.children.reduce(
          (sum, child) => sum + child.count,
          0
        );
      }

      values.push(facetValue);
    }

    return values.sort((a, b) => b.count - a.count);
  }

  private applyFacetFilter<T>(
    data: T[],
    facet: Facet,
    state: FilterState
  ): T[] {
    if (state.values.length === 0 && !state.range && !state.dateRange) {
      return data;
    }

    return data.filter((item) => {
      const value = this.getFieldValue(item, facet.field);

      // Terms filter
      if (state.values.length > 0) {
        return state.values.includes(String(value));
      }

      // Range filter
      if (state.range) {
        const numValue = Number(value);
        return numValue >= state.range.from && numValue <= state.range.to;
      }

      // Date range filter
      if (state.dateRange) {
        const dateValue = new Date(value as string);
        return (
          dateValue >= state.dateRange.from && dateValue <= state.dateRange.to
        );
      }

      return true;
    });
  }

  private recalculateCounts<T>(
    data: T[],
    field: string,
    values: FacetValue[]
  ): FacetValue[] {
    return values.map((facetValue) => {
      let count = 0;

      if (facetValue.range) {
        count = data.filter((item) => {
          const value = Number(this.getFieldValue(item, field));
          return (
            value >= facetValue.range!.from && value < facetValue.range!.to
          );
        }).length;
      } else {
        count = data.filter(
          (item) => String(this.getFieldValue(item, field)) === facetValue.value
        ).length;
      }

      return {
        ...facetValue,
        count,
      };
    });
  }

  private getFieldValue<T>(obj: T, path: string): unknown {
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

  private generateRanges<T>(
    data: T[],
    field: string
  ): Array<{ from: number; to: number; label: string }> {
    const values = data
      .map((item) => Number(this.getFieldValue(item, field)))
      .filter((v) => !isNaN(v));

    if (values.length === 0) {
      return [];
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const step = range / 5;

    const ranges: Array<{ from: number; to: number; label: string }> = [];

    for (let i = 0; i < 5; i++) {
      const from = min + step * i;
      const to = min + step * (i + 1);

      ranges.push({
        from,
        to,
        label: `${from.toFixed(0)} - ${to.toFixed(0)}`,
      });
    }

    return ranges;
  }

  private parseDateRange(range: string): Date {
    const now = new Date();

    if (range === 'now') {
      return now;
    }

    const match = range.match(/now-(\d+)([dmyMh])/);

    if (match) {
      const amount = parseInt(match[1]!);
      const unit = match[2];

      switch (unit) {
        case 'h':
          return new Date(now.getTime() - amount * 60 * 60 * 1000);
        case 'd':
          return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
        case 'M':
          return new Date(now.setMonth(now.getMonth() - amount));
        case 'y':
          return new Date(now.setFullYear(now.getFullYear() - amount));
        default:
          return now;
      }
    }

    return new Date(range);
  }
}

export default FacetedFilterService;
