/**
 * OR Add-On Case Manager
 * Handles add-on case requests, priority scoring, and bump protocols
 */

import {
  addHours,
  addMinutes,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  format,
} from "date-fns";
import type {
  AddOnCase,
  AddOnStatus,
  SurgicalCase,
  CaseStatus,
  CasePriority,
  OperatingRoom,
  BumpProtocol,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface AddOnRequest {
  patientId: string;
  patientName: string;
  surgeonId: string;
  surgeonName: string;
  procedureId: string;
  procedureName: string;
  estimatedDuration: number;
  priority: CasePriority;
  diagnosis: string;
  clinicalJustification: string;
  preferredDate: Date;
  latestAcceptableDate: Date;
  acceptableRooms: string[];
  requiredEquipment: string[];
  anesthesiaType: string;
}

export interface PriorityScore {
  total: number;
  factors: {
    clinical: number;
    timing: number;
    surgeon: number;
    availability: number;
    impact: number;
  };
  rank: PriorityRank;
  justification: string[];
}

export enum PriorityRank {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface BumpCandidate {
  caseId: string;
  patientName: string;
  procedureName: string;
  scheduledTime: Date;
  surgeon: string;
  bumpable: boolean;
  bumpScore: number; // Lower is more bumpable
  reasons: string[];
  alternatives: AlternativeSchedule[];
}

export interface AlternativeSchedule {
  date: Date;
  time: Date;
  roomId: string;
  roomName: string;
  score: number;
}

export interface AddOnPlacement {
  addOnCaseId: string;
  placement: PlacementOption;
  bumpedCase: BumpCandidate | null;
  impact: PlacementImpact;
}

export interface PlacementOption {
  roomId: string;
  roomName: string;
  scheduledTime: Date;
  method: PlacementMethod;
  confidence: number;
}

export enum PlacementMethod {
  UTILIZE_GAP = "UTILIZE_GAP",
  BUMP_ELECTIVE = "BUMP_ELECTIVE",
  EXTEND_DAY = "EXTEND_DAY",
  NEXT_AVAILABLE = "NEXT_AVAILABLE",
}

export interface PlacementImpact {
  delayedCases: number;
  totalDelayMinutes: number;
  utilizationChange: number;
  costImpact: number;
}

// ============================================================================
// Add-On Manager Class
// ============================================================================

export class AddOnManager {
  private readonly URGENCY_WINDOW = 24; // hours
  private readonly MAX_BUMP_DELAY = 7; // days
  private readonly CRITICAL_SCORE_THRESHOLD = 80;
  private readonly HIGH_SCORE_THRESHOLD = 60;

  // --------------------------------------------------------------------------
  // Priority Scoring
  // --------------------------------------------------------------------------

  calculatePriorityScore(request: AddOnRequest): PriorityScore {
    const factors = {
      clinical: this.scoreClinicalUrgency(request),
      timing: this.scoreTimingSensitivity(request),
      surgeon: this.scoreSurgeonFactor(request),
      availability: this.scoreAvailabilityImpact(request),
      impact: this.scoreSystemImpact(request),
    };

    const total =
      factors.clinical * 0.35 +
      factors.timing * 0.25 +
      factors.surgeon * 0.15 +
      factors.availability * 0.15 +
      factors.impact * 0.1;

    const rank = this.determineRank(total);
    const justification = this.generateJustification(factors, request);

    return {
      total,
      factors,
      rank,
      justification,
    };
  }

  private scoreClinicalUrgency(request: AddOnRequest): number {
    let score = 0;

    // Base score on priority
    switch (request.priority) {
      case CasePriority.EMERGENT:
        score = 100;
        break;
      case CasePriority.URGENT:
        score = 75;
        break;
      case CasePriority.ADD_ON:
        score = 50;
        break;
      case CasePriority.ELECTIVE:
        score = 25;
        break;
    }

    // Adjust for clinical justification quality
    const justificationLength = request.clinicalJustification.length;
    if (justificationLength > 200) score += 10;
    else if (justificationLength > 100) score += 5;

    // Keywords that indicate higher urgency
    const urgencyKeywords = [
      "emergent",
      "urgent",
      "emergency",
      "acute",
      "critical",
      "unstable",
      "progressive",
      "deteriorating",
    ];

    const hasUrgencyKeywords = urgencyKeywords.some((keyword) =>
      request.clinicalJustification.toLowerCase().includes(keyword)
    );

    if (hasUrgencyKeywords) score += 15;

    return Math.min(100, score);
  }

  private scoreTimingSensitivity(request: AddOnRequest): number {
    const hoursUntilPreferred = differenceInHours(
      request.preferredDate,
      new Date()
    );
    const hoursUntilLatest = differenceInHours(
      request.latestAcceptableDate,
      new Date()
    );

    // Immediate need (within 24 hours)
    if (hoursUntilPreferred <= this.URGENCY_WINDOW) {
      return 100;
    }

    // Within 48 hours
    if (hoursUntilPreferred <= 48) {
      return 80;
    }

    // Within 1 week
    if (hoursUntilPreferred <= 168) {
      return 60;
    }

    // Flexible timeline reduces score
    const flexibility = hoursUntilLatest - hoursUntilPreferred;
    if (flexibility > 168) {
      // More than 1 week flexibility
      return 30;
    } else if (flexibility > 48) {
      return 45;
    }

    return 50;
  }

  private scoreSurgeonFactor(request: AddOnRequest): number {
    // In a real implementation, this would check:
    // - Surgeon's block utilization
    // - Historical add-on rate
    // - Surgeon's volume/importance
    // For now, return a default score
    return 50;
  }

  private scoreAvailabilityImpact(request: AddOnRequest): number {
    // Higher score if more room options available
    const roomOptions = request.acceptableRooms.length;
    let score = Math.min(100, roomOptions * 25);

    // Adjust for duration (shorter cases are easier to place)
    if (request.estimatedDuration <= 60) {
      score += 20;
    } else if (request.estimatedDuration <= 120) {
      score += 10;
    } else if (request.estimatedDuration >= 240) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreSystemImpact(request: AddOnRequest): number {
    // Lower score if it would disrupt the schedule significantly
    // This is a simplified version
    let score = 60;

    // Shorter cases have less impact
    if (request.estimatedDuration <= 60) {
      score += 20;
    } else if (request.estimatedDuration >= 180) {
      score -= 15;
    }

    // Complex equipment needs reduce score
    if (request.requiredEquipment.length > 3) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineRank(score: number): PriorityRank {
    if (score >= this.CRITICAL_SCORE_THRESHOLD) return PriorityRank.CRITICAL;
    if (score >= this.HIGH_SCORE_THRESHOLD) return PriorityRank.HIGH;
    if (score >= 40) return PriorityRank.MEDIUM;
    return PriorityRank.LOW;
  }

  private generateJustification(
    factors: PriorityScore["factors"],
    request: AddOnRequest
  ): string[] {
    const justification: string[] = [];

    if (factors.clinical >= 80) {
      justification.push("High clinical urgency");
    } else if (factors.clinical >= 60) {
      justification.push("Moderate clinical urgency");
    }

    if (factors.timing >= 80) {
      justification.push("Time-sensitive case");
    }

    if (request.priority === CasePriority.EMERGENT) {
      justification.push("Emergency case requiring immediate attention");
    }

    if (factors.availability >= 70) {
      justification.push("Multiple placement options available");
    }

    if (request.estimatedDuration <= 60) {
      justification.push("Short duration facilitates scheduling");
    }

    return justification;
  }

  // --------------------------------------------------------------------------
  // Bump Protocol Management
  // --------------------------------------------------------------------------

  findBumpCandidates(
    scheduledCases: SurgicalCase[],
    targetDate: Date,
    protocol: BumpProtocol
  ): BumpCandidate[] {
    const candidates: BumpCandidate[] = [];

    for (const surgicalCase of scheduledCases) {
      if (surgicalCase.status !== CaseStatus.SCHEDULED) continue;

      const caseDate = new Date(surgicalCase.scheduledDate);
      if (format(caseDate, "yyyy-MM-dd") !== format(targetDate, "yyyy-MM-dd"))
        continue;

      const evaluation = this.evaluateBumpability(surgicalCase, protocol);

      if (evaluation.bumpable) {
        candidates.push({
          caseId: surgicalCase.id,
          patientName: surgicalCase.patientName,
          procedureName: surgicalCase.procedureName,
          scheduledTime: new Date(surgicalCase.scheduledStartTime),
          surgeon: surgicalCase.surgeonName,
          bumpable: true,
          bumpScore: evaluation.score,
          reasons: evaluation.reasons,
          alternatives: [], // Would be populated with alternative slots
        });
      }
    }

    return candidates.sort((a, b) => a.bumpScore - b.bumpScore);
  }

  private evaluateBumpability(
    surgicalCase: SurgicalCase,
    protocol: BumpProtocol
  ): {
    bumpable: boolean;
    score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let bumpable = true;
    let score = 50;

    // Protected priorities cannot be bumped
    if (protocol.protectedPriorities.includes(surgicalCase.priority)) {
      return {
        bumpable: false,
        score: 100,
        reasons: ["Priority level is protected from bumping"],
      };
    }

    // Elective cases are more bumpable
    if (surgicalCase.priority === CasePriority.ELECTIVE) {
      score -= 20;
      reasons.push("Elective case - can be rescheduled");
    }

    // Cases further in the future are more bumpable
    const hoursUntilCase = differenceInHours(
      new Date(surgicalCase.scheduledStartTime),
      new Date()
    );

    if (hoursUntilCase > 48) {
      score -= 10;
      reasons.push("Sufficient notice for rescheduling");
    } else if (hoursUntilCase < 24) {
      score += 30;
      reasons.push("Short notice makes bumping difficult");
    }

    // Pre-op completed cases are harder to bump
    if (surgicalCase.preOpCompleted) {
      score += 25;
      reasons.push("Pre-op assessment already completed");
    }

    // Cases with consent signed are harder to bump
    if (surgicalCase.consent.signed) {
      score += 15;
      reasons.push("Patient consent already obtained");
    }

    return {
      bumpable,
      score,
      reasons,
    };
  }

  shouldBumpCase(
    addOnScore: PriorityScore,
    bumpCandidate: BumpCandidate,
    protocol: BumpProtocol
  ): {
    shouldBump: boolean;
    reason: string;
    requiresApproval: boolean;
  } {
    // Never bump if add-on is not high priority
    if (addOnScore.rank === PriorityRank.LOW) {
      return {
        shouldBump: false,
        reason: "Add-on case priority too low to justify bumping",
        requiresApproval: false,
      };
    }

    // Critical cases can bump if urgent enough
    if (addOnScore.rank === PriorityRank.CRITICAL) {
      return {
        shouldBump: true,
        reason: "Critical case requires immediate scheduling",
        requiresApproval: protocol.approvalRequired,
      };
    }

    // Compare scores
    const scoreDifference = addOnScore.total - bumpCandidate.bumpScore;

    if (scoreDifference >= 30) {
      return {
        shouldBump: true,
        reason: `Add-on case has significantly higher priority (score difference: ${scoreDifference.toFixed(0)})`,
        requiresApproval: protocol.approvalRequired,
      };
    }

    return {
      shouldBump: false,
      reason: "Insufficient priority difference to justify bumping",
      requiresApproval: false,
    };
  }

  // --------------------------------------------------------------------------
  // Add-On Placement
  // --------------------------------------------------------------------------

  findPlacementOptions(
    addOnRequest: AddOnRequest,
    scheduledCases: SurgicalCase[],
    rooms: OperatingRoom[],
    protocol: BumpProtocol
  ): AddOnPlacement[] {
    const placements: AddOnPlacement[] = [];

    // Try to find gaps first (preferred method)
    const gapPlacements = this.findGapPlacements(
      addOnRequest,
      scheduledCases,
      rooms
    );
    placements.push(...gapPlacements);

    // If no gaps and high priority, consider bumping
    const priorityScore = this.calculatePriorityScore(addOnRequest);
    if (
      gapPlacements.length === 0 &&
      (priorityScore.rank === PriorityRank.CRITICAL ||
        priorityScore.rank === PriorityRank.HIGH)
    ) {
      const bumpPlacements = this.findBumpPlacements(
        addOnRequest,
        scheduledCases,
        rooms,
        protocol,
        priorityScore
      );
      placements.push(...bumpPlacements);
    }

    // Consider extending the day
    const extendPlacements = this.findExtendDayPlacements(
      addOnRequest,
      scheduledCases,
      rooms
    );
    placements.push(...extendPlacements);

    return placements.sort(
      (a, b) => b.placement.confidence - a.placement.confidence
    );
  }

  private findGapPlacements(
    addOnRequest: AddOnRequest,
    scheduledCases: SurgicalCase[],
    rooms: OperatingRoom[]
  ): AddOnPlacement[] {
    const placements: AddOnPlacement[] = [];

    for (const roomId of addOnRequest.acceptableRooms) {
      const room = rooms.find((r) => r.id === roomId);
      if (!room || !room.isActive) continue;

      // Find gaps in the schedule
      const roomCases = scheduledCases
        .filter(
          (c) =>
            c.roomId === roomId &&
            format(new Date(c.scheduledDate), "yyyy-MM-dd") ===
              format(addOnRequest.preferredDate, "yyyy-MM-dd") &&
            c.status !== CaseStatus.CANCELLED
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledStartTime).getTime() -
            new Date(b.scheduledStartTime).getTime()
        );

      // Check gaps between cases
      for (let i = 0; i < roomCases.length - 1; i++) {
        const currentCase = roomCases[i];
        const nextCase = roomCases[i + 1];

        const currentEnd = addMinutes(
          new Date(currentCase.scheduledStartTime),
          currentCase.estimatedDuration + (room.turnoverDuration || 30)
        );
        const nextStart = new Date(nextCase.scheduledStartTime);

        const gapMinutes = differenceInMinutes(nextStart, currentEnd);

        if (gapMinutes >= addOnRequest.estimatedDuration + (room.turnoverDuration || 30)) {
          placements.push({
            addOnCaseId: `addon-${Date.now()}`,
            placement: {
              roomId: room.id,
              roomName: room.roomName,
              scheduledTime: currentEnd,
              method: PlacementMethod.UTILIZE_GAP,
              confidence: 90,
            },
            bumpedCase: null,
            impact: {
              delayedCases: 0,
              totalDelayMinutes: 0,
              utilizationChange: 5,
              costImpact: 0,
            },
          });
        }
      }
    }

    return placements;
  }

  private findBumpPlacements(
    addOnRequest: AddOnRequest,
    scheduledCases: SurgicalCase[],
    rooms: OperatingRoom[],
    protocol: BumpProtocol,
    addOnScore: PriorityScore
  ): AddOnPlacement[] {
    const placements: AddOnPlacement[] = [];

    const bumpCandidates = this.findBumpCandidates(
      scheduledCases,
      addOnRequest.preferredDate,
      protocol
    );

    for (const candidate of bumpCandidates.slice(0, 3)) {
      // Top 3 candidates
      const bumpDecision = this.shouldBumpCase(addOnScore, candidate, protocol);

      if (bumpDecision.shouldBump) {
        placements.push({
          addOnCaseId: `addon-${Date.now()}`,
          placement: {
            roomId: "room-id", // Would get from candidate
            roomName: "OR 1", // Would get from candidate
            scheduledTime: candidate.scheduledTime,
            method: PlacementMethod.BUMP_ELECTIVE,
            confidence: bumpDecision.requiresApproval ? 60 : 75,
          },
          bumpedCase: candidate,
          impact: {
            delayedCases: 1,
            totalDelayMinutes: 0,
            utilizationChange: 0,
            costImpact: -500, // Bumping has a cost
          },
        });
      }
    }

    return placements;
  }

  private findExtendDayPlacements(
    addOnRequest: AddOnRequest,
    scheduledCases: SurgicalCase[],
    rooms: OperatingRoom[]
  ): AddOnPlacement[] {
    const placements: AddOnPlacement[] = [];

    for (const roomId of addOnRequest.acceptableRooms) {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) continue;

      const roomCases = scheduledCases
        .filter(
          (c) =>
            c.roomId === roomId &&
            format(new Date(c.scheduledDate), "yyyy-MM-dd") ===
              format(addOnRequest.preferredDate, "yyyy-MM-dd")
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledStartTime).getTime() -
            new Date(b.scheduledStartTime).getTime()
        );

      if (roomCases.length > 0) {
        const lastCase = roomCases[roomCases.length - 1];
        const lastEnd = addMinutes(
          new Date(lastCase.scheduledStartTime),
          lastCase.estimatedDuration + (room.turnoverDuration || 30)
        );

        const endHour = lastEnd.getHours();
        if (endHour < 18) {
          // Can still fit before 6 PM
          placements.push({
            addOnCaseId: `addon-${Date.now()}`,
            placement: {
              roomId: room.id,
              roomName: room.roomName,
              scheduledTime: lastEnd,
              method: PlacementMethod.EXTEND_DAY,
              confidence: endHour < 16 ? 80 : 60,
            },
            bumpedCase: null,
            impact: {
              delayedCases: 0,
              totalDelayMinutes: 0,
              utilizationChange: 10,
              costImpact: 200, // Overtime costs
            },
          });
        }
      }
    }

    return placements;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: AddOnManager | null = null;

export function getAddOnManager(): AddOnManager {
  if (!managerInstance) {
    managerInstance = new AddOnManager();
  }
  return managerInstance;
}
