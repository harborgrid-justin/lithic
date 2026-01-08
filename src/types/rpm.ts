/**
 * Remote Patient Monitoring (RPM) Module Types
 * Agent 4: Remote Patient Monitoring Platform
 */

import type { BaseEntity } from "./index";
import type { FHIRObservation, FHIRDevice, FHIRDeviceMetric } from "./fhir-resources";

// ============================================================================
// Medical Device Types
// ============================================================================

export interface MedicalDevice extends BaseEntity {
  deviceId: string;
  patientId: string;
  deviceType: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string | null;
  status: DeviceStatus;
  connectionType: ConnectionType;
  lastConnection: Date | null;
  lastReading: Date | null;
  batteryLevel: number | null;
  isActive: boolean;
  enrolledAt: Date;
  enrolledBy: string;
  deactivatedAt: Date | null;
  deactivatedBy: string | null;
  calibrationDate: Date | null;
  nextCalibrationDate: Date | null;
  metadata: Record<string, any>;
  fhirDeviceId: string | null;
}

export enum DeviceType {
  BLOOD_PRESSURE_MONITOR = "BLOOD_PRESSURE_MONITOR",
  PULSE_OXIMETER = "PULSE_OXIMETER",
  GLUCOMETER = "GLUCOMETER",
  WEIGHT_SCALE = "WEIGHT_SCALE",
  THERMOMETER = "THERMOMETER",
  HEART_RATE_MONITOR = "HEART_RATE_MONITOR",
  ECG_MONITOR = "ECG_MONITOR",
  CONTINUOUS_GLUCOSE_MONITOR = "CONTINUOUS_GLUCOSE_MONITOR",
  SMART_WATCH = "SMART_WATCH",
  FITNESS_TRACKER = "FITNESS_TRACKER",
  SPIROMETER = "SPIROMETER",
  PEAK_FLOW_METER = "PEAK_FLOW_METER",
  INR_MONITOR = "INR_MONITOR",
}

export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  OFFLINE = "OFFLINE",
  LOW_BATTERY = "LOW_BATTERY",
  NEEDS_CALIBRATION = "NEEDS_CALIBRATION",
  ERROR = "ERROR",
  MAINTENANCE = "MAINTENANCE",
  DEACTIVATED = "DEACTIVATED",
}

export enum ConnectionType {
  BLUETOOTH = "BLUETOOTH",
  WIFI = "WIFI",
  CELLULAR = "CELLULAR",
  USB = "USB",
  MANUAL_ENTRY = "MANUAL_ENTRY",
  API_INTEGRATION = "API_INTEGRATION",
}

// ============================================================================
// Vital Signs and Readings Types
// ============================================================================

export interface VitalSignReading extends BaseEntity {
  patientId: string;
  deviceId: string | null;
  readingType: ReadingType;
  value: number;
  unit: string;
  timestamp: Date;
  source: ReadingSource;
  metadata: ReadingMetadata;
  isValidated: boolean;
  validatedBy: string | null;
  validatedAt: Date | null;
  isFlagged: boolean;
  flagReason: string | null;
  isOutlier: boolean;
  notes: string | null;
  fhirObservationId: string | null;
}

export enum ReadingType {
  SYSTOLIC_BP = "SYSTOLIC_BP",
  DIASTOLIC_BP = "DIASTOLIC_BP",
  HEART_RATE = "HEART_RATE",
  OXYGEN_SATURATION = "OXYGEN_SATURATION",
  BLOOD_GLUCOSE = "BLOOD_GLUCOSE",
  WEIGHT = "WEIGHT",
  TEMPERATURE = "TEMPERATURE",
  RESPIRATORY_RATE = "RESPIRATORY_RATE",
  PEAK_FLOW = "PEAK_FLOW",
  FEV1 = "FEV1",
  INR = "INR",
  STEPS = "STEPS",
  CALORIES = "CALORIES",
  SLEEP_HOURS = "SLEEP_HOURS",
  ACTIVITY_MINUTES = "ACTIVITY_MINUTES",
}

export enum ReadingSource {
  DEVICE = "DEVICE",
  MANUAL = "MANUAL",
  APPLE_HEALTH = "APPLE_HEALTH",
  GOOGLE_FIT = "GOOGLE_FIT",
  FITBIT = "FITBIT",
  IMPORTED = "IMPORTED",
}

export interface ReadingMetadata {
  deviceModel?: string;
  position?: "sitting" | "standing" | "lying";
  armUsed?: "left" | "right";
  mealContext?: "fasting" | "before_meal" | "after_meal";
  activityLevel?: "resting" | "active" | "post_exercise";
  medicationTaken?: boolean;
  environmentalFactors?: string[];
  confidence?: number;
  rawData?: Record<string, any>;
}

