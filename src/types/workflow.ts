/**
 * Workflow & Task Engine Types for Lithic Enterprise Healthcare Platform
 * Comprehensive workflow automation with state machine-based execution
 */

import { BaseEntity, User } from "./index";

// ============================================================================
// Core Workflow Types
// ============================================================================

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  ARCHIVED = "ARCHIVED",
}

export enum WorkflowTriggerType {
  MANUAL = "MANUAL",
  SCHEDULED = "SCHEDULED",
  EVENT = "EVENT",
  CONDITION = "CONDITION",
  API = "API",
  WEBHOOK = "WEBHOOK",
}

export enum NodeType {
  START = "START",
  END = "END",
  TASK = "TASK",
  DECISION = "DECISION",
  PARALLEL = "PARALLEL",
  JOIN = "JOIN",
  WAIT = "WAIT",
  SUBPROCESS = "SUBPROCESS",
  API_CALL = "API_CALL",
  NOTIFICATION = "NOTIFICATION",
  APPROVAL = "APPROVAL",
  SCRIPT = "SCRIPT",
}

export interface WorkflowDefinition extends BaseEntity {
  name: string;
  description: string;
  category: WorkflowCategory;
  version: number;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  timeout: number | null; // milliseconds
  retryPolicy: RetryPolicy | null;
  tags: string[];
  isTemplate: boolean;
  parentTemplateId: string | null;
  metadata: Record<string, any>;
}

export enum WorkflowCategory {
  CLINICAL = "CLINICAL",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  BILLING = "BILLING",
  QUALITY = "QUALITY",
  COMPLIANCE = "COMPLIANCE",
  OPERATIONAL = "OPERATIONAL",
  CUSTOM = "CUSTOM",
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: Record<string, any>;
  schedule?: CronSchedule;
  events?: string[];
  conditions?: WorkflowCondition[];
}

export interface CronSchedule {
  expression: string;
  timezone: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: "AND" | "OR";
}

export enum ConditionOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  IS_NULL = "IS_NULL",
  IS_NOT_NULL = "IS_NOT_NULL",
  MATCHES_REGEX = "MATCHES_REGEX",
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  config: NodeConfig;
  position: NodePosition;
  metadata: Record<string, any>;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfig {
  taskType?: TaskType;
  assignee?: AssignmentConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  conditions?: WorkflowCondition[];
  parallelBranches?: string[];
  waitDuration?: number;
  waitUntil?: Date;
  subworkflowId?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  apiPayload?: Record<string, any>;
  notificationTemplate?: string;
  approvalConfig?: ApprovalConfig;
  scriptCode?: string;
  outputMapping?: Record<string, string>;
}

export interface AssignmentConfig {
  type: AssignmentType;
  userId?: string;
  roleId?: string;
  groupId?: string;
  expression?: string; // dynamic assignment
  fallbackUserId?: string;
}

export enum AssignmentType {
  USER = "USER",
  ROLE = "ROLE",
  GROUP = "GROUP",
  DYNAMIC = "DYNAMIC",
  POOL = "POOL",
  ROUND_ROBIN = "ROUND_ROBIN",
  LOAD_BALANCED = "LOAD_BALANCED",
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: BackoffType;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  multiplier: number;
  retryableErrors?: string[];
}

export enum BackoffType {
  FIXED = "FIXED",
  LINEAR = "LINEAR",
  EXPONENTIAL = "EXPONENTIAL",
  RANDOM = "RANDOM",
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: WorkflowCondition;
  label?: string;
  priority?: number;
}

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  defaultValue?: any;
  required: boolean;
  description: string;
}

export enum VariableType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
}

// ============================================================================
// Workflow Instance Types
// ============================================================================

export interface WorkflowInstance extends BaseEntity {
  workflowDefinitionId: string;
  workflowDefinition?: WorkflowDefinition;
  name: string;
  status: WorkflowInstanceStatus;
  currentNodes: string[];
  variables: Record<string, any>;
  context: WorkflowContext;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null; // milliseconds
  error: WorkflowError | null;
  parentInstanceId: string | null;
  priority: WorkflowPriority;
  metadata: Record<string, any>;
}

