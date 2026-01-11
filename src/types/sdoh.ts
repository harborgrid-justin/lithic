/**
 * Social Determinants of Health (SDOH) Module Types
 * Agent 6: SDOH Module
 *
 * Comprehensive type definitions for SDOH screening, assessment,
 * resource management, and intervention tracking.
 */

import type { BaseEntity } from "./index";

// ============================================================================
// SDOH Screening Types
// ============================================================================

export interface SDOHScreening extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  questionnaireType: QuestionnaireType;
  status: ScreeningStatus;
  startedAt: Date;
  completedAt: Date | null;
  administeredBy: string;
  language: string;
  responses: ScreeningResponse[];
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  identifiedNeeds: IdentifiedNeed[];
  recommendedZCodes: string[];
  notes: string | null;
  followUpRequired: boolean;
  followUpDate: Date | null;
}

export enum QuestionnaireType {
  PRAPARE = "PRAPARE",
  AHC_HRSN = "AHC_HRSN",
  CUSTOM = "CUSTOM",
}

export enum ScreeningStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum RiskLevel {
  NONE = "NONE",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface ScreeningResponse {
  questionId: string;
  questionText: string;
  answer: any;
  answerText: string;
  domain: SDOHDomain;
  riskIndicator: boolean;
  weight: number;
}

export interface IdentifiedNeed {
  id: string;
  domain: SDOHDomain;
  category: string;
  description: string;
  severity: RiskLevel;
  identified: Date;
  zCodes: string[];
  requiresIntervention: boolean;
  priority: Priority;
}

export enum SDOHDomain {
  HOUSING_INSTABILITY = "HOUSING_INSTABILITY",
  FOOD_INSECURITY = "FOOD_INSECURITY",
  TRANSPORTATION = "TRANSPORTATION",
  UTILITY_NEEDS = "UTILITY_NEEDS",
  INTERPERSONAL_SAFETY = "INTERPERSONAL_SAFETY",
  EMPLOYMENT = "EMPLOYMENT",
  EDUCATION = "EDUCATION",
  FINANCIAL_STRAIN = "FINANCIAL_STRAIN",
  SOCIAL_ISOLATION = "SOCIAL_ISOLATION",
  HEALTHCARE_ACCESS = "HEALTHCARE_ACCESS",
  LEGAL_ISSUES = "LEGAL_ISSUES",
  CHILDCARE = "CHILDCARE",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// ============================================================================
// Questionnaire Definition Types
// ============================================================================

export interface Questionnaire {
  id: string;
  name: string;
  type: QuestionnaireType;
  version: string;
  description: string;
  author: string;
  publishDate: Date;
  validUntil: Date | null;
  languages: string[];
  estimatedMinutes: number;
  sections: QuestionnaireSection[];
  scoringRules: ScoringRule[];
  active: boolean;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  domain: SDOHDomain;
  questions: Question[];
  conditional: ConditionalLogic | null;
}

export interface Question {
  id: string;
  text: string;
  description: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  domain: SDOHDomain;
  options: QuestionOption[] | null;
  validation: ValidationRule | null;
  conditional: ConditionalLogic | null;
  riskWeighting: number;
  zCodeMappings: string[];
}

export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  YES_NO = "YES_NO",
  SCALE = "SCALE",
  BOOLEAN = "BOOLEAN",
}

export interface QuestionOption {
  id: string;
  text: string;
  value: any;
  order: number;
  riskScore: number;
  triggersFollowUp: boolean;
  zCodeMapping: string | null;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value: any;
  message: string;
}

export interface ConditionalLogic {
  type: "show" | "hide" | "require";
  conditions: Condition[];
  operator: "AND" | "OR";
}

export interface Condition {
  questionId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: any;
}

export interface ScoringRule {
  id: string;
  name: string;
  description: string;
  domain: SDOHDomain | null;
  calculation: string;
  threshold: number;
  riskLevel: RiskLevel;
}

// ============================================================================
// ICD-10 Z-Code Types (Social Determinants Codes: Z55-Z65)
// ============================================================================

export interface ZCode {
  code: string;
  display: string;
  category: ZCodeCategory;
  domain: SDOHDomain;
  description: string;
  parent: string | null;
  children: string[];
  billable: boolean;
  effectiveDate: Date;
  notes: string | null;
}

export enum ZCodeCategory {
  Z55 = "Z55", // Problems related to education and literacy
  Z56 = "Z56", // Problems related to employment and unemployment
  Z57 = "Z57", // Occupational exposure to risk factors
  Z58 = "Z58", // Problems related to physical environment
  Z59 = "Z59", // Problems related to housing and economic circumstances
  Z60 = "Z60", // Problems related to social environment
  Z62 = "Z62", // Problems related to upbringing
  Z63 = "Z63", // Other problems related to primary support group
  Z64 = "Z64", // Problems related to certain psychosocial circumstances
  Z65 = "Z65", // Problems related to other psychosocial circumstances
}

export interface ZCodeSuggestion {
  zCode: ZCode;
  confidence: number;
  reasoning: string;
  sourceQuestions: string[];
  domain: SDOHDomain;
  autoApply: boolean;
}

// ============================================================================
// Community Resource Types
// ============================================================================

export interface CommunityResource extends BaseEntity {
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  domains: SDOHDomain[];
  description: string;
  eligibilityCriteria: string | null;
  services: string[];
  address: ResourceAddress;
  contactInfo: ResourceContactInfo;
  hours: OperatingHours[];
  languages: string[];
  accessibility: AccessibilityInfo;
  serviceArea: ServiceArea;
  capacity: ResourceCapacity | null;
  costs: CostInfo[];
  qualityRating: number | null;
  reviewCount: number;
  lastVerified: Date;
  status: ResourceStatus;
  externalIds: Record<string, string>;
  tags: string[];
  website: string | null;
  socialMedia: Record<string, string>;
}

export enum ResourceType {
  GOVERNMENT = "GOVERNMENT",
  NONPROFIT = "NONPROFIT",
  FAITH_BASED = "FAITH_BASED",
  COMMERCIAL = "COMMERCIAL",
  COMMUNITY = "COMMUNITY",
}

export enum ResourceCategory {
  FOOD_ASSISTANCE = "FOOD_ASSISTANCE",
  HOUSING_ASSISTANCE = "HOUSING_ASSISTANCE",
  TRANSPORTATION = "TRANSPORTATION",
  HEALTHCARE = "HEALTHCARE",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  SUBSTANCE_ABUSE = "SUBSTANCE_ABUSE",
  EMPLOYMENT = "EMPLOYMENT",
  EDUCATION = "EDUCATION",
  FINANCIAL_ASSISTANCE = "FINANCIAL_ASSISTANCE",
  LEGAL_SERVICES = "LEGAL_SERVICES",
  CHILDCARE = "CHILDCARE",
  UTILITIES = "UTILITIES",
  CLOTHING = "CLOTHING",
  SAFETY = "SAFETY",
  OTHER = "OTHER",
}

export interface ResourceAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ResourceContactInfo {
  phone: string;
  phoneExt: string | null;
  fax: string | null;
  email: string | null;
  tollFree: string | null;
  crisis24Hour: string | null;
  textLine: string | null;
}

export interface OperatingHours {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string; // HH:MM format
  closeTime: string;
  closed: boolean;
  notes: string | null;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  parkingAvailable: boolean;
  publicTransitNearby: boolean;
  interpreterServices: boolean;
  ttyAvailable: boolean;
  notes: string | null;
}

export interface ServiceArea {
  type: "ZIP_CODES" | "COUNTIES" | "CITIES" | "RADIUS" | "STATEWIDE" | "NATIONWIDE";
  coverage: string[];
  radiusMiles: number | null;
  centerLat: number | null;
  centerLng: number | null;
}

export interface ResourceCapacity {
  current: number;
  maximum: number;
  waitlistAvailable: boolean;
  estimatedWaitDays: number | null;
  lastUpdated: Date;
}

export interface CostInfo {
  serviceType: string;
  cost: number;
  unit: string;
  frequency: string;
  slidingScale: boolean;
  insuranceAccepted: boolean;
  notes: string | null;
}

export enum ResourceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  TEMPORARILY_CLOSED = "TEMPORARILY_CLOSED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ARCHIVED = "ARCHIVED",
}

