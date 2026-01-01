/**
 * Scheduling Engine - Enterprise Scheduling System
 * Multi-resource scheduling with constraint satisfaction
 * Rivals Epic's Cadence scheduling system
 */

import {
  addMinutes,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isBefore,
  isAfter,
  differenceInMinutes,
  parseISO,
  format,
  setHours,
  setMinutes,
} from "date-fns";
import type {
  Appointment,
  Schedule,
  TimeSlot,
  AppointmentType,
  AppointmentStatus,
  Room,
  Equipment,
  ScheduleException,
} from "@/types/scheduling";

// ============================================================================
// Types
// ============================================================================

export interface SchedulingConstraint {
  type: ConstraintType;
  priority: ConstraintPriority;
  validate: (context: SchedulingContext) => ConstraintResult;
}

export enum ConstraintType {
  PROVIDER_AVAILABILITY = "PROVIDER_AVAILABILITY",
  ROOM_AVAILABILITY = "ROOM_AVAILABILITY",
  EQUIPMENT_AVAILABILITY = "EQUIPMENT_AVAILABILITY",
  APPOINTMENT_DURATION = "APPOINTMENT_DURATION",
  BUFFER_TIME = "BUFFER_TIME",
  MAX_CONCURRENT = "MAX_CONCURRENT",
  BUSINESS_HOURS = "BUSINESS_HOURS",
  BREAK_GLASS = "BREAK_GLASS",
  PATIENT_PREFERENCE = "PATIENT_PREFERENCE",
  DOUBLE_BOOKING = "DOUBLE_BOOKING",
  APPOINTMENT_TYPE = "APPOINTMENT_TYPE",
}

export enum ConstraintPriority {
  CRITICAL = 1, // Must satisfy
  HIGH = 2, // Should satisfy
  MEDIUM = 3, // Nice to have
  LOW = 4, // Optional
}

export interface ConstraintResult {
  satisfied: boolean;
  message: string;
  suggestion?: SchedulingSuggestion;
}

export interface SchedulingContext {
  appointment: Partial<Appointment>;
  schedule: Schedule;
  existingAppointments: Appointment[];
  rooms?: Room[];
  equipment?: Equipment[];
  allowOverbooking?: boolean;
  breakGlass?: boolean;
}

export interface SchedulingSuggestion {
  alternateTime?: Date;
  alternateProvider?: string;
  alternateRoom?: string;
  reason: string;
}

export interface BlockSchedule {
  id: string;
  providerId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  appointmentType: AppointmentType;
  capacity: number;
  duration: number;
  booked: number;
  allowWalkIns: boolean;
  requiresAuthorization: boolean;
  notes?: string;
}

export interface OverbookingRule {
  id: string;
  providerId?: string;
  appointmentType?: AppointmentType;
  maxOverbooking: number;
  timeWindow: number; // minutes
  requiresApproval: boolean;
  approvers: string[];
}

export interface ScheduleConflict {
  appointmentId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  details: string;
  resolution?: ConflictResolution;
}

export enum ConflictType {
  DOUBLE_BOOKING = "DOUBLE_BOOKING",
  ROOM_CONFLICT = "ROOM_CONFLICT",
  EQUIPMENT_CONFLICT = "EQUIPMENT_CONFLICT",
  INSUFFICIENT_TIME = "INSUFFICIENT_TIME",
  OUTSIDE_HOURS = "OUTSIDE_HOURS",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
}

export enum ConflictSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface ConflictResolution {
  action: ResolutionAction;
  newTime?: Date;
  newProvider?: string;
  newRoom?: string;
  notes: string;
}

export enum ResolutionAction {
  RESCHEDULE = "RESCHEDULE",
  REASSIGN_PROVIDER = "REASSIGN_PROVIDER",
  REASSIGN_ROOM = "REASSIGN_ROOM",
  CANCEL = "CANCEL",
  OVERRIDE = "OVERRIDE",
}

// ============================================================================
// Scheduling Engine Class
// ============================================================================

