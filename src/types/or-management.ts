/**
 * Operating Room Management Types
 * Agent 8: OR Management & Surgical Scheduling
 */

import type { BaseEntity } from "./index";

// ============================================================================
// OR Case Types
// ============================================================================

export interface SurgicalCase extends BaseEntity {
  caseNumber: string;
  patientId: string;
  patientName: string;
  mrn: string;
  surgeonId: string;
  surgeonName: string;
  procedureId: string;
  procedureName: string;
  cptCodes: string[];
  scheduledDate: Date;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  estimatedDuration: number; // minutes
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  actualDuration: number | null;
  roomId: string;
  roomName: string;
  blockId: string | null;
  status: CaseStatus;
  priority: CasePriority;
  laterality: Laterality | null;
  anesthesiaType: AnesthesiaType;
  anesthesiologistId: string | null;
  anesthesiologistName: string | null;
  teamMembers: TeamMember[];
  equipmentNeeded: EquipmentRequest[];
  suppliesNeeded: SupplyRequest[];
  specialInstructions: string | null;
  diagnosis: string;
  icdCodes: string[];
  consent: ConsentInfo;
  preOpCompleted: boolean;
  preOpCompletedAt: Date | null;
  timeOutCompleted: boolean;
  timeOutCompletedAt: Date | null;
  specimens: SpecimenInfo[];
  complications: string | null;
  estimatedBloodLoss: number | null; // mL
  notes: string | null;
  cancellationReason: string | null;
  delayReason: string | null;
  delayMinutes: number | null;
}

export enum CaseStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  PRE_OP = "PRE_OP",
  READY = "READY",
  IN_ROOM = "IN_ROOM",
  ANESTHESIA_START = "ANESTHESIA_START",
  PROCEDURE_START = "PROCEDURE_START",
  PROCEDURE_END = "PROCEDURE_END",
  CLOSING = "CLOSING",
  RECOVERY = "RECOVERY",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DELAYED = "DELAYED",
  BUMP = "BUMP",
}

export enum CasePriority {
  ELECTIVE = "ELECTIVE",
  URGENT = "URGENT",
  EMERGENT = "EMERGENT",
  ADD_ON = "ADD_ON",
}

export enum Laterality {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  BILATERAL = "BILATERAL",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum AnesthesiaType {
  GENERAL = "GENERAL",
  REGIONAL = "REGIONAL",
  SPINAL = "SPINAL",
  EPIDURAL = "EPIDURAL",
  LOCAL = "LOCAL",
  MAC = "MAC", // Monitored Anesthesia Care
  SEDATION = "SEDATION",
  NONE = "NONE",
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  role: TeamRole;
  isPrimary: boolean;
  startTime: Date | null;
  endTime: Date | null;
}

export enum TeamRole {
  SURGEON = "SURGEON",
  ASSISTANT_SURGEON = "ASSISTANT_SURGEON",
  ANESTHESIOLOGIST = "ANESTHESIOLOGIST",
  CRNA = "CRNA", // Certified Registered Nurse Anesthetist
  SCRUB_NURSE = "SCRUB_NURSE",
  CIRCULATING_NURSE = "CIRCULATING_NURSE",
  SURGICAL_TECH = "SURGICAL_TECH",
  FIRST_ASSIST = "FIRST_ASSIST",
  RESIDENT = "RESIDENT",
  FELLOW = "FELLOW",
  STUDENT = "STUDENT",
}

export interface EquipmentRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  required: boolean;
  confirmed: boolean;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  notes: string | null;
}

export interface SupplyRequest {
  id: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  required: boolean;
  picked: boolean;
  pickedBy: string | null;
  pickedAt: Date | null;
}

export interface ConsentInfo {
  signed: boolean;
  signedBy: string | null;
  signedAt: Date | null;
  witnessedBy: string | null;
  formUrl: string | null;
  specialConsents: string[];
}

export interface SpecimenInfo {
  id: string;
  type: string;
  description: string;
  collectedAt: Date;
  sentToPathology: boolean;
  pathologyNumber: string | null;
}

