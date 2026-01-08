/**
 * Lithic Healthcare Platform v0.5 - Shared Validators
 * Coordination Hub - Agent 13
 *
 * This file contains Zod validation schemas used across all v0.5 modules
 */

import { z } from "zod";

// ============================================================================
// Common Field Validators
// ============================================================================

export const emailSchema = z.string().email("Invalid email address");

export const phoneSchema = z
  .string()
  .regex(/^[\d\s()+-]+$/, "Invalid phone number")
  .refine((val) => {
    const digits = val.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }, "Phone number must contain 10-15 digits");

export const urlSchema = z.string().url("Invalid URL");

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code");

export const ssnSchema = z
  .string()
  .regex(/^\d{9}$/, "SSN must be 9 digits")
  .transform((val) => val.replace(/\D/g, ""));

export const uuidSchema = z.string().uuid("Invalid UUID");

export const dateSchema = z.coerce.date();

export const isoDateSchema = z.string().datetime();

export const positiveNumberSchema = z.number().positive("Must be positive");

export const nonNegativeNumberSchema = z
  .number()
  .nonnegative("Must be non-negative");

// ============================================================================
// Mobile Application Validators
// ============================================================================

export const mobileDeviceSchema = z.object({
  deviceToken: z.string().min(1, "Device token is required"),
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  osVersion: z.string().min(1),
  appVersion: z.string().min(1),
  deviceModel: z.string().min(1),
  deviceName: z.string().min(1),
  pushEnabled: z.boolean().default(true),
  biometricEnabled: z.boolean().default(false),
});

export const mobileSyncRequestSchema = z.object({
  lastSyncTimestamp: z.coerce.date(),
  entities: z.array(z.string()),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const offlineActionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  payload: z.record(z.any()),
  timestamp: z.coerce.date(),
  retries: z.number().default(0),
});

// ============================================================================
// Notification Validators
// ============================================================================

export const notificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    "SYSTEM",
    "APPOINTMENT",
    "LAB_RESULT",
    "MEDICATION",
    "BILLING",
    "MESSAGE",
    "ALERT",
    "REMINDER",
    "TASK",
    "RPM",
    "RESEARCH",
    "CONSENT",
  ]),
  category: z.enum([
    "INFORMATIONAL",
    "ACTION_REQUIRED",
    "URGENT",
    "CRITICAL",
    "MARKETING",
    "EDUCATIONAL",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().url().optional().nullable(),
  channel: z
    .array(z.enum(["IN_APP", "PUSH", "EMAIL", "SMS", "VOICE", "WEBHOOK"]))
    .min(1),
  scheduledFor: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const notificationTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "SYSTEM",
    "APPOINTMENT",
    "LAB_RESULT",
    "MEDICATION",
    "BILLING",
    "MESSAGE",
    "ALERT",
    "REMINDER",
    "TASK",
    "RPM",
    "RESEARCH",
    "CONSENT",
  ]),
  subject: z.string().min(1),
  body: z.string().min(1),
  channels: z
    .array(z.enum(["IN_APP", "PUSH", "EMAIL", "SMS", "VOICE", "WEBHOOK"]))
    .min(1),
  variables: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["string", "number", "date", "boolean"]),
      required: z.boolean(),
      defaultValue: z.any().optional(),
    }),
  ),
});

export const notificationPreferenceSchema = z.object({
  channel: z.enum(["IN_APP", "PUSH", "EMAIL", "SMS", "VOICE", "WEBHOOK"]),
  type: z.enum([
    "SYSTEM",
    "APPOINTMENT",
    "LAB_RESULT",
    "MEDICATION",
    "BILLING",
    "MESSAGE",
    "ALERT",
    "REMINDER",
    "TASK",
    "RPM",
    "RESEARCH",
    "CONSENT",
  ]),
  enabled: z.boolean(),
  quietHours: z
    .object({
      enabled: z.boolean(),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: z.string(),
    })
    .optional()
    .nullable(),
});

// ============================================================================
// AI Integration Validators
// ============================================================================

export const aiRequestSchema = z.object({
  modelId: z.string().uuid(),
  type: z.enum([
    "CLINICAL_SUMMARY",
    "DIAGNOSIS_SUGGESTION",
    "TREATMENT_RECOMMENDATION",
    "DRUG_INTERACTION",
    "RISK_ASSESSMENT",
    "CLINICAL_CODING",
    "CHART_REVIEW",
    "PATIENT_TRIAGE",
    "VOICE_TRANSCRIPTION",
    "IMAGE_ANALYSIS",
  ]),
  input: z.any(),
  context: z.record(z.any()).optional(),
});

