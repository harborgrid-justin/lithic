// Pharmacy & Medication Management Types

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISCONTINUED = 'DISCONTINUED',
  ON_HOLD = 'ON_HOLD',
}

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  IV = 'IV',
  IM = 'IM',
  SC = 'SC',
  TOPICAL = 'TOPICAL',
  INHALATION = 'INHALATION',
  RECTAL = 'RECTAL',
  SUBLINGUAL = 'SUBLINGUAL',
  TRANSDERMAL = 'TRANSDERMAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC',
  NASAL = 'NASAL',
}

export enum MedicationForm {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  LIQUID = 'LIQUID',
  SOLUTION = 'SOLUTION',
  SUSPENSION = 'SUSPENSION',
  INJECTION = 'INJECTION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  PATCH = 'PATCH',
  INHALER = 'INHALER',
  SUPPOSITORY = 'SUPPOSITORY',
  DROP = 'DROP',
}

export enum DEASchedule {
  SCHEDULE_I = 'SCHEDULE_I',
  SCHEDULE_II = 'SCHEDULE_II',
  SCHEDULE_III = 'SCHEDULE_III',
  SCHEDULE_IV = 'SCHEDULE_IV',
  SCHEDULE_V = 'SCHEDULE_V',
  NON_CONTROLLED = 'NON_CONTROLLED',
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  medicationName: string;
  rxnormCode?: string;
  strength: string;
  form: MedicationForm;
  route: MedicationRoute;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  refills: number;
  instructions?: string;
  indication?: string;
  status: MedicationStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  providerId: string;
  rxNumber: string;
  medicationName: string;
  rxnormCode?: string;
  strength: string;
  form: MedicationForm;
  route: MedicationRoute;
  dosage: string;
  frequency: string;
  quantity: number;
  refills: number;
  refillsRemaining: number;
  daysSupply?: number;
  instructions?: string;
  indication?: string;
  deaSchedule?: DEASchedule;
  status: PrescriptionStatus;
  prescribedAt: string;
  dispensedAt?: string;
  pharmacyName?: string;
  pharmacyNPI?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface MedicationAdministration {
  id: string;
  patientId: string;
  medicationOrderId: string;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  administeredAt: string;
  administeredBy: string;
  site?: string;
  notes?: string;
  refusalReason?: string;
  wasRefused: boolean;
  createdAt: string;
}

export interface DrugInteraction {
  severity: 'MAJOR' | 'MODERATE' | 'MINOR';
  description: string;
  recommendation: string;
  drug1: string;
  drug2: string;
}

export interface DrugAllergy {
  id: string;
  patientId: string;
  allergen: string;
  allergenType: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL';
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  onsetDate?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Formulary {
  id: string;
  medicationName: string;
  rxnormCode: string;
  tier: number;
  isPreferred: boolean;
  requiresPriorAuth: boolean;
  restrictions?: string;
  alternatives?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicationOrderCreateRequest {
  patientId: string;
  medicationName: string;
  rxnormCode?: string;
  strength: string;
  form: MedicationForm;
  route: MedicationRoute;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  indication?: string;
  startDate?: string;
}

export interface PrescriptionCreateRequest {
  patientId: string;
  providerId: string;
  medicationName: string;
  rxnormCode?: string;
  strength: string;
  form: MedicationForm;
  route: MedicationRoute;
  dosage: string;
  frequency: string;
  quantity: number;
  refills: number;
  daysSupply?: number;
  instructions?: string;
  indication?: string;
  deaSchedule?: DEASchedule;
  pharmacyName?: string;
  pharmacyNPI?: string;
}

export interface PrescriptionUpdateRequest {
  status?: PrescriptionStatus;
  refillsRemaining?: number;
  dispensedAt?: string;
}

export interface MedicationAdministrationRequest {
  patientId: string;
  medicationOrderId: string;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  administeredBy: string;
  site?: string;
  notes?: string;
  wasRefused?: boolean;
  refusalReason?: string;
}

export interface DrugInteractionCheckRequest {
  medications: string[]; // RxNorm codes or names
  patientAllergies?: string[];
}

export interface DrugInteractionCheckResponse {
  interactions: DrugInteraction[];
  allergyConflicts: {
    medication: string;
    allergy: string;
    severity: string;
  }[];
}

export interface MedicationSearchFilters {
  patientId?: string;
  status?: MedicationStatus;
  medicationName?: string;
  startDate?: string;
  endDate?: string;
}

export interface PrescriptionSearchFilters {
  patientId?: string;
  providerId?: string;
  status?: PrescriptionStatus;
  rxNumber?: string;
  startDate?: string;
  endDate?: string;
}

export interface PharmacyStatistics {
  totalPrescriptions: number;
  byStatus: Record<PrescriptionStatus, number>;
  controlledSubstances: number;
  pendingRefills: number;
  expiringPrescriptions: number;
}

export interface EPCSConfiguration {
  enabled: boolean;
  providerId: string;
  deaNumber: string;
  certificateExpiration: string;
  twoFactorEnabled: boolean;
}

export interface MedicationReconciliation {
  id: string;
  patientId: string;
  performedAt: string;
  performedBy: string;
  homeMedications: MedicationOrder[];
  facilityMedications: MedicationOrder[];
  discrepancies: {
    type: 'MISSING' | 'INCORRECT_DOSE' | 'INCORRECT_FREQUENCY' | 'DUPLICATE';
    description: string;
    resolved: boolean;
  }[];
}
