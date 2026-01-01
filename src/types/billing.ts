/**
 * Billing & Revenue Cycle Module Types
 * Agent 5: Billing
 */

import type { BaseEntity } from './index';

// ============================================================================
// Claim Types
// ============================================================================

export interface Claim extends BaseEntity {
  patientId: string;
  encounterId: string;
  insuranceId: string;
  type: ClaimType;
  formType: FormType;
  status: ClaimStatus;
  claimNumber: string;
  billingProvider: string;
  renderingProvider: string;
  facility: string;
  serviceDate: Date;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  totalCharges: number;
  allowedAmount: number | null;
  paidAmount: number | null;
  patientResponsibility: number | null;
  submittedDate: Date | null;
  submittedBy: string | null;
  clearinghouseId: string | null;
  payerClaimNumber: string | null;
  charges: Charge[];
  adjustments: Adjustment[];
  payments: Payment[];
  denials: Denial[];
  notes: ClaimNote[];
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  priorAuthNumber: string | null;
  referralNumber: string | null;
  placeOfService: string;
}

export enum ClaimType {
  PROFESSIONAL = 'PROFESSIONAL',
  INSTITUTIONAL = 'INSTITUTIONAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
}

export enum FormType {
  CMS_1500 = 'CMS_1500',
  UB_04 = 'UB_04',
  ADA_2019 = 'ADA_2019',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  READY_TO_SUBMIT = 'READY_TO_SUBMIT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  VOIDED = 'VOIDED',
}

export interface ClaimNote extends BaseEntity {
  claimId: string;
  note: string;
  type: NoteType;
  createdBy: string;
}

export enum NoteType {
  GENERAL = 'GENERAL',
  SUBMISSION = 'SUBMISSION',
  FOLLOW_UP = 'FOLLOW_UP',
  DENIAL = 'DENIAL',
  APPEAL = 'APPEAL',
  PAYMENT = 'PAYMENT',
}

// ============================================================================
// Charge Types
// ============================================================================

export interface Charge extends BaseEntity {
  claimId: string | null;
  patientId: string;
  encounterId: string;
  serviceDate: Date;
  provider: string;
  cptCode: string;
  cptDescription: string;
  modifiers: string[];
  quantity: number;
  unitPrice: number;
  totalCharge: number;
  diagnosisPointers: string[];
  placeOfService: string;
  status: ChargeStatus;
  allowedAmount: number | null;
  paidAmount: number | null;
  adjustedAmount: number | null;
  patientResponsibility: number | null;
  notes: string | null;
}

export enum ChargeStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  DENIED = 'DENIED',
  ADJUSTED = 'ADJUSTED',
  VOIDED = 'VOIDED',
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment extends BaseEntity {
  claimId: string | null;
  patientId: string;
  encounterId: string | null;
  type: PaymentType;
  source: PaymentSource;
  method: PaymentMethod;
  amount: number;
  referenceNumber: string;
  checkNumber: string | null;
  transactionId: string | null;
  paymentDate: Date;
  depositDate: Date | null;
  batchId: string | null;
  eobId: string | null;
  applied: boolean;
  appliedDate: Date | null;
  unappliedAmount: number;
  notes: string | null;
}

export enum PaymentType {
  INSURANCE = 'INSURANCE',
  PATIENT = 'PATIENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentSource {
  INSURANCE = 'INSURANCE',
  PATIENT = 'PATIENT',
  GUARANTOR = 'GUARANTOR',
  THIRD_PARTY = 'THIRD_PARTY',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  ACH = 'ACH',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  MONEY_ORDER = 'MONEY_ORDER',
  ELECTRONIC = 'ELECTRONIC',
  OTHER = 'OTHER',
}

export interface PaymentApplication extends BaseEntity {
  paymentId: string;
  chargeId: string;
  amount: number;
  adjustmentAmount: number;
  adjustmentReason: string | null;
  appliedDate: Date;
  appliedBy: string;
}

// ============================================================================
// Adjustment Types
// ============================================================================

export interface Adjustment extends BaseEntity {
  claimId: string | null;
  chargeId: string | null;
  patientId: string;
  type: AdjustmentType;
  reason: string;
  reasonCode: string | null;
  amount: number;
  adjustmentDate: Date;
  adjustedBy: string;
  notes: string | null;
}

export enum AdjustmentType {
  CONTRACTUAL = 'CONTRACTUAL',
  WRITE_OFF = 'WRITE_OFF',
  COURTESY = 'COURTESY',
  BAD_DEBT = 'BAD_DEBT',
  CHARITY = 'CHARITY',
  CORRECTION = 'CORRECTION',
  REFUND = 'REFUND',
  OTHER = 'OTHER',
}

// ============================================================================
// Denial Types
// ============================================================================

export interface Denial extends BaseEntity {
  claimId: string;
  chargeId: string | null;
  denialDate: Date;
  denialReason: string;
  denialCode: string;
  denialCategory: DenialCategory;
  amount: number;
  appealable: boolean;
  appealDeadline: Date | null;
  status: DenialStatus;
  workNotes: string | null;
  assignedTo: string | null;
}

