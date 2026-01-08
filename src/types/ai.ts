/**
 * AI/LLM Integration Types
 * Comprehensive type definitions for AI-powered clinical assistance
 *
 * HIPAA Compliance: All types include metadata for audit and security
 */

// ============================================================================
// LLM Provider Types
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'azure-openai';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  metadata?: Record<string, unknown>;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Clinical Summarization Types
// ============================================================================

export interface ClinicalNote {
  id: string;
  patientId: string;
  encounterId: string;
  type: 'progress' | 'soap' | 'discharge' | 'consultation' | 'procedure';
  content: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  author: string;
  timestamp: Date;
}

export interface ClinicalSummary {
  noteId: string;
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  criticalAlerts: string[];
  confidence: number;
  generatedAt: Date;
  model: string;
}

export interface SummarizationRequest {
  note: ClinicalNote;
  format?: 'brief' | 'detailed' | 'structured';
  focus?: string[];
  excludePHI?: boolean;
}

// ============================================================================
// Medical Coding Types
// ============================================================================

export interface ICDCode {
  code: string;
  description: string;
  category: string;
  billable: boolean;
}

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  rvuValue?: number;
}

export interface CodingSuggestion {
  type: 'icd10' | 'cpt';
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
  supportingEvidence: string[];
  alternatives?: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
}

export interface CodingRequest {
  clinicalText: string;
  encounterType?: string;
  chiefComplaint?: string;
  existingCodes?: string[];
  codingType?: 'icd10' | 'cpt' | 'both';
}

export interface CodingResponse {
  icd10Suggestions: CodingSuggestion[];
  cptSuggestions: CodingSuggestion[];
  documentation: string[];
  confidenceScore: number;
  generatedAt: Date;
}

// ============================================================================
// Documentation Assistant Types
// ============================================================================

export interface DocumentationRequest {
  context: 'soap' | 'history' | 'physical' | 'assessment' | 'plan';
  existingText?: string;
  chiefComplaint?: string;
  vitalSigns?: Record<string, string | number>;
  symptoms?: string[];
  findings?: string[];
  userInput?: string;
}

export interface DocumentationSuggestion {
  section: string;
  content: string;
  type: 'completion' | 'enhancement' | 'template';
  confidence: number;
  reasoning?: string;
}

export interface DocumentationResponse {
  suggestions: DocumentationSuggestion[];
  fullText?: string;
  warnings?: string[];
  generatedAt: Date;
}

// ============================================================================
// Differential Diagnosis Types
// ============================================================================

export interface PatientPresentation {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string;
  vitalSigns?: Record<string, number>;
  labs?: Record<string, unknown>;
  imaging?: string[];
  medicalHistory?: string[];
  medications?: string[];
  allergies?: string[];
  age?: number;
  sex?: string;
}

export interface DiagnosisCandidate {
  condition: string;
  icd10Code: string;
  probability: number;
  reasoning: string;
  supportingFindings: string[];
  contradictingFindings: string[];
  recommendedTests: string[];
  urgencyLevel: 'routine' | 'urgent' | 'emergent';
}

export interface DifferentialDiagnosisResponse {
  candidates: DiagnosisCandidate[];
  criticalFlags: string[];
  recommendedActions: string[];
  confidence: number;
  generatedAt: Date;
}

// ============================================================================
// Medication Reconciliation Types
// ============================================================================

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication?: string;
  startDate?: Date;
  endDate?: Date;
  prescriber?: string;
  source?: 'patient_reported' | 'ehr' | 'pharmacy' | 'other';
}

export interface MedicationDiscrepancy {
  type: 'duplication' | 'interaction' | 'contraindication' | 'dose_issue' | 'missing';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  medications: string[];
  recommendation: string;
  evidence: string[];
}

export interface MedicationReconciliationRequest {
  patientMedications: Medication[];
  ehrMedications: Medication[];
  allergies?: string[];
  conditions?: string[];
  labs?: Record<string, unknown>;
}

export interface MedicationReconciliationResponse {
  discrepancies: MedicationDiscrepancy[];
  reconciledList: Medication[];
  recommendations: string[];
  criticalAlerts: string[];
  confidence: number;
  generatedAt: Date;
}

// ============================================================================
// Quality Measure Types
// ============================================================================

export interface QualityMeasure {
  id: string;
  name: string;
  description: string;
  category: 'diabetes' | 'hypertension' | 'preventive' | 'chronic_disease' | 'other';
  criteria: string[];
}

export interface CareGap {
  measureId: string;
  measureName: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  dueDate?: Date;
  recommendations: string[];
  reasoning: string;
  supportingData: Record<string, unknown>;
}

export interface QualityGapRequest {
  patientId: string;
  demographics: {
    age: number;
    sex: string;
  };
  conditions: string[];
  medications: Medication[];
  recentVisits: Array<{
    date: Date;
    type: string;
    diagnoses: string[];
  }>;
  labs?: Record<string, Array<{ value: number; date: Date }>>;
  immunizations?: Array<{ name: string; date: Date }>;
  screenings?: Array<{ type: string; result: string; date: Date }>;
}

export interface QualityGapResponse {
  gaps: CareGap[];
  compliantMeasures: string[];
  priorityActions: string[];
  overallScore: number;
  generatedAt: Date;
}

// ============================================================================
// AI Assistant Types
// ============================================================================

export interface AIAssistantContext {
  patientId?: string;
  encounterId?: string;
  section?: string;
  existingData?: Record<string, unknown>;
  userRole?: 'physician' | 'nurse' | 'admin';
}

export interface AIAssistantRequest {
  query: string;
  context: AIAssistantContext;
  previousMessages?: LLMMessage[];
  mode?: 'documentation' | 'clinical' | 'coding' | 'general';
}

export interface AIAssistantResponse {
  response: string;
  suggestions?: Array<{
    type: string;
    content: string;
    action?: string;
  }>;
  references?: string[];
  confidence: number;
  conversationId: string;
  generatedAt: Date;
}

// ============================================================================
// Caching and Rate Limiting Types
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxTokensPerDay: number;
  cooldownPeriod?: number;
}

export interface RateLimitStatus {
  requestsThisMinute: number;
  requestsThisHour: number;
  tokensToday: number;
  isLimited: boolean;
  resetAt: Date;
}

// ============================================================================
// Audit and Security Types
// ============================================================================

export interface AIAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;
  provider: LLMProvider;
  model: string;
  requestType: string;
  patientId?: string;
  encounterId?: string;
  tokenUsage: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface PHIRedactionConfig {
  enabled: boolean;
  redactNames: boolean;
  redactDates: boolean;
  redactIds: boolean;
  redactLocations: boolean;
  redactContacts: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: LLMProvider,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends AIServiceError {
  constructor(
    message: string,
    public resetAt: Date,
    provider?: LLMProvider
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider, 429);
    this.name = 'RateLimitError';
  }
}

export class TokenLimitError extends AIServiceError {
  constructor(
    message: string,
    public maxTokens: number,
    public requestedTokens: number,
    provider?: LLMProvider
  ) {
    super(message, 'TOKEN_LIMIT_EXCEEDED', provider, 400);
    this.name = 'TokenLimitError';
  }
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AIServiceConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
  rateLimiting: RateLimitConfig;
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  phiRedaction: PHIRedactionConfig;
  timeout: number;
  retries: number;
  auditLogging: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  examples?: Array<{
    input: Record<string, string>;
    output: string;
  }>;
}
