/**
 * Rewards and Incentives System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive rewards management including:
 * - Reward catalog management
 * - Point redemption
 * - Fulfillment tracking
 * - Incentive programs
 * - Dynamic pricing
 */

import type {
  Reward,
  RewardCategory,
  RewardType,
  RewardRedemption,
  RedemptionStatus,
  Incentive,
  IncentiveType,
  RedeemRewardDto,
} from "@/types/engagement";

// ============================================================================
// Rewards Engine
// ============================================================================

export class RewardsEngine {
  /**
   * Redeem a reward
   */
  static async redeemReward(
    data: RedeemRewardDto
  ): Promise<RewardRedemption> {
    const reward = await this.getRewardById(data.rewardId);
    const playerProfile = await this.getPlayerProfile(data.patientId);

    // Validate player has enough points
    if (playerProfile.totalPoints < reward.pointCost) {
      throw new Error("Insufficient points for redemption");
    }

    // Check inventory availability
    if (reward.inventory !== null && reward.inventory <= 0) {
      throw new Error("Reward is out of stock");
    }

    // Check if reward is active
    if (!reward.isActive) {
      throw new Error("Reward is no longer available");
    }

    const now = new Date();
    const expirationDate = reward.expirationDays
      ? new Date(now.getTime() + reward.expirationDays * 24 * 60 * 60 * 1000)
      : null;

    const redemption: RewardRedemption = {
      id: crypto.randomUUID(),
      organizationId: reward.organizationId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: data.patientId,
      updatedBy: data.patientId,
      patientId: data.patientId,
      rewardId: data.rewardId,
      reward,
      pointsSpent: reward.pointCost,
      status: RedemptionStatus.PENDING,
      redemptionDate: now,
      fulfillmentDate: null,
      expirationDate,
      code: this.generateRedemptionCode(),
      trackingNumber: null,
      shippingAddress: data.shippingAddress || null,
      notes: null,
    };

    // Deduct points from player
    await this.deductPoints(data.patientId, reward.pointCost);

    // Update reward inventory and claimed count
    if (reward.inventory !== null) {
      reward.inventory--;
    }
    reward.claimed++;

    // Initiate fulfillment process
    await this.initiateFulfillment(redemption);

    return redemption;
  }

  /**
   * Process reward fulfillment
   */
  static async processFulfillment(
    redemptionId: string,
    trackingNumber?: string
  ): Promise<RewardRedemption> {
    const redemption = await this.getRedemptionById(redemptionId);

    redemption.status = RedemptionStatus.PROCESSING;
    redemption.trackingNumber = trackingNumber || null;
    redemption.updatedAt = new Date();

    // For digital rewards, auto-fulfill
    if (redemption.reward.type === RewardType.DIGITAL) {
      await this.fulfillDigitalReward(redemption);
    }

    return redemption;
  }

  /**
   * Mark reward as fulfilled
   */
  static async markFulfilled(redemptionId: string): Promise<RewardRedemption> {
    const redemption = await this.getRedemptionById(redemptionId);

    redemption.status = RedemptionStatus.FULFILLED;
    redemption.fulfillmentDate = new Date();
    redemption.updatedAt = new Date();

    return redemption;
  }

