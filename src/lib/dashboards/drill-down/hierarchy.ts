/**
 * Drill-Down Hierarchy
 * Manages drill-down paths, dimension hierarchies, and breadcrumb navigation
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const DimensionLevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  field: z.string(),
  dataType: z.enum(['string', 'number', 'date', 'category']),
  formatter: z.function().args(z.any()).returns(z.string()).optional(),
});

export const HierarchySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  levels: z.array(DimensionLevelSchema),
  category: z.enum(['time', 'geography', 'organization', 'clinical', 'financial', 'custom']),
});

export const DrillPathSchema = z.object({
  hierarchyId: z.string(),
  currentLevel: z.number(),
  selectedValues: z.array(z.object({
    level: z.number(),
    value: z.any(),
    label: z.string(),
  })),
});

export type DimensionLevel = z.infer<typeof DimensionLevelSchema>;
export type Hierarchy = z.infer<typeof HierarchySchema>;
export type DrillPath = z.infer<typeof DrillPathSchema>;

// ============================================================================
// Predefined Hierarchies
// ============================================================================

export const TIME_HIERARCHIES: Record<string, Hierarchy> = {
  STANDARD_TIME: {
    id: 'standard-time',
    name: 'Standard Time Hierarchy',
    description: 'Year > Quarter > Month > Week > Day',
    category: 'time',
    levels: [
      { id: 'year', name: 'Year', field: 'year', dataType: 'number' },
      { id: 'quarter', name: 'Quarter', field: 'quarter', dataType: 'string' },
      { id: 'month', name: 'Month', field: 'month', dataType: 'string' },
      { id: 'week', name: 'Week', field: 'week', dataType: 'string' },
      { id: 'day', name: 'Day', field: 'date', dataType: 'date' },
    ],
  },

  FISCAL_TIME: {
    id: 'fiscal-time',
    name: 'Fiscal Time Hierarchy',
    description: 'Fiscal Year > Fiscal Quarter > Fiscal Month',
    category: 'time',
    levels: [
      { id: 'fiscal-year', name: 'Fiscal Year', field: 'fiscalYear', dataType: 'number' },
      { id: 'fiscal-quarter', name: 'Fiscal Quarter', field: 'fiscalQuarter', dataType: 'string' },
      { id: 'fiscal-month', name: 'Fiscal Month', field: 'fiscalMonth', dataType: 'string' },
    ],
  },
};

export const GEOGRAPHY_HIERARCHIES: Record<string, Hierarchy> = {
  US_GEOGRAPHY: {
    id: 'us-geography',
    name: 'US Geographic Hierarchy',
    description: 'National > Region > State > City > Facility',
    category: 'geography',
    levels: [
      { id: 'national', name: 'National', field: 'country', dataType: 'string' },
      { id: 'region', name: 'Region', field: 'region', dataType: 'string' },
      { id: 'state', name: 'State', field: 'state', dataType: 'string' },
      { id: 'city', name: 'City', field: 'city', dataType: 'string' },
      { id: 'facility', name: 'Facility', field: 'facilityName', dataType: 'string' },
    ],
  },

  SERVICE_AREA: {
    id: 'service-area',
    name: 'Service Area Hierarchy',
    description: 'Health System > Market > Facility > Department',
    category: 'geography',
    levels: [
      { id: 'health-system', name: 'Health System', field: 'healthSystem', dataType: 'string' },
      { id: 'market', name: 'Market', field: 'market', dataType: 'string' },
      { id: 'facility', name: 'Facility', field: 'facilityName', dataType: 'string' },
      { id: 'department', name: 'Department', field: 'department', dataType: 'string' },
    ],
  },
};

export const ORGANIZATION_HIERARCHIES: Record<string, Hierarchy> = {
  FACILITY_STRUCTURE: {
    id: 'facility-structure',
    name: 'Facility Structure',
    description: 'Facility > Building > Floor > Unit',
    category: 'organization',
    levels: [
      { id: 'facility', name: 'Facility', field: 'facilityName', dataType: 'string' },
      { id: 'building', name: 'Building', field: 'building', dataType: 'string' },
      { id: 'floor', name: 'Floor', field: 'floor', dataType: 'string' },
      { id: 'unit', name: 'Unit', field: 'unit', dataType: 'string' },
    ],
  },

  COST_CENTER: {
    id: 'cost-center',
    name: 'Cost Center Hierarchy',
    description: 'Division > Department > Cost Center',
    category: 'organization',
    levels: [
      { id: 'division', name: 'Division', field: 'division', dataType: 'string' },
      { id: 'department', name: 'Department', field: 'department', dataType: 'string' },
      { id: 'cost-center', name: 'Cost Center', field: 'costCenter', dataType: 'string' },
    ],
  },
};

export const CLINICAL_HIERARCHIES: Record<string, Hierarchy> = {
  SERVICE_LINE: {
    id: 'service-line',
    name: 'Service Line Hierarchy',
    description: 'Service Line > Specialty > Procedure Type',
    category: 'clinical',
    levels: [
      { id: 'service-line', name: 'Service Line', field: 'serviceLine', dataType: 'string' },
      { id: 'specialty', name: 'Specialty', field: 'specialty', dataType: 'string' },
      { id: 'procedure-type', name: 'Procedure Type', field: 'procedureType', dataType: 'string' },
    ],
  },

  DIAGNOSIS: {
    id: 'diagnosis',
    name: 'Diagnosis Hierarchy',
    description: 'ICD Category > ICD Subcategory > Diagnosis Code',
    category: 'clinical',
    levels: [
      { id: 'icd-category', name: 'ICD Category', field: 'icdCategory', dataType: 'string' },
      { id: 'icd-subcategory', name: 'ICD Subcategory', field: 'icdSubcategory', dataType: 'string' },
      { id: 'diagnosis-code', name: 'Diagnosis Code', field: 'diagnosisCode', dataType: 'string' },
    ],
  },
};

export const FINANCIAL_HIERARCHIES: Record<string, Hierarchy> = {
  PAYER: {
    id: 'payer',
    name: 'Payer Hierarchy',
    description: 'Payer Type > Payer > Plan',
    category: 'financial',
    levels: [
      { id: 'payer-type', name: 'Payer Type', field: 'payerType', dataType: 'string' },
      { id: 'payer', name: 'Payer', field: 'payerName', dataType: 'string' },
      { id: 'plan', name: 'Plan', field: 'planName', dataType: 'string' },
    ],
  },

  REVENUE: {
    id: 'revenue',
    name: 'Revenue Hierarchy',
    description: 'Revenue Category > Revenue Code > CPT Code',
    category: 'financial',
    levels: [
      { id: 'revenue-category', name: 'Revenue Category', field: 'revenueCategory', dataType: 'string' },
      { id: 'revenue-code', name: 'Revenue Code', field: 'revenueCode', dataType: 'string' },
      { id: 'cpt-code', name: 'CPT Code', field: 'cptCode', dataType: 'string' },
    ],
  },
};

// ============================================================================
// Hierarchy Manager
// ============================================================================

export class HierarchyManager {
  private hierarchies: Map<string, Hierarchy>;

  constructor() {
    this.hierarchies = new Map();
    this.loadDefaultHierarchies();
  }

  /**
   * Load default hierarchies
   */
  private loadDefaultHierarchies(): void {
    const allHierarchies = [
      ...Object.values(TIME_HIERARCHIES),
      ...Object.values(GEOGRAPHY_HIERARCHIES),
      ...Object.values(ORGANIZATION_HIERARCHIES),
      ...Object.values(CLINICAL_HIERARCHIES),
      ...Object.values(FINANCIAL_HIERARCHIES),
    ];

    allHierarchies.forEach(h => this.hierarchies.set(h.id, h));
  }

  /**
   * Register a custom hierarchy
   */
  registerHierarchy(hierarchy: Hierarchy): void {
    const validated = HierarchySchema.parse(hierarchy);
    this.hierarchies.set(validated.id, validated);
  }

  /**
   * Get hierarchy by ID
   */
  getHierarchy(hierarchyId: string): Hierarchy | undefined {
    return this.hierarchies.get(hierarchyId);
  }

  /**
   * Get all hierarchies
   */
  getAllHierarchies(): Hierarchy[] {
    return Array.from(this.hierarchies.values());
  }

  /**
   * Get hierarchies by category
   */
  getHierarchiesByCategory(category: Hierarchy['category']): Hierarchy[] {
    return Array.from(this.hierarchies.values()).filter(h => h.category === category);
  }

  /**
   * Get level by index
   */
  getLevel(hierarchyId: string, levelIndex: number): DimensionLevel | undefined {
    const hierarchy = this.hierarchies.get(hierarchyId);
    return hierarchy?.levels[levelIndex];
  }

  /**
   * Get next level
   */
  getNextLevel(hierarchyId: string, currentLevel: number): DimensionLevel | undefined {
    return this.getLevel(hierarchyId, currentLevel + 1);
  }

  /**
   * Get previous level
   */
  getPreviousLevel(hierarchyId: string, currentLevel: number): DimensionLevel | undefined {
    if (currentLevel === 0) return undefined;
    return this.getLevel(hierarchyId, currentLevel - 1);
  }

  /**
   * Check if can drill down
   */
  canDrillDown(hierarchyId: string, currentLevel: number): boolean {
    const hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) return false;
    return currentLevel < hierarchy.levels.length - 1;
  }

  /**
   * Check if can drill up
   */
  canDrillUp(currentLevel: number): boolean {
    return currentLevel > 0;
  }
}

