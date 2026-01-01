// Analytics & Reporting Types

export enum ReportType {
  CLINICAL_QUALITY = 'CLINICAL_QUALITY',
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  UTILIZATION = 'UTILIZATION',
  COMPLIANCE = 'COMPLIANCE',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  JSON = 'JSON',
  HTML = 'HTML',
}

export enum MetricType {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  PERCENTAGE = 'PERCENTAGE',
  RATE = 'RATE',
  RATIO = 'RATIO',
}

export enum TimeGranularity {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'CHART' | 'TABLE' | 'METRIC' | 'LIST';
  title: string;
  dataSource: string;
  configuration: WidgetConfiguration;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WidgetConfiguration {
  chartType?: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER';
  metrics: MetricDefinition[];
  dimensions?: string[];
  filters?: FilterDefinition[];
  timeRange?: TimeRange;
  refreshInterval?: number; // seconds
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: number[];
}

export interface MetricDefinition {
  name: string;
  field: string;
  type: MetricType;
  label: string;
  format?: string;
  color?: string;
}

export interface FilterDefinition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface TimeRange {
  start: string;
  end: string;
  granularity?: TimeGranularity;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: ReportType;
  parameters: ReportParameter[];
  query: string; // SQL or query DSL
  format: ReportFormat;
  schedule?: ReportSchedule;
  recipients?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReportParameter {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm format
  timezone: string;
  enabled: boolean;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  fileUrl?: string;
  error?: string;
  executedBy: string;
}

export interface ClinicalQualityMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  numerator: number;
  denominator: number;
  value: number;
  target?: number;
  unit: string;
  period: TimeRange;
  lastCalculated: string;
}

export interface FinancialMetric {
  id: string;
  name: string;
  category: 'REVENUE' | 'EXPENSES' | 'COLLECTIONS' | 'AR';
  value: number;
  change: number; // percentage change from previous period
  period: TimeRange;
  breakdown?: {
    label: string;
    value: number;
  }[];
}

export interface OperationalMetric {
  id: string;
  name: string;
  category: 'APPOINTMENTS' | 'PATIENTS' | 'STAFF' | 'UTILIZATION';
  value: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  period: TimeRange;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface TableData {
  columns: TableColumn[];
  rows: any[][];
  totalRows: number;
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  format?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface AnalyticsQuery {
  dataSource: string;
  metrics: string[];
  dimensions?: string[];
  filters?: FilterDefinition[];
  timeRange?: TimeRange;
  groupBy?: string[];
  orderBy?: {
    field: string;
    direction: 'ASC' | 'DESC';
  }[];
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResult {
  data: any[];
  metadata: {
    totalRows: number;
    executionTime: number;
    cached: boolean;
  };
}

export interface DashboardCreateRequest {
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isPublic?: boolean;
}

export interface ReportCreateRequest {
  name: string;
  description?: string;
  reportType: ReportType;
  parameters: ReportParameter[];
  query: string;
  format: ReportFormat;
  schedule?: ReportSchedule;
  recipients?: string[];
}

export interface ReportExecuteRequest {
  reportId: string;
  parameters: Record<string, any>;
  format?: ReportFormat;
}

export interface DataExportRequest {
  dataSource: string;
  format: ReportFormat;
  filters?: FilterDefinition[];
  columns?: string[];
  timeRange?: TimeRange;
}

export interface BIIntegration {
  id: string;
  name: string;
  type: 'TABLEAU' | 'POWER_BI' | 'LOOKER' | 'CUSTOM';
  endpoint: string;
  apiKey?: string;
  refreshSchedule?: string;
  isActive: boolean;
  lastSync?: string;
}

export interface Benchmark {
  id: string;
  metric: string;
  industryAverage: number;
  topQuartile: number;
  organizationValue: number;
  period: TimeRange;
  source: string;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
  category: string;
  owner: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
    value: number;
  };
  notification: {
    recipients: string[];
    channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  };
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}
