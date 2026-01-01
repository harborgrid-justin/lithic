/**
 * Application Constants
 */

export const APP_NAME = 'Lithic';
export const APP_DESCRIPTION = 'Enterprise Healthcare SaaS Platform';
export const APP_VERSION = '1.0.0';

// Session Configuration
export const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes
export const SESSION_IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const SESSION_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
export const REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Password Policy
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_REQUIRE_UPPERCASE = true;
export const PASSWORD_REQUIRE_LOWERCASE = true;
export const PASSWORD_REQUIRE_NUMBERS = true;
export const PASSWORD_REQUIRE_SPECIAL = true;
export const PASSWORD_PREVENT_REUSE_COUNT = 5;
export const PASSWORD_EXPIRY_DAYS = 90;
export const PASSWORD_WARNING_DAYS = 14;
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Rate Limiting
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const RATE_LIMIT_AUTH_MAX_REQUESTS = 10;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DICOM_SIZE = 500 * 1024 * 1024; // 500MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Audit Logging
export const AUDIT_LOG_RETENTION_DAYS = 2555; // 7 years for HIPAA
export const ENABLE_AUDIT_LOGGING = true;

// HIPAA Compliance
export const PHI_ENCRYPTION_ENABLED = true;
export const AUDIT_TRAIL_ENABLED = true;
export const AUTO_LOGOFF_ENABLED = true;

// API Configuration
export const API_TIMEOUT = 30 * 1000; // 30 seconds
export const API_MAX_RETRIES = 3;

// Cache Configuration
export const CACHE_TTL_SHORT = 5 * 60; // 5 minutes
export const CACHE_TTL_MEDIUM = 30 * 60; // 30 minutes
export const CACHE_TTL_LONG = 60 * 60; // 1 hour
export const CACHE_TTL_DAY = 24 * 60 * 60; // 24 hours

// Date Formats
export const DATE_FORMAT = 'MM/dd/yyyy';
export const TIME_FORMAT = 'hh:mm a';
export const DATETIME_FORMAT = 'MM/dd/yyyy hh:mm a';

// Lab Configuration
export const LAB_CRITICAL_VALUE_NOTIFICATION_TIMEOUT = 60 * 1000; // 1 minute
export const LAB_RESULT_AUTO_VERIFY_DELAY = 24 * 60 * 60 * 1000; // 24 hours

// Appointment Configuration
export const APPOINTMENT_DEFAULT_DURATION = 30; // minutes
export const APPOINTMENT_BUFFER_TIME = 15; // minutes
export const APPOINTMENT_REMINDER_TIMES = [24 * 60, 60]; // 24 hours, 1 hour (in minutes)

// Prescription Configuration
export const PRESCRIPTION_DEFAULT_REFILLS = 3;
export const PRESCRIPTION_MAX_REFILLS = 12;
export const CONTROLLED_SUBSTANCE_MAX_REFILLS = 5;

// Imaging Configuration
export const IMAGING_CRITICAL_FINDING_NOTIFICATION_TIMEOUT = 60 * 1000; // 1 minute
export const DICOM_STORAGE_PATH = '/var/lithic/dicom';

// Billing Configuration
export const CLAIM_SUBMISSION_TIMEOUT = 30 * 1000; // 30 seconds
export const INVOICE_DUE_DAYS = 30;
export const INVOICE_OVERDUE_WARNING_DAYS = [30, 60, 90, 120];

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  CONFLICT: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is locked due to multiple failed login attempts',
  SESSION_EXPIRED: 'Session has expired',
  MFA_REQUIRED: 'Multi-factor authentication required',
  INVALID_MFA_CODE: 'Invalid MFA code',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
};

// Feature Flags
export const FEATURES = {
  PATIENT_PORTAL: process.env.ENABLE_PATIENT_PORTAL === 'true',
  TELEMEDICINE: process.env.ENABLE_TELEMEDICINE === 'true',
  LAB_INTEGRATION: process.env.ENABLE_LAB_INTEGRATION === 'true',
  PHARMACY_INTEGRATION: process.env.ENABLE_PHARMACY_INTEGRATION === 'true',
  IMAGING_INTEGRATION: process.env.ENABLE_IMAGING_INTEGRATION === 'true',
};

// External Service Endpoints
export const EXTERNAL_SERVICES = {
  SURESCRIPTS: process.env.SURESCRIPTS_ENDPOINT || 'https://preproduction.surescripts.net',
  CLEARINGHOUSE: process.env.CLEARINGHOUSE_API_URL || 'https://api.clearinghouse.com',
  FHIR_SERVER: process.env.FHIR_SERVER_URL || 'https://fhir.lithic.health/r4',
};

// System Roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  PHYSICIAN: 'PHYSICIAN',
  NURSE: 'NURSE',
  NURSE_PRACTITIONER: 'NURSE_PRACTITIONER',
  PHYSICIAN_ASSISTANT: 'PHYSICIAN_ASSISTANT',
  MEDICAL_ASSISTANT: 'MEDICAL_ASSISTANT',
  FRONT_DESK: 'FRONT_DESK',
  BILLING_STAFF: 'BILLING_STAFF',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  PHARMACIST: 'PHARMACIST',
  RADIOLOGIST: 'RADIOLOGIST',
  RADIOLOGY_TECH: 'RADIOLOGY_TECH',
  PATIENT: 'PATIENT',
} as const;

// Permissions
export const PERMISSIONS = {
  // Patient permissions
  PATIENT_CREATE: 'patient:create',
  PATIENT_READ: 'patient:read',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_DELETE: 'patient:delete',
  
  // Clinical permissions
  CLINICAL_NOTE_CREATE: 'clinical_note:create',
  CLINICAL_NOTE_READ: 'clinical_note:read',
  CLINICAL_NOTE_UPDATE: 'clinical_note:update',
  CLINICAL_NOTE_SIGN: 'clinical_note:sign',
  CLINICAL_NOTE_COSIGN: 'clinical_note:cosign',
  
  // Prescription permissions
  PRESCRIPTION_CREATE: 'prescription:create',
  PRESCRIPTION_READ: 'prescription:read',
  PRESCRIPTION_UPDATE: 'prescription:update',
  PRESCRIPTION_DELETE: 'prescription:delete',
  PRESCRIPTION_PRESCRIBE: 'prescription:prescribe',
  CONTROLLED_SUBSTANCE_PRESCRIBE: 'controlled_substance:prescribe',
  
  // Lab permissions
  LAB_ORDER_CREATE: 'lab_order:create',
  LAB_ORDER_READ: 'lab_order:read',
  LAB_RESULT_ENTER: 'lab_result:enter',
  LAB_RESULT_VERIFY: 'lab_result:verify',
  
  // Imaging permissions
  IMAGING_ORDER_CREATE: 'imaging_order:create',
  IMAGING_ORDER_READ: 'imaging_order:read',
  IMAGING_REPORT_CREATE: 'imaging_report:create',
  IMAGING_REPORT_SIGN: 'imaging_report:sign',
  
  // Appointment permissions
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_READ: 'appointment:read',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_DELETE: 'appointment:delete',
  
  // Billing permissions
  BILLING_READ: 'billing:read',
  BILLING_CREATE: 'billing:create',
  BILLING_UPDATE: 'billing:update',
  CLAIM_SUBMIT: 'claim:submit',
  PAYMENT_PROCESS: 'payment:process',
  
  // Admin permissions
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_LOG_READ: 'audit_log:read',
} as const;
