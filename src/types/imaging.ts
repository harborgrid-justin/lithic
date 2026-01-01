/**
 * Imaging/PACS Integration Module Types
 * Agent 8: Imaging
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Imaging Order Types
// ============================================================================

export interface ImagingOrder extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  orderNumber: string;
  accessionNumber: string | null;
  orderingProvider: string;
  orderingProviderNPI: string;
  orderDate: Date;
  scheduledDate: Date | null;
  priority: ImagingPriority;
  status: ImagingOrderStatus;
  modality: ImagingModality;
  bodyPart: string;
  laterality: Laterality | null;
  studyDescription: string;
  clinicalIndication: string;
  icdCode: string | null;
  cptCode: string | null;
  contrast: boolean;
  contrastType: string | null;
  patientInstructions: string | null;
  technologistNotes: string | null;
  priorAuthRequired: boolean;
  priorAuthNumber: string | null;
  performingFacility: string | null;
  performingTechnologist: string | null;
  readingRadiologist: string | null;
  studyId: string | null;
  reportId: string | null;
}

export enum ImagingPriority {
  ROUTINE = "ROUTINE",
  URGENT = "URGENT",
  STAT = "STAT",
  ASAP = "ASAP",
}

export enum ImagingOrderStatus {
  ORDERED = "ORDERED",
  SCHEDULED = "SCHEDULED",
  ARRIVED = "ARRIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  PRELIMINARY_REPORT = "PRELIMINARY_REPORT",
  FINAL_REPORT = "FINAL_REPORT",
  AMENDED = "AMENDED",
  CANCELLED = "CANCELLED",
}

export enum ImagingModality {
  CR = "CR",
  CT = "CT",
  MR = "MR",
  US = "US",
  XA = "XA",
  RF = "RF",
  DX = "DX",
  MG = "MG",
  NM = "NM",
  PT = "PT",
  PET_CT = "PET_CT",
  SPECT = "SPECT",
  DEXA = "DEXA",
  FLUORO = "FLUORO",
  OTHER = "OTHER",
}

export enum Laterality {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  BILATERAL = "BILATERAL",
  UNILATERAL = "UNILATERAL",
}

// ============================================================================
// DICOM Study Types
// ============================================================================

export interface ImagingStudy extends BaseEntity {
  orderId: string;
  patientId: string;
  studyInstanceUID: string;
  accessionNumber: string;
  studyDate: Date;
  studyTime: string;
  studyDescription: string;
  modality: ImagingModality;
  bodyPart: string;
  laterality: Laterality | null;
  numberOfSeries: number;
  numberOfInstances: number;
  referringPhysician: string;
  performingPhysician: string | null;
  readingPhysician: string | null;
  institutionName: string | null;
  stationName: string | null;
  series: DicomSeries[];
  status: StudyStatus;
  pacsUrl: string | null;
  viewerUrl: string | null;
  storageLocation: string | null;
  fileSize: number | null;
}

export enum StudyStatus {
  RECEIVED = "RECEIVED",
  PROCESSING = "PROCESSING",
  AVAILABLE = "AVAILABLE",
  ARCHIVED = "ARCHIVED",
  ERROR = "ERROR",
}

export interface DicomSeries extends BaseEntity {
  studyId: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: ImagingModality;
  bodyPart: string;
  numberOfInstances: number;
  seriesDate: Date | null;
  seriesTime: string | null;
  performingPhysician: string | null;
  protocolName: string | null;
  instances: DicomInstance[];
  thumbnailUrl: string | null;
}

export interface DicomInstance {
  sopInstanceUID: string;
  instanceNumber: number;
  rows: number | null;
  columns: number | null;
  bitsAllocated: number | null;
  sliceLocation: number | null;
  acquisitionDate: Date | null;
  acquisitionTime: string | null;
  imageType: string | null;
  url: string | null;
  thumbnailUrl: string | null;
}

// ============================================================================
// Radiology Report Types
// ============================================================================

export interface ImagingReport extends BaseEntity {
  studyId: string;
  orderId: string;
  patientId: string;
  accessionNumber: string;
  reportDate: Date;
  reportType: ReportType;
  status: ReportStatus;
  radiologist: string;
  radiologistNPI: string;
  indication: string | null;
  technique: string | null;
  comparison: string | null;
  findings: string;
  impression: string;
  recommendations: string | null;
  criticalFindings: string | null;
  criticalFindingsNotified: boolean;
  criticalFindingsNotifiedAt: Date | null;
  criticalFindingsNotifiedTo: string | null;
  template: string | null;
  transcribedBy: string | null;
  signedAt: Date | null;
  signedBy: string | null;
  addendum: ReportAddendum[];
  attachments: string[];
}

export enum ReportType {
  PRELIMINARY = "PRELIMINARY",
  FINAL = "FINAL",
  ADDENDUM = "ADDENDUM",
  CORRECTION = "CORRECTION",
}

export enum ReportStatus {
  DRAFT = "DRAFT",
  PRELIMINARY = "PRELIMINARY",
  FINAL = "FINAL",
  AMENDED = "AMENDED",
  SIGNED = "SIGNED",
}

export interface ReportAddendum extends BaseEntity {
  reportId: string;
  content: string;
  reason: string;
  addedBy: string;
  signedAt: Date | null;
}

export interface RadiologyTemplate extends BaseEntity {
  name: string;
  modality: ImagingModality;
  bodyPart: string | null;
  category: string;
  sections: TemplateSection[];
  isDefault: boolean;
  isShared: boolean;
  ownedBy: string;
  usageCount: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  content: string;
  required: boolean;
  macros: Macro[];
}

export interface Macro {
  id: string;
  name: string;
  shortcut: string;
  content: string;
}

// ============================================================================
// Critical Findings Types
// ============================================================================

export interface CriticalFinding extends BaseEntity {
  reportId: string;
  studyId: string;
  patientId: string;
  finding: string;
  severity: FindingSeverity;
  discoveredBy: string;
  discoveredAt: Date;
  notifiedProvider: string | null;
  notifiedAt: Date | null;
  notificationMethod: NotificationMethod | null;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  status: FindingStatus;
  followUpRequired: boolean;
  followUpInstructions: string | null;
  notes: string | null;
}

export enum FindingSeverity {
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
  EMERGENCY = "EMERGENCY",
}

export enum NotificationMethod {
  PHONE = "PHONE",
  FAX = "FAX",
  EMAIL = "EMAIL",
  IN_PERSON = "IN_PERSON",
  EMR_MESSAGE = "EMR_MESSAGE",
}

export enum FindingStatus {
  NEW = "NEW",
  NOTIFIED = "NOTIFIED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
}

// ============================================================================
// PACS Integration Types
// ============================================================================

export interface PACSConfiguration extends BaseEntity {
  name: string;
  aeTitle: string;
  host: string;
  port: number;
  type: PACSType;
  protocol: DicomProtocol;
  status: ConnectionStatus;
  queryRetrieve: boolean;
  storage: boolean;
  worklist: boolean;
  mpps: boolean;
  lastActivity: Date | null;
  studyCount: number;
  storageUsed: number;
  storageLimit: number | null;
  configuration: Record<string, any>;
}

export enum PACSType {
  LOCAL = "LOCAL",
  CLOUD = "CLOUD",
  VENDOR = "VENDOR",
  VNA = "VNA",
}

export enum DicomProtocol {
  DIMSE = "DIMSE",
  DICOMWEB = "DICOMWEB",
  HL7_FHIR = "HL7_FHIR",
}

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  ERROR = "ERROR",
  TESTING = "TESTING",
}

export interface DicomWorklistItem {
  id: string;
  patientId: string;
  patientName: string;
  patientDOB: Date;
  accessionNumber: string;
  studyInstanceUID: string;
  scheduledDate: Date;
  scheduledTime: string;
  modality: ImagingModality;
  scheduledStationAETitle: string;
  scheduledProcedureDescription: string;
  requestedProcedureId: string;
  orderingPhysician: string;
  performingPhysician: string | null;
  status: WorklistStatus;
}

export enum WorklistStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DISCONTINUED = "DISCONTINUED",
}

// ============================================================================
// Modality Types
// ============================================================================

export interface Modality extends BaseEntity {
  name: string;
  type: ImagingModality;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  aeTitle: string;
  stationName: string;
  ipAddress: string;
  port: number;
  location: string | null;
  status: ModalityStatus;
  installDate: Date | null;
  lastServiceDate: Date | null;
  nextServiceDate: Date | null;
  studyCount: number;
  configuration: Record<string, any>;
}

export enum ModalityStatus {
  OPERATIONAL = "OPERATIONAL",
  MAINTENANCE = "MAINTENANCE",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
  RETIRED = "RETIRED",
}

// ============================================================================
// Image Sharing Types
// ============================================================================

export interface ImageShare extends BaseEntity {
  studyId: string;
  patientId: string;
  sharedBy: string;
  sharedWith: string | null;
  shareType: ShareType;
  shareUrl: string;
  accessCode: string | null;
  expiresAt: Date | null;
  accessed: boolean;
  accessedAt: Date | null;
  accessCount: number;
  downloadAllowed: boolean;
  burnToCd: boolean;
  notes: string | null;
}

export enum ShareType {
  EXTERNAL_PROVIDER = "EXTERNAL_PROVIDER",
  PATIENT = "PATIENT",
  REFERRING_PHYSICIAN = "REFERRING_PHYSICIAN",
  CONSULTATION = "CONSULTATION",
  LEGAL = "LEGAL",
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateImagingOrderDto {
  patientId: string;
  encounterId?: string;
  orderingProvider: string;
  priority: ImagingPriority;
  modality: ImagingModality;
  bodyPart: string;
  laterality?: Laterality;
  studyDescription: string;
  clinicalIndication: string;
  icdCode?: string;
  cptCode?: string;
  contrast?: boolean;
  contrastType?: string;
  patientInstructions?: string;
  scheduledDate?: Date;
}

export interface CreateImagingReportDto {
  studyId: string;
  orderId: string;
  indication?: string;
  technique?: string;
  comparison?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  criticalFindings?: string;
  template?: string;
}

export interface ImagingOrderSummary {
  id: string;
  orderNumber: string;
  patientName: string;
  modality: ImagingModality;
  bodyPart: string;
  studyDescription: string;
  orderDate: Date;
  status: ImagingOrderStatus;
  priority: ImagingPriority;
  hasCriticalFindings: boolean;
}
