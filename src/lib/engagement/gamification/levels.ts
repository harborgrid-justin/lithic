/**
 * Level Progression System - Gamification Engine
 * XP/level system with unlockable benefits and perks
 */

import { db } from '@/lib/db';
import { BadgeRarity } from './badges';

export interface LevelDefinition {
  level: number;
  pointsRequired: number;
  pointsToNext: number;
  title: string;
  icon: string;
  color: string;
  benefits: LevelBenefit[];
  milestone?: boolean;
}

export interface LevelBenefit {
  type:
    | 'point_multiplier'
    | 'exclusive_badge'
    | 'early_access'
    | 'custom_avatar'
    | 'leaderboard_badge'
    | 'priority_support'
    | 'reward_discount'
    | 'exclusive_content'
    | 'challenge_unlock';
  description: string;
  value?: any;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Newcomer',
  5: 'Health Explorer',
  10: 'Wellness Seeker',
  15: 'Fitness Enthusiast',
  20: 'Health Advocate',
  25: 'Wellness Champion',
  30: 'Vitality Expert',
  35: 'Health Guardian',
  40: 'Wellness Master',
  45: 'Peak Performer',
  50: 'Health Legend',
  60: 'Wellness Titan',
  70: 'Vitality Sage',
  80: 'Health Virtuoso',
  90: 'Wellness Immortal',
  100: 'Ultimate Health Hero',
};

export const LEVEL_COLORS: Record<number, string> = {
  1: '#9CA3AF', // Gray
  10: '#10B981', // Green
  20: '#3B82F6', // Blue
  30: '#8B5CF6', // Purple
  40: '#EC4899', // Pink
  50: '#F59E0B', // Amber
  60: '#EF4444', // Red
  70: '#14B8A6', // Teal
  80: '#F97316', // Orange
  90: '#A855F7', // Violet
  100: '#FFD700', // Gold
};

/**
 * Calculate level from total points
 */
export function calculateLevel(totalPoints: number): number {
  // Formula: Level = floor(sqrt(points / 100))
  return Math.floor(Math.sqrt(totalPoints / 100));
}

/**
 * Calculate points required for a specific level
 */
export function getPointsForLevel(level: number): number {
  // Inverse formula: Points = level^2 * 100
  return level * level * 100;
}

/**
 * Get level definition with all details
 */
export function getLevelDefinition(level: number): LevelDefinition {
  const pointsRequired = getPointsForLevel(level);
  const nextLevelPoints = getPointsForLevel(level + 1);
  const pointsToNext = nextLevelPoints - pointsRequired;

  // Determine title (use closest defined title)
  let title = 'Health Warrior';
  for (let i = level; i >= 0; i--) {
    if (LEVEL_TITLES[i]) {
      title = LEVEL_TITLES[i];
      break;
    }
  }

  // Determine color (use closest defined color)
  let color = '#9CA3AF';
  for (let i = level; i >= 0; i--) {
    if (LEVEL_COLORS[i]) {
      color = LEVEL_COLORS[i];
      break;
    }
  }

  const icon = getLevelIcon(level);
  const benefits = getLevelBenefits(level);
  const milestone = level % 10 === 0;

  return {
    level,
    pointsRequired,
    pointsToNext,
    title,
    icon,
    color,
    benefits,
    milestone,
  };
}

/**
 * Get icon for level
 */
function getLevelIcon(level: number): string {
  if (level >= 100) return '👑';
  if (level >= 90) return '💎';
  if (level >= 80) return '🏆';
  if (level >= 70) return '🌟';
  if (level >= 60) return '⭐';
  if (level >= 50) return '🎖️';
  if (level >= 40) return '🏅';
  if (level >= 30) return '🥇';
  if (level >= 20) return '🥈';
  if (level >= 10) return '🥉';
  if (level >= 5) return '🎯';
  return '🌱';
}

/**
 * Get benefits unlocked at each level
 */
function getLevelBenefits(level: number): LevelBenefit[] {
  const benefits: LevelBenefit[] = [];

  // Point multiplier increases every level
  const multiplier = 1.0 + level * 0.05;
  benefits.push({
    type: 'point_multiplier',
    description: `${multiplier.toFixed(2)}x point multiplier`,
    value: multiplier,
  });

  // Milestone benefits
  if (level >= 5) {
    benefits.push({
      type: 'custom_avatar',
      description: 'Unlock custom avatar frames',
    });
  }

  if (level >= 10) {
    benefits.push({
      type: 'leaderboard_badge',
      description: 'Bronze leaderboard badge',
    });
    benefits.push({
      type: 'exclusive_content',
      description: 'Access to intermediate health courses',
    });
  }

  if (level >= 20) {
    benefits.push({
      type: 'early_access',
      description: 'Early access to new features',
    });
    benefits.push({
      type: 'reward_discount',
      description: '10% discount on reward redemptions',
      value: 0.1,
    });
  }

  if (level >= 25) {
    benefits.push({
      type: 'leaderboard_badge',
      description: 'Silver leaderboard badge',
    });
    benefits.push({
      type: 'challenge_unlock',
      description: 'Unlock elite challenges',
    });
  }

  if (level >= 30) {
    benefits.push({
      type: 'exclusive_content',
      description: 'Access to advanced health courses',
    });
  }

  if (level >= 40) {
    benefits.push({
      type: 'priority_support',
      description: 'Priority customer support',
    });
    benefits.push({
      type: 'reward_discount',
      description: '20% discount on reward redemptions',
      value: 0.2,
    });
  }

  if (level >= 50) {
    benefits.push({
      type: 'leaderboard_badge',
      description: 'Gold leaderboard badge',
    });
    benefits.push({
      type: 'exclusive_badge',
      description: 'Exclusive "Legend" badge',
    });
    benefits.push({
      type: 'challenge_unlock',
      description: 'Unlock legendary challenges',
    });
  }

  if (level >= 75) {
    benefits.push({
      type: 'reward_discount',
      description: '30% discount on reward redemptions',
      value: 0.3,
    });
  }

  if (level >= 100) {
    benefits.push({
      type: 'leaderboard_badge',
      description: 'Platinum leaderboard badge',
    });
    benefits.push({
      type: 'exclusive_badge',
      description: 'Exclusive "Ultimate Hero" badge',
    });
    benefits.push({
      type: 'exclusive_content',
      description: 'Access to VIP health concierge',
    });
    benefits.push({
      type: 'reward_discount',
      description: '50% discount on reward redemptions',
      value: 0.5,
    });
  }

  return benefits;
}

