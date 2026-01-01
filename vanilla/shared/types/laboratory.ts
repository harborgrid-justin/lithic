// Laboratory Management Types

export enum OrderPriority {
  STAT = 'STAT',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
}

export enum LabOrderStatus {
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  RECEIVED = 'RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ResultStatus {
  PRELIMINARY = 'PRELIMINARY',
  FINAL = 'FINAL',
  CORRECTED = 'CORRECTED',
  CANCELLED = 'CANCELLED',
}

export enum SpecimenType {
  BLOOD = 'BLOOD',
  URINE = 'URINE',
  SERUM = 'SERUM',
  PLASMA = 'PLASMA',
  CSF = 'CSF',
  TISSUE = 'TISSUE',
  SWAB = 'SWAB',
  SPUTUM = 'SPUTUM',
  STOOL = 'STOOL',
  OTHER = 'OTHER',
}

export interface LabOrder {
  id: string;
  patientId: string;
  providerId: string;
  orderNumber: string;
  priority: OrderPriority;
  clinicalInfo?: string;
  icd10Codes: string[];
  status: LabOrderStatus;
  orderedAt: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface LabTest {
  id: string;
  labOrderId: string;
  loincCode: string;
  testName: string;
  description?: string;
  specimenType?: SpecimenType;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LabResult {
  id: string;
  labOrderId: string;
  loincCode: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  criticalFlag: boolean;
  status: ResultStatus;
  resultedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LOINCCode {
  code: string;
  component: string;
  property: string;
  timeAspect: string;
  system: string;
  scale: string;
  method?: string;
  displayName: string;
}

export interface LabPanel {
  id: string;
  panelCode: string;
  panelName: string;
  description?: string;
  tests: string[]; // LOINC codes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrderCreateRequest {
  patientId: string;
  providerId: string;
  priority: OrderPriority;
  tests: LabTestCreateRequest[];
  clinicalInfo?: string;
  icd10Codes?: string[];
}

export interface LabTestCreateRequest {
  loincCode: string;
  testName: string;
  description?: string;
  specimenType?: SpecimenType;
}

export interface LabOrderUpdateRequest {
  status?: LabOrderStatus;
  collectedAt?: string;
  receivedAt?: string;
}

export interface LabResultCreateRequest {
  labOrderId: string;
  loincCode: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  criticalFlag?: boolean;
  comments?: string;
}

export interface LabResultUpdateRequest {
  value?: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  criticalFlag?: boolean;
  status?: ResultStatus;
  comments?: string;
}

export interface LabResultVerifyRequest {
  resultId: string;
  verifiedBy: string;
}

export interface LabOrderSearchFilters {
  patientId?: string;
  providerId?: string;
  status?: LabOrderStatus;
  priority?: OrderPriority;
  startDate?: string;
  endDate?: string;
  orderNumber?: string;
}

export interface LabResultSearchFilters {
  patientId?: string;
  labOrderId?: string;
  loincCode?: string;
  status?: ResultStatus;
  criticalOnly?: boolean;
  abnormalOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface LabStatistics {
  totalOrders: number;
  byStatus: Record<LabOrderStatus, number>;
  byPriority: Record<OrderPriority, number>;
  criticalResults: number;
  averageTurnaroundTime: number; // hours
  pendingOrders: number;
}

export interface SpecimenCollection {
  id: string;
  labOrderId: string;
  specimenType: SpecimenType;
  collectedAt: string;
  collectedBy: string;
  collectionMethod?: string;
  containerType?: string;
  volume?: string;
  conditions?: string;
  barcode?: string;
  rejected: boolean;
  rejectionReason?: string;
}

export interface QualityControl {
  id: string;
  testCode: string;
  controlLevel: string;
  expectedValue: string;
  actualValue: string;
  result: 'PASS' | 'FAIL';
  performedAt: string;
  performedBy: string;
  comments?: string;
}

export interface LabInterface {
  id: string;
  interfaceType: 'HL7' | 'ASTM' | 'FHIR';
  instrumentId: string;
  instrumentName: string;
  isActive: boolean;
  lastSync?: string;
  configuration: Record<string, any>;
}