export enum WorkflowInstanceStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
}

export enum WorkflowPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export interface WorkflowContext {
  initiator: string;
  patientId?: string;
  encounterId?: string;
  orderId?: string;
  relatedResources: Record<string, string>;
  businessKey?: string;
  correlationId?: string;
}

export interface WorkflowError {
  code: string;
  message: string;
  nodeId: string;
  timestamp: Date;
  stackTrace?: string;
  details?: Record<string, any>;
}

export interface NodeExecution {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeName: string;
  status: NodeExecutionStatus;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  attempts: number;
  input: Record<string, any>;
  output: Record<string, any> | null;
  error: WorkflowError | null;
  assignedTo: string | null;
  metadata: Record<string, any>;
}

export enum NodeExecutionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
  CANCELLED = "CANCELLED",
  RETRYING = "RETRYING",
}

// ============================================================================
// Task Management Types
// ============================================================================

export enum TaskType {
  USER_TASK = "USER_TASK",
  APPROVAL = "APPROVAL",
  REVIEW = "REVIEW",
  FORM_COMPLETION = "FORM_COMPLETION",
  DOCUMENT_REVIEW = "DOCUMENT_REVIEW",
  CLINICAL_ASSESSMENT = "CLINICAL_ASSESSMENT",
  ORDER_VERIFICATION = "ORDER_VERIFICATION",
  RESULT_REVIEW = "RESULT_REVIEW",
  CHART_REVIEW = "CHART_REVIEW",
  PRESCRIPTION_REVIEW = "PRESCRIPTION_REVIEW",
  CUSTOM = "CUSTOM",
}

export interface Task extends BaseEntity {
  workflowInstanceId: string | null;
  nodeExecutionId: string | null;
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string | null;
  assignedToUser?: User;
  assignedBy: string;
  assignedAt: Date;
  dueDate: Date | null;
  completedAt: Date | null;
  completedBy: string | null;
  estimatedDuration: number | null; // minutes
  actualDuration: number | null; // minutes
  category: TaskCategory;
  tags: string[];
  context: TaskContext;
  data: Record<string, any>;
  dependencies: string[];
  checklist: TaskChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  sla: SLAConfig | null;
  slaStatus: SLAStatus;
  escalations: TaskEscalation[];
  metadata: Record<string, any>;
}

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export enum TaskStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING = "WAITING",
  BLOCKED = "BLOCKED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
  ESCALATED = "ESCALATED",
}

export enum TaskCategory {
  CLINICAL = "CLINICAL",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  BILLING = "BILLING",
  QUALITY = "QUALITY",
  COMPLIANCE = "COMPLIANCE",
  COMMUNICATION = "COMMUNICATION",
  FOLLOW_UP = "FOLLOW_UP",
  CUSTOM = "CUSTOM",
}

export interface TaskContext {
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  orderId?: string;
  resultId?: string;
  documentId?: string;
  relatedResources: Record<string, string>;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  required: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date | null;
  isInternal: boolean;
}

export interface SLAConfig {
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  businessHoursOnly: boolean;
  escalationLevels: EscalationLevel[];
}

