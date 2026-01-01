/**
 * Analytics & Reporting Module Types
 * Agent 9: Analytics
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Report Types
// ============================================================================

export interface Report extends BaseEntity {
  name: string;
  description: string | null;
  category: ReportCategory;
  type: ReportType;
  query: string | null;
  configuration: ReportConfiguration;
  parameters: ReportParameter[];
  schedule: ReportSchedule | null;
  ownedBy: string;
  isShared: boolean;
  isPublic: boolean;
  tags: string[];
  lastRunAt: Date | null;
  runCount: number;
}

export enum ReportCategory {
  FINANCIAL = "FINANCIAL",
  CLINICAL = "CLINICAL",
  OPERATIONAL = "OPERATIONAL",
  QUALITY = "QUALITY",
  COMPLIANCE = "COMPLIANCE",
  POPULATION_HEALTH = "POPULATION_HEALTH",
  CUSTOM = "CUSTOM",
}

export enum ReportType {
  TABLE = "TABLE",
  CHART = "CHART",
  DASHBOARD = "DASHBOARD",
  EXPORT = "EXPORT",
}

export interface ReportConfiguration {
  dataSource: string;
  columns: ColumnDefinition[];
  filters: FilterDefinition[];
  sorting: SortDefinition[];
  grouping: GroupingDefinition[];
  aggregations: AggregationDefinition[];
  visualization: VisualizationConfig | null;
  format: OutputFormat;
}

export interface ColumnDefinition {
  field: string;
  header: string;
  type: ColumnType;
  format: string | null;
  width: number | null;
  visible: boolean;
}

export enum ColumnType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  CURRENCY = "CURRENCY",
  DATE = "DATE",
  DATETIME = "DATETIME",
  BOOLEAN = "BOOLEAN",
  ENUM = "ENUM",
}

export interface FilterDefinition {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType: string;
}

export enum FilterOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
  IN = "IN",
  NOT_IN = "NOT_IN",
  BETWEEN = "BETWEEN",
  IS_NULL = "IS_NULL",
  IS_NOT_NULL = "IS_NOT_NULL",
}

export interface SortDefinition {
  field: string;
  direction: "ASC" | "DESC";
  priority: number;
}

export interface GroupingDefinition {
  field: string;
  level: number;
}

export interface AggregationDefinition {
  field: string;
  function: AggregationFunction;
  alias: string;
}

export enum AggregationFunction {
  COUNT = "COUNT",
  SUM = "SUM",
  AVG = "AVG",
  MIN = "MIN",
  MAX = "MAX",
  DISTINCT_COUNT = "DISTINCT_COUNT",
}

export interface VisualizationConfig {
  chartType: ChartType;
  xAxis: string;
  yAxis: string | string[];
  series: string | null;
  colors: string[];
  options: Record<string, any>;
}

export enum ChartType {
  LINE = "LINE",
  BAR = "BAR",
  COLUMN = "COLUMN",
  PIE = "PIE",
  DONUT = "DONUT",
  AREA = "AREA",
  SCATTER = "SCATTER",
  HEATMAP = "HEATMAP",
  GAUGE = "GAUGE",
  FUNNEL = "FUNNEL",
}

export enum OutputFormat {
  HTML = "HTML",
  PDF = "PDF",
  EXCEL = "EXCEL",
  CSV = "CSV",
  JSON = "JSON",
}

export interface ReportParameter {
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  defaultValue: any;
  options: any[] | null;
  validation: Record<string, any> | null;
}

export enum ParameterType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  DATE = "DATE",
  DATE_RANGE = "DATE_RANGE",
  SELECT = "SELECT",
  MULTISELECT = "MULTISELECT",
  BOOLEAN = "BOOLEAN",
}

// ============================================================================
// Report Schedule Types
// ============================================================================

export interface ReportSchedule extends BaseEntity {
  reportId: string;
  frequency: ScheduleFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  time: string;
  timezone: string;
  startDate: Date;
  endDate: Date | null;
  lastRunAt: Date | null;
  nextRunAt: Date;
  recipients: string[];
  deliveryMethod: DeliveryMethod;
  format: OutputFormat;
  status: ScheduleStatus;
  failureCount: number;
  lastError: string | null;
}

export enum ScheduleFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUALLY = "ANNUALLY",
}

export enum DeliveryMethod {
  EMAIL = "EMAIL",
  PORTAL = "PORTAL",
  FTP = "FTP",
  SFTP = "SFTP",
  S3 = "S3",
}

export enum ScheduleStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  EXPIRED = "EXPIRED",
  ERROR = "ERROR",
}

export interface ReportExecution extends BaseEntity {
  reportId: string;
  executedBy: string;
  executedAt: Date;
  parameters: Record<string, any>;
  status: ExecutionStatus;
  rowCount: number | null;
  executionTime: number;
  resultUrl: string | null;
  errorMessage: string | null;
}

export enum ExecutionStatus {
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface Dashboard extends BaseEntity {
  name: string;
  description: string | null;
  category: ReportCategory;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: GlobalFilter[];
  ownedBy: string;
  isShared: boolean;
  isPublic: boolean;
  refreshInterval: number | null;
  tags: string[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface DashboardWidget extends BaseEntity {
  dashboardId: string;
  title: string;
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  refreshInterval: number | null;
}

export enum WidgetType {
  METRIC = "METRIC",
  CHART = "CHART",
  TABLE = "TABLE",
  LIST = "LIST",
  TEXT = "TEXT",
  IFRAME = "IFRAME",
}

export interface WidgetPosition {
  row: number;
  col: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfiguration {
  dataSource: string;
  query: string | null;
  visualization: VisualizationConfig | null;
  formatting: FormattingOptions;
  thresholds: Threshold[] | null;
}

export interface FormattingOptions {
  numberFormat: string | null;
  dateFormat: string | null;
  currencySymbol: string | null;
  decimalPlaces: number | null;
}

export interface Threshold {
  value: number;
  comparison: "GT" | "LT" | "GTE" | "LTE" | "EQ";
  color: string;
  label: string | null;
}

export interface GlobalFilter {
  name: string;
  field: string;
  type: ParameterType;
  defaultValue: any;
  appliesTo: string[];
}

// ============================================================================
// Metric Types
// ============================================================================

export interface Metric extends BaseEntity {
  name: string;
  description: string | null;
  category: MetricCategory;
  calculation: MetricCalculation;
  unit: string | null;
  target: number | null;
  thresholds: Threshold[];
  frequency: CalculationFrequency;
  dataSource: string;
  query: string | null;
  lastCalculatedAt: Date | null;
  lastValue: number | null;
  trend: TrendDirection | null;
}

export enum MetricCategory {
  FINANCIAL = "FINANCIAL",
  CLINICAL = "CLINICAL",
  OPERATIONAL = "OPERATIONAL",
  QUALITY = "QUALITY",
  PATIENT_SATISFACTION = "PATIENT_SATISFACTION",
}

export enum MetricCalculation {
  SUM = "SUM",
  AVERAGE = "AVERAGE",
  COUNT = "COUNT",
  PERCENTAGE = "PERCENTAGE",
  RATIO = "RATIO",
  CUSTOM = "CUSTOM",
}

export enum CalculationFrequency {
  REAL_TIME = "REAL_TIME",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export enum TrendDirection {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}

export interface MetricValue extends BaseEntity {
  metricId: string;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  target: number | null;
  variance: number | null;
  percentChange: number | null;
  trend: TrendDirection;
}

// ============================================================================
// Quality Measure Types
// ============================================================================

export interface QualityMeasure extends BaseEntity {
  name: string;
  description: string | null;
  measureSet: MeasureSet;
  measureId: string;
  nqfNumber: string | null;
  category: QualityCategory;
  numerator: MeasureComponent;
  denominator: MeasureComponent;
  exclusions: MeasureComponent | null;
  exceptions: MeasureComponent | null;
  target: number;
  reportingFrequency: ReportingFrequency;
  isActive: boolean;
}

export enum MeasureSet {
  HEDIS = "HEDIS",
  MIPS = "MIPS",
  PQRS = "PQRS",
  CORE = "CORE",
  CUSTOM = "CUSTOM",
}

export enum QualityCategory {
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  PATIENT_SAFETY = "PATIENT_SAFETY",
  CARE_COORDINATION = "CARE_COORDINATION",
  PATIENT_ENGAGEMENT = "PATIENT_ENGAGEMENT",
}

export interface MeasureComponent {
  description: string;
  criteria: string;
  query: string;
}

export enum ReportingFrequency {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUALLY = "ANNUALLY",
}

export interface QualityMeasureResult extends BaseEntity {
  measureId: string;
  periodStart: Date;
  periodEnd: Date;
  numerator: number;
  denominator: number;
  exclusions: number;
  exceptions: number;
  rate: number;
  target: number;
  met: boolean;
  variance: number;
}

// ============================================================================
// Population Health Types
// ============================================================================

export interface PopulationCohort extends BaseEntity {
  name: string;
  description: string | null;
  criteria: CohortCriteria[];
  patientCount: number;
  lastUpdated: Date;
  autoUpdate: boolean;
  updateFrequency: CalculationFrequency | null;
  tags: string[];
}

export interface CohortCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator: "AND" | "OR";
}

export interface PopulationHealthMetric {
  cohortId: string;
  metric: string;
  value: number;
  trend: TrendDirection;
  riskLevel: RiskLevel;
  interventionsRecommended: number;
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// Analytics Cache Types
// ============================================================================

export interface AnalyticsCache extends BaseEntity {
  key: string;
  type: CacheType;
  data: Record<string, any>;
  expiresAt: Date;
  hitCount: number;
  lastAccessedAt: Date;
}

export enum CacheType {
  REPORT = "REPORT",
  DASHBOARD = "DASHBOARD",
  METRIC = "METRIC",
  QUERY = "QUERY",
}

// ============================================================================
// DTOs
// ============================================================================

export interface GenerateReportDto {
  reportId: string;
  parameters?: Record<string, any>;
  format?: OutputFormat;
}

export interface CreateDashboardDto {
  name: string;
  description?: string;
  category: ReportCategory;
  layout?: DashboardLayout;
  widgets?: Omit<DashboardWidget, keyof BaseEntity | "dashboardId">[];
}

export interface ExecuteQueryDto {
  query: string;
  parameters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface DashboardData {
  dashboard: Dashboard;
  widgets: Array<{
    widget: DashboardWidget;
    data: any;
    loading: boolean;
    error: string | null;
  }>;
}
