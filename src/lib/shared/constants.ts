/**
 * Lithic Healthcare Platform v0.5 - Shared Constants
 * Coordination Hub - Agent 13
 *
 * This file contains all shared constants used across v0.5 modules
 */

// ============================================================================
// Application Constants
// ============================================================================

export const APP_NAME = "Lithic Healthcare Platform";
export const APP_VERSION = "0.5.0";
export const APP_DESCRIPTION = "Enterprise Healthcare SaaS Platform";

// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export const API_VERSION = "v1";
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Mobile Configuration
// ============================================================================

export const MOBILE_CONFIG = {
  SYNC_INTERVAL: 300000, // 5 minutes
  MAX_STORAGE_SIZE: 524288000, // 500 MB
  CACHE_DURATION: 86400000, // 24 hours
  OFFLINE_QUEUE_SIZE: 100,
  BIOMETRIC_TIMEOUT: 30000, // 30 seconds
} as const;

export const MOBILE_PLATFORMS = {
  IOS: "IOS",
  ANDROID: "ANDROID",
  WEB: "WEB",
} as const;

// ============================================================================
// Notification Configuration
// ============================================================================

export const NOTIFICATION_CONFIG = {
  MAX_TITLE_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 500,
  DEFAULT_EXPIRY_DAYS: 30,
  BATCH_SIZE: 100,
  RATE_LIMIT_PER_MINUTE: 60,
  RETRY_ATTEMPTS: 3,
} as const;

export const NOTIFICATION_CHANNELS = {
  IN_APP: "IN_APP",
  PUSH: "PUSH",
  EMAIL: "EMAIL",
  SMS: "SMS",
  VOICE: "VOICE",
  WEBHOOK: "WEBHOOK",
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
  CRITICAL: "CRITICAL",
} as const;

// ============================================================================
// AI Configuration
// ============================================================================

export const AI_CONFIG = {
  MAX_TOKENS: 4000,
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_TOP_P: 1.0,
  MAX_RETRIES: 2,
  TIMEOUT: 60000, // 60 seconds
  CONFIDENCE_THRESHOLD: 0.7,
} as const;

export const AI_PROVIDERS = {
  OPENAI: "OPENAI",
  ANTHROPIC: "ANTHROPIC",
  GOOGLE: "GOOGLE",
  AZURE: "AZURE",
  AWS: "AWS",
  CUSTOM: "CUSTOM",
} as const;

export const AI_MODEL_TYPES = {
  NLP: "NLP",
  DIAGNOSTIC: "DIAGNOSTIC",
  PREDICTIVE: "PREDICTIVE",
  RECOMMENDATION: "RECOMMENDATION",
  IMAGE_ANALYSIS: "IMAGE_ANALYSIS",
  VOICE_RECOGNITION: "VOICE_RECOGNITION",
  CLINICAL_CODING: "CLINICAL_CODING",
  RISK_ASSESSMENT: "RISK_ASSESSMENT",
} as const;

// ============================================================================
// Voice Configuration
// ============================================================================

export const VOICE_CONFIG = {
  MAX_RECORDING_DURATION: 600000, // 10 minutes
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  ENCODING: "LINEAR16",
  LANGUAGE: "en-US",
  CONFIDENCE_THRESHOLD: 0.8,
  PUNCTUATION_MODE: "AUTOMATIC",
} as const;

export const VOICE_COMMANDS = {
  NAVIGATE: "NAVIGATE",
  CREATE_NOTE: "CREATE_NOTE",
  SEARCH_PATIENT: "SEARCH_PATIENT",
  ORDER_LAB: "ORDER_LAB",
  PRESCRIBE_MEDICATION: "PRESCRIBE_MEDICATION",
  SCHEDULE_APPOINTMENT: "SCHEDULE_APPOINTMENT",
  SIGN_DOCUMENT: "SIGN_DOCUMENT",
  SEND_MESSAGE: "SEND_MESSAGE",
  SET_REMINDER: "SET_REMINDER",
} as const;