// ============================================================================
// Referral Types
// ============================================================================

export interface SDOHReferral extends BaseEntity {
  patientId: string;
  screeningId: string | null;
  resourceId: string;
  identifiedNeedId: string | null;
  domain: SDOHDomain;
  referralType: ReferralType;
  priority: Priority;
  status: ReferralStatus;
  referredBy: string;
  referredDate: Date;
  reason: string;
  notes: string | null;
  consentObtained: boolean;
  consentDate: Date | null;
  contactAttempts: ContactAttempt[];
  outcomes: ReferralOutcome[];
  closedDate: Date | null;
  closedReason: string | null;
  followUpDate: Date | null;
  followUpRequired: boolean;
}

export enum ReferralType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
  WARM_HANDOFF = "WARM_HANDOFF",
  COLD_REFERRAL = "COLD_REFERRAL",
}

export enum ReferralStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  CONTACTED = "CONTACTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
  NO_SHOW = "NO_SHOW",
  CANCELLED = "CANCELLED",
  UNSUCCESSFUL = "UNSUCCESSFUL",
}

export interface ContactAttempt {
  id: string;
  date: Date;
  method: ContactMethod;
  contactedBy: string;
  outcome: string;
  notes: string | null;
  nextSteps: string | null;
}

export enum ContactMethod {
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  SMS = "SMS",
  IN_PERSON = "IN_PERSON",
  PORTAL = "PORTAL",
  MAIL = "MAIL",
}

