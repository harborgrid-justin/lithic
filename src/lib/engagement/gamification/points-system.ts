/**
 * Points System - Gamification Engine
 * Manages point earning, tracking, and history for patient engagement
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export enum PointActivity {
  // Health Tracking
  LOG_VITAL_SIGNS = 'log_vital_signs',
  LOG_SYMPTOMS = 'log_symptoms',
  LOG_MEDICATION = 'log_medication',
  LOG_EXERCISE = 'log_exercise',
  LOG_NUTRITION = 'log_nutrition',
  LOG_SLEEP = 'log_sleep',
  LOG_MOOD = 'log_mood',

  // Appointments
  SCHEDULE_APPOINTMENT = 'schedule_appointment',
  ATTEND_APPOINTMENT = 'attend_appointment',
  COMPLETE_PRE_VISIT = 'complete_pre_visit',
  COMPLETE_POST_VISIT = 'complete_post_visit',

  // Education
  COMPLETE_ARTICLE = 'complete_article',
  WATCH_VIDEO = 'watch_video',
  COMPLETE_COURSE = 'complete_course',
  TAKE_QUIZ = 'take_quiz',
  PASS_QUIZ = 'pass_quiz',

  // Engagement
  FIRST_LOGIN_DAY = 'first_login_day',
  LOGIN_STREAK_7 = 'login_streak_7',
  LOGIN_STREAK_30 = 'login_streak_30',
  LOGIN_STREAK_100 = 'login_streak_100',
  COMPLETE_PROFILE = 'complete_profile',
  ADD_EMERGENCY_CONTACT = 'add_emergency_contact',

  // Goals & Challenges
  CREATE_GOAL = 'create_goal',
  COMPLETE_GOAL = 'complete_goal',
  JOIN_CHALLENGE = 'join_challenge',
  COMPLETE_CHALLENGE = 'complete_challenge',
  WIN_CHALLENGE = 'win_challenge',

  // Social
  SHARE_ACHIEVEMENT = 'share_achievement',
  HELP_PEER = 'help_peer',
  JOIN_COMMUNITY = 'join_community',
  POST_COMMENT = 'post_comment',

  // Preventive Care
  COMPLETE_SCREENING = 'complete_screening',
  GET_VACCINATION = 'get_vaccination',
  ANNUAL_CHECKUP = 'annual_checkup',

  // Medication Adherence
  MEDICATION_ADHERENCE_7 = 'medication_adherence_7',
  MEDICATION_ADHERENCE_30 = 'medication_adherence_30',
  MEDICATION_ADHERENCE_90 = 'medication_adherence_90',
}

export interface PointRule {
  activity: PointActivity;
  points: number;
  maxPerDay?: number;
  maxPerWeek?: number;
  maxPerMonth?: number;
  multiplier?: number;
  description: string;
  category: 'health' | 'engagement' | 'education' | 'social' | 'preventive';
}

export const POINT_RULES: Record<PointActivity, PointRule> = {
  // Health Tracking (10-50 points)
  [PointActivity.LOG_VITAL_SIGNS]: {
    activity: PointActivity.LOG_VITAL_SIGNS,
    points: 10,
    maxPerDay: 3,
    description: 'Log vital signs (BP, heart rate, etc.)',
    category: 'health',
  },
  [PointActivity.LOG_SYMPTOMS]: {
    activity: PointActivity.LOG_SYMPTOMS,
    points: 15,
    maxPerDay: 5,
    description: 'Track symptoms or pain levels',
    category: 'health',
  },
  [PointActivity.LOG_MEDICATION]: {
    activity: PointActivity.LOG_MEDICATION,
    points: 20,
    maxPerDay: 10,
    description: 'Log medication taken',
    category: 'health',
  },
  [PointActivity.LOG_EXERCISE]: {
    activity: PointActivity.LOG_EXERCISE,
    points: 30,
    maxPerDay: 2,
    description: 'Log exercise or physical activity',
    category: 'health',
  },
  [PointActivity.LOG_NUTRITION]: {
    activity: PointActivity.LOG_NUTRITION,
    points: 15,
    maxPerDay: 5,
    description: 'Log meals or nutrition data',
    category: 'health',
  },
  [PointActivity.LOG_SLEEP]: {
    activity: PointActivity.LOG_SLEEP,
    points: 20,
    maxPerDay: 1,
    description: 'Log sleep hours and quality',
    category: 'health',
  },
  [PointActivity.LOG_MOOD]: {
    activity: PointActivity.LOG_MOOD,
    points: 10,
    maxPerDay: 3,
    description: 'Track mood and mental wellness',
    category: 'health',
  },

  // Appointments (50-200 points)
  [PointActivity.SCHEDULE_APPOINTMENT]: {
    activity: PointActivity.SCHEDULE_APPOINTMENT,
    points: 50,
    maxPerWeek: 2,
    description: 'Schedule a healthcare appointment',
    category: 'engagement',
  },
  [PointActivity.ATTEND_APPOINTMENT]: {
    activity: PointActivity.ATTEND_APPOINTMENT,
    points: 100,
    description: 'Attend scheduled appointment',
    category: 'engagement',
  },
  [PointActivity.COMPLETE_PRE_VISIT]: {
    activity: PointActivity.COMPLETE_PRE_VISIT,
    points: 75,
    description: 'Complete pre-visit questionnaire',
    category: 'engagement',
  },
  [PointActivity.COMPLETE_POST_VISIT]: {
    activity: PointActivity.COMPLETE_POST_VISIT,
    points: 50,
    description: 'Complete post-visit survey',
    category: 'engagement',
  },

  // Education (25-200 points)
  [PointActivity.COMPLETE_ARTICLE]: {
    activity: PointActivity.COMPLETE_ARTICLE,
    points: 25,
    maxPerDay: 5,
    description: 'Read educational article',
    category: 'education',
  },
  [PointActivity.WATCH_VIDEO]: {
    activity: PointActivity.WATCH_VIDEO,
    points: 30,
    maxPerDay: 5,
    description: 'Watch educational video',
    category: 'education',
  },
  [PointActivity.COMPLETE_COURSE]: {
    activity: PointActivity.COMPLETE_COURSE,
    points: 200,
    description: 'Complete educational course',
    category: 'education',
  },
  [PointActivity.TAKE_QUIZ]: {
    activity: PointActivity.TAKE_QUIZ,
    points: 25,
    maxPerDay: 3,
    description: 'Take knowledge quiz',
    category: 'education',
  },
  [PointActivity.PASS_QUIZ]: {
    activity: PointActivity.PASS_QUIZ,
    points: 50,
    maxPerDay: 3,
    description: 'Pass knowledge quiz (80%+)',
    category: 'education',
  },

  // Engagement (10-500 points)
  [PointActivity.FIRST_LOGIN_DAY]: {
    activity: PointActivity.FIRST_LOGIN_DAY,
    points: 10,
    maxPerDay: 1,
    description: 'Daily login bonus',
    category: 'engagement',
  },
  [PointActivity.LOGIN_STREAK_7]: {
    activity: PointActivity.LOGIN_STREAK_7,
    points: 100,
    description: '7-day login streak bonus',
    category: 'engagement',
  },
  [PointActivity.LOGIN_STREAK_30]: {
    activity: PointActivity.LOGIN_STREAK_30,
    points: 300,
    description: '30-day login streak bonus',
    category: 'engagement',
  },
  [PointActivity.LOGIN_STREAK_100]: {
    activity: PointActivity.LOGIN_STREAK_100,
    points: 1000,
    description: '100-day login streak bonus',
    category: 'engagement',
  },
  [PointActivity.COMPLETE_PROFILE]: {
    activity: PointActivity.COMPLETE_PROFILE,
    points: 100,
    description: 'Complete health profile',
    category: 'engagement',
  },
  [PointActivity.ADD_EMERGENCY_CONTACT]: {
    activity: PointActivity.ADD_EMERGENCY_CONTACT,
    points: 50,
    description: 'Add emergency contact',
    category: 'engagement',
  },

  // Goals & Challenges (50-500 points)
  [PointActivity.CREATE_GOAL]: {
    activity: PointActivity.CREATE_GOAL,
    points: 50,
    maxPerWeek: 3,
    description: 'Create health goal',
    category: 'engagement',
  },
  [PointActivity.COMPLETE_GOAL]: {
    activity: PointActivity.COMPLETE_GOAL,
    points: 200,
    description: 'Complete health goal',
    category: 'engagement',
  },
  [PointActivity.JOIN_CHALLENGE]: {
    activity: PointActivity.JOIN_CHALLENGE,
    points: 50,
    description: 'Join health challenge',
    category: 'engagement',
  },
  [PointActivity.COMPLETE_CHALLENGE]: {
    activity: PointActivity.COMPLETE_CHALLENGE,
    points: 300,
    description: 'Complete health challenge',
    category: 'engagement',
  },
  [PointActivity.WIN_CHALLENGE]: {
    activity: PointActivity.WIN_CHALLENGE,
    points: 500,
    description: 'Win competitive challenge',
    category: 'engagement',
  },

  // Social (10-100 points)
  [PointActivity.SHARE_ACHIEVEMENT]: {
    activity: PointActivity.SHARE_ACHIEVEMENT,
    points: 25,
    maxPerDay: 5,
    description: 'Share achievement with community',
    category: 'social',
  },
  [PointActivity.HELP_PEER]: {
    activity: PointActivity.HELP_PEER,
    points: 50,
    maxPerDay: 3,
    description: 'Help or encourage peer',
    category: 'social',
  },
  [PointActivity.JOIN_COMMUNITY]: {
    activity: PointActivity.JOIN_COMMUNITY,
    points: 100,
    description: 'Join support community',
    category: 'social',
  },
  [PointActivity.POST_COMMENT]: {
    activity: PointActivity.POST_COMMENT,
    points: 10,
    maxPerDay: 10,
    description: 'Post helpful comment',
    category: 'social',
  },

  // Preventive Care (100-300 points)
  [PointActivity.COMPLETE_SCREENING]: {
    activity: PointActivity.COMPLETE_SCREENING,
    points: 200,
    description: 'Complete health screening',
    category: 'preventive',
  },
  [PointActivity.GET_VACCINATION]: {
    activity: PointActivity.GET_VACCINATION,
    points: 150,
    description: 'Get recommended vaccination',
    category: 'preventive',
  },
  [PointActivity.ANNUAL_CHECKUP]: {
    activity: PointActivity.ANNUAL_CHECKUP,
    points: 300,
    description: 'Complete annual checkup',
    category: 'preventive',
  },

  // Medication Adherence (100-500 points)
  [PointActivity.MEDICATION_ADHERENCE_7]: {
    activity: PointActivity.MEDICATION_ADHERENCE_7,
    points: 100,
    description: '7-day medication adherence',
    category: 'health',
  },
  [PointActivity.MEDICATION_ADHERENCE_30]: {
    activity: PointActivity.MEDICATION_ADHERENCE_30,
    points: 300,
    description: '30-day medication adherence',
    category: 'health',
  },
  [PointActivity.MEDICATION_ADHERENCE_90]: {
    activity: PointActivity.MEDICATION_ADHERENCE_90,
    points: 1000,
    description: '90-day medication adherence',
    category: 'health',
  },
};

export interface PointTransaction {
  id: string;
  userId: string;
  activity: PointActivity;
  points: number;
  multiplier: number;
  totalPoints: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PointBalance {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  lifetimePoints: number;
  currentLevel: number;
  nextLevelPoints: number;
}

export class PointsSystem {
  /**
   * Award points to a user for an activity
   */
  static async awardPoints(
    userId: string,
    activity: PointActivity,
    metadata?: Record<string, any>
  ): Promise<PointTransaction> {
    const rule = POINT_RULES[activity];
    if (!rule) {
      throw new Error(`Invalid activity: ${activity}`);
    }

    // Check daily/weekly/monthly limits
    const canAward = await this.checkLimits(userId, activity);
    if (!canAward) {
      throw new Error(`Daily/weekly/monthly limit reached for ${activity}`);
    }

    // Calculate points with multiplier
    const multiplier = await this.getMultiplier(userId);
    const basePoints = rule.points;
    const totalPoints = Math.floor(basePoints * multiplier);

    // Create transaction
    const transaction = await db.pointTransaction.create({
      data: {
        userId,
        activity,
        points: basePoints,
        multiplier,
        totalPoints,
        description: rule.description,
        metadata: metadata || {},
      },
    });

    // Update user balance
    await this.updateBalance(userId, totalPoints);

    // Log audit trail
    await logAudit({
      action: 'POINTS_AWARDED',
      userId,
      resource: 'points',
      resourceId: transaction.id,
      description: `Points awarded for ${activity}`,
      metadata: {
        activity,
        points: totalPoints,
        multiplier,
      },
    });

    return transaction as PointTransaction;
  }

  /**
   * Check if user can earn points for activity (respecting limits)
   */
  private static async checkLimits(
    userId: string,
    activity: PointActivity
  ): Promise<boolean> {
    const rule = POINT_RULES[activity];
    const now = new Date();

    if (rule.maxPerDay) {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const count = await db.pointTransaction.count({
        where: {
          userId,
          activity,
          createdAt: { gte: startOfDay },
        },
      });
      if (count >= rule.maxPerDay) return false;
    }

    if (rule.maxPerWeek) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const count = await db.pointTransaction.count({
        where: {
          userId,
          activity,
          createdAt: { gte: startOfWeek },
        },
      });
      if (count >= rule.maxPerWeek) return false;
    }

    if (rule.maxPerMonth) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await db.pointTransaction.count({
        where: {
          userId,
          activity,
          createdAt: { gte: startOfMonth },
        },
      });
      if (count >= rule.maxPerMonth) return false;
    }

    return true;
  }

  /**
   * Get point multiplier based on user level, streaks, etc.
   */
  private static async getMultiplier(userId: string): Promise<number> {
    let multiplier = 1.0;

    // Level bonus (5% per level)
    const balance = await this.getBalance(userId);
    multiplier += balance.currentLevel * 0.05;

    // Login streak bonus
    const streak = await this.getLoginStreak(userId);
    if (streak >= 7) multiplier += 0.1;
    if (streak >= 30) multiplier += 0.2;
    if (streak >= 100) multiplier += 0.5;

    // Max multiplier 3x
    return Math.min(multiplier, 3.0);
  }

  /**
   * Get user's current login streak
   */
  private static async getLoginStreak(userId: string): Promise<number> {
    // This would be implemented with actual login tracking
    // For now, return 0
    return 0;
  }

  /**
   * Update user's point balance
   */
  private static async updateBalance(
    userId: string,
    points: number
  ): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: points },
        availablePoints: { increment: points },
        lifetimePoints: { increment: points },
      },
    });
  }

  /**
   * Get user's point balance and level info
   */
  static async getBalance(userId: string): Promise<PointBalance> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        availablePoints: true,
        redeemedPoints: true,
        lifetimePoints: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentLevel = this.calculateLevel(user.totalPoints || 0);
    const nextLevelPoints = this.getPointsForLevel(currentLevel + 1);

    return {
      userId,
      totalPoints: user.totalPoints || 0,
      availablePoints: user.availablePoints || 0,
      redeemedPoints: user.redeemedPoints || 0,
      lifetimePoints: user.lifetimePoints || 0,
      currentLevel,
      nextLevelPoints,
    };
  }

  /**
   * Calculate user level based on total points
   */
  private static calculateLevel(points: number): number {
    // Level formula: Level = floor(sqrt(points / 100))
    return Math.floor(Math.sqrt(points / 100));
  }

  /**
   * Get points required for a specific level
   */
  private static getPointsForLevel(level: number): number {
    return level * level * 100;
  }

  /**
   * Get point transaction history
   */
  static async getHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<PointTransaction[]> {
    const transactions = await db.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions as PointTransaction[];
  }

  /**
   * Get point statistics by category
   */
  static async getStatsByCategory(userId: string): Promise<
    Record<string, number>
  > {
    const transactions = await db.pointTransaction.findMany({
      where: { userId },
      select: {
        activity: true,
        totalPoints: true,
      },
    });

    const statsByCategory: Record<string, number> = {
      health: 0,
      engagement: 0,
      education: 0,
      social: 0,
      preventive: 0,
    };

    transactions.forEach((tx) => {
      const rule = POINT_RULES[tx.activity as PointActivity];
      if (rule) {
        statsByCategory[rule.category] += tx.totalPoints;
      }
    });

    return statsByCategory;
  }

  /**
   * Redeem points (for rewards, etc.)
   */
  static async redeemPoints(
    userId: string,
    points: number,
    reason: string
  ): Promise<void> {
    const balance = await this.getBalance(userId);

    if (balance.availablePoints < points) {
      throw new Error('Insufficient points');
    }

    await db.user.update({
      where: { id: userId },
      data: {
        availablePoints: { decrement: points },
        redeemedPoints: { increment: points },
      },
    });

    // Create redemption transaction
    await db.pointTransaction.create({
      data: {
        userId,
        activity: 'redemption' as any,
        points: -points,
        multiplier: 1,
        totalPoints: -points,
        description: reason,
        metadata: { type: 'redemption' },
      },
    });

    await logAudit({
      action: 'POINTS_REDEEMED',
      userId,
      resource: 'points',
      resourceId: userId,
      description: `Points redeemed: ${reason}`,
      metadata: { points, reason },
    });
  }
}