// ============================================================================
// Drill Path Manager
// ============================================================================

export class DrillPathManager {
  private hierarchyManager: HierarchyManager;
  private drillPaths: Map<string, DrillPath>; // widgetId -> DrillPath

  constructor(hierarchyManager: HierarchyManager) {
    this.hierarchyManager = hierarchyManager;
    this.drillPaths = new Map();
  }

  /**
   * Initialize drill path for widget
   */
  initializePath(widgetId: string, hierarchyId: string): DrillPath {
    const path: DrillPath = {
      hierarchyId,
      currentLevel: 0,
      selectedValues: [],
    };

    this.drillPaths.set(widgetId, path);
    return path;
  }

  /**
   * Drill down to next level
   */
  drillDown(widgetId: string, value: any, label?: string): DrillPath | null {
    const path = this.drillPaths.get(widgetId);
    if (!path) return null;

    if (!this.hierarchyManager.canDrillDown(path.hierarchyId, path.currentLevel)) {
      return null;
    }

    // Add selected value
    path.selectedValues.push({
      level: path.currentLevel,
      value,
      label: label || String(value),
    });

    // Move to next level
    path.currentLevel += 1;

    this.drillPaths.set(widgetId, path);
    return path;
  }

  /**
   * Drill up to previous level
   */
  drillUp(widgetId: string): DrillPath | null {
    const path = this.drillPaths.get(widgetId);
    if (!path) return null;

    if (!this.hierarchyManager.canDrillUp(path.currentLevel)) {
      return null;
    }

    // Remove last selection
    path.selectedValues.pop();

    // Move to previous level
    path.currentLevel -= 1;

    this.drillPaths.set(widgetId, path);
    return path;
  }

