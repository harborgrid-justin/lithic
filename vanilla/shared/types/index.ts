// Central export point for all shared types
// This allows easy imports: import { Patient, Appointment } from '@shared/types';

// Authentication & Authorization
export * from "./auth.js";

// Patient Management
export * from "./patient.js";

// Clinical Documentation
export * from "./clinical.js";

// Scheduling & Appointments
export * from "./scheduling.js";

// Billing & Claims
export * from "./billing.js";

// Laboratory
export * from "./laboratory.js";

// Pharmacy & Medications
export * from "./pharmacy.js";

// Imaging & Radiology
export * from "./imaging.js";

// Analytics & Reporting
export * from "./analytics.js";

// Common Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Common Search Params
export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
  startDate?: string;
  endDate?: string;
}

// Audit Trail
export interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Common Status Type
export type Status = "ACTIVE" | "INACTIVE" | "PENDING" | "DELETED";

// Common Date Range
export interface DateRange {
  startDate: string;
  endDate: string;
}

// File Upload
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Address
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

// Contact Info
export interface ContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
}

// Name
export interface PersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  prefix?: string;
}