// ============================================================================
// OR Block Schedule Types
// ============================================================================

export interface ORBlock extends BaseEntity {
  blockName: string;
  surgeonId: string;
  surgeonName: string;
  specialtyId: string;
  specialtyName: string;
  roomId: string;
  roomName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;
  duration: number; // minutes
  effectiveDate: Date;
  expirationDate: Date | null;
  isRecurring: boolean;
  releaseTime: number; // hours before - when unused time is released
  utilizationTarget: number; // percentage
  allowAddOns: boolean;
  maxAddOns: number;
  status: BlockStatus;
  notes: string | null;
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum BlockStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  RELEASED = "RELEASED",
  CANCELLED = "CANCELLED",
}

export interface BlockUtilization {
  blockId: string;
  date: Date;
  totalMinutes: number;
  scheduledMinutes: number;
  utilizationRate: number;
  casesScheduled: number;
  casesCompleted: number;
  turnoverTime: number;
  firstCaseDelay: number;
}

// ============================================================================
// OR Room Types
// ============================================================================

export interface OperatingRoom extends BaseEntity {
  roomNumber: string;
  roomName: string;
  facilityId: string;
  facilityName: string;
  type: ORRoomType;
  status: ORRoomStatus;
  capacity: number;
  equipmentList: string[];
  capabilities: string[];
  restrictions: string[];
  cleaningDuration: number; // minutes
  turnoverDuration: number; // minutes
  location: string;
  floor: string;
  isActive: boolean;
  maintenanceSchedule: MaintenanceSchedule[];
  notes: string | null;
}

export enum ORRoomType {
  GENERAL = "GENERAL",
  CARDIAC = "CARDIAC",
  NEURO = "NEURO",
  ORTHO = "ORTHO",
  TRAUMA = "TRAUMA",
  PEDIATRIC = "PEDIATRIC",
  ROBOTICS = "ROBOTICS",
  HYBRID = "HYBRID",
  INTERVENTIONAL = "INTERVENTIONAL",
}

export enum ORRoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  TURNOVER = "TURNOVER",
  CLEANING = "CLEANING",
  MAINTENANCE = "MAINTENANCE",
  EMERGENCY_ONLY = "EMERGENCY_ONLY",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export interface MaintenanceSchedule {
  id: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  type: string;
  description: string;
  completed: boolean;
  completedAt: Date | null;
}

// ============================================================================
// Preference Card Types
// ============================================================================

export interface PreferenceCard extends BaseEntity {
  surgeonId: string;
  surgeonName: string;
  procedureId: string;
  procedureName: string;
  cptCode: string | null;
  specialty: string;
  isActive: boolean;
  version: number;
  equipment: PreferenceEquipment[];
  supplies: PreferenceSupply[];
  instruments: PreferenceInstrument[];
  positioning: PositioningInfo;
  roomSetup: RoomSetupInfo;
  anesthesiaPreferences: AnesthesiaPreferences;
  specialInstructions: string | null;
  lastUsed: Date | null;
  useCount: number;
}

export interface PreferenceEquipment {
  id: string;
  name: string;
  required: boolean;
  alternatives: string[];
  notes: string | null;
}

export interface PreferenceSupply {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  required: boolean;
  alternatives: string[];
}

export interface PreferenceInstrument {
  id: string;
  setName: string;
  required: boolean;
  alternatives: string[];
  sterilizationType: string;
}

export interface PositioningInfo {
  position: PatientPosition;
  padding: string[];
  armBoards: boolean;
  stirrups: boolean;
  specialEquipment: string[];
  notes: string | null;
}

export enum PatientPosition {
  SUPINE = "SUPINE",
  PRONE = "PRONE",
  LATERAL = "LATERAL",
  LITHOTOMY = "LITHOTOMY",
  TRENDELENBURG = "TRENDELENBURG",
  REVERSE_TRENDELENBURG = "REVERSE_TRENDELENBURG",
  SITTING = "SITTING",
  FOWLER = "FOWLER",
}

