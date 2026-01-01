/**
 * OR Room Optimizer
 * Optimizes room assignments, minimizes turnover, and ensures equipment compatibility
 */

import {
  addMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
  format,
} from "date-fns";
import type {
  SurgicalCase,
  OperatingRoom,
  ORRoomType,
  ScheduleOptimization,
  RoomSchedule,
  ScheduledCase,
  TimeGap,
  OptimizationSuggestion,
  SuggestionType,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface RoomAssignment {
  caseId: string;
  roomId: string;
  roomName: string;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface OptimizationConfig {
  minimizeTurnover: boolean;
  maximizeUtilization: boolean;
  respectPreferences: boolean;
  allowRoomChanges: boolean;
  considerEquipment: boolean;
  targetUtilization: number; // percentage
}

export interface RoomCompatibility {
  roomId: string;
  roomName: string;
  compatible: boolean;
  score: number;
  factors: {
    equipmentMatch: number;
    typeCompatibility: number;
    availability: number;
    turnoverImpact: number;
    utilization: number;
  };
  issues: string[];
}

// ============================================================================
// Room Optimizer Class
// ============================================================================

export class RoomOptimizer {
  private readonly TURNOVER_WEIGHT = 0.3;
  private readonly EQUIPMENT_WEIGHT = 0.25;
  private readonly UTILIZATION_WEIGHT = 0.25;
  private readonly PREFERENCE_WEIGHT = 0.2;

  // --------------------------------------------------------------------------
  // Room Assignment Optimization
  // --------------------------------------------------------------------------

  optimizeRoomAssignments(
    cases: SurgicalCase[],
    rooms: OperatingRoom[],
    config: OptimizationConfig = {
      minimizeTurnover: true,
      maximizeUtilization: true,
      respectPreferences: true,
      allowRoomChanges: true,
      considerEquipment: true,
      targetUtilization: 85,
    }
  ): Map<string, RoomAssignment> {
    const assignments = new Map<string, RoomAssignment>();

    // Sort cases by priority and start time
    const sortedCases = [...cases].sort((a, b) => {
      const priorityOrder = { EMERGENT: 0, URGENT: 1, ELECTIVE: 2, ADD_ON: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return (
        new Date(a.scheduledStartTime).getTime() -
        new Date(b.scheduledStartTime).getTime()
      );
    });

    for (const surgicalCase of sortedCases) {
      const compatibleRooms = this.findCompatibleRooms(
        surgicalCase,
        rooms,
        cases,
        config
      );

      if (compatibleRooms.length === 0) {
        assignments.set(surgicalCase.id, {
          caseId: surgicalCase.id,
          roomId: surgicalCase.roomId,
          roomName: surgicalCase.roomName,
          score: 0,
          reasons: ["No compatible rooms found"],
          warnings: ["Case may need to be rescheduled"],
        });
        continue;
      }

      const bestRoom = compatibleRooms[0];
      const room = rooms.find((r) => r.id === bestRoom.roomId)!;

      assignments.set(surgicalCase.id, {
        caseId: surgicalCase.id,
        roomId: bestRoom.roomId,
        roomName: bestRoom.roomName,
        score: bestRoom.score,
        reasons: this.generateReasons(bestRoom),
        warnings: bestRoom.issues,
      });
    }

    return assignments;
  }

  findCompatibleRooms(
    surgicalCase: SurgicalCase,
    rooms: OperatingRoom[],
    allCases: SurgicalCase[],
    config: OptimizationConfig
  ): RoomCompatibility[] {
    const compatibilities: RoomCompatibility[] = [];

    for (const room of rooms) {
      if (!room.isActive) continue;

      const compatibility = this.evaluateRoomCompatibility(
        surgicalCase,
        room,
        allCases,
        config
      );

      compatibilities.push(compatibility);
    }

    return compatibilities
      .filter((c) => c.compatible)
      .sort((a, b) => b.score - a.score);
  }

  private evaluateRoomCompatibility(
    surgicalCase: SurgicalCase,
    room: OperatingRoom,
    allCases: SurgicalCase[],
    config: OptimizationConfig
  ): RoomCompatibility {
    const issues: string[] = [];
    let compatible = true;

    // Check equipment compatibility
    const equipmentScore = this.calculateEquipmentScore(
      surgicalCase.equipmentNeeded,
      room.equipmentList
    );

    if (config.considerEquipment && equipmentScore < 50) {
      issues.push("Missing required equipment");
      compatible = false;
    }

    // Check room type compatibility
    const typeScore = this.calculateTypeCompatibility(
      surgicalCase.procedureName,
      room.type
    );

    if (typeScore < 30) {
      issues.push("Room type may not be suitable for this procedure");
      if (typeScore < 10) {
        compatible = false;
      }
    }

    // Check availability
    const availabilityScore = this.calculateAvailabilityScore(
      surgicalCase,
      room,
      allCases
    );

    if (availabilityScore === 0) {
      issues.push("Room is not available at requested time");
      compatible = false;
    }

    // Calculate turnover impact
    const turnoverScore = this.calculateTurnoverScore(
      surgicalCase,
      room,
      allCases
    );

    // Calculate utilization impact
    const utilizationScore = this.calculateUtilizationScore(
      surgicalCase,
      room,
      allCases,
      config.targetUtilization
    );

    // Weighted total score
    const totalScore =
      equipmentScore * this.EQUIPMENT_WEIGHT +
      typeScore * this.PREFERENCE_WEIGHT +
      availabilityScore * 0.2 +
      turnoverScore * this.TURNOVER_WEIGHT +
      utilizationScore * this.UTILIZATION_WEIGHT;

    return {
      roomId: room.id,
      roomName: room.roomName,
      compatible,
      score: totalScore,
      factors: {
        equipmentMatch: equipmentScore,
        typeCompatibility: typeScore,
        availability: availabilityScore,
        turnoverImpact: turnoverScore,
        utilization: utilizationScore,
      },
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // Scoring Functions
  // --------------------------------------------------------------------------

  private calculateEquipmentScore(
    requiredEquipment: Array<{ equipmentName: string; required: boolean }>,
    availableEquipment: string[]
  ): number {
    if (requiredEquipment.length === 0) return 100;

    const requiredItems = requiredEquipment.filter((e) => e.required);
    if (requiredItems.length === 0) return 100;

    const matchedItems = requiredItems.filter((req) =>
      availableEquipment.some((avail) =>
        avail.toLowerCase().includes(req.equipmentName.toLowerCase())
      )
    );

    return (matchedItems.length / requiredItems.length) * 100;
  }

  private calculateTypeCompatibility(
    procedureName: string,
    roomType: ORRoomType
  ): number {
    const procedureLower = procedureName.toLowerCase();

    // Define procedure-to-room-type compatibility
    const compatibility: Record<ORRoomType, string[]> = {
      [ORRoomType.CARDIAC]: ["cardiac", "heart", "cabg", "valve", "bypass"],
      [ORRoomType.NEURO]: [
        "neuro",
        "brain",
        "spine",
        "craniotomy",
        "laminectomy",
      ],
      [ORRoomType.ORTHO]: [
        "ortho",
        "joint",
        "fracture",
        "knee",
        "hip",
        "shoulder",
        "spine",
      ],
      [ORRoomType.TRAUMA]: ["trauma", "emergency", "urgent"],
      [ORRoomType.PEDIATRIC]: ["pediatric", "child", "infant"],
      [ORRoomType.ROBOTICS]: ["robotic", "robot-assisted", "da vinci"],
      [ORRoomType.HYBRID]: ["hybrid", "vascular", "interventional"],
      [ORRoomType.INTERVENTIONAL]: ["interventional", "catheter", "endovascular"],
      [ORRoomType.GENERAL]: [], // General rooms can handle anything
    };

    const keywords = compatibility[roomType] || [];

    if (roomType === ORRoomType.GENERAL) {
      return 70; // General rooms are moderately compatible with everything
    }

    const hasMatch = keywords.some((keyword) =>
      procedureLower.includes(keyword)
    );

    return hasMatch ? 100 : 40;
  }

  private calculateAvailabilityScore(
    surgicalCase: SurgicalCase,
    room: OperatingRoom,
    allCases: SurgicalCase[]
  ): number {
    const caseStart = new Date(surgicalCase.scheduledStartTime);
    const caseEnd = addMinutes(caseStart, surgicalCase.estimatedDuration);

    // Check for conflicts
    const hasConflict = allCases.some((otherCase) => {
      if (otherCase.id === surgicalCase.id) return false;
      if (otherCase.roomId !== room.id) return false;
      if (otherCase.status === "CANCELLED" || otherCase.status === "COMPLETED")
        return false;

      const otherStart = new Date(otherCase.scheduledStartTime);
      const otherEnd = addMinutes(otherStart, otherCase.estimatedDuration);

      return (
        (caseStart >= otherStart && caseStart < otherEnd) ||
        (caseEnd > otherStart && caseEnd <= otherEnd) ||
        (caseStart <= otherStart && caseEnd >= otherEnd)
      );
    });

    return hasConflict ? 0 : 100;
  }

  private calculateTurnoverScore(
    surgicalCase: SurgicalCase,
    room: OperatingRoom,
    allCases: SurgicalCase[]
  ): number {
    const caseStart = new Date(surgicalCase.scheduledStartTime);

    // Find the preceding case in the same room
    const precedingCases = allCases
      .filter((c) => {
        if (c.id === surgicalCase.id) return false;
        if (c.roomId !== room.id) return false;
        if (c.status === "CANCELLED" || c.status === "COMPLETED")
          return false;

        const cEnd = addMinutes(
          new Date(c.scheduledStartTime),
          c.estimatedDuration
        );
        return isBefore(cEnd, caseStart);
      })
      .sort(
        (a, b) =>
          new Date(b.scheduledStartTime).getTime() -
          new Date(a.scheduledStartTime).getTime()
      );

    if (precedingCases.length === 0) {
      return 100; // First case of the day - no turnover needed
    }

    const precedingCase = precedingCases[0];
    const precedingEnd = addMinutes(
      new Date(precedingCase.scheduledStartTime),
      precedingCase.estimatedDuration
    );

    const actualTurnover = differenceInMinutes(caseStart, precedingEnd);
    const requiredTurnover = room.turnoverDuration || 30;

    if (actualTurnover < requiredTurnover) {
      return 0; // Insufficient turnover
    } else if (actualTurnover === requiredTurnover) {
      return 100; // Perfect turnover
    } else if (actualTurnover <= requiredTurnover + 15) {
      return 80; // Adequate turnover with small buffer
    } else {
      // Excessive turnover reduces score (wasted time)
      const excessMinutes = actualTurnover - requiredTurnover;
      return Math.max(50, 100 - excessMinutes);
    }
  }

  private calculateUtilizationScore(
    surgicalCase: SurgicalCase,
    room: OperatingRoom,
    allCases: SurgicalCase[],
    targetUtilization: number
  ): number {
    // Calculate current utilization for the day
    const caseDate = new Date(surgicalCase.scheduledDate);
    const dayStart = new Date(caseDate);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(caseDate);
    dayEnd.setHours(18, 0, 0, 0);

    const dayMinutes = differenceInMinutes(dayEnd, dayStart);

    const roomCases = allCases.filter(
      (c) =>
        c.roomId === room.id &&
        format(new Date(c.scheduledDate), "yyyy-MM-dd") ===
          format(caseDate, "yyyy-MM-dd") &&
        c.status !== "CANCELLED"
    );

    const currentUsedMinutes = roomCases.reduce(
      (sum, c) => sum + c.estimatedDuration,
      0
    );

    const newUsedMinutes =
      currentUsedMinutes + surgicalCase.estimatedDuration;
    const newUtilization = (newUsedMinutes / dayMinutes) * 100;

    // Score based on how close to target utilization
    const diff = Math.abs(newUtilization - targetUtilization);

    if (diff <= 5) return 100;
    if (diff <= 10) return 90;
    if (diff <= 15) return 75;
    if (diff <= 20) return 60;
    return 50;
  }

  // --------------------------------------------------------------------------
  // Schedule Optimization
  // --------------------------------------------------------------------------

  optimizeSchedule(
    cases: SurgicalCase[],
    rooms: OperatingRoom[],
    date: Date
  ): ScheduleOptimization {
    const roomSchedules: RoomSchedule[] = [];
    const suggestions: OptimizationSuggestion[] = [];

    for (const room of rooms) {
      if (!room.isActive) continue;

      const roomCases = cases
        .filter(
          (c) =>
            c.roomId === room.id &&
            format(new Date(c.scheduledDate), "yyyy-MM-dd") ===
              format(date, "yyyy-MM-dd") &&
            c.status !== "CANCELLED"
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledStartTime).getTime() -
            new Date(b.scheduledStartTime).getTime()
        );

      const scheduledCases: ScheduledCase[] = roomCases.map((c) => ({
        caseId: c.id,
        startTime: new Date(c.scheduledStartTime),
        endTime: addMinutes(
          new Date(c.scheduledStartTime),
          c.estimatedDuration
        ),
        surgeon: c.surgeonName,
        procedure: c.procedureName,
        turnoverAfter: room.turnoverDuration || 30,
      }));

      const gaps = this.findTimeGaps(scheduledCases, room, date);
      const utilization = this.calculateDayUtilization(scheduledCases, date);

      roomSchedules.push({
        roomId: room.id,
        roomName: room.roomName,
        cases: scheduledCases,
        gaps,
        utilizationRate: utilization,
      });

      // Generate suggestions for this room
      if (gaps.length > 0) {
        for (const gap of gaps) {
          if (gap.canFitAddOn) {
            suggestions.push({
              type: SuggestionType.ADD_CASE_TO_GAP,
              priority: gap.duration > 120 ? 1 : 2,
              description: `${room.roomName} has ${gap.duration}-minute gap`,
              impact: `Can fit additional ${gap.suggestedProcedures.join(" or ")}`,
              action: `Schedule add-on case at ${format(gap.startTime, "HH:mm")}`,
              affectedCases: [],
            });
          }
        }
      }

      if (utilization < 70) {
        suggestions.push({
          type: SuggestionType.MOVE_TO_DIFFERENT_ROOM,
          priority: 2,
          description: `${room.roomName} has low utilization (${utilization.toFixed(1)}%)`,
          impact: "Could consolidate cases to fewer rooms",
          action: "Consider moving cases to optimize utilization",
          affectedCases: roomCases.map((c) => c.id),
        });
      }
    }

    const conflicts = [];
    const totalCases = cases.filter((c) => c.status !== "CANCELLED").length;
    const avgUtilization =
      roomSchedules.reduce((sum, r) => sum + r.utilizationRate, 0) /
      roomSchedules.length;

    return {
      date,
      rooms: roomSchedules,
      totalCases,
      utilizationScore: avgUtilization,
      conflicts,
      suggestions: suggestions.sort((a, b) => a.priority - b.priority),
    };
  }

  // --------------------------------------------------------------------------
  // Gap Analysis
  // --------------------------------------------------------------------------

  private findTimeGaps(
    scheduledCases: ScheduledCase[],
    room: OperatingRoom,
    date: Date
  ): TimeGap[] {
    const gaps: TimeGap[] = [];

    const dayStart = new Date(date);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    if (scheduledCases.length === 0) {
      const duration = differenceInMinutes(dayEnd, dayStart);
      gaps.push({
        startTime: dayStart,
        endTime: dayEnd,
        duration,
        canFitAddOn: duration >= 60,
        suggestedProcedures: this.suggestProceduresForDuration(duration),
      });
      return gaps;
    }

    // Gap before first case
    const firstCase = scheduledCases[0];
    if (isBefore(dayStart, firstCase.startTime)) {
      const duration = differenceInMinutes(firstCase.startTime, dayStart);
      if (duration >= 30) {
        gaps.push({
          startTime: dayStart,
          endTime: firstCase.startTime,
          duration,
          canFitAddOn: duration >= 60,
          suggestedProcedures: this.suggestProceduresForDuration(duration),
        });
      }
    }

    // Gaps between cases
    for (let i = 0; i < scheduledCases.length - 1; i++) {
      const currentCase = scheduledCases[i];
      const nextCase = scheduledCases[i + 1];

      const gapStart = addMinutes(
        currentCase.endTime,
        room.turnoverDuration || 30
      );
      const duration = differenceInMinutes(nextCase.startTime, gapStart);

      if (duration >= 30) {
        gaps.push({
          startTime: gapStart,
          endTime: nextCase.startTime,
          duration,
          canFitAddOn: duration >= 60,
          suggestedProcedures: this.suggestProceduresForDuration(duration),
        });
      }
    }

    // Gap after last case
    const lastCase = scheduledCases[scheduledCases.length - 1];
    const lastCaseEnd = addMinutes(
      lastCase.endTime,
      room.turnoverDuration || 30
    );
    if (isBefore(lastCaseEnd, dayEnd)) {
      const duration = differenceInMinutes(dayEnd, lastCaseEnd);
      if (duration >= 30) {
        gaps.push({
          startTime: lastCaseEnd,
          endTime: dayEnd,
          duration,
          canFitAddOn: duration >= 60,
          suggestedProcedures: this.suggestProceduresForDuration(duration),
        });
      }
    }

    return gaps;
  }

  private suggestProceduresForDuration(minutes: number): string[] {
    if (minutes < 60) return ["short procedures"];
    if (minutes < 120) return ["minor procedures", "biopsies", "scopes"];
    if (minutes < 180)
      return ["intermediate procedures", "minor joint surgeries"];
    return ["major procedures", "joint replacements"];
  }

  private calculateDayUtilization(
    scheduledCases: ScheduledCase[],
    date: Date
  ): number {
    const dayStart = new Date(date);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const totalMinutes = differenceInMinutes(dayEnd, dayStart);
    const usedMinutes = scheduledCases.reduce(
      (sum, c) => sum + differenceInMinutes(c.endTime, c.startTime),
      0
    );

    return (usedMinutes / totalMinutes) * 100;
  }

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  private generateReasons(compatibility: RoomCompatibility): string[] {
    const reasons: string[] = [];

    if (compatibility.factors.equipmentMatch >= 90) {
      reasons.push("All required equipment available");
    } else if (compatibility.factors.equipmentMatch >= 70) {
      reasons.push("Most required equipment available");
    }

    if (compatibility.factors.typeCompatibility >= 90) {
      reasons.push("Optimal room type for procedure");
    }

    if (compatibility.factors.turnoverImpact >= 90) {
      reasons.push("Efficient turnover time");
    }

    if (compatibility.factors.utilization >= 80) {
      reasons.push("Good utilization impact");
    }

    return reasons;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let optimizerInstance: RoomOptimizer | null = null;

export function getRoomOptimizer(): RoomOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new RoomOptimizer();
  }
  return optimizerInstance;
}