export class SchedulingEngine {
  private constraints: SchedulingConstraint[] = [];
  private overbookingRules: OverbookingRule[] = [];

  constructor() {
    this.initializeDefaultConstraints();
  }

  // --------------------------------------------------------------------------
  // Constraint Management
  // --------------------------------------------------------------------------

  private initializeDefaultConstraints() {
    // Provider availability constraint
    this.addConstraint({
      type: ConstraintType.PROVIDER_AVAILABILITY,
      priority: ConstraintPriority.CRITICAL,
      validate: (context) => this.validateProviderAvailability(context),
    });

    // Room availability constraint
    this.addConstraint({
      type: ConstraintType.ROOM_AVAILABILITY,
      priority: ConstraintPriority.HIGH,
      validate: (context) => this.validateRoomAvailability(context),
    });

    // Duration constraint
    this.addConstraint({
      type: ConstraintType.APPOINTMENT_DURATION,
      priority: ConstraintPriority.CRITICAL,
      validate: (context) => this.validateDuration(context),
    });

    // Buffer time constraint
    this.addConstraint({
      type: ConstraintType.BUFFER_TIME,
      priority: ConstraintPriority.MEDIUM,
      validate: (context) => this.validateBufferTime(context),
    });

    // Double booking constraint
    this.addConstraint({
      type: ConstraintType.DOUBLE_BOOKING,
      priority: ConstraintPriority.CRITICAL,
      validate: (context) => this.validateDoubleBooking(context),
    });
  }

  addConstraint(constraint: SchedulingConstraint): void {
    this.constraints.push(constraint);
    this.constraints.sort((a, b) => a.priority - b.priority);
  }

  removeConstraint(type: ConstraintType): void {
    this.constraints = this.constraints.filter((c) => c.type !== type);
  }

  // --------------------------------------------------------------------------
  // Appointment Validation
  // --------------------------------------------------------------------------

