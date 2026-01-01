/**
 * Integration Type Definitions
 * Types for healthcare interoperability integrations
 */

import type { Resource, Reference, CodeableConcept, Identifier } from "./fhir-resources";

// Integration Status Types
export type IntegrationStatus = "active" | "inactive" | "error" | "configuring" | "testing";
export type MessageStatus = "pending" | "processing" | "completed" | "failed" | "retrying";
export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

// HL7 v2 Types
export interface HL7Message {
  id: string;
  messageType: string;
  triggerEvent: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  timestamp: Date;
  messageControlId: string;
  processingId: "P" | "T" | "D"; // Production, Training, Debug
  versionId: string;
  segments: HL7Segment[];
  raw?: string;
}

export interface HL7Segment {
  name: string;
  fields: HL7Field[];
  raw: string;
}

export interface HL7Field {
  value: string | HL7Component[];
  repetitions?: string[];
}

export interface HL7Component {
  value: string;
  subComponents?: string[];
}

export interface HL7MessageType {
  messageType: string;
  triggerEvent: string;
  description: string;
  structure: string;
}

export interface HL7Acknowledgment {
  messageControlId: string;
  acknowledgmentCode: "AA" | "AE" | "AR" | "CA" | "CE" | "CR"; // Accept, Error, Reject
  textMessage?: string;
  errorCondition?: string;
  severity?: "E" | "W" | "I"; // Error, Warning, Information
}

export interface HL7Route {
  id: string;
  name: string;
  description?: string;
  messageType: string;
  triggerEvent?: string;
  sourceSystem: string;
  destinationSystem: string;
  transformations?: string[];
  filters?: HL7Filter[];
  active: boolean;
  priority: number;
}

export interface HL7Filter {
  field: string;
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "regex";
  value: string;
}

export interface HL7Transform {
  id: string;
  name: string;
  description?: string;
  sourceField: string;
  targetField: string;
  transformType: "copy" | "map" | "function" | "lookup";
  transformValue?: string | Record<string, string>;
  required: boolean;
}

// FHIR Integration Types
export interface FHIRServer {
  id: string;
  name: string;
  baseUrl: string;
  version: "4.0.1" | "3.0.2" | "1.0.2";
  status: ConnectionStatus;
  authType: "none" | "basic" | "bearer" | "smart" | "oauth2";
  authConfig?: FHIRAuthConfig;
  capabilities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FHIRAuthConfig {
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  authUrl?: string;
  scopes?: string[];
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface FHIROperation {
  name: string;
  type: "instance" | "type" | "system";
  definition: string;
  parameters?: FHIROperationParameter[];
}

export interface FHIROperationParameter {
  name: string;
  use: "in" | "out";
  min: number;
  max: string;
  type?: string;
  documentation?: string;
}

export interface FHIRSubscription {
  id: string;
  criteria: string;
  channelType: "rest-hook" | "websocket" | "email" | "sms";
  endpoint?: string;
  payload: string;
  headers?: string[];
  status: "active" | "error" | "off" | "requested";
  error?: string;
  createdAt: Date;
  lastPing?: Date;
}

export interface FHIRBulkExportJob {
  id: string;
  resourceTypes: string[];
  since?: Date;
  outputFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  request: string;
  requiresAccessToken: boolean;
  output?: FHIRBulkExportOutput[];
  error?: string[];
  transactionTime?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface FHIRBulkExportOutput {
  type: string;
  url: string;
  count?: number;
}

// SMART on FHIR Types
export interface SMARTAuthContext {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  aud: string;
  launch?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}

export interface SMARTToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  refreshToken?: string;
  patient?: string;
  encounter?: string;
  practitioner?: string;
  idToken?: string;
}

// Health Information Exchange Types
export interface HIEConnection {
  id: string;
  name: string;
  type: "carequality" | "commonwell" | "direct" | "custom";
  status: ConnectionStatus;
  configuration: HIEConfiguration;
  statistics?: HIEStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface HIEConfiguration {
  organizationId: string;
  certificatePath?: string;
  certificatePassword?: string;
  endpoint: string;
  soapAction?: string;
  timeout: number;
  retryAttempts: number;
  customHeaders?: Record<string, string>;
}

export interface HIEStatistics {
  queriesSent: number;
  queriesReceived: number;
  documentsRetrieved: number;
  errors: number;
  lastActivity?: Date;
}

export interface PatientDiscoveryRequest {
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    ssn?: string;
    address?: {
      line?: string[];
      city?: string;
      state?: string;
      postalCode?: string;
    };
  };
  organizationId?: string;
}

export interface PatientDiscoveryResponse {
  matches: PatientMatch[];
  queryId: string;
  timestamp: Date;
}

export interface PatientMatch {
  patientId: string;
  organizationId: string;
  organizationName: string;
  matchScore: number;
  demographics: Record<string, any>;
  identifiers?: Identifier[];
}

export interface DocumentQueryRequest {
  patientId: string;
  organizationId: string;
  documentType?: string[];
  startDate?: Date;
  endDate?: Date;
  classCode?: string[];
  practiceSettingCode?: string[];
}

export interface DocumentQueryResponse {
  documents: DocumentMetadata[];
  queryId: string;
  timestamp: Date;
}

export interface DocumentMetadata {
  documentId: string;
  repositoryId: string;
  title: string;
  creationTime: Date;
  serviceStartTime?: Date;
  serviceStopTime?: Date;
  author?: string[];
  classCode?: CodeableConcept;
  typeCode?: CodeableConcept;
  formatCode?: string;
  mimeType: string;
  size?: number;
  hash?: string;
}

// Direct Messaging Types
export interface DirectMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: DirectAttachment[];
  messageId: string;
  inReplyTo?: string;
  status: MessageStatus;
  sentAt?: Date;
  receivedAt?: Date;
  error?: string;
}

export interface DirectAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: string; // Base64 encoded
}

