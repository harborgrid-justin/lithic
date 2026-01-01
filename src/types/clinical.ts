/**
 * Clinical Documentation / EHR Module Types
 * Agent 3: Clinical Documentation
 */

import type { BaseEntity } from './index';

// ============================================================================
// Clinical Note Types
// ============================================================================

export interface ClinicalNote extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  type: NoteType;
  template: string | null;
  chiefComplaint: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  content: Record<string, any>;
  status: NoteStatus;
  signedAt: Date | null;
  signedBy: string | null;
  cosignRequired: boolean;
  cosignedAt: Date | null;
  cosignedBy: string | null;
  addendum: NoteAddendum[];
  attachments: string[];
  locked: boolean;
  lockedAt: Date | null;
}

export enum NoteType {
  SOAP = 'SOAP',
  HISTORY_PHYSICAL = 'HISTORY_PHYSICAL',
  PROGRESS_NOTE = 'PROGRESS_NOTE',
  PROCEDURE_NOTE = 'PROCEDURE_NOTE',
  CONSULTATION = 'CONSULTATION',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  OPERATIVE_REPORT = 'OPERATIVE_REPORT',
  TELEPHONE_ENCOUNTER = 'TELEPHONE_ENCOUNTER',
  REFILL_REQUEST = 'REFILL_REQUEST',
  NURSE_NOTE = 'NURSE_NOTE',
  EMERGENCY_DEPARTMENT = 'EMERGENCY_DEPARTMENT',
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  PENDING_COSIGN = 'PENDING_COSIGN',
  COSIGNED = 'COSIGNED',
  AMENDED = 'AMENDED',
  DELETED = 'DELETED',
}

export interface NoteAddendum extends BaseEntity {
  noteId: string;
  content: string;
  reason: string;
  addedBy: string;
}

// ============================================================================
// Encounter Types
// ============================================================================

export interface Encounter extends BaseEntity {
  patientId: string;
  appointmentId: string | null;
  type: EncounterType;
  class: EncounterClass;
  priority: EncounterPriority;
  status: EncounterStatus;
  chiefComplaint: string | null;
  startTime: Date;
  endTime: Date | null;
  provider: string;
  facility: string;
  location: string | null;
  serviceType: string;
  diagnoses: Diagnosis[];
  procedures: Procedure[];
  vitalSigns: VitalSigns[];
  orders: Order[];
  notes: ClinicalNote[];
  billingCodes: string[];
  reasonForVisit: string | null;
  disposition: string | null;
}

export enum EncounterType {
  OFFICE_VISIT = 'OFFICE_VISIT',
  HOSPITAL_INPATIENT = 'HOSPITAL_INPATIENT',
  EMERGENCY = 'EMERGENCY',
  URGENT_CARE = 'URGENT_CARE',
  TELEMEDICINE = 'TELEMEDICINE',
  HOME_VISIT = 'HOME_VISIT',
  NURSING_HOME = 'NURSING_HOME',
  CONSULTATION = 'CONSULTATION',
  SURGICAL = 'SURGICAL',
  PREVENTIVE = 'PREVENTIVE',
}

export enum EncounterClass {
  AMBULATORY = 'AMBULATORY',
  EMERGENCY = 'EMERGENCY',
  INPATIENT = 'INPATIENT',
  OBSERVATION = 'OBSERVATION',
  VIRTUAL = 'VIRTUAL',
}

export enum EncounterPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
  ELECTIVE = 'ELECTIVE',
}

export enum EncounterStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// ============================================================================
// Vital Signs Types
// ============================================================================

export interface VitalSigns extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  recordedAt: Date;
  recordedBy: string;
  height: number | null;
  heightUnit: 'cm' | 'in' | null;
  weight: number | null;
  weightUnit: 'kg' | 'lb' | null;
  bmi: number | null;
  temperature: number | null;
  temperatureUnit: 'F' | 'C' | null;
  temperatureSite: TemperatureSite | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  bpPosition: BPPosition | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  oxygenSupplemental: boolean | null;
  oxygenFlowRate: number | null;
  painScale: number | null;
  headCircumference: number | null;
  notes: string | null;
}