// ============================================================================
// Alert and Threshold Types
// ============================================================================

export interface AlertThreshold extends BaseEntity {
  patientId: string;
  readingType: ReadingType;
  condition: ThresholdCondition;
  value: number;
  severity: AlertSeverity;
  isActive: boolean;
  notifyPatient: boolean;
  notifyCareTeam: boolean;
  escalationRules: EscalationRule[];
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdBy: string;
  notes: string | null;
}

export enum ThresholdCondition {
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  OUTSIDE_RANGE = "OUTSIDE_RANGE",
  RATE_OF_CHANGE = "RATE_OF_CHANGE",
  CONSECUTIVE_READINGS = "CONSECUTIVE_READINGS",
  MISSING_READINGS = "MISSING_READINGS",
}

export interface EscalationRule {
  id: string;
  level: number;
  delayMinutes: number;
  notifyRoles: string[];
  notifyUsers: string[];
  notificationMethods: NotificationMethod[];
  requireAcknowledgment: boolean;
}

export enum NotificationMethod {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  PHONE_CALL = "PHONE_CALL",
  PUSH_NOTIFICATION = "PUSH_NOTIFICATION",
}

export interface RPMAlert extends BaseEntity {
  patientId: string;
  readingId: string;
  thresholdId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  value: number;
  unit: string;
  thresholdValue: number;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  status: AlertStatus;
  escalationLevel: number;
  notificationsSent: NotificationLog[];
  actions: AlertAction[];
  notes: string | null;
}

export enum AlertType {
  THRESHOLD_EXCEEDED = "THRESHOLD_EXCEEDED",
  CRITICAL_VALUE = "CRITICAL_VALUE",
  TRENDING_CONCERN = "TRENDING_CONCERN",
  DEVICE_OFFLINE = "DEVICE_OFFLINE",
  MISSING_READINGS = "MISSING_READINGS",
  DEVICE_MALFUNCTION = "DEVICE_MALFUNCTION",
  BATTERY_LOW = "BATTERY_LOW",
  CALIBRATION_NEEDED = "CALIBRATION_NEEDED",
}

export enum AlertSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AlertStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
  ESCALATED = "ESCALATED",
}

export interface NotificationLog {
  id: string;
  sentAt: Date;
  method: NotificationMethod;
  recipient: string;
  status: "sent" | "delivered" | "failed";
  error: string | null;
}

export interface AlertAction {
  id: string;
  timestamp: Date;
  userId: string;
  action: "acknowledged" | "escalated" | "resolved" | "dismissed" | "commented";
  comment: string | null;
}

// ============================================================================
// Data Aggregation and Trends Types
// ============================================================================

export interface AggregatedData {
  patientId: string;
  readingType: ReadingType;
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  statistics: DataStatistics;
  readings: VitalSignReading[];
  trendAnalysis: TrendAnalysis;
  generatedAt: Date;
}

export enum TimePeriod {
  HOUR = "HOUR",
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  QUARTER = "QUARTER",
  YEAR = "YEAR",
  CUSTOM = "CUSTOM",
}

export interface DataStatistics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number | null;
  standardDeviation: number;
  variance: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
  inRangeCount: number;
  outOfRangeCount: number;
  complianceRate: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: number;
  slope: number;
  rSquared: number;
  forecast: ForecastPoint[];
  changePoints: ChangePoint[];
  seasonality: SeasonalityPattern | null;
  anomalies: AnomalyDetection[];
  insights: TrendInsight[];
}

export enum TrendDirection {
  INCREASING = "INCREASING",
  DECREASING = "DECREASING",
  STABLE = "STABLE",
  FLUCTUATING = "FLUCTUATING",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidence: number;
}

export interface ChangePoint {
  timestamp: Date;
  value: number;
  previousMean: number;
  newMean: number;
  significance: number;
}

export interface SeasonalityPattern {
  period: "daily" | "weekly" | "monthly";
  strength: number;
  peaks: Date[];
  troughs: Date[];
}

export interface AnomalyDetection {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  zScore: number;
  isPersistent: boolean;
}

export interface TrendInsight {
  type: InsightType;
  severity: "info" | "warning" | "critical";
  message: string;
  recommendation: string | null;
  confidence: number;
  supportingData: Record<string, any>;
}

export enum InsightType {
  IMPROVEMENT = "IMPROVEMENT",
  DETERIORATION = "DETERIORATION",
  COMPLIANCE_ISSUE = "COMPLIANCE_ISSUE",
  VARIABILITY_CONCERN = "VARIABILITY_CONCERN",
  MEDICATION_EFFECT = "MEDICATION_EFFECT",
  SEASONAL_PATTERN = "SEASONAL_PATTERN",
  GOAL_ACHIEVED = "GOAL_ACHIEVED",
  INTERVENTION_NEEDED = "INTERVENTION_NEEDED",
}

