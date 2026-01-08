/**
 * Voice Interface Types for Lithic Enterprise Healthcare Platform
 * Comprehensive voice recognition, command processing, and ambient documentation types
 */

// ============================================================================
// Core Voice Recognition Types
// ============================================================================

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  medicalVocabulary: boolean;
  noiseReduction: boolean;
  speakerAdaptation: boolean;
  punctuation: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: TranscriptAlternative[];
  timestamp: Date;
  duration: number;
}

export interface TranscriptAlternative {
  transcript: string;
  confidence: number;
  words?: WordTiming[];
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export enum VoiceRecognitionStatus {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  PROCESSING = "PROCESSING",
  ERROR = "ERROR",
  PAUSED = "PAUSED",
}

export interface VoiceRecognitionError {
  code: VoiceErrorCode;
  message: string;
  recoverable: boolean;
  details?: any;
}

export enum VoiceErrorCode {
  NO_SPEECH = "NO_SPEECH",
  ABORTED = "ABORTED",
  AUDIO_CAPTURE = "AUDIO_CAPTURE",
  NETWORK = "NETWORK",
  NOT_ALLOWED = "NOT_ALLOWED",
  SERVICE_NOT_ALLOWED = "SERVICE_NOT_ALLOWED",
  BAD_GRAMMAR = "BAD_GRAMMAR",
  LANGUAGE_NOT_SUPPORTED = "LANGUAGE_NOT_SUPPORTED",
  NO_MICROPHONE = "NO_MICROPHONE",
  PROCESSING_ERROR = "PROCESSING_ERROR",
}

// ============================================================================
// Voice Command Types
// ============================================================================

export interface VoiceCommand {
  id: string;
  command: string;
  pattern: string | RegExp;
  category: VoiceCommandCategory;
  action: string;
  parameters?: Record<string, any>;
  requiresConfirmation: boolean;
  description: string;
  examples: string[];
  permissions?: string[];
  context?: VoiceCommandContext[];
}

export enum VoiceCommandCategory {
  NAVIGATION = "NAVIGATION",
  DOCUMENTATION = "DOCUMENTATION",
  ORDER_ENTRY = "ORDER_ENTRY",
  PATIENT_SEARCH = "PATIENT_SEARCH",
  SCHEDULING = "SCHEDULING",
  BILLING = "BILLING",
  CLINICAL = "CLINICAL",
  SYSTEM = "SYSTEM",
  ACCESSIBILITY = "ACCESSIBILITY",
}

export enum VoiceCommandContext {
  PATIENT_CHART = "PATIENT_CHART",
  ENCOUNTER = "ENCOUNTER",
  ORDER_ENTRY = "ORDER_ENTRY",
  SCHEDULE = "SCHEDULE",
  DASHBOARD = "DASHBOARD",
  GLOBAL = "GLOBAL",
}

export interface VoiceCommandMatch {
  command: VoiceCommand;
  confidence: number;
  parameters: Record<string, any>;
  rawInput: string;
}

export interface VoiceCommandExecution {
  commandId: string;
  input: string;
  match: VoiceCommandMatch;
  result: VoiceCommandResult;
  timestamp: Date;
  userId: string;
  context: string;
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  requiresConfirmation?: boolean;
}

// ============================================================================
// Medical Vocabulary Types
// ============================================================================

export interface MedicalTerm {
  term: string;
  category: MedicalTermCategory;
  synonyms: string[];
  abbreviations: string[];
  pronunciation?: string;
  context?: string;
  icd10?: string;
  snomed?: string;
  loinc?: string;
}

export enum MedicalTermCategory {
  DIAGNOSIS = "DIAGNOSIS",
  PROCEDURE = "PROCEDURE",
  MEDICATION = "MEDICATION",
  ANATOMY = "ANATOMY",
  SYMPTOM = "SYMPTOM",
  LAB_TEST = "LAB_TEST",
  IMAGING = "IMAGING",
  VITAL_SIGN = "VITAL_SIGN",
  SPECIALTY = "SPECIALTY",
  ABBREVIATION = "ABBREVIATION",
}

export interface MedicalVocabularyConfig {
  specialties: string[];
  customTerms: MedicalTerm[];
  abbreviationExpansion: boolean;
  phonetic: boolean;
  contextAware: boolean;
}

// ============================================================================
// Dictation Types
// ============================================================================

export interface DictationSession {
  id: string;
  userId: string;
  patientId?: string;
  encounterId?: string;
  documentType: DictationDocumentType;
  status: DictationStatus;
  transcript: string;
  sections: DictationSection[];
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  wordCount: number;
  metadata: DictationMetadata;
}

export enum DictationDocumentType {
  PROGRESS_NOTE = "PROGRESS_NOTE",
  OPERATIVE_NOTE = "OPERATIVE_NOTE",
  DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY",
  CONSULTATION = "CONSULTATION",
  PROCEDURE_NOTE = "PROCEDURE_NOTE",
  HISTORY_PHYSICAL = "HISTORY_PHYSICAL",
  SOAP_NOTE = "SOAP_NOTE",
  RADIOLOGY_REPORT = "RADIOLOGY_REPORT",
  PATHOLOGY_REPORT = "PATHOLOGY_REPORT",
  LETTER = "LETTER",
  PRESCRIPTION = "PRESCRIPTION",
  ORDER = "ORDER",
}

export enum DictationStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  SAVED = "SAVED",
  SIGNED = "SIGNED",
  DISCARDED = "DISCARDED",
}

