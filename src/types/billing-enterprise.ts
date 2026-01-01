/**
 * Lithic Enterprise v0.3 - Revenue Cycle Management Types
 * Comprehensive billing types for Epic-level RCM functionality
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Charge Capture Types
// ============================================================================

export interface ChargeCapture extends BaseEntity {
  encounterId: string;
  patientId: string;
  providerId: string;
  serviceDate: Date;
  status: ChargeCaptureStatus;
  captureMethod: CaptureMethod;
  charges: CapturedCharge[];
  reviewedBy: string | null;
  reviewedAt: Date | null;
  submittedAt: Date | null;
  totalCharges: number;
  totalExpectedReimbursement: number;
  flags: ChargeCaptureFlag[];
}

export enum ChargeCaptureStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  REVIEWED = "REVIEWED",
  SUBMITTED = "SUBMITTED",
  BILLED = "BILLED",
}

export enum CaptureMethod {
  MANUAL = "MANUAL",
  AUTO_FROM_ORDERS = "AUTO_FROM_ORDERS",
  AUTO_FROM_ENCOUNTER = "AUTO_FROM_ENCOUNTER",
  SUPERBILL = "SUPERBILL",
  TEMPLATE = "TEMPLATE",
}

export interface CapturedCharge {
  id: string;
  code: string;
  codeType: CodeType;
  description: string;
  modifiers: Modifier[];
  units: number;
  unitPrice: number;
  totalCharge: number;
  diagnosisPointers: number[];
  placeOfService: PlaceOfService;
  revenueCode: string | null;
  ndcCode: string | null;
  drugQuantity: number | null;
  suggestedByAI: boolean;
  confidenceScore: number | null;
}

export enum CodeType {
  CPT = "CPT",
  HCPCS = "HCPCS",
  ICD10_PCS = "ICD10_PCS",
  REVENUE = "REVENUE",
  NDC = "NDC",
}

export interface Modifier {
  code: string;
  description: string;
  sequence: number;
}

export enum PlaceOfService {
  OFFICE = "11",
  HOME = "12",
  ASSISTED_LIVING = "13",
  GROUP_HOME = "14",
  MOBILE_UNIT = "15",
  TEMP_LODGING = "16",
  WALK_IN = "17",
  PLACE_OF_EMPLOYMENT = "18",
  OFF_CAMPUS_OUTPATIENT = "19",
  URGENT_CARE = "20",
  INPATIENT_HOSPITAL = "21",
  ON_CAMPUS_OUTPATIENT = "22",
  EMERGENCY_ROOM = "23",
  ASC = "24",
  BIRTHING_CENTER = "25",
  MILITARY_FACILITY = "26",
  SNF = "31",
  NURSING_FACILITY = "32",
  CUSTODIAL_CARE = "33",
  HOSPICE = "34",
  RURAL_HEALTH_CLINIC = "72",
  INDEPENDENT_CLINIC = "49",
  FQHC = "50",
  INPATIENT_PSYCH = "51",
  PSYCHIATRIC_FACILITY = "52",
  COMMUNITY_MENTAL_HEALTH = "53",
  ICF = "54",
  RESIDENTIAL_SUBSTANCE_ABUSE = "55",
  PSYCHIATRIC_RESIDENTIAL = "56",
  NON_RESIDENTIAL_SUBSTANCE_ABUSE = "57",
  NON_RESIDENTIAL_OPIOID = "58",
  MASS_IMMUNIZATION = "60",
  COMPREHENSIVE_INPATIENT_REHAB = "61",
  COMPREHENSIVE_OUTPATIENT_REHAB = "62",
  END_STAGE_RENAL_DISEASE = "65",
}

export interface ChargeCaptureFlag {
  type: FlagType;
  severity: FlagSeverity;
  message: string;
  field: string | null;
}

export enum FlagType {
  MISSING_MODIFIER = "MISSING_MODIFIER",
  INVALID_CODE_COMBINATION = "INVALID_CODE_COMBINATION",
  MEDICAL_NECESSITY = "MEDICAL_NECESSITY",
  DUPLICATE_CHARGE = "DUPLICATE_CHARGE",
  PRICING_ISSUE = "PRICING_ISSUE",
  AUTHORIZATION_REQUIRED = "AUTHORIZATION_REQUIRED",
  TIMELY_FILING = "TIMELY_FILING",
}

export enum FlagSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// E/M Level Calculation Types
// ============================================================================

export interface EMLevel {
  code: string;
  level: number;
  type: EMType;
  score: EMScore;
  factors: EMFactor[];
  recommendation: string;
  supportingDocumentation: string[];
}

export enum EMType {
  OFFICE_NEW = "OFFICE_NEW",
  OFFICE_ESTABLISHED = "OFFICE_ESTABLISHED",
  HOSPITAL_INITIAL = "HOSPITAL_INITIAL",
  HOSPITAL_SUBSEQUENT = "HOSPITAL_SUBSEQUENT",
  CONSULTATION = "CONSULTATION",
  EMERGENCY = "EMERGENCY",
}

export interface EMScore {
  history: number;
  exam: number;
  mdm: number;
  time: number | null;
  totalScore: number;
}

export interface EMFactor {
  category: string;
  description: string;
  points: number;
}

// ============================================================================
// Claims Processing Types
// ============================================================================

export interface ClaimBatch extends BaseEntity {
  batchNumber: string;
  status: BatchStatus;
  claimIds: string[];
  clearinghouseId: string;
  submissionDate: Date | null;
  edi837File: string | null;
  edi997Acknowledgment: string | null;
  totalClaims: number;
  totalCharges: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  submittedBy: string;
}

export enum BatchStatus {
  DRAFT = "DRAFT",
  VALIDATING = "VALIDATING",
  READY = "READY",
  SUBMITTED = "SUBMITTED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  PARTIALLY_ACCEPTED = "PARTIALLY_ACCEPTED",
}

export interface ClaimValidation {
  claimId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  payerSpecificChecks: PayerCheck[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: "ERROR" | "CRITICAL";
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  canOverride: boolean;
}

export interface PayerCheck {
  payerId: string;
  payerName: string;
  checks: {
    rule: string;
    passed: boolean;
    message: string;
  }[];
}

export interface EDI837Segment {
  segmentId: string;
  data: Record<string, any>;
  position: number;
}

export interface EDI837File {
  interchangeControlNumber: string;
  functionalGroupControlNumber: string;
  transactionControlNumber: string;
  submitterId: string;
  receiverId: string;
  segments: EDI837Segment[];
  rawContent: string;
  generatedAt: Date;
}

// ============================================================================
// Denial Management Types
// ============================================================================

export interface DenialAnalysis extends BaseEntity {
  denialId: string;
  claimId: string;
  analysisDate: Date;
  rootCause: DenialRootCause;
  category: DenialCategoryDetail;
  preventable: boolean;
  preventionStrategy: string | null;
  recoverability: RecoverabilityScore;
  recommendedAction: DenialAction;
  automatedResolution: boolean;
  resolutionSteps: ResolutionStep[];
  estimatedRecoveryAmount: number;
  costToAppeal: number;
  roi: number;
}

export enum DenialRootCause {
  REGISTRATION_ERROR = "REGISTRATION_ERROR",
  ELIGIBILITY_NOT_VERIFIED = "ELIGIBILITY_NOT_VERIFIED",
  MISSING_AUTHORIZATION = "MISSING_AUTHORIZATION",
  CODING_ERROR = "CODING_ERROR",
  INSUFFICIENT_DOCUMENTATION = "INSUFFICIENT_DOCUMENTATION",
  MEDICAL_NECESSITY = "MEDICAL_NECESSITY",
  TIMELY_FILING_MISSED = "TIMELY_FILING_MISSED",
  DUPLICATE_CLAIM = "DUPLICATE_CLAIM",
  BILLING_ERROR = "BILLING_ERROR",
  COORDINATION_OF_BENEFITS = "COORDINATION_OF_BENEFITS",
  NON_COVERED_SERVICE = "NON_COVERED_SERVICE",
  INCORRECT_PATIENT_INFO = "INCORRECT_PATIENT_INFO",
}

export interface DenialCategoryDetail {
  primary: string;
  secondary: string | null;
  CARC: string; // Claim Adjustment Reason Code
  RARC: string | null; // Remittance Advice Remark Code
  groupCode: AdjustmentGroupCode;
}

export enum AdjustmentGroupCode {
  CO = "CO", // Contractual Obligation
  PR = "PR", // Patient Responsibility
  OA = "OA", // Other Adjustments
  PI = "PI", // Payer Initiated Reductions
}

export enum RecoverabilityScore {
  HIGH = "HIGH", // >80% chance
  MEDIUM = "MEDIUM", // 40-80% chance
  LOW = "LOW", // 10-40% chance
  VERY_LOW = "VERY_LOW", // <10% chance
}

export enum DenialAction {
  APPEAL_IMMEDIATELY = "APPEAL_IMMEDIATELY",
  RESUBMIT_WITH_CORRECTION = "RESUBMIT_WITH_CORRECTION",
  REQUEST_DOCUMENTATION = "REQUEST_DOCUMENTATION",
  CONTACT_PAYER = "CONTACT_PAYER",
  WRITE_OFF = "WRITE_OFF",
  PATIENT_RESPONSIBILITY = "PATIENT_RESPONSIBILITY",
  CORRECTED_CLAIM = "CORRECTED_CLAIM",
}

export interface ResolutionStep {
  order: number;
  action: string;
  responsible: string;
  deadline: Date | null;
  completed: boolean;
  completedAt: Date | null;
  notes: string | null;
}

export interface AppealLetter {
  id: string;
  denialId: string;
  claimId: string;
  template: string;
  generatedContent: string;
  customizations: string | null;
  supportingDocuments: SupportingDocument[];
  generatedAt: Date;
  generatedBy: string;
  sentAt: Date | null;
  trackingNumber: string | null;
}

export interface SupportingDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadedAt: Date;
}

export enum DocumentType {
  MEDICAL_RECORD = "MEDICAL_RECORD",
  LAB_RESULT = "LAB_RESULT",
  IMAGING_REPORT = "IMAGING_REPORT",
  REFERRAL = "REFERRAL",
  AUTHORIZATION = "AUTHORIZATION",
  CLINICAL_NOTE = "CLINICAL_NOTE",
  LETTER_OF_MEDICAL_NECESSITY = "LETTER_OF_MEDICAL_NECESSITY",
  OTHER = "OTHER",
}

// ============================================================================
// Contract Management Types
// ============================================================================

export interface PayerContract extends BaseEntity {
  payerId: string;
  payerName: string;
  contractNumber: string;
  contractType: ContractType;
  effectiveDate: Date;
  expirationDate: Date | null;
  status: ContractStatus;
  feeSchedules: FeeSchedule[];
  reimbursementMethod: ReimbursementMethod;
  paymentTerms: PaymentTerms;
  carveOuts: CarveOut[];
  performanceMetrics: PerformanceMetric[];
  autoRenew: boolean;
  notificationDays: number;
}

export enum ContractType {
  FEE_FOR_SERVICE = "FEE_FOR_SERVICE",
  CAPITATION = "CAPITATION",
  SHARED_SAVINGS = "SHARED_SAVINGS",
  BUNDLED_PAYMENT = "BUNDLED_PAYMENT",
  VALUE_BASED = "VALUE_BASED",
  CASE_RATE = "CASE_RATE",
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  EXPIRING_SOON = "EXPIRING_SOON",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
  RENEGOTIATING = "RENEGOTIATING",
}

export interface FeeSchedule {
  id: string;
  name: string;
  effectiveDate: Date;
  expirationDate: Date | null;
  fees: FeeScheduleEntry[];
  modifierRules: ModifierRule[];
  specialtyRates: SpecialtyRate[];
}

export interface FeeScheduleEntry {
  code: string;
  codeType: CodeType;
  description: string;
  allowedAmount: number;
  contractedRate: number | null; // null = % of allowed
  percentOfMedicare: number | null;
  flatRate: number | null;
  modifiers: { [key: string]: number }; // modifier code -> rate adjustment
}

export interface ModifierRule {
  modifier: string;
  description: string;
  adjustment: number; // percentage or flat amount
  adjustmentType: "PERCENTAGE" | "FLAT";
  stackable: boolean;
}

export interface SpecialtyRate {
  specialty: string;
  multiplier: number;
  applicableCodes: string[];
}

export enum ReimbursementMethod {
  PERCENTAGE_OF_CHARGES = "PERCENTAGE_OF_CHARGES",
  FEE_SCHEDULE = "FEE_SCHEDULE",
  DRG = "DRG",
  PER_DIEM = "PER_DIEM",
  CASE_RATE = "CASE_RATE",
  CAPITATION = "CAPITATION",
}

export interface PaymentTerms {
  netDays: number;
  discountPercentage: number | null;
  discountDays: number | null;
  interestRate: number | null;
  latePaymentFee: number | null;
}

export interface CarveOut {
  id: string;
  serviceCategory: string;
  codes: string[];
  reimbursementRate: number;
  notes: string;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  target: number;
  actual: number | null;
  incentiveAmount: number;
  penaltyAmount: number;
  measurementPeriod: string;
}

export interface UnderpaymentDetection {
  claimId: string;
  expectedAmount: number;
  paidAmount: number;
  variance: number;
  variancePercentage: number;
  reason: UnderpaymentReason;
  contractReference: string;
  flaggedAt: Date;
  status: UnderpaymentStatus;
}

export enum UnderpaymentReason {
  INCORRECT_FEE_SCHEDULE = "INCORRECT_FEE_SCHEDULE",
  MISSING_MODIFIER_PAYMENT = "MISSING_MODIFIER_PAYMENT",
  WRONG_CONTRACTED_RATE = "WRONG_CONTRACTED_RATE",
  BUNDLING_ERROR = "BUNDLING_ERROR",
  COORDINATION_OF_BENEFITS = "COORDINATION_OF_BENEFITS",
  OTHER = "OTHER",
}

export enum UnderpaymentStatus {
  DETECTED = "DETECTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPEALING = "APPEALING",
  RESOLVED = "RESOLVED",
  WRITTEN_OFF = "WRITTEN_OFF",
}

// ============================================================================
// Medical Coding Assistant Types
// ============================================================================

export interface CodeSuggestion {
  code: string;
  codeType: CodeType;
  description: string;
  confidence: number;
  reasoning: string;
  supportingEvidence: string[];
  alternatives: AlternativeCode[];
  complianceChecks: ComplianceCheck[];
  reimbursementImpact: ReimbursementImpact;
}

export interface AlternativeCode {
  code: string;
  description: string;
  confidence: number;
  whenToUse: string;
}

export interface ComplianceCheck {
  rule: string;
  passed: boolean;
  message: string;
  severity: FlagSeverity;
  reference: string;
}

export interface ReimbursementImpact {
  estimatedReimbursement: number;
  comparisonToAlternatives: {
    code: string;
    difference: number;
  }[];
  bundlingImpact: string | null;
}

export interface ICD10Lookup {
  code: string;
  description: string;
  category: string;
  subcategory: string;
  clinicalSynopsis: string;
  inclusionTerms: string[];
  exclusionTerms: string[];
  notes: string[];
  hccCategory: string | null;
  cciEdits: string[];
}

export interface DRGCalculation {
  drgCode: string;
  drgDescription: string;
  weight: number;
  geometricMeanLOS: number;
  arithmeticMeanLOS: number;
  estimatedReimbursement: number;
  mdc: string; // Major Diagnostic Category
  type: DRGType;
  factors: DRGFactor[];
}

export enum DRGType {
  MEDICAL = "MEDICAL",
  SURGICAL = "SURGICAL",
  COMPLICATION_COMORBIDITY = "COMPLICATION_COMORBIDITY",
}

export interface DRGFactor {
  name: string;
  value: string;
  impact: string;
}

export interface DocumentationGap {
  id: string;
  encounterId: string;
  gapType: GapType;
  description: string;
  impact: string;
  suggestedDocumentation: string;
  estimatedReimbursementLoss: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export enum GapType {
  MISSING_DIAGNOSIS = "MISSING_DIAGNOSIS",
  INSUFFICIENT_DETAIL = "INSUFFICIENT_DETAIL",
  MISSING_COMPLICATION = "MISSING_COMPLICATION",
  SPECIFICITY_NEEDED = "SPECIFICITY_NEEDED",
  LINKAGE_MISSING = "LINKAGE_MISSING",
  MEDICAL_NECESSITY = "MEDICAL_NECESSITY",
}

// ============================================================================
// Payment Processing Types
// ============================================================================

export interface ERA extends BaseEntity {
  eraNumber: string;
  payerId: string;
  payerName: string;
  checkNumber: string | null;
  checkDate: Date;
  paymentAmount: number;
  eftTraceNumber: string | null;
  receivedDate: Date;
  processedDate: Date | null;
  processedBy: string | null;
  status: ERAStatus;
  claimPayments: ClaimPayment[];
  raw835Content: string;
}

export enum ERAStatus {
  RECEIVED = "RECEIVED",
  PROCESSING = "PROCESSING",
  POSTED = "POSTED",
  PARTIALLY_POSTED = "PARTIALLY_POSTED",
  ERROR = "ERROR",
  SUSPENDED = "SUSPENDED",
}

export interface ClaimPayment {
  claimId: string;
  claimNumber: string;
  patientName: string;
  patientAccountNumber: string;
  serviceDate: Date;
  billedAmount: number;
  allowedAmount: number;
  deductible: number;
  coinsurance: number;
  copay: number;
  paidAmount: number;
  patientResponsibility: number;
  adjustments: PaymentAdjustment[];
  serviceLine: ServiceLinePayment[];
  remarCodes: string[];
}

export interface PaymentAdjustment {
  groupCode: AdjustmentGroupCode;
  reasonCode: string;
  remarkCode: string | null;
  amount: number;
  description: string;
}

export interface ServiceLinePayment {
  lineNumber: number;
  procedureCode: string;
  modifiers: string[];
  billedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  adjustments: PaymentAdjustment[];
  units: number;
  dateOfService: Date;
}

export interface PaymentPosting {
  id: string;
  eraId: string | null;
  claimId: string;
  paymentDate: Date;
  postedDate: Date;
  postedBy: string;
  postingMethod: PostingMethod;
  payments: PostedPayment[];
  adjustments: PostedAdjustment[];
  transfersToPatient: number;
  notes: string | null;
}

export enum PostingMethod {
  AUTOMATIC_ERA = "AUTOMATIC_ERA",
  MANUAL_EOB = "MANUAL_EOB",
  MANUAL_PAYMENT = "MANUAL_PAYMENT",
  BULK_IMPORT = "BULK_IMPORT",
}

export interface PostedPayment {
  chargeId: string;
  amount: number;
  paymentType: "INSURANCE" | "PATIENT";
  checkNumber: string | null;
  transactionId: string | null;
}

export interface PostedAdjustment {
  chargeId: string;
  amount: number;
  adjustmentType: string;
  reasonCode: string;
  description: string;
}

export interface Refund extends BaseEntity {
  refundNumber: string;
  patientId: string;
  originalPaymentId: string;
  reason: RefundReason;
  amount: number;
  method: RefundMethod;
  status: RefundStatus;
  requestedBy: string;
  requestedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  processedAt: Date | null;
  checkNumber: string | null;
  transactionId: string | null;
  notes: string | null;
}

export enum RefundReason {
  OVERPAYMENT = "OVERPAYMENT",
  DUPLICATE_PAYMENT = "DUPLICATE_PAYMENT",
  INSURANCE_ADJUSTMENT = "INSURANCE_ADJUSTMENT",
  SERVICE_NOT_RENDERED = "SERVICE_NOT_RENDERED",
  PRICING_ERROR = "PRICING_ERROR",
  OTHER = "OTHER",
}

export enum RefundMethod {
  CHECK = "CHECK",
  CREDIT_CARD_REVERSAL = "CREDIT_CARD_REVERSAL",
  ACH = "ACH",
  APPLY_TO_BALANCE = "APPLY_TO_BALANCE",
}

export enum RefundStatus {
  REQUESTED = "REQUESTED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Revenue Cycle Analytics Types
// ============================================================================

export interface RCMMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  grossCharges: number;
  netRevenue: number;
  cashCollections: number;
  adjustments: number;
  denials: number;
  appeals: number;
  // Key Performance Indicators
  daysInAR: number;
  daysInARByPayer: { [payerId: string]: number };
  cleanClaimRate: number;
  denialRate: number;
  denialOverturnRate: number;
  collectionRate: number;
  costToCollect: number;
  netCollectionRate: number;
  // AR Aging
  arCurrent: number;
  ar30: number;
  ar60: number;
  ar90: number;
  ar120Plus: number;
  // Payer Mix
  payerMix: PayerMixItem[];
  // Productivity
  claimsSubmitted: number;
  claimsPaid: number;
  claimsDenied: number;
  averageReimbursementTime: number;
  // Denial Analytics
  denialsByCategory: { [category: string]: number };
  denialsByPayer: { [payerId: string]: number };
  denialsByProvider: { [providerId: string]: number };
}

export interface PayerMixItem {
  payerId: string;
  payerName: string;
  charges: number;
  payments: number;
  percentage: number;
  averageDaysToPayment: number;
}

export interface WorkqueueItem {
  id: string;
  type: WorkqueueType;
  claimId: string;
  patientName: string;
  patientId: string;
  priority: Priority;
  dueDate: Date | null;
  assignedTo: string | null;
  status: WorkqueueStatus;
  amount: number;
  agingDays: number;
  description: string;
  createdAt: Date;
  lastActionAt: Date;
  flags: string[];
}

export enum WorkqueueType {
  CLAIM_EDIT = "CLAIM_EDIT",
  DENIAL_RESOLUTION = "DENIAL_RESOLUTION",
  AUTHORIZATION_NEEDED = "AUTHORIZATION_NEEDED",
  CODING_REVIEW = "CODING_REVIEW",
  PAYMENT_POSTING = "PAYMENT_POSTING",
  UNDERPAYMENT = "UNDERPAYMENT",
  APPEAL = "APPEAL",
  PATIENT_FOLLOW_UP = "PATIENT_FOLLOW_UP",
}

export enum Priority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum WorkqueueStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  ESCALATED = "ESCALATED",
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateChargeCaptureDto {
  encounterId: string;
  patientId: string;
  providerId: string;
  serviceDate: Date;
  charges: Omit<CapturedCharge, "id">[];
}

export interface SubmitClaimBatchDto {
  claimIds: string[];
  clearinghouseId: string;
}

export interface PostPaymentDto {
  claimId: string;
  payments: PostedPayment[];
  adjustments: PostedAdjustment[];
  eraId?: string;
  notes?: string;
}

export interface CreateAppealDto {
  denialId: string;
  claimId: string;
  appealReason: string;
  supportingDocuments: string[];
}

export interface UpdateContractDto {
  contractId: string;
  feeSchedule?: FeeSchedule;
  status?: ContractStatus;
  expirationDate?: Date;
}
