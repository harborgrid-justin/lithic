/**
 * Analytics Models - Enterprise Healthcare Analytics & Reporting
 * Lithic Healthcare Platform
 */

// Dashboard Types
export type WidgetType =
  | 'kpi'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'metric_card'
  | 'trend'
  | 'heatmap'
  | 'gauge';

export type MetricCategory =
  | 'quality'
  | 'financial'
  | 'operational'
  | 'population'
  | 'clinical'
  | 'patient_satisfaction'
  | 'compliance';

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type AggregationFunction = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'percentile';

// Widget Configuration
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;

  // Data source
  dataSource: {
    metric: string;
    filters?: Record<string, any>;
    timeRange?: {
      start: Date;
      end: Date;
      granularity: TimeGranularity;
    };
    aggregation?: AggregationFunction;
    groupBy?: string[];
  };

  // Display settings
  settings: {
    width: number;
    height: number;
    refreshInterval?: number; // seconds
    showLegend?: boolean;
    showLabels?: boolean;
    colors?: string[];
    thresholds?: {
      warning?: number;
      critical?: number;
    };
  };

  // Position in grid
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// Dashboard
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category: MetricCategory;

  // Widgets
  widgets: WidgetConfig[];

  // Layout settings
  layout: {
    columns: number;
    rowHeight: number;
    isDraggable: boolean;
    isResizable: boolean;
  };

  // Permissions
  visibility: 'public' | 'private' | 'shared';
  sharedWith?: string[]; // User IDs or role IDs
  owner: string;

  // Metadata
  tags?: string[];
  isFavorite?: boolean;
  isDefault?: boolean;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Metric Definition
export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;

  // Calculation
  calculation: {
    formula: string;
    dependencies?: string[]; // Other metric IDs
    parameters?: Record<string, any>;
  };

  // Data requirements
  dataSource: string;
  requiredFields: string[];

  // Display
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  decimalPlaces?: number;

  // Benchmarks
  benchmarks?: {
    target?: number;
    industry?: number;
    historical?: number;
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Metric Data Point
export interface MetricDataPoint {
  metricId: string;
  timestamp: Date;
  value: number;

  // Context
  dimensions?: Record<string, any>;
  metadata?: Record<string, any>;

  // Quality
  confidence?: number;
  dataQuality?: 'high' | 'medium' | 'low';
  sampleSize?: number;
}

// Report Types
export type ReportType =
  | 'quality_measures'
  | 'financial_summary'
  | 'operational_dashboard'
  | 'patient_outcomes'
  | 'population_health'
  | 'compliance'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html';

export type ReportStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';

// Report Configuration
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  type: ReportType;

  // Data specification
  metrics: string[]; // Metric IDs
  filters: {
    dateRange: {
      start: Date;
      end: Date;
    };
    departments?: string[];
    providers?: string[];
    facilities?: string[];
    patientGroups?: string[];
    customFilters?: Record<string, any>;
  };

  // Sections
  sections: ReportSection[];

  // Formatting
  format: ReportFormat;
  template?: string;
  branding?: {
    logo?: string;
    colors?: string[];
    header?: string;
    footer?: string;
  };

  // Distribution
  recipients?: string[];
  deliveryMethod?: 'email' | 'download' | 'portal';

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Report Section
export interface ReportSection {
  id: string;
  title: string;
  order: number;
  type: 'text' | 'chart' | 'table' | 'metrics_grid' | 'summary';

  content?: {
    text?: string;
    chartConfig?: WidgetConfig;
    columns?: string[];
    data?: any[];
    metrics?: string[];
  };
}

// Report Instance
export interface ReportInstance {
  id: string;
  configId: string;
  name: string;

  status: ReportStatus;

  // Execution
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds

  // Results
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;

  // Error handling
  error?: {
    message: string;
    code: string;
    details?: any;
  };

  // Metadata
  generatedBy: string;
  parameters: Record<string, any>;
  version: string;

  createdAt: Date;
}

// Scheduled Report
export interface ScheduledReport {
  id: string;
  reportConfigId: string;

  // Schedule
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm format
    timezone: string;
  };

  // Status
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;

  // History
  runs: {
    instanceId: string;
    timestamp: Date;
    status: ReportStatus;
  }[];

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Quality Metrics (HEDIS, CMS, etc.)
export interface QualityMeasure {
  id: string;
  code: string; // e.g., "HEDIS-BCS" for Breast Cancer Screening
  name: string;
  description: string;

  category: 'preventive' | 'chronic_disease' | 'behavioral_health' | 'access' | 'experience';

  // Measurement
  numerator: {
    criteria: string;
    count: number;
  };
  denominator: {
    criteria: string;
    count: number;
  };
  exclusions?: {
    criteria: string;
    count: number;
  };

  // Calculation
  rate: number; // percentage
  target: number;
  benchmark?: number;

  // Period
  measurementPeriod: {
    start: Date;
    end: Date;
  };

  // Status
  status: 'compliant' | 'non_compliant' | 'at_risk';

  // Details
  affectedPatients?: string[];
  gapInCare?: {
    patientId: string;
    requiredAction: string;
    dueDate: Date;
  }[];

  lastCalculated: Date;
  calculatedBy: string;
}

// Financial Analytics
export interface FinancialMetric {
  id: string;
  metricType:
    | 'revenue'
    | 'expenses'
    | 'margin'
    | 'ar_days'
    | 'collection_rate'
    | 'claim_denial_rate'
    | 'payment_variance'
    | 'rvu';

  period: {
    start: Date;
    end: Date;
  };

  // Values
  current: number;
  previous?: number;
  budget?: number;
  variance?: number;
  variancePercent?: number;

  // Breakdown
  byDepartment?: Record<string, number>;
  byProvider?: Record<string, number>;
  byPayer?: Record<string, number>;
  byServiceLine?: Record<string, number>;

  // Trends
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    isPositive: boolean;
  };

  calculatedAt: Date;
}