export interface ReferralOutcome {
  id: string;
  date: Date;
  type: OutcomeType;
  description: string;
  servicesReceived: string[];
  benefitReceived: boolean;
  barriers: string[];
  recordedBy: string;
  followUpNeeded: boolean;
}

export enum OutcomeType {
  SERVICE_CONNECTED = "SERVICE_CONNECTED",
  SERVICE_RECEIVED = "SERVICE_RECEIVED",
  NEED_MET = "NEED_MET",
  PARTIAL_NEED_MET = "PARTIAL_NEED_MET",
  NEED_NOT_MET = "NEED_NOT_MET",
  INELIGIBLE = "INELIGIBLE",
  RESOURCE_UNAVAILABLE = "RESOURCE_UNAVAILABLE",
  PATIENT_DECLINED = "PATIENT_DECLINED",
  LOST_TO_FOLLOW_UP = "LOST_TO_FOLLOW_UP",
}

// ============================================================================
// Care Coordination Types
// ============================================================================

export interface SDOHCareCoordination extends BaseEntity {
  patientId: string;
  coordinatorId: string;
  careTeam: CareTeamMember[];
  identifiedNeeds: string[]; // References to IdentifiedNeed IDs
  referrals: string[]; // References to Referral IDs
  interventions: string[]; // References to Intervention IDs
  goals: CoordinationGoal[];
  barriers: Barrier[];
  status: CoordinationStatus;
  startDate: Date;
  endDate: Date | null;
  reviewDate: Date | null;
  notes: string | null;
}

export interface CareTeamMember {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  organization: string | null;
  contactInfo: string;
  responsibilities: string[];
  active: boolean;
}

export interface CoordinationGoal {
  id: string;
  description: string;
  domain: SDOHDomain;
  targetDate: Date;
  status: GoalStatus;
  progress: number; // 0-100 percentage
  milestones: Milestone[];
  barriers: string[];
}

export enum GoalStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  CANCELLED = "CANCELLED",
}

export interface Milestone {
  id: string;
  description: string;
  dueDate: Date;
  completedDate: Date | null;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
}

export interface Barrier {
  id: string;
  type: BarrierType;
  description: string;
  domain: SDOHDomain | null;
  identifiedDate: Date;
  status: "ACTIVE" | "RESOLVED" | "MITIGATED";
  resolutionStrategy: string | null;
  resolvedDate: Date | null;
}

