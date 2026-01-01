/**
 * Laboratory Information System Module Types
 * Agent 6: Laboratory
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Lab Order Types
// ============================================================================

export interface LabOrder extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  orderId: string;
  orderNumber: string;
  orderingProvider: string;
  orderDate: Date;
  priority: LabPriority;
  status: LabOrderStatus;
  tests: LabTest[];
  panels: LabPanel[];
  diagnosis: string;
  icdCode: string;
  clinicalNotes: string | null;
  specimenCollectionDate: Date | null;
  specimenCollectedBy: string | null;
  specimenReceivedDate: Date | null;
  resultDate: Date | null;
  resultBy: string | null;
  verifiedDate: Date | null;
  verifiedBy: string | null;
  reportUrl: string | null;
  fastingRequired: boolean;
  patientInstructions: string | null;
  externalLab: boolean;
  externalLabName: string | null;
  externalLabId: string | null;
}

export enum LabPriority {
  ROUTINE = "ROUTINE",
  URGENT = "URGENT",
  STAT = "STAT",
  ASAP = "ASAP",
}

export enum LabOrderStatus {
  ORDERED = "ORDERED",
  SPECIMEN_COLLECTED = "SPECIMEN_COLLECTED",
  SPECIMEN_RECEIVED = "SPECIMEN_RECEIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  VERIFIED = "VERIFIED",
  CANCELLED = "CANCELLED",
  ON_HOLD = "ON_HOLD",
}

// ============================================================================
// Lab Test Types
// ============================================================================

export interface LabTest extends BaseEntity {
  code: string;
  name: string;
  category: LabCategory;
  loincCode: string | null;
  cptCode: string | null;
  description: string | null;
  specimenType: SpecimenType;
  specimenVolume: number | null;
  specimenContainer: string | null;
  method: string | null;
  turnaroundTime: number;
  price: number;
  requiresFasting: boolean;
  referenceRanges: ReferenceRange[];
  units: string | null;
  isActive: boolean;
}

export enum LabCategory {
  CHEMISTRY = "CHEMISTRY",
  HEMATOLOGY = "HEMATOLOGY",
  MICROBIOLOGY = "MICROBIOLOGY",
  IMMUNOLOGY = "IMMUNOLOGY",
  MOLECULAR = "MOLECULAR",
  PATHOLOGY = "PATHOLOGY",
  TOXICOLOGY = "TOXICOLOGY",
  URINALYSIS = "URINALYSIS",
  SEROLOGY = "SEROLOGY",
  BLOOD_BANK = "BLOOD_BANK",
  COAGULATION = "COAGULATION",
  ENDOCRINOLOGY = "ENDOCRINOLOGY",
}

export enum SpecimenType {
  BLOOD = "BLOOD",
  SERUM = "SERUM",
  PLASMA = "PLASMA",
  URINE = "URINE",
  STOOL = "STOOL",
  SPUTUM = "SPUTUM",
  CSF = "CSF",
  TISSUE = "TISSUE",
  SWAB = "SWAB",
  SALIVA = "SALIVA",
  OTHER = "OTHER",
}

export interface ReferenceRange {
  ageMin: number | null;
  ageMax: number | null;
  gender: "M" | "F" | "ALL";
  min: number | null;
  max: number | null;
  text: string | null;
  critical: boolean;
}

export interface LabPanel extends BaseEntity {
  code: string;
  name: string;
  description: string | null;
  cptCode: string | null;
  tests: string[];
  category: LabCategory;
  price: number;
  isActive: boolean;
}

// ============================================================================
// Lab Result Types
// ============================================================================

export interface LabResult extends BaseEntity {
  orderId: string;
  testCode: string;
  testName: string;
  value: string | null;
  numericValue: number | null;
  units: string | null;
  referenceRange: string | null;
  abnormalFlag: AbnormalFlag | null;
  criticalFlag: boolean;
  status: ResultStatus;
  resultDate: Date;
  resultBy: string;
  verifiedDate: Date | null;
  verifiedBy: string | null;
  method: string | null;
  instrument: string | null;
  comments: string | null;
  previousResults: PreviousResult[];
}

export enum AbnormalFlag {
  LOW = "LOW",
  HIGH = "HIGH",
  ABNORMAL = "ABNORMAL",
  CRITICAL_LOW = "CRITICAL_LOW",
  CRITICAL_HIGH = "CRITICAL_HIGH",
}

export enum ResultStatus {
  PRELIMINARY = "PRELIMINARY",
  FINAL = "FINAL",
  CORRECTED = "CORRECTED",
  CANCELLED = "CANCELLED",
}

export interface PreviousResult {
  date: Date;
  value: string;
  numericValue: number | null;
}

// ============================================================================
// Specimen Types
// ============================================================================

export interface Specimen extends BaseEntity {
  orderId: string;
  specimenId: string;
  barcode: string | null;
  type: SpecimenType;
  source: string | null;
  collectionDate: Date;
  collectedBy: string;
  collectionMethod: string | null;
  container: string | null;
  volume: number | null;
  volumeUnit: string | null;
  receivedDate: Date | null;
  receivedBy: string | null;
  status: SpecimenStatus;
  quality: SpecimenQuality | null;
  qualityNotes: string | null;
  storage: string | null;
  disposalDate: Date | null;
  rejectionReason: string | null;
}

export enum SpecimenStatus {
  COLLECTED = "COLLECTED",
  IN_TRANSIT = "IN_TRANSIT",
  RECEIVED = "RECEIVED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  DISPOSED = "DISPOSED",
}

export enum SpecimenQuality {
  ACCEPTABLE = "ACCEPTABLE",
  SUBOPTIMAL = "SUBOPTIMAL",
  UNACCEPTABLE = "UNACCEPTABLE",
}

// ============================================================================
// Critical Value Alert Types
// ============================================================================

export interface CriticalValueAlert extends BaseEntity {
  resultId: string;
  orderId: string;
  patientId: string;
  testName: string;
  value: string;
  referenceRange: string;
  severity: AlertSeverity;
  notifiedProvider: string | null;
  notifiedDate: Date | null;
  notificationMethod: NotificationMethod | null;
  acknowledgedBy: string | null;
  acknowledgedDate: Date | null;
  status: AlertStatus;
  notes: string | null;
}

export enum AlertSeverity {
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  PANIC = "PANIC",
}

export enum NotificationMethod {
  PHONE = "PHONE",
  SMS = "SMS",
  EMAIL = "EMAIL",
  IN_APP = "IN_APP",
  PAGE = "PAGE",
}

export enum AlertStatus {
  NEW = "NEW",
  NOTIFIED = "NOTIFIED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
}

// ============================================================================
// Quality Control Types
// ============================================================================

export interface QualityControl extends BaseEntity {
  testCode: string;
  controlLevel: ControlLevel;
  lotNumber: string;
  expirationDate: Date;
  runDate: Date;
  runBy: string;
  expectedValue: number;
  measuredValue: number;
  result: QCResult;
  deviation: number;
  instrument: string | null;
  notes: string | null;
}

export enum ControlLevel {
  LEVEL_1 = "LEVEL_1",
  LEVEL_2 = "LEVEL_2",
  LEVEL_3 = "LEVEL_3",
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
}

export enum QCResult {
  PASS = "PASS",
  FAIL = "FAIL",
  WARNING = "WARNING",
}

// ============================================================================
// Lab Interface (HL7) Types
// ============================================================================

export interface LabInterface extends BaseEntity {
  name: string;
  type: InterfaceType;
  protocol: InterfaceProtocol;
  host: string;
  port: number;
  direction: InterfaceDirection;
  status: InterfaceStatus;
  lastActivity: Date | null;
  messageCount: number;
  errorCount: number;
  configuration: Record<string, any>;
}

export enum InterfaceType {
  INSTRUMENT = "INSTRUMENT",
  LIS = "LIS",
  EMR = "EMR",
  REFERENCE_LAB = "REFERENCE_LAB",
}

export enum InterfaceProtocol {
  HL7_MLLP = "HL7_MLLP",
  HL7_HTTP = "HL7_HTTP",
  ASTM = "ASTM",
  FTP = "FTP",
  SFTP = "SFTP",
  API = "API",
}

export enum InterfaceDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
  BIDIRECTIONAL = "BIDIRECTIONAL",
}

export enum InterfaceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ERROR = "ERROR",
  MAINTENANCE = "MAINTENANCE",
}

export interface HL7Message {
  id: string;
  interfaceId: string;
  messageType: string;
  messageControlId: string;
  direction: "INBOUND" | "OUTBOUND";
  rawMessage: string;
  parsedMessage: Record<string, any>;
  status: MessageStatus;
  receivedAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
  orderId: string | null;
}

export enum MessageStatus {
  RECEIVED = "RECEIVED",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  ERROR = "ERROR",
  REJECTED = "REJECTED",
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateLabOrderDto {
  patientId: string;
  encounterId?: string;
  orderingProvider: string;
  priority: LabPriority;
  tests?: string[];
  panels?: string[];
  diagnosis: string;
  icdCode: string;
  clinicalNotes?: string;
  fastingRequired?: boolean;
  patientInstructions?: string;
}

export interface CollectSpecimenDto {
  orderId: string;
  specimenType: SpecimenType;
  collectionDate: Date;
  collectedBy: string;
  collectionMethod?: string;
  barcode?: string;
}

export interface EnterResultDto {
  orderId: string;
  testCode: string;
  value?: string;
  numericValue?: number;
  units?: string;
  abnormalFlag?: AbnormalFlag;
  comments?: string;
}

export interface LabOrderSummary {
  id: string;
  orderNumber: string;
  patientName: string;
  orderingProvider: string;
  orderDate: Date;
  tests: string[];
  status: LabOrderStatus;
  priority: LabPriority;
  hasCriticalResults: boolean;
}