export enum TemperatureSite {
  ORAL = 'ORAL',
  RECTAL = 'RECTAL',
  AXILLARY = 'AXILLARY',
  TYMPANIC = 'TYMPANIC',
  TEMPORAL = 'TEMPORAL',
}

export enum BPPosition {
  SITTING = 'SITTING',
  STANDING = 'STANDING',
  LYING = 'LYING',
}

// ============================================================================
// Problem List Types
// ============================================================================

export interface ProblemList extends BaseEntity {
  patientId: string;
  problem: string;
  icdCode: string;
  icdVersion: 'ICD-10' | 'ICD-11';
  snomedCode: string | null;
  status: ProblemStatus;
  severity: ProblemSeverity;
  onsetDate: Date | null;
  resolvedDate: Date | null;
  recordedBy: string;
  recordedDate: Date;
  notes: string | null;
}

export enum ProblemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESOLVED = 'RESOLVED',
  RECURRENT = 'RECURRENT',
}

export enum ProblemSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  LIFE_THREATENING = 'LIFE_THREATENING',
}

// ============================================================================
// Diagnosis Types
// ============================================================================

export interface Diagnosis extends BaseEntity {
  patientId: string;
  encounterId: string;
  diagnosis: string;
  icdCode: string;
  icdVersion: 'ICD-10' | 'ICD-11';
  type: DiagnosisType;
  rank: number;
  onsetDate: Date | null;
  diagnosedBy: string;
  diagnosedDate: Date;
  status: DiagnosisStatus;
  notes: string | null;
}

export enum DiagnosisType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  ADMITTING = 'ADMITTING',
  DISCHARGE = 'DISCHARGE',
  DIFFERENTIAL = 'DIFFERENTIAL',
}

export enum DiagnosisStatus {
  PROVISIONAL = 'PROVISIONAL',
  CONFIRMED = 'CONFIRMED',
  RULED_OUT = 'RULED_OUT',
  RESOLVED = 'RESOLVED',
}

// ============================================================================
// Procedure Types
// ============================================================================

export interface Procedure extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  procedure: string;
  cptCode: string;
  snomedCode: string | null;
  performedDate: Date;
  performedBy: string;
  assistants: string[];
  location: string | null;
  indication: string | null;
  findings: string | null;
  complications: string | null;
  notes: string | null;
  status: ProcedureStatus;
  duration: number | null;
  anesthesia: string | null;
}

export enum ProcedureStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ABORTED = 'ABORTED',
}

// ============================================================================
// Care Plan Types
// ============================================================================

export interface CarePlan extends BaseEntity {
  patientId: string;
  title: string;
  description: string;
  category: CarePlanCategory;
  status: CarePlanStatus;
  intent: CarePlanIntent;
  period: DateRange;
  author: string;
  careTeam: string[];
  addresses: string[];
  goals: CarePlanGoal[];
  activities: CarePlanActivity[];
  notes: string | null;
}

export enum CarePlanCategory {
  DISEASE_MANAGEMENT = 'DISEASE_MANAGEMENT',
  PREVENTIVE_CARE = 'PREVENTIVE_CARE',
  REHABILITATION = 'REHABILITATION',
  POST_OPERATIVE = 'POST_OPERATIVE',
  CHRONIC_CARE = 'CHRONIC_CARE',
  PALLIATIVE_CARE = 'PALLIATIVE_CARE',
}

export enum CarePlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REVOKED = 'REVOKED',
}

export enum CarePlanIntent {
  PROPOSAL = 'PROPOSAL',
  PLAN = 'PLAN',
  ORDER = 'ORDER',
  OPTION = 'OPTION',
}

export interface DateRange {
  start: Date;
  end: Date | null;
}

export interface CarePlanGoal {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'proposed' | 'active' | 'achieved' | 'suspended' | 'cancelled';
  targetDate: Date | null;
  outcomeReference: string | null;
}

export interface CarePlanActivity {
  id: string;
  kind: ActivityKind;
  code: string;
  description: string;
  status: ActivityStatus;
  scheduledTiming: string | null;
  scheduledPeriod: DateRange | null;
  performer: string | null;
  productReference: string | null;
  quantity: number | null;
  notes: string | null;
}

