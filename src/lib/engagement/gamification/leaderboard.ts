/**
 * Leaderboard System - Gamification Engine
 * Privacy-aware rankings and achievement comparisons
 */

import { db } from '@/lib/db';
import { calculateLevel } from './levels';

export enum LeaderboardType {
  POINTS_ALL_TIME = 'points_all_time',
  POINTS_WEEKLY = 'points_weekly',
  POINTS_MONTHLY = 'points_monthly',
  LEVEL = 'level',
  BADGES = 'badges',
  CHALLENGES_WON = 'challenges_won',
  ACTIVITY_STREAK = 'activity_streak',
  CATEGORY_HEALTH = 'category_health',
  CATEGORY_FITNESS = 'category_fitness',
  CATEGORY_EDUCATION = 'category_education',
}

export enum LeaderboardPrivacy {
  PUBLIC = 'public', // Show full name and details
  ANONYMOUS = 'anonymous', // Show "User #123"
  FRIENDS_ONLY = 'friends_only', // Only visible to connections
  HIDDEN = 'hidden', // Opt out of leaderboards
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  value: number;
  badge?: string;
  isCurrentUser?: boolean;
  trend?: 'up' | 'down' | 'same';
  previousRank?: number;
}

export interface LeaderboardConfig {
  type: LeaderboardType;
  title: string;
  description: string;
  icon: string;
  valueLabel: string;
  refreshInterval: number; // minutes
  minLevel?: number;
}

export const LEADERBOARD_CONFIGS: Record<LeaderboardType, LeaderboardConfig> = {
  [LeaderboardType.POINTS_ALL_TIME]: {
    type: LeaderboardType.POINTS_ALL_TIME,
    title: 'All-Time Points Leaders',
    description: 'Top users by total lifetime points',
    icon: '🏆',
    valueLabel: 'Points',
    refreshInterval: 60,
  },
  [LeaderboardType.POINTS_WEEKLY]: {
    type: LeaderboardType.POINTS_WEEKLY,
    title: 'This Week\'s Top Earners',
    description: 'Most points earned this week',
    icon: '⭐',
    valueLabel: 'Points',
    refreshInterval: 15,
  },
  [LeaderboardType.POINTS_MONTHLY]: {
    type: LeaderboardType.POINTS_MONTHLY,
    title: 'Monthly Champions',
    description: 'Top point earners this month',
    icon: '🌟',
    valueLabel: 'Points',
    refreshInterval: 30,
  },
  [LeaderboardType.LEVEL]: {
    type: LeaderboardType.LEVEL,
    title: 'Highest Levels',
    description: 'Users with the highest levels',
    icon: '🎖️',
    valueLabel: 'Level',
    refreshInterval: 120,
  },
  [LeaderboardType.BADGES]: {
    type: LeaderboardType.BADGES,
    title: 'Badge Collectors',
    description: 'Most badges unlocked',
    icon: '🏅',
    valueLabel: 'Badges',
    refreshInterval: 60,
  },
  [LeaderboardType.CHALLENGES_WON]: {
    type: LeaderboardType.CHALLENGES_WON,
    title: 'Challenge Champions',
    description: 'Most challenges completed',
    icon: '👑',
    valueLabel: 'Challenges',
    refreshInterval: 30,
  },
  [LeaderboardType.ACTIVITY_STREAK]: {
    type: LeaderboardType.ACTIVITY_STREAK,
    title: 'Streak Masters',
    description: 'Longest login streaks',
    icon: '🔥',
    valueLabel: 'Days',
    refreshInterval: 30,
  },
  [LeaderboardType.CATEGORY_HEALTH]: {
    type: LeaderboardType.CATEGORY_HEALTH,
    title: 'Health Tracking Leaders',
    description: 'Most health tracking points',
    icon: '❤️',
    valueLabel: 'Points',
    refreshInterval: 60,
  },
  [LeaderboardType.CATEGORY_FITNESS]: {
    type: LeaderboardType.CATEGORY_FITNESS,
    title: 'Fitness Champions',
    description: 'Most fitness activity points',
    icon: '💪',
    valueLabel: 'Points',
    refreshInterval: 60,
  },
  [LeaderboardType.CATEGORY_EDUCATION]: {
    type: LeaderboardType.CATEGORY_EDUCATION,
    title: 'Knowledge Seekers',
    description: 'Most education points',
    icon: '📚',
    valueLabel: 'Points',
    refreshInterval: 60,
  },
};