  validateAppointment(context: SchedulingContext): {
    valid: boolean;
    violations: ConstraintResult[];
    suggestions: SchedulingSuggestion[];
  } {
    const violations: ConstraintResult[] = [];
    const suggestions: SchedulingSuggestion[] = [];

    for (const constraint of this.constraints) {
      const result = constraint.validate(context);
      if (!result.satisfied) {
        violations.push(result);
        if (result.suggestion) {
          suggestions.push(result.suggestion);
        }

        // If critical constraint fails, stop validation
        if (constraint.priority === ConstraintPriority.CRITICAL) {
          break;
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      suggestions,
    };
  }

  // --------------------------------------------------------------------------
  // Constraint Validators
  // --------------------------------------------------------------------------

  private validateProviderAvailability(
    context: SchedulingContext,
  ): ConstraintResult {
    const { appointment, schedule } = context;
    const appointmentStart = new Date(appointment.startTime!);
    const appointmentEnd = addMinutes(
      appointmentStart,
      appointment.duration || 30,
    );

    // Check if appointment falls within schedule exceptions (PTO, holidays, etc.)
    const exceptions = schedule.exceptions || [];
    for (const exception of exceptions) {
      const exceptionDate = new Date(exception.date);
      if (
        format(appointmentStart, "yyyy-MM-dd") ===
        format(exceptionDate, "yyyy-MM-dd")
      ) {
        const nextAvailable = this.findNextAvailableSlot(
          context,
          addDays(appointmentStart, 1),
        );
        return {
          satisfied: false,
          message: `Provider unavailable on ${format(appointmentStart, "MMM dd, yyyy")} - ${exception.reason}`,
          suggestion: nextAvailable
            ? {
                alternateTime: nextAvailable,
                reason: "Next available slot",
              }
            : undefined,
        };
      }
    }

    // Check if appointment falls within working hours
    const dayOfWeek = appointmentStart.getDay();
    const timeSlots = schedule.timeSlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable,
    );

    if (timeSlots.length === 0) {
      return {
        satisfied: false,
        message: `Provider not working on ${format(appointmentStart, "EEEE")}`,
      };
    }

    const appointmentTime = format(appointmentStart, "HH:mm");
    const appointmentEndTime = format(appointmentEnd, "HH:mm");

    const withinSlot = timeSlots.some((slot) => {
      return appointmentTime >= slot.startTime && appointmentEndTime <= slot.endTime;
    });

    if (!withinSlot) {
      return {
        satisfied: false,
        message: `Appointment time ${appointmentTime} outside provider working hours`,
      };
    }

    return {
      satisfied: true,
      message: "Provider available",
    };
  }

  private validateRoomAvailability(
    context: SchedulingContext,
  ): ConstraintResult {
    const { appointment, existingAppointments } = context;

    if (!appointment.roomId) {
      return {
        satisfied: true,
        message: "No room required",
      };
    }

    const appointmentStart = new Date(appointment.startTime!);
    const appointmentEnd = addMinutes(
      appointmentStart,
      appointment.duration || 30,
    );

    // Check for room conflicts
    const roomConflicts = existingAppointments.filter((appt) => {
      if (appt.id === appointment.id) return false; // Skip self
      if (appt.roomId !== appointment.roomId) return false;
      if (
        appt.status === AppointmentStatus.CANCELLED ||
        appt.status === AppointmentStatus.NO_SHOW
      )
        return false;

      const existingStart = new Date(appt.startTime);
      const existingEnd = new Date(appt.endTime);

      return (
        (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
        (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
      );
    });

    if (roomConflicts.length > 0) {
      return {
        satisfied: false,
        message: `Room ${appointment.roomId} already booked`,
      };
    }

    return {
      satisfied: true,
      message: "Room available",
    };
  }

  private validateDuration(context: SchedulingContext): ConstraintResult {
    const { appointment, schedule } = context;

    if (!appointment.duration || appointment.duration <= 0) {
      return {
        satisfied: false,
        message: "Invalid appointment duration",
      };
    }

    const appointmentStart = new Date(appointment.startTime!);
    const dayOfWeek = appointmentStart.getDay();
    const appointmentTime = format(appointmentStart, "HH:mm");

    const matchingSlots = schedule.timeSlots.filter(
      (slot) =>
        slot.dayOfWeek === dayOfWeek &&
        slot.isAvailable &&
        appointmentTime >= slot.startTime,
    );

    if (matchingSlots.length === 0) {
      return {
        satisfied: false,
        message: "No matching time slots",
      };
    }

    return {
      satisfied: true,
      message: "Duration valid",
    };
  }

  private validateBufferTime(context: SchedulingContext): ConstraintResult {
    const { appointment, schedule, existingAppointments } = context;
    const bufferTime = schedule.bufferTime || 0;

    if (bufferTime === 0) {
      return {
        satisfied: true,
        message: "No buffer time required",
      };
    }

    const appointmentStart = new Date(appointment.startTime!);
    const appointmentEnd = addMinutes(
      appointmentStart,
      appointment.duration || 30,
    );

    // Check buffer before
    const beforeBuffer = addMinutes(appointmentStart, -bufferTime);
    const conflictBefore = existingAppointments.some((appt) => {
      if (appt.id === appointment.id) return false;
      const existingEnd = new Date(appt.endTime);
      return existingEnd > beforeBuffer && existingEnd <= appointmentStart;
    });

    // Check buffer after
    const afterBuffer = addMinutes(appointmentEnd, bufferTime);
    const conflictAfter = existingAppointments.some((appt) => {
      if (appt.id === appointment.id) return false;
      const existingStart = new Date(appt.startTime);
      return existingStart >= appointmentEnd && existingStart < afterBuffer;
    });

    if (conflictBefore || conflictAfter) {
      return {
        satisfied: false,
        message: `Insufficient buffer time (${bufferTime} minutes required)`,
      };
    }

    return {
      satisfied: true,
      message: "Buffer time satisfied",
    };
  }

  private validateDoubleBooking(context: SchedulingContext): ConstraintResult {
    const { appointment, schedule, existingAppointments, allowOverbooking } =
      context;

    const appointmentStart = new Date(appointment.startTime!);
    const appointmentEnd = addMinutes(
      appointmentStart,
      appointment.duration || 30,
    );

    // Count concurrent appointments
    const concurrentAppointments = existingAppointments.filter((appt) => {
      if (appt.id === appointment.id) return false;
      if (
        appt.status === AppointmentStatus.CANCELLED ||
        appt.status === AppointmentStatus.NO_SHOW
      )
        return false;

      const existingStart = new Date(appt.startTime);
      const existingEnd = new Date(appt.endTime);

      return (
        (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
        (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
      );
    });

    const maxConcurrent = schedule.maxConcurrent || 1;
    const currentCount = concurrentAppointments.length;

    if (currentCount >= maxConcurrent && !allowOverbooking) {
      return {
        satisfied: false,
        message: `Maximum concurrent appointments (${maxConcurrent}) exceeded`,
      };
    }

    if (currentCount >= maxConcurrent && allowOverbooking) {
      return {
        satisfied: true,
        message: `Overbooked with ${currentCount} concurrent appointments (requires approval)`,
      };
    }

    return {
      satisfied: true,
      message: "No double booking conflict",
    };
  }

  // --------------------------------------------------------------------------
  // Block Scheduling
  // --------------------------------------------------------------------------

  createBlockSchedule(params: {
    providerId: string;
    name: string;
    startTime: Date;
    endTime: Date;
    appointmentType: AppointmentType;
    slotDuration: number;
    capacity?: number;
  }): BlockSchedule {
    const duration = differenceInMinutes(params.endTime, params.startTime);
    const slots = Math.floor(duration / params.slotDuration);

    return {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: params.providerId,
      name: params.name,
      startTime: params.startTime,
      endTime: params.endTime,
      appointmentType: params.appointmentType,
      capacity: params.capacity || slots,
      duration: params.slotDuration,
      booked: 0,
      allowWalkIns: true,
      requiresAuthorization: false,
    };
  }

  canBookInBlock(
    block: BlockSchedule,
    appointmentDuration: number,
  ): {
    canBook: boolean;
    reason?: string;
  } {
    if (block.booked >= block.capacity) {
      return {
        canBook: false,
        reason: "Block schedule at capacity",
      };
    }

    if (appointmentDuration !== block.duration) {
      return {
        canBook: false,
        reason: `Duration must be ${block.duration} minutes`,
      };
    }

    const now = new Date();
    if (isBefore(block.startTime, now)) {
      return {
        canBook: false,
        reason: "Block schedule has passed",
      };
    }

    return {
      canBook: true,
    };
  }

  // --------------------------------------------------------------------------
  // Overbooking Management
  // --------------------------------------------------------------------------

  addOverbookingRule(rule: OverbookingRule): void {
    this.overbookingRules.push(rule);
  }

  canOverbook(
    providerId: string,
    appointmentType: AppointmentType,
    startTime: Date,
    existingAppointments: Appointment[],
  ): {
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
  } {
    // Find applicable overbooking rules
    const applicableRules = this.overbookingRules.filter(
      (rule) =>
        (!rule.providerId || rule.providerId === providerId) &&
        (!rule.appointmentType || rule.appointmentType === appointmentType),
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: "No overbooking rules configured",
      };
    }

    // Use the most permissive rule
    const rule = applicableRules.sort(
      (a, b) => b.maxOverbooking - a.maxOverbooking,
    )[0];

    // Count appointments in time window
    const windowStart = addMinutes(startTime, -rule.timeWindow / 2);
    const windowEnd = addMinutes(startTime, rule.timeWindow / 2);

    const appointmentsInWindow = existingAppointments.filter((appt) => {
      if (
        appt.status === AppointmentStatus.CANCELLED ||
        appt.status === AppointmentStatus.NO_SHOW
      )
        return false;

      const apptStart = new Date(appt.startTime);
      return isWithinInterval(apptStart, { start: windowStart, end: windowEnd });
    });

    if (appointmentsInWindow.length >= rule.maxOverbooking) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Maximum overbooking (${rule.maxOverbooking}) exceeded in time window`,
      };
    }

    return {
      allowed: true,
      requiresApproval: rule.requiresApproval,
    };
  }

  // --------------------------------------------------------------------------
  // Conflict Detection & Resolution
  // --------------------------------------------------------------------------

  detectConflicts(
    appointments: Appointment[],
    schedules: Schedule[],
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (const appointment of appointments) {
      const schedule = schedules.find(
        (s) => s.providerId === appointment.providerId,
      );
      if (!schedule) continue;

      const context: SchedulingContext = {
        appointment,
        schedule,
        existingAppointments: appointments.filter(
          (a) => a.id !== appointment.id,
        ),
      };

      const validation = this.validateAppointment(context);
      if (!validation.valid) {
        for (const violation of validation.violations) {
          conflicts.push({
            appointmentId: appointment.id,
            conflictType: this.mapViolationToConflictType(violation.message),
            severity: ConflictSeverity.HIGH,
            details: violation.message,
          });
        }
      }
    }

    return conflicts;
  }

  private mapViolationToConflictType(message: string): ConflictType {
    if (message.includes("double booking") || message.includes("concurrent"))
      return ConflictType.DOUBLE_BOOKING;
    if (message.includes("room")) return ConflictType.ROOM_CONFLICT;
    if (message.includes("equipment")) return ConflictType.EQUIPMENT_CONFLICT;
    if (message.includes("duration") || message.includes("buffer"))
      return ConflictType.INSUFFICIENT_TIME;
    if (message.includes("unavailable") || message.includes("PTO"))
      return ConflictType.PROVIDER_UNAVAILABLE;
    return ConflictType.OUTSIDE_HOURS;
  }

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  private findNextAvailableSlot(
    context: SchedulingContext,
    afterDate: Date,
  ): Date | null {
    const { schedule, appointment } = context;
    const duration = appointment.duration || 30;

    // Search up to 30 days ahead
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(afterDate, i);
      const dayOfWeek = checkDate.getDay();

      const timeSlots = schedule.timeSlots.filter(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable,
      );

      for (const slot of timeSlots) {
        const [hours, minutes] = slot.startTime.split(":").map(Number);
        const slotStart = setMinutes(setHours(checkDate, hours), minutes);

        const testAppointment = {
          ...appointment,
          startTime: slotStart,
          duration,
        };

        const testContext = {
          ...context,
          appointment: testAppointment,
        };

        const validation = this.validateAppointment(testContext);
        if (validation.valid) {
          return slotStart;
        }
      }
    }

    return null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let engineInstance: SchedulingEngine | null = null;

export function getSchedulingEngine(): SchedulingEngine {
  if (!engineInstance) {
    engineInstance = new SchedulingEngine();
  }
  return engineInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateAppointmentEnd(
  startTime: Date,
  duration: number,
): Date {
  return addMinutes(startTime, duration);
}

export function checkAppointmentOverlap(
  appt1: { startTime: Date; endTime: Date },
  appt2: { startTime: Date; endTime: Date },
): boolean {
  return (
    (appt1.startTime >= appt2.startTime && appt1.startTime < appt2.endTime) ||
    (appt1.endTime > appt2.startTime && appt1.endTime <= appt2.endTime) ||
    (appt1.startTime <= appt2.startTime && appt1.endTime >= appt2.endTime)
  );
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  date: Date,
): Date[] {
  const slots: Date[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let current = setMinutes(setHours(date, startHour), startMin);
  const end = setMinutes(setHours(date, endHour), endMin);

  while (isBefore(current, end)) {
    slots.push(current);
    current = addMinutes(current, duration);
  }

  return slots;
}