export enum ActivityKind {
  APPOINTMENT = 'APPOINTMENT',
  DIAGNOSTIC = 'DIAGNOSTIC',
  MEDICATION = 'MEDICATION',
  OBSERVATION = 'OBSERVATION',
  PROCEDURE = 'PROCEDURE',
  NUTRITION = 'NUTRITION',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

export enum ActivityStatus {
  NOT_STARTED = 'NOT_STARTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  STOPPED = 'STOPPED',
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  type: OrderType;
  category: string;
  description: string;
  orderCode: string | null;
  priority: OrderPriority;
  status: OrderStatus;
  orderedBy: string;
  orderedDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  instructions: string | null;
  indication: string | null;
  performingDepartment: string | null;
  performingProvider: string | null;
  referenceId: string | null;
  parentOrderId: string | null;
}

export enum OrderType {
  LABORATORY = 'LABORATORY',
  IMAGING = 'IMAGING',
  MEDICATION = 'MEDICATION',
  PROCEDURE = 'PROCEDURE',
  REFERRAL = 'REFERRAL',
  NURSING = 'NURSING',
  DIET = 'DIET',
  THERAPY = 'THERAPY',
}

export enum OrderPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT',
  ASAP = 'ASAP',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISCONTINUED = 'DISCONTINUED',
  ENTERED_IN_ERROR = 'ENTERED_IN_ERROR',
}

// ============================================================================
// Clinical Decision Support Types
// ============================================================================

export interface ClinicalAlert {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string | null;
  triggeredBy: string;
  triggeredAt: Date;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  dismissed: boolean;
  evidence: Record<string, any>;
}

export enum AlertType {
  DRUG_INTERACTION = 'DRUG_INTERACTION',
  DRUG_ALLERGY = 'DRUG_ALLERGY',
  DUPLICATE_THERAPY = 'DUPLICATE_THERAPY',
  LAB_CRITICAL = 'LAB_CRITICAL',
  VITAL_ABNORMAL = 'VITAL_ABNORMAL',
  PREVENTIVE_CARE_DUE = 'PREVENTIVE_CARE_DUE',
  QUALITY_MEASURE = 'QUALITY_MEASURE',
  CLINICAL_GUIDELINE = 'CLINICAL_GUIDELINE',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
}

// ============================================================================
// FHIR Compatibility Types
// ============================================================================

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: FHIRMeta;
  text?: FHIRNarrative;
}

export interface FHIRMeta {
  versionId?: string;
  lastUpdated?: Date;
  source?: string;
  profile?: string[];
  security?: FHIRCoding[];
  tag?: FHIRCoding[];
}

export interface FHIRNarrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty';
  div: string;
}

export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FHIRCodeableConcept;
  system?: string;
  value?: string;
  period?: FHIRPeriod;
  assigner?: FHIRReference;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRPeriod {
  start?: Date;
  end?: Date;
}

// ============================================================================
// Templates and Forms
// ============================================================================

export interface ClinicalTemplate extends BaseEntity {
  name: string;
  type: NoteType;
  specialty: string | null;
  category: string;
  content: TemplateSection[];
  isDefault: boolean;
  isShared: boolean;
  ownedBy: string;
  usageCount: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  type: SectionType;
  required: boolean;
  content: string | null;
  fields: TemplateField[];
}

export enum SectionType {
  TEXT = 'TEXT',
  STRUCTURED = 'STRUCTURED',
  CHECKLIST = 'CHECKLIST',
  TABLE = 'TABLE',
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
  defaultValue: any;
  validation: Record<string, any> | null;
}

export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateClinicalNoteDto {
  patientId: string;
  encounterId?: string;
  type: NoteType;
  template?: string;
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content?: Record<string, any>;
  cosignRequired?: boolean;
}

export interface UpdateClinicalNoteDto extends Partial<CreateClinicalNoteDto> {
  id: string;
}

export interface SignNoteDto {
  noteId: string;
  signature: string;
  password: string;
}