export enum BarrierType {
  TRANSPORTATION = "TRANSPORTATION",
  LANGUAGE = "LANGUAGE",
  LITERACY = "LITERACY",
  CULTURAL = "CULTURAL",
  FINANCIAL = "FINANCIAL",
  TRUST = "TRUST",
  AVAILABILITY = "AVAILABILITY",
  ELIGIBILITY = "ELIGIBILITY",
  DOCUMENTATION = "DOCUMENTATION",
  TECHNOLOGY = "TECHNOLOGY",
  OTHER = "OTHER",
}

export enum CoordinationStatus {
  ACTIVE = "ACTIVE",
  MONITORING = "MONITORING",
  COMPLETED = "COMPLETED",
  DISCONTINUED = "DISCONTINUED",
}

// ============================================================================
// Intervention Types
// ============================================================================

export interface SDOHIntervention extends BaseEntity {
  patientId: string;
  referralId: string | null;
  identifiedNeedId: string;
  type: InterventionType;
  domain: SDOHDomain;
  title: string;
  description: string;
  status: InterventionStatus;
  priority: Priority;
  assignedTo: string;
  startDate: Date;
  endDate: Date | null;
  targetCompletionDate: Date;
  activities: InterventionActivity[];
  resources: string[];
  outcomes: InterventionOutcome | null;
  cost: number | null;
  fundingSource: string | null;
  evidenceBased: boolean;
  evidenceSource: string | null;
}

export enum InterventionType {
  REFERRAL = "REFERRAL",
  DIRECT_ASSISTANCE = "DIRECT_ASSISTANCE",
  EDUCATION = "EDUCATION",
  COUNSELING = "COUNSELING",
  CASE_MANAGEMENT = "CASE_MANAGEMENT",
  NAVIGATION = "NAVIGATION",
  ADVOCACY = "ADVOCACY",
  ASSESSMENT = "ASSESSMENT",
  FOLLOW_UP = "FOLLOW_UP",
  OTHER = "OTHER",
}

export enum InterventionStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
  CANCELLED = "CANCELLED",
  UNSUCCESSFUL = "UNSUCCESSFUL",
}

export interface InterventionActivity {
  id: string;
  description: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  performedBy: string | null;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  notes: string | null;
  duration: number | null; // minutes
}

