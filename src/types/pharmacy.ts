/**
 * Pharmacy Management Module Types
 * Agent 7: Pharmacy
 */

import type { BaseEntity } from './index';

// ============================================================================
// Prescription Types
// ============================================================================

export interface Prescription extends BaseEntity {
  patientId: string;
  encounterId: string | null;
  prescriptionNumber: string;
  medication: Medication;
  medicationId: string;
  prescriberId: string;
  prescriberName: string;
  prescriberNPI: string;
  prescriberDEA: string | null;
  prescribedDate: Date;
  writtenDate: Date;
  effectiveDate: Date;
  expirationDate: Date | null;
  strength: string;
  dosageForm: DosageForm;
  route: MedicationRoute;
  frequency: string;
  dosageInstructions: string;
  quantity: number;
  daysSupply: number;
  refillsAuthorized: number;
  refillsRemaining: number;
  substitutionAllowed: boolean;
  priorAuthRequired: boolean;
  priorAuthNumber: string | null;
  status: PrescriptionStatus;
  controlledSubstanceSchedule: ControlledSchedule | null;
  pharmacyId: string | null;
  pharmacyName: string | null;
  dispensedDate: Date | null;
  dispensedBy: string | null;
  ndc: string | null;
  diagnosis: string | null;
  icdCode: string | null;
  indication: string | null;
  notes: string | null;
  ePrescribedAt: Date | null;
  ePrescribeStatus: EPrescribeStatus | null;
  ePrescribeResponse: Record<string, any> | null;
}

export enum DosageForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  LIQUID = 'LIQUID',
  SYRUP = 'SYRUP',
  SUSPENSION = 'SUSPENSION',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  PATCH = 'PATCH',
  INHALER = 'INHALER',
  DROPS = 'DROPS',
  SUPPOSITORY = 'SUPPOSITORY',
  POWDER = 'POWDER',
  GEL = 'GEL',
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  SUBLINGUAL = 'SUBLINGUAL',
  BUCCAL = 'BUCCAL',
  RECTAL = 'RECTAL',
  VAGINAL = 'VAGINAL',
  TOPICAL = 'TOPICAL',
  TRANSDERMAL = 'TRANSDERMAL',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  INHALATION = 'INHALATION',
  NASAL = 'NASAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC',
}

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISCONTINUED = 'DISCONTINUED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
  EXPIRED = 'EXPIRED',
  ENTERED_IN_ERROR = 'ENTERED_IN_ERROR',
}

export enum ControlledSchedule {
  SCHEDULE_I = 'SCHEDULE_I',
  SCHEDULE_II = 'SCHEDULE_II',
  SCHEDULE_III = 'SCHEDULE_III',
  SCHEDULE_IV = 'SCHEDULE_IV',
  SCHEDULE_V = 'SCHEDULE_V',
  NON_CONTROLLED = 'NON_CONTROLLED',
}

export enum EPrescribeStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

// ============================================================================
// Medication Types
// ============================================================================

export interface Medication extends BaseEntity {
  name: string;
  genericName: string;
  brandNames: string[];
  rxcui: string | null;
  ndc: string | null;
  strength: string;
  dosageForm: DosageForm;
  route: MedicationRoute;
  manufacturer: string | null;
  category: MedicationCategory;
  class: string | null;
  controlledSchedule: ControlledSchedule;
  isFormulary: boolean;
  isActive: boolean;
  description: string | null;
  sideEffects: string | null;
  contraindications: string | null;
  interactions: DrugInteraction[];
  blackBoxWarning: string | null;
  pregnancyCategory: PregnancyCategory | null;
  lactationCategory: LactationCategory | null;
}

export enum MedicationCategory {
  ANTIBIOTIC = 'ANTIBIOTIC',
  ANTIVIRAL = 'ANTIVIRAL',
  ANTIFUNGAL = 'ANTIFUNGAL',
  ANALGESIC = 'ANALGESIC',
  ANTI_INFLAMMATORY = 'ANTI_INFLAMMATORY',
  ANTIHYPERTENSIVE = 'ANTIHYPERTENSIVE',
  ANTIDIABETIC = 'ANTIDIABETIC',
  ANTIDEPRESSANT = 'ANTIDEPRESSANT',
  ANTIPSYCHOTIC = 'ANTIPSYCHOTIC',
  ANTICONVULSANT = 'ANTICONVULSANT',
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  RESPIRATORY = 'RESPIRATORY',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  HORMONES = 'HORMONES',
  VITAMINS_SUPPLEMENTS = 'VITAMINS_SUPPLEMENTS',
  OTHER = 'OTHER',
}

export enum PregnancyCategory {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  X = 'X',
  UNKNOWN = 'UNKNOWN',
}

export enum LactationCategory {
  COMPATIBLE = 'COMPATIBLE',
  USE_CAUTION = 'USE_CAUTION',
  AVOID = 'AVOID',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Drug Interaction Types
// ============================================================================

export interface DrugInteraction extends BaseEntity {
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffects: string | null;
  mechanism: string | null;
  management: string | null;
  references: string | null;
}

export enum InteractionSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CONTRAINDICATED = 'CONTRAINDICATED',
}

