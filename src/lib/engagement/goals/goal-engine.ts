/**
 * Goal Engine - Health Goals System
 * Goal setting, tracking, progress calculation, and milestone notifications
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PointActivity, PointsSystem } from '../gamification/points-system';

export enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  EXERCISE = 'exercise',
  NUTRITION = 'nutrition',
  MEDICATION_ADHERENCE = 'medication_adherence',
  VITAL_SIGNS = 'vital_signs',
  SLEEP = 'sleep',
  STRESS_MANAGEMENT = 'stress_management',
  PREVENTIVE_CARE = 'preventive_care',
  CHRONIC_DISEASE = 'chronic_disease',
  CUSTOM = 'custom',
}

export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  FAILED = 'failed',
}

export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  title: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  startDate: Date;
  targetDate: Date;
  actualEndDate?: Date;

  // SMART Goal components
  specific: string; // What exactly will be achieved
  measurable: GoalMetric;
  achievable: string; // Why this is achievable
  relevant: string; // Why this matters
  timeBound: string; // When it will be achieved

  // Progress tracking
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercentage: number;

  // Milestones
  milestones: GoalMilestone[];

  // Metadata
  tags: string[];
  category: string;
  providerId?: string; // If assigned by healthcare provider
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  direction: 'increase' | 'decrease' | 'maintain';
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: Date;
  points: number;
}

export interface GoalProgress {
  goalId: string;
  date: Date;
  value: number;
  note?: string;
  metadata?: Record<string, any>;
}

export class GoalEngine {
  /**
   * Create a new health goal
   */
  static async createGoal(userId: string, goalData: Partial<Goal>): Promise<Goal> {
    // Validate SMART criteria
    if (!this.validateSMARTGoal(goalData)) {
      throw new Error('Goal does not meet SMART criteria');
    }

    // Calculate initial milestones
    const milestones = this.generateMilestones(
      goalData.currentValue || 0,
      goalData.targetValue || 0,
      goalData.unit || ''
    );

    const goal = await db.goal.create({
      data: {
        userId,
        type: goalData.type || GoalType.CUSTOM,
        title: goalData.title || '',
        description: goalData.description || '',
        priority: goalData.priority || GoalPriority.MEDIUM,
        status: GoalStatus.ACTIVE,
        startDate: goalData.startDate || new Date(),
        targetDate: goalData.targetDate || new Date(),
        specific: goalData.specific || '',
        measurable: goalData.measurable || {},
        achievable: goalData.achievable || '',
        relevant: goalData.relevant || '',
        timeBound: goalData.timeBound || '',
        currentValue: goalData.currentValue || 0,
        targetValue: goalData.targetValue || 0,
        unit: goalData.unit || '',
        progressPercentage: 0,
        milestones: milestones,
        tags: goalData.tags || [],
        category: goalData.category || 'general',
        providerId: goalData.providerId,
      },
    });

    // Award points for creating goal
    await PointsSystem.awardPoints(userId, PointActivity.CREATE_GOAL, {
      goalId: goal.id,
      goalType: goal.type,
    });

    await logAudit({
      action: 'GOAL_CREATED',
      userId,
      resource: 'goal',
      resourceId: goal.id,
      description: `Goal created: ${goal.title}`,
      metadata: {
        type: goal.type,
        title: goal.title,
      },
    });

    return goal as Goal;
  }

  /**
   * Update goal progress
   */
  static async updateProgress(
    userId: string,
    goalId: string,
    newValue: number,
    note?: string
  ): Promise<Goal> {
    const goal = await db.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.status !== GoalStatus.ACTIVE) {
      throw new Error('Goal is not active');
    }

    // Record progress
    await db.goalProgress.create({
      data: {
        goalId,
        date: new Date(),
        value: newValue,
        note,
      },
    });

    // Calculate new progress percentage
    const metric = goal.measurable as GoalMetric;
    const progressPercentage = this.calculateProgress(
      goal.currentValue as number,
      newValue,
      goal.targetValue as number,
      metric.direction
    );

    // Check milestones
    const milestones = (goal.milestones as GoalMilestone[]) || [];
    const updatedMilestones = this.updateMilestones(milestones, newValue);

    // Check for newly achieved milestones
    const newlyAchieved = updatedMilestones.filter(
      (m, i) => m.achieved && !milestones[i].achieved
    );

    // Award points for milestone achievements
    for (const milestone of newlyAchieved) {
      await db.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: milestone.points },
          availablePoints: { increment: milestone.points },
          lifetimePoints: { increment: milestone.points },
        },
      });
    }

    // Update goal
    const updatedGoal = await db.goal.update({
      where: { id: goalId },
      data: {
        currentValue: newValue,
        progressPercentage,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      },
    });

    // Check if goal is completed
    if (progressPercentage >= 100) {
      await this.completeGoal(userId, goalId);
    }

    return updatedGoal as Goal;
  }

  /**
   * Complete a goal
   */
  static async completeGoal(userId: string, goalId: string): Promise<Goal> {
    const goal = await db.goal.update({
      where: { id: goalId },
      data: {
        status: GoalStatus.COMPLETED,
        actualEndDate: new Date(),
        progressPercentage: 100,
      },
    });

    // Award points for completing goal
    await PointsSystem.awardPoints(userId, PointActivity.COMPLETE_GOAL, {
      goalId,
      goalType: goal.type,
    });

    await logAudit({
      action: 'GOAL_COMPLETED',
      userId,
      resource: 'goal',
      resourceId: goalId,
      description: `Goal completed: ${goal.title}`,
      metadata: {
        type: goal.type,
        title: goal.title,
        daysToComplete: Math.floor(
          (new Date().getTime() - new Date(goal.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      },
    });

    return goal as Goal;
  }

  /**
   * Get user's goals
   */
  static async getUserGoals(
    userId: string,
    status?: GoalStatus
  ): Promise<Goal[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const goals = await db.goal.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { targetDate: 'asc' },
      ],
    });

    return goals as Goal[];
  }

  /**
   * Get goal progress history
   */
  static async getProgressHistory(
    goalId: string,
    limit = 100
  ): Promise<GoalProgress[]> {
    const progress = await db.goalProgress.findMany({
      where: { goalId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return progress as GoalProgress[];
  }

  /**
   * Calculate progress percentage
   */
  private static calculateProgress(
    startValue: number,
    currentValue: number,
    targetValue: number,
    direction: 'increase' | 'decrease' | 'maintain'
  ): number {
    if (direction === 'maintain') {
      // For maintain goals, check if within acceptable range (e.g., ±5%)
      const tolerance = targetValue * 0.05;
      return Math.abs(currentValue - targetValue) <= tolerance ? 100 : 0;
    }

    const totalChange = Math.abs(targetValue - startValue);
    const currentChange = Math.abs(currentValue - startValue);

    if (totalChange === 0) return 100;

    const percentage = (currentChange / totalChange) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * Generate milestones for a goal
   */
  private static generateMilestones(
    startValue: number,
    targetValue: number,
    unit: string
  ): GoalMilestone[] {
    const milestones: GoalMilestone[] = [];
    const change = targetValue - startValue;
    const milestonePercentages = [25, 50, 75, 100];

    milestonePercentages.forEach((percentage) => {
      const value = startValue + (change * percentage) / 100;
      milestones.push({
        id: `milestone_${percentage}`,
        title: `${percentage}% Complete`,
        description: `Reach ${value.toFixed(1)} ${unit}`,
        targetValue: value,
        achieved: false,
        points: percentage * 10, // 250, 500, 750, 1000 points
      });
    });

    return milestones;
  }

  /**
   * Update milestone achievements
   */
  private static updateMilestones(
    milestones: GoalMilestone[],
    currentValue: number
  ): GoalMilestone[] {
    return milestones.map((milestone) => {
      if (!milestone.achieved && currentValue >= milestone.targetValue) {
        return {
          ...milestone,
          achieved: true,
          achievedAt: new Date(),
        };
      }
      return milestone;
    });
  }

  /**
   * Validate SMART goal criteria
   */
  private static validateSMARTGoal(goal: Partial<Goal>): boolean {
    return !!(
      goal.specific &&
      goal.measurable &&
      goal.achievable &&
      goal.relevant &&
      goal.timeBound &&
      goal.targetValue &&
      goal.targetDate
    );
  }

  /**
   * Get goal statistics
   */
  static async getGoalStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    completionRate: number;
    averageDaysToComplete: number;
    pointsEarned: number;
  }> {
    const goals = await db.goal.findMany({
      where: { userId },
    });

    const total = goals.length;
    const active = goals.filter((g) => g.status === GoalStatus.ACTIVE).length;
    const completed = goals.filter((g) => g.status === GoalStatus.COMPLETED).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
    const totalDays = completedGoals.reduce((sum, goal) => {
      const days = Math.floor(
        (new Date(goal.actualEndDate!).getTime() -
          new Date(goal.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    const averageDaysToComplete =
      completedGoals.length > 0 ? totalDays / completedGoals.length : 0;

    // Calculate points earned from goals
    const pointsFromGoals = await db.pointTransaction.aggregate({
      where: {
        userId,
        activity: {
          in: [PointActivity.CREATE_GOAL, PointActivity.COMPLETE_GOAL],
        },
      },
      _sum: {
        totalPoints: true,
      },
    });

    return {
      total,
      active,
      completed,
      completionRate,
      averageDaysToComplete,
      pointsEarned: pointsFromGoals._sum.totalPoints || 0,
    };
  }

  /**
   * Get goal recommendations based on health data
   */
  static async getRecommendations(
    userId: string
  ): Promise<Array<Partial<Goal>>> {
    // This would use AI/ML to analyze user health data and suggest goals
    // For now, return basic templates
    const recommendations: Array<Partial<Goal>> = [];

    // Check if user has weight-related goals
    const hasWeightGoal = await db.goal.findFirst({
      where: {
        userId,
        type: { in: [GoalType.WEIGHT_LOSS, GoalType.WEIGHT_GAIN] },
        status: GoalStatus.ACTIVE,
      },
    });

    if (!hasWeightGoal) {
      recommendations.push({
        type: GoalType.WEIGHT_LOSS,
        title: 'Healthy Weight Loss',
        description: 'Lose 5-10% of body weight in 12 weeks',
        priority: GoalPriority.HIGH,
      });
    }

    // Check exercise goals
    const hasExerciseGoal = await db.goal.findFirst({
      where: {
        userId,
        type: GoalType.EXERCISE,
        status: GoalStatus.ACTIVE,
      },
    });

    if (!hasExerciseGoal) {
      recommendations.push({
        type: GoalType.EXERCISE,
        title: '10,000 Steps Daily',
        description: 'Walk 10,000 steps every day for 30 days',
        priority: GoalPriority.MEDIUM,
      });
    }

    return recommendations;
  }

  /**
   * Archive or abandon a goal
   */
  static async abandonGoal(userId: string, goalId: string): Promise<Goal> {
    const goal = await db.goal.update({
      where: { id: goalId },
      data: {
        status: GoalStatus.ABANDONED,
        actualEndDate: new Date(),
      },
    });

    await logAudit({
      action: 'GOAL_ABANDONED',
      userId,
      resource: 'goal',
      resourceId: goalId,
      description: `Goal abandoned: ${goal.title}`,
      metadata: {
        type: goal.type,
        title: goal.title,
        progressPercentage: goal.progressPercentage,
      },
    });

    return goal as Goal;
  }
}