export interface DictationSection {
  id: string;
  type: DictationSectionType;
  title: string;
  content: string;
  order: number;
  timestamp: Date;
  autoGenerated: boolean;
}

export enum DictationSectionType {
  CHIEF_COMPLAINT = "CHIEF_COMPLAINT",
  HISTORY_PRESENT_ILLNESS = "HISTORY_PRESENT_ILLNESS",
  REVIEW_OF_SYSTEMS = "REVIEW_OF_SYSTEMS",
  PAST_MEDICAL_HISTORY = "PAST_MEDICAL_HISTORY",
  MEDICATIONS = "MEDICATIONS",
  ALLERGIES = "ALLERGIES",
  SOCIAL_HISTORY = "SOCIAL_HISTORY",
  FAMILY_HISTORY = "FAMILY_HISTORY",
  PHYSICAL_EXAM = "PHYSICAL_EXAM",
  ASSESSMENT = "ASSESSMENT",
  PLAN = "PLAN",
  SUBJECTIVE = "SUBJECTIVE",
  OBJECTIVE = "OBJECTIVE",
  IMPRESSION = "IMPRESSION",
  FINDINGS = "FINDINGS",
  TECHNIQUE = "TECHNIQUE",
  COMPARISON = "COMPARISON",
  RECOMMENDATION = "RECOMMENDATION",
  CUSTOM = "CUSTOM",
}

export interface DictationMetadata {
  providerId: string;
  providerName: string;
  specialty: string;
  facilityId: string;
  templateId?: string;
  audioUrl?: string;
  correctionCount: number;
  aiAssisted: boolean;
}

export interface DictationCommand {
  phrase: string;
  action: DictationAction;
  parameters?: string[];
}

export enum DictationAction {
  NEW_PARAGRAPH = "NEW_PARAGRAPH",
  NEW_LINE = "NEW_LINE",
  DELETE_WORD = "DELETE_WORD",
  DELETE_SENTENCE = "DELETE_SENTENCE",
  DELETE_PARAGRAPH = "DELETE_PARAGRAPH",
  UNDO = "UNDO",
  REDO = "REDO",
  INSERT_PERIOD = "INSERT_PERIOD",
  INSERT_COMMA = "INSERT_COMMA",
  INSERT_QUESTION_MARK = "INSERT_QUESTION_MARK",
  CAPITALIZE = "CAPITALIZE",
  ALL_CAPS = "ALL_CAPS",
  NO_CAPS = "NO_CAPS",
  SELECT_SECTION = "SELECT_SECTION",
  NAVIGATE_SECTION = "NAVIGATE_SECTION",
  INSERT_TEMPLATE = "INSERT_TEMPLATE",
  INSERT_MACRO = "INSERT_MACRO",
  CORRECT_LAST = "CORRECT_LAST",
  SCRATCH_THAT = "SCRATCH_THAT",
  PAUSE_DICTATION = "PAUSE_DICTATION",
  RESUME_DICTATION = "RESUME_DICTATION",
  SAVE_DICTATION = "SAVE_DICTATION",
  DISCARD_DICTATION = "DISCARD_DICTATION",
}