// ============================================================================
// Patient Device Enrollment Types
// ============================================================================

export interface DeviceEnrollment extends BaseEntity {
  patientId: string;
  deviceId: string;
  enrollmentStatus: EnrollmentStatus;
  trainingCompleted: boolean;
  trainingCompletedAt: Date | null;
  consentSigned: boolean;
  consentSignedAt: Date | null;
  consentDocumentId: string | null;
  readingFrequency: ReadingFrequency;
  monitoringDuration: number | null;
  monitoringStartDate: Date;
  monitoringEndDate: Date | null;
  careTeam: CareTeamMember[];
  goals: MonitoringGoal[];
  notes: string | null;
}

export enum EnrollmentStatus {
  PENDING = "PENDING",
  TRAINING = "TRAINING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface ReadingFrequency {
  type: ReadingType;
  timesPerDay: number;
  specificTimes: string[] | null;
  minimumInterval: number | null;
}

export interface CareTeamMember {
  userId: string;
  role: string;
  isPrimary: boolean;
  notificationPreferences: NotificationMethod[];
  escalationLevel: number;
}

export interface MonitoringGoal {
  id: string;
  readingType: ReadingType;
  targetValue: number;
  targetRange: { min: number; max: number } | null;
  targetDate: Date | null;
  status: "active" | "achieved" | "modified" | "cancelled";
  progress: number;
}

// ============================================================================
// Wearable Integration Types
// ============================================================================

export interface WearableIntegration extends BaseEntity {
  patientId: string;
  platform: WearablePlatform;
  platformUserId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scope: string[];
  isActive: boolean;
  lastSync: Date | null;
  syncFrequency: number;
  dataTypes: string[];
  metadata: Record<string, any>;
}

export enum WearablePlatform {
  APPLE_HEALTH = "APPLE_HEALTH",
  GOOGLE_FIT = "GOOGLE_FIT",
  FITBIT = "FITBIT",
  GARMIN = "GARMIN",
  SAMSUNG_HEALTH = "SAMSUNG_HEALTH",
  WITHINGS = "WITHINGS",
}

export interface WearableDataSync {
  id: string;
  integrationId: string;
  patientId: string;
  syncStartTime: Date;
  syncEndTime: Date | null;
  status: SyncStatus;
  recordsProcessed: number;
  recordsImported: number;
  recordsSkipped: number;
  errors: SyncError[];
}

export enum SyncStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIAL = "PARTIAL",
}

export interface SyncError {
  timestamp: Date;
  dataType: string;
  error: string;
  rawData: Record<string, any>;
}

// ============================================================================
// RPM Billing Types
// ============================================================================

export interface RPMBillingPeriod extends BaseEntity {
  patientId: string;
  periodStart: Date;
  periodEnd: Date;
  status: BillingPeriodStatus;
  codes: RPMBillingCode[];
  totalMinutes: number;
  deviceProvisioningMinutes: number;
  setupMinutes: number;
  educationMinutes: number;
  dataReviewMinutes: number;
  careCoordinationMinutes: number;
  readingCount: number;
  daysWithReadings: number;
  complianceRate: number;
  billableActivities: BillableActivity[];
  generatedBy: string;
  reviewedBy: string | null;
  approvedAt: Date | null;
  submittedToBilling: boolean;
  submittedAt: Date | null;
  notes: string | null;
}

export enum BillingPeriodStatus {
  IN_PROGRESS = "IN_PROGRESS",
  READY_FOR_REVIEW = "READY_FOR_REVIEW",
  REVIEWED = "REVIEWED",
  APPROVED = "APPROVED",
  SUBMITTED = "SUBMITTED",
  BILLED = "BILLED",
}

export interface RPMBillingCode {
  code: string;
  description: string;
  category: BillingCodeCategory;
  requirements: BillingRequirements;
  minutes: number | null;
  quantity: number;
  isBillable: boolean;
  reason: string | null;
}

export enum BillingCodeCategory {
  DEVICE_SETUP = "DEVICE_SETUP",
  PATIENT_EDUCATION = "PATIENT_EDUCATION",
  DATA_TRANSMISSION = "DATA_TRANSMISSION",
  DATA_REVIEW = "DATA_REVIEW",
  INTERACTIVE_COMMUNICATION = "INTERACTIVE_COMMUNICATION",
}

export interface BillingRequirements {
  minimumDays: number;
  minimumReadings: number;
  minimumMinutes: number | null;
  requiresInteractiveContact: boolean;
  requiresPhysicianReview: boolean;
}

