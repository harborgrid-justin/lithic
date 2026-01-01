/**
 * Frontend Patient Types
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberId: string;
  relationship: "self" | "spouse" | "child" | "other";
  effectiveDate: Date | string;
  expirationDate?: Date | string;
  isPrimary: boolean;
  verified: boolean;
  verifiedDate?: Date | string;
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
}

export interface Document {
  id: string;
  patientId: string;
  type:
    | "consent"
    | "insurance_card"
    | "id"
    | "medical_records"
    | "lab_results"
    | "imaging"
    | "other";
  name: string;
  description?: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date | string;
  encryptionStatus: "encrypted" | "not_encrypted";
}

export interface AuditLog {
  id: string;
  patientId: string;
  action: "created" | "updated" | "viewed" | "merged" | "deleted" | "exported";
  performedBy: string;
  performedAt: Date | string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  ssn?: string;
  address: Address;
  contact: ContactInfo;
  insurance: Insurance[];
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  status: "active" | "inactive" | "deceased" | "merged";
  preferredLanguage?: string;
  race?: string;
  ethnicity?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "other";
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
  mergedInto?: string;
  documents?: Document[];
  auditLog?: AuditLog[];
}

export interface PatientSearchParams {
  query?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  mrn?: string;
  phone?: string;
  email?: string;
  status?: Patient["status"];
  limit?: number;
  offset?: number;
}

export interface DuplicateMatch {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  count?: number;
}
