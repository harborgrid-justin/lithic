/**
 * OR Staff Scheduler
 * Manages surgical team scheduling, skill matching, and workload balancing
 */

import {
  addMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  SurgicalCase,
  TeamMember,
  TeamRole,
  SurgicalStaff,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface StaffAssignment {
  staffId: string;
  staffName: string;
  role: TeamRole;
  caseId: string;
  startTime: Date;
  endTime: Date;
  isPrimary: boolean;
}

export interface StaffMatch {
  staff: SurgicalStaff;
  score: number;
  matchReasons: string[];
  conflicts: string[];
  isAvailable: boolean;
}

export interface WorkloadBalance {
  staffId: string;
  staffName: string;
  role: TeamRole;
  assignedCases: number;
  totalMinutes: number;
  availableMinutes: number;
  utilizationRate: number;
  isOverloaded: boolean;
}

// ============================================================================
// Staff Scheduler Class
// ============================================================================

export class StaffScheduler {
  private readonly MAX_DAILY_CASES = 8;
  private readonly MAX_DAILY_HOURS = 12;
  private readonly SKILL_MATCH_WEIGHT = 0.4;
  private readonly AVAILABILITY_WEIGHT = 0.35;
  private readonly WORKLOAD_WEIGHT = 0.25;

  // --------------------------------------------------------------------------
  // Staff Matching & Assignment
  // --------------------------------------------------------------------------

  findBestStaffMatch(
    role: TeamRole,
    surgicalCase: SurgicalCase,
    availableStaff: SurgicalStaff[],
    existingAssignments: StaffAssignment[]
  ): StaffMatch[] {
    const matches: StaffMatch[] = [];

    for (const staff of availableStaff) {
      if (!staff.roles.includes(role)) continue;

      const score = this.calculateStaffScore(
        staff,
        role,
        surgicalCase,
        existingAssignments
      );

      const availability = this.checkStaffAvailability(
        staff,
        new Date(surgicalCase.scheduledStartTime),
        surgicalCase.estimatedDuration,
        existingAssignments
      );

      matches.push({
        staff,
        score: score.total,
        matchReasons: score.reasons,
        conflicts: availability.conflicts,
        isAvailable: availability.available,
      });
    }

    return matches
      .filter((m) => m.isAvailable)
      .sort((a, b) => b.score - a.score);
  }

  private calculateStaffScore(
    staff: SurgicalStaff,
    role: TeamRole,
    surgicalCase: SurgicalCase,
    existingAssignments: StaffAssignment[]
  ): {
    total: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let skillScore = 0;
    let availabilityScore = 0;
    let workloadScore = 0;

    // Skill matching
    const procedureType = surgicalCase.procedureName.toLowerCase();
    const hasRelevantSkills = staff.skills.some((skill) =>
      procedureType.includes(skill.toLowerCase())
    );

    if (hasRelevantSkills) {
      skillScore = 100;
      reasons.push("Has relevant procedure skills");
    } else if (staff.specialty === surgicalCase.procedureName) {
      skillScore = 80;
      reasons.push("Specialty match");
    } else {
      skillScore = 50;
    }

    // Availability score (inverse of current workload)
    const dayAssignments = existingAssignments.filter(
      (a) =>
        a.staffId === staff.id &&
        format(a.startTime, "yyyy-MM-dd") ===
          format(new Date(surgicalCase.scheduledDate), "yyyy-MM-dd")
    );

    const currentCases = dayAssignments.length;
    const totalMinutes = dayAssignments.reduce(
      (sum, a) => sum + differenceInMinutes(a.endTime, a.startTime),
      0
    );

    if (currentCases === 0) {
      availabilityScore = 100;
      reasons.push("No current assignments");
    } else if (currentCases < this.MAX_DAILY_CASES / 2) {
      availabilityScore = 80;
      reasons.push("Light workload");
    } else if (currentCases < this.MAX_DAILY_CASES) {
      availabilityScore = 60;
    } else {
      availabilityScore = 20;
      reasons.push("Heavy workload");
    }

    // Workload balance
    const utilization = totalMinutes / (this.MAX_DAILY_HOURS * 60);
    if (utilization < 0.5) {
      workloadScore = 100;
    } else if (utilization < 0.75) {
      workloadScore = 80;
    } else if (utilization < 0.9) {
      workloadScore = 60;
    } else {
      workloadScore = 30;
    }

    const total =
      skillScore * this.SKILL_MATCH_WEIGHT +
      availabilityScore * this.AVAILABILITY_WEIGHT +
      workloadScore * this.WORKLOAD_WEIGHT;

    return { total, reasons };
  }

  private checkStaffAvailability(
    staff: SurgicalStaff,
    startTime: Date,
    duration: number,
    existingAssignments: StaffAssignment[]
  ): {
    available: boolean;
    conflicts: string[];
  } {
    const conflicts: string[] = [];
    const endTime = addMinutes(startTime, duration);

    // Check if staff is active
    if (!staff.isActive) {
      conflicts.push("Staff member is not active");
    }

    // Check for schedule conflicts
    const conflictingAssignments = existingAssignments.filter((assignment) => {
      if (assignment.staffId !== staff.id) return false;

      const assignStart = new Date(assignment.startTime);
      const assignEnd = new Date(assignment.endTime);

      return (
        (startTime >= assignStart && startTime < assignEnd) ||
        (endTime > assignStart && endTime <= assignEnd) ||
        (startTime <= assignStart && endTime >= assignEnd)
      );
    });

    if (conflictingAssignments.length > 0) {
      conflicts.push(
        `${conflictingAssignments.length} conflicting assignment(s)`
      );
    }

    // Check max concurrent cases
    if (conflictingAssignments.length >= staff.maxConcurrentCases) {
      conflicts.push("Maximum concurrent cases exceeded");
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }

  // --------------------------------------------------------------------------
  // Team Assembly
  // --------------------------------------------------------------------------

  assembleTeam(
    surgicalCase: SurgicalCase,
    availableStaff: SurgicalStaff[],
    existingAssignments: StaffAssignment[]
  ): {
    team: Map<TeamRole, SurgicalStaff>;
    warnings: string[];
  } {
    const team = new Map<TeamRole, SurgicalStaff>();
    const warnings: string[] = [];

    // Define required roles based on case type
    const requiredRoles = this.getRequiredRoles(surgicalCase);

    for (const role of requiredRoles) {
      const matches = this.findBestStaffMatch(
        role,
        surgicalCase,
        availableStaff,
        existingAssignments
      );

      if (matches.length > 0) {
        team.set(role, matches[0].staff);
      } else {
        warnings.push(`No available staff found for role: ${role}`);
      }
    }

    return { team, warnings };
  }

  private getRequiredRoles(surgicalCase: SurgicalCase): TeamRole[] {
    const roles: TeamRole[] = [TeamRole.SURGEON, TeamRole.CIRCULATING_NURSE];

    // Add anesthesia if needed
    if (surgicalCase.anesthesiaType !== "LOCAL" && surgicalCase.anesthesiaType !== "NONE") {
      roles.push(TeamRole.ANESTHESIOLOGIST);
    }

    // Add scrub nurse for procedures
    if (surgicalCase.priority !== "ADD_ON") {
      roles.push(TeamRole.SCRUB_NURSE);
    }

    // Add surgical tech for complex cases
    const isComplexCase = surgicalCase.estimatedDuration > 120;
    if (isComplexCase) {
      roles.push(TeamRole.SURGICAL_TECH);
    }

    return roles;
  }

  // --------------------------------------------------------------------------
  // Workload Balancing
  // --------------------------------------------------------------------------

  analyzeWorkloadBalance(
    staff: SurgicalStaff[],
    assignments: StaffAssignment[],
    date: Date
  ): WorkloadBalance[] {
    const balances: WorkloadBalance[] = [];

    for (const member of staff) {
      const dayAssignments = assignments.filter(
        (a) =>
          a.staffId === member.id &&
          format(a.startTime, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      const totalMinutes = dayAssignments.reduce(
        (sum, a) => sum + differenceInMinutes(a.endTime, a.startTime),
        0
      );

      const maxMinutes = this.MAX_DAILY_HOURS * 60;
      const utilizationRate = (totalMinutes / maxMinutes) * 100;
      const isOverloaded = utilizationRate > 90 || dayAssignments.length > this.MAX_DAILY_CASES;

      balances.push({
        staffId: member.id,
        staffName: `${member.firstName} ${member.lastName}`,
        role: member.roles[0],
        assignedCases: dayAssignments.length,
        totalMinutes,
        availableMinutes: maxMinutes - totalMinutes,
        utilizationRate,
        isOverloaded,
      });
    }

    return balances.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  redistributeWorkload(
    assignments: StaffAssignment[],
    staff: SurgicalStaff[],
    targetUtilization: number = 75
  ): {
    redistributions: Array<{
      caseId: string;
      fromStaffId: string;
      toStaffId: string;
      reason: string;
    }>;
    newBalance: WorkloadBalance[];
  } {
    const redistributions: Array<{
      caseId: string;
      fromStaffId: string;
      toStaffId: string;
      reason: string;
    }> = [];

    // This would implement actual redistribution logic
    // For now, return empty redistributions
    return {
      redistributions,
      newBalance: [],
    };
  }

  // --------------------------------------------------------------------------
  // Staff Availability Reporting
  // --------------------------------------------------------------------------

  getStaffAvailability(
    staff: SurgicalStaff[],
    date: Date,
    assignments: StaffAssignment[]
  ): Array<{
    staff: SurgicalStaff;
    availableSlots: Array<{ startTime: Date; endTime: Date }>;
    busySlots: Array<{ startTime: Date; endTime: Date; caseId: string }>;
    utilizationRate: number;
  }> {
    const availability = [];

    for (const member of staff) {
      const dayStart = startOfDay(date);
      dayStart.setHours(7, 0, 0, 0);
      const dayEnd = endOfDay(date);
      dayEnd.setHours(18, 0, 0, 0);

      const memberAssignments = assignments.filter(
        (a) =>
          a.staffId === member.id &&
          format(a.startTime, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      const busySlots = memberAssignments.map((a) => ({
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
        caseId: a.caseId,
      }));

      const availableSlots = this.findAvailableSlots(
        dayStart,
        dayEnd,
        busySlots
      );

      const totalMinutes = differenceInMinutes(dayEnd, dayStart);
      const busyMinutes = busySlots.reduce(
        (sum, slot) => sum + differenceInMinutes(slot.endTime, slot.startTime),
        0
      );
      const utilizationRate = (busyMinutes / totalMinutes) * 100;

      availability.push({
        staff: member,
        availableSlots,
        busySlots,
        utilizationRate,
      });
    }

    return availability;
  }

  private findAvailableSlots(
    dayStart: Date,
    dayEnd: Date,
    busySlots: Array<{ startTime: Date; endTime: Date }>
  ): Array<{ startTime: Date; endTime: Date }> {
    const available: Array<{ startTime: Date; endTime: Date }> = [];

    if (busySlots.length === 0) {
      return [{ startTime: dayStart, endTime: dayEnd }];
    }

    const sortedBusy = [...busySlots].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Check for slot before first busy period
    if (sortedBusy[0].startTime > dayStart) {
      available.push({
        startTime: dayStart,
        endTime: sortedBusy[0].startTime,
      });
    }

    // Check for slots between busy periods
    for (let i = 0; i < sortedBusy.length - 1; i++) {
      const gapStart = sortedBusy[i].endTime;
      const gapEnd = sortedBusy[i + 1].startTime;

      if (gapStart < gapEnd) {
        available.push({ startTime: gapStart, endTime: gapEnd });
      }
    }

    // Check for slot after last busy period
    const lastBusy = sortedBusy[sortedBusy.length - 1];
    if (lastBusy.endTime < dayEnd) {
      available.push({ startTime: lastBusy.endTime, endTime: dayEnd });
    }

    return available;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let schedulerInstance: StaffScheduler | null = null;

export function getStaffScheduler(): StaffScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new StaffScheduler();
  }
  return schedulerInstance;
}