// ============================================================================
// Ambient Documentation Types
// ============================================================================

export interface AmbientSession {
  id: string;
  encounterId: string;
  patientId: string;
  providerId: string;
  status: AmbientStatus;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  rawTranscript: string;
  processedTranscript: string;
  speakerDiarization: SpeakerSegment[];
  clinicalNote: ClinicalNote;
  metadata: AmbientMetadata;
}

export enum AmbientStatus {
  RECORDING = "RECORDING",
  PROCESSING = "PROCESSING",
  READY_FOR_REVIEW = "READY_FOR_REVIEW",
  REVIEWED = "REVIEWED",
  SIGNED = "SIGNED",
  ERROR = "ERROR",
}

export interface SpeakerSegment {
  speaker: SpeakerRole;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

export enum SpeakerRole {
  PROVIDER = "PROVIDER",
  PATIENT = "PATIENT",
  FAMILY_MEMBER = "FAMILY_MEMBER",
  INTERPRETER = "INTERPRETER",
  UNKNOWN = "UNKNOWN",
}

export interface ClinicalNote {
  chiefComplaint?: string;
  historyPresentIllness?: string;
  reviewOfSystems?: ReviewOfSystems;
  physicalExam?: PhysicalExam;
  assessment?: Assessment[];
  plan?: Plan[];
  counseling?: string;
  timeSpentCounseling?: number;
  generatedAt: Date;
  confidence: number;
}

export interface ReviewOfSystems {
  constitutional?: string;
  eyes?: string;
  entHeadNeck?: string;
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  genitourinary?: string;
  musculoskeletal?: string;
  skin?: string;
  neurological?: string;
  psychiatric?: string;
  endocrine?: string;
  hematologicLymphatic?: string;
  allergicImmunologic?: string;
}

export interface PhysicalExam {
  general?: string;
  vitals?: VitalSigns;
  heent?: string;
  neck?: string;
  cardiovascular?: string;
  respiratory?: string;
  abdomen?: string;
  extremities?: string;
  neurological?: string;
  skin?: string;
  psychiatric?: string;
}

export interface VitalSigns {
  temperature?: number;
  temperatureUnit?: "F" | "C";
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  weightUnit?: "lbs" | "kg";
  height?: number;
  heightUnit?: "in" | "cm";
  bmi?: number;
}

export interface Assessment {
  diagnosis: string;
  icd10Code?: string;
  snomedCode?: string;
  severity?: string;
  status: "new" | "existing" | "resolved";
}

export interface Plan {
  category: PlanCategory;
  description: string;
  orders?: Order[];
  prescriptions?: Prescription[];
  referrals?: Referral[];
}

export enum PlanCategory {
  DIAGNOSTIC = "DIAGNOSTIC",
  THERAPEUTIC = "THERAPEUTIC",
  EDUCATIONAL = "EDUCATIONAL",
  PREVENTIVE = "PREVENTIVE",
  FOLLOW_UP = "FOLLOW_UP",
}

export interface Order {
  type: string;
  description: string;
  priority: "routine" | "urgent" | "stat";
  instructions?: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity?: string;
  refills?: number;
  instructions?: string;
}

export interface Referral {
  specialty: string;
  reason: string;
  priority: "routine" | "urgent";
  notes?: string;
}

export interface AmbientMetadata {
  audioUrl?: string;
  audioFormat?: string;
  audioQuality?: number;
  noiseLevel?: number;
  processingTime?: number;
  aiModel?: string;
  aiModelVersion?: string;
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================================================
// Voice Navigation Types
// ============================================================================

export interface VoiceNavigationConfig {
  enabled: boolean;
  shortcuts: VoiceNavigationShortcut[];
  contextAware: boolean;
  confirmNavigation: boolean;
}

export interface VoiceNavigationShortcut {
  id: string;
  phrases: string[];
  route: string;
  requiresPermission?: string;
  context?: string;
}

export interface VoiceNavigationResult {
  success: boolean;
  route: string;
  confirmed: boolean;
  timestamp: Date;
}

// ============================================================================
// Voice Authentication Types
// ============================================================================

export interface VoiceAuthConfig {
  enabled: boolean;
  enrollmentRequired: boolean;
  continuousVerification: boolean;
  threshold: number;
  fallbackToPassword: boolean;
}

export interface VoiceAuthProfile {
  userId: string;
  voicePrint: VoicePrint;
  enrollmentDate: Date;
  lastVerification?: Date;
  verificationCount: number;
  failedAttempts: number;
  status: VoiceAuthStatus;
}

export enum VoiceAuthStatus {
  ACTIVE = "ACTIVE",
  PENDING_ENROLLMENT = "PENDING_ENROLLMENT",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED",
}

export interface VoicePrint {
  id: string;
  features: number[];
  samples: number;
  quality: number;
  lastUpdated: Date;
}

export interface VoiceAuthResult {
  success: boolean;
  confidence: number;
  userId?: string;
  timestamp: Date;
  method: "enrollment" | "verification";
  error?: string;
}

// ============================================================================
// Text-to-Speech Types
// ============================================================================

export interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
  preferredVoices: {
    male?: string;
    female?: string;
    neutral?: string;
  };
}

export interface TTSRequest {
  text: string;
  config?: Partial<TTSConfig>;
  priority: TTSPriority;
  interruptible: boolean;
}

export enum TTSPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface TTSResult {
  success: boolean;
  duration: number;
  timestamp: Date;
  error?: string;
}

// ============================================================================
// Voice Analytics Types
// ============================================================================

export interface VoiceAnalytics {
  userId: string;
  sessionId: string;
  totalDictationTime: number;
  wordCount: number;
  commandsIssued: number;
  commandAccuracy: number;
  averageConfidence: number;
  errorsEncountered: number;
  correctionsMade: number;
  efficiency: number;
  timestamp: Date;
}

export interface VoiceUsageMetrics {
  organizationId: string;
  period: string;
  totalSessions: number;
  totalDuration: number;
  totalWords: number;
  uniqueUsers: number;
  featureUsage: {
    dictation: number;
    commands: number;
    ambient: number;
    navigation: number;
  };
  errorRate: number;
  satisfactionScore?: number;
}

// ============================================================================
// Voice Settings Types
// ============================================================================

export interface VoiceSettings {
  userId: string;
  recognition: VoiceRecognitionConfig;
  tts: TTSConfig;
  commands: {
    enabled: boolean;
    customCommands: VoiceCommand[];
  };
  dictation: {
    autoSave: boolean;
    autoSaveInterval: number;
    autoPunctuation: boolean;
    autoCapitalization: boolean;
  };
  ambient: {
    enabled: boolean;
    speakerDiarization: boolean;
    realTimeProcessing: boolean;
  };
  navigation: VoiceNavigationConfig;
  authentication: VoiceAuthConfig;
  accessibility: {
    visualFeedback: boolean;
    hapticFeedback: boolean;
    audioFeedback: boolean;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type VoiceServiceType =
  | "recognition"
  | "tts"
  | "command"
  | "dictation"
  | "ambient"
  | "navigation"
  | "authentication";

export interface VoiceServiceStatus {
  service: VoiceServiceType;
  status: "active" | "inactive" | "error" | "initializing";
  lastActivity?: Date;
  error?: string;
}

export interface VoiceCapabilities {
  webSpeechAPI: boolean;
  mediaRecorder: boolean;
  audioContext: boolean;
  webRTC: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  voiceActivity: boolean;
}
