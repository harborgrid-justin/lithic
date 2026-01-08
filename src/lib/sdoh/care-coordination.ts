/**
 * SDOH Care Coordination System
 *
 * Comprehensive care coordination for managing social needs,
 * care teams, goals, and barriers to care.
 */

import type {
  SDOHCareCoordination,
  CoordinationGoal,
  Barrier,
  CareTeamMember,
  CoordinationStatus,
  GoalStatus,
  BarrierType,
  SDOHDomain,
} from "@/types/sdoh";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Care Coordination Manager
// ============================================================================

export class CareCoordinationManager {
  /**
   * Create care coordination plan
   */
  async createCoordinationPlan(
    patientId: string,
    coordinatorId: string,
    identifiedNeeds: string[]
  ): Promise<SDOHCareCoordination> {
    const plan: Partial<SDOHCareCoordination> = {
      id: uuidv4(),
      patientId,
      coordinatorId,
      identifiedNeeds,
      careTeam: [],
      referrals: [],
      interventions: [],
      goals: [],
      barriers: [],
      status: CoordinationStatus.ACTIVE,
      startDate: new Date(),
      endDate: null,
      reviewDate: this.calculateNextReviewDate(),
      notes: null,
    };

    return plan as SDOHCareCoordination;
  }

  /**
   * Add care team member
   */
  addCareTeamMember(
    member: Omit<CareTeamMember, "id">
  ): CareTeamMember {
    return {
      id: uuidv4(),
      ...member,
      active: true,
    };
  }

  /**
   * Create goal
   */
  createGoal(
    description: string,
    domain: SDOHDomain,
    targetDate: Date
  ): CoordinationGoal {
    return {
      id: uuidv4(),
      description,
      domain,
      targetDate,
      status: GoalStatus.NOT_STARTED,
      progress: 0,
      milestones: [],
      barriers: [],
    };
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goal: CoordinationGoal, progress: number): void {
    goal.progress = Math.min(100, Math.max(0, progress));

    if (progress >= 100) {
      goal.status = GoalStatus.COMPLETED;
    } else if (progress > 0) {
      goal.status = GoalStatus.IN_PROGRESS;
    }
  }

  /**
   * Add barrier
   */
  addBarrier(
    type: BarrierType,
    description: string,
    domain: SDOHDomain | null
  ): Barrier {
    return {
      id: uuidv4(),
      type,
      description,
      domain,
      identifiedDate: new Date(),
      status: "ACTIVE",
      resolutionStrategy: null,
      resolvedDate: null,
    };
  }

  /**
   * Resolve barrier
   */
  resolveBarrier(
    barrier: Barrier,
    resolutionStrategy: string
  ): void {
    barrier.status = "RESOLVED";
    barrier.resolutionStrategy = resolutionStrategy;
    barrier.resolvedDate = new Date();
  }

  /**
   * Calculate coordination effectiveness
   */
  calculateEffectiveness(plan: SDOHCareCoordination): number {
    let score = 0;

    // Goal completion (40 points)
    if (plan.goals.length > 0) {
      const completedGoals = plan.goals.filter(
        (g) => g.status === GoalStatus.COMPLETED
      ).length;
      score += (completedGoals / plan.goals.length) * 40;
    }

    // Active referrals (20 points)
    if (plan.referrals.length > 0) {
      score += 20;
    }

    // Care team engagement (20 points)
    const activeTeamMembers = plan.careTeam.filter((m) => m.active).length;
    if (activeTeamMembers >= 2) {
      score += 20;
    } else if (activeTeamMembers === 1) {
      score += 10;
    }

    // Barrier resolution (20 points)
    if (plan.barriers.length > 0) {
      const resolvedBarriers = plan.barriers.filter(
        (b) => b.status === "RESOLVED"
      ).length;
      score += (resolvedBarriers / plan.barriers.length) * 20;
    } else {
      score += 20; // No barriers is good
    }

    return Math.round(score);
  }

  /**
   * Check if review is due
   */
  isReviewDue(plan: SDOHCareCoordination): boolean {
    if (!plan.reviewDate) return true;
    return new Date() >= plan.reviewDate;
  }

  /**
   * Generate care coordination summary
   */
  generateSummary(plan: SDOHCareCoordination): CoordinationSummary {
    return {
      planId: plan.id,
      patientId: plan.patientId,
      status: plan.status,
      duration: this.calculateDuration(plan.startDate, plan.endDate),
      goalsTotal: plan.goals.length,
      goalsCompleted: plan.goals.filter(
        (g) => g.status === GoalStatus.COMPLETED
      ).length,
      activeReferrals: plan.referrals.length,
      activeBarriers: plan.barriers.filter((b) => b.status === "ACTIVE").length,
      careTeamSize: plan.careTeam.filter((m) => m.active).length,
      effectiveness: this.calculateEffectiveness(plan),
      reviewDue: this.isReviewDue(plan),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateNextReviewDate(): Date {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 30); // 30-day review cycle
    return reviewDate;
  }

  private calculateDuration(
    startDate: Date,
    endDate: Date | null
  ): number {
    const end = endDate || new Date();
    return Math.floor(
      (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface CoordinationSummary {
  planId: string;
  patientId: string;
  status: CoordinationStatus;
  duration: number; // days
  goalsTotal: number;
  goalsCompleted: number;
  activeReferrals: number;
  activeBarriers: number;
  careTeamSize: number;
  effectiveness: number; // 0-100
  reviewDue: boolean;
}

/**
 * Export singleton instance
 */
export const careCoordinator = new CareCoordinationManager();
