/**
 * OR Block Manager
 * Manages surgical block time allocation, utilization, and release rules
 */

import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  format,
  differenceInMinutes,
  isBefore,
  isAfter,
  parseISO,
} from "date-fns";
import type {
  ORBlock,
  BlockStatus,
  BlockUtilization,
  SurgicalCase,
  CaseStatus,
  DayOfWeek,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface BlockAllocation {
  blockId: string;
  surgeonId: string;
  surgeonName: string;
  roomId: string;
  roomName: string;
  date: Date;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  availableMinutes: number;
  bookedMinutes: number;
  utilizationRate: number;
  cases: BlockCase[];
  isReleased: boolean;
  releasedAt: Date | null;
}

export interface BlockCase {
  caseId: string;
  patientName: string;
  procedureName: string;
  startTime: Date;
  duration: number;
  status: CaseStatus;
}

export interface ReleaseRule {
  blockId?: string;
  surgeonId?: string;
  hoursBeforeStart: number;
  minimumUtilization: number; // percentage
  autoRelease: boolean;
  notifySurgeon: boolean;
  allowReclaim: boolean;
  reclaimDeadline: number; // hours before
}

export interface BlockPerformance {
  blockId: string;
  surgeonName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalBlocks: number;
  blocksUsed: number;
  blocksReleased: number;
  averageUtilization: number;
  targetUtilization: number;
  complianceRate: number;
  totalMinutesAllocated: number;
  totalMinutesUsed: number;
  revenue: number;
}

export interface BlockRequest {
  surgeonId: string;
  roomId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  duration: number;
  effectiveDate: Date;
  justification: string;
  historicalUtilization?: number;
}

export interface BlockModification {
  blockId: string;
  modificationType: ModificationType;
  newStartTime?: string;
  newEndTime?: string;
  newRoomId?: string;
  newDayOfWeek?: DayOfWeek;
  reason: string;
  requestedBy: string;
  effectiveDate: Date;
}

export enum ModificationType {
  TIME_CHANGE = "TIME_CHANGE",
  ROOM_CHANGE = "ROOM_CHANGE",
  DAY_CHANGE = "DAY_CHANGE",
  DURATION_CHANGE = "DURATION_CHANGE",
  TEMPORARY_RELEASE = "TEMPORARY_RELEASE",
  PERMANENT_CANCELLATION = "PERMANENT_CANCELLATION",
}

// ============================================================================
// Block Manager Class
// ============================================================================

export class BlockManager {
  private readonly DEFAULT_RELEASE_TIME = 48; // hours
  private readonly MIN_UTILIZATION_TARGET = 80; // percentage
  private readonly PRIME_TIME_MULTIPLIER = 1.5;

  // --------------------------------------------------------------------------
  // Block Utilization Tracking
  // --------------------------------------------------------------------------

  calculateUtilization(
    block: ORBlock,
    date: Date,
    cases: SurgicalCase[]
  ): BlockUtilization {
    const blockStart = this.parseBlockTime(date, block.startTime);
    const blockEnd = this.parseBlockTime(date, block.endTime);
    const totalMinutes = differenceInMinutes(blockEnd, blockStart);

    // Filter cases in this block
    const blockCases = cases.filter((c) => {
      if (c.blockId !== block.id) return false;
      if (
        c.status === CaseStatus.CANCELLED ||
        c.status === CaseStatus.BUMP
      )
        return false;

      const caseDate = new Date(c.scheduledDate);
      return format(caseDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });

    const scheduledMinutes = blockCases.reduce(
      (sum, c) => sum + c.estimatedDuration,
      0
    );

    const completedCases = blockCases.filter(
      (c) => c.status === CaseStatus.COMPLETED
    );

    const actualMinutes = completedCases.reduce(
      (sum, c) => sum + (c.actualDuration || 0),
      0
    );

    // Calculate turnover time (assume standard 30 min between cases)
    const turnoverTime =
      blockCases.length > 1 ? (blockCases.length - 1) * 30 : 0;

    // Check if first case started on time
    const firstCaseDelay =
      blockCases.length > 0 && blockCases[0].actualStartTime
        ? differenceInMinutes(
            new Date(blockCases[0].actualStartTime),
            blockStart
          )
        : 0;

    return {
      blockId: block.id,
      date,
      totalMinutes,
      scheduledMinutes,
      utilizationRate: (scheduledMinutes / totalMinutes) * 100,
      casesScheduled: blockCases.length,
      casesCompleted: completedCases.length,
      turnoverTime,
      firstCaseDelay: Math.max(0, firstCaseDelay),
    };
  }

  calculateBlockPerformance(
    block: ORBlock,
    startDate: Date,
    endDate: Date,
    allCases: SurgicalCase[]
  ): BlockPerformance {
    const utilizationData: BlockUtilization[] = [];
    let currentDate = new Date(startDate);

    while (isBefore(currentDate, endDate)) {
      if (currentDate.getDay() === block.dayOfWeek) {
        const utilization = this.calculateUtilization(
          block,
          currentDate,
          allCases
        );
        utilizationData.push(utilization);
      }
      currentDate = addDays(currentDate, 1);
    }

    const totalBlocks = utilizationData.length;
    const blocksUsed = utilizationData.filter((u) => u.casesScheduled > 0)
      .length;
    const blocksReleased = utilizationData.filter(
      (u) =>
        u.casesScheduled === 0 ||
        u.utilizationRate < this.MIN_UTILIZATION_TARGET
    ).length;

    const averageUtilization =
      totalBlocks > 0
        ? utilizationData.reduce((sum, u) => sum + u.utilizationRate, 0) /
          totalBlocks
        : 0;

    const totalMinutesAllocated = utilizationData.reduce(
      (sum, u) => sum + u.totalMinutes,
      0
    );
    const totalMinutesUsed = utilizationData.reduce(
      (sum, u) => sum + u.scheduledMinutes,
      0
    );

    const complianceRate =
      totalBlocks > 0
        ? (utilizationData.filter(
            (u) => u.utilizationRate >= block.utilizationTarget
          ).length /
            totalBlocks) *
          100
        : 0;

    return {
      blockId: block.id,
      surgeonName: block.surgeonName,
      period: {
        start: startDate,
        end: endDate,
      },
      totalBlocks,
      blocksUsed,
      blocksReleased,
      averageUtilization,
      targetUtilization: block.utilizationTarget,
      complianceRate,
      totalMinutesAllocated,
      totalMinutesUsed,
      revenue: 0, // Would be calculated based on cases
    };
  }

  // --------------------------------------------------------------------------
  // Block Release Management
  // --------------------------------------------------------------------------

  shouldReleaseBlock(
    block: ORBlock,
    date: Date,
    cases: SurgicalCase[],
    rule: ReleaseRule
  ): {
    shouldRelease: boolean;
    reason: string;
  } {
    const utilization = this.calculateUtilization(block, date, cases);
    const blockStart = this.parseBlockTime(date, block.startTime);
    const hoursUntilBlock =
      differenceInMinutes(blockStart, new Date()) / 60;

    // Check if we're within the release window
    if (hoursUntilBlock > rule.hoursBeforeStart) {
      return {
        shouldRelease: false,
        reason: `Too early to release (${Math.round(hoursUntilBlock)} hours until block)`,
      };
    }

    // Check utilization
    if (utilization.utilizationRate < rule.minimumUtilization) {
      return {
        shouldRelease: true,
        reason: `Low utilization (${utilization.utilizationRate.toFixed(1)}% vs ${rule.minimumUtilization}% target)`,
      };
    }

    // Check if no cases scheduled
    if (utilization.casesScheduled === 0) {
      return {
        shouldRelease: true,
        reason: "No cases scheduled in block",
      };
    }

    return {
      shouldRelease: false,
      reason: "Block meets utilization requirements",
    };
  }

  releaseBlock(
    blockId: string,
    date: Date,
    reason: string,
    releasedBy: string
  ): {
    success: boolean;
    releasedMinutes: number;
    message: string;
  } {
    // In a real implementation, this would update the database
    return {
      success: true,
      releasedMinutes: 240, // Example: 4-hour block
      message: `Block released: ${reason}`,
    };
  }

  autoReleaseBlocks(
    blocks: ORBlock[],
    date: Date,
    cases: SurgicalCase[],
    rules: ReleaseRule[]
  ): Array<{
    blockId: string;
    released: boolean;
    reason: string;
  }> {
    const results = [];

    for (const block of blocks) {
      const applicableRules = rules.filter(
        (r) =>
          (r.blockId === block.id || r.surgeonId === block.surgeonId) &&
          r.autoRelease
      );

      if (applicableRules.length === 0) continue;

      // Use the most conservative rule (earliest release time, highest utilization requirement)
      const rule = applicableRules.sort(
        (a, b) => b.hoursBeforeStart - a.hoursBeforeStart
      )[0];

      const { shouldRelease, reason } = this.shouldReleaseBlock(
        block,
        date,
        cases,
        rule
      );

      if (shouldRelease) {
        const result = this.releaseBlock(
          block.id,
          date,
          reason,
          "AUTO_RELEASE"
        );
        results.push({
          blockId: block.id,
          released: result.success,
          reason: result.message,
        });
      } else {
        results.push({
          blockId: block.id,
          released: false,
          reason,
        });
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Block Allocation
  // --------------------------------------------------------------------------

  getAllocationForDate(
    block: ORBlock,
    date: Date,
    cases: SurgicalCase[]
  ): BlockAllocation {
    const utilization = this.calculateUtilization(block, date, cases);
    const blockCases = cases
      .filter((c) => c.blockId === block.id)
      .map((c) => ({
        caseId: c.id,
        patientName: c.patientName,
        procedureName: c.procedureName,
        startTime: new Date(c.scheduledStartTime),
        duration: c.estimatedDuration,
        status: c.status,
      }));

    const bookedMinutes = blockCases.reduce((sum, c) => sum + c.duration, 0);

    return {
      blockId: block.id,
      surgeonId: block.surgeonId,
      surgeonName: block.surgeonName,
      roomId: block.roomId,
      roomName: block.roomName,
      date,
      startTime: block.startTime,
      endTime: block.endTime,
      totalMinutes: utilization.totalMinutes,
      availableMinutes: utilization.totalMinutes - bookedMinutes,
      bookedMinutes,
      utilizationRate: utilization.utilizationRate,
      cases: blockCases,
      isReleased: block.status === BlockStatus.RELEASED,
      releasedAt: null,
    };
  }

  findAvailableBlocks(
    blocks: ORBlock[],
    date: Date,
    cases: SurgicalCase[],
    requiredMinutes: number,
    surgeonId?: string
  ): BlockAllocation[] {
    const dayOfWeek = date.getDay();
    const availableBlocks: BlockAllocation[] = [];

    for (const block of blocks) {
      if (block.dayOfWeek !== dayOfWeek) continue;
      if (block.status !== BlockStatus.ACTIVE) continue;
      if (surgeonId && block.surgeonId !== surgeonId) continue;

      const allocation = this.getAllocationForDate(block, date, cases);

      if (allocation.availableMinutes >= requiredMinutes) {
        availableBlocks.push(allocation);
      }
    }

    return availableBlocks.sort(
      (a, b) => b.availableMinutes - a.availableMinutes
    );
  }

  // --------------------------------------------------------------------------
  // Block Request Management
  // --------------------------------------------------------------------------

  evaluateBlockRequest(request: BlockRequest): {
    approved: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Historical utilization
    if (request.historicalUtilization !== undefined) {
      if (request.historicalUtilization >= 90) {
        score += 40;
        feedback.push("Excellent historical utilization (≥90%)");
      } else if (request.historicalUtilization >= 80) {
        score += 30;
        feedback.push("Good historical utilization (80-89%)");
      } else if (request.historicalUtilization >= 70) {
        score += 20;
        feedback.push("Fair historical utilization (70-79%)");
      } else {
        score += 0;
        feedback.push(
          `Low historical utilization (${request.historicalUtilization}%)`
        );
      }
    } else {
      score += 15;
      feedback.push("No historical data available");
    }

    // Justification quality
    if (request.justification.length > 100) {
      score += 20;
      feedback.push("Detailed justification provided");
    } else if (request.justification.length > 50) {
      score += 10;
      feedback.push("Adequate justification provided");
    } else {
      score += 0;
      feedback.push("Limited justification provided");
    }

    // Block duration (reasonable size)
    if (request.duration >= 120 && request.duration <= 480) {
      // 2-8 hours
      score += 20;
      feedback.push("Reasonable block duration");
    } else if (request.duration < 120) {
      score += 5;
      feedback.push("Short block duration - consider scheduling individual cases");
    } else {
      score += 10;
      feedback.push("Long block duration - consider splitting into multiple blocks");
    }

    // Prime time consideration (7 AM - 3 PM)
    const [hours] = request.startTime.split(":").map(Number);
    if (hours >= 7 && hours < 15) {
      score += 20;
      feedback.push("Requesting prime time - high utilization expected");
    } else {
      score += 10;
      feedback.push("Non-prime time block");
    }

    const approved = score >= 60;
    return {
      approved,
      score,
      feedback,
    };
  }

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  private parseBlockTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  generateBlockSchedule(
    block: ORBlock,
    startDate: Date,
    endDate: Date
  ): Array<{
    date: Date;
    startTime: Date;
    endTime: Date;
  }> {
    const schedule = [];
    let currentDate = new Date(startDate);

    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
      if (currentDate.getDay() === block.dayOfWeek) {
        schedule.push({
          date: new Date(currentDate),
          startTime: this.parseBlockTime(currentDate, block.startTime),
          endTime: this.parseBlockTime(currentDate, block.endTime),
        });
      }
      currentDate = addDays(currentDate, 1);
    }

    return schedule;
  }

  calculateBlockValue(
    block: ORBlock,
    averageRevenuePerMinute: number
  ): number {
    const duration = this.parseBlockDuration(block.startTime, block.endTime);
    const isPrimeTime = this.isPrimeTime(block.startTime);
    const multiplier = isPrimeTime ? this.PRIME_TIME_MULTIPLIER : 1.0;

    return duration * averageRevenuePerMinute * multiplier;
  }

  private parseBlockDuration(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes - startTotalMinutes;
  }

  private isPrimeTime(startTime: string): boolean {
    const [hours] = startTime.split(":").map(Number);
    return hours >= 7 && hours < 15;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: BlockManager | null = null;

export function getBlockManager(): BlockManager {
  if (!managerInstance) {
    managerInstance = new BlockManager();
  }
  return managerInstance;
}
