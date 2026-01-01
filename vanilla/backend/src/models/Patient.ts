/**
 * Patient Model - HIPAA Compliant Patient Data Structure
 * Lithic Healthcare Platform
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
  effectiveDate: Date;
  expirationDate?: Date;
  isPrimary: boolean;
  verified: boolean;
  verifiedDate?: Date;
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
  uploadedAt: Date;
  encryptionStatus: "encrypted" | "not_encrypted";
}

export interface AuditLog {
  id: string;
  patientId: string;
  action: "created" | "updated" | "viewed" | "merged" | "deleted" | "exported";
  performedBy: string;
  performedAt: Date;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number

  // Demographics
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  ssn?: string; // Encrypted, optional

  // Contact Information
  address: Address;
  contact: ContactInfo;

  // Insurance
  insurance: Insurance[];

  // Clinical
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string[];
  medications?: string[];
  conditions?: string[];

  // Administrative
  status: "active" | "inactive" | "deceased" | "merged";
  preferredLanguage?: string;
  race?: string;
  ethnicity?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "other";

  // System
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  mergedInto?: string; // If patient was merged, points to the master record
  documents?: Document[];
  auditLog?: AuditLog[];
}

export interface PatientSearchParams {
  query?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  mrn?: string;
  ssn?: string;
  phone?: string;
  email?: string;
  status?: Patient["status"];
  limit?: number;
  offset?: number;
}

export interface PatientMergeRequest {
  sourceMrn: string;
  targetMrn: string;
  reason: string;
  performedBy: string;
}

export interface DuplicateMatch {
  patient: Patient;
  score: number;
  matchedFields: string[];
}
