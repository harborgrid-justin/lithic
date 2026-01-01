/**
 * Telehealth Module Types
 * Agent 4: Telehealth Module
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Telehealth Session Types
// ============================================================================

export interface TelehealthSession extends BaseEntity {
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentId: string | null;
  encounterId: string | null;
  type: SessionType;
  status: SessionStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  roomId: string;
  roomUrl: string;
  waitingRoomId: string | null;
  participants: VideoParticipant[];
  recordingEnabled: boolean;
  recordings: SessionRecording[];
  consentObtained: boolean;
  consentObtainedAt: Date | null;
  consentSignature: string | null;
  chiefComplaint: string | null;
  notes: string | null;
  clinicalNoteId: string | null;
  prescriptionsIssued: string[];
  labOrdersCreated: string[];
  imagingOrdersCreated: string[];
  followUpRequired: boolean;
  followUpInstructions: string | null;
  technicalIssues: TechnicalIssue[];
  qualityMetrics: QualityMetrics | null;
}

export enum SessionType {
  INITIAL_CONSULTATION = "INITIAL_CONSULTATION",
  FOLLOW_UP = "FOLLOW_UP",
  URGENT_CARE = "URGENT_CARE",
  BEHAVIORAL_HEALTH = "BEHAVIORAL_HEALTH",
  SPECIALIST_CONSULTATION = "SPECIALIST_CONSULTATION",
  POST_OP_FOLLOWUP = "POST_OP_FOLLOWUP",
  MEDICATION_MANAGEMENT = "MEDICATION_MANAGEMENT",
  CHRONIC_CARE_MANAGEMENT = "CHRONIC_CARE_MANAGEMENT",
}

export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  TECHNICAL_FAILURE = "TECHNICAL_FAILURE",
}

// ============================================================================
// Video Participant Types
// ============================================================================

export interface VideoParticipant extends BaseEntity {
  sessionId: string;
  userId: string;
  userName: string;
  userType: ParticipantType;
  role: ParticipantRole;
  joinedAt: Date | null;
  leftAt: Date | null;
  connectionStatus: ConnectionStatus;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  deviceInfo: DeviceInfo;
  connectionQuality: ConnectionQuality;
  peerId: string | null;
  streamId: string | null;
}

export enum ParticipantType {
  PATIENT = "PATIENT",
  PROVIDER = "PROVIDER",
  CAREGIVER = "CAREGIVER",
  INTERPRETER = "INTERPRETER",
  SPECIALIST = "SPECIALIST",
  MEDICAL_STUDENT = "MEDICAL_STUDENT",
}

export enum ParticipantRole {
  HOST = "HOST",
  PRESENTER = "PRESENTER",
  PARTICIPANT = "PARTICIPANT",
  OBSERVER = "OBSERVER",
}

export enum ConnectionStatus {
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  DISCONNECTED = "DISCONNECTED",
  FAILED = "FAILED",
}

export enum ConnectionQuality {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  UNKNOWN = "UNKNOWN",
}

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: "desktop" | "tablet" | "mobile";
  camera: MediaDeviceInfo | null;
  microphone: MediaDeviceInfo | null;
  speakers: MediaDeviceInfo | null;
}

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: "videoinput" | "audioinput" | "audiooutput";
}

// ============================================================================
// Waiting Room Types
// ============================================================================

export interface WaitingRoomEntry extends BaseEntity {
  sessionId: string;
  patientId: string;
  patientName: string;
  appointmentTime: Date;
  checkedInAt: Date;
  position: number;
  estimatedWaitTime: number;
  status: WaitingRoomStatus;
  preVisitCompleted: boolean;
  preVisitData: PreVisitData | null;
  technicalCheckCompleted: boolean;
  technicalCheckResults: TechnicalCheckResults | null;
  notifiedProvider: boolean;
  notifiedAt: Date | null;
  admittedAt: Date | null;
  admittedBy: string | null;
}

export enum WaitingRoomStatus {
  WAITING = "WAITING",
  READY = "READY",
  PROVIDER_NOTIFIED = "PROVIDER_NOTIFIED",
  ADMITTED = "ADMITTED",
  CANCELLED = "CANCELLED",
}

export interface PreVisitData {
  chiefComplaint: string;
  symptoms: string[];
  symptomDuration: string;
  currentMedications: string[];
  allergies: string[];
  vitalSigns: VitalSignsData | null;
  reasonForVisit: string;
  questionsForProvider: string[];
}

export interface VitalSignsData {
  temperature: number | null;
  temperatureUnit: "F" | "C";
  heartRate: number | null;
  bloodPressure: string | null;
  oxygenSaturation: number | null;
  weight: number | null;
  weightUnit: "kg" | "lb";
  painLevel: number | null;
}

export interface TechnicalCheckResults {
  cameraWorking: boolean;
  microphoneWorking: boolean;
  speakersWorking: boolean;
  connectionSpeed: number;
  connectionQuality: ConnectionQuality;
  browserCompatible: boolean;
  permissionsGranted: boolean;
  completedAt: Date;
}

// ============================================================================
// Session Recording Types
// ============================================================================

export interface SessionRecording extends BaseEntity {
  sessionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  duration: number;
  format: RecordingFormat;
  quality: RecordingQuality;
  status: RecordingStatus;
  startedAt: Date;
  endedAt: Date | null;
  startedBy: string;
  stoppedBy: string | null;
  consentDocumentId: string;
  encryptionKey: string;
  retentionUntil: Date;
  viewCount: number;
  lastViewedAt: Date | null;
  transcription: string | null;
  transcriptionStatus: TranscriptionStatus;
}

export enum RecordingFormat {
  WEBM = "WEBM",
  MP4 = "MP4",
  MKV = "MKV",
}

export enum RecordingQuality {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum RecordingStatus {
  RECORDING = "RECORDING",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
  DELETED = "DELETED",
}

export enum TranscriptionStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  NOT_REQUESTED = "NOT_REQUESTED",
}

// ============================================================================
// WebRTC Signaling Types
// ============================================================================

export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string | null;
  sessionId: string;
  data: any;
  timestamp: Date;
}

export enum SignalingMessageType {
  OFFER = "OFFER",
  ANSWER = "ANSWER",
  ICE_CANDIDATE = "ICE_CANDIDATE",
  JOIN_ROOM = "JOIN_ROOM",
  LEAVE_ROOM = "LEAVE_ROOM",
  PARTICIPANT_JOINED = "PARTICIPANT_JOINED",
  PARTICIPANT_LEFT = "PARTICIPANT_LEFT",
  MUTE_AUDIO = "MUTE_AUDIO",
  UNMUTE_AUDIO = "UNMUTE_AUDIO",
  DISABLE_VIDEO = "DISABLE_VIDEO",
  ENABLE_VIDEO = "ENABLE_VIDEO",
  START_SCREEN_SHARE = "START_SCREEN_SHARE",
  STOP_SCREEN_SHARE = "STOP_SCREEN_SHARE",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
}

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
  iceTransportPolicy: "all" | "relay";
  bundlePolicy: "balanced" | "max-compat" | "max-bundle";
  rtcpMuxPolicy: "negotiate" | "require";
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: "password" | "oauth";
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | VideoConstraints;
}

export interface VideoConstraints extends MediaTrackConstraints {
  width?: ConstrainULong;
  height?: ConstrainULong;
  aspectRatio?: ConstrainDouble;
  frameRate?: ConstrainDouble;
  facingMode?: ConstrainDOMString;
  resizeMode?: ConstrainDOMString;
}

export interface ConstrainULong {
  min?: number;
  max?: number;
  ideal?: number;
  exact?: number;
}

export interface ConstrainDouble {
  min?: number;
  max?: number;
  ideal?: number;
  exact?: number;
}

export interface ConstrainDOMString {
  exact?: string | string[];
  ideal?: string | string[];
}

// ============================================================================
// Quality Metrics Types
// ============================================================================

export interface QualityMetrics {
  averageConnectionQuality: ConnectionQuality;
  packetLoss: number;
  jitter: number;
  roundTripTime: number;
  bandwidth: BandwidthMetrics;
  audioQuality: AudioQualityMetrics;
  videoQuality: VideoQualityMetrics;
  disconnections: number;
  reconnections: number;
  totalDuration: number;
}

export interface BandwidthMetrics {
  upload: number;
  download: number;
  average: number;
  peak: number;
}

export interface AudioQualityMetrics {
  bitrate: number;
  packetsLost: number;
  packetsSent: number;
  packetsReceived: number;
  audioLevel: number;
}

export interface VideoQualityMetrics {
  bitrate: number;
  frameRate: number;
  resolution: string;
  packetsLost: number;
  packetsSent: number;
  packetsReceived: number;
  framesDropped: number;
}

// ============================================================================
// Technical Issues Types
// ============================================================================

export interface TechnicalIssue {
  id: string;
  sessionId: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  occurredAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
  affectedParticipants: string[];
}

export enum IssueType {
  CONNECTION_FAILURE = "CONNECTION_FAILURE",
  POOR_AUDIO_QUALITY = "POOR_AUDIO_QUALITY",
  POOR_VIDEO_QUALITY = "POOR_VIDEO_QUALITY",
  AUDIO_ECHO = "AUDIO_ECHO",
  VIDEO_FREEZE = "VIDEO_FREEZE",
  DEVICE_FAILURE = "DEVICE_FAILURE",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  BROWSER_COMPATIBILITY = "BROWSER_COMPATIBILITY",
  NETWORK_INSTABILITY = "NETWORK_INSTABILITY",
}

export enum IssueSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// Chat Message Types
// ============================================================================

export interface ChatMessage extends BaseEntity {
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: ChatMessageType;
  attachments: ChatAttachment[];
  isPrivate: boolean;
  recipientId: string | null;
  readBy: string[];
}

export enum ChatMessageType {
  TEXT = "TEXT",
  FILE = "FILE",
  IMAGE = "IMAGE",
  SYSTEM = "SYSTEM",
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

// ============================================================================
// E-Signature Types
// ============================================================================

export interface ESignature extends BaseEntity {
  sessionId: string;
  documentType: DocumentType;
  documentId: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  signatureData: string;
  signatureMethod: SignatureMethod;
  ipAddress: string;
  timestamp: Date;
  verified: boolean;
  verificationMethod: string | null;
}

export enum DocumentType {
  CONSENT_FORM = "CONSENT_FORM",
  TREATMENT_PLAN = "TREATMENT_PLAN",
  PRESCRIPTION = "PRESCRIPTION",
  CLINICAL_NOTE = "CLINICAL_NOTE",
  REFERRAL = "REFERRAL",
  DISCHARGE_INSTRUCTIONS = "DISCHARGE_INSTRUCTIONS",
}

export enum SignatureMethod {
  DRAWN = "DRAWN",
  TYPED = "TYPED",
  UPLOADED = "UPLOADED",
  ELECTRONIC_ID = "ELECTRONIC_ID",
}

// ============================================================================
// Virtual Exam Tools Types
// ============================================================================

export interface VirtualExamTool {
  id: string;
  name: string;
  type: ExamToolType;
  enabled: boolean;
  config: Record<string, any>;
}

export enum ExamToolType {
  VITAL_SIGNS_CAPTURE = "VITAL_SIGNS_CAPTURE",
  SYMPTOM_CHECKER = "SYMPTOM_CHECKER",
  SKIN_ANALYSIS = "SKIN_ANALYSIS",
  EAR_EXAM = "EAR_EXAM",
  THROAT_EXAM = "THROAT_EXAM",
  STETHOSCOPE = "STETHOSCOPE",
  DOCUMENT_VIEWER = "DOCUMENT_VIEWER",
  WHITEBOARD = "WHITEBOARD",
  ANATOMICAL_MODELS = "ANATOMICAL_MODELS",
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateSessionDto {
  patientId: string;
  providerId: string;
  appointmentId?: string;
  type: SessionType;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  recordingEnabled?: boolean;
  notes?: string;
}

export interface UpdateSessionDto extends Partial<CreateSessionDto> {
  id: string;
  status?: SessionStatus;
  clinicalNoteId?: string;
}

export interface StartSessionDto {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
}

export interface EndSessionDto {
  sessionId: string;
  userId: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpInstructions?: string;
}

export interface JoinWaitingRoomDto {
  sessionId: string;
  patientId: string;
  preVisitData?: PreVisitData;
  technicalCheckResults?: TechnicalCheckResults;
}

export interface AdmitFromWaitingRoomDto {
  waitingRoomId: string;
  admittedBy: string;
}

export interface RecordingConsentDto {
  sessionId: string;
  patientId: string;
  consentGiven: boolean;
  signature: string;
  ipAddress: string;
}

export interface StartRecordingDto {
  sessionId: string;
  userId: string;
  quality: RecordingQuality;
  consentDocumentId: string;
}

export interface StopRecordingDto {
  recordingId: string;
  userId: string;
}

// ============================================================================
// Session Summary Types
// ============================================================================

export interface SessionSummary {
  id: string;
  patientName: string;
  providerName: string;
  type: SessionType;
  status: SessionStatus;
  scheduledStartTime: Date;
  duration: number | null;
  recordingAvailable: boolean;
  clinicalNoteCompleted: boolean;
}
