/**
 * Achievements and Badges System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive achievement tracking system including:
 * - Achievement definitions and requirements
 * - Progress tracking and completion
 * - Badge awards and collection
 * - Secret and special achievements
 * - Achievement recommendations
 */

import type {
  Achievement,
  AchievementCategory,
  AchievementTier,
  AchievementRequirement,
  RequirementType,
  Timeframe,
  AchievementEarned,
  Badge,
  BadgeCategory,
  BadgeRarity,
  BadgeEarned,
  PlayerProfile,
} from "@/types/engagement";

// ============================================================================
// Achievements Engine
// ============================================================================

export class AchievementsEngine {
  /**
   * Check and award achievements for a player
   */
  static async checkAchievements(
    patientId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<AchievementEarned[]> {
    const profile = await this.getPlayerProfile(patientId);
    const achievements = await this.getActiveAchievements();
    const earned: AchievementEarned[] = [];

    for (const achievement of achievements) {
      // Skip if already earned and not repeatable
      if (!achievement.isRepeatable) {
        const alreadyEarned = profile.achievements.some(
          (a) => a.achievementId === achievement.id && a.isCompleted
        );
        if (alreadyEarned) continue;
      }

      // Check dependencies
      if (!this.checkDependencies(achievement, profile)) {
        continue;
      }

      // Check if achievement criteria is met
      const progress = await this.calculateProgress(
        achievement,
        profile,
        eventType,
        eventData
      );

      if (progress >= 100) {
        const earnedAchievement = await this.awardAchievement(
          patientId,
          achievement
        );
        earned.push(earnedAchievement);
      } else {
        // Update progress
        await this.updateAchievementProgress(patientId, achievement.id, progress);
      }
    }

    return earned;
  }

  /**
   * Award an achievement to a player
   */
  private static async awardAchievement(
    patientId: string,
    achievement: Achievement
  ): Promise<AchievementEarned> {
    const now = new Date();

    const earned: AchievementEarned = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      achievementId: achievement.id,
      achievement,
      earnedDate: now,
      progress: 100,
      isCompleted: true,
      notificationSent: false,
      displayedToUser: false,
    };

    // Award points
    await this.awardAchievementPoints(patientId, achievement);

    // Trigger notification
    await this.sendAchievementNotification(patientId, achievement);

    return earned;
  }

