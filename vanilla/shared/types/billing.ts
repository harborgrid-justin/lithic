// Billing & Claims Types

export enum ClaimType {
  CMS1500 = 'CMS1500',
  UB04 = 'UB04',
  DENTAL = 'DENTAL',
  PHARMACY = 'PHARMACY',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  DENIED = 'DENIED',
  REJECTED = 'REJECTED',
  APPEALED = 'APPEALED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  INSURANCE = 'INSURANCE',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  ACH = 'ACH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface Claim {
  id: string;
  patientId: string;
  insuranceId: string;
  claimNumber: string;
  claimType: ClaimType;
  totalAmount: number;
  paidAmount: number;
  serviceDate: string;
  submittedAt?: string;
  processedAt?: string;
  paidAt?: string;
  status: ClaimStatus;
  denialReason?: string;
  denialCode?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface ClaimLine {
  id: string;
  claimId: string;
  serviceDate: string;
  cptCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  modifier1?: string;
  modifier2?: string;
  modifier3?: string;
  modifier4?: string;
  diagnosisPointers: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  status: PaymentStatus;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  serviceDate: string;
}

export interface Transaction {
  id: string;
  patientId: string;
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';
  amount: number;
  description: string;
  referenceId?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ClaimCreateRequest {
  patientId: string;
  insuranceId: string;
  claimType: ClaimType;
  serviceDate: string;
  lines: ClaimLineCreateRequest[];
}

export interface ClaimLineCreateRequest {
  serviceDate: string;
  cptCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  modifier1?: string;
  modifier2?: string;
  modifier3?: string;
  modifier4?: string;
  diagnosisPointers: string[];
}

export interface ClaimUpdateRequest {
  status?: ClaimStatus;
  denialReason?: string;
  denialCode?: string;
  paidAmount?: number;
}

export interface ClaimSubmitRequest {
  claimId: string;
  electronicSubmission: boolean;
  clearinghouse?: string;
}

export interface PaymentCreateRequest {
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  applyToInvoices?: {
    invoiceId: string;
    amount: number;
  }[];
}

export interface InvoiceCreateRequest {
  patientId: string;
  dueDate: string;
  lineItems: InvoiceLineItemCreateRequest[];
}

export interface InvoiceLineItemCreateRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceDate: string;
}

export interface ClaimSearchFilters {
  patientId?: string;
  insuranceId?: string;
  status?: ClaimStatus;
  claimType?: ClaimType;
  startDate?: string;
  endDate?: string;
  claimNumber?: string;
}

export interface BillingStatistics {
  totalClaims: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  deniedAmount: number;
  byStatus: Record<ClaimStatus, number>;
  collectionRate: number;
  averagePaymentTime: number; // days
}

export interface EOB {
  id: string;
  claimId: string;
  payerId: string;
  payerName: string;
  checkNumber?: string;
  checkDate: string;
  paidAmount: number;
  adjustments: EOBAdjustment[];
  remarks: string[];
  receivedAt: string;
}

export interface EOBAdjustment {
  code: string;
  description: string;
  amount: number;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  downPayment: number;
  monthlyPayment: number;
  numberOfPayments: number;
  startDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}
