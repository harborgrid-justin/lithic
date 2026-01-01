// Clinical Documentation Types

export enum ClinicalNoteType {
  SOAP = 'SOAP',
  PROGRESS = 'PROGRESS',
  CONSULTATION = 'CONSULTATION',
  ADMISSION = 'ADMISSION',
  DISCHARGE = 'DISCHARGE',
  PROCEDURE = 'PROCEDURE',
  TELEPHONE = 'TELEPHONE',
  FOLLOWUP = 'FOLLOWUP',
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  SIGNED = 'SIGNED',
  AMENDED = 'AMENDED',
  DELETED = 'DELETED',
}

export enum DiagnosisType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  ADMITTING = 'ADMITTING',
  DISCHARGE = 'DISCHARGE',
  RULE_OUT = 'RULE_OUT',
}

export enum DiagnosisStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESOLVED = 'RESOLVED',
  CHRONIC = 'CHRONIC',
}

export enum ProcedureStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  noteType: ClinicalNoteType;
  subjective?: string; // SOAP: Patient's description
  objective?: string; // SOAP: Provider's observations
  assessment?: string; // SOAP: Provider's diagnosis/assessment
  plan?: string; // SOAP: Treatment plan
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: Record<string, any>;
  status: NoteStatus;
  signedAt?: string;
  signedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  icd10Code: string;
  description: string;
  diagnosisType: DiagnosisType;
  status: DiagnosisStatus;
  onsetDate?: string;
  resolvedDate?: string;
  severity?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface Procedure {
  id: string;
  patientId: string;
  providerId?: string;
  cptCode: string;
  description: string;
  procedureDate: string;
  location?: string;
  duration?: number; // minutes
  notes?: string;
  status: ProcedureStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  temperature?: number; // Fahrenheit
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  heartRate?: number; // bpm
  respiratoryRate?: number; // breaths per minute
  oxygenSaturation?: number; // percentage
  weight?: number; // pounds or kg
  height?: number; // inches or cm
  bmi?: number;
  painLevel?: number; // 0-10 scale
  recordedAt: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ClinicalNoteCreateRequest {
  patientId: string;
  providerId: string;
  appointmentId?: string;
  noteType: ClinicalNoteType;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: Record<string, any>;
}

export interface ClinicalNoteUpdateRequest extends Partial<ClinicalNoteCreateRequest> {
  status?: NoteStatus;
}

export interface ClinicalNoteSignRequest {
  noteId: string;
  providerId: string;
  signature?: string;
}

export interface DiagnosisCreateRequest {
  patientId: string;
  icd10Code: string;
  description: string;
  diagnosisType: DiagnosisType;
  onsetDate?: string;
  severity?: string;
}

export interface DiagnosisUpdateRequest extends Partial<DiagnosisCreateRequest> {
  status?: DiagnosisStatus;
  resolvedDate?: string;
}

export interface ProcedureCreateRequest {
  patientId: string;
  providerId?: string;
  cptCode: string;
  description: string;
  procedureDate: string;
  location?: string;
  duration?: number;
  notes?: string;
}

export interface VitalSignsCreateRequest {
  patientId: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  painLevel?: number;
  recordedBy?: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  rvuWork?: number;
  rvuPractice?: number;
  rvuMalpractice?: number;
}

export interface ClinicalSearchFilters {
  patientId?: string;
  providerId?: string;
  noteType?: ClinicalNoteType;
  status?: NoteStatus;
  startDate?: string;
  endDate?: string;
}