export interface RoomSetupInfo {
  tableType: string;
  lighting: string;
  monitors: string[];
  imaging: string[];
  specialSetup: string[];
  notes: string | null;
}

export interface AnesthesiaPreferences {
  preferredType: AnesthesiaType;
  alternateTypes: AnesthesiaType[];
  lineRequirements: string[];
  monitoring: string[];
  medications: string[];
  notes: string | null;
}

// ============================================================================
// Staff & Resource Types
// ============================================================================

export interface SurgicalStaff extends BaseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  credentials: string;
  roles: TeamRole[];
  specialty: string | null;
  skills: string[];
  certifications: Certification[];
  availability: StaffAvailability[];
  maxConcurrentCases: number;
  isActive: boolean;
}

export interface Certification {
  name: string;
  number: string;
  issuedDate: Date;
  expiryDate: Date;
  isActive: boolean;
}

export interface StaffAvailability {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  facilityId: string;
  exceptions: AvailabilityException[];
}

export interface AvailabilityException {
  date: Date;
  type: ExceptionType;
  reason: string;
}

export enum ExceptionType {
  VACATION = "VACATION",
  SICK = "SICK",
  CONFERENCE = "CONFERENCE",
  ON_CALL = "ON_CALL",
  ADMIN_TIME = "ADMIN_TIME",
  OTHER = "OTHER",
}

// ============================================================================
// Analytics & Metrics Types
// ============================================================================

export interface ORUtilization {
  roomId: string;
  roomName: string;
  date: Date;
  totalAvailableMinutes: number;
  scheduledMinutes: number;
  actualUsedMinutes: number;
  turnoverMinutes: number;
  delayMinutes: number;
  utilizationRate: number;
  primeTimeUtilization: number; // 7am-3pm typically
  casesScheduled: number;
  casesCompleted: number;
  casesCancelled: number;
  firstCaseOnTimeStart: boolean;
  averageTurnoverTime: number;
}

export interface SurgeonPerformance {
  surgeonId: string;
  surgeonName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalCases: number;
  completedCases: number;
  cancelledCases: number;
  averageCaseDuration: number;
  onTimeStarts: number;
  onTimeStartRate: number;
  averageDelay: number;
  blockUtilizationRate: number;
  estimationAccuracy: number; // percentage
  complicationRate: number;
  readmissionRate: number;
}

export interface TurnoverMetrics {
  roomId: string;
  date: Date;
  turnoverInstances: TurnoverInstance[];
  averageTurnoverTime: number;
  targetTurnoverTime: number;
  complianceRate: number;
}

export interface TurnoverInstance {
  previousCaseId: string;
  nextCaseId: string;
  cleaningStartTime: Date;
  cleaningEndTime: Date;
  setupStartTime: Date;
  setupEndTime: Date;
  totalTurnoverTime: number;
  delayReasons: string[];
}

export interface CaseDurationPrediction {
  procedureId: string;
  procedureName: string;
  surgeonId: string;
  patientFactors: PatientFactors;
  historicalAverage: number;
  surgeonAverage: number;
  predictedDuration: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number; // percentage
}

export interface PatientFactors {
  age: number;
  bmi: number;
  asa: ASAClass;
  comorbidities: string[];
  previousSurgeries: number;
  complexity: CaseComplexity;
}

export enum ASAClass {
  I = "I", // Normal healthy patient
  II = "II", // Mild systemic disease
  III = "III", // Severe systemic disease
  IV = "IV", // Severe systemic disease that is constant threat to life
  V = "V", // Moribund patient not expected to survive
  VI = "VI", // Brain-dead organ donor
}

export enum CaseComplexity {
  SIMPLE = "SIMPLE",
  MODERATE = "MODERATE",
  COMPLEX = "COMPLEX",
  HIGHLY_COMPLEX = "HIGHLY_COMPLEX",
}

// ============================================================================
// Scheduling Optimization Types
// ============================================================================