export const aiModelConfigSchema = z.object({
  maxTokens: z.number().positive().default(4000),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1.0),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  stopSequences: z.array(z.string()).default([]),
  timeout: z.number().positive().default(60000),
  retries: z.number().nonnegative().default(2),
});

// ============================================================================
// Voice Integration Validators
// ============================================================================

export const voiceSessionSchema = z.object({
  type: z.enum(["DICTATION", "COMMAND", "CONVERSATION", "TRANSCRIPTION"]),
  language: z.string().default("en-US"),
  metadata: z.record(z.any()).optional(),
});

export const voiceConfigurationSchema = z.object({
  enabled: z.boolean(),
  language: z.string(),
  dialect: z.string().optional().nullable(),
  speakerRecognition: z.boolean().default(false),
  punctuationMode: z.enum(["AUTOMATIC", "MANUAL", "NONE"]).default("AUTOMATIC"),
  profanityFilter: z.boolean().default(true),
  commandMode: z
    .enum(["ALWAYS_LISTENING", "PUSH_TO_TALK", "WAKE_WORD"])
    .default("PUSH_TO_TALK"),
  wakeWord: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).default(0.8),
});

// ============================================================================
// RPM Validators
// ============================================================================

export const rpmDeviceSchema = z.object({
  patientId: z.string().uuid(),
  type: z.enum([
    "BLOOD_PRESSURE_MONITOR",
    "GLUCOMETER",
    "PULSE_OXIMETER",
    "WEIGHT_SCALE",
    "THERMOMETER",
    "ECG_MONITOR",
    "SPIROMETER",
    "CONTINUOUS_GLUCOSE_MONITOR",
    "ACTIVITY_TRACKER",
    "SMART_WATCH",
  ]),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  firmwareVersion: z.string().optional(),
});

export const rpmReadingSchema = z.object({
  deviceId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.enum([
    "BLOOD_PRESSURE",
    "HEART_RATE",
    "BLOOD_GLUCOSE",
    "OXYGEN_SATURATION",
    "WEIGHT",
    "TEMPERATURE",
    "RESPIRATORY_RATE",
    "ECG",
    "STEPS",
    "SLEEP",
    "ACTIVITY",
  ]),
  value: z.any(),
  unit: z.string(),
  timestamp: z.coerce.date(),
  source: z.enum(["DEVICE", "MANUAL", "IMPORTED"]).default("DEVICE"),
  quality: z
    .enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "INVALID"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export const rpmProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  condition: z.string().min(1),
  duration: z.number().positive(),
  frequency: z.object({
    type: z.enum(["DAILY", "WEEKLY", "TWICE_DAILY", "AS_NEEDED"]),
    interval: z.number().positive(),
    times: z.array(z.string()),
  }),
  devices: z
    .array(
      z.enum([
        "BLOOD_PRESSURE_MONITOR",
        "GLUCOMETER",
        "PULSE_OXIMETER",
        "WEIGHT_SCALE",
        "THERMOMETER",
        "ECG_MONITOR",
        "SPIROMETER",
        "CONTINUOUS_GLUCOSE_MONITOR",
        "ACTIVITY_TRACKER",
        "SMART_WATCH",
      ]),
    )
    .min(1),
  thresholds: z.array(
    z.object({
      readingType: z.enum([
        "BLOOD_PRESSURE",
        "HEART_RATE",
        "BLOOD_GLUCOSE",
        "OXYGEN_SATURATION",
        "WEIGHT",
        "TEMPERATURE",
        "RESPIRATORY_RATE",
        "ECG",
        "STEPS",
        "SLEEP",
        "ACTIVITY",
      ]),
      min: z.number().optional().nullable(),
      max: z.number().optional().nullable(),
      criticalMin: z.number().optional().nullable(),
      criticalMax: z.number().optional().nullable(),
      unit: z.string(),
    }),
  ),
});

// ============================================================================
// SDOH Validators
// ============================================================================

