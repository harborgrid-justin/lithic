// Clinical Data Types and Interfaces

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  rvuWork: number;
  rvuPracticeExpense: number;
  rvuMalpractice: number;
}

export interface Encounter {
  id: string;
  patientId: string;
  providerId: string;
  facilityId: string;
  encounterType: "inpatient" | "outpatient" | "emergency" | "telehealth";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  chiefComplaint: string;
  encounterDate: Date;
  startTime: Date;
  endTime?: Date;
  department: string;
  appointmentType: string;
  icd10Codes: string[];
  cptCodes: string[];
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  signedBy?: string;
  signature?: string;
}

export interface ClinicalNote {
  id: string;
  encounterId: string;
  patientId: string;
  providerId: string;
  noteType:
    | "progress"
    | "soap"
    | "admission"
    | "discharge"
    | "consult"
    | "procedure";
  template?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content: string;
  status: "draft" | "signed" | "amended" | "addended";
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  signedBy?: string;
  signature?: string;
  addendum?: string[];
}

export interface VitalSigns {
  id: string;
  encounterId: string;
  patientId: string;
  recordedAt: Date;
  recordedBy: string;
  temperature?: number;
  temperatureUnit: "F" | "C";
  pulse?: number;
  respiratoryRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  weight?: number;
  weightUnit: "lbs" | "kg";
  height?: number;
  heightUnit: "in" | "cm";
  bmi?: number;
  painLevel?: number; // 0-10 scale
  headCircumference?: number;
  notes?: string;
  createdAt: Date;
}

export interface Problem {
  id: string;
  patientId: string;
  encounterId?: string;
  icd10Code: string;
  problemName: string;
  status: "active" | "inactive" | "resolved" | "chronic";
  severity: "mild" | "moderate" | "severe";
  onsetDate: Date;
  resolvedDate?: Date;
  notes?: string;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  allergenType: "medication" | "food" | "environmental" | "other";
  reaction: string[];
  severity: "mild" | "moderate" | "severe" | "life-threatening";
  onsetDate?: Date;
  status: "active" | "inactive" | "resolved";
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  patientId: string;
  encounterId?: string;
  medicationName: string;
  genericName?: string;
  ndc?: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  indication?: string;
  status: "active" | "discontinued" | "completed" | "on-hold";
  refills?: number;
  quantity?: number;
  instructions?: string;
  pharmacy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  encounterId: string;
  patientId: string;
  orderType:
    | "lab"
    | "imaging"
    | "procedure"
    | "medication"
    | "referral"
    | "dme";
  orderName: string;
  cptCode?: string;
  icd10Codes: string[];
  priority: "routine" | "urgent" | "stat";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  orderedBy: string;
  orderedAt: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  instructions?: string;
  results?: string;
  signedBy?: string;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalTemplate {
  id: string;
  name: string;
  type: "note" | "order-set" | "assessment";
  specialty?: string;
  content: string;
  sections: TemplateSection[];
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSection {
  name: string;
  content: string;
  order: number;
  required: boolean;
}

export interface ESignature {
  userId: string;
  userName: string;
  timestamp: Date;
  ipAddress: string;
  signature: string; // Base64 encoded signature
  method: "password" | "pin" | "biometric" | "token";
}

export interface ClinicalDashboardStats {
  totalEncounters: number;
  pendingNotes: number;
  unseenPatients: number;
  criticalAlerts: number;
  pendingOrders: number;
  recentEncounters: Encounter[];
}

// Request/Response Types
export interface CreateEncounterRequest {
  patientId: string;
  providerId: string;
  facilityId: string;
  encounterType: Encounter["encounterType"];
  chiefComplaint: string;
  encounterDate: string;
  startTime: string;
  department: string;
  appointmentType: string;
}

export interface UpdateEncounterRequest {
  chiefComplaint?: string;
  status?: Encounter["status"];
  endTime?: string;
  icd10Codes?: string[];
  cptCodes?: string[];
}

export interface CreateNoteRequest {
  encounterId: string;
  patientId: string;
  providerId: string;
  noteType: ClinicalNote["noteType"];
  template?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  content: string;
}

export interface SignDocumentRequest {
  userId: string;
  password?: string;
  pin?: string;
  signatureData?: string;
  ipAddress: string;
}

export interface CreateVitalsRequest {
  encounterId: string;
  patientId: string;
  temperature?: number;
  temperatureUnit: "F" | "C";
  pulse?: number;
  respiratoryRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  weight?: number;
  weightUnit: "lbs" | "kg";
  height?: number;
  heightUnit: "in" | "cm";
  painLevel?: number;
  notes?: string;
}

export interface CreateProblemRequest {
  patientId: string;
  encounterId?: string;
  icd10Code: string;
  problemName: string;
  severity: Problem["severity"];
  onsetDate: string;
  notes?: string;
}

export interface CreateAllergyRequest {
  patientId: string;
  allergen: string;
  allergenType: Allergy["allergenType"];
  reaction: string[];
  severity: Allergy["severity"];
  onsetDate?: string;
  notes?: string;
}

export interface CreateMedicationRequest {
  patientId: string;
  encounterId?: string;
  medicationName: string;
  genericName?: string;
  ndc?: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  indication?: string;
  refills?: number;
  quantity?: number;
  instructions?: string;
  pharmacy?: string;
}

export interface CreateOrderRequest {
  encounterId: string;
  patientId: string;
  orderType: Order["orderType"];
  orderName: string;
  cptCode?: string;
  icd10Codes: string[];
  priority: Order["priority"];
  scheduledDate?: string;
  instructions?: string;
}