// ============================================================================
// RPM Configuration
// ============================================================================

export const RPM_CONFIG = {
  READING_TIMEOUT: 300000, // 5 minutes
  SYNC_INTERVAL: 900000, // 15 minutes
  ALERT_DEBOUNCE: 300000, // 5 minutes
  BATTERY_LOW_THRESHOLD: 20,
  DATA_RETENTION_DAYS: 730, // 2 years
} as const;

export const RPM_DEVICE_TYPES = {
  BLOOD_PRESSURE_MONITOR: "BLOOD_PRESSURE_MONITOR",
  GLUCOMETER: "GLUCOMETER",
  PULSE_OXIMETER: "PULSE_OXIMETER",
  WEIGHT_SCALE: "WEIGHT_SCALE",
  THERMOMETER: "THERMOMETER",
  ECG_MONITOR: "ECG_MONITOR",
  SPIROMETER: "SPIROMETER",
  CONTINUOUS_GLUCOSE_MONITOR: "CONTINUOUS_GLUCOSE_MONITOR",
  ACTIVITY_TRACKER: "ACTIVITY_TRACKER",
  SMART_WATCH: "SMART_WATCH",
} as const;

export const RPM_READING_TYPES = {
  BLOOD_PRESSURE: "BLOOD_PRESSURE",
  HEART_RATE: "HEART_RATE",
  BLOOD_GLUCOSE: "BLOOD_GLUCOSE",
  OXYGEN_SATURATION: "OXYGEN_SATURATION",
  WEIGHT: "WEIGHT",
  TEMPERATURE: "TEMPERATURE",
  RESPIRATORY_RATE: "RESPIRATORY_RATE",
  ECG: "ECG",
  STEPS: "STEPS",
  SLEEP: "SLEEP",
  ACTIVITY: "ACTIVITY",
} as const;

// ============================================================================
// SDOH Configuration
// ============================================================================

export const SDOH_CONFIG = {
  ASSESSMENT_VALIDITY_DAYS: 180, // 6 months
  MAX_RESOURCES_DISTANCE: 50, // miles
  AUTO_REFRESH_RESOURCES: true,
} as const;

export const SDOH_DOMAINS = {
  FOOD_INSECURITY: "FOOD_INSECURITY",
  HOUSING_INSTABILITY: "HOUSING_INSTABILITY",
  TRANSPORTATION: "TRANSPORTATION",
  UTILITIES: "UTILITIES",
  SAFETY: "SAFETY",
  FINANCIAL_STRAIN: "FINANCIAL_STRAIN",
  SOCIAL_ISOLATION: "SOCIAL_ISOLATION",
  EDUCATION: "EDUCATION",
  EMPLOYMENT: "EMPLOYMENT",
  LEGAL: "LEGAL",
} as const;

export const RISK_LEVELS = {
  NONE: "NONE",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  SEVERE: "SEVERE",
} as const;

// ============================================================================
// Research Configuration
// ============================================================================

export const RESEARCH_CONFIG = {
  CONSENT_VALIDITY_YEARS: 5,
  VISIT_WINDOW_DAYS: 7,
  MAX_PROTOCOL_DEVIATIONS: 3,
  AE_REPORTING_HOURS: 24,
  SAE_REPORTING_HOURS: 24,
} as const;

export const TRIAL_PHASES = {
  PHASE_0: "PHASE_0",
  PHASE_1: "PHASE_1",
  PHASE_2: "PHASE_2",
  PHASE_3: "PHASE_3",
  PHASE_4: "PHASE_4",
} as const;

// ============================================================================
// Engagement Configuration
// ============================================================================

export const ENGAGEMENT_CONFIG = {
  POINTS_PER_APPOINTMENT: 100,
  POINTS_PER_SURVEY: 50,
  POINTS_PER_EDUCATION: 75,
  POINTS_PER_MEASUREMENT: 25,
  STREAK_BONUS_DAYS: 7,
  STREAK_BONUS_POINTS: 200,
  LEVEL_UP_THRESHOLD: 1000,
} as const;

