/**
 * Clinical Decision Support (CDS) Module Types
 * Agent 6: Clinical Decision Support Engine
 */

import type { BaseEntity } from "./index";
import type { Allergy, AllergySeverity } from "./patient";
import type { InteractionSeverity } from "./pharmacy";

// ============================================================================
// CDS Rule Types
// ============================================================================

export interface CDSRule extends BaseEntity {
  name: string;
  code: string;
  category: RuleCategory;
  description: string;
  rationale: string;
  enabled: boolean;
  priority: number;
  severity: AlertSeverity;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: RuleMetadata;
  evidenceLevel: EvidenceLevel;
  references: string[];
  version: string;
  effectiveDate: Date;
  expirationDate: Date | null;
  specialty: string | null;
  patientPopulation: PatientPopulation | null;
}

export enum RuleCategory {
  DRUG_INTERACTION = "DRUG_INTERACTION",
  DRUG_ALLERGY = "DRUG_ALLERGY",
  DUPLICATE_THERAPY = "DUPLICATE_THERAPY",
  CONTRAINDICATION = "CONTRAINDICATION",
  AGE_DOSING = "AGE_DOSING",
  RENAL_DOSING = "RENAL_DOSING",
  HEPATIC_DOSING = "HEPATIC_DOSING",
  PREGNANCY = "PREGNANCY",
  LACTATION = "LACTATION",
  LAB_MONITORING = "LAB_MONITORING",
  DIAGNOSIS_GUIDELINE = "DIAGNOSIS_GUIDELINE",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  ORDER_SET = "ORDER_SET",
  QUALITY_MEASURE = "QUALITY_MEASURE",
  CLINICAL_PATHWAY = "CLINICAL_PATHWAY",
}

export enum AlertSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum EvidenceLevel {
  A = "A", // High-quality evidence
  B = "B", // Moderate-quality evidence
  C = "C", // Low-quality evidence
  D = "D", // Very low-quality evidence
  EXPERT_OPINION = "EXPERT_OPINION",
}

export interface RuleCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  valueType: "string" | "number" | "boolean" | "date" | "array" | "object";
  logicalOperator?: "AND" | "OR";
  negate?: boolean;
}

export enum ConditionType {
  PATIENT_AGE = "PATIENT_AGE",
  PATIENT_GENDER = "PATIENT_GENDER",
  PATIENT_WEIGHT = "PATIENT_WEIGHT",
  PATIENT_DIAGNOSIS = "PATIENT_DIAGNOSIS",
  PATIENT_ALLERGY = "PATIENT_ALLERGY",
  PATIENT_PREGNANCY = "PATIENT_PREGNANCY",
  PATIENT_LACTATION = "PATIENT_LACTATION",
  MEDICATION_ACTIVE = "MEDICATION_ACTIVE",
  MEDICATION_CLASS = "MEDICATION_CLASS",
  LAB_RESULT = "LAB_RESULT",
  VITAL_SIGN = "VITAL_SIGN",
  RENAL_FUNCTION = "RENAL_FUNCTION",
  HEPATIC_FUNCTION = "HEPATIC_FUNCTION",
  ORDER_TYPE = "ORDER_TYPE",
  ENCOUNTER_TYPE = "ENCOUNTER_TYPE",
  TIME_SINCE_EVENT = "TIME_SINCE_EVENT",
  CUSTOM = "CUSTOM",
}

export enum ConditionOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN = "LESS_THAN",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  BETWEEN = "BETWEEN",
  EXISTS = "EXISTS",
  NOT_EXISTS = "NOT_EXISTS",
  MATCHES_PATTERN = "MATCHES_PATTERN",
}

export interface RuleAction {
  id: string;
  type: ActionType;
  message: string;
  recommendation: string | null;
  alternatives: string[] | null;
  requiresOverride: boolean;
  overrideReasons: string[] | null;
  notifyProvider: boolean;
  escalate: boolean;
  escalationLevel: number | null;
}

export enum ActionType {
  ALERT = "ALERT",
  WARNING = "WARNING",
  BLOCK = "BLOCK",
  SUGGEST = "SUGGEST",
  REQUIRE_ACKNOWLEDGMENT = "REQUIRE_ACKNOWLEDGMENT",
  REQUIRE_OVERRIDE = "REQUIRE_OVERRIDE",
  NOTIFY = "NOTIFY",
  ESCALATE = "ESCALATE",
  LOG = "LOG",
}

export interface RuleMetadata {
  source: string;
  version: string;
  lastReviewDate: Date | null;
  reviewSchedule: string | null;
  citations: string[];
  customData: Record<string, any>;
}

export interface PatientPopulation {
  ageRange: { min: number; max: number } | null;
  genders: string[] | null;
  conditions: string[] | null;
  excludeConditions: string[] | null;
}

// ============================================================================
// CDS Alert Types
// ============================================================================

