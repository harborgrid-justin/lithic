/**
 * Badge System - Gamification Engine
 * 50+ achievement badges with unlock conditions and rarity levels
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PointActivity } from './points-system';

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum BadgeCategory {
  HEALTH_TRACKING = 'health_tracking',
  ENGAGEMENT = 'engagement',
  EDUCATION = 'education',
  PREVENTIVE_CARE = 'preventive_care',
  MEDICATION = 'medication',
  SOCIAL = 'social',
  MILESTONES = 'milestones',
  SPECIAL = 'special',
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  points: number;
  unlockCondition: BadgeUnlockCondition;
  hidden?: boolean; // Secret badges
  seasonal?: boolean;
  seasonStart?: Date;
  seasonEnd?: Date;
}

export interface BadgeUnlockCondition {
  type:
    | 'activity_count'
    | 'activity_streak'
    | 'points_total'
    | 'level_reached'
    | 'goal_completed'
    | 'challenge_completed'
    | 'custom';
  activity?: PointActivity;
  count?: number;
  streak?: number;
  points?: number;
  level?: number;
  customCheck?: (userId: string) => Promise<boolean>;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
  progress?: number;
  notified?: boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ============ HEALTH TRACKING BADGES ============
  {
    id: 'first_vitals',
    name: 'First Steps',
    description: 'Log your first vital signs',
    icon: '🎯',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 50,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_VITAL_SIGNS,
      count: 1,
    },
  },
  {
    id: 'vitals_champion',
    name: 'Vitals Champion',
    description: 'Log vital signs 100 times',
    icon: '💪',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 500,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_VITAL_SIGNS,
      count: 100,
    },
  },
  {
    id: 'vitals_master',
    name: 'Vitals Master',
    description: 'Log vital signs 365 days in a row',
    icon: '👑',
    rarity: BadgeRarity.LEGENDARY,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 2000,
    unlockCondition: {
      type: 'activity_streak',
      activity: PointActivity.LOG_VITAL_SIGNS,
      streak: 365,
    },
  },
  {
    id: 'symptom_tracker',
    name: 'Symptom Tracker',
    description: 'Log symptoms 50 times',
    icon: '📝',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 250,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_SYMPTOMS,
      count: 50,
    },
  },
  {
    id: 'fitness_enthusiast',
    name: 'Fitness Enthusiast',
    description: 'Log exercise 30 times',
    icon: '🏃',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 300,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_EXERCISE,
      count: 30,
    },
  },
  {
    id: 'fitness_warrior',
    name: 'Fitness Warrior',
    description: 'Exercise 100 days in a row',
    icon: '🏋️',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 1000,
    unlockCondition: {
      type: 'activity_streak',
      activity: PointActivity.LOG_EXERCISE,
      streak: 100,
    },
  },
  {
    id: 'nutrition_pro',
    name: 'Nutrition Pro',
    description: 'Log meals for 30 days straight',
    icon: '🥗',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 500,
    unlockCondition: {
      type: 'activity_streak',
      activity: PointActivity.LOG_NUTRITION,
      streak: 30,
    },
  },
  {
    id: 'sleep_guardian',
    name: 'Sleep Guardian',
    description: 'Track sleep for 60 nights',
    icon: '😴',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 400,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_SLEEP,
      count: 60,
    },
  },
  {
    id: 'wellness_warrior',
    name: 'Wellness Warrior',
    description: 'Track mood for 90 days',
    icon: '😊',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.HEALTH_TRACKING,
    points: 450,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOG_MOOD,
      count: 90,
    },
  },

  // ============ ENGAGEMENT BADGES ============
  {
    id: 'welcome_aboard',
    name: 'Welcome Aboard',
    description: 'Complete your health profile',
    icon: '👋',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.ENGAGEMENT,
    points: 100,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_PROFILE,
      count: 1,
    },
  },
  {
    id: 'daily_visitor',
    name: 'Daily Visitor',
    description: 'Log in 7 days in a row',
    icon: '📅',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.ENGAGEMENT,
    points: 150,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOGIN_STREAK_7,
      count: 1,
    },
  },
  {
    id: 'dedicated_user',
    name: 'Dedicated User',
    description: 'Log in 30 days in a row',
    icon: '🔥',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.ENGAGEMENT,
    points: 400,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOGIN_STREAK_30,
      count: 1,
    },
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Log in 100 days in a row',
    icon: '💯',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.ENGAGEMENT,
    points: 1500,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.LOGIN_STREAK_100,
      count: 1,
    },
  },
  {
    id: 'appointment_ace',
    name: 'Appointment Ace',
    description: 'Attend 10 appointments',
    icon: '🗓️',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.ENGAGEMENT,
    points: 300,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.ATTEND_APPOINTMENT,
      count: 10,
    },
  },
  {
    id: 'prepared_patient',
    name: 'Prepared Patient',
    description: 'Complete 5 pre-visit forms',
    icon: '📋',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.ENGAGEMENT,
    points: 200,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_PRE_VISIT,
      count: 5,
    },
  },

  // ============ EDUCATION BADGES ============
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Read 10 health articles',
    icon: '📚',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.EDUCATION,
    points: 150,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_ARTICLE,
      count: 10,
    },
  },
  {
    id: 'health_scholar',
    name: 'Health Scholar',
    description: 'Read 50 health articles',
    icon: '🎓',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.EDUCATION,
    points: 600,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_ARTICLE,
      count: 50,
    },
  },
  {
    id: 'video_learner',
    name: 'Video Learner',
    description: 'Watch 20 educational videos',
    icon: '🎬',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.EDUCATION,
    points: 250,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.WATCH_VIDEO,
      count: 20,
    },
  },
  {
    id: 'course_master',
    name: 'Course Master',
    description: 'Complete 5 educational courses',
    icon: '🏆',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.EDUCATION,
    points: 1200,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_COURSE,
      count: 5,
    },
  },
  {
    id: 'quiz_whiz',
    name: 'Quiz Whiz',
    description: 'Pass 25 quizzes',
    icon: '🧠',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.EDUCATION,
    points: 350,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.PASS_QUIZ,
      count: 25,
    },
  },

  // ============ PREVENTIVE CARE BADGES ============
  {
    id: 'prevention_first',
    name: 'Prevention First',
    description: 'Complete first health screening',
    icon: '🔍',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.PREVENTIVE_CARE,
    points: 200,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_SCREENING,
      count: 1,
    },
  },
  {
    id: 'screening_star',
    name: 'Screening Star',
    description: 'Complete 5 health screenings',
    icon: '⭐',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.PREVENTIVE_CARE,
    points: 800,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_SCREENING,
      count: 5,
    },
  },
  {
    id: 'vaccination_hero',
    name: 'Vaccination Hero',
    description: 'Get 3 recommended vaccinations',
    icon: '💉',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.PREVENTIVE_CARE,
    points: 400,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.GET_VACCINATION,
      count: 3,
    },
  },
  {
    id: 'annual_achiever',
    name: 'Annual Achiever',
    description: 'Complete 3 annual checkups',
    icon: '✅',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.PREVENTIVE_CARE,
    points: 700,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.ANNUAL_CHECKUP,
      count: 3,
    },
  },

  // ============ MEDICATION BADGES ============
  {
    id: 'med_beginner',
    name: 'Medication Beginner',
    description: 'Log medications for 7 days straight',
    icon: '💊',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.MEDICATION,
    points: 150,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.MEDICATION_ADHERENCE_7,
      count: 1,
    },
  },
  {
    id: 'med_adherent',
    name: 'Medication Adherent',
    description: '30-day medication adherence',
    icon: '🎯',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.MEDICATION,
    points: 400,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.MEDICATION_ADHERENCE_30,
      count: 1,
    },
  },
  {
    id: 'med_champion',
    name: 'Medication Champion',
    description: '90-day perfect medication adherence',
    icon: '🏅',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.MEDICATION,
    points: 1200,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.MEDICATION_ADHERENCE_90,
      count: 1,
    },
  },

  // ============ SOCIAL BADGES ============
  {
    id: 'community_member',
    name: 'Community Member',
    description: 'Join your first community',
    icon: '👥',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.SOCIAL,
    points: 100,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.JOIN_COMMUNITY,
      count: 1,
    },
  },
  {
    id: 'helpful_peer',
    name: 'Helpful Peer',
    description: 'Help peers 25 times',
    icon: '🤝',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.SOCIAL,
    points: 350,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.HELP_PEER,
      count: 25,
    },
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Post 100 helpful comments',
    icon: '🦋',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.SOCIAL,
    points: 500,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.POST_COMMENT,
      count: 100,
    },
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Share 50 achievements',
    icon: '✨',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.SOCIAL,
    points: 600,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.SHARE_ACHIEVEMENT,
      count: 50,
    },
  },

  // ============ MILESTONE BADGES ============
  {
    id: 'goal_setter',
    name: 'Goal Setter',
    description: 'Create your first health goal',
    icon: '🎯',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.MILESTONES,
    points: 100,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.CREATE_GOAL,
      count: 1,
    },
  },
  {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Complete 10 health goals',
    icon: '💥',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.MILESTONES,
    points: 800,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_GOAL,
      count: 10,
    },
  },
  {
    id: 'challenger',
    name: 'Challenger',
    description: 'Join 5 challenges',
    icon: '⚔️',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.MILESTONES,
    points: 250,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.JOIN_CHALLENGE,
      count: 5,
    },
  },
  {
    id: 'challenge_master',
    name: 'Challenge Master',
    description: 'Complete 10 challenges',
    icon: '🏆',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.MILESTONES,
    points: 1500,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.COMPLETE_CHALLENGE,
      count: 10,
    },
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Win 5 competitive challenges',
    icon: '👑',
    rarity: BadgeRarity.LEGENDARY,
    category: BadgeCategory.MILESTONES,
    points: 2500,
    unlockCondition: {
      type: 'activity_count',
      activity: PointActivity.WIN_CHALLENGE,
      count: 5,
    },
  },

  // ============ LEVEL & POINTS BADGES ============
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '🌟',
    rarity: BadgeRarity.COMMON,
    category: BadgeCategory.MILESTONES,
    points: 200,
    unlockCondition: {
      type: 'level_reached',
      level: 5,
    },
  },
  {
    id: 'level_10',
    name: 'Veteran',
    description: 'Reach level 10',
    icon: '🎖️',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.MILESTONES,
    points: 500,
    unlockCondition: {
      type: 'level_reached',
      level: 10,
    },
  },
  {
    id: 'level_25',
    name: 'Expert',
    description: 'Reach level 25',
    icon: '🏅',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.MILESTONES,
    points: 1000,
    unlockCondition: {
      type: 'level_reached',
      level: 25,
    },
  },
  {
    id: 'level_50',
    name: 'Legend',
    description: 'Reach level 50',
    icon: '💎',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.MILESTONES,
    points: 2000,
    unlockCondition: {
      type: 'level_reached',
      level: 50,
    },
  },
  {
    id: 'level_100',
    name: 'Mythic',
    description: 'Reach level 100',
    icon: '🌌',
    rarity: BadgeRarity.LEGENDARY,
    category: BadgeCategory.MILESTONES,
    points: 5000,
    unlockCondition: {
      type: 'level_reached',
      level: 100,
    },
  },
  {
    id: 'points_10k',
    name: 'Point Collector',
    description: 'Earn 10,000 total points',
    icon: '🪙',
    rarity: BadgeRarity.UNCOMMON,
    category: BadgeCategory.MILESTONES,
    points: 300,
    unlockCondition: {
      type: 'points_total',
      points: 10000,
    },
  },
  {
    id: 'points_50k',
    name: 'Point Hoarder',
    description: 'Earn 50,000 total points',
    icon: '💰',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.MILESTONES,
    points: 800,
    unlockCondition: {
      type: 'points_total',
      points: 50000,
    },
  },
  {
    id: 'points_100k',
    name: 'Point Magnate',
    description: 'Earn 100,000 total points',
    icon: '💸',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.MILESTONES,
    points: 2000,
    unlockCondition: {
      type: 'points_total',
      points: 100000,
    },
  },

  // ============ SPECIAL/HIDDEN BADGES ============
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log activity before 6 AM',
    icon: '🌅',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.SPECIAL,
    points: 400,
    hidden: true,
    unlockCondition: {
      type: 'custom',
    },
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Log activity after 11 PM',
    icon: '🦉',
    rarity: BadgeRarity.RARE,
    category: BadgeCategory.SPECIAL,
    points: 400,
    hidden: true,
    unlockCondition: {
      type: 'custom',
    },
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all daily goals for a week',
    icon: '⭐',
    rarity: BadgeRarity.EPIC,
    category: BadgeCategory.SPECIAL,
    points: 1000,
    hidden: true,
    unlockCondition: {
      type: 'custom',
    },
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    description: 'Earn 1000 points in a single day',
    icon: '🚀',
    rarity: BadgeRarity.LEGENDARY,
    category: BadgeCategory.SPECIAL,
    points: 3000,
    hidden: true,
    unlockCondition: {
      type: 'custom',
    },
  },
];

export class BadgeSystem {
  /**
   * Check and award badges to a user based on their activities
   */
  static async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const newlyUnlocked: UserBadge[] = [];

    // Get already unlocked badges
    const unlockedBadgeIds = await this.getUnlockedBadgeIds(userId);

    // Check each badge definition
    for (const badge of BADGE_DEFINITIONS) {
      if (unlockedBadgeIds.includes(badge.id)) {
        continue; // Already unlocked
      }

      // Check if seasonal badge is active
      if (badge.seasonal) {
        const now = new Date();
        if (
          badge.seasonStart &&
          badge.seasonEnd &&
          (now < badge.seasonStart || now > badge.seasonEnd)
        ) {
          continue; // Not in season
        }
      }

      // Check unlock condition
      const unlocked = await this.checkUnlockCondition(userId, badge);
      if (unlocked) {
        const userBadge = await this.awardBadge(userId, badge);
        newlyUnlocked.push(userBadge);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get list of unlocked badge IDs for a user
   */
  private static async getUnlockedBadgeIds(
    userId: string
  ): Promise<string[]> {
    const badges = await db.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    return badges.map((b) => b.badgeId);
  }

  /**
   * Check if a badge's unlock condition is met
   */
  private static async checkUnlockCondition(
    userId: string,
    badge: BadgeDefinition
  ): Promise<boolean> {
    const condition = badge.unlockCondition;

    switch (condition.type) {
      case 'activity_count':
        if (!condition.activity || !condition.count) return false;
        const count = await db.pointTransaction.count({
          where: {
            userId,
            activity: condition.activity,
          },
        });
        return count >= condition.count;

      case 'activity_streak':
        if (!condition.activity || !condition.streak) return false;
        return await this.checkActivityStreak(
          userId,
          condition.activity,
          condition.streak
        );

      case 'points_total':
        if (!condition.points) return false;
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { totalPoints: true },
        });
        return (user?.totalPoints || 0) >= condition.points;

      case 'level_reached':
        if (!condition.level) return false;
        const userLevel = await db.user.findUnique({
          where: { id: userId },
          select: { totalPoints: true },
        });
        const level = Math.floor(
          Math.sqrt((userLevel?.totalPoints || 0) / 100)
        );
        return level >= condition.level;

      case 'goal_completed':
        if (!condition.count) return false;
        const goalCount = await db.pointTransaction.count({
          where: {
            userId,
            activity: PointActivity.COMPLETE_GOAL,
          },
        });
        return goalCount >= condition.count;

      case 'challenge_completed':
        if (!condition.count) return false;
        const challengeCount = await db.pointTransaction.count({
          where: {
            userId,
            activity: PointActivity.COMPLETE_CHALLENGE,
          },
        });
        return challengeCount >= condition.count;

      case 'custom':
        if (condition.customCheck) {
          return await condition.customCheck(userId);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user has activity streak
   */
  private static async checkActivityStreak(
    userId: string,
    activity: PointActivity,
    requiredStreak: number
  ): Promise<boolean> {
    const transactions = await db.pointTransaction.findMany({
      where: {
        userId,
        activity,
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (transactions.length < requiredStreak) return false;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const tx of transactions) {
      const txDate = new Date(tx.createdAt);
      txDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
        if (streak >= requiredStreak) return true;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak >= requiredStreak;
  }

  /**
   * Award a badge to a user
   */
  private static async awardBadge(
    userId: string,
    badge: BadgeDefinition
  ): Promise<UserBadge> {
    const userBadge = await db.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        unlockedAt: new Date(),
        notified: false,
      },
    });

    // Award points for unlocking badge
    await db.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: badge.points },
        availablePoints: { increment: badge.points },
        lifetimePoints: { increment: badge.points },
      },
    });

    await logAudit({
      action: 'BADGE_UNLOCKED',
      userId,
      resource: 'badge',
      resourceId: badge.id,
      description: `Badge unlocked: ${badge.name}`,
      metadata: {
        badgeName: badge.name,
        rarity: badge.rarity,
        points: badge.points,
      },
    });

    return userBadge as UserBadge;
  }

  /**
   * Get all badges for a user (unlocked and locked)
   */
  static async getUserBadges(userId: string): Promise<
    Array<{
      badge: BadgeDefinition;
      unlocked: boolean;
      unlockedAt?: Date;
      progress?: number;
    }>
  > {
    const unlockedBadges = await db.userBadge.findMany({
      where: { userId },
    });

    const unlockedMap = new Map(
      unlockedBadges.map((ub) => [
        ub.badgeId,
        { unlockedAt: ub.unlockedAt, progress: ub.progress },
      ])
    );

    return BADGE_DEFINITIONS.filter((b) => !b.hidden || unlockedMap.has(b.id))
      .map((badge) => ({
        badge,
        unlocked: unlockedMap.has(badge.id),
        unlockedAt: unlockedMap.get(badge.id)?.unlockedAt,
        progress: unlockedMap.get(badge.id)?.progress,
      }))
      .sort((a, b) => {
        // Unlocked badges first
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        // Then by rarity
        const rarityOrder = {
          [BadgeRarity.LEGENDARY]: 0,
          [BadgeRarity.EPIC]: 1,
          [BadgeRarity.RARE]: 2,
          [BadgeRarity.UNCOMMON]: 3,
          [BadgeRarity.COMMON]: 4,
        };
        return rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity];
      });
  }

  /**
   * Get badge progress for a user
   */
  static async getBadgeProgress(
    userId: string,
    badgeId: string
  ): Promise<{ current: number; required: number; percentage: number }> {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!badge) throw new Error('Badge not found');

    const condition = badge.unlockCondition;
    let current = 0;
    let required = 0;

    switch (condition.type) {
      case 'activity_count':
        if (condition.activity && condition.count) {
          current = await db.pointTransaction.count({
            where: { userId, activity: condition.activity },
          });
          required = condition.count;
        }
        break;

      case 'points_total':
        if (condition.points) {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalPoints: true },
          });
          current = user?.totalPoints || 0;
          required = condition.points;
        }
        break;

      case 'level_reached':
        if (condition.level) {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalPoints: true },
          });
          current = Math.floor(Math.sqrt((user?.totalPoints || 0) / 100));
          required = condition.level;
        }
        break;
    }

    const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 0;

    return { current, required, percentage };
  }
}