export const sdohAssessmentSchema = z.object({
  patientId: z.string().uuid(),
  assessedBy: z.string().uuid(),
  assessmentDate: z.coerce.date(),
  domains: z.array(
    z.object({
      domain: z.enum([
        "FOOD_INSECURITY",
        "HOUSING_INSTABILITY",
        "TRANSPORTATION",
        "UTILITIES",
        "SAFETY",
        "FINANCIAL_STRAIN",
        "SOCIAL_ISOLATION",
        "EDUCATION",
        "EMPLOYMENT",
        "LEGAL",
      ]),
      questions: z.array(
        z.object({
          id: z.string(),
          question: z.string(),
          answer: z.any(),
          type: z.enum(["YES_NO", "SCALE", "MULTIPLE_CHOICE", "TEXT", "NUMERIC"]),
          weight: z.number(),
        }),
      ),
      score: z.number(),
      riskLevel: z.enum(["NONE", "LOW", "MODERATE", "HIGH", "SEVERE"]),
      needs: z.array(z.string()),
    }),
  ),
  followUpDate: z.coerce.date().optional().nullable(),
});

export const sdohResourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "FOOD_BANK",
    "HOUSING_ASSISTANCE",
    "TRANSPORTATION",
    "UTILITY_ASSISTANCE",
    "FINANCIAL_COUNSELING",
    "LEGAL_AID",
    "EMPLOYMENT_SERVICES",
    "EDUCATION",
    "MENTAL_HEALTH",
    "COMMUNITY_SUPPORT",
  ]),
  domains: z
    .array(
      z.enum([
        "FOOD_INSECURITY",
        "HOUSING_INSTABILITY",
        "TRANSPORTATION",
        "UTILITIES",
        "SAFETY",
        "FINANCIAL_STRAIN",
        "SOCIAL_ISOLATION",
        "EDUCATION",
        "EMPLOYMENT",
        "LEGAL",
      ]),
    )
    .min(1),
  description: z.string().min(1),
  contactInfo: z.object({
    phone: z.string(),
    email: z.string().email().optional().nullable(),
    website: urlSchema.optional().nullable(),
    hours: z.string(),
  }),
  location: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: zipCodeSchema,
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional()
      .nullable(),
  }),
});

// ============================================================================
// Research Validators
// ============================================================================

export const clinicalTrialSchema = z.object({
  nctNumber: z.string().regex(/^NCT\d{8}$/, "Invalid NCT number"),
  title: z.string().min(1),
  description: z.string().min(1),
  phase: z.enum([
    "PHASE_0",
    "PHASE_1",
    "PHASE_2",
    "PHASE_3",
    "PHASE_4",
  ]),
  status: z.enum([
    "PLANNING",
    "RECRUITING",
    "ACTIVE",
    "SUSPENDED",
    "COMPLETED",
    "TERMINATED",
  ]),
  principalInvestigator: z.string().min(1),
  sponsor: z.string().min(1),
  condition: z.array(z.string()).min(1),
  intervention: z.array(z.string()),
  enrollmentTarget: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
});

export const researchParticipantSchema = z.object({
  trialId: z.string().uuid(),
  patientId: z.string().uuid(),
  studyId: z.string().min(1),
  enrollmentDate: z.coerce.date(),
  consentDate: z.coerce.date(),
  consentVersion: z.string().min(1),
  cohort: z.string().optional().nullable(),
  arm: z.string().optional().nullable(),
});

export const adverseEventSchema = z.object({
  participantId: z.string().uuid(),
  term: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING", "FATAL"]),
  seriousness: z.enum(["NON_SERIOUS", "SERIOUS"]),
  relationship: z.enum([
    "UNRELATED",
    "UNLIKELY",
    "POSSIBLE",
    "PROBABLE",
    "DEFINITE",
  ]),
  onset: z.coerce.date(),
  resolution: z.coerce.date().optional().nullable(),
  outcome: z.enum([
    "RECOVERED",
    "RECOVERING",
    "NOT_RECOVERED",
    "RECOVERED_WITH_SEQUELAE",
    "FATAL",
    "UNKNOWN",
  ]),
});

// ============================================================================
// Engagement Validators
// ============================================================================

export const engagementProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "WELLNESS",
    "CHRONIC_DISEASE",
    "PREVENTIVE_CARE",
    "MEDICATION_ADHERENCE",
    "LIFESTYLE",
    "MATERNITY",
    "PEDIATRIC",
  ]),
  goals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      target: z.any(),
      metric: z.string(),
      timeframe: z.number().positive(),
    }),
  ),
  duration: z.number().positive(),
  isActive: z.boolean().default(true),
});