/**
 * Get user's current level info
 */
export async function getUserLevel(userId: string): Promise<{
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition;
  currentPoints: number;
  pointsToNextLevel: number;
  progressPercentage: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });

  const currentPoints = user?.totalPoints || 0;
  const level = calculateLevel(currentPoints);

  const currentLevel = getLevelDefinition(level);
  const nextLevel = getLevelDefinition(level + 1);

  const pointsInCurrentLevel = currentPoints - currentLevel.pointsRequired;
  const pointsToNextLevel = nextLevel.pointsRequired - currentPoints;
  const progressPercentage =
    (pointsInCurrentLevel / currentLevel.pointsToNext) * 100;

  return {
    currentLevel,
    nextLevel,
    currentPoints,
    pointsToNextLevel,
    progressPercentage: Math.min(progressPercentage, 100),
  };
}

/**
 * Get level leaderboard (top users by level)
 */
export async function getLevelLeaderboard(limit = 100): Promise<
  Array<{
    userId: string;
    userName: string;
    level: number;
    totalPoints: number;
    title: string;
    rank: number;
  }>
> {
  const users = await db.user.findMany({
    where: {
      totalPoints: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      totalPoints: true,
    },
    orderBy: {
      totalPoints: 'desc',
    },
    take: limit,
  });

  return users.map((user, index) => {
    const level = calculateLevel(user.totalPoints || 0);
    const levelDef = getLevelDefinition(level);

    return {
      userId: user.id,
      userName: user.name || 'Anonymous',
      level,
      totalPoints: user.totalPoints || 0,
      title: levelDef.title,
      rank: index + 1,
    };
  });
}

/**
 * Check if user has unlocked a specific benefit
 */
export async function hasLevelBenefit(
  userId: string,
  benefitType: LevelBenefit['type']
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });

  const level = calculateLevel(user?.totalPoints || 0);
  const benefits = getLevelBenefits(level);

  return benefits.some((b) => b.type === benefitType);
}

/**
 * Get reward discount percentage based on level
 */
export async function getRewardDiscount(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });

  const level = calculateLevel(user?.totalPoints || 0);
  const benefits = getLevelBenefits(level);

  const discountBenefit = benefits
    .filter((b) => b.type === 'reward_discount')
    .sort((a, b) => (b.value || 0) - (a.value || 0))[0];

  return discountBenefit?.value || 0;
}

/**
 * Get all milestone levels (every 10 levels)
 */
export function getMilestoneLevels(): LevelDefinition[] {
  const milestones: LevelDefinition[] = [];

  for (let level = 10; level <= 100; level += 10) {
    milestones.push(getLevelDefinition(level));
  }

  return milestones;
}

/**
 * Get level progression chart data
 */
export function getLevelChart(maxLevel = 50): Array<{
  level: number;
  points: number;
  title: string;
}> {
  const chart: Array<{ level: number; points: number; title: string }> = [];

  for (let level = 1; level <= maxLevel; level++) {
    const def = getLevelDefinition(level);
    chart.push({
      level,
      points: def.pointsRequired,
      title: def.title,
    });
  }

  return chart;
}

export class LevelSystem {
  /**
   * Check if user leveled up after earning points
   */
  static async checkLevelUp(
    userId: string,
    previousPoints: number,
    newPoints: number
  ): Promise<{
    leveledUp: boolean;
    previousLevel: number;
    newLevel: number;
    rewards?: any[];
  }> {
    const previousLevel = calculateLevel(previousPoints);
    const newLevel = calculateLevel(newPoints);

    if (newLevel > previousLevel) {
      // User leveled up!
      const rewards = await this.awardLevelUpRewards(
        userId,
        previousLevel,
        newLevel
      );

      return {
        leveledUp: true,
        previousLevel,
        newLevel,
        rewards,
      };
    }

    return {
      leveledUp: false,
      previousLevel,
      newLevel: previousLevel,
    };
  }

  /**
   * Award rewards for leveling up
   */
  private static async awardLevelUpRewards(
    userId: string,
    previousLevel: number,
    newLevel: number
  ): Promise<any[]> {
    const rewards: any[] = [];

    // Award bonus points for milestone levels
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      if (level % 10 === 0) {
        const bonusPoints = level * 100; // 1000 points for level 10, 2000 for level 20, etc.

        await db.user.update({
          where: { id: userId },
          data: {
            totalPoints: { increment: bonusPoints },
            availablePoints: { increment: bonusPoints },
            lifetimePoints: { increment: bonusPoints },
          },
        });

        rewards.push({
          type: 'milestone_bonus',
          level,
          points: bonusPoints,
        });
      }
    }

    return rewards;
  }
}