export const PROGRAM_TYPES = {
  WELLNESS: "WELLNESS",
  CHRONIC_DISEASE: "CHRONIC_DISEASE",
  PREVENTIVE_CARE: "PREVENTIVE_CARE",
  MEDICATION_ADHERENCE: "MEDICATION_ADHERENCE",
  LIFESTYLE: "LIFESTYLE",
  MATERNITY: "MATERNITY",
  PEDIATRIC: "PEDIATRIC",
} as const;

// ============================================================================
// Document Management Configuration
// ============================================================================

export const DOCUMENT_CONFIG = {
  MAX_FILE_SIZE: 104857600, // 100 MB
  MAX_BATCH_UPLOAD: 10,
  THUMBNAIL_SIZE: 200,
  PREVIEW_PAGES: 5,
  VERSION_LIMIT: 50,
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
} as const;

export const DOCUMENT_TYPES = {
  MEDICAL_RECORD: "MEDICAL_RECORD",
  LAB_REPORT: "LAB_REPORT",
  IMAGING: "IMAGING",
  CONSENT: "CONSENT",
  INSURANCE: "INSURANCE",
  PRESCRIPTION: "PRESCRIPTION",
  REFERRAL: "REFERRAL",
  ADMINISTRATIVE: "ADMINISTRATIVE",
  LEGAL: "LEGAL",
  FINANCIAL: "FINANCIAL",
  CORRESPONDENCE: "CORRESPONDENCE",
  OTHER: "OTHER",
} as const;

export const RETENTION_POLICIES = {
  MEDICAL_RECORDS: 365 * 7, // 7 years
  FINANCIAL_RECORDS: 365 * 7, // 7 years
  ADMINISTRATIVE: 365 * 3, // 3 years
  LEGAL: 365 * 10, // 10 years
  IMAGING: 365 * 7, // 7 years
  DEFAULT: 365 * 5, // 5 years
} as const;

// ============================================================================
// E-Signature Configuration
// ============================================================================

export const ESIGNATURE_CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY: 600000, // 10 minutes
  SIGNATURE_TIMEOUT: 86400000, // 24 hours
  MAX_SIGNERS: 10,
  CERTIFICATE_VALIDITY_DAYS: 365,
} as const;

export const SIGNATURE_TYPES = {
  DRAWN: "DRAWN",
  TYPED: "TYPED",
  UPLOADED: "UPLOADED",
  DIGITAL_CERTIFICATE: "DIGITAL_CERTIFICATE",
  BIOMETRIC: "BIOMETRIC",
} as const;

export const SIGNATURE_METHODS = {
  CLICK_TO_SIGN: "CLICK_TO_SIGN",
  DRAW: "DRAW",
  UPLOAD: "UPLOAD",
  SMS_OTP: "SMS_OTP",
  EMAIL_OTP: "EMAIL_OTP",
  DIGITAL_ID: "DIGITAL_ID",
  BIOMETRIC: "BIOMETRIC",
} as const;

// ============================================================================
// Internationalization Configuration
// ============================================================================

export const I18N_CONFIG = {
  DEFAULT_LOCALE: "en-US",
  FALLBACK_LOCALE: "en",
  SUPPORTED_LOCALES: [
    "en-US",
    "es-ES",
    "es-MX",
    "fr-FR",
    "de-DE",
    "it-IT",
    "pt-BR",
    "zh-CN",
    "ja-JP",
    "ar-SA",
  ],
  CACHE_DURATION: 3600000, // 1 hour
  AUTO_DETECT: true,
} as const;

export const TEXT_DIRECTIONS = {
  LTR: "LTR",
  RTL: "RTL",
} as const;

export const RTL_LOCALES = ["ar-SA", "he-IL", "fa-IR"];

// ============================================================================
// Date & Time Formats
// ============================================================================

