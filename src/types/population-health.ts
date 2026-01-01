/**
 * Population Health & Care Management Module Types
 * Agent 7: Population Health & Care Management
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Patient Registry Types
// ============================================================================

export interface PatientRegistry extends BaseEntity {
  name: string;
  description: string | null;
  condition: RegistryCondition;
  icdCodes: string[];
  snomedCodes: string[];
  criteria: RegistryCriteria[];
  patientCount: number;
  stratificationLevels: StratificationLevel[];
  status: RegistryStatus;
  autoUpdate: boolean;
  updateFrequency: UpdateFrequency;
  lastUpdatedAt: Date | null;
  owner: string;
  careTeam: string[];
  tags: string[];
}

export enum RegistryCondition {
  DIABETES_TYPE_1 = "DIABETES_TYPE_1",
  DIABETES_TYPE_2 = "DIABETES_TYPE_2",
  HYPERTENSION = "HYPERTENSION",
  CONGESTIVE_HEART_FAILURE = "CONGESTIVE_HEART_FAILURE",
  CORONARY_ARTERY_DISEASE = "CORONARY_ARTERY_DISEASE",
  CHRONIC_KIDNEY_DISEASE = "CHRONIC_KIDNEY_DISEASE",
  COPD = "COPD",
  ASTHMA = "ASTHMA",
  CANCER = "CANCER",
  DEPRESSION = "DEPRESSION",
  OBESITY = "OBESITY",
  OSTEOPOROSIS = "OSTEOPOROSIS",
  STROKE = "STROKE",
  ALZHEIMERS = "ALZHEIMERS",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  CUSTOM = "CUSTOM",
}

export enum RegistryStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum UpdateFrequency {
  REAL_TIME = "REAL_TIME",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export interface RegistryCriteria {
  field: string;
  operator: CriteriaOperator;
  value: any;
  dataType: string;
  logicalOperator: "AND" | "OR";
}

export enum CriteriaOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  BETWEEN = "BETWEEN",
  IS_NULL = "IS_NULL",
  IS_NOT_NULL = "IS_NOT_NULL",
}

export interface StratificationLevel {
  name: string;
  level: RiskLevel;
  criteria: string;
  patientCount: number;
  percentage: number;
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
  CRITICAL = "CRITICAL",
}

export interface RegistryPatient extends BaseEntity {
  registryId: string;
  patientId: string;
  enrolledDate: Date;
  riskLevel: RiskLevel;
  riskScore: number;
  careGapsCount: number;
  lastContactDate: Date | null;
  nextContactDate: Date | null;
  assignedCareManager: string | null;
  status: RegistryPatientStatus;
  notes: string | null;
}

export enum RegistryPatientStatus {
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  LOST_TO_FOLLOWUP = "LOST_TO_FOLLOWUP",
  GRADUATED = "GRADUATED",
  DECEASED = "DECEASED",
  TRANSFERRED = "TRANSFERRED",
}

// ============================================================================
// Care Gap Types
// ============================================================================

export interface CareGap extends BaseEntity {
  patientId: string;
  registryId: string | null;
  gapType: CareGapType;
  category: CareGapCategory;
  title: string;
  description: string;
  measure: string | null;
  measureId: string | null;
  dueDate: Date | null;
  identifiedDate: Date;
  priority: GapPriority;
  status: CareGapStatus;
  closedDate: Date | null;
  closedBy: string | null;
  closureMethod: string | null;
  assignedTo: string | null;
  outreachAttempts: number;
  lastOutreachDate: Date | null;
  nextOutreachDate: Date | null;
  notes: string | null;
  evidence: GapEvidence[];
  recommendations: string[];
}

export enum CareGapType {
  PREVENTIVE_SCREENING = "PREVENTIVE_SCREENING",
  IMMUNIZATION = "IMMUNIZATION",
  CHRONIC_CARE_MONITORING = "CHRONIC_CARE_MONITORING",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  FOLLOW_UP_VISIT = "FOLLOW_UP_VISIT",
  SPECIALIST_REFERRAL = "SPECIALIST_REFERRAL",
  LAB_TEST = "LAB_TEST",
  IMAGING_STUDY = "IMAGING_STUDY",
  HEALTH_MAINTENANCE = "HEALTH_MAINTENANCE",
  QUALITY_MEASURE = "QUALITY_MEASURE",
}

export enum CareGapCategory {
  PREVENTIVE = "PREVENTIVE",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  ACUTE_CARE = "ACUTE_CARE",
  BEHAVIORAL_HEALTH = "BEHAVIORAL_HEALTH",
  MEDICATION = "MEDICATION",
}

export enum GapPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export enum CareGapStatus {
  IDENTIFIED = "IDENTIFIED",
  OUTREACH_SCHEDULED = "OUTREACH_SCHEDULED",
  OUTREACH_IN_PROGRESS = "OUTREACH_IN_PROGRESS",
  APPOINTMENT_SCHEDULED = "APPOINTMENT_SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED",
  EXCLUDED = "EXCLUDED",
  PATIENT_DECLINED = "PATIENT_DECLINED",
}

export interface GapEvidence {
  type: string;
  description: string;
  date: Date | null;
  value: string | null;
  source: string;
}

// ============================================================================
// Risk Stratification Types
// ============================================================================

export interface RiskScore extends BaseEntity {
  patientId: string;
  registryId: string | null;
  scoreType: RiskScoreType;
  score: number;
  level: RiskLevel;
  components: RiskComponent[];
  calculatedDate: Date;
  validUntil: Date | null;
  trends: RiskTrend[];
  predictedOutcomes: PredictedOutcome[];
  interventionRecommendations: string[];
  notes: string | null;
}

export enum RiskScoreType {
  LACE = "LACE",
  CHARLSON_COMORBIDITY = "CHARLSON_COMORBIDITY",
  READMISSION_RISK = "READMISSION_RISK",
  MORTALITY_RISK = "MORTALITY_RISK",
  FALL_RISK = "FALL_RISK",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  ED_UTILIZATION = "ED_UTILIZATION",
  HOSPITALIZATION_RISK = "HOSPITALIZATION_RISK",
  COMPOSITE = "COMPOSITE",
  CUSTOM = "CUSTOM",
}

export interface RiskComponent {
  name: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
}

export interface RiskTrend {
  date: Date;
  score: number;
  level: RiskLevel;
  change: number;
  percentChange: number;
}

export interface PredictedOutcome {
  outcome: string;
  probability: number;
  timeframe: string;
  confidence: number;
  factors: string[];
}

// ============================================================================
// Outreach Types
// ============================================================================

export interface Outreach extends BaseEntity {
  patientId: string;
  registryId: string | null;
  careGapId: string | null;
  type: OutreachType;
  method: OutreachMethod;
  purpose: string;
  priority: GapPriority;
  status: OutreachStatus;
  scheduledDate: Date | null;
  attemptDate: Date | null;
  completedDate: Date | null;
  assignedTo: string;
  outcome: OutreachOutcome | null;
  response: string | null;
  notes: string | null;
  followUpRequired: boolean;
  followUpDate: Date | null;
  nextSteps: string | null;
  duration: number | null;
  costEstimate: number | null;
}

export enum OutreachType {
  CARE_GAP_CLOSURE = "CARE_GAP_CLOSURE",
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  HEALTH_EDUCATION = "HEALTH_EDUCATION",
  WELLNESS_CHECK = "WELLNESS_CHECK",
  CARE_TRANSITION = "CARE_TRANSITION",
  SURVEY = "SURVEY",
  ENROLLMENT = "ENROLLMENT",
}

export enum OutreachMethod {
  PHONE_CALL = "PHONE_CALL",
  SMS = "SMS",
  EMAIL = "EMAIL",
  MAIL = "MAIL",
  PATIENT_PORTAL = "PATIENT_PORTAL",
  HOME_VISIT = "HOME_VISIT",
  TELEHEALTH = "TELEHEALTH",
  IN_PERSON = "IN_PERSON",
}

export enum OutreachStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  NO_ANSWER = "NO_ANSWER",
  LEFT_MESSAGE = "LEFT_MESSAGE",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export enum OutreachOutcome {
  SUCCESSFUL = "SUCCESSFUL",
  APPOINTMENT_SCHEDULED = "APPOINTMENT_SCHEDULED",
  DECLINED = "DECLINED",
  NOT_INTERESTED = "NOT_INTERESTED",
  WRONG_NUMBER = "WRONG_NUMBER",
  LANGUAGE_BARRIER = "LANGUAGE_BARRIER",
  FOLLOW_UP_NEEDED = "FOLLOW_UP_NEEDED",
  REFERRED_TO_CARE_MANAGER = "REFERRED_TO_CARE_MANAGER",
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
  cmsNumber: string | null;
  category: QualityCategory;
  type: MeasureType;
  numerator: MeasureComponent;
  denominator: MeasureComponent;
  exclusions: MeasureComponent | null;
  exceptions: MeasureComponent | null;
  target: number;
  benchmark: number | null;
  reportingFrequency: ReportingFrequency;
  reportingPeriod: ReportingPeriod;
  status: QualityMeasureStatus;
  evidenceLevel: string | null;
  references: string[];
}

export enum MeasureSet {
  HEDIS = "HEDIS",
  MIPS = "MIPS",
  ACO = "ACO",
  CMS_STAR = "CMS_STAR",
  PQRS = "PQRS",
  CORE = "CORE",
  UDS = "UDS",
  PCMH = "PCMH",
  CUSTOM = "CUSTOM",
}

export enum QualityCategory {
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  CHRONIC_DISEASE_MANAGEMENT = "CHRONIC_DISEASE_MANAGEMENT",
  PATIENT_SAFETY = "PATIENT_SAFETY",
  CARE_COORDINATION = "CARE_COORDINATION",
  PATIENT_ENGAGEMENT = "PATIENT_ENGAGEMENT",
  EFFICIENCY = "EFFICIENCY",
  EFFECTIVENESS = "EFFECTIVENESS",
}

export enum MeasureType {
  PROCESS = "PROCESS",
  OUTCOME = "OUTCOME",
  STRUCTURE = "STRUCTURE",
  PATIENT_REPORTED = "PATIENT_REPORTED",
  COMPOSITE = "COMPOSITE",
}

export enum QualityMeasureStatus {
  ACTIVE = "ACTIVE",
  RETIRED = "RETIRED",
  DRAFT = "DRAFT",
}

export enum ReportingFrequency {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMI_ANNUALLY = "SEMI_ANNUALLY",
  ANNUALLY = "ANNUALLY",
}

export enum ReportingPeriod {
  CALENDAR_YEAR = "CALENDAR_YEAR",
  FISCAL_YEAR = "FISCAL_YEAR",
  ROLLING_12_MONTHS = "ROLLING_12_MONTHS",
  CUSTOM = "CUSTOM",
}

export interface MeasureComponent {
  description: string;
  criteria: ComponentCriteria[];
  logic: string;
  query: string | null;
}

export interface ComponentCriteria {
  field: string;
  operator: CriteriaOperator;
  value: any;
  ageRange: AgeRange | null;
  timeframe: string | null;
  codes: CodeSet[];
}

export interface AgeRange {
  min: number | null;
  max: number | null;
  unit: "years" | "months" | "days";
}

export interface CodeSet {
  codeSystem: CodeSystem;
  codes: string[];
  description: string | null;
}

export enum CodeSystem {
  ICD_10 = "ICD_10",
  CPT = "CPT",
  HCPCS = "HCPCS",
  SNOMED_CT = "SNOMED_CT",
  LOINC = "LOINC",
  RX_NORM = "RX_NORM",
  CVX = "CVX",
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
  benchmark: number | null;
  met: boolean;
  variance: number;
  percentile: number | null;
  trend: TrendDirection;
  performanceGap: number;
  patientsInDenominator: string[];
  patientsInNumerator: string[];
  calculatedAt: Date;
  validatedBy: string | null;
  validatedAt: Date | null;
  notes: string | null;
}

export enum TrendDirection {
  IMPROVING = "IMPROVING",
  DECLINING = "DECLINING",
  STABLE = "STABLE",
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",
}

// ============================================================================
// Social Determinants of Health (SDOH) Types
// ============================================================================

export interface SDOH extends BaseEntity {
  patientId: string;
  assessmentDate: Date;
  assessedBy: string;
  housing: HousingStatus;
  housingStability: StabilityLevel;
  foodSecurity: FoodSecurityLevel;
  transportation: TransportationAccess;
  utilities: UtilitiesAccess;
  employment: EmploymentStatus;
  income: IncomeLevel;
  education: EducationLevel;
  socialSupport: SocialSupportLevel;
  safetyDomesticViolence: boolean | null;
  substanceUse: SubstanceUseLevel;
  mentalHealth: MentalHealthStatus;
  healthLiteracy: HealthLiteracyLevel;
  digitalAccess: DigitalAccessLevel;
  immigrationStatus: ImmigrationStatus | null;
  language: string;
  interpreterNeeded: boolean;
  legalNeeds: boolean;
  childCare: ChildCareAccess | null;
  barriers: SDOHBarrier[];
  interventions: SDOHIntervention[];
  riskScore: number;
  riskLevel: RiskLevel;
  notes: string | null;
  nextAssessmentDate: Date | null;
}

export enum HousingStatus {
  OWNS_HOME = "OWNS_HOME",
  RENTS = "RENTS",
  STAYING_WITH_FAMILY = "STAYING_WITH_FAMILY",
  SHELTER = "SHELTER",
  HOMELESS = "HOMELESS",
  TRANSITIONAL_HOUSING = "TRANSITIONAL_HOUSING",
  OTHER = "OTHER",
}

export enum StabilityLevel {
  STABLE = "STABLE",
  AT_RISK = "AT_RISK",
  UNSTABLE = "UNSTABLE",
  CRISIS = "CRISIS",
}

export enum FoodSecurityLevel {
  SECURE = "SECURE",
  MARGINAL = "MARGINAL",
  LOW = "LOW",
  VERY_LOW = "VERY_LOW",
}

export enum TransportationAccess {
  OWNS_VEHICLE = "OWNS_VEHICLE",
  PUBLIC_TRANSIT = "PUBLIC_TRANSIT",
  RIDES_FROM_FAMILY = "RIDES_FROM_FAMILY",
  MEDICAL_TRANSPORT = "MEDICAL_TRANSPORT",
  LIMITED = "LIMITED",
  NONE = "NONE",
}

export enum UtilitiesAccess {
  STABLE = "STABLE",
  AT_RISK = "AT_RISK",
  SHUT_OFF_THREATENED = "SHUT_OFF_THREATENED",
  DISCONNECTED = "DISCONNECTED",
}

export enum EmploymentStatus {
  EMPLOYED_FULL_TIME = "EMPLOYED_FULL_TIME",
  EMPLOYED_PART_TIME = "EMPLOYED_PART_TIME",
  UNEMPLOYED = "UNEMPLOYED",
  DISABLED = "DISABLED",
  RETIRED = "RETIRED",
  STUDENT = "STUDENT",
  HOMEMAKER = "HOMEMAKER",
}

export enum IncomeLevel {
  BELOW_POVERTY = "BELOW_POVERTY",
  LOW_INCOME = "LOW_INCOME",
  MODERATE_INCOME = "MODERATE_INCOME",
  MIDDLE_INCOME = "MIDDLE_INCOME",
  HIGH_INCOME = "HIGH_INCOME",
  DECLINE_TO_ANSWER = "DECLINE_TO_ANSWER",
}

export enum EducationLevel {
  LESS_THAN_HIGH_SCHOOL = "LESS_THAN_HIGH_SCHOOL",
  HIGH_SCHOOL = "HIGH_SCHOOL",
  SOME_COLLEGE = "SOME_COLLEGE",
  ASSOCIATES = "ASSOCIATES",
  BACHELORS = "BACHELORS",
  MASTERS = "MASTERS",
  DOCTORATE = "DOCTORATE",
  DECLINE_TO_ANSWER = "DECLINE_TO_ANSWER",
}

export enum SocialSupportLevel {
  STRONG = "STRONG",
  MODERATE = "MODERATE",
  LIMITED = "LIMITED",
  NONE = "NONE",
}

export enum SubstanceUseLevel {
  NONE = "NONE",
  MINIMAL = "MINIMAL",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  IN_RECOVERY = "IN_RECOVERY",
}

export enum MentalHealthStatus {
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  AT_RISK = "AT_RISK",
  CRISIS = "CRISIS",
}

export enum HealthLiteracyLevel {
  HIGH = "HIGH",
  ADEQUATE = "ADEQUATE",
  LIMITED = "LIMITED",
  VERY_LIMITED = "VERY_LIMITED",
}

export enum DigitalAccessLevel {
  FULL_ACCESS = "FULL_ACCESS",
  LIMITED_ACCESS = "LIMITED_ACCESS",
  NO_ACCESS = "NO_ACCESS",
}

export enum ImmigrationStatus {
  CITIZEN = "CITIZEN",
  PERMANENT_RESIDENT = "PERMANENT_RESIDENT",
  REFUGEE = "REFUGEE",
  UNDOCUMENTED = "UNDOCUMENTED",
  VISA = "VISA",
  DECLINE_TO_ANSWER = "DECLINE_TO_ANSWER",
}

export enum ChildCareAccess {
  ADEQUATE = "ADEQUATE",
  LIMITED = "LIMITED",
  NONE = "NONE",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export interface SDOHBarrier {
  type: BarrierType;
  severity: BarrierSeverity;
  description: string;
  impact: string;
}

export enum BarrierType {
  FINANCIAL = "FINANCIAL",
  TRANSPORTATION = "TRANSPORTATION",
  HOUSING = "HOUSING",
  FOOD = "FOOD",
  SOCIAL = "SOCIAL",
  LANGUAGE = "LANGUAGE",
  HEALTH_LITERACY = "HEALTH_LITERACY",
  TECHNOLOGY = "TECHNOLOGY",
  LEGAL = "LEGAL",
  MENTAL_HEALTH = "MENTAL_HEALTH",
}

export enum BarrierSeverity {
  MINOR = "MINOR",
  MODERATE = "MODERATE",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL",
}

export interface SDOHIntervention {
  type: InterventionType;
  referralTo: string;
  referralDate: Date;
  status: InterventionStatus;
  outcome: string | null;
  completedDate: Date | null;
}

export enum InterventionType {
  FOOD_ASSISTANCE = "FOOD_ASSISTANCE",
  HOUSING_ASSISTANCE = "HOUSING_ASSISTANCE",
  FINANCIAL_COUNSELING = "FINANCIAL_COUNSELING",
  TRANSPORTATION_SERVICES = "TRANSPORTATION_SERVICES",
  SOCIAL_SERVICES = "SOCIAL_SERVICES",
  MENTAL_HEALTH_SERVICES = "MENTAL_HEALTH_SERVICES",
  SUBSTANCE_ABUSE_TREATMENT = "SUBSTANCE_ABUSE_TREATMENT",
  LEGAL_AID = "LEGAL_AID",
  COMMUNITY_HEALTH_WORKER = "COMMUNITY_HEALTH_WORKER",
  EDUCATION_SERVICES = "EDUCATION_SERVICES",
}

export enum InterventionStatus {
  REFERRED = "REFERRED",
  ENROLLED = "ENROLLED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
  LOST_CONTACT = "LOST_CONTACT",
}

// ============================================================================
// Care Management Types
// ============================================================================

export interface CareManagementPlan extends BaseEntity {
  patientId: string;
  registryId: string | null;
  title: string;
  goals: CareGoal[];
  interventions: CareIntervention[];
  assignedCareManager: string;
  careTeam: string[];
  startDate: Date;
  endDate: Date | null;
  status: CarePlanStatus;
  complexity: CareComplexity;
  enrollmentReason: string;
  dischargeReason: string | null;
  dischargeDate: Date | null;
  totalContactHours: number;
  lastContactDate: Date | null;
  nextContactDate: Date | null;
  barriers: string[];
  successFactors: string[];
  notes: string | null;
}

export enum CarePlanStatus {
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  DISCONTINUED = "DISCONTINUED",
}

export enum CareComplexity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export interface CareGoal {
  id: string;
  description: string;
  targetDate: Date | null;
  status: GoalStatus;
  progress: number;
  metrics: GoalMetric[];
  barriers: string[];
}

export enum GoalStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  ACHIEVED = "ACHIEVED",
  PARTIALLY_ACHIEVED = "PARTIALLY_ACHIEVED",
  NOT_ACHIEVED = "NOT_ACHIEVED",
  DISCONTINUED = "DISCONTINUED",
}

export interface GoalMetric {
  name: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  lastUpdated: Date;
}

export interface CareIntervention {
  id: string;
  type: string;
  description: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  assignedTo: string;
  status: InterventionStatus;
  outcomes: string[];
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface PopulationHealthMetrics {
  totalPatients: number;
  activeRegistries: number;
  totalCareGaps: number;
  closedGapsThisMonth: number;
  highRiskPatients: number;
  averageRiskScore: number;
  outreachCompleted: number;
  outreachPending: number;
  qualityMeasuresAboveTarget: number;
  qualityMeasuresBelowTarget: number;
  trends: MetricTrend[];
}

export interface MetricTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  direction: TrendDirection;
}

export interface RegistryStatistics {
  registryId: string;
  registryName: string;
  totalPatients: number;
  riskDistribution: RiskDistribution;
  careGapsCount: number;
  avgCareGapsPerPatient: number;
  outreachCompletionRate: number;
  admissionRate: number;
  readmissionRate: number;
  qualityMeasurePerformance: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  critical: number;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateRegistryDto {
  name: string;
  description?: string;
  condition: RegistryCondition;
  icdCodes?: string[];
  snomedCodes?: string[];
  criteria: RegistryCriteria[];
  autoUpdate?: boolean;
  updateFrequency?: UpdateFrequency;
  careTeam?: string[];
  tags?: string[];
}

export interface UpdateRegistryDto extends Partial<CreateRegistryDto> {
  id: string;
}

export interface CreateCareGapDto {
  patientId: string;
  registryId?: string;
  gapType: CareGapType;
  category: CareGapCategory;
  title: string;
  description: string;
  measure?: string;
  measureId?: string;
  dueDate?: Date;
  priority: GapPriority;
  assignedTo?: string;
  recommendations?: string[];
}

export interface UpdateCareGapDto extends Partial<CreateCareGapDto> {
  id: string;
  status?: CareGapStatus;
  closureMethod?: string;
}

export interface CreateOutreachDto {
  patientId: string;
  registryId?: string;
  careGapId?: string;
  type: OutreachType;
  method: OutreachMethod;
  purpose: string;
  priority: GapPriority;
  scheduledDate?: Date;
  assignedTo: string;
}

export interface UpdateOutreachDto extends Partial<CreateOutreachDto> {
  id: string;
  status?: OutreachStatus;
  outcome?: OutreachOutcome;
  response?: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export interface CreateRiskScoreDto {
  patientId: string;
  registryId?: string;
  scoreType: RiskScoreType;
  components: RiskComponent[];
  notes?: string;
}

export interface CreateSDOHDto {
  patientId: string;
  assessedBy: string;
  housing: HousingStatus;
  housingStability: StabilityLevel;
  foodSecurity: FoodSecurityLevel;
  transportation: TransportationAccess;
  utilities: UtilitiesAccess;
  employment: EmploymentStatus;
  income: IncomeLevel;
  education: EducationLevel;
  socialSupport: SocialSupportLevel;
  barriers?: SDOHBarrier[];
  interventions?: SDOHIntervention[];
  notes?: string;
}

export interface UpdateSDOHDto extends Partial<CreateSDOHDto> {
  id: string;
}

export interface BulkOutreachRequest {
  patientIds: string[];
  type: OutreachType;
  method: OutreachMethod;
  purpose: string;
  priority: GapPriority;
  assignedTo: string;
  scheduledDate?: Date;
}

export interface RegistryEnrollmentRequest {
  patientIds: string[];
  registryId: string;
  assignedCareManager?: string;
}

export interface CareGapClosureRequest {
  careGapId: string;
  closureMethod: string;
  notes?: string;
  evidenceDocuments?: string[];
}