export class LeaderboardSystem {
  /**
   * Get leaderboard data
   */
  static async getLeaderboard(
    type: LeaderboardType,
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    config: LeaderboardConfig;
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const config = LEADERBOARD_CONFIGS[type];
    let entries: LeaderboardEntry[] = [];
    let totalEntries = 0;
    let currentUserEntry: LeaderboardEntry | undefined;

    switch (type) {
      case LeaderboardType.POINTS_ALL_TIME:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getPointsAllTimeLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.POINTS_WEEKLY:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getPointsWeeklyLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.POINTS_MONTHLY:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getPointsMonthlyLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.LEVEL:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getLevelLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.BADGES:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getBadgesLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.CHALLENGES_WON:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getChallengesLeaderboard(currentUserId, limit, offset));
        break;

      case LeaderboardType.ACTIVITY_STREAK:
        ({ entries, totalEntries, currentUserEntry } =
          await this.getStreakLeaderboard(currentUserId, limit, offset));
        break;

      default:
        break;
    }

    return {
      config,
      entries,
      totalEntries,
      currentUserEntry,
    };
  }

  /**
   * Get all-time points leaderboard
   */
  private static async getPointsAllTimeLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const users = await db.user.findMany({
      where: {
        lifetimePoints: { gt: 0 },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        lifetimePoints: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
      orderBy: { lifetimePoints: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalEntries = await db.user.count({
      where: {
        lifetimePoints: { gt: 0 },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
    });

    const entries = users.map((user, index) =>
      this.formatEntry(user, offset + index + 1, currentUserId, user.lifetimePoints || 0)
    );

    let currentUserEntry: LeaderboardEntry | undefined;
    if (currentUserId) {
      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          lifetimePoints: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser) {
        const rank = await db.user.count({
          where: {
            lifetimePoints: { gt: currentUser.lifetimePoints || 0 },
            leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
          },
        });

        currentUserEntry = this.formatEntry(
          currentUser,
          rank + 1,
          currentUserId,
          currentUser.lifetimePoints || 0
        );
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get weekly points leaderboard
   */
  private static async getPointsWeeklyLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get weekly points per user
    const weeklyPoints = await db.pointTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startOfWeek },
      },
      _sum: {
        totalPoints: true,
      },
      orderBy: {
        _sum: {
          totalPoints: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    const userIds = weeklyPoints.map((wp) => wp.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const entries: LeaderboardEntry[] = [];

    weeklyPoints.forEach((wp, index) => {
      const user = userMap.get(wp.userId);
      if (user) {
        entries.push(
          this.formatEntry(user, offset + index + 1, currentUserId, wp._sum.totalPoints || 0)
        );
      }
    });

    const totalEntries = weeklyPoints.length;

    let currentUserEntry: LeaderboardEntry | undefined;
    if (currentUserId) {
      const currentUserPoints = await db.pointTransaction.aggregate({
        where: {
          userId: currentUserId,
          createdAt: { gte: startOfWeek },
        },
        _sum: {
          totalPoints: true,
        },
      });

      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser && currentUserPoints._sum.totalPoints) {
        const rank =
          (await db.pointTransaction.groupBy({
            by: ['userId'],
            where: {
              createdAt: { gte: startOfWeek },
            },
            _sum: {
              totalPoints: true,
            },
            having: {
              totalPoints: { gt: currentUserPoints._sum.totalPoints },
            },
          })).length + 1;

        currentUserEntry = this.formatEntry(
          currentUser,
          rank,
          currentUserId,
          currentUserPoints._sum.totalPoints
        );
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get monthly points leaderboard
   */
  private static async getPointsMonthlyLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyPoints = await db.pointTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        totalPoints: true,
      },
      orderBy: {
        _sum: {
          totalPoints: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    const userIds = monthlyPoints.map((mp) => mp.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const entries: LeaderboardEntry[] = [];

    monthlyPoints.forEach((mp, index) => {
      const user = userMap.get(mp.userId);
      if (user) {
        entries.push(
          this.formatEntry(user, offset + index + 1, currentUserId, mp._sum.totalPoints || 0)
        );
      }
    });

    const totalEntries = monthlyPoints.length;
    let currentUserEntry: LeaderboardEntry | undefined;

    if (currentUserId) {
      const currentUserPoints = await db.pointTransaction.aggregate({
        where: {
          userId: currentUserId,
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          totalPoints: true,
        },
      });

      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser && currentUserPoints._sum.totalPoints) {
        const rank =
          (await db.pointTransaction.groupBy({
            by: ['userId'],
            where: {
              createdAt: { gte: startOfMonth },
            },
            _sum: {
              totalPoints: true,
            },
            having: {
              totalPoints: { gt: currentUserPoints._sum.totalPoints },
            },
          })).length + 1;

        currentUserEntry = this.formatEntry(
          currentUser,
          rank,
          currentUserId,
          currentUserPoints._sum.totalPoints
        );
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get level leaderboard
   */
  private static async getLevelLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const users = await db.user.findMany({
      where: {
        totalPoints: { gt: 0 },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalEntries = await db.user.count({
      where: {
        totalPoints: { gt: 0 },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
    });

    const entries = users.map((user, index) => {
      const level = calculateLevel(user.totalPoints || 0);
      return this.formatEntry(user, offset + index + 1, currentUserId, level);
    });

    let currentUserEntry: LeaderboardEntry | undefined;
    if (currentUserId) {
      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser) {
        const rank = await db.user.count({
          where: {
            totalPoints: { gt: currentUser.totalPoints || 0 },
            leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
          },
        });

        const level = calculateLevel(currentUser.totalPoints || 0);
        currentUserEntry = this.formatEntry(currentUser, rank + 1, currentUserId, level);
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get badges leaderboard
   */
  private static async getBadgesLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const badgeCounts = await db.userBadge.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    const userIds = badgeCounts.map((bc) => bc.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const entries: LeaderboardEntry[] = [];

    badgeCounts.forEach((bc, index) => {
      const user = userMap.get(bc.userId);
      if (user) {
        entries.push(this.formatEntry(user, offset + index + 1, currentUserId, bc._count.id));
      }
    });

    const totalEntries = badgeCounts.length;
    let currentUserEntry: LeaderboardEntry | undefined;

    if (currentUserId) {
      const currentUserBadges = await db.userBadge.count({
        where: { userId: currentUserId },
      });

      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser) {
        const rank =
          (await db.userBadge.groupBy({
            by: ['userId'],
            _count: { id: true },
            having: {
              id: { gt: currentUserBadges },
            },
          })).length + 1;

        currentUserEntry = this.formatEntry(currentUser, rank, currentUserId, currentUserBadges);
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get challenges leaderboard
   */
  private static async getChallengesLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    const challengeCounts = await db.challengeParticipant.groupBy({
      by: ['userId'],
      where: {
        completed: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    const userIds = challengeCounts.map((cc) => cc.userId);
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
        leaderboardPrivacy: { not: LeaderboardPrivacy.HIDDEN },
      },
      select: {
        id: true,
        name: true,
        image: true,
        totalPoints: true,
        leaderboardPrivacy: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const entries: LeaderboardEntry[] = [];

    challengeCounts.forEach((cc, index) => {
      const user = userMap.get(cc.userId);
      if (user) {
        entries.push(this.formatEntry(user, offset + index + 1, currentUserId, cc._count.id));
      }
    });

    const totalEntries = challengeCounts.length;
    let currentUserEntry: LeaderboardEntry | undefined;

    if (currentUserId) {
      const currentUserChallenges = await db.challengeParticipant.count({
        where: { userId: currentUserId, completed: true },
      });

      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          image: true,
          totalPoints: true,
          leaderboardPrivacy: true,
        },
      });

      if (currentUser && currentUserChallenges > 0) {
        const rank =
          (await db.challengeParticipant.groupBy({
            by: ['userId'],
            where: { completed: true },
            _count: { id: true },
            having: {
              id: { gt: currentUserChallenges },
            },
          })).length + 1;

        currentUserEntry = this.formatEntry(
          currentUser,
          rank,
          currentUserId,
          currentUserChallenges
        );
      }
    }

    return { entries, totalEntries, currentUserEntry };
  }

  /**
   * Get activity streak leaderboard
   */
  private static async getStreakLeaderboard(
    currentUserId?: string,
    limit = 100,
    offset = 0
  ): Promise<{
    entries: LeaderboardEntry[];
    totalEntries: number;
    currentUserEntry?: LeaderboardEntry;
  }> {
    // Simplified implementation - would need proper streak tracking
    return {
      entries: [],
      totalEntries: 0,
      currentUserEntry: undefined,
    };
  }

  /**
   * Format leaderboard entry with privacy
   */
  private static formatEntry(
    user: any,
    rank: number,
    currentUserId?: string,
    value: number = 0
  ): LeaderboardEntry {
    const isCurrentUser = currentUserId === user.id;
    const privacy = user.leaderboardPrivacy || LeaderboardPrivacy.PUBLIC;

    let displayName = user.name || 'Anonymous';
    let avatar = user.image;

    if (!isCurrentUser && privacy === LeaderboardPrivacy.ANONYMOUS) {
      displayName = `User #${rank}`;
      avatar = undefined;
    }

    const level = calculateLevel(user.totalPoints || 0);
    let badge: string | undefined;
    if (level >= 100) badge = '💎';
    else if (level >= 50) badge = '👑';
    else if (level >= 25) badge = '🏅';
    else if (level >= 10) badge = '🥉';

    return {
      rank,
      userId: user.id,
      displayName,
      avatar,
      value,
      badge,
      isCurrentUser,
    };
  }

  /**
   * Update user's leaderboard privacy setting
   */
  static async updatePrivacy(
    userId: string,
    privacy: LeaderboardPrivacy
  ): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        leaderboardPrivacy: privacy,
      },
    });
  }

  /**
   * Get user's rank in a specific leaderboard
   */
  static async getUserRank(
    userId: string,
    type: LeaderboardType
  ): Promise<number | null> {
    const { currentUserEntry } = await this.getLeaderboard(type, userId, 1, 0);
    return currentUserEntry?.rank || null;
  }
}