// Carequality Types
export interface CarequalityQuery {
  id: string;
  patientId: string;
  queryType: "patient_discovery" | "document_query" | "document_retrieve";
  requestedOrganizations?: string[];
  status: MessageStatus;
  request: any;
  response?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// CommonWell Types
export interface CommonWellEnrollment {
  id: string;
  patientId: string;
  commonwellId: string;
  status: "active" | "suspended" | "terminated";
  consentStatus: "granted" | "denied" | "unknown";
  enrolledAt: Date;
  updatedAt: Date;
}

export interface CommonWellQuery {
  id: string;
  patientId: string;
  queryType: "person" | "document" | "encounter";
  status: MessageStatus;
  results?: any[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// API Gateway Types
export interface APIKey {
  id: string;
  name: string;
  key: string; // Hashed
  plainKey?: string; // Only available on creation
  organizationId: string;
  scopes: string[];
  rateLimit?: RateLimit;
  status: "active" | "inactive" | "revoked";
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface RateLimit {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface OAuth2Client {
  id: string;
  clientId: string;
  clientSecret: string; // Hashed
  name: string;
  organizationId: string;
  redirectUris: string[];
  allowedScopes: string[];
  grantTypes: ("authorization_code" | "client_credentials" | "refresh_token")[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuth2Token {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken?: string;
  scope: string;
}

export interface OAuth2AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: "active" | "inactive" | "failed";
  headers?: Record<string, string>;
  retryPolicy?: WebhookRetryPolicy;
  lastTriggered?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent =
  | "patient.created"
  | "patient.updated"
  | "patient.deleted"
  | "observation.created"
  | "observation.updated"
  | "encounter.created"
  | "encounter.updated"
  | "medication.prescribed"
  | "result.available"
  | "document.available";

export interface WebhookRetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
  response?: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
  createdAt: Date;
}

// Integration Message Flow Types
export interface MessageFlow {
  id: string;
  name: string;
  source: IntegrationEndpoint;
  destination: IntegrationEndpoint;
  messageType: string;
  status: IntegrationStatus;
  statistics: MessageFlowStatistics;
  transforms?: string[];
  filters?: Record<string, any>[];
  errorHandling: ErrorHandlingPolicy;
}

export interface IntegrationEndpoint {
  type: "hl7v2" | "fhir" | "direct" | "hie" | "custom";
  systemId: string;
  systemName: string;
  config: Record<string, any>;
}

export interface MessageFlowStatistics {
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  averageProcessingTime: number;
  lastMessageAt?: Date;
  messagesLast24h: number;
  errorsLast24h: number;
}

export interface ErrorHandlingPolicy {
  retryAttempts: number;
  retryDelay: number;
  retryBackoff: "linear" | "exponential";
  deadLetterQueue: boolean;
  alertOnFailure: boolean;
  alertThreshold: number;
}

// Integration Monitoring Types
export interface IntegrationHealth {
  systemId: string;
  systemName: string;
  systemType: string;
  status: ConnectionStatus;
  lastCheck: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  alerts?: IntegrationAlert[];
}

export interface IntegrationAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  message: string;
  systemId: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface IntegrationMetrics {
  timeRange: {
    start: Date;
    end: Date;
  };
  systems: SystemMetrics[];
  messageVolume: MessageVolumeMetrics;
  errorMetrics: ErrorMetrics;
  performanceMetrics: PerformanceMetrics;
}

export interface SystemMetrics {
  systemId: string;
  systemName: string;
  messagesProcessed: number;
  errors: number;
  averageResponseTime: number;
  availability: number;
}

export interface MessageVolumeMetrics {
  total: number;
  byType: Record<string, number>;
  byHour: Array<{ hour: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
}

export interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  bySystem: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  medianProcessingTime: number;
  p95ProcessingTime: number;
  p99ProcessingTime: number;
  slowestOperations: Array<{
    operation: string;
    averageTime: number;
  }>;
}

// Configuration Types
export interface IntegrationConfig {
  id: string;
  name: string;
  type: "hl7v2" | "fhir" | "hie" | "direct" | "custom";
  enabled: boolean;
  configuration: Record<string, any>;
  secrets?: Record<string, string>;
  validatedAt?: Date;
  validationErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Audit Trail Types
export interface IntegrationAuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  systemId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}