export const DATE_FORMATS = {
  SHORT: "MM/DD/YYYY",
  LONG: "MMMM DD, YYYY",
  FULL: "dddd, MMMM DD, YYYY",
  ISO: "YYYY-MM-DD",
  TIME_12H: "h:mm A",
  TIME_24H: "HH:mm",
  DATETIME_SHORT: "MM/DD/YYYY h:mm A",
  DATETIME_LONG: "MMMM DD, YYYY h:mm A",
} as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
] as const;

// ============================================================================
// Pagination & Limits
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const LIMITS = {
  MAX_BATCH_SIZE: 1000,
  MAX_SEARCH_RESULTS: 500,
  MAX_EXPORT_RECORDS: 10000,
  MAX_CONCURRENT_REQUESTS: 5,
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

export const CACHE_KEYS = {
  USER_PROFILE: "user:profile",
  USER_PERMISSIONS: "user:permissions",
  ORGANIZATION_SETTINGS: "org:settings",
  NOTIFICATION_PREFERENCES: "user:notifications",
  MOBILE_CONFIG: "mobile:config",
  AI_MODELS: "ai:models",
  RPM_THRESHOLDS: "rpm:thresholds",
  SDOH_RESOURCES: "sdoh:resources",
  TRANSLATIONS: "i18n:translations",
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// ============================================================================
// WebSocket Events
// ============================================================================

export const WS_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Notifications
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DELETED: "notification:deleted",

  // Mobile Sync
  SYNC_START: "sync:start",
  SYNC_PROGRESS: "sync:progress",
  SYNC_COMPLETE: "sync:complete",
  SYNC_ERROR: "sync:error",

  // RPM
  RPM_READING: "rpm:reading",
  RPM_ALERT: "rpm:alert",
  RPM_DEVICE_STATUS: "rpm:device:status",

  // AI
  AI_PROCESSING: "ai:processing",
  AI_COMPLETE: "ai:complete",
  AI_INSIGHT: "ai:insight",

  // Voice
  VOICE_TRANSCRIPTION: "voice:transcription",
  VOICE_COMMAND: "voice:command",

  // Documents
  DOCUMENT_UPLOADED: "document:uploaded",
  DOCUMENT_SIGNED: "document:signed",
  DOCUMENT_SHARED: "document:shared",

  // Engagement
  ENGAGEMENT_MILESTONE: "engagement:milestone",
  ENGAGEMENT_REWARD: "engagement:reward",
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS",
  AUTH_MFA_REQUIRED: "AUTH_MFA_REQUIRED",

  // Validation
  VALIDATION_FAILED: "VALIDATION_FAILED",
  VALIDATION_REQUIRED_FIELD: "VALIDATION_REQUIRED_FIELD",
  VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT",

  // Resource
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",

  // Mobile
  MOBILE_SYNC_FAILED: "MOBILE_SYNC_FAILED",
  MOBILE_DEVICE_NOT_REGISTERED: "MOBILE_DEVICE_NOT_REGISTERED",
  MOBILE_OFFLINE_MODE_DISABLED: "MOBILE_OFFLINE_MODE_DISABLED",

  // Notification
  NOTIFICATION_SEND_FAILED: "NOTIFICATION_SEND_FAILED",
  NOTIFICATION_INVALID_CHANNEL: "NOTIFICATION_INVALID_CHANNEL",
  NOTIFICATION_RATE_LIMIT: "NOTIFICATION_RATE_LIMIT",

  // AI
  AI_MODEL_UNAVAILABLE: "AI_MODEL_UNAVAILABLE",
  AI_REQUEST_TIMEOUT: "AI_REQUEST_TIMEOUT",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",

  // Voice
  VOICE_RECOGNITION_FAILED: "VOICE_RECOGNITION_FAILED",
  VOICE_COMMAND_NOT_RECOGNIZED: "VOICE_COMMAND_NOT_RECOGNIZED",

  // RPM
  RPM_DEVICE_OFFLINE: "RPM_DEVICE_OFFLINE",
  RPM_READING_INVALID: "RPM_READING_INVALID",
  RPM_ALERT_FAILED: "RPM_ALERT_FAILED",

  // Document
  DOCUMENT_UPLOAD_FAILED: "DOCUMENT_UPLOAD_FAILED",
  DOCUMENT_SIZE_EXCEEDED: "DOCUMENT_SIZE_EXCEEDED",
  DOCUMENT_TYPE_NOT_ALLOWED: "DOCUMENT_TYPE_NOT_ALLOWED",

  // E-Signature
  SIGNATURE_EXPIRED: "SIGNATURE_EXPIRED",
  SIGNATURE_INVALID: "SIGNATURE_INVALID",
  SIGNATURE_DECLINED: "SIGNATURE_DECLINED",

  // General
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  MOBILE_APP: true,
  NOTIFICATION_HUB: true,
  AI_INTEGRATION: true,
  VOICE_COMMANDS: true,
  RPM: true,
  SDOH_SCREENING: true,
  CLINICAL_RESEARCH: true,
  PATIENT_ENGAGEMENT: true,
  DOCUMENT_MANAGEMENT: true,
  E_SIGNATURE: true,
  INTERNATIONALIZATION: true,
  OFFLINE_MODE: true,
  BIOMETRIC_AUTH: true,
  VOICE_TRANSCRIPTION: true,
  AI_ASSISTANT: true,
} as const;

// ============================================================================
// Module Identifiers
// ============================================================================

export const MODULES = {
  MOBILE: "mobile",
  NOTIFICATIONS: "notifications",
  AI: "ai",
  VOICE: "voice",
  RPM: "rpm",
  SDOH: "sdoh",
  RESEARCH: "research",
  ENGAGEMENT: "engagement",
  DOCUMENTS: "documents",
  ESIGNATURE: "esignature",
  I18N: "i18n",
  CLINICAL: "clinical",
  BILLING: "billing",
  SCHEDULING: "scheduling",
  ANALYTICS: "analytics",
} as const;

// ============================================================================
// Integration Points
// ============================================================================

export const INTEGRATION_POINTS = {
  MOBILE_TO_NOTIFICATIONS: "mobile → notifications",
  AI_TO_CLINICAL: "ai → clinical",
  AI_TO_VOICE: "ai → voice",
  VOICE_TO_CLINICAL: "voice → clinical",
  RPM_TO_ENGAGEMENT: "rpm → engagement",
  RPM_TO_NOTIFICATIONS: "rpm → notifications",
  SDOH_TO_PATIENT: "sdoh → patient",
  RESEARCH_TO_CLINICAL: "research → clinical",
  DOCUMENTS_TO_ESIGNATURE: "documents → e-signature",
  I18N_TO_ALL: "i18n → all modules",
  ENGAGEMENT_TO_NOTIFICATIONS: "engagement → notifications",
} as const;

// ============================================================================
// Priority Levels
// ============================================================================

export const PRIORITIES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5,
} as const;

// ============================================================================
// Compliance Standards
// ============================================================================

export const COMPLIANCE = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  SOC2: "SOC2",
  ISO27001: "ISO27001",
  HITRUST: "HITRUST",
  FDA_21CFR11: "FDA_21CFR11",
} as const;

// ============================================================================
// Export All Constants
// ============================================================================

export default {
  APP_NAME,
  APP_VERSION,
  API_BASE_URL,
  MOBILE_CONFIG,
  NOTIFICATION_CONFIG,
  AI_CONFIG,
  VOICE_CONFIG,
  RPM_CONFIG,
  SDOH_CONFIG,
  RESEARCH_CONFIG,
  ENGAGEMENT_CONFIG,
  DOCUMENT_CONFIG,
  ESIGNATURE_CONFIG,
  I18N_CONFIG,
  PAGINATION,
  CACHE_KEYS,
  WS_EVENTS,
  ERROR_CODES,
  HTTP_STATUS,
  FEATURE_FLAGS,
  MODULES,
};