export interface BillableActivity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  userId: string;
  userRole: string;
  duration: number;
  description: string;
  patientInteraction: boolean;
  relatedRecordId: string | null;
}

export enum ActivityType {
  DEVICE_PROVISIONING = "DEVICE_PROVISIONING",
  PATIENT_TRAINING = "PATIENT_TRAINING",
  DATA_REVIEW = "DATA_REVIEW",
  ALERT_RESPONSE = "ALERT_RESPONSE",
  CARE_COORDINATION = "CARE_COORDINATION",
  PATIENT_COMMUNICATION = "PATIENT_COMMUNICATION",
  PHYSICIAN_CONSULTATION = "PHYSICIAN_CONSULTATION",
  PLAN_ADJUSTMENT = "PLAN_ADJUSTMENT",
}

// ============================================================================
// Real-time Monitoring Types
// ============================================================================

export interface MonitoringSession {
  id: string;
  patientId: string;
  deviceId: string;
  startTime: Date;
  endTime: Date | null;
  status: SessionStatus;
  streamingData: StreamingDataPoint[];
  events: SessionEvent[];
  alerts: string[];
  metadata: Record<string, any>;
}

export enum SessionStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export interface StreamingDataPoint {
  timestamp: Date;
  type: ReadingType;
  value: number;
  quality: "good" | "fair" | "poor";
}

export interface SessionEvent {
  timestamp: Date;
  type: "started" | "paused" | "resumed" | "stopped" | "alert" | "error";
  description: string;
  metadata: Record<string, any>;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateDeviceDto {
  patientId: string;
  deviceType: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionType: ConnectionType;
  metadata?: Record<string, any>;
}

export interface UpdateDeviceDto extends Partial<CreateDeviceDto> {
  id: string;
  status?: DeviceStatus;
  batteryLevel?: number;
}

export interface CreateReadingDto {
  patientId: string;
  deviceId?: string;
  readingType: ReadingType;
  value: number;
  unit: string;
  timestamp?: Date;
  source: ReadingSource;
  metadata?: ReadingMetadata;
}

export interface CreateAlertThresholdDto {
  patientId: string;
  readingType: ReadingType;
  condition: ThresholdCondition;
  value: number;
  severity: AlertSeverity;
  notifyPatient?: boolean;
  notifyCareTeam?: boolean;
  escalationRules?: EscalationRule[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface EnrollDeviceDto {
  patientId: string;
  deviceId: string;
  readingFrequency: ReadingFrequency;
  careTeam: CareTeamMember[];
  goals?: MonitoringGoal[];
  monitoringStartDate: Date;
  monitoringEndDate?: Date;
}

export interface AcknowledgeAlertDto {
  alertId: string;
  userId: string;
  comment?: string;
}

export interface ResolveAlertDto {
  alertId: string;
  userId: string;
  resolution: string;
  actions?: string;
}

// ============================================================================
// Query and Filter Types
// ============================================================================

export interface RPMQueryParams {
  patientId?: string;
  deviceId?: string;
  readingType?: ReadingType;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DeviceFilters {
  status?: DeviceStatus[];
  deviceType?: DeviceType[];
  connectionType?: ConnectionType[];
  batteryLow?: boolean;
  offline?: boolean;
}

export interface AlertFilters {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  type?: AlertType[];
  unacknowledged?: boolean;
  dateRange?: { start: Date; end: Date };
}

// ============================================================================
// Dashboard and Reporting Types
// ============================================================================

export interface RPMDashboardData {
  summary: RPMSummary;
  activeDevices: MedicalDevice[];
  recentReadings: VitalSignReading[];
  activeAlerts: RPMAlert[];
  trends: TrendSummary[];
  compliance: ComplianceMetrics;
  billingStatus: BillingStatus;
}

export interface RPMSummary {
  totalPatients: number;
  activeMonitoring: number;
  devicesOnline: number;
  devicesOffline: number;
  activeAlerts: number;
  criticalAlerts: number;
  readingsToday: number;
  complianceRate: number;
}

export interface TrendSummary {
  readingType: ReadingType;
  direction: TrendDirection;
  percentChange: number;
  significance: "improving" | "stable" | "concerning" | "critical";
}

export interface ComplianceMetrics {
  overallCompliance: number;
  deviceCompliance: Record<string, number>;
  readingCompliance: Record<ReadingType, number>;
  missedReadings: number;
  consecutiveDaysCompliant: number;
}

export interface BillingStatus {
  currentPeriod: string;
  minutesLogged: number;
  readingsDays: number;
  eligibleCodes: string[];
  estimatedReimbursement: number;
}
