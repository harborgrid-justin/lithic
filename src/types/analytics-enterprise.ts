/**
 * Enterprise Analytics Type Definitions
 * Comprehensive types for analytics, population health, and predictive models
 */

// ============================================================================
// Core Analytics Types
// ============================================================================

export type TimeGranularity = "hour" | "day" | "week" | "month" | "quarter" | "year";
export type AggregationMethod = "sum" | "avg" | "min" | "max" | "count" | "median" | "percentile";
export type TrendDirection = "increasing" | "decreasing" | "stable" | "volatile";

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  id: string;
  name: string;
  data: TimeSeriesDataPoint[];
  granularity: TimeGranularity;
  aggregationMethod: AggregationMethod;
}

export interface StatisticalSummary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode?: number;
  min: number;
  max: number;
  range: number;
  variance: number;
  standardDeviation: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number;
  rSquared: number;
  forecast: number[];
  confidence: number;
  seasonality?: {
    detected: boolean;
    period?: number;
  };
}

// ============================================================================
// Cohort Analysis Types
// ============================================================================

export interface CohortDefinition {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria[];
  dynamicUpdate: boolean;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  tags: string[];
}

export interface CohortCriteria {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "contains" | "between";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface CohortMember {
  patientId: string;
  joinedAt: Date;
  attributes: Record<string, any>;
}

export interface CohortAnalysis {
  cohortId: string;
  totalMembers: number;
  demographics: {
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    ethnicityDistribution: Record<string, number>;
  };
  clinicalMetrics: Record<string, StatisticalSummary>;
  outcomes: Record<string, number>;
}

// ============================================================================
// Benchmarking Types
// ============================================================================

export type BenchmarkType = "internal" | "regional" | "national" | "international";
export type BenchmarkScope = "facility" | "department" | "provider" | "service_line";

export interface BenchmarkMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  percentile: number;
  rank: number;
  totalComparisons: number;
  benchmarkType: BenchmarkType;
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  peerAverage: number;
  peerMedian: number;
  topQuartile: number;
  topDecile: number;
  variance: number;
  percentageDifference: number;
  interpretation: "above_average" | "average" | "below_average" | "top_performer" | "needs_improvement";
}

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  criteria: {
    bedCount?: { min: number; max: number };
    geography?: string[];
    facilityType?: string[];
    academicStatus?: boolean;
    traumaLevel?: string[];
  };
  memberCount: number;
}

// ============================================================================
// Population Health Registry Types
// ============================================================================

export type DiseaseRegistryType =
  | "diabetes"
  | "hypertension"
  | "chf"
  | "copd"
  | "asthma"
  | "ckd"
  | "cad"
  | "stroke"
  | "cancer";

export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export interface DiseaseRegistry {
  id: string;
  diseaseType: DiseaseRegistryType;
  name: string;
  description: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  totalPatients: number;
  activePatients: number;
  riskDistribution: Record<RiskLevel, number>;
  qualityMetrics: RegistryQualityMetric[];
}

export interface RegistryPatient {
  patientId: string;
  registryId: string;
  enrolledAt: Date;
  riskLevel: RiskLevel;
  riskScore: number;
  lastAssessment: Date;
  nextAssessment: Date;
  careGaps: CareGap[];
  interventions: Intervention[];
  outcomes: PatientOutcome[];
  primaryProvider: string;
  careManager?: string;
}

export interface RiskStratification {
  patientId: string;
  registryType: DiseaseRegistryType;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  calculatedAt: Date;
  validUntil: Date;
  algorithm: string;
  version: string;
}

export interface RiskFactor {
  factor: string;
  value: any;
  weight: number;
  contribution: number;
  modifiable: boolean;
}

// ============================================================================
// Care Gap Types
// ============================================================================

export type CareGapCategory =
  | "preventive_screening"
  | "chronic_disease_management"
  | "medication_adherence"
  | "follow_up_visit"
  | "immunization"
  | "lab_test";

export type CareGapPriority = "urgent" | "high" | "medium" | "low";
export type CareGapStatus = "open" | "in_progress" | "closed" | "declined";

export interface CareGap {
  id: string;
  patientId: string;
  category: CareGapCategory;
  description: string;
  priority: CareGapPriority;
  status: CareGapStatus;
  dueDate?: Date;
  overdueBy?: number;
  recommendedActions: string[];
  barriers?: string[];
  assignedTo?: string;
  identifiedAt: Date;
  closedAt?: Date;
  closureReason?: string;
}

