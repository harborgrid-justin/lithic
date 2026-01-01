/**
 * Dashboard Builder Engine
 * Provides drag-drop dashboard building, widget configuration, and layout persistence
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const WidgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  w: z.number().min(1).max(12),
  h: z.number().min(1),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
});

export const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  position: WidgetPositionSchema,
  dataSource: z.object({
    type: z.enum(['api', 'query', 'static', 'realtime']),
    endpoint: z.string().optional(),
    query: z.string().optional(),
    data: z.any().optional(),
    refreshInterval: z.number().optional(),
  }),
  config: z.record(z.any()),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
  styling: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    fontSize: z.string().optional(),
  }).optional(),
});

export const DashboardLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['executive', 'clinical', 'financial', 'operational', 'custom']),
  widgets: z.array(WidgetConfigSchema),
  globalFilters: z.array(z.object({
    id: z.string(),
    field: z.string(),
    type: z.enum(['date', 'select', 'multiselect', 'text']),
    label: z.string(),
    defaultValue: z.any().optional(),
  })).optional(),
  settings: z.object({
    refreshInterval: z.number().optional(),
    autoRefresh: z.boolean().optional(),
    showFilters: z.boolean().optional(),
    showExport: z.boolean().optional(),
    showFullscreen: z.boolean().optional(),
  }).optional(),
  permissions: z.object({
    roles: z.array(z.string()),
    users: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    createdBy: z.string(),
    createdAt: z.string(),
    updatedBy: z.string(),
    updatedAt: z.string(),
    version: z.number(),
  }),
});

export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;

// ============================================================================
// Dashboard Builder Class
// ============================================================================

export class DashboardBuilder {
  private dashboard: Partial<DashboardLayout>;
  private widgets: Map<string, WidgetConfig>;

  constructor(existingDashboard?: DashboardLayout) {
    this.dashboard = existingDashboard || {
      widgets: [],
      settings: {
        refreshInterval: 60000,
        autoRefresh: true,
        showFilters: true,
        showExport: true,
        showFullscreen: true,
      },
    };
    this.widgets = new Map(
      this.dashboard.widgets?.map(w => [w.id, w]) || []
    );
  }

  /**
   * Set dashboard metadata
   */
  setMetadata(data: {
    id?: string;
    name?: string;
    description?: string;
    category?: DashboardLayout['category'];
  }): this {
    Object.assign(this.dashboard, data);
    return this;
  }

  /**
   * Add a widget to the dashboard
   */
  addWidget(widget: WidgetConfig): this {
    const validated = WidgetConfigSchema.parse(widget);
    this.widgets.set(validated.id, validated);
    return this;
  }

  /**
   * Remove a widget from the dashboard
   */
  removeWidget(widgetId: string): this {
    this.widgets.delete(widgetId);
    return this;
  }

  /**
   * Update widget position
   */
  updateWidgetPosition(widgetId: string, position: Partial<WidgetPosition>): this {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    widget.position = {
      ...widget.position,
      ...position,
    };

    this.widgets.set(widgetId, widget);
    return this;
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(widgetId: string, config: Partial<WidgetConfig>): this {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    const updated = {
      ...widget,
      ...config,
      position: config.position ? { ...widget.position, ...config.position } : widget.position,
      config: config.config ? { ...widget.config, ...config.config } : widget.config,
    };

    this.widgets.set(widgetId, updated);
    return this;
  }

  /**
   * Update widget data source
   */
  updateWidgetDataSource(
    widgetId: string,
    dataSource: Partial<WidgetConfig['dataSource']>
  ): this {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    widget.dataSource = {
      ...widget.dataSource,
      ...dataSource,
    };

    this.widgets.set(widgetId, widget);
    return this;
  }

  /**
   * Clone a widget
   */
  cloneWidget(widgetId: string, newId: string): this {
    const widget = this.widgets.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    const cloned = {
      ...widget,
      id: newId,
      title: `${widget.title} (Copy)`,
      position: {
        ...widget.position,
        x: Math.min(widget.position.x + 1, 12 - widget.position.w),
        y: widget.position.y + widget.position.h,
      },
    };

    this.widgets.set(newId, cloned);
    return this;
  }

  /**
   * Add global filter
   */
  addGlobalFilter(filter: DashboardLayout['globalFilters'][0]): this {
    if (!this.dashboard.globalFilters) {
      this.dashboard.globalFilters = [];
    }
    this.dashboard.globalFilters.push(filter);
    return this;
  }

  /**
   * Remove global filter
   */
  removeGlobalFilter(filterId: string): this {
    if (this.dashboard.globalFilters) {
      this.dashboard.globalFilters = this.dashboard.globalFilters.filter(
        f => f.id !== filterId
      );
    }
    return this;
  }

  /**
   * Update dashboard settings
   */
  updateSettings(settings: Partial<DashboardLayout['settings']>): this {
    this.dashboard.settings = {
      ...this.dashboard.settings,
      ...settings,
    };
    return this;
  }

  /**
   * Set permissions
   */
  setPermissions(permissions: DashboardLayout['permissions']): this {
    this.dashboard.permissions = permissions;
    return this;
  }

  /**
   * Auto-layout widgets in grid
   */
  autoLayout(columns: number = 12): this {
    const widgets = Array.from(this.widgets.values());
    let currentY = 0;
    let currentX = 0;
    let rowHeight = 0;

    widgets.forEach(widget => {
      // If widget doesn't fit in current row, move to next row
      if (currentX + widget.position.w > columns) {
        currentY += rowHeight;
        currentX = 0;
        rowHeight = 0;
      }

      widget.position.x = currentX;
      widget.position.y = currentY;

      currentX += widget.position.w;
      rowHeight = Math.max(rowHeight, widget.position.h);

      this.widgets.set(widget.id, widget);
    });

    return this;
  }

  /**
   * Optimize layout to remove gaps
   */
  optimizeLayout(): this {
    const widgets = Array.from(this.widgets.values());

    // Sort by y position, then x position
    widgets.sort((a, b) => {
      if (a.position.y === b.position.y) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    // Compact vertically
    const grid: boolean[][] = [];

    widgets.forEach(widget => {
      // Find first available position
      let placed = false;
      for (let y = 0; !placed && y < 100; y++) {
        for (let x = 0; !placed && x <= 12 - widget.position.w; x++) {
          if (this.canPlaceWidget(grid, x, y, widget.position.w, widget.position.h)) {
            widget.position.x = x;
            widget.position.y = y;
            this.markGridCells(grid, x, y, widget.position.w, widget.position.h);
            this.widgets.set(widget.id, widget);
            placed = true;
          }
        }
      }
    });

    return this;
  }

  /**
   * Helper: Check if widget can be placed at position
   */
  private canPlaceWidget(
    grid: boolean[][],
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (grid[y + dy]?.[x + dx]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Helper: Mark grid cells as occupied
   */
  private markGridCells(
    grid: boolean[][],
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    for (let dy = 0; dy < h; dy++) {
      if (!grid[y + dy]) {
        grid[y + dy] = [];
      }
      for (let dx = 0; dx < w; dx++) {
        grid[y + dy][x + dx] = true;
      }
    }
  }

  /**
   * Validate the dashboard
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.dashboard.id) {
      errors.push('Dashboard ID is required');
    }

    if (!this.dashboard.name) {
      errors.push('Dashboard name is required');
    }

    if (!this.dashboard.category) {
      errors.push('Dashboard category is required');
    }

    // Validate widgets don't overlap
    const widgets = Array.from(this.widgets.values());
    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        if (this.widgetsOverlap(widgets[i], widgets[j])) {
          errors.push(`Widgets ${widgets[i].id} and ${widgets[j].id} overlap`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper: Check if two widgets overlap
   */
  private widgetsOverlap(a: WidgetConfig, b: WidgetConfig): boolean {
    return !(
      a.position.x + a.position.w <= b.position.x ||
      b.position.x + b.position.w <= a.position.x ||
      a.position.y + a.position.h <= b.position.y ||
      b.position.y + b.position.h <= a.position.y
    );
  }

  /**
   * Build and return the dashboard
   */
  build(): DashboardLayout {
    this.dashboard.widgets = Array.from(this.widgets.values());

    // Add metadata if not present
    if (!this.dashboard.metadata) {
      this.dashboard.metadata = {
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedBy: 'system',
        updatedAt: new Date().toISOString(),
        version: 1,
      };
    } else {
      this.dashboard.metadata.updatedAt = new Date().toISOString();
      this.dashboard.metadata.version += 1;
    }

    // Validate before building
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`Dashboard validation failed: ${validation.errors.join(', ')}`);
    }

    return DashboardLayoutSchema.parse(this.dashboard);
  }

  /**
   * Export to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }

  /**
   * Import from JSON
   */
  static fromJSON(json: string): DashboardBuilder {
    const data = JSON.parse(json);
    const validated = DashboardLayoutSchema.parse(data);
    return new DashboardBuilder(validated);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new dashboard
 */
export function createDashboard(
  name: string,
  category: DashboardLayout['category'],
  userId: string
): DashboardBuilder {
  return new DashboardBuilder()
    .setMetadata({
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
    });
}

/**
 * Load dashboard from storage
 */
export async function loadDashboard(dashboardId: string): Promise<DashboardLayout> {
  // This would typically load from database
  const response = await fetch(`/api/dashboards/${dashboardId}`);
  if (!response.ok) {
    throw new Error(`Failed to load dashboard: ${response.statusText}`);
  }
  const data = await response.json();
  return DashboardLayoutSchema.parse(data);
}

/**
 * Save dashboard to storage
 */
export async function saveDashboard(dashboard: DashboardLayout): Promise<void> {
  const response = await fetch(`/api/dashboards/${dashboard.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dashboard),
  });

  if (!response.ok) {
    throw new Error(`Failed to save dashboard: ${response.statusText}`);
  }
}

/**
 * Delete dashboard
 */
export async function deleteDashboard(dashboardId: string): Promise<void> {
  const response = await fetch(`/api/dashboards/${dashboardId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete dashboard: ${response.statusText}`);
  }
}