  /**
   * Get available rewards for patient
   */
  static async getAvailableRewards(
    patientId: string,
    filters?: RewardFilters
  ): Promise<Reward[]> {
    const playerProfile = await this.getPlayerProfile(patientId);
    let rewards = await this.getActiveRewards();

    // Filter by category
    if (filters?.category) {
      rewards = rewards.filter((r) => r.category === filters.category);
    }

    // Filter by affordability
    if (filters?.affordableOnly) {
      rewards = rewards.filter((r) => r.pointCost <= playerProfile.totalPoints);
    }

    // Filter by type
    if (filters?.type) {
      rewards = rewards.filter((r) => r.type === filters.type);
    }

    // Filter out of stock items
    rewards = rewards.filter((r) => r.inventory === null || r.inventory > 0);

    // Sort by featured, then by point cost
    rewards.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.pointCost - b.pointCost;
    });

    return rewards;
  }

  /**
   * Get reward recommendations for patient
   */
  static async getRecommendations(
    patientId: string
  ): Promise<RewardRecommendation[]> {
    const playerProfile = await this.getPlayerProfile(patientId);
    const redemptionHistory = await this.getRedemptionHistory(patientId);
    const availableRewards = await this.getAvailableRewards(patientId, {
      affordableOnly: true,
    });

    const recommendations: RewardRecommendation[] = [];

    // Analyze past redemptions to find preferences
    const categoryPreferences = this.analyzeCategoryPreferences(
      redemptionHistory
    );

    for (const reward of availableRewards.slice(0, 10)) {
      const score = this.calculateRecommendationScore(
        reward,
        playerProfile,
        categoryPreferences
      );

      if (score > 0.5) {
        recommendations.push({
          reward,
          score,
          reason: this.getRecommendationReason(
            reward,
            playerProfile,
            categoryPreferences
          ),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Apply active incentives to point calculation
   */
  static async applyIncentives(
    patientId: string,
    basePoints: number,
    eventType: string,
    metadata?: Record<string, any>
  ): Promise<{
    finalPoints: number;
    appliedIncentives: Incentive[];
    bonusPoints: number;
  }> {
    const activeIncentives = await this.getActiveIncentives(patientId);
    let finalPoints = basePoints;
    const appliedIncentives: Incentive[] = [];
    let bonusPoints = 0;

    for (const incentive of activeIncentives) {
      // Check if incentive applies to this event
      if (incentive.trigger.event === eventType) {
        // Check conditions
        if (this.checkIncentiveConditions(incentive, metadata)) {
          switch (incentive.type) {
            case IncentiveType.POINT_MULTIPLIER:
              const multiplier = incentive.reward.value;
              finalPoints = Math.round(finalPoints * multiplier);
              appliedIncentives.push(incentive);
              break;

            case IncentiveType.BONUS_POINTS:
              bonusPoints += incentive.reward.value;
              appliedIncentives.push(incentive);
              break;
          }

          // Update incentive usage
          incentive.usedCount++;
        }
      }
    }

    finalPoints += bonusPoints;

    return {
      finalPoints,
      appliedIncentives,
      bonusPoints,
    };
  }

  /**
   * Create custom incentive program
   */
  static async createIncentive(
    incentiveData: Partial<Incentive>
  ): Promise<Incentive> {
    const now = new Date();

    const incentive: Incentive = {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: "", // Set from context
      updatedBy: "", // Set from context
      name: incentiveData.name || "",
      description: incentiveData.description || "",
      type: incentiveData.type || IncentiveType.BONUS_POINTS,
      trigger: incentiveData.trigger || { event: "", threshold: null, metric: null },
      reward: incentiveData.reward || { type: "", value: 0, description: "" },
      conditions: incentiveData.conditions || [],
      startDate: incentiveData.startDate || now,
      endDate: incentiveData.endDate || null,
      maxUses: incentiveData.maxUses || null,
      usedCount: 0,
      isActive: incentiveData.isActive !== false,
      priority: incentiveData.priority || 0,
    };

    return incentive;
  }

  /**
   * Get redemption statistics
   */
  static async getRedemptionStats(
    patientId: string
  ): Promise<RedemptionStatistics> {
    const redemptions = await this.getRedemptionHistory(patientId);

    const totalRedeemed = redemptions.length;
    const totalPointsSpent = redemptions.reduce(
      (sum, r) => sum + r.pointsSpent,
      0
    );

    const byCategory = this.groupByCategory(redemptions);
    const pending = redemptions.filter(
      (r) => r.status === RedemptionStatus.PENDING
    ).length;

    const mostRedeemed = this.getMostRedeemedCategory(byCategory);

    return {
      totalRedeemed,
      totalPointsSpent,
      pendingRedemptions: pending,
      redemptionsByCategory: byCategory,
      mostRedeemedCategory: mostRedeemed,
      averageRedemptionValue:
        totalRedeemed > 0 ? totalPointsSpent / totalRedeemed : 0,
    };
  }

  /**
   * Cancel redemption (if allowed)
   */
  static async cancelRedemption(
    redemptionId: string,
    reason?: string
  ): Promise<RewardRedemption> {
    const redemption = await this.getRedemptionById(redemptionId);

    // Only allow cancellation if not yet shipped
    if (
      redemption.status !== RedemptionStatus.PENDING &&
      redemption.status !== RedemptionStatus.PROCESSING
    ) {
      throw new Error("Cannot cancel redemption at this stage");
    }

    redemption.status = RedemptionStatus.CANCELLED;
    redemption.notes = reason || null;
    redemption.updatedAt = new Date();

    // Refund points
    await this.refundPoints(redemption.patientId, redemption.pointsSpent);

    // Restore inventory
    if (redemption.reward.inventory !== null) {
      redemption.reward.inventory++;
    }

    return redemption;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static generateRedemptionCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private static async initiateFulfillment(
    redemption: RewardRedemption
  ): Promise<void> {
    // Integration with fulfillment system would go here
    // For now, just update status
    if (redemption.reward.type === RewardType.DIGITAL) {
      redemption.status = RedemptionStatus.PROCESSING;
    }
  }

  private static async fulfillDigitalReward(
    redemption: RewardRedemption
  ): Promise<void> {
    // Auto-fulfill digital rewards
    redemption.status = RedemptionStatus.FULFILLED;
    redemption.fulfillmentDate = new Date();
  }

  private static analyzeCategoryPreferences(
    redemptions: RewardRedemption[]
  ): Record<RewardCategory, number> {
    const preferences: Partial<Record<RewardCategory, number>> = {};

    redemptions.forEach((r) => {
      const category = r.reward.category;
      preferences[category] = (preferences[category] || 0) + 1;
    });

    return preferences as Record<RewardCategory, number>;
  }

  private static calculateRecommendationScore(
    reward: Reward,
    playerProfile: any,
    categoryPreferences: Record<RewardCategory, number>
  ): number {
    let score = 0;

    // Category preference
    const categoryCount = categoryPreferences[reward.category] || 0;
    score += Math.min(categoryCount * 0.2, 0.4);

    // Affordability
    if (reward.pointCost <= playerProfile.totalPoints) {
      score += 0.3;
    }

    // Featured items
    if (reward.isFeatured) {
      score += 0.2;
    }

    // Popularity
    if (reward.claimed > 100) {
      score += 0.1;
    }

    return score;
  }

  private static getRecommendationReason(
    reward: Reward,
    playerProfile: any,
    categoryPreferences: Record<RewardCategory, number>
  ): string {
    if (categoryPreferences[reward.category] > 0) {
      return "Based on your previous redemptions";
    }
    if (reward.isFeatured) {
      return "Featured reward";
    }
    if (reward.claimed > 100) {
      return "Popular choice";
    }
    return "You have enough points";
  }

  private static checkIncentiveConditions(
    incentive: Incentive,
    metadata?: Record<string, any>
  ): boolean {
    // Check all conditions
    return incentive.conditions.every((condition) => {
      const value = metadata?.[condition.field];
      switch (condition.operator) {
        case "equals":
          return value === condition.value;
        case "greater_than":
          return value > condition.value;
        case "less_than":
          return value < condition.value;
        default:
          return true;
      }
    });
  }

  private static groupByCategory(
    redemptions: RewardRedemption[]
  ): Record<RewardCategory, number> {
    const grouped: Partial<Record<RewardCategory, number>> = {};
    redemptions.forEach((r) => {
      const category = r.reward.category;
      grouped[category] = (grouped[category] || 0) + 1;
    });
    return grouped as Record<RewardCategory, number>;
  }

  private static getMostRedeemedCategory(
    byCategory: Record<RewardCategory, number>
  ): RewardCategory | null {
    let maxCategory: RewardCategory | null = null;
    let maxCount = 0;

    Object.entries(byCategory).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category as RewardCategory;
      }
    });

    return maxCategory;
  }

  // Mock database methods
  private static async getRewardById(rewardId: string): Promise<Reward> {
    throw new Error("Not implemented");
  }

  private static async getRedemptionById(
    redemptionId: string
  ): Promise<RewardRedemption> {
    throw new Error("Not implemented");
  }

  private static async getPlayerProfile(patientId: string): Promise<any> {
    throw new Error("Not implemented");
  }

  private static async getActiveRewards(): Promise<Reward[]> {
    return [];
  }

  private static async getRedemptionHistory(
    patientId: string
  ): Promise<RewardRedemption[]> {
    return [];
  }

  private static async getActiveIncentives(
    patientId: string
  ): Promise<Incentive[]> {
    return [];
  }

  private static async deductPoints(
    patientId: string,
    points: number
  ): Promise<void> {
    // Would integrate with gamification engine
  }

  private static async refundPoints(
    patientId: string,
    points: number
  ): Promise<void> {
    // Would integrate with gamification engine
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface RewardFilters {
  category?: RewardCategory;
  type?: RewardType;
  affordableOnly?: boolean;
  minPoints?: number;
  maxPoints?: number;
}

interface RewardRecommendation {
  reward: Reward;
  score: number;
  reason: string;
}

interface RedemptionStatistics {
  totalRedeemed: number;
  totalPointsSpent: number;
  pendingRedemptions: number;
  redemptionsByCategory: Record<RewardCategory, number>;
  mostRedeemedCategory: RewardCategory | null;
  averageRedemptionValue: number;
}