export enum SLAStatus {
  MET = "MET",
  AT_RISK = "AT_RISK",
  BREACHED = "BREACHED",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export interface EscalationLevel {
  level: number;
  triggerAfter: number; // minutes
  escalateTo: string[]; // user IDs or role IDs
  notificationTemplate: string;
  actions: string[];
}

export interface TaskEscalation {
  id: string;
  level: number;
  triggeredAt: Date;
  escalatedTo: string[];
  reason: string;
  resolved: boolean;
  resolvedAt: Date | null;
}

// ============================================================================
// Approval Workflow Types
// ============================================================================

export interface ApprovalRequest extends BaseEntity {
  workflowInstanceId: string | null;
  taskId: string | null;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  config: ApprovalConfig;
  status: ApprovalStatus;
  currentLevel: number;
  approvals: Approval[];
  rejections: Rejection[];
  comments: ApprovalComment[];
  dueDate: Date | null;
  completedAt: Date | null;
  context: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ApprovalConfig {
  type: ApprovalType;
  levels: ApprovalLevel[];
  allowDelegation: boolean;
  allowParallelApproval: boolean;
  requireAllApprovers: boolean;
  autoApprovalRules?: AutoApprovalRule[];
  escalationPolicy?: EscalationPolicy;
}

export enum ApprovalType {
  SINGLE = "SINGLE",
  MULTI_LEVEL = "MULTI_LEVEL",
  PARALLEL = "PARALLEL",
  CONSENSUS = "CONSENSUS",
  MAJORITY = "MAJORITY",
}

export interface ApprovalLevel {
  level: number;
  approvers: ApproverConfig[];
  minimumApprovals: number;
  timeout: number | null; // minutes
  skipIfPreviousApprover: boolean;
}

export interface ApproverConfig {
  type: "USER" | "ROLE" | "GROUP";
  id: string;
  name: string;
  fallbackId?: string;
}

export interface AutoApprovalRule {
  id: string;
  name: string;
  conditions: WorkflowCondition[];
  autoApprove: boolean;
  skipLevels?: number[];
}

export interface EscalationPolicy {
  enabled: boolean;
  escalationLevels: EscalationLevel[];
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface Approval {
  id: string;
  level: number;
  approverId: string;
  approverName: string;
  approvedAt: Date;
  comments: string | null;
  signature: string | null;
  ipAddress: string;
  metadata: Record<string, any>;
}

export interface Rejection {
  id: string;
  level: number;
  rejecterId: string;
  rejecterName: string;
  rejectedAt: Date;
  reason: string;
  comments: string | null;
  ipAddress: string;
  metadata: Record<string, any>;
}

export interface ApprovalComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
  isInternal: boolean;
}

// ============================================================================
// Care Protocol Types
// ============================================================================

export interface CareProtocol extends BaseEntity {
  name: string;
  code: string;
  version: string;
  description: string;
  category: ProtocolCategory;
  condition: string;
  icd10Codes: string[];
  workflowDefinitionId: string;
  steps: ProtocolStep[];
  outcomes: ProtocolOutcome[];
  evidenceLevel: EvidenceLevel;
  source: string;
  references: string[];
  status: ProtocolStatus;
  effectiveDate: Date;
  expirationDate: Date | null;
  metadata: Record<string, any>;
}

export enum ProtocolCategory {
  DIAGNOSIS = "DIAGNOSIS",
  TREATMENT = "TREATMENT",
  PREVENTION = "PREVENTION",
  SCREENING = "SCREENING",
  MANAGEMENT = "MANAGEMENT",
  PROCEDURE = "PROCEDURE",
  CUSTOM = "CUSTOM",
}

export enum ProtocolStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
  RETIRED = "RETIRED",
}

export enum EvidenceLevel {
  A = "A", // High-quality evidence
  B = "B", // Moderate-quality evidence
  C = "C", // Low-quality evidence
  D = "D", // Expert opinion
}

export interface ProtocolStep {
  id: string;
  order: number;
  name: string;
  description: string;
  type: ProtocolStepType;
  duration: number | null; // minutes
  required: boolean;
  conditions: WorkflowCondition[];
  actions: ProtocolAction[];
  alternatives: ProtocolStep[];
}

export enum ProtocolStepType {
  ASSESSMENT = "ASSESSMENT",
  INTERVENTION = "INTERVENTION",
  MEDICATION = "MEDICATION",
  PROCEDURE = "PROCEDURE",
  EDUCATION = "EDUCATION",
  FOLLOW_UP = "FOLLOW_UP",
  DECISION_POINT = "DECISION_POINT",
}

export interface ProtocolAction {
  type: string;
  description: string;
  parameters: Record<string, any>;
  required: boolean;
}

export interface ProtocolOutcome {
  id: string;
  name: string;
  measure: string;
  target: number | string;
  unit: string;
  timeframe: string;
}

export interface ProtocolExecution extends BaseEntity {
  protocolId: string;
  protocol?: CareProtocol;
  workflowInstanceId: string;
  patientId: string;
  encounterId: string;
  startedBy: string;
  startedAt: Date;
  completedAt: Date | null;
  status: ProtocolExecutionStatus;
  currentStep: number;
  completedSteps: string[];
  variances: ProtocolVariance[];
  outcomes: ProtocolOutcomeResult[];
  metadata: Record<string, any>;
}

export enum ProtocolExecutionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DISCONTINUED = "DISCONTINUED",
  ON_HOLD = "ON_HOLD",
}