export interface CDSAlert extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string | null;
  alternatives: string[] | null;
  evidence: AlertEvidence;
  context: CDSContext;
  triggeredAt: Date;
  triggeredBy: string;
  status: AlertStatus;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  overriddenAt: Date | null;
  overriddenBy: string | null;
  overrideReason: string | null;
  dismissedAt: Date | null;
  dismissedBy: string | null;
  expiresAt: Date | null;
  requiresOverride: boolean;
  notificationSent: boolean;
  escalated: boolean;
  escalationLevel: number | null;
}

export enum AlertStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  OVERRIDDEN = "OVERRIDDEN",
  DISMISSED = "DISMISSED",
  EXPIRED = "EXPIRED",
  RESOLVED = "RESOLVED",
}

export interface AlertEvidence {
  ruleVersion: string;
  evidenceLevel: EvidenceLevel;
  references: string[];
  clinicalData: Record<string, any>;
  calculatedValues: Record<string, any>;
}

export interface CDSContext {
  patientAge: number | null;
  patientWeight: number | null;
  patientGender: string | null;
  isPregnant: boolean;
  isLactating: boolean;
  renalFunction: RenalFunction | null;
  hepaticFunction: HepaticFunction | null;
  activeMedications: ContextMedication[];
  recentLabs: ContextLab[];
  diagnoses: ContextDiagnosis[];
  allergies: ContextAllergy[];
  vitals: ContextVital[] | null;
}

export interface RenalFunction {
  creatinine: number;
  gfr: number;
  egfr: number;
  stage:
    | "NORMAL"
    | "STAGE_1"
    | "STAGE_2"
    | "STAGE_3A"
    | "STAGE_3B"
    | "STAGE_4"
    | "STAGE_5"
    | "ESRD";
}

export interface HepaticFunction {
  ast: number;
  alt: number;
  bilirubin: number;
  albumin: number;
  inr: number;
  childPughScore: number;
  childPughClass: "A" | "B" | "C" | null;
}

export interface ContextMedication {
  id: string;
  name: string;
  genericName: string;
  rxcui: string | null;
  dose: string;
  frequency: string;
  route: string;
  startDate: Date;
  therapeuticClass: string | null;
}

export interface ContextLab {
  code: string;
  name: string;
  value: number;
  unit: string;
  resultDate: Date;
  abnormal: boolean;
}

export interface ContextDiagnosis {
  icdCode: string;
  description: string;
  diagnosedDate: Date;
  status: "ACTIVE" | "RESOLVED";
}

export interface ContextAllergy {
  allergen: string;
  type: string;
  reaction: string;
  severity: AllergySeverity;
}

export interface ContextVital {
  type: string;
  value: number;
  unit: string;
  recordedAt: Date;
}

// ============================================================================
// Drug Interaction Types
// ============================================================================

export interface DrugDrugInteraction extends BaseEntity {
  drug1: DrugIdentifier;
  drug2: DrugIdentifier;
  severity: InteractionSeverity;
  description: string;
  clinicalEffects: string;
  mechanism: string | null;
  management: string;
  alternatives: string[] | null;
  references: string[];
  evidenceLevel: EvidenceLevel;
  monitoringParameters: string[] | null;
  onsetTime: string | null;
  documentation: DocumentationLevel;
}

export enum DocumentationLevel {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  THEORETICAL = "THEORETICAL",
}

export interface DrugIdentifier {
  id: string;
  name: string;
  genericName: string;
  rxcui: string | null;
  ndc: string | null;
  therapeuticClass: string;
}

export interface DrugAllergyInteraction {
  drugId: string;
  drugName: string;
  allergen: string;
  crossReactivity: boolean;
  severity: AllergySeverity;
  description: string;
  management: string;
}

// ============================================================================
// Order Set Types
// ============================================================================

export interface OrderSet extends BaseEntity {
  name: string;
  code: string;
  category: string;
  description: string;
  indication: string;
  specialty: string | null;
  items: OrderSetItem[];
  guidelines: string | null;
  references: string[];
  evidenceLevel: EvidenceLevel;
  isDefault: boolean;
  usageCount: number;
}

export interface OrderSetItem {
  id: string;
  order: number;
  type:
    | "MEDICATION"
    | "LAB"
    | "IMAGING"
    | "PROCEDURE"
    | "NURSING"
    | "DIET"
    | "REFERRAL";
  code: string;
  description: string;
  instructions: string | null;
  priority: "ROUTINE" | "URGENT" | "STAT";
  isRequired: boolean;
  isPreselected: boolean;
  alternatives: string[] | null;
  conditions: RuleCondition[] | null;
}

// ============================================================================
// Alert Fatigue Management Types
// ============================================================================

export interface AlertFatigueMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  acknowledgedAlerts: number;
  overriddenAlerts: number;
  dismissedAlerts: number;
  acknowledgeRate: number;
  overrideRate: number;
  dismissRate: number;
  averageResponseTime: number;
  alertsByCategory: Record<RuleCategory, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByProvider: Record<string, number>;
  timeRange: { start: Date; end: Date };
}