export interface ScheduleOptimization {
  date: Date;
  rooms: RoomSchedule[];
  totalCases: number;
  utilizationScore: number;
  conflicts: ScheduleConflict[];
  suggestions: OptimizationSuggestion[];
}

export interface RoomSchedule {
  roomId: string;
  roomName: string;
  cases: ScheduledCase[];
  gaps: TimeGap[];
  utilizationRate: number;
}

export interface ScheduledCase {
  caseId: string;
  startTime: Date;
  endTime: Date;
  surgeon: string;
  procedure: string;
  turnoverAfter: number;
}

export interface TimeGap {
  startTime: Date;
  endTime: Date;
  duration: number;
  canFitAddOn: boolean;
  suggestedProcedures: string[];
}

export interface ScheduleConflict {
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  affectedCases: string[];
  resolution: string | null;
}

export enum ConflictType {
  ROOM_OVERLAP = "ROOM_OVERLAP",
  STAFF_DOUBLE_BOOK = "STAFF_DOUBLE_BOOK",
  EQUIPMENT_UNAVAILABLE = "EQUIPMENT_UNAVAILABLE",
  BLOCK_VIOLATION = "BLOCK_VIOLATION",
  EXCEEDED_CAPACITY = "EXCEEDED_CAPACITY",
  INSUFFICIENT_TURNOVER = "INSUFFICIENT_TURNOVER",
}

export enum ConflictSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export interface OptimizationSuggestion {
  type: SuggestionType;
  priority: number;
  description: string;
  impact: string;
  action: string;
  affectedCases: string[];
}

export enum SuggestionType {
  REORDER_CASES = "REORDER_CASES",
  MOVE_TO_DIFFERENT_ROOM = "MOVE_TO_DIFFERENT_ROOM",
  ADJUST_START_TIME = "ADJUST_START_TIME",
  ADD_CASE_TO_GAP = "ADD_CASE_TO_GAP",
  REDUCE_TURNOVER = "REDUCE_TURNOVER",
  COMBINE_CASES = "COMBINE_CASES",
}

// ============================================================================
// Add-On Case Management
// ============================================================================

export interface AddOnCase {
  caseId: string;
  requestedAt: Date;
  requestedBy: string;
  patientId: string;
  surgeonId: string;
  procedureName: string;
  estimatedDuration: number;
  priority: CasePriority;
  urgencyScore: number;
  preferredDate: Date;
  acceptableRooms: string[];
  status: AddOnStatus;
  approvedAt: Date | null;
  approvedBy: string | null;
  scheduledAt: Date | null;
  deniedAt: Date | null;
  deniedReason: string | null;
  bumpedCaseId: string | null;
}

export enum AddOnStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  SCHEDULED = "SCHEDULED",
  DENIED = "DENIED",
  CANCELLED = "CANCELLED",
}

export interface BumpProtocol {
  maxBumpsPerDay: number;
  bumpableStatuses: CaseStatus[];
  protectedPriorities: CasePriority[];
  approvalRequired: boolean;
  approvers: string[];
  notificationRequired: boolean;
  compensationPolicy: string;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateORCaseDto {
  patientId: string;
  surgeonId: string;
  procedureId: string;
  cptCodes: string[];
  scheduledDate: Date;
  scheduledStartTime: Date;
  estimatedDuration: number;
  roomId: string;
  priority: CasePriority;
  anesthesiaType: AnesthesiaType;
  anesthesiologistId?: string;
  laterality?: Laterality;
  diagnosis: string;
  icdCodes: string[];
  teamMembers?: Partial<TeamMember>[];
  specialInstructions?: string;
}

export interface ScheduleORCaseDto {
  caseId: string;
  roomId: string;
  scheduledDate: Date;
  scheduledStartTime: Date;
  blockId?: string;
  overrideConflicts?: boolean;
}

export interface UpdateCaseStatusDto {
  caseId: string;
  status: CaseStatus;
  timestamp: Date;
  notes?: string;
}