  /**
   * Jump to specific level
   */
  jumpToLevel(widgetId: string, targetLevel: number): DrillPath | null {
    const path = this.drillPaths.get(widgetId);
    if (!path) return null;

    const hierarchy = this.hierarchyManager.getHierarchy(path.hierarchyId);
    if (!hierarchy || targetLevel < 0 || targetLevel >= hierarchy.levels.length) {
      return null;
    }

    // Remove selections after target level
    path.selectedValues = path.selectedValues.slice(0, targetLevel);
    path.currentLevel = targetLevel;

    this.drillPaths.set(widgetId, path);
    return path;
  }

  /**
   * Reset to top level
   */
  reset(widgetId: string): DrillPath | null {
    const path = this.drillPaths.get(widgetId);
    if (!path) return null;

    path.currentLevel = 0;
    path.selectedValues = [];

    this.drillPaths.set(widgetId, path);
    return path;
  }

  /**
   * Get current drill path
   */
  getPath(widgetId: string): DrillPath | undefined {
    return this.drillPaths.get(widgetId);
  }

  /**
   * Get current level info
   */
  getCurrentLevel(widgetId: string): DimensionLevel | undefined {
    const path = this.drillPaths.get(widgetId);
    if (!path) return undefined;

    return this.hierarchyManager.getLevel(path.hierarchyId, path.currentLevel);
  }

  /**
   * Get breadcrumb trail
   */
  getBreadcrumbs(widgetId: string): Array<{
    level: number;
    levelName: string;
    value: any;
    label: string;
  }> {
    const path = this.drillPaths.get(widgetId);
    if (!path) return [];

    const hierarchy = this.hierarchyManager.getHierarchy(path.hierarchyId);
    if (!hierarchy) return [];

    return path.selectedValues.map(selection => ({
      level: selection.level,
      levelName: hierarchy.levels[selection.level].name,
      value: selection.value,
      label: selection.label,
    }));
  }

  /**
   * Get filters for current drill path
   */
  getFilters(widgetId: string): Record<string, any> {
    const path = this.drillPaths.get(widgetId);
    if (!path) return {};

    const hierarchy = this.hierarchyManager.getHierarchy(path.hierarchyId);
    if (!hierarchy) return {};

    const filters: Record<string, any> = {};

    path.selectedValues.forEach(selection => {
      const level = hierarchy.levels[selection.level];
      filters[level.field] = selection.value;
    });

    return filters;
  }

  /**
   * Can drill down from current position
   */
  canDrillDown(widgetId: string): boolean {
    const path = this.drillPaths.get(widgetId);
    if (!path) return false;

    return this.hierarchyManager.canDrillDown(path.hierarchyId, path.currentLevel);
  }

  /**
   * Can drill up from current position
   */
  canDrillUp(widgetId: string): boolean {
    const path = this.drillPaths.get(widgetId);
    if (!path) return false;

    return this.hierarchyManager.canDrillUp(path.currentLevel);
  }
}

// ============================================================================
// Export singleton instances
// ============================================================================

export const hierarchyManager = new HierarchyManager();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create drill path manager for dashboard
 */
export function createDrillPathManager(): DrillPathManager {
  return new DrillPathManager(hierarchyManager);
}

/**
 * Format value based on dimension level
 */
export function formatDimensionValue(
  level: DimensionLevel,
  value: any
): string {
  if (level.formatter) {
    return level.formatter(value);
  }

  switch (level.dataType) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'number':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
}

/**
 * Get available drill-down values
 */
export function getAvailableDrillValues(
  data: any[],
  level: DimensionLevel
): Array<{ value: any; label: string; count: number }> {
  const valueCounts = new Map<any, number>();

  data.forEach(row => {
    const value = row[level.field];
    if (value !== undefined && value !== null) {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    }
  });

  return Array.from(valueCounts.entries())
    .map(([value, count]) => ({
      value,
      label: formatDimensionValue(level, value),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