// Operational Metrics
export interface OperationalMetric {
  id: string;
  metricType:
    | 'patient_volume'
    | 'appointment_utilization'
    | 'wait_time'
    | 'length_of_stay'
    | 'bed_occupancy'
    | 'er_throughput'
    | 'no_show_rate'
    | 'staff_productivity';

  period: {
    start: Date;
    end: Date;
  };

  // Values
  value: number;
  unit: string;
  target?: number;

  // Time series
  timeSeries?: {
    timestamp: Date;
    value: number;
  }[];

  // Segmentation
  byLocation?: Record<string, number>;
  byTimeOfDay?: Record<string, number>;
  byDayOfWeek?: Record<string, number>;

  calculatedAt: Date;
}

// Population Health
export interface PopulationHealthMetric {
  id: string;
  populationId: string;
  populationName: string;
  populationSize: number;

  metricType:
    | 'risk_score'
    | 'disease_prevalence'
    | 'utilization'
    | 'cost_pmpm'
    | 'readmission_rate'
    | 'preventive_care_gap';

  // Stratification
  stratification: {
    byRiskLevel?: Record<string, number>;
    byAgeGroup?: Record<string, number>;
    byChronicCondition?: Record<string, number>;
    byGender?: Record<string, number>;
  };

  // High-risk cohort
  highRiskPatients?: {
    patientId: string;
    riskScore: number;
    factors: string[];
    recommendedInterventions: string[];
  }[];

  // Trends
  trend: {
    current: number;
    previous: number;
    changePercent: number;
  };

  period: {
    start: Date;
    end: Date;
  };

  calculatedAt: Date;
}

// Export Job
export interface ExportJob {
  id: string;
  type: 'dashboard' | 'report' | 'dataset';
  format: ReportFormat;

  // Source
  sourceId: string;
  sourceName: string;

  // Parameters
  parameters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    filters?: Record<string, any>;
    columns?: string[];
    includeCharts?: boolean;
    includeRawData?: boolean;
  };

  // Status
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100

  // Results
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;

  // Execution
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date; // Download link expiration

  // Error
  error?: {
    message: string;
    code: string;
  };

  requestedBy: string;
  createdAt: Date;
}

// Analytics Audit
export interface AnalyticsAudit {
  id: string;
  action:
    | 'dashboard_viewed'
    | 'dashboard_created'
    | 'dashboard_modified'
    | 'dashboard_deleted'
    | 'report_generated'
    | 'report_scheduled'
    | 'data_exported'
    | 'metric_calculated';

  resourceType: 'dashboard' | 'report' | 'metric' | 'export';
  resourceId: string;
  resourceName: string;

  // Details
  details?: Record<string, any>;

  // User context
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;

  // Compliance
  dataAccessed?: string[];
  phi_accessed?: boolean;
}

// Chart Data Series
export interface ChartDataSeries {
  name: string;
  data: {
    x: string | number | Date;
    y: number;
    label?: string;
    metadata?: Record<string, any>;
  }[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

// Chart Configuration
export interface ChartConfiguration {
  title: string;
  subtitle?: string;

  series: ChartDataSeries[];

  axes: {
    x: {
      label: string;
      type: 'category' | 'number' | 'date';
      format?: string;
    };
    y: {
      label: string;
      format?: string;
      min?: number;
      max?: number;
    };
  };

  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };

  tooltip?: {
    enabled: boolean;
    format?: string;
  };

  colors?: string[];
  responsive?: boolean;
}