  /**
   * Calculate achievement progress
   */
  private static async calculateProgress(
    achievement: Achievement,
    profile: PlayerProfile,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<number> {
    const req = achievement.requirement;
    let currentValue = 0;
    let targetValue = req.threshold;

    switch (req.type) {
      case RequirementType.COUNT:
        currentValue = await this.getMetricCount(
          profile.patientId,
          req.metric,
          req.timeframe
        );
        break;

      case RequirementType.STREAK:
        currentValue = profile.currentStreak;
        break;

      case RequirementType.PERCENTAGE:
        currentValue = await this.getMetricPercentage(
          profile.patientId,
          req.metric,
          req.timeframe
        );
        targetValue = 100;
        break;

      case RequirementType.THRESHOLD:
        currentValue = await this.getMetricValue(
          profile.patientId,
          req.metric,
          req.timeframe
        );
        break;

      case RequirementType.COMPOSITE:
        currentValue = await this.evaluateCompositeRequirement(
          profile.patientId,
          req.conditions
        );
        break;
    }

    return Math.min((currentValue / targetValue) * 100, 100);
  }

  /**
   * Check achievement dependencies
   */
  private static checkDependencies(
    achievement: Achievement,
    profile: PlayerProfile
  ): boolean {
    if (achievement.dependencies.length === 0) return true;

    return achievement.dependencies.every((depCode) => {
      return profile.achievements.some(
        (a) => a.achievement.code === depCode && a.isCompleted
      );
    });
  }

  /**
   * Get predefined achievements
   */
  static getPredefinedAchievements(): Achievement[] {
    const achievements: Partial<Achievement>[] = [
      // Goals Achievements
      {
        code: "FIRST_GOAL",
        name: "Goal Setter",
        description: "Create your first health goal",
        category: AchievementCategory.GOALS,
        tier: AchievementTier.BRONZE,
        icon: "🎯",
        iconColor: "#cd7f32",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 1,
          metric: "goals_created",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 50,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["beginner", "goals"],
        isActive: true,
      },
      {
        code: "GOAL_ACHIEVER_10",
        name: "Goal Achiever",
        description: "Complete 10 health goals",
        category: AchievementCategory.GOALS,
        tier: AchievementTier.SILVER,
        icon: "🏆",
        iconColor: "#c0c0c0",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 10,
          metric: "goals_completed",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 200,
        isSecret: false,
        isRepeatable: false,
        dependencies: ["FIRST_GOAL"],
        tags: ["goals", "milestone"],
        isActive: true,
      },
      {
        code: "GOAL_MASTER_50",
        name: "Goal Master",
        description: "Complete 50 health goals",
        category: AchievementCategory.GOALS,
        tier: AchievementTier.GOLD,
        icon: "👑",
        iconColor: "#ffd700",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 50,
          metric: "goals_completed",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 1000,
        isSecret: false,
        isRepeatable: false,
        dependencies: ["GOAL_ACHIEVER_10"],
        tags: ["goals", "milestone", "elite"],
        isActive: true,
      },

      // Streak Achievements
      {
        code: "STREAK_7",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        category: AchievementCategory.STREAKS,
        tier: AchievementTier.BRONZE,
        icon: "🔥",
        iconColor: "#ff6b6b",
        requirement: {
          type: RequirementType.STREAK,
          threshold: 7,
          metric: "daily_check_in",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 100,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["streak", "consistency"],
        isActive: true,
      },
      {
        code: "STREAK_30",
        name: "Monthly Champion",
        description: "Maintain a 30-day streak",
        category: AchievementCategory.STREAKS,
        tier: AchievementTier.SILVER,
        icon: "⭐",
        iconColor: "#4ecdc4",
        requirement: {
          type: RequirementType.STREAK,
          threshold: 30,
          metric: "daily_check_in",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 500,
        isSecret: false,
        isRepeatable: false,
        dependencies: ["STREAK_7"],
        tags: ["streak", "consistency", "dedication"],
        isActive: true,
      },
      {
        code: "STREAK_100",
        name: "Century Streaker",
        description: "Maintain a 100-day streak",
        category: AchievementCategory.STREAKS,
        tier: AchievementTier.PLATINUM,
        icon: "💎",
        iconColor: "#a855f7",
        requirement: {
          type: RequirementType.STREAK,
          threshold: 100,
          metric: "daily_check_in",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 2500,
        isSecret: true,
        isRepeatable: false,
        dependencies: ["STREAK_30"],
        tags: ["streak", "legendary"],
        isActive: true,
      },

      // Challenge Achievements
      {
        code: "CHALLENGE_JOIN",
        name: "Team Player",
        description: "Join your first challenge",
        category: AchievementCategory.CHALLENGES,
        tier: AchievementTier.BRONZE,
        icon: "🤝",
        iconColor: "#22c55e",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 1,
          metric: "challenges_joined",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 50,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["challenge", "social"],
        isActive: true,
      },
      {
        code: "CHALLENGE_WIN_5",
        name: "Challenge Champion",
        description: "Win 5 challenges",
        category: AchievementCategory.CHALLENGES,
        tier: AchievementTier.GOLD,
        icon: "🥇",
        iconColor: "#fbbf24",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 5,
          metric: "challenges_won",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 750,
        isSecret: false,
        isRepeatable: false,
        dependencies: ["CHALLENGE_JOIN"],
        tags: ["challenge", "competitive", "winner"],
        isActive: true,
      },

      // Education Achievements
      {
        code: "LEARNING_START",
        name: "Knowledge Seeker",
        description: "Complete your first educational content",
        category: AchievementCategory.EDUCATION,
        tier: AchievementTier.BRONZE,
        icon: "📖",
        iconColor: "#3b82f6",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 1,
          metric: "content_completed",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 50,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["education", "learning"],
        isActive: true,
      },
      {
        code: "SCHOLAR_25",
        name: "Health Scholar",
        description: "Complete 25 educational modules",
        category: AchievementCategory.EDUCATION,
        tier: AchievementTier.GOLD,
        icon: "🎓",
        iconColor: "#8b5cf6",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 25,
          metric: "content_completed",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 800,
        isSecret: false,
        isRepeatable: false,
        dependencies: ["LEARNING_START"],
        tags: ["education", "expert"],
        isActive: true,
      },

      // Engagement Achievements
      {
        code: "EARLY_BIRD",
        name: "Early Bird",
        description: "Log activity before 7 AM (5 times)",
        category: AchievementCategory.ENGAGEMENT,
        tier: AchievementTier.SILVER,
        icon: "🌅",
        iconColor: "#f97316",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 5,
          metric: "early_morning_activity",
          timeframe: null,
          conditions: { hour_before: 7 },
        },
        rewardPoints: 150,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["engagement", "timing"],
        isActive: true,
      },
      {
        code: "NIGHT_OWL",
        name: "Night Owl",
        description: "Log activity after 10 PM (5 times)",
        category: AchievementCategory.ENGAGEMENT,
        tier: AchievementTier.SILVER,
        icon: "🦉",
        iconColor: "#6366f1",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 5,
          metric: "late_night_activity",
          timeframe: null,
          conditions: { hour_after: 22 },
        },
        rewardPoints: 150,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["engagement", "timing"],
        isActive: true,
      },

      // Social Achievements
      {
        code: "SOCIAL_BUTTERFLY",
        name: "Social Butterfly",
        description: "Interact with family members 20 times",
        category: AchievementCategory.SOCIAL,
        tier: AchievementTier.SILVER,
        icon: "🦋",
        iconColor: "#ec4899",
        requirement: {
          type: RequirementType.COUNT,
          threshold: 20,
          metric: "family_interactions",
          timeframe: null,
          conditions: {},
        },
        rewardPoints: 300,
        isSecret: false,
        isRepeatable: false,
        dependencies: [],
        tags: ["social", "family"],
        isActive: true,
      },

      // Special Achievements
      {
        code: "PERFECT_WEEK",
        name: "Perfect Week",
        description: "Complete all daily goals for 7 consecutive days",
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.PLATINUM,
        icon: "✨",
        iconColor: "#10b981",
        requirement: {
          type: RequirementType.COMPOSITE,
          threshold: 1,
          metric: "perfect_week",
          timeframe: Timeframe.WEEK,
          conditions: {
            all_goals_complete: true,
            consecutive_days: 7,
          },
        },
        rewardPoints: 1500,
        isSecret: true,
        isRepeatable: true,
        dependencies: [],
        tags: ["special", "perfection"],
        isActive: true,
      },
    ];

    return achievements as Achievement[];
  }

  /**
   * Get predefined badges
   */
  static getPredefinedBadges(): Badge[] {
    const badges: Partial<Badge>[] = [
      {
        code: "WELCOME",
        name: "Welcome Badge",
        description: "Joined the wellness program",
        category: BadgeCategory.MILESTONE,
        icon: "👋",
        iconColor: "#3b82f6",
        backgroundColor: "#dbeafe",
        requirement: "Create account",
        isActive: true,
        rarity: BadgeRarity.COMMON,
        seasonalEvent: null,
      },
      {
        code: "LEVEL_10",
        name: "Level 10",
        description: "Reached level 10",
        category: BadgeCategory.MILESTONE,
        icon: "🌟",
        iconColor: "#fbbf24",
        backgroundColor: "#fef3c7",
        requirement: "Reach level 10",
        isActive: true,
        rarity: BadgeRarity.UNCOMMON,
        seasonalEvent: null,
      },
      {
        code: "LEVEL_25",
        name: "Level 25",
        description: "Reached level 25",
        category: BadgeCategory.MILESTONE,
        icon: "⭐",
        iconColor: "#f97316",
        backgroundColor: "#ffedd5",
        requirement: "Reach level 25",
        isActive: true,
        rarity: BadgeRarity.RARE,
        seasonalEvent: null,
      },
      {
        code: "LEVEL_50",
        name: "Level 50",
        description: "Reached level 50",
        category: BadgeCategory.MILESTONE,
        icon: "💫",
        iconColor: "#a855f7",
        backgroundColor: "#f3e8ff",
        requirement: "Reach level 50",
        isActive: true,
        rarity: BadgeRarity.EPIC,
        seasonalEvent: null,
      },
      {
        code: "LEVEL_100",
        name: "Level 100",
        description: "Reached the ultimate level",
        category: BadgeCategory.MILESTONE,
        icon: "👑",
        iconColor: "#dc2626",
        backgroundColor: "#fee2e2",
        requirement: "Reach level 100",
        isActive: true,
        rarity: BadgeRarity.LEGENDARY,
        seasonalEvent: null,
      },
      {
        code: "NEW_YEAR",
        name: "New Year Champion",
        description: "Participated in New Year challenge",
        category: BadgeCategory.SEASONAL,
        icon: "🎉",
        iconColor: "#eab308",
        backgroundColor: "#fef9c3",
        requirement: "Complete New Year challenge",
        isActive: true,
        rarity: BadgeRarity.RARE,
        seasonalEvent: "new_year",
      },
      {
        code: "HEART_MONTH",
        name: "Heart Health Hero",
        description: "Completed Heart Health Month activities",
        category: BadgeCategory.SEASONAL,
        icon: "❤️",
        iconColor: "#ef4444",
        backgroundColor: "#fee2e2",
        requirement: "Complete February heart health activities",
        isActive: true,
        rarity: BadgeRarity.RARE,
        seasonalEvent: "heart_month",
      },
    ];

    return badges as Badge[];
  }

  /**
   * Award badge to player
   */
  static async awardBadge(
    patientId: string,
    badgeId: string
  ): Promise<BadgeEarned> {
    const badge = await this.getBadgeById(badgeId);
    const profile = await this.getPlayerProfile(patientId);

    const badgeEarned: BadgeEarned = {
      id: crypto.randomUUID(),
      organizationId: profile.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      badgeId,
      badge,
      earnedDate: new Date(),
      displayOrder: profile.badges.length,
    };

    return badgeEarned;
  }

  /**
   * Get achievement recommendations
   */
  static async getRecommendations(
    patientId: string
  ): Promise<AchievementRecommendation[]> {
    const profile = await this.getPlayerProfile(patientId);
    const achievements = await this.getActiveAchievements();
    const recommendations: AchievementRecommendation[] = [];

    for (const achievement of achievements) {
      // Skip completed non-repeatable achievements
      if (!achievement.isRepeatable) {
        const completed = profile.achievements.some(
          (a) => a.achievementId === achievement.id && a.isCompleted
        );
        if (completed) continue;
      }

      // Skip secret achievements
      if (achievement.isSecret) continue;

      // Check dependencies
      if (!this.checkDependencies(achievement, profile)) continue;

      // Calculate current progress
      const progress = await this.calculateProgress(
        achievement,
        profile,
        "",
        {}
      );

      // Only recommend if making some progress
      if (progress > 0 && progress < 100) {
        recommendations.push({
          achievement,
          currentProgress: progress,
          estimatedTimeToComplete: this.estimateTimeToComplete(
            achievement,
            progress
          ),
          difficulty: this.calculateDifficulty(achievement, profile),
        });
      }
    }

    // Sort by progress and difficulty
    return recommendations
      .sort((a, b) => b.currentProgress - a.currentProgress)
      .slice(0, 5);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async getMetricCount(
    patientId: string,
    metric: string,
    timeframe: Timeframe | null
  ): Promise<number> {
    // Mock implementation - would query database
    return 0;
  }

  private static async getMetricPercentage(
    patientId: string,
    metric: string,
    timeframe: Timeframe | null
  ): Promise<number> {
    // Mock implementation - would query database
    return 0;
  }

  private static async getMetricValue(
    patientId: string,
    metric: string,
    timeframe: Timeframe | null
  ): Promise<number> {
    // Mock implementation - would query database
    return 0;
  }

  private static async evaluateCompositeRequirement(
    patientId: string,
    conditions: Record<string, any>
  ): Promise<number> {
    // Mock implementation - would evaluate complex conditions
    return 0;
  }

  private static async awardAchievementPoints(
    patientId: string,
    achievement: Achievement
  ): Promise<void> {
    // Would integrate with gamification engine
  }

  private static async sendAchievementNotification(
    patientId: string,
    achievement: Achievement
  ): Promise<void> {
    // Would integrate with notification system
  }

  private static async updateAchievementProgress(
    patientId: string,
    achievementId: string,
    progress: number
  ): Promise<void> {
    // Would update in database
  }

  private static estimateTimeToComplete(
    achievement: Achievement,
    currentProgress: number
  ): string {
    // Simple estimation logic
    const remaining = 100 - currentProgress;
    if (remaining < 20) return "A few days";
    if (remaining < 50) return "1-2 weeks";
    if (remaining < 80) return "2-4 weeks";
    return "1-2 months";
  }

  private static calculateDifficulty(
    achievement: Achievement,
    profile: PlayerProfile
  ): "Easy" | "Medium" | "Hard" | "Expert" {
    const tier = achievement.tier;
    if (tier === AchievementTier.BRONZE) return "Easy";
    if (tier === AchievementTier.SILVER) return "Medium";
    if (tier === AchievementTier.GOLD) return "Hard";
    return "Expert";
  }

  private static async getActiveAchievements(): Promise<Achievement[]> {
    return this.getPredefinedAchievements();
  }

  private static async getBadgeById(badgeId: string): Promise<Badge> {
    throw new Error("Not implemented");
  }

  private static async getPlayerProfile(
    patientId: string
  ): Promise<PlayerProfile> {
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface AchievementRecommendation {
  achievement: Achievement;
  currentProgress: number;
  estimatedTimeToComplete: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
}
