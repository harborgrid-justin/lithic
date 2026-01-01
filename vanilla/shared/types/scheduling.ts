// Scheduling & Appointments Types

export enum AppointmentType {
  INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
  FOLLOWUP = 'FOLLOWUP',
  ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
  URGENT_CARE = 'URGENT_CARE',
  PROCEDURE = 'PROCEDURE',
  TELEMEDICINE = 'TELEMEDICINE',
  VACCINATION = 'VACCINATION',
  LAB_WORK = 'LAB_WORK',
  IMAGING = 'IMAGING',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  appointmentType: AppointmentType;
  reason?: string;
  notes?: string;
  locationId?: string;
  roomNumber?: string;
  status: AppointmentStatus;
  checkedInAt?: string;
  checkedOutAt?: string;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Schedule {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  slotDuration: number; // minutes
  locationId?: string;
  isActive: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  providerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAvailable: boolean; // false for time off, true for extra hours
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  appointmentId?: string;
}

export interface ProviderAvailability {
  providerId: string;
  date: string;
  timeSlots: TimeSlot[];
}

export interface AppointmentCreateRequest {
  patientId: string;
  providerId: string;
  startTime: string;
  duration: number;
  appointmentType: AppointmentType;
  reason?: string;
  notes?: string;
  locationId?: string;
  roomNumber?: string;
}

export interface AppointmentUpdateRequest extends Partial<AppointmentCreateRequest> {
  status?: AppointmentStatus;
  cancelReason?: string;
}

export interface AppointmentRescheduleRequest {
  appointmentId: string;
  newStartTime: string;
  newProviderId?: string;
  reason?: string;
}

export interface AppointmentCheckInRequest {
  appointmentId: string;
  checkedInBy: string;
}

export interface AppointmentSearchFilters {
  patientId?: string;
  providerId?: string;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}

export interface ScheduleCreateRequest {
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  locationId?: string;
  effectiveDate?: string;
  expirationDate?: string;
}

export interface ScheduleExceptionCreateRequest {
  providerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAvailable: boolean;
}

export interface AvailabilityQuery {
  providerId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  appointmentType?: AppointmentType;
  duration?: number;
}

export interface WaitingRoomEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentType: AppointmentType;
  scheduledTime: string;
  checkedInAt: string;
  waitTime: number; // minutes
  roomNumber?: string;
  status: 'WAITING' | 'READY' | 'IN_ROOM';
}

export interface AppointmentReminder {
  appointmentId: string;
  patientId: string;
  reminderType: 'EMAIL' | 'SMS' | 'PHONE';
  scheduledFor: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface AppointmentStatistics {
  totalAppointments: number;
  byStatus: Record<AppointmentStatus, number>;
  byType: Record<AppointmentType, number>;
  averageDuration: number;
  noShowRate: number;
  utilizationRate: number;
}