export interface CareGapWorklist {
  id: string;
  name: string;
  filters: {
    registries?: DiseaseRegistryType[];
    priorities?: CareGapPriority[];
    categories?: CareGapCategory[];
    assignedTo?: string;
    overdueOnly?: boolean;
  };
  gaps: CareGap[];
  totalCount: number;
  stats: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
    overdue: number;
  };
}

// ============================================================================
// Intervention & Outreach Types
// ============================================================================

export type InterventionType =
  | "patient_education"
  | "care_coordination"
  | "medication_adjustment"
  | "referral"
  | "lifestyle_modification"
  | "remote_monitoring";

export type OutreachMethod = "phone" | "email" | "sms" | "portal" | "mail" | "home_visit";
export type OutreachStatus = "scheduled" | "attempted" | "completed" | "failed" | "declined";

export interface Intervention {
  id: string;
  patientId: string;
  registryId: string;
  type: InterventionType;
  description: string;
  objectives: string[];
  startDate: Date;
  endDate?: Date;
  status: "planned" | "active" | "completed" | "cancelled";
  assignedTo: string;
  outcome?: InterventionOutcome;
}

export interface InterventionOutcome {
  success: boolean;
  measuredAt: Date;
  metrics: Record<string, number>;
  notes: string;
  nextSteps?: string[];
}

export interface OutreachCampaign {
  id: string;
  name: string;
  description: string;
  targetCohort: CohortDefinition;
  method: OutreachMethod;
  message: string;
  scheduledDate: Date;
  completedDate?: Date;
  stats: {
    targeted: number;
    attempted: number;
    completed: number;
    failed: number;
    responseRate: number;
  };
}

// ============================================================================
// Patient Outcome Types
// ============================================================================

export interface PatientOutcome {
  id: string;
  patientId: string;
  registryId: string;
  outcomeType: string;
  measurementDate: Date;
  value: number;
  unit: string;
  trend: TrendDirection;
  comparedToBaseline?: number;
  comparedToPrevious?: number;
  withinTarget: boolean;
}

// ============================================================================
// Registry Quality Metrics
// ============================================================================

export interface RegistryQualityMetric {
  id: string;
  name: string;
  description: string;
  numerator: number;
  denominator: number;
  percentage: number;
  target: number;
  benchmark?: number;
  trend: TrendDirection;
}

// ============================================================================
// Predictive Model Types
// ============================================================================

export type PredictionType =
  | "readmission_risk"
  | "no_show_risk"
  | "high_utilizer"
  | "deterioration"
  | "cost_prediction";

export interface PredictionModel {
  id: string;
  name: string;
  type: PredictionType;
  version: string;
  algorithm: string;
  features: ModelFeature[];
  performance: ModelPerformance;
  trainedAt: Date;
  validatedAt: Date;
  status: "active" | "training" | "testing" | "deprecated";
}

export interface ModelFeature {
  name: string;
  type: "numeric" | "categorical" | "boolean" | "date";
  importance: number;
  description: string;
  required: boolean;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  sensitivity: number;
  specificity: number;
  validationSampleSize: number;
}

export interface Prediction {
  id: string;
  patientId: string;
  modelId: string;
  modelVersion: string;
  predictionType: PredictionType;
  score: number;
  probability: number;
  riskLevel: RiskLevel;
  predictedAt: Date;
  validUntil: Date;
  factors: PredictionFactor[];
  recommendations: string[];
  confidence: number;
}

export interface PredictionFactor {
  feature: string;
  value: any;
  contribution: number;
  description: string;
}

// ============================================================================
// Report Builder Types
// ============================================================================

export type ReportDataSource =
  | "patients"
  | "encounters"
  | "claims"
  | "lab_results"
  | "medications"
  | "diagnoses"
  | "procedures"
  | "vitals"
  | "registries";

export type VisualizationType =
  | "table"
  | "bar_chart"
  | "line_chart"
  | "pie_chart"
  | "scatter_plot"
  | "heatmap"
  | "funnel"
  | "sankey"
  | "gauge";

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  dataSources: ReportDataSourceConfig[];
  filters: ReportFilter[];
  columns: ReportColumn[];
  visualizations: ReportVisualization[];
  schedule?: ReportSchedule;
  distribution?: ReportDistribution;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  shared: boolean;
}

