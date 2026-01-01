/**
 * Scheduling & Appointments Module Types
 * Agent 4: Scheduling
 */

import type { BaseEntity } from './index';

// ============================================================================
// Appointment Types
// ============================================================================

export interface Appointment extends BaseEntity {
  patientId: string;
  providerId: string;
  scheduleId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  startTime: Date;
  endTime: Date;
  duration: number;
  chiefComplaint: string | null;
  reason: string;
  notes: string | null;
  roomId: string | null;
  checkInTime: Date | null;
  checkInBy: string | null;
  checkOutTime: Date | null;
  checkOutBy: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  noShowReason: string | null;
  confirmedAt: Date | null;
  confirmationMethod: ConfirmationMethod | null;
  reminders: AppointmentReminder[];
  recurrenceId: string | null;
  isRecurring: boolean;
  waitlistId: string | null;
  encounterId: string | null;
  telehealth: boolean;
  telehealthUrl: string | null;
  instructions: string | null;
}

export enum AppointmentType {
  NEW_PATIENT = 'NEW_PATIENT',
  FOLLOW_UP = 'FOLLOW_UP',
  ANNUAL_PHYSICAL = 'ANNUAL_PHYSICAL',
  WELL_CHILD = 'WELL_CHILD',
  SICK_VISIT = 'SICK_VISIT',
  CONSULTATION = 'CONSULTATION',
  PROCEDURE = 'PROCEDURE',
  SURGERY = 'SURGERY',
  THERAPY = 'THERAPY',
  LAB_ONLY = 'LAB_ONLY',
  IMAGING_ONLY = 'IMAGING_ONLY',
  VACCINE = 'VACCINE',
  TELEHEALTH = 'TELEHEALTH',
  WALK_IN = 'WALK_IN',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
  WAITLIST = 'WAITLIST',
}

export enum AppointmentPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  ASAP = 'ASAP',
  STAT = 'STAT',
}

export enum ConfirmationMethod {
  PHONE = 'PHONE',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PORTAL = 'PORTAL',
  IN_PERSON = 'IN_PERSON',
}

// ============================================================================
// Appointment Reminder Types
// ============================================================================

export interface AppointmentReminder extends BaseEntity {
  appointmentId: string;
  type: ReminderType;
  method: ReminderMethod;
  scheduledFor: Date;
  sentAt: Date | null;
  status: ReminderStatus;
  recipient: string;
  message: string | null;
  response: string | null;
  errorMessage: string | null;
}

export enum ReminderType {
  CONFIRMATION = 'CONFIRMATION',
  REMINDER_24H = 'REMINDER_24H',
  REMINDER_1H = 'REMINDER_1H',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum ReminderMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  PUSH = 'PUSH',
}

export enum ReminderStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// Schedule Types
// ============================================================================

export interface Schedule extends BaseEntity {
  providerId: string;
  facilityId: string;
  name: string;
  type: ScheduleType;
  status: ScheduleStatus;
  effectiveDate: Date;
  expirationDate: Date | null;
  timeSlots: TimeSlot[];
  exceptions: ScheduleException[];
  recurrenceRule: RecurrenceRule | null;
  allowOverlap: boolean;
  maxConcurrent: number;
  bufferTime: number;
}

