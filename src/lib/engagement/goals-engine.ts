/**
 * Health Goals Management Engine
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive system for managing patient health goals including:
 * - Goal creation, tracking, and completion
 * - Progress monitoring and milestone tracking
 * - Automated reminders and notifications
 * - Goal recommendations based on patient data
 * - Analytics and reporting
 */

import type {
  HealthGoal,
  GoalType,
  GoalCategory,
  GoalStatus,
  GoalPriority,
  GoalVisibility,
  GoalMilestone,
  GoalProgress,
  ProgressSource,
  ReminderFrequency,
  CreateGoalDto,
  UpdateGoalDto,
} from "@/types/engagement";

// ============================================================================
// Goal Management
// ============================================================================

export class GoalsEngine {
  /**
   * Create a new health goal for a patient
   */
  static async createGoal(data: CreateGoalDto): Promise<HealthGoal> {
    const now = new Date();

    // Generate milestones based on goal type and target
    const milestones = this.generateMilestones(
      data.type,
      data.targetValue,
      data.unit
    );

    const goal: HealthGoal = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.patientId,
      updatedBy: data.patientId,
      patientId: data.patientId,
      type: data.type,
      category: data.category,
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: 0,
      unit: data.unit,
      startDate: now,
      targetDate: data.targetDate,
      completedDate: null,
      status: GoalStatus.ACTIVE,
      priority: data.priority || GoalPriority.MEDIUM,
      visibility: data.visibility || GoalVisibility.SHARED_WITH_PROVIDER,
      milestones,
      reminderFrequency: data.reminderFrequency || null,
      lastReminderSent: null,
      assignedBy: null,
      tags: [],
      notes: null,
      relatedConditions: [],
      relatedMedications: [],
    };

