// Imaging & Radiology Types

export enum ImagingModality {
  XRAY = 'XRAY',
  CT = 'CT',
  MRI = 'MRI',
  ULTRASOUND = 'ULTRASOUND',
  MAMMOGRAPHY = 'MAMMOGRAPHY',
  FLUOROSCOPY = 'FLUOROSCOPY',
  PET = 'PET',
  NUCLEAR_MEDICINE = 'NUCLEAR_MEDICINE',
}

export enum ImagingOrderStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REPORTED = 'REPORTED',
  CANCELLED = 'CANCELLED',
}

export enum ImagingStudyStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REPORTED = 'REPORTED',
}

export interface ImagingOrder {
  id: string;
  patientId: string;
  providerId: string;
  orderNumber: string;
  modality: ImagingModality;
  bodyPart: string;
  priority: 'STAT' | 'URGENT' | 'ROUTINE';
  clinicalInfo?: string;
  icd10Codes: string[];
  status: ImagingOrderStatus;
  orderedAt: string;
  scheduledAt?: string;
  performedAt?: string;
  reportedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface ImagingStudy {
  id: string;
  imagingOrderId: string;
  studyInstanceUID: string;
  accessionNumber?: string;
  seriesCount: number;
  instanceCount: number;
  studyDescription?: string;
  performedAt?: string;
  reportText?: string;
  reportedBy?: string;
  reportedAt?: string;
  status: ImagingStudyStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ImagingSeries {
  id: string;
  studyId: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  modality: ImagingModality;
  bodyPart: string;
  seriesDescription?: string;
  instanceCount: number;
  performedAt?: string;
  createdAt: string;
}

export interface ImagingInstance {
  id: string;
  seriesId: string;
  sopInstanceUID: string;
  instanceNumber: number;
  imageType?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  pixelSpacing?: string;
  sliceThickness?: number;
  acquisitionDateTime?: string;
  fileLocation?: string;
  fileSize?: number;
  createdAt: string;
}

export interface RadiologyReport {
  id: string;
  studyId: string;
  patientId: string;
  radiologistId: string;
  findings: string;
  impression: string;
  recommendations?: string;
  technique?: string;
  comparison?: string;
  status: 'DRAFT' | 'PRELIMINARY' | 'FINAL' | 'AMENDED';
  draftedAt: string;
  finalizedAt?: string;
  signedAt?: string;
  amendedAt?: string;
  amendmentReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImagingOrderCreateRequest {
  patientId: string;
  providerId: string;
  modality: ImagingModality;
  bodyPart: string;
  priority: 'STAT' | 'URGENT' | 'ROUTINE';
  clinicalInfo?: string;
  icd10Codes?: string[];
}

export interface ImagingOrderUpdateRequest {
  status?: ImagingOrderStatus;
  scheduledAt?: string;
  performedAt?: string;
}

export interface ImagingStudyCreateRequest {
  imagingOrderId: string;
  studyInstanceUID: string;
  accessionNumber?: string;
  studyDescription?: string;
}

export interface ImagingStudyUpdateRequest {
  seriesCount?: number;
  instanceCount?: number;
  reportText?: string;
  reportedBy?: string;
  status?: ImagingStudyStatus;
}

export interface RadiologyReportCreateRequest {
  studyId: string;
  patientId: string;
  radiologistId: string;
  findings: string;
  impression: string;
  recommendations?: string;
  technique?: string;
  comparison?: string;
}

export interface RadiologyReportUpdateRequest {
  findings?: string;
  impression?: string;
  recommendations?: string;
  technique?: string;
  comparison?: string;
  status?: 'DRAFT' | 'PRELIMINARY' | 'FINAL';
}

export interface RadiologyReportSignRequest {
  reportId: string;
  radiologistId: string;
}

export interface ImagingOrderSearchFilters {
  patientId?: string;
  providerId?: string;
  status?: ImagingOrderStatus;
  modality?: ImagingModality;
  priority?: 'STAT' | 'URGENT' | 'ROUTINE';
  startDate?: string;
  endDate?: string;
  orderNumber?: string;
}

export interface ImagingStatistics {
  totalOrders: number;
  byStatus: Record<ImagingOrderStatus, number>;
  byModality: Record<ImagingModality, number>;
  pendingReports: number;
  averageTurnaroundTime: number; // hours
  criticalFindings: number;
}

export interface DICOMConfiguration {
  aeTitle: string;
  host: string;
  port: number;
  protocol: 'DICOM' | 'DICOMWEB';
  storageDirectory: string;
  maxStudyAge: number; // days
  autoRouting: boolean;
}

export interface PACSIntegration {
  id: string;
  name: string;
  vendor: string;
  aeTitle: string;
  host: string;
  port: number;
  isActive: boolean;
  lastSync?: string;
  configuration: Record<string, any>;
}

export interface CriticalResult {
  id: string;
  studyId: string;
  patientId: string;
  finding: string;
  severity: 'CRITICAL' | 'URGENT';
  notifiedAt?: string;
  notifiedBy?: string;
  acknowledgmentBy?: string;
  acknowledgmentAt?: string;
  createdAt: string;
}

export interface ImagingProtocol {
  id: string;
  name: string;
  modality: ImagingModality;
  bodyPart: string;
  description?: string;
  technicalParameters: Record<string, any>;
  contrastRequired: boolean;
  estimatedDuration: number; // minutes
  patientPreparation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModalityWorklist {
  id: string;
  studyInstanceUID: string;
  scheduledProcedureStepID: string;
  modality: ImagingModality;
  patientId: string;
  patientName: string;
  accessionNumber: string;
  scheduledDateTime: string;
  performingPhysician?: string;
  procedureDescription?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface ImageViewer {
  studyInstanceUID: string;
  viewerType: 'BASIC' | 'ADVANCED' | 'DIAGNOSTIC';
  windowLevel?: number;
  windowWidth?: number;
  zoom?: number;
  annotations?: ImageAnnotation[];
  measurements?: ImageMeasurement[];
}

export interface ImageAnnotation {
  id: string;
  type: 'ARROW' | 'CIRCLE' | 'RECTANGLE' | 'TEXT';
  coordinates: number[];
  text?: string;
  createdBy: string;
  createdAt: string;
}

export interface ImageMeasurement {
  id: string;
  type: 'LENGTH' | 'AREA' | 'ANGLE' | 'VOLUME';
  value: number;
  unit: string;
  coordinates: number[];
  createdBy: string;
  createdAt: string;
}