export enum ScheduleType {
  PROVIDER = 'PROVIDER',
  ROOM = 'ROOM',
  EQUIPMENT = 'EQUIPMENT',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export interface TimeSlot extends BaseEntity {
  scheduleId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  appointmentTypes: AppointmentType[];
  capacity: number;
  duration: number;
  isAvailable: boolean;
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

export interface ScheduleException extends BaseEntity {
  scheduleId: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  type: ExceptionType;
  reason: string;
  isRecurring: boolean;
}

export enum ExceptionType {
  CLOSED = 'CLOSED',
  HOLIDAY = 'HOLIDAY',
  VACATION = 'VACATION',
  CONFERENCE = 'CONFERENCE',
  EMERGENCY = 'EMERGENCY',
  CUSTOM = 'CUSTOM',
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: DayOfWeek[] | null;
  byMonthDay: number[] | null;
  byMonth: number[] | null;
}

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

// ============================================================================
// Waitlist Types
// ============================================================================

export interface Waitlist extends BaseEntity {
  patientId: string;
  providerId: string | null;
  appointmentType: AppointmentType;
  preferredDates: Date[];
  preferredTimes: PreferredTime[];
  priority: WaitlistPriority;
  status: WaitlistStatus;
  reason: string;
  notes: string | null;
  addedDate: Date;
  notifiedAt: Date | null;
  notificationMethod: ReminderMethod | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  appointmentId: string | null;
}

export enum PreferredTime {
  EARLY_MORNING = 'EARLY_MORNING',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  ANY = 'ANY',
}

export enum WaitlistPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum WaitlistStatus {
  ACTIVE = 'ACTIVE',
  NOTIFIED = 'NOTIFIED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// Room & Resource Types
// ============================================================================

export interface Room extends BaseEntity {
  facilityId: string;
  name: string;
  number: string;
  type: RoomType;
  capacity: number;
  equipment: string[];
  status: RoomStatus;
  floor: string | null;
  building: string | null;
  notes: string | null;
}

export enum RoomType {
  EXAM_ROOM = 'EXAM_ROOM',
  PROCEDURE_ROOM = 'PROCEDURE_ROOM',
  OPERATING_ROOM = 'OPERATING_ROOM',
  TREATMENT_ROOM = 'TREATMENT_ROOM',
  CONSULTATION_ROOM = 'CONSULTATION_ROOM',
  LAB = 'LAB',
  IMAGING = 'IMAGING',
  WAITING_AREA = 'WAITING_AREA',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface Equipment extends BaseEntity {
  name: string;
  type: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  purchaseDate: Date | null;
  warrantyExpiry: Date | null;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  status: EquipmentStatus;
  location: string | null;
  notes: string | null;
}

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RETIRED = 'RETIRED',
}

// ============================================================================
// Availability Types
// ============================================================================

export interface AvailabilitySlot {
  scheduleId: string;
  providerId: string;
  providerName: string;
  facilityId: string;
  facilityName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  appointmentType: AppointmentType;
  roomId: string | null;
}

export interface AvailabilityQuery {
  providerId?: string;
  facilityId?: string;
  appointmentType: AppointmentType;
  startDate: Date;
  endDate: Date;
  duration: number;
  preferredTimes?: PreferredTime[];
}

// ============================================================================
// Check-In/Check-Out Types
// ============================================================================

export interface CheckIn {
  appointmentId: string;
  patientId: string;
  checkInTime: Date;
  checkInBy: string;
  method: CheckInMethod;
  insuranceVerified: boolean;
  copayCollected: boolean;
  copayAmount: number | null;
  formsCompleted: string[];
  notes: string | null;
}

export enum CheckInMethod {
  FRONT_DESK = 'FRONT_DESK',
  KIOSK = 'KIOSK',
  MOBILE = 'MOBILE',
  PORTAL = 'PORTAL',
}

export interface CheckOut {
  appointmentId: string;
  patientId: string;
  checkOutTime: Date;
  checkOutBy: string;
  followUpScheduled: boolean;
  followUpAppointmentId: string | null;
  prescriptionsGiven: boolean;
  labOrdersGiven: boolean;
  referralsGiven: boolean;
  nextVisitInstructions: string | null;
  notes: string | null;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateAppointmentDto {
  patientId: string;
  providerId: string;
  appointmentType: AppointmentType;
  startTime: Date;
  duration: number;
  reason: string;
  chiefComplaint?: string;
  notes?: string;
  telehealth?: boolean;
  sendReminders?: boolean;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {
  id: string;
}

export interface RescheduleAppointmentDto {
  appointmentId: string;
  newStartTime: Date;
  reason: string;
}

export interface CancelAppointmentDto {
  appointmentId: string;
  reason: string;
  notifyPatient?: boolean;
}

export interface AppointmentSearchQuery {
  patientId?: string;
  providerId?: string;
  facilityId?: string;
  status?: AppointmentStatus[];
  startDate?: Date;
  endDate?: Date;
  appointmentType?: AppointmentType;
}

export interface AppointmentSummary {
  id: string;
  patientName: string;
  providerName: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  chiefComplaint: string | null;
  roomName: string | null;
}
