/**
 * Widget Registry
 * Central registry for all dashboard widget types, schemas, and custom widgets
 */

import { z } from 'zod';
import type { ComponentType } from 'react';

// ============================================================================
// Base Widget Schema
// ============================================================================

export const BaseWidgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  category: z.enum([
    'metrics',
    'charts',
    'tables',
    'maps',
    'gauges',
    'lists',
    'custom'
  ]),
  defaultSize: z.object({
    w: z.number(),
    h: z.number(),
  }),
  minSize: z.object({
    w: z.number(),
    h: z.number(),
  }).optional(),
  maxSize: z.object({
    w: z.number(),
    h: z.number(),
  }).optional(),
  configSchema: z.record(z.any()),
  dataSchema: z.record(z.any()).optional(),
  preview: z.string().optional(),
});

export type WidgetDefinition = z.infer<typeof BaseWidgetSchema> & {
  component: ComponentType<any>;
};

// ============================================================================
// Widget Type Definitions
// ============================================================================

export const WIDGET_TYPES = {
  // Metrics
  METRIC_CARD: {
    id: 'metric-card',
    name: 'Metric Card',
    description: 'Single metric with trend indicator and sparkline',
    icon: 'BarChart2',
    category: 'metrics' as const,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    configSchema: {
      metric: { type: 'string', required: true },
      label: { type: 'string', required: true },
      format: { type: 'string', enum: ['number', 'currency', 'percentage', 'duration'] },
      showTrend: { type: 'boolean', default: true },
      showSparkline: { type: 'boolean', default: true },
      thresholds: {
        type: 'array',
        items: {
          value: 'number',
          color: 'string',
          operator: { enum: ['gt', 'gte', 'lt', 'lte', 'eq'] },
        },
      },
    },
  },

  // Charts
  LINE_CHART: {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Time series line chart with multi-series support',
    icon: 'TrendingUp',
    category: 'charts' as const,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    configSchema: {
      series: {
        type: 'array',
        required: true,
        items: {
          name: 'string',
          dataKey: 'string',
          color: 'string',
        },
      },
      xAxis: {
        type: 'object',
        properties: {
          dataKey: 'string',
          label: 'string',
          type: { enum: ['datetime', 'category', 'number'] },
        },
      },
      yAxis: {
        type: 'object',
        properties: {
          label: 'string',
          format: { enum: ['number', 'currency', 'percentage'] },
        },
      },
      showGrid: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true },
      showTooltip: { type: 'boolean', default: true },
      annotations: {
        type: 'array',
        items: {
          value: 'number',
          label: 'string',
          color: 'string',
        },
      },
    },
  },

  BAR_CHART: {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Bar or column chart with stacked/grouped support',
    icon: 'BarChart',
    category: 'charts' as const,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    configSchema: {
      orientation: { type: 'string', enum: ['vertical', 'horizontal'], default: 'vertical' },
      mode: { type: 'string', enum: ['grouped', 'stacked'], default: 'grouped' },
      series: {
        type: 'array',
        required: true,
        items: {
          name: 'string',
          dataKey: 'string',
          color: 'string',
        },
      },
      xAxis: { type: 'object' },
      yAxis: { type: 'object' },
      showGrid: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true },
    },
  },

  PIE_CHART: {
    id: 'pie-chart',
    name: 'Pie Chart',
    description: 'Pie or donut chart with drill-down support',
    icon: 'PieChart',
    category: 'charts' as const,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    configSchema: {
      variant: { type: 'string', enum: ['pie', 'donut'], default: 'pie' },
      dataKey: { type: 'string', required: true },
      nameKey: { type: 'string', required: true },
      showLabels: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true },
      showPercentage: { type: 'boolean', default: true },
      colors: { type: 'array', items: 'string' },
    },
  },

  // Gauges
  GAUGE: {
    id: 'gauge',
    name: 'Gauge',
    description: 'Gauge or speedometer visualization',
    icon: 'Gauge',
    category: 'gauges' as const,
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    configSchema: {
      value: { type: 'number', required: true },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      target: { type: 'number' },
      format: { type: 'string', enum: ['number', 'percentage'] },
      thresholds: {
        type: 'array',
        items: {
          value: 'number',
          color: 'string',
        },
      },
      showNeedle: { type: 'boolean', default: true },
    },
  },

  // Tables
  DATA_TABLE: {
    id: 'data-table',
    name: 'Data Table',
    description: 'Interactive data table with sorting and filtering',
    icon: 'Table',
    category: 'tables' as const,
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    configSchema: {
      columns: {
        type: 'array',
        required: true,
        items: {
          key: 'string',
          label: 'string',
          type: { enum: ['string', 'number', 'date', 'currency', 'percentage', 'badge'] },
          sortable: 'boolean',
          filterable: 'boolean',
          width: 'number',
        },
      },
      pageSize: { type: 'number', default: 10 },
      showPagination: { type: 'boolean', default: true },
      showSearch: { type: 'boolean', default: true },
      showExport: { type: 'boolean', default: true },
      selectable: { type: 'boolean', default: false },
    },
  },

  // Heat Maps
  HEATMAP: {
    id: 'heatmap',
    name: 'Heat Map',
    description: 'Heat map for time-based pattern visualization',
    icon: 'Grid',
    category: 'charts' as const,
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 6, h: 3 },
    configSchema: {
      xAxis: { type: 'string', required: true },
      yAxis: { type: 'string', required: true },
      valueKey: { type: 'string', required: true },
      colorScale: {
        type: 'array',
        items: 'string',
        default: ['#green-100', '#green-500', '#green-900'],
      },
      showValues: { type: 'boolean', default: false },
      cellSize: { type: 'number', default: 40 },
    },
  },

  // Maps
  GEO_MAP: {
    id: 'geo-map',
    name: 'Geographic Map',
    description: 'Geographic visualization with facility markers',
    icon: 'Map',
    category: 'maps' as const,
    defaultSize: { w: 8, h: 6 },
    minSize: { w: 6, h: 4 },
    configSchema: {
      mapType: { type: 'string', enum: ['markers', 'regions', 'heatmap'], default: 'markers' },
      center: {
        type: 'object',
        properties: {
          lat: 'number',
          lng: 'number',
        },
      },
      zoom: { type: 'number', default: 10 },
      markers: {
        type: 'array',
        items: {
          lat: 'number',
          lng: 'number',
          label: 'string',
          value: 'number',
        },
      },
      showLegend: { type: 'boolean', default: true },
    },
  },
} as const;

