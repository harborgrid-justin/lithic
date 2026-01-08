/**
 * Gamification Engine
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive gamification system including:
 * - Points and experience system
 * - Player levels and progression
 * - Leaderboards and rankings
 * - Title and badge systems
 * - Social features and comparisons
 */

import type {
  PlayerProfile,
  PlayerStats,
  PointTransaction,
  PointTransactionType,
  PointCategory,
  PointTransactionStatus,
  GamificationPreferences,
  PlayerTitle,
} from "@/types/engagement";

// ============================================================================
// Gamification Engine
// ============================================================================

export class GamificationEngine {
  // Experience points required for each level (exponential growth)
  private static readonly LEVEL_CURVE: number[] = this.generateLevelCurve(100);

  /**
   * Initialize player profile for a new patient
   */
  static async initializePlayer(
    patientId: string,
    username: string,
    displayName: string
  ): Promise<PlayerProfile> {
    const now = new Date();

    const profile: PlayerProfile = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      username,
      displayName,
      avatar: null,
      level: 1,
      experiencePoints: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      joinDate: now,
      rank: 0,
      badges: [],
      achievements: [],
      titles: [],
      currentTitle: null,
      stats: this.initializeStats(),
      preferences: this.getDefaultPreferences(),
    };

    return profile;
  }

  /**
   * Award points to a player
   */
  static async awardPoints(
    patientId: string,
    amount: number,
    category: PointCategory,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{
    transaction: PointTransaction;
    profile: PlayerProfile;
    leveledUp: boolean;
    newLevel?: number;
    rewards?: LevelReward;
  }> {
    // Get current player profile
    const profile = await this.getPlayerProfile(patientId);

    // Create point transaction
    const transaction: PointTransaction = {
      id: crypto.randomUUID(),
      organizationId: profile.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      amount,
      type: PointTransactionType.EARNED,
      reason,
      category,
      relatedEntityType: metadata?.entityType || null,
      relatedEntityId: metadata?.entityId || null,
      metadata: metadata || {},
      expiresAt: null,
      status: PointTransactionStatus.COMPLETED,
    };

    // Update player profile
    const previousLevel = profile.level;
    profile.experiencePoints += amount;
    profile.totalPoints += amount;
    profile.lastActivityDate = new Date();
    profile.updatedAt = new Date();

    // Update stats
    this.updateStatsForPoints(profile.stats, category, amount);

    // Check for level up
    const newLevel = this.calculateLevel(profile.experiencePoints);
    const leveledUp = newLevel > previousLevel;
    let rewards: LevelReward | undefined;

    if (leveledUp) {
      profile.level = newLevel;
      rewards = this.getLevelRewards(newLevel);

      // Award level-up title
      const title = this.getLevelTitle(newLevel);
      if (title) {
        profile.titles.push({
          id: crypto.randomUUID(),
          organizationId: profile.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdBy: patientId,
          updatedBy: patientId,
          patientId,
          title: title.name,
          description: title.description,
          earnedDate: new Date(),
          icon: title.icon,
          color: title.color,
        });
      }
    }

    return {
      transaction,
      profile,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      rewards,
    };
  }

  /**
   * Redeem points for rewards
   */
  static async redeemPoints(
    patientId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<PointTransaction> {
    const profile = await this.getPlayerProfile(patientId);

    // Validate sufficient points
    if (profile.totalPoints < amount) {
      throw new Error("Insufficient points for redemption");
    }

    const transaction: PointTransaction = {
      id: crypto.randomUUID(),
      organizationId: profile.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      amount: -amount,
      type: PointTransactionType.REDEEMED,
      reason,
      category: PointCategory.OTHER,
      relatedEntityType: metadata?.entityType || null,
      relatedEntityId: metadata?.entityId || null,
      metadata: metadata || {},
      expiresAt: null,
      status: PointTransactionStatus.COMPLETED,
    };

    // Update profile
    profile.totalPoints -= amount;
    profile.updatedAt = new Date();

    return transaction;
  }

  /**
   * Calculate player level based on experience points
   */
  static calculateLevel(experiencePoints: number): number {
    for (let level = 0; level < this.LEVEL_CURVE.length; level++) {
      if (experiencePoints < this.LEVEL_CURVE[level]) {
        return level;
      }
    }
    return this.LEVEL_CURVE.length;
  }

  /**
   * Get experience points required for next level
   */
  static getPointsForNextLevel(currentLevel: number): number {
    if (currentLevel >= this.LEVEL_CURVE.length) {
      return 0; // Max level reached
    }
    return this.LEVEL_CURVE[currentLevel];
  }

  /**
   * Get progress to next level
   */
  static getLevelProgress(
    currentExperience: number,
    currentLevel: number
  ): {
    currentLevelXp: number;
    nextLevelXp: number;
    progress: number;
    progressPercentage: number;
  } {
    if (currentLevel >= this.LEVEL_CURVE.length) {
      return {
        currentLevelXp: currentExperience,
        nextLevelXp: currentExperience,
        progress: 0,
        progressPercentage: 100,
      };
    }

    const currentLevelXp = currentLevel > 0 ? this.LEVEL_CURVE[currentLevel - 1] : 0;
    const nextLevelXp = this.LEVEL_CURVE[currentLevel];
    const progress = currentExperience - currentLevelXp;
    const required = nextLevelXp - currentLevelXp;
    const progressPercentage = (progress / required) * 100;

    return {
      currentLevelXp,
      nextLevelXp,
      progress,
      progressPercentage: Math.min(progressPercentage, 100),
    };
  }

  /**
   * Generate leaderboard
   */
  static async generateLeaderboard(
    organizationId: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    // In production, query database
    const profiles = await this.getActiveProfiles(organizationId, timeframe);

    // Sort by appropriate metric
    let sortedProfiles: PlayerProfile[];
    switch (timeframe) {
      case LeaderboardTimeframe.DAILY:
      case LeaderboardTimeframe.WEEKLY:
        sortedProfiles = profiles.sort(
          (a, b) => b.stats.pointsThisWeek - a.stats.pointsThisWeek
        );
        break;
      case LeaderboardTimeframe.MONTHLY:
        sortedProfiles = profiles.sort(
          (a, b) => b.stats.pointsThisMonth - a.stats.pointsThisMonth
        );
        break;
      case LeaderboardTimeframe.ALL_TIME:
      default:
        sortedProfiles = profiles.sort((a, b) => b.totalPoints - a.totalPoints);
        break;
    }

    // Create leaderboard entries
    return sortedProfiles.slice(0, limit).map((profile, index) => ({
      rank: index + 1,
      patientId: profile.patientId,
      displayName: profile.displayName,
      avatar: profile.avatar,
      level: profile.level,
      points: this.getPointsForTimeframe(profile, timeframe),
      badges: profile.badges.length,
      achievements: profile.achievements.length,
      currentTitle: profile.currentTitle,
    }));
  }

  /**
   * Get player rank
   */
  static async getPlayerRank(
    patientId: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<{ rank: number; total: number; percentile: number }> {
    const profile = await this.getPlayerProfile(patientId);
    const leaderboard = await this.generateLeaderboard(
      profile.organizationId,
      timeframe,
      10000
    );

    const entry = leaderboard.find((e) => e.patientId === patientId);
    const rank = entry?.rank || leaderboard.length + 1;
    const total = leaderboard.length;
    const percentile = ((total - rank) / total) * 100;

    return { rank, total, percentile };
  }

  /**
   * Calculate engagement score
   */
  static calculateEngagementScore(stats: PlayerStats): number {
    // Weighted scoring algorithm
    const weights = {
      goalsCompleted: 10,
      challengesCompleted: 15,
      activeDays: 5,
      checkInsCompleted: 3,
      contentCompleted: 8,
      socialInteractions: 5,
    };

    const score =
      stats.goalsCompleted * weights.goalsCompleted +
      stats.challengesCompleted * weights.challengesCompleted +
      stats.activeDays * weights.activeDays +
      stats.checkInsCompleted * weights.checkInsCompleted +
      stats.contentCompleted * weights.contentCompleted +
      stats.socialInteractions * weights.socialInteractions;

    // Normalize to 0-100 scale
    return Math.min(Math.round((score / 1000) * 100), 100);
  }

  /**
   * Apply point multiplier for special events
   */
  static applyMultiplier(
    basePoints: number,
    multiplierType: MultiplierType
  ): number {
    const multipliers: Record<MultiplierType, number> = {
      [MultiplierType.WEEKEND]: 1.5,
      [MultiplierType.HOLIDAY]: 2.0,
      [MultiplierType.BIRTHDAY]: 3.0,
      [MultiplierType.STREAK_BONUS]: 1.25,
      [MultiplierType.LEVEL_MILESTONE]: 2.5,
      [MultiplierType.EVENT]: 2.0,
    };

    return Math.round(basePoints * multipliers[multiplierType]);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate exponential level curve
   */
  private static generateLevelCurve(maxLevel: number): number[] {
    const curve: number[] = [];
    const baseXP = 100;
    const exponent = 1.5;

    for (let level = 1; level <= maxLevel; level++) {
      const xpRequired = Math.floor(baseXP * Math.pow(level, exponent));
      curve.push(level === 1 ? xpRequired : curve[level - 2] + xpRequired);
    }

    return curve;
  }

  /**
   * Initialize player stats
   */
  private static initializeStats(): PlayerStats {
    return {
      goalsCompleted: 0,
      goalsActive: 0,
      challengesCompleted: 0,
      challengesActive: 0,
      pointsThisWeek: 0,
      pointsThisMonth: 0,
      pointsAllTime: 0,
      activeDays: 0,
      checkInsCompleted: 0,
      contentCompleted: 0,
      socialInteractions: 0,
    };
  }

  /**
   * Get default gamification preferences
   */
  private static getDefaultPreferences(): GamificationPreferences {
    return {
      showLeaderboard: true,
      allowCompare: true,
      emailNotifications: true,
      pushNotifications: true,
      celebrateAchievements: true,
      publicProfile: false,
    };
  }

  /**
   * Update stats when points are awarded
   */
  private static updateStatsForPoints(
    stats: PlayerStats,
    category: PointCategory,
    amount: number
  ): void {
    stats.pointsAllTime += amount;
    stats.pointsThisWeek += amount; // Would need date checking in production
    stats.pointsThisMonth += amount; // Would need date checking in production

    // Update category-specific stats
    switch (category) {
      case PointCategory.GOAL_COMPLETION:
        stats.goalsCompleted++;
        break;
      case PointCategory.CHALLENGE_COMPLETION:
        stats.challengesCompleted++;
        break;
      case PointCategory.CHECK_IN:
        stats.checkInsCompleted++;
        break;
      case PointCategory.EDUCATION:
        stats.contentCompleted++;
        break;
      case PointCategory.SOCIAL_ENGAGEMENT:
        stats.socialInteractions++;
        break;
    }
  }

  /**
   * Get level rewards
   */
  private static getLevelRewards(level: number): LevelReward {
    const bonusPoints = level * 50;
    const rewards: LevelReward = {
      bonusPoints,
      title: this.getLevelTitle(level),
      unlockedFeatures: this.getUnlockedFeatures(level),
    };

    // Milestone rewards
    if (level % 10 === 0) {
      rewards.specialBadge = `Level ${level} Master`;
      rewards.bonusPoints *= 2;
    }

    return rewards;
  }

  /**
   * Get title for level
   */
  private static getLevelTitle(level: number): LevelTitle | null {
    const titles: Record<number, LevelTitle> = {
      1: { name: "Newcomer", description: "Just getting started", icon: "🌱", color: "#4ade80" },
      5: { name: "Apprentice", description: "Learning the ropes", icon: "📚", color: "#60a5fa" },
      10: { name: "Explorer", description: "Discovering new paths", icon: "🧭", color: "#a78bfa" },
      25: { name: "Achiever", description: "Making real progress", icon: "🎯", color: "#f59e0b" },
      50: { name: "Champion", description: "Consistent excellence", icon: "🏆", color: "#eab308" },
      75: { name: "Legend", description: "Inspiring others", icon: "⭐", color: "#f97316" },
      100: { name: "Grand Master", description: "Ultimate dedication", icon: "👑", color: "#dc2626" },
    };

    return titles[level] || null;
  }

  /**
   * Get features unlocked at level
   */
  private static getUnlockedFeatures(level: number): string[] {
    const features: string[] = [];

    if (level >= 5) features.push("Advanced challenges");
    if (level >= 10) features.push("Custom avatars");
    if (level >= 15) features.push("Team challenges");
    if (level >= 20) features.push("Premium content");
    if (level >= 25) features.push("Exclusive rewards");
    if (level >= 50) features.push("VIP support");
    if (level >= 100) features.push("Lifetime benefits");

    return features;
  }

  /**
   * Get points for specific timeframe
   */
  private static getPointsForTimeframe(
    profile: PlayerProfile,
    timeframe: LeaderboardTimeframe
  ): number {
    switch (timeframe) {
      case LeaderboardTimeframe.WEEKLY:
        return profile.stats.pointsThisWeek;
      case LeaderboardTimeframe.MONTHLY:
        return profile.stats.pointsThisMonth;
      case LeaderboardTimeframe.ALL_TIME:
      default:
        return profile.totalPoints;
    }
  }

  /**
   * Get active profiles (mock - would query database)
   */
  private static async getActiveProfiles(
    organizationId: string,
    timeframe: LeaderboardTimeframe
  ): Promise<PlayerProfile[]> {
    // Mock implementation
    return [];
  }

  /**
   * Get player profile (mock - would query database)
   */
  private static async getPlayerProfile(patientId: string): Promise<PlayerProfile> {
    // Mock implementation
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

export enum LeaderboardTimeframe {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  ALL_TIME = "ALL_TIME",
}

export enum MultiplierType {
  WEEKEND = "WEEKEND",
  HOLIDAY = "HOLIDAY",
  BIRTHDAY = "BIRTHDAY",
  STREAK_BONUS = "STREAK_BONUS",
  LEVEL_MILESTONE = "LEVEL_MILESTONE",
  EVENT = "EVENT",
}

interface LeaderboardEntry {
  rank: number;
  patientId: string;
  displayName: string;
  avatar: string | null;
  level: number;
  points: number;
  badges: number;
  achievements: number;
  currentTitle: string | null;
}

interface LevelReward {
  bonusPoints: number;
  title: LevelTitle | null;
  unlockedFeatures: string[];
  specialBadge?: string;
}

interface LevelTitle {
  name: string;
  description: string;
  icon: string;
  color: string;
}