export interface ProtocolVariance {
  id: string;
  stepId: string;
  type: VarianceType;
  reason: string;
  documentedBy: string;
  documentedAt: Date;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
}

export enum VarianceType {
  OMISSION = "OMISSION",
  SUBSTITUTION = "SUBSTITUTION",
  DELAY = "DELAY",
  EARLY_TERMINATION = "EARLY_TERMINATION",
  MODIFICATION = "MODIFICATION",
}

export interface ProtocolOutcomeResult {
  outcomeId: string;
  value: number | string;
  achievedTarget: boolean;
  measuredAt: Date;
  measuredBy: string;
  notes: string | null;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification extends BaseEntity {
  recipientId: string;
  recipientType: RecipientType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  templateId: string | null;
  templateData: Record<string, any>;
  category: NotificationCategory;
  actionUrl: string | null;
  actionLabel: string | null;
  expiresAt: Date | null;
  readAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  attempts: number;
  metadata: Record<string, any>;
}

export enum RecipientType {
  USER = "USER",
  ROLE = "ROLE",
  GROUP = "GROUP",
  PATIENT = "PATIENT",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  WEBHOOK = "WEBHOOK",
}

export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum NotificationCategory {
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_DUE = "TASK_DUE",
  TASK_OVERDUE = "TASK_OVERDUE",
  TASK_COMPLETED = "TASK_COMPLETED",
  APPROVAL_REQUESTED = "APPROVAL_REQUESTED",
  APPROVAL_APPROVED = "APPROVAL_APPROVED",
  APPROVAL_REJECTED = "APPROVAL_REJECTED",
  WORKFLOW_STARTED = "WORKFLOW_STARTED",
  WORKFLOW_COMPLETED = "WORKFLOW_COMPLETED",
  WORKFLOW_FAILED = "WORKFLOW_FAILED",
  RESULT_AVAILABLE = "RESULT_AVAILABLE",
  CRITICAL_ALERT = "CRITICAL_ALERT",
  REMINDER = "REMINDER",
  SYSTEM = "SYSTEM",
  CUSTOM = "CUSTOM",
}

export interface NotificationTemplate extends BaseEntity {
  name: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  htmlTemplate: string | null;
  variables: string[];
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  enabled: boolean;
  quietHoursStart: string | null; // HH:mm format
  quietHoursEnd: string | null; // HH:mm format
  frequency: NotificationFrequency;
}

export enum NotificationFrequency {
  IMMEDIATE = "IMMEDIATE",
  DIGEST_HOURLY = "DIGEST_HOURLY",
  DIGEST_DAILY = "DIGEST_DAILY",
  DIGEST_WEEKLY = "DIGEST_WEEKLY",
}

// ============================================================================
// Workflow Analytics Types
// ============================================================================

export interface WorkflowMetrics {
  workflowId: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  averageDuration: number; // milliseconds
  minDuration: number;
  maxDuration: number;
  successRate: number; // percentage
  bottlenecks: BottleneckAnalysis[];
  slaCompliance: number; // percentage
  period: DateRange;
}

export interface BottleneckAnalysis {
  nodeId: string;
  nodeName: string;
  averageDuration: number;
  occurrences: number;
  percentageOfTotal: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // minutes
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByCategory: Record<TaskCategory, number>;
  slaCompliance: number; // percentage
  period: DateRange;
}

export interface UserWorkload {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  utilizationRate: number; // percentage
  capacity: number;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  WorkflowDefinition,
  WorkflowInstance,
  Task,
  ApprovalRequest,
  CareProtocol,
  Notification,
};