    return goal;
  }

  /**
   * Update goal progress
   */
  static async updateProgress(
    goalId: string,
    value: number,
    source: ProgressSource,
    metadata?: Record<string, any>
  ): Promise<{ goal: HealthGoal; pointsEarned: number }> {
    // In production, fetch from database
    const goal = await this.getGoalById(goalId);

    const previousValue = goal.currentValue;
    goal.currentValue = value;
    goal.updatedAt = new Date();

    // Check milestone achievements
    const achievedMilestones = goal.milestones.filter(
      (m) => !m.achievedDate && m.value <= value
    );

    let pointsEarned = 0;
    achievedMilestones.forEach((milestone) => {
      milestone.achievedDate = new Date();
      pointsEarned += milestone.rewardPoints;
    });

    // Check goal completion
    if (value >= goal.targetValue && goal.status === GoalStatus.ACTIVE) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedDate = new Date();
      pointsEarned += this.calculateCompletionPoints(goal);
    }

    // Record progress entry
    await this.recordProgress({
      goalId,
      date: new Date(),
      value,
      note: null,
      recordedBy: goal.patientId,
      source,
      metadata: metadata || {},
    });

    return { goal, pointsEarned };
  }

  /**
   * Generate smart milestones based on goal type
   */
  private static generateMilestones(
    type: GoalType,
    targetValue: number,
    unit: string
  ): GoalMilestone[] {
    const milestones: GoalMilestone[] = [];
    const percentages = [25, 50, 75, 90];

    percentages.forEach((percentage, index) => {
      const value = (targetValue * percentage) / 100;
      milestones.push({
        id: crypto.randomUUID(),
        value: Math.round(value * 100) / 100,
        description: `${percentage}% of goal achieved`,
        achievedDate: null,
        rewardPoints: this.calculateMilestonePoints(percentage),
      });
    });

    return milestones;
  }

  /**
   * Calculate milestone reward points
   */
  private static calculateMilestonePoints(percentage: number): number {
    const basePoints = 10;
    const multiplier = percentage / 25;
    return Math.round(basePoints * multiplier);
  }

  /**
   * Calculate goal completion points
   */
  private static calculateCompletionPoints(goal: HealthGoal): number {
    let basePoints = 100;

    // Priority multiplier
    const priorityMultipliers: Record<GoalPriority, number> = {
      [GoalPriority.LOW]: 0.8,
      [GoalPriority.MEDIUM]: 1.0,
      [GoalPriority.HIGH]: 1.3,
      [GoalPriority.CRITICAL]: 1.5,
    };

    basePoints *= priorityMultipliers[goal.priority];

    // Early completion bonus
    const daysRemaining = Math.floor(
      (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysRemaining > 0) {
      const earlyBonus = Math.min(daysRemaining * 2, 50);
      basePoints += earlyBonus;
    }

    return Math.round(basePoints);
  }

  /**
   * Get goal recommendations for a patient based on their health data
   */
  static async getGoalRecommendations(
    patientId: string,
    healthData: HealthDataSnapshot
  ): Promise<GoalRecommendation[]> {
    const recommendations: GoalRecommendation[] = [];

    // BMI-based recommendations
    if (healthData.bmi) {
      if (healthData.bmi > 25 && healthData.bmi < 30) {
        recommendations.push({
          type: GoalType.WEIGHT_LOSS,
          title: "Achieve Healthy Weight",
          description: "Reduce weight to improve overall health",
          suggestedTarget: this.calculateWeightLossTarget(
            healthData.weight,
            healthData.height
          ),
          unit: "lbs",
          priority: GoalPriority.MEDIUM,
          reason: "Your BMI indicates you're in the overweight range",
          evidence: ["Losing 5-10% of body weight can significantly improve health"],
        });
      } else if (healthData.bmi >= 30) {
        recommendations.push({
          type: GoalType.WEIGHT_LOSS,
          title: "Weight Loss Program",
          description: "Structured weight loss for better health outcomes",
          suggestedTarget: this.calculateWeightLossTarget(
            healthData.weight,
            healthData.height
          ),
          unit: "lbs",
          priority: GoalPriority.HIGH,
          reason: "Your BMI indicates obesity",
          evidence: [
            "Weight loss reduces risk of diabetes, heart disease, and other conditions",
          ],
        });
      }
    }

    // Blood pressure recommendations
    if (healthData.systolicBP && healthData.systolicBP > 130) {
      recommendations.push({
        type: GoalType.BLOOD_PRESSURE,
        title: "Lower Blood Pressure",
        description: "Reduce blood pressure through lifestyle changes",
        suggestedTarget: 120,
        unit: "mmHg",
        priority: GoalPriority.HIGH,
        reason: "Your blood pressure is elevated",
        evidence: ["Target BP <120/80 reduces cardiovascular risk"],
      });
    }

    // Physical activity recommendations
    if (!healthData.exerciseMinutesPerWeek || healthData.exerciseMinutesPerWeek < 150) {
      recommendations.push({
        type: GoalType.EXERCISE,
        title: "Increase Physical Activity",
        description: "Meet recommended weekly exercise guidelines",
        suggestedTarget: 150,
        unit: "minutes/week",
        priority: GoalPriority.MEDIUM,
        reason: "Current activity level is below recommended guidelines",
        evidence: ["150 minutes of moderate exercise per week improves health outcomes"],
      });
    }

    // Blood sugar recommendations for diabetics
    if (healthData.hasDiabetes && healthData.a1c && healthData.a1c > 7) {
      recommendations.push({
        type: GoalType.BLOOD_SUGAR,
        title: "Improve Glucose Control",
        description: "Lower A1C to target range",
        suggestedTarget: 7,
        unit: "%",
        priority: GoalPriority.CRITICAL,
        reason: "Your A1C is above target",
        evidence: ["A1C <7% reduces diabetes complications"],
      });
    }

    // Medication adherence
    if (healthData.medicationAdherence && healthData.medicationAdherence < 80) {
      recommendations.push({
        type: GoalType.MEDICATION_ADHERENCE,
        title: "Improve Medication Adherence",
        description: "Take medications as prescribed",
        suggestedTarget: 95,
        unit: "%",
        priority: GoalPriority.HIGH,
        reason: "Current medication adherence is below optimal",
        evidence: ["80%+ adherence is needed for medication effectiveness"],
      });
    }

    // Steps/activity tracking
    if (!healthData.averageStepsPerDay || healthData.averageStepsPerDay < 7000) {
      recommendations.push({
        type: GoalType.STEPS,
        title: "Increase Daily Steps",
        description: "Walk more for better cardiovascular health",
        suggestedTarget: 10000,
        unit: "steps/day",
        priority: GoalPriority.LOW,
        reason: "Increasing daily steps improves overall fitness",
        evidence: ["10,000 steps per day is associated with better health outcomes"],
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimal weight loss target
   */
  private static calculateWeightLossTarget(
    currentWeight: number,
    height: number
  ): number {
    // Calculate 10% weight loss as initial target
    return Math.round(currentWeight * 0.9);
  }

  /**
   * Check if goal reminders need to be sent
   */
  static async checkAndSendReminders(): Promise<void> {
    // In production, query database for active goals with reminders
    const goalsNeedingReminders = await this.getGoalsNeedingReminders();

    for (const goal of goalsNeedingReminders) {
      const shouldSend = this.shouldSendReminder(goal);

      if (shouldSend) {
        await this.sendGoalReminder(goal);
        goal.lastReminderSent = new Date();
        // Update in database
      }
    }
  }

  /**
   * Determine if a reminder should be sent
   */
  private static shouldSendReminder(goal: HealthGoal): boolean {
    if (!goal.reminderFrequency || !goal.status === GoalStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    const lastSent = goal.lastReminderSent;

    if (!lastSent) {
      return true;
    }

    const daysSinceLastReminder = Math.floor(
      (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (goal.reminderFrequency) {
      case ReminderFrequency.DAILY:
        return daysSinceLastReminder >= 1;
      case ReminderFrequency.WEEKLY:
        return daysSinceLastReminder >= 7;
      case ReminderFrequency.BIWEEKLY:
        return daysSinceLastReminder >= 14;
      case ReminderFrequency.MONTHLY:
        return daysSinceLastReminder >= 30;
      default:
        return false;
    }
  }

  /**
   * Send goal reminder notification
   */
  private static async sendGoalReminder(goal: HealthGoal): Promise<void> {
    // Implementation would integrate with notification system
    console.log(`Sending reminder for goal: ${goal.title}`);
  }

  /**
   * Analyze goal achievement patterns
   */
  static async analyzeGoalPatterns(
    patientId: string,
    timeframe: Date
  ): Promise<GoalAnalytics> {
    const goals = await this.getPatientGoals(patientId, timeframe);

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
    const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
    const abandonedGoals = goals.filter((g) => g.status === GoalStatus.ABANDONED);

    const completionRate = totalGoals > 0 ? completedGoals.length / totalGoals : 0;

    // Calculate average time to completion
    const completionTimes = completedGoals
      .filter((g) => g.completedDate)
      .map((g) => {
        const start = g.startDate.getTime();
        const end = g.completedDate!.getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // days
      });

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    // Most successful goal types
    const typeSuccessRates = this.calculateTypeSuccessRates(goals);

    return {
      totalGoals,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      abandonedGoals: abandonedGoals.length,
      completionRate,
      avgCompletionTime,
      typeSuccessRates,
      strongestCategories: this.identifyStrongestCategories(typeSuccessRates),
      recommendedFocus: this.getRecommendedFocus(typeSuccessRates),
    };
  }

  /**
   * Calculate success rates by goal type
   */
  private static calculateTypeSuccessRates(
    goals: HealthGoal[]
  ): Record<GoalType, number> {
    const rates: Partial<Record<GoalType, number>> = {};

    Object.values(GoalType).forEach((type) => {
      const typeGoals = goals.filter((g) => g.type === type);
      const completedTypeGoals = typeGoals.filter(
        (g) => g.status === GoalStatus.COMPLETED
      );
      rates[type] = typeGoals.length > 0 ? completedTypeGoals.length / typeGoals.length : 0;
    });

    return rates as Record<GoalType, number>;
  }

  /**
   * Identify strongest goal categories
   */
  private static identifyStrongestCategories(
    rates: Record<GoalType, number>
  ): GoalType[] {
    return Object.entries(rates)
      .filter(([_, rate]) => rate > 0.7)
      .sort((a, b) => b[1] - a[1])
      .map(([type, _]) => type as GoalType);
  }

  /**
   * Get recommended focus areas
   */
  private static getRecommendedFocus(
    rates: Record<GoalType, number>
  ): GoalType[] {
    return Object.entries(rates)
      .filter(([_, rate]) => rate < 0.5 && rate > 0)
      .sort((a, b) => a[1] - b[1])
      .map(([type, _]) => type as GoalType)
      .slice(0, 3);
  }

  // ============================================================================
  // Helper Methods (would connect to database in production)
  // ============================================================================

  private static async getGoalById(goalId: string): Promise<HealthGoal> {
    // Mock implementation - replace with database query
    throw new Error("Not implemented");
  }

  private static async getPatientGoals(
    patientId: string,
    since?: Date
  ): Promise<HealthGoal[]> {
    // Mock implementation - replace with database query
    return [];
  }

  private static async getGoalsNeedingReminders(): Promise<HealthGoal[]> {
    // Mock implementation - replace with database query
    return [];
  }

  private static async recordProgress(progress: Omit<GoalProgress, "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy">): Promise<void> {
    // Mock implementation - replace with database insert
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface HealthDataSnapshot {
  weight?: number;
  height?: number;
  bmi?: number;
  systolicBP?: number;
  diastolicBP?: number;
  a1c?: number;
  hasDiabetes?: boolean;
  exerciseMinutesPerWeek?: number;
  averageStepsPerDay?: number;
  medicationAdherence?: number;
}

interface GoalRecommendation {
  type: GoalType;
  title: string;
  description: string;
  suggestedTarget: number;
  unit: string;
  priority: GoalPriority;
  reason: string;
  evidence: string[];
}

interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  abandonedGoals: number;
  completionRate: number;
  avgCompletionTime: number;
  typeSuccessRates: Record<GoalType, number>;
  strongestCategories: GoalType[];
  recommendedFocus: GoalType[];
}