export interface AlertSuppressionRule {
  id: string;
  ruleId: string;
  suppressionType: SuppressionType;
  suppressionPeriod: number; // minutes
  maxOccurrences: number | null;
  conditions: Record<string, any>;
  enabled: boolean;
}

export enum SuppressionType {
  DUPLICATE = "DUPLICATE",
  TIME_BASED = "TIME_BASED",
  FREQUENCY_BASED = "FREQUENCY_BASED",
  CONTEXT_BASED = "CONTEXT_BASED",
  PROVIDER_BASED = "PROVIDER_BASED",
}

export interface AlertOverride {
  alertId: string;
  overriddenBy: string;
  overriddenAt: Date;
  reason: string;
  reasonCode: OverrideReasonCode;
  notes: string | null;
  acknowledgedRisk: boolean;
}

export enum OverrideReasonCode {
  CLINICALLY_APPROPRIATE = "CLINICALLY_APPROPRIATE",
  PATIENT_SPECIFIC_FACTORS = "PATIENT_SPECIFIC_FACTORS",
  BENEFIT_OUTWEIGHS_RISK = "BENEFIT_OUTWEIGHS_RISK",
  ALTERNATIVE_NOT_AVAILABLE = "ALTERNATIVE_NOT_AVAILABLE",
  PATIENT_PREFERENCE = "PATIENT_PREFERENCE",
  ALERT_NOT_APPLICABLE = "ALERT_NOT_APPLICABLE",
  DUPLICATE_ALERT = "DUPLICATE_ALERT",
  OTHER = "OTHER",
}

// ============================================================================
// CDS Evaluation Types
// ============================================================================

export interface CDSEvaluationRequest {
  patientId: string;
  encounterId?: string;
  context: CDSContext;
  trigger: EvaluationTrigger;
  scope?: RuleCategory[];
  excludeRules?: string[];
}

export enum EvaluationTrigger {
  MEDICATION_ORDER = "MEDICATION_ORDER",
  LAB_ORDER = "LAB_ORDER",
  IMAGING_ORDER = "IMAGING_ORDER",
  PROCEDURE_ORDER = "PROCEDURE_ORDER",
  DIAGNOSIS_ENTRY = "DIAGNOSIS_ENTRY",
  ENCOUNTER_START = "ENCOUNTER_START",
  LAB_RESULT = "LAB_RESULT",
  VITAL_SIGN = "VITAL_SIGN",
  ALLERGY_ENTRY = "ALLERGY_ENTRY",
  MANUAL_EVALUATION = "MANUAL_EVALUATION",
}

export interface CDSEvaluationResult {
  patientId: string;
  encounterId: string | null;
  alerts: CDSAlert[];
  suggestions: CDSSuggestion[];
  orderSets: OrderSet[];
  evaluatedRules: number;
  firedRules: number;
  evaluationTime: number; // milliseconds
  timestamp: Date;
}

export interface CDSSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  evidence: string[];
  action: string | null;
  priority: number;
}

export enum SuggestionType {
  ALTERNATIVE_MEDICATION = "ALTERNATIVE_MEDICATION",
  DOSE_ADJUSTMENT = "DOSE_ADJUSTMENT",
  LAB_MONITORING = "LAB_MONITORING",
  DIAGNOSTIC_TEST = "DIAGNOSTIC_TEST",
  CLINICAL_GUIDELINE = "CLINICAL_GUIDELINE",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  PATIENT_EDUCATION = "PATIENT_EDUCATION",
  ORDER_SET = "ORDER_SET",
}

// ============================================================================
// CDS Configuration Types
// ============================================================================

export interface CDSConfiguration extends BaseEntity {
  alertFatigueThreshold: number;
  maxAlertsPerEncounter: number;
  suppressDuplicateAlerts: boolean;
  duplicateSuppressionWindow: number; // minutes
  enabledCategories: RuleCategory[];
  disabledRules: string[];
  severityThreshold: AlertSeverity;
  autoAcknowledgeInfo: boolean;
  requireOverrideDocumentation: boolean;
  escalationEnabled: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  criticalAlertsOnly: boolean;
  notifyProviders: string[];
  notifyPharmacists: string[];
  notifyNurses: string[];
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateCDSRuleDto {
  name: string;
  code: string;
  category: RuleCategory;
  description: string;
  rationale: string;
  severity: AlertSeverity;
  conditions: RuleCondition[];
  actions: RuleAction[];
  evidenceLevel: EvidenceLevel;
  references: string[];
  effectiveDate: Date;
  expirationDate?: Date;
  specialty?: string;
  patientPopulation?: PatientPopulation;
}

export interface UpdateCDSRuleDto extends Partial<CreateCDSRuleDto> {
  id: string;
  enabled?: boolean;
}

export interface AcknowledgeAlertDto {
  alertId: string;
  userId: string;
  notes?: string;
}

export interface OverrideAlertDto {
  alertId: string;
  userId: string;
  reason: string;
  reasonCode: OverrideReasonCode;
  notes?: string;
  acknowledgedRisk: boolean;
}

export interface DismissAlertDto {
  alertId: string;
  userId: string;
  reason?: string;
}