export interface InteractionCheck {
  patientId: string;
  medications: string[];
  interactions: DrugInteraction[];
  allergyConflicts: AllergyConflict[];
  duplicateTherapy: DuplicateTherapy[];
  warnings: MedicationWarning[];
}

export interface AllergyConflict {
  medicationId: string;
  medicationName: string;
  allergyId: string;
  allergen: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  crossSensitivity: boolean;
}

export interface DuplicateTherapy {
  medication1Id: string;
  medication1Name: string;
  medication2Id: string;
  medication2Name: string;
  therapeuticClass: string;
}

export interface MedicationWarning {
  type: WarningType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  details: string | null;
}

export enum WarningType {
  AGE_RELATED = 'AGE_RELATED',
  PREGNANCY = 'PREGNANCY',
  LACTATION = 'LACTATION',
  RENAL_IMPAIRMENT = 'RENAL_IMPAIRMENT',
  HEPATIC_IMPAIRMENT = 'HEPATIC_IMPAIRMENT',
  GENETIC_FACTOR = 'GENETIC_FACTOR',
  DOSAGE = 'DOSAGE',
  OTHER = 'OTHER',
}

// ============================================================================
// Medication Administration Types
// ============================================================================

export interface MedicationAdministration extends BaseEntity {
  patientId: string;
  prescriptionId: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  site: string | null;
  scheduledTime: Date;
  administeredTime: Date | null;
  administeredBy: string | null;
  status: AdministrationStatus;
  reason: string | null;
  notes: string | null;
  lotNumber: string | null;
  expirationDate: Date | null;
}

export enum AdministrationStatus {
  SCHEDULED = 'SCHEDULED',
  ADMINISTERED = 'ADMINISTERED',
  MISSED = 'MISSED',
  REFUSED = 'REFUSED',
  HELD = 'HELD',
  NOT_GIVEN = 'NOT_GIVEN',
}

// ============================================================================
// Formulary Types
// ============================================================================

export interface Formulary extends BaseEntity {
  name: string;
  type: FormularyType;
  effectiveDate: Date;
  expirationDate: Date | null;
  medications: FormularyMedication[];
  restrictions: FormularyRestriction[];
  isDefault: boolean;
}

export enum FormularyType {
  COMMERCIAL = 'COMMERCIAL',
  MEDICARE = 'MEDICARE',
  MEDICAID = 'MEDICAID',
  HOSPITAL = 'HOSPITAL',
  CUSTOM = 'CUSTOM',
}

export interface FormularyMedication {
  medicationId: string;
  tier: number;
  copay: number | null;
  coinsurance: number | null;
  priorAuthRequired: boolean;
  quantityLimit: number | null;
  stepTherapyRequired: boolean;
  preferredAlternatives: string[];
}

export interface FormularyRestriction {
  medicationId: string;
  type: RestrictionType;
  description: string;
  criteria: string | null;
}

export enum RestrictionType {
  PRIOR_AUTHORIZATION = 'PRIOR_AUTHORIZATION',
  STEP_THERAPY = 'STEP_THERAPY',
  QUANTITY_LIMIT = 'QUANTITY_LIMIT',
  AGE_LIMIT = 'AGE_LIMIT',
  GENDER_LIMIT = 'GENDER_LIMIT',
  DIAGNOSIS_REQUIRED = 'DIAGNOSIS_REQUIRED',
}

// ============================================================================
// Pharmacy Inventory Types
// ============================================================================

export interface PharmacyInventory extends BaseEntity {
  medicationId: string;
  ndc: string;
  lotNumber: string;
  expirationDate: Date;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  reorderQuantity: number;
  location: string | null;
  cost: number | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
}

// ============================================================================
// Refill Request Types
// ============================================================================

export interface RefillRequest extends BaseEntity {
  prescriptionId: string;
  patientId: string;
  pharmacyId: string | null;
  requestedDate: Date;
  requestedBy: string;
  requestMethod: RefillMethod;
  status: RefillStatus;
  reviewedBy: string | null;
  reviewedDate: Date | null;
  approvedRefills: number | null;
  denialReason: string | null;
  notes: string | null;
}

export enum RefillMethod {
  PATIENT_PORTAL = 'PATIENT_PORTAL',
  PHONE = 'PHONE',
  PHARMACY = 'PHARMACY',
  IN_PERSON = 'IN_PERSON',
}

export enum RefillStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreatePrescriptionDto {
  patientId: string;
  encounterId?: string;
  medicationId: string;
  prescriberId: string;
  strength: string;
  dosageForm: DosageForm;
  route: MedicationRoute;
  frequency: string;
  dosageInstructions: string;
  quantity: number;
  daysSupply: number;
  refillsAuthorized: number;
  substitutionAllowed?: boolean;
  priorAuthNumber?: string;
  diagnosis?: string;
  icdCode?: string;
  indication?: string;
  notes?: string;
  sendEPrescription?: boolean;
  pharmacyId?: string;
}

export interface EPrescribeDto {
  prescriptionId: string;
  pharmacyId: string;
}

export interface CheckInteractionsDto {
  patientId: string;
  newMedicationIds: string[];
}

export interface MedicationSummary {
  id: string;
  medicationName: string;
  strength: string;
  dosageInstructions: string;
  status: PrescriptionStatus;
  prescribedDate: Date;
  refillsRemaining: number;
}
