/**
 * Patient Management Module Types
 * Agent 2: Patient Management
 */

import type {
  BaseEntity,
  Address,
  Name,
  Gender,
  BloodType,
  Race,
  Ethnicity,
  MaritalStatus,
} from "./index";

// ============================================================================
// Patient Types
// ============================================================================

export interface Patient extends BaseEntity {
  mrn: string;
  ssn: string | null;
  name: Name;
  dateOfBirth: Date;
  gender: Gender;
  race: Race | null;
  ethnicity: Ethnicity | null;
  maritalStatus: MaritalStatus | null;
  bloodType: BloodType | null;
  address: Address;
  phone: string;
  email: string | null;
  preferredLanguage: string;
  emergencyContacts: EmergencyContact[];
  insurance: PatientInsurance[];
  primaryCareProvider: string | null;
  allergies: Allergy[];
  immunizations: Immunization[];
  familyHistory: FamilyHistory[];
  socialHistory: SocialHistory | null;
  advanceDirectives: AdvanceDirective[];
  documents: PatientDocument[];
  photo: string | null;
  status: PatientStatus;
  deceased: boolean;
  deceasedDate: Date | null;
  portalAccess: boolean;
  portalActivatedAt: Date | null;
  preferredPharmacy: string | null;
  tags: string[];
  notes: string | null;
}

export enum PatientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DECEASED = "DECEASED",
  MERGED = "MERGED",
  TEST = "TEST",
}

export interface EmergencyContact extends BaseEntity {
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: Address | null;
  isPrimary: boolean;
  canMakeDecisions: boolean;
  notes: string | null;
}

export interface PatientInsurance extends BaseEntity {
  patientId: string;
  priority: InsurancePriority;
  payer: InsurancePayer;
  payerName: string;
  payerId: string;
  planName: string;
  policyNumber: string;
  groupNumber: string | null;
  subscriberId: string;
  subscriberName: string;
  subscriberRelationship: string;
  subscriberDateOfBirth: Date | null;
  effectiveDate: Date;
  terminationDate: Date | null;
  copay: number | null;
  deductible: number | null;
  outOfPocketMax: number | null;
  eligibilityVerified: boolean;
  lastVerificationDate: Date | null;
  verificationResponse: Record<string, any> | null;
  status: InsuranceStatus;
  cardFrontImage: string | null;
  cardBackImage: string | null;
}

export enum InsurancePriority {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  TERTIARY = "TERTIARY",
}

export enum InsuranceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
}

export enum InsurancePayer {
  MEDICARE = "MEDICARE",
  MEDICAID = "MEDICAID",
  BLUE_CROSS_BLUE_SHIELD = "BLUE_CROSS_BLUE_SHIELD",
  UNITED_HEALTHCARE = "UNITED_HEALTHCARE",
  AETNA = "AETNA",
  CIGNA = "CIGNA",
  HUMANA = "HUMANA",
  ANTHEM = "ANTHEM",
  KAISER = "KAISER",
  TRICARE = "TRICARE",
  SELF_PAY = "SELF_PAY",
  OTHER = "OTHER",
}

export interface Allergy extends BaseEntity {
  patientId: string;
  allergen: string;
  allergenType: AllergenType;
  reaction: string;
  severity: AllergySeverity;
  onsetDate: Date | null;
  status: AllergyStatus;
  notes: string | null;
  recordedBy: string;
  recordedDate: Date;
}

export enum AllergenType {
  MEDICATION = "MEDICATION",
  FOOD = "FOOD",
  ENVIRONMENTAL = "ENVIRONMENTAL",
  OTHER = "OTHER",
}

export enum AllergySeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  LIFE_THREATENING = "LIFE_THREATENING",
}

export enum AllergyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  RESOLVED = "RESOLVED",
}

export interface Immunization extends BaseEntity {
  patientId: string;
  vaccine: string;
  vaccineCode: string;
  cvxCode: string | null;
  dose: number;
  route: string;
  site: string | null;
  administeredDate: Date;
  administeredBy: string;
  manufacturer: string | null;
  lotNumber: string | null;
  expirationDate: Date | null;
  reaction: string | null;
  notes: string | null;
  visGiven: boolean;
  consentSigned: boolean;
}

export interface FamilyHistory extends BaseEntity {
  patientId: string;
  relationship: string;
  condition: string;
  icdCode: string | null;
  ageAtOnset: number | null;
  deceased: boolean;
  ageAtDeath: number | null;
  causeOfDeath: string | null;
  notes: string | null;
}

export interface SocialHistory extends BaseEntity {
  patientId: string;
  smokingStatus: SmokingStatus;
  smokingPackYears: number | null;
  smokingQuitDate: Date | null;
  alcoholUse: AlcoholUse;
  alcoholDrinksPerWeek: number | null;
  substanceUse: SubstanceUse | null;
  occupation: string | null;
  education: EducationLevel | null;
  livingArrangement: LivingArrangement | null;
  exerciseFrequency: ExerciseFrequency | null;
  dietType: string | null;
  sexuallyActive: boolean | null;
  sexualOrientation: string | null;
  notes: string | null;
}