// ============================================================================
// Widget Registry Class
// ============================================================================

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetDefinition>;

  private constructor() {
    this.widgets = new Map();
    this.registerDefaultWidgets();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * Register default widget types
   */
  private registerDefaultWidgets(): void {
    // Note: Components would be imported and registered here
    // For now, we'll register the schemas
    Object.values(WIDGET_TYPES).forEach(widget => {
      this.widgets.set(widget.id, {
        ...widget,
        component: null as any, // Would be actual component
      });
    });
  }

  /**
   * Register a custom widget
   */
  register(widget: WidgetDefinition): void {
    const validated = BaseWidgetSchema.parse(widget);
    this.widgets.set(validated.id, widget);
  }

  /**
   * Unregister a widget
   */
  unregister(widgetId: string): void {
    this.widgets.delete(widgetId);
  }

  /**
   * Get widget definition
   */
  get(widgetId: string): WidgetDefinition | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * Get all widgets
   */
  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: WidgetDefinition['category']): WidgetDefinition[] {
    return Array.from(this.widgets.values()).filter(
      widget => widget.category === category
    );
  }

  /**
   * Search widgets
   */
  search(query: string): WidgetDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.widgets.values()).filter(
      widget =>
        widget.name.toLowerCase().includes(lowerQuery) ||
        widget.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Validate widget configuration
   */
  validateConfig(widgetId: string, config: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      return {
        valid: false,
        errors: [`Widget ${widgetId} not found`],
      };
    }

    const errors: string[] = [];
    const schema = widget.configSchema;

    // Basic validation
    Object.entries(schema).forEach(([key, rules]: [string, any]) => {
      if (rules.required && !(key in config)) {
        errors.push(`${key} is required`);
      }

      if (key in config) {
        const value = config[key];

        if (rules.type && typeof value !== rules.type && !Array.isArray(value)) {
          errors.push(`${key} must be of type ${rules.type}`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get widget categories
   */
  getCategories(): Array<{
    id: string;
    name: string;
    count: number;
  }> {
    const categories = new Map<string, number>();

    this.widgets.forEach(widget => {
      categories.set(
        widget.category,
        (categories.get(widget.category) || 0) + 1
      );
    });

    return Array.from(categories.entries()).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      count,
    }));
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const widgetRegistry = WidgetRegistry.getInstance();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create widget instance with default config
 */
export function createWidget(
  widgetType: string,
  overrides?: Partial<any>
): any {
  const definition = widgetRegistry.get(widgetType);
  if (!definition) {
    throw new Error(`Widget type ${widgetType} not found`);
  }

  const defaults: Record<string, any> = {};
  Object.entries(definition.configSchema).forEach(([key, rules]: [string, any]) => {
    if ('default' in rules) {
      defaults[key] = rules.default;
    }
  });

  return {
    id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: widgetType,
    title: definition.name,
    position: {
      x: 0,
      y: 0,
      ...definition.defaultSize,
      minW: definition.minSize?.w,
      minH: definition.minSize?.h,
      maxW: definition.maxSize?.w,
      maxH: definition.maxSize?.h,
    },
    dataSource: {
      type: 'api',
      endpoint: '',
    },
    config: {
      ...defaults,
      ...overrides,
    },
  };
}

/**
 * Get widget template for quick creation
 */
export function getWidgetTemplate(widgetType: string): any {
  return createWidget(widgetType);
}
