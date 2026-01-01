// Patient Management Types

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  UNKNOWN = "UNKNOWN",
}

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  DIVORCED = "DIVORCED",
  WIDOWED = "WIDOWED",
  SEPARATED = "SEPARATED",
}

export enum InsurancePlanType {
  HMO = "HMO",
  PPO = "PPO",
  EPO = "EPO",
  POS = "POS",
  MEDICARE = "MEDICARE",
  MEDICAID = "MEDICAID",
  TRICARE = "TRICARE",
  COMMERCIAL = "COMMERCIAL",
  SELF_PAY = "SELF_PAY",
}

export enum InsuranceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  EXPIRED = "EXPIRED",
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  ssn?: string; // Encrypted in database
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  primaryInsuranceId?: string;
  secondaryInsuranceId?: string;
  bloodType?: string;
  allergies: string[];
  language: string;
  maritalStatus?: MaritalStatus;
  portalEnabled: boolean;
  portalUserId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface Insurance {
  id: string;
  payerName: string;
  payerId: string;
  planName: string;
  planType: InsurancePlanType;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberName: string;
  subscriberDob: string;
  relationToPatient: string;
  effectiveDate: string;
  expirationDate?: string;
  copay?: number;
  deductible?: number;
  outOfPocketMax?: number;
  status: InsuranceStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PatientSearchFilters {
  query?: string; // Search by name, MRN
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
  insuranceType?: InsurancePlanType;
  hasActiveInsurance?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface PatientCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  ssn?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodType?: string;
  allergies?: string[];
  language?: string;
  maritalStatus?: MaritalStatus;
}

export interface PatientUpdateRequest extends Partial<PatientCreateRequest> {
  portalEnabled?: boolean;
}

export interface InsuranceCreateRequest {
  payerName: string;
  payerId: string;
  planName: string;
  planType: InsurancePlanType;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberName: string;
  subscriberDob: string;
  relationToPatient: string;
  effectiveDate: string;
  expirationDate?: string;
  copay?: number;
  deductible?: number;
  outOfPocketMax?: number;
}

export interface InsuranceVerificationRequest {
  insuranceId: string;
  patientId: string;
  serviceDate: string;
}

export interface InsuranceVerificationResponse {
  verified: boolean;
  coverage: {
    active: boolean;
    effectiveDate: string;
    expirationDate?: string;
    copay?: number;
    deductible?: number;
    deductibleMet?: number;
    outOfPocketMax?: number;
    outOfPocketMet?: number;
  };
  messages: string[];
}

export interface PatientListResponse {
  data: Patient[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
