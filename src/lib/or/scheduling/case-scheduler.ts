/**
 * OR Case Scheduler
 * Advanced surgical case scheduling with conflict detection
 */

import {
  addMinutes,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  differenceInMinutes,
  format,
  isBefore,
  isAfter,
  parseISO,
} from "date-fns";
import type {
  SurgicalCase,
  CaseStatus,
  CasePriority,
  OperatingRoom,
  ORBlock,
  ScheduleConflict,
  ConflictType,
  ConflictSeverity,
  CreateORCaseDto,
  ScheduleORCaseDto,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface SchedulingConstraint {
  type: ConstraintType;
  satisfied: boolean;
  message: string;
  severity: ConflictSeverity;
}

export enum ConstraintType {
  ROOM_AVAILABLE = "ROOM_AVAILABLE",
  SURGEON_AVAILABLE = "SURGEON_AVAILABLE",
  ANESTHESIA_AVAILABLE = "ANESTHESIA_AVAILABLE",
  STAFF_AVAILABLE = "STAFF_AVAILABLE",
  EQUIPMENT_AVAILABLE = "EQUIPMENT_AVAILABLE",
  BLOCK_TIME = "BLOCK_TIME",
  TURNOVER_TIME = "TURNOVER_TIME",
  DURATION_VALID = "DURATION_VALID",
  BUSINESS_HOURS = "BUSINESS_HOURS",
}

export interface SchedulingContext {
  case: Partial<SurgicalCase> | CreateORCaseDto;
  room: OperatingRoom;
  existingCases: SurgicalCase[];
  blocks: ORBlock[];
  availableStaff: string[];
  date: Date;
  allowOverride?: boolean;
}

export interface SchedulingResult {
  success: boolean;
  conflicts: ScheduleConflict[];
  constraints: SchedulingConstraint[];
  suggestedTimes?: Date[];
  message: string;
}

export interface DurationEstimate {
  procedureId: string;
  surgeonId: string;
  estimatedDuration: number;
  confidence: number;
  factors: {
    procedureAverage: number;
    surgeonAverage: number;
    patientComplexity: number;
    historicalVariance: number;
  };
}

// ============================================================================
// Case Scheduler Class
// ============================================================================

export class CaseScheduler {
  private readonly MIN_TURNOVER_TIME = 15; // minutes
  private readonly MAX_TURNOVER_TIME = 45; // minutes
  private readonly STANDARD_TURNOVER = 30; // minutes
  private readonly PRIME_TIME_START = 7; // 7 AM
  private readonly PRIME_TIME_END = 15; // 3 PM

  // --------------------------------------------------------------------------
  // Validation & Conflict Detection
  // --------------------------------------------------------------------------

  validateSchedule(context: SchedulingContext): SchedulingResult {
    const constraints: SchedulingConstraint[] = [];
    const conflicts: ScheduleConflict[] = [];

    // Check room availability
    const roomConstraint = this.checkRoomAvailability(context);
    constraints.push(roomConstraint);
    if (!roomConstraint.satisfied) {
      conflicts.push(this.constraintToConflict(roomConstraint, context));
    }

    // Check surgeon availability
    const surgeonConstraint = this.checkSurgeonAvailability(context);
    constraints.push(surgeonConstraint);
    if (!surgeonConstraint.satisfied) {
      conflicts.push(this.constraintToConflict(surgeonConstraint, context));
    }

    // Check anesthesia availability
    const anesthesiaConstraint = this.checkAnesthesiaAvailability(context);
    constraints.push(anesthesiaConstraint);
    if (!anesthesiaConstraint.satisfied) {
      conflicts.push(this.constraintToConflict(anesthesiaConstraint, context));
    }

    // Check turnover time
    const turnoverConstraint = this.checkTurnoverTime(context);
    constraints.push(turnoverConstraint);
    if (!turnoverConstraint.satisfied) {
      conflicts.push(this.constraintToConflict(turnoverConstraint, context));
    }

    // Check block time compliance
    const blockConstraint = this.checkBlockTimeCompliance(context);
    constraints.push(blockConstraint);
    if (!blockConstraint.satisfied && !context.allowOverride) {
      conflicts.push(this.constraintToConflict(blockConstraint, context));
    }

    // Check business hours
    const hoursConstraint = this.checkBusinessHours(context);
    constraints.push(hoursConstraint);
    if (!hoursConstraint.satisfied) {
      conflicts.push(this.constraintToConflict(hoursConstraint, context));
    }

    const criticalConflicts = conflicts.filter(
      (c) => c.severity === ConflictSeverity.CRITICAL
    );

    const success = criticalConflicts.length === 0;

    return {
      success,
      conflicts,
      constraints,
      suggestedTimes: success ? undefined : this.findAlternativeTimes(context),
      message: success
        ? "Case can be scheduled"
        : `Found ${criticalConflicts.length} critical conflicts`,
    };
  }

  // --------------------------------------------------------------------------
  // Constraint Checkers
  // --------------------------------------------------------------------------

  private checkRoomAvailability(
    context: SchedulingContext
  ): SchedulingConstraint {
    const { case: surgicalCase, room, existingCases } = context;
    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );
    const duration = surgicalCase.estimatedDuration || 60;
    const endTime = addMinutes(startTime, duration);

    // Check if room is in service
    if (!room.isActive) {
      return {
        type: ConstraintType.ROOM_AVAILABLE,
        satisfied: false,
        message: `Room ${room.roomName} is not active`,
        severity: ConflictSeverity.CRITICAL,
      };
    }

    // Check for overlapping cases
    const overlappingCases = existingCases.filter((existingCase) => {
      if (existingCase.id === (surgicalCase as any).id) return false;
      if (existingCase.roomId !== room.id) return false;
      if (
        existingCase.status === CaseStatus.CANCELLED ||
        existingCase.status === CaseStatus.COMPLETED
      )
        return false;

      const existingStart = new Date(existingCase.scheduledStartTime);
      const existingEnd = addMinutes(
        existingStart,
        existingCase.estimatedDuration + this.STANDARD_TURNOVER
      );

      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (overlappingCases.length > 0) {
      return {
        type: ConstraintType.ROOM_AVAILABLE,
        satisfied: false,
        message: `Room ${room.roomName} has ${overlappingCases.length} conflicting case(s)`,
        severity: ConflictSeverity.CRITICAL,
      };
    }

    return {
      type: ConstraintType.ROOM_AVAILABLE,
      satisfied: true,
      message: "Room is available",
      severity: ConflictSeverity.INFO,
    };
  }

  private checkSurgeonAvailability(
    context: SchedulingContext
  ): SchedulingConstraint {
    const { case: surgicalCase, existingCases } = context;
    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );
    const duration = surgicalCase.estimatedDuration || 60;
    const endTime = addMinutes(startTime, duration);
    const surgeonId =
      (surgicalCase as any).surgeonId || (surgicalCase as any).surgeon;

    // Check for double-booked surgeon
    const surgeonConflicts = existingCases.filter((existingCase) => {
      if (existingCase.id === (surgicalCase as any).id) return false;
      if (existingCase.surgeonId !== surgeonId) return false;
      if (
        existingCase.status === CaseStatus.CANCELLED ||
        existingCase.status === CaseStatus.COMPLETED
      )
        return false;

      const existingStart = new Date(existingCase.scheduledStartTime);
      const existingEnd = addMinutes(
        existingStart,
        existingCase.estimatedDuration
      );

      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (surgeonConflicts.length > 0) {
      return {
        type: ConstraintType.SURGEON_AVAILABLE,
        satisfied: false,
        message: `Surgeon has ${surgeonConflicts.length} conflicting case(s)`,
        severity: ConflictSeverity.CRITICAL,
      };
    }

    return {
      type: ConstraintType.SURGEON_AVAILABLE,
      satisfied: true,
      message: "Surgeon is available",
      severity: ConflictSeverity.INFO,
    };
  }

  private checkAnesthesiaAvailability(
    context: SchedulingContext
  ): SchedulingConstraint {
    const { case: surgicalCase, existingCases } = context;
    const anesthesiologistId = (surgicalCase as any).anesthesiologistId;

    if (!anesthesiologistId) {
      return {
        type: ConstraintType.ANESTHESIA_AVAILABLE,
        satisfied: true,
        message: "No anesthesiologist assigned yet",
        severity: ConflictSeverity.INFO,
      };
    }

    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );
    const duration = surgicalCase.estimatedDuration || 60;
    const endTime = addMinutes(startTime, duration);

    // Check for double-booked anesthesiologist
    const anesthesiaConflicts = existingCases.filter((existingCase) => {
      if (existingCase.id === (surgicalCase as any).id) return false;
      if (existingCase.anesthesiologistId !== anesthesiologistId) return false;
      if (
        existingCase.status === CaseStatus.CANCELLED ||
        existingCase.status === CaseStatus.COMPLETED
      )
        return false;

      const existingStart = new Date(existingCase.scheduledStartTime);
      const existingEnd = addMinutes(
        existingStart,
        existingCase.estimatedDuration
      );

      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (anesthesiaConflicts.length > 0) {
      return {
        type: ConstraintType.ANESTHESIA_AVAILABLE,
        satisfied: false,
        message: `Anesthesiologist has ${anesthesiaConflicts.length} conflicting case(s)`,
        severity: ConflictSeverity.HIGH,
      };
    }

    return {
      type: ConstraintType.ANESTHESIA_AVAILABLE,
      satisfied: true,
      message: "Anesthesiologist is available",
      severity: ConflictSeverity.INFO,
    };
  }

  private checkTurnoverTime(context: SchedulingContext): SchedulingConstraint {
    const { case: surgicalCase, existingCases, room } = context;
    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );

    // Find preceding case in same room
    const precedingCases = existingCases
      .filter((c) => {
        if (c.roomId !== room.id) return false;
        if (
          c.status === CaseStatus.CANCELLED ||
          c.status === CaseStatus.COMPLETED
        )
          return false;
        const caseEnd = addMinutes(
          new Date(c.scheduledStartTime),
          c.estimatedDuration
        );
        return isBefore(caseEnd, startTime);
      })
      .sort(
        (a, b) =>
          new Date(b.scheduledStartTime).getTime() -
          new Date(a.scheduledStartTime).getTime()
      );

    if (precedingCases.length === 0) {
      return {
        type: ConstraintType.TURNOVER_TIME,
        satisfied: true,
        message: "First case of the day",
        severity: ConflictSeverity.INFO,
      };
    }

    const precedingCase = precedingCases[0];
    const precedingEnd = addMinutes(
      new Date(precedingCase.scheduledStartTime),
      precedingCase.estimatedDuration
    );
    const turnoverTime = differenceInMinutes(startTime, precedingEnd);
    const requiredTurnover = room.turnoverDuration || this.STANDARD_TURNOVER;

    if (turnoverTime < requiredTurnover) {
      return {
        type: ConstraintType.TURNOVER_TIME,
        satisfied: false,
        message: `Insufficient turnover time: ${turnoverTime} min (required: ${requiredTurnover} min)`,
        severity: ConflictSeverity.HIGH,
      };
    }

    return {
      type: ConstraintType.TURNOVER_TIME,
      satisfied: true,
      message: `Adequate turnover time: ${turnoverTime} min`,
      severity: ConflictSeverity.INFO,
    };
  }

  private checkBlockTimeCompliance(
    context: SchedulingContext
  ): SchedulingConstraint {
    const { case: surgicalCase, blocks, date } = context;
    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );
    const surgeonId =
      (surgicalCase as any).surgeonId || (surgicalCase as any).surgeon;
    const roomId = (surgicalCase as any).roomId;

    // Find applicable blocks
    const dayOfWeek = startTime.getDay();
    const timeString = format(startTime, "HH:mm");

    const applicableBlocks = blocks.filter((block) => {
      if (block.surgeonId !== surgeonId) return false;
      if (block.roomId !== roomId) return false;
      if (block.dayOfWeek !== dayOfWeek) return false;
      if (block.status !== "ACTIVE") return false;

      return timeString >= block.startTime && timeString < block.endTime;
    });

    if (applicableBlocks.length === 0) {
      return {
        type: ConstraintType.BLOCK_TIME,
        satisfied: false,
        message: "No block time allocated for this surgeon in this room",
        severity: ConflictSeverity.MEDIUM,
      };
    }

    return {
      type: ConstraintType.BLOCK_TIME,
      satisfied: true,
      message: "Scheduled within allocated block time",
      severity: ConflictSeverity.INFO,
    };
  }

  private checkBusinessHours(context: SchedulingContext): SchedulingConstraint {
    const { case: surgicalCase } = context;
    const startTime = new Date(
      (surgicalCase as any).scheduledStartTime || new Date()
    );
    const duration = surgicalCase.estimatedDuration || 60;
    const endTime = addMinutes(startTime, duration);

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    // Check if starts before 6 AM or ends after 6 PM (typical OR hours)
    if (startHour < 6 || endHour > 18) {
      return {
        type: ConstraintType.BUSINESS_HOURS,
        satisfied: false,
        message: `Case scheduled outside normal OR hours (6 AM - 6 PM)`,
        severity: ConflictSeverity.MEDIUM,
      };
    }

    return {
      type: ConstraintType.BUSINESS_HOURS,
      satisfied: true,
      message: "Scheduled within normal OR hours",
      severity: ConflictSeverity.INFO,
    };
  }

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  private constraintToConflict(
    constraint: SchedulingConstraint,
    context: SchedulingContext
  ): ScheduleConflict {
    const conflictTypeMap: Record<ConstraintType, ConflictType> = {
      [ConstraintType.ROOM_AVAILABLE]: ConflictType.ROOM_OVERLAP,
      [ConstraintType.SURGEON_AVAILABLE]: ConflictType.STAFF_DOUBLE_BOOK,
      [ConstraintType.ANESTHESIA_AVAILABLE]: ConflictType.STAFF_DOUBLE_BOOK,
      [ConstraintType.STAFF_AVAILABLE]: ConflictType.STAFF_DOUBLE_BOOK,
      [ConstraintType.EQUIPMENT_AVAILABLE]:
        ConflictType.EQUIPMENT_UNAVAILABLE,
      [ConstraintType.BLOCK_TIME]: ConflictType.BLOCK_VIOLATION,
      [ConstraintType.TURNOVER_TIME]: ConflictType.INSUFFICIENT_TURNOVER,
      [ConstraintType.DURATION_VALID]: ConflictType.EXCEEDED_CAPACITY,
      [ConstraintType.BUSINESS_HOURS]: ConflictType.EXCEEDED_CAPACITY,
    };

    return {
      type: conflictTypeMap[constraint.type],
      severity: constraint.severity,
      description: constraint.message,
      affectedCases: [(context.case as any).id || "new-case"],
      resolution: null,
    };
  }

  private findAlternativeTimes(context: SchedulingContext): Date[] {
    const alternatives: Date[] = [];
    const { case: surgicalCase, room, date } = context;
    const duration = surgicalCase.estimatedDuration || 60;

    // Try to find slots in the same day
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Generate 30-minute increments throughout the day
    let currentTime = addMinutes(dayStart, this.PRIME_TIME_START * 60);
    const endSearch = addMinutes(dayStart, this.PRIME_TIME_END * 60);

    while (isBefore(currentTime, endSearch) && alternatives.length < 5) {
      const testContext = {
        ...context,
        case: {
          ...surgicalCase,
          scheduledStartTime: currentTime,
        },
      };

      const result = this.validateSchedule(testContext);
      if (result.success) {
        alternatives.push(currentTime);
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return alternatives;
  }

  // --------------------------------------------------------------------------
  // Duration Estimation
  // --------------------------------------------------------------------------

  estimateDuration(params: {
    procedureId: string;
    surgeonId: string;
    patientAge: number;
    patientBMI: number;
    complexity: string;
    historicalCases?: SurgicalCase[];
  }): DurationEstimate {
    const { procedureId, surgeonId, historicalCases = [] } = params;

    // Filter historical cases for this procedure and surgeon
    const relevantCases = historicalCases.filter(
      (c) =>
        c.procedureId === procedureId &&
        c.surgeonId === surgeonId &&
        c.actualDuration !== null &&
        c.status === CaseStatus.COMPLETED
    );

    // Calculate averages
    const procedureCases = historicalCases.filter(
      (c) => c.procedureId === procedureId && c.actualDuration !== null
    );
    const surgeonCases = historicalCases.filter(
      (c) => c.surgeonId === surgeonId && c.actualDuration !== null
    );

    const procedureAverage =
      procedureCases.length > 0
        ? procedureCases.reduce((sum, c) => sum + c.actualDuration!, 0) /
          procedureCases.length
        : 90;

    const surgeonAverage =
      surgeonCases.length > 0
        ? surgeonCases.reduce((sum, c) => sum + c.actualDuration!, 0) /
          surgeonCases.length
        : 90;

    const relevantAverage =
      relevantCases.length > 0
        ? relevantCases.reduce((sum, c) => sum + c.actualDuration!, 0) /
          relevantCases.length
        : (procedureAverage + surgeonAverage) / 2;

    // Adjust for patient factors
    let adjustmentFactor = 1.0;

    // Age adjustment
    if (params.patientAge > 65) adjustmentFactor += 0.1;
    if (params.patientAge < 5) adjustmentFactor += 0.15;

    // BMI adjustment
    if (params.patientBMI > 35) adjustmentFactor += 0.15;
    if (params.patientBMI < 18) adjustmentFactor += 0.1;

    // Complexity adjustment
    if (params.complexity === "COMPLEX") adjustmentFactor += 0.2;
    if (params.complexity === "HIGHLY_COMPLEX") adjustmentFactor += 0.3;

    const estimatedDuration = Math.round(relevantAverage * adjustmentFactor);

    // Calculate variance for confidence
    const variance =
      relevantCases.length > 1
        ? relevantCases.reduce((sum, c) => {
            const diff = c.actualDuration! - relevantAverage;
            return sum + diff * diff;
          }, 0) / relevantCases.length
        : 100;

    const confidence = Math.max(
      50,
      Math.min(95, 95 - variance / 10 - (10 - relevantCases.length) * 3)
    );

    return {
      procedureId,
      surgeonId,
      estimatedDuration,
      confidence,
      factors: {
        procedureAverage,
        surgeonAverage,
        patientComplexity: adjustmentFactor,
        historicalVariance: variance,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Case Conflict Detection
  // --------------------------------------------------------------------------

  detectConflicts(
    cases: SurgicalCase[],
    rooms: OperatingRoom[],
    blocks: ORBlock[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (const surgicalCase of cases) {
      const room = rooms.find((r) => r.id === surgicalCase.roomId);
      if (!room) continue;

      const context: SchedulingContext = {
        case: surgicalCase,
        room,
        existingCases: cases.filter((c) => c.id !== surgicalCase.id),
        blocks,
        availableStaff: [],
        date: new Date(surgicalCase.scheduledDate),
      };

      const result = this.validateSchedule(context);
      conflicts.push(...result.conflicts);
    }

    return conflicts;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let schedulerInstance: CaseScheduler | null = null;

export function getCaseScheduler(): CaseScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CaseScheduler();
  }
  return schedulerInstance;
}