export enum SmokingStatus {
  NEVER_SMOKER = "NEVER_SMOKER",
  CURRENT_SMOKER = "CURRENT_SMOKER",
  FORMER_SMOKER = "FORMER_SMOKER",
  UNKNOWN = "UNKNOWN",
}

export enum AlcoholUse {
  NONE = "NONE",
  OCCASIONAL = "OCCASIONAL",
  MODERATE = "MODERATE",
  HEAVY = "HEAVY",
  UNKNOWN = "UNKNOWN",
}

export enum SubstanceUse {
  NONE = "NONE",
  PAST = "PAST",
  CURRENT = "CURRENT",
  UNKNOWN = "UNKNOWN",
}

export enum EducationLevel {
  LESS_THAN_HIGH_SCHOOL = "LESS_THAN_HIGH_SCHOOL",
  HIGH_SCHOOL = "HIGH_SCHOOL",
  SOME_COLLEGE = "SOME_COLLEGE",
  ASSOCIATES = "ASSOCIATES",
  BACHELORS = "BACHELORS",
  MASTERS = "MASTERS",
  DOCTORATE = "DOCTORATE",
  UNKNOWN = "UNKNOWN",
}

export enum LivingArrangement {
  ALONE = "ALONE",
  WITH_FAMILY = "WITH_FAMILY",
  WITH_OTHERS = "WITH_OTHERS",
  ASSISTED_LIVING = "ASSISTED_LIVING",
  NURSING_HOME = "NURSING_HOME",
  HOMELESS = "HOMELESS",
  UNKNOWN = "UNKNOWN",
}

export enum ExerciseFrequency {
  NONE = "NONE",
  LESS_THAN_ONCE_WEEK = "LESS_THAN_ONCE_WEEK",
  ONE_TWO_TIMES_WEEK = "ONE_TWO_TIMES_WEEK",
  THREE_FOUR_TIMES_WEEK = "THREE_FOUR_TIMES_WEEK",
  FIVE_PLUS_TIMES_WEEK = "FIVE_PLUS_TIMES_WEEK",
  UNKNOWN = "UNKNOWN",
}

export interface AdvanceDirective extends BaseEntity {
  patientId: string;
  type: AdvanceDirectiveType;
  documentUrl: string;
  effectiveDate: Date;
  expirationDate: Date | null;
  witness1: string | null;
  witness2: string | null;
  notaryPublic: string | null;
  notes: string | null;
}

export enum AdvanceDirectiveType {
  LIVING_WILL = "LIVING_WILL",
  DNR = "DNR",
  DNI = "DNI",
  HEALTHCARE_PROXY = "HEALTHCARE_PROXY",
  POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY",
  ORGAN_DONATION = "ORGAN_DONATION",
  POLST = "POLST",
}

export interface PatientDocument extends BaseEntity {
  patientId: string;
  title: string;
  type: DocumentType;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description: string | null;
  tags: string[];
  isConfidential: boolean;
  sharedWith: string[];
}

export enum DocumentType {
  MEDICAL_RECORD = "MEDICAL_RECORD",
  LAB_RESULT = "LAB_RESULT",
  IMAGING_REPORT = "IMAGING_REPORT",
  CONSENT_FORM = "CONSENT_FORM",
  INSURANCE_CARD = "INSURANCE_CARD",
  ID_DOCUMENT = "ID_DOCUMENT",
  REFERRAL = "REFERRAL",
  ADVANCE_DIRECTIVE = "ADVANCE_DIRECTIVE",
  OTHER = "OTHER",
}

// ============================================================================
// Patient Portal Types
// ============================================================================

export interface PatientPortalUser extends BaseEntity {
  patientId: string;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  lastLogin: Date | null;
  status: PortalUserStatus;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  preferences: PortalPreferences;
  dependents: string[];
  proxyFor: string[];
}

export enum PortalUserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  LOCKED = "LOCKED",
  PENDING_ACTIVATION = "PENDING_ACTIVATION",
}

export interface PortalPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  labResultNotifications: boolean;
  billNotifications: boolean;
  messageNotifications: boolean;
}

// ============================================================================
// Patient Search & Matching
// ============================================================================

export interface PatientSearchCriteria {
  query?: string;
  mrn?: string;
  ssn?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  phone?: string;
  email?: string;
  organizationId: string;
  includeInactive?: boolean;
  includeDeceased?: boolean;
}

export interface PatientMatch {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreatePatientDto {
  organizationId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  prefix?: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender: Gender;
  ssn?: string;
  race?: Race;
  ethnicity?: Ethnicity;
  maritalStatus?: MaritalStatus;
  bloodType?: BloodType;
  address: Address;
  phone: string;
  email?: string;
  preferredLanguage: string;
  emergencyContacts?: Omit<EmergencyContact, keyof BaseEntity>[];
  portalAccess?: boolean;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  id: string;
}

export interface PatientSummary {
  id: string;
  mrn: string;
  name: Name;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  email: string | null;
  photo: string | null;
  status: PatientStatus;
  lastVisit: Date | null;
  primaryCareProvider: string | null;
}