export const patientEngagementSchema = z.object({
  patientId: z.string().uuid(),
  programId: z.string().uuid(),
  enrolledAt: z.coerce.date().optional().default(() => new Date()),
});

// ============================================================================
// Document Management Validators
// ============================================================================

export const documentSchema = z.object({
  patientId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  type: z.enum([
    "MEDICAL_RECORD",
    "LAB_REPORT",
    "IMAGING",
    "CONSENT",
    "INSURANCE",
    "PRESCRIPTION",
    "REFERRAL",
    "ADMINISTRATIVE",
    "LEGAL",
    "FINANCIAL",
    "CORRESPONDENCE",
    "OTHER",
  ]),
  category: z.enum([
    "CLINICAL",
    "ADMINISTRATIVE",
    "FINANCIAL",
    "LEGAL",
    "PERSONAL",
  ]),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

export const documentShareSchema = z.object({
  documentId: z.string().uuid(),
  sharedWith: z.string().uuid().optional().nullable(),
  shareType: z.enum(["INTERNAL", "EXTERNAL", "PUBLIC_LINK"]),
  permissions: z
    .array(z.enum(["VIEW", "DOWNLOAD", "COMMENT", "EDIT"]))
    .min(1),
  expiresAt: z.coerce.date().optional().nullable(),
});

// ============================================================================
// E-Signature Validators
// ============================================================================

export const signatureRequestSchema = z.object({
  documentId: z.string().uuid(),
  signers: z
    .array(
      z.object({
        name: z.string().min(1),
        email: emailSchema,
        role: z.string().min(1),
        order: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(10),
  dueDate: z.coerce.date().optional().nullable(),
  message: z.string().optional().nullable(),
});

export const signatureSchema = z.object({
  documentId: z.string().uuid(),
  signerId: z.string().uuid(),
  signerName: z.string().min(1),
  signerEmail: emailSchema,
  signerRole: z.string().min(1),
  signatureType: z.enum([
    "DRAWN",
    "TYPED",
    "UPLOADED",
    "DIGITAL_CERTIFICATE",
    "BIOMETRIC",
  ]),
  signatureData: z.string().min(1),
  method: z.enum([
    "CLICK_TO_SIGN",
    "DRAW",
    "UPLOAD",
    "SMS_OTP",
    "EMAIL_OTP",
    "DIGITAL_ID",
    "BIOMETRIC",
  ]),
  location: z.string().optional().nullable(),
});

// ============================================================================
// i18n Validators
// ============================================================================

export const translationSchema = z.object({
  key: z.string().min(1),
  locale: z.string().min(2).max(10),
  value: z.string().min(1),
  context: z.string().optional().nullable(),
  pluralForms: z.record(z.string()).optional().nullable(),
  namespace: z.string().default("common"),
});

export const localeSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  direction: z.enum(["LTR", "RTL"]),
  dateFormat: z.string(),
  timeFormat: z.string(),
  currency: z.string().length(3),
  isActive: z.boolean().default(true),
});

// ============================================================================
// Common Validators
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const searchSchema = paginationSchema.extend({
  query: z.string().min(1),
  filters: z.record(z.any()).optional(),
});

export const idSchema = z.object({
  id: z.string().uuid(),
});

export const batchOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
  operation: z.string(),
  data: z.record(z.any()).optional(),
});

// ============================================================================
// Export Type Inferences
// ============================================================================

export type EmailInput = z.infer<typeof emailSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type MobileDeviceInput = z.infer<typeof mobileDeviceSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type AIRequestInput = z.infer<typeof aiRequestSchema>;
export type VoiceSessionInput = z.infer<typeof voiceSessionSchema>;
export type RPMDeviceInput = z.infer<typeof rpmDeviceSchema>;
export type RPMReadingInput = z.infer<typeof rpmReadingSchema>;
export type SDOHAssessmentInput = z.infer<typeof sdohAssessmentSchema>;
export type ClinicalTrialInput = z.infer<typeof clinicalTrialSchema>;
export type EngagementProgramInput = z.infer<typeof engagementProgramSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type SignatureRequestInput = z.infer<typeof signatureRequestSchema>;
export type TranslationInput = z.infer<typeof translationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