export interface InterventionOutcome {
  completedDate: Date;
  success: boolean;
  description: string;
  needMet: boolean;
  patientSatisfaction: number | null; // 1-5 scale
  barriers: string[];
  lessonsLearned: string | null;
  followUpNeeded: boolean;
  followUpPlan: string | null;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface SDOHAnalytics {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  population: PopulationMetrics;
  screening: ScreeningMetrics;
  needs: NeedsMetrics;
  referrals: ReferralMetrics;
  outcomes: OutcomeMetrics;
  resources: ResourceUtilizationMetrics;
  disparities: DisparityMetrics;
  quality: QualityMetrics;
  financial: FinancialMetrics;
}

export interface PopulationMetrics {
  totalPatients: number;
  patientsScreened: number;
  screeningRate: number;
  patientsWithNeeds: number;
  prevalenceRate: number;
  demographics: Record<string, any>;
  riskDistribution: Record<RiskLevel, number>;
}

export interface ScreeningMetrics {
  totalScreenings: number;
  completionRate: number;
  averageTimeMinutes: number;
  byQuestionnaire: Record<QuestionnaireType, number>;
  byLanguage: Record<string, number>;
  positiveFindingsRate: number;
}

export interface NeedsMetrics {
  totalNeeds: number;
  byDomain: Record<SDOHDomain, number>;
  bySeverity: Record<RiskLevel, number>;
  topNeeds: Array<{ domain: SDOHDomain; count: number }>;
  addressedNeeds: number;
  unaddressedNeeds: number;
}

export interface ReferralMetrics {
  totalReferrals: number;
  byStatus: Record<ReferralStatus, number>;
  byDomain: Record<SDOHDomain, number>;
  completionRate: number;
  averageDaysToComplete: number;
  closedLoopRate: number;
  successRate: number;
}

export interface OutcomeMetrics {
  totalOutcomes: number;
  successfulOutcomes: number;
  successRate: number;
  needsMetRate: number;
  patientSatisfaction: number;
  barriers: Array<{ type: BarrierType; count: number }>;
}

export interface ResourceUtilizationMetrics {
  totalResources: number;
  activeResources: number;
  mostUsedResources: Array<{ resourceId: string; name: string; referrals: number }>;
  resourcesByDomain: Record<SDOHDomain, number>;
  capacityUtilization: number;
}

export interface DisparityMetrics {
  byRace: Record<string, any>;
  byEthnicity: Record<string, any>;
  byLanguage: Record<string, any>;
  byGeography: Record<string, any>;
  byInsurance: Record<string, any>;
}

export interface QualityMetrics {
  screeningWithin12Months: number;
  timelyFollowUp: number;
  documentationCompliance: number;
  zCodeUtilization: number;
  careCoordinationEngagement: number;
}

export interface FinancialMetrics {
  totalInvestment: number;
  costPerScreening: number;
  costPerReferral: number;
  costPerIntervention: number;
  roi: number | null;
  valueMeasures: Record<string, number>;
}

// ============================================================================
// Population Health Types
// ============================================================================

export interface PopulationSDOHInsight {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: InsightType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedPopulation: PopulationCohort;
  domains: SDOHDomain[];
  metrics: Record<string, number>;
  trend: "IMPROVING" | "STABLE" | "WORSENING";
  recommendations: string[];
  generatedAt: Date;
  validUntil: Date | null;
}

export enum InsightType {
  UNMET_NEEDS = "UNMET_NEEDS",
  HIGH_RISK_POPULATION = "HIGH_RISK_POPULATION",
  RESOURCE_GAP = "RESOURCE_GAP",
  DISPARITY = "DISPARITY",
  TREND = "TREND",
  QUALITY_OPPORTUNITY = "QUALITY_OPPORTUNITY",
  COST_OPPORTUNITY = "COST_OPPORTUNITY",
}

export interface PopulationCohort {
  name: string;
  description: string;
  criteria: Record<string, any>;
  size: number;
  characteristics: Record<string, any>;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface Resource211Integration {
  enabled: boolean;
  apiEndpoint: string;
  apiKey: string;
  coverage: string[];
  lastSync: Date | null;
  syncFrequency: number; // hours
  autoUpdate: boolean;
}

export interface UniteUsIntegration {
  enabled: boolean;
  apiEndpoint: string;
  apiKey: string;
  networkId: string;
  autoReferral: boolean;
  closedLoopTracking: boolean;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateScreeningDto {
  patientId: string;
  encounterId?: string;
  questionnaireType: QuestionnaireType;
  language?: string;
  administeredBy: string;
}

export interface UpdateScreeningDto {
  id: string;
  responses?: ScreeningResponse[];
  status?: ScreeningStatus;
  notes?: string;
}

export interface CompleteScreeningDto {
  id: string;
  responses: ScreeningResponse[];
  notes?: string;
}

export interface CreateReferralDto {
  patientId: string;
  screeningId?: string;
  resourceId: string;
  identifiedNeedId?: string;
  domain: SDOHDomain;
  referralType: ReferralType;
  priority: Priority;
  reason: string;
  notes?: string;
  consentObtained: boolean;
}

export interface UpdateReferralDto {
  id: string;
  status?: ReferralStatus;
  notes?: string;
  followUpDate?: Date;
}

export interface CreateResourceDto {
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  domains: SDOHDomain[];
  description: string;
  services: string[];
  address: ResourceAddress;
  contactInfo: ResourceContactInfo;
  hours?: OperatingHours[];
  languages?: string[];
}

export interface ResourceSearchParams {
  query?: string;
  domains?: SDOHDomain[];
  categories?: ResourceCategory[];
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  zipCode?: string;
  city?: string;
  state?: string;
  languages?: string[];
  availability?: boolean;
  wheelchairAccessible?: boolean;
  page?: number;
  limit?: number;
}

export interface ResourceSearchResult {
  resource: CommunityResource;
  distance?: number;
  matchScore: number;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "WAITLIST" | "UNAVAILABLE";
}