export interface ReportDataSourceConfig {
  source: ReportDataSource;
  alias: string;
  joins?: {
    target: string;
    type: "inner" | "left" | "right" | "outer";
    on: string;
  }[];
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  dataType: "string" | "number" | "date" | "boolean";
}

export interface ReportColumn {
  id: string;
  field: string;
  label: string;
  dataType: string;
  aggregation?: AggregationMethod;
  format?: string;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface ReportVisualization {
  id: string;
  type: VisualizationType;
  title: string;
  dataConfig: {
    xAxis?: string;
    yAxis?: string | string[];
    series?: string;
    value?: string;
    category?: string;
  };
  styling?: {
    colors?: string[];
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}

export interface ReportDistribution {
  email?: {
    recipients: string[];
    subject: string;
    format: "pdf" | "excel" | "csv";
  };
  dashboard?: {
    publish: boolean;
    category: string;
  };
}

export interface GeneratedReport {
  id: string;
  definitionId: string;
  generatedAt: Date;
  parameters: Record<string, any>;
  data: any[];
  visualizations: any[];
  format: "json" | "pdf" | "excel" | "csv";
  downloadUrl?: string;
  expiresAt?: Date;
}

// ============================================================================
// Executive Dashboard Types
// ============================================================================

export interface ExecutiveSummary {
  organization: string;
  reportDate: Date;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  overallScore: number;
  financialHealth: FinancialSummary;
  operationalHealth: OperationalSummary;
  clinicalQuality: QualitySummary;
  patientSatisfaction: SatisfactionSummary;
  strategicInitiatives: InitiativeStatus[];
  alerts: ExecutiveAlert[];
}

export interface FinancialSummary {
  totalRevenue: number;
  revenueChange: number;
  operatingMargin: number;
  marginChange: number;
  daysInAR: number;
  collectionRate: number;
  denialRate: number;
  revenueByServiceLine: Record<string, number>;
  topPayers: Array<{ name: string; revenue: number }>;
}

export interface OperationalSummary {
  totalEncounters: number;
  encounterChange: number;
  bedOccupancy: number;
  averageLOS: number;
  edWaitTime: number;
  appointmentNoShowRate: number;
  providerProductivity: number;
  staffingLevels: Record<string, number>;
}

export interface QualitySummary {
  overallScore: number;
  readmissionRate: number;
  mortalityRate: number;
  infectionRate: number;
  medicationErrorRate: number;
  fallRate: number;
  pressureUlcerRate: number;
  qualityMeasures: RegistryQualityMetric[];
}

export interface SatisfactionSummary {
  overallScore: number;
  scoreChange: number;
  responseRate: number;
  npsScore: number;
  categoryScores: Record<string, number>;
  topComplaints: Array<{ category: string; count: number }>;
  topCompliments: Array<{ category: string; count: number }>;
}

export interface InitiativeStatus {
  id: string;
  name: string;
  category: string;
  status: "on_track" | "at_risk" | "delayed" | "completed";
  progress: number;
  targetDate: Date;
  owner: string;
  milestones: Array<{
    name: string;
    completed: boolean;
    dueDate: Date;
  }>;
}

export interface ExecutiveAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  trend: TrendDirection;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// Drill-down Types
// ============================================================================

export interface DrilldownPath {
  level: number;
  field: string;
  value: any;
  label: string;
}

export interface DrilldownData {
  currentLevel: number;
  path: DrilldownPath[];
  data: any[];
  aggregates: Record<string, number>;
  hasChildren: boolean;
  availableDrilldowns: string[];
}

// ============================================================================
// Attribution Modeling Types
// ============================================================================

export type AttributionMethod = "first_touch" | "last_touch" | "multi_touch" | "time_decay";

export interface AttributionModel {
  method: AttributionMethod;
  windowDays: number;
  touchpoints: string[];
  weights?: Record<string, number>;
}

export interface PatientAttribution {
  patientId: string;
  primaryProvider: string;
  attributionScore: number;
  attributionMethod: AttributionMethod;
  touchpoints: Array<{
    provider: string;
    date: Date;
    type: string;
    weight: number;
  }>;
  calculatedAt: Date;
}