export enum DenialCategory {
  REGISTRATION = 'REGISTRATION',
  ELIGIBILITY = 'ELIGIBILITY',
  AUTHORIZATION = 'AUTHORIZATION',
  CODING = 'CODING',
  MEDICAL_NECESSITY = 'MEDICAL_NECESSITY',
  TIMELY_FILING = 'TIMELY_FILING',
  DUPLICATE = 'DUPLICATE',
  COORDINATION_OF_BENEFITS = 'COORDINATION_OF_BENEFITS',
  OTHER = 'OTHER',
}

export enum DenialStatus {
  NEW = 'NEW',
  WORKING = 'WORKING',
  APPEALED = 'APPEALED',
  RESUBMITTED = 'RESUBMITTED',
  RESOLVED = 'RESOLVED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export interface Appeal extends BaseEntity {
  denialId: string;
  claimId: string;
  appealLevel: AppealLevel;
  appealDate: Date;
  appealDeadline: Date;
  appealReason: string;
  supportingDocuments: string[];
  status: AppealStatus;
  outcome: AppealOutcome | null;
  outcomeDate: Date | null;
  outcomeAmount: number | null;
  notes: string | null;
  submittedBy: string;
}

export enum AppealLevel {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
  EXTERNAL = 'EXTERNAL',
}

export enum AppealStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum AppealOutcome {
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  DENIED = 'DENIED',
  PENDING_MORE_INFO = 'PENDING_MORE_INFO',
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface Invoice extends BaseEntity {
  patientId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  charges: Charge[];
  payments: Payment[];
  notes: string | null;
  statementSent: boolean;
  lastStatementDate: Date | null;
  statementCount: number;
  collectionStatus: CollectionStatus;
  paymentPlan: PaymentPlan | null;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  IN_COLLECTIONS = 'IN_COLLECTIONS',
  WRITTEN_OFF = 'WRITTEN_OFF',
  VOIDED = 'VOIDED',
}

export enum CollectionStatus {
  CURRENT = 'CURRENT',
  DAYS_30 = 'DAYS_30',
  DAYS_60 = 'DAYS_60',
  DAYS_90 = 'DAYS_90',
  DAYS_120_PLUS = 'DAYS_120_PLUS',
  COLLECTIONS = 'COLLECTIONS',
  BAD_DEBT = 'BAD_DEBT',
}

export interface PaymentPlan extends BaseEntity {
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  numberOfPayments: number;
  paymentAmount: number;
  frequency: PaymentFrequency;
  startDate: Date;
  nextPaymentDate: Date;
  endDate: Date;
  status: PaymentPlanStatus;
  autoPayEnabled: boolean;
  paymentMethod: PaymentMethod | null;
  installments: PaymentInstallment[];
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum PaymentPlanStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentInstallment {
  id: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidDate: Date | null;
  paymentId: string | null;
}

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  MISSED = 'MISSED',
}

// ============================================================================
// Insurance Verification Types
// ============================================================================

export interface InsuranceVerification extends BaseEntity {
  patientId: string;
  insuranceId: string;
  verificationDate: Date;
  verifiedBy: string;
  effectiveDate: Date;
  terminationDate: Date | null;
  status: VerificationStatus;
  eligibilityStatus: EligibilityStatus;
  coverageType: string;
  planName: string;
  groupNumber: string;
  copay: number | null;
  coinsurance: number | null;
  deductible: number | null;
  deductibleMet: number | null;
  outOfPocketMax: number | null;
  outOfPocketMet: number | null;
  priorAuthRequired: boolean;
  referralRequired: boolean;
  response: Record<string, any>;
  notes: string | null;
}

export enum VerificationStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum EligibilityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Revenue Cycle Analytics Types
// ============================================================================

export interface RevenueMetrics {
  period: DatePeriod;
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  netRevenue: number;
  collectionRate: number;
  daysInAR: number;
  denialRate: number;
  cleanClaimRate: number;
  averageReimbursementRate: number;
}

export interface DatePeriod {
  startDate: Date;
  endDate: Date;
}

export interface ARAgingBucket {
  bucket: CollectionStatus;
  count: number;
  amount: number;
  percentage: number;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateClaimDto {
  patientId: string;
  encounterId: string;
  insuranceId: string;
  type: ClaimType;
  serviceDate: Date;
  billingProvider: string;
  renderingProvider: string;
  charges: Omit<Charge, keyof BaseEntity | 'claimId'>[];
  primaryDiagnosis: string;
  secondaryDiagnoses?: string[];
  priorAuthNumber?: string;
  referralNumber?: string;
}

export interface SubmitClaimDto {
  claimId: string;
  clearinghouseId?: string;
}

export interface ProcessPaymentDto {
  patientId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  source: PaymentSource;
  referenceNumber?: string;
  checkNumber?: string;
  transactionId?: string;
  charges?: { chargeId: string; amount: number }[];
}

export interface CreateInvoiceDto {
  patientId: string;
  charges: string[];
  dueDate: Date;
  notes?: string;
}
