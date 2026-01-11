/**
 * Streak Tracking System
 * Agent 5: Patient Engagement Platform
 *
 * Comprehensive streak tracking including:
 * - Daily activity streaks
 * - Streak maintenance and recovery
 * - Streak freezes and protections
 * - Milestone rewards
 * - Multi-type streak support
 */

import type {
  Streak,
  StreakType,
  StreakActivity,
} from "@/types/engagement";

// ============================================================================
// Streak Engine
// ============================================================================

export class StreakEngine {
  /**
   * Record activity for streak tracking
   */
  static async recordActivity(
    patientId: string,
    streakType: StreakType,
    metadata?: Record<string, any>
  ): Promise<{
    streak: Streak;
    isNewMilestone: boolean;
    pointsEarned: number;
    milestoneLevel?: number;
  }> {
    const streak = await this.getOrCreateStreak(patientId, streakType);
    const now = new Date();
    const today = this.getDateOnly(now);

    // Check if already logged today
    const alreadyLoggedToday = await this.hasActivityToday(
      streak.id,
      today
    );

    if (alreadyLoggedToday) {
      return {
        streak,
        isNewMilestone: false,
        pointsEarned: 0,
      };
    }

    // Record activity
    await this.createStreakActivity(streak.id, patientId, today, true, metadata);

    // Update streak
    const wasActive = this.isStreakActive(streak);
    const updatedStreak = this.updateStreakCount(streak, wasActive);

    // Check for milestones
    const milestone = this.checkMilestone(updatedStreak.currentCount);
    const pointsEarned = milestone ? this.calculateMilestoneReward(milestone) : 0;

    return {
      streak: updatedStreak,
      isNewMilestone: milestone !== null,
      pointsEarned,
      milestoneLevel: milestone || undefined,
    };
  }

  /**
   * Get or create streak for patient
   */
  private static async getOrCreateStreak(
    patientId: string,
    streakType: StreakType
  ): Promise<Streak> {
    // Try to find existing streak
    const existing = await this.findStreak(patientId, streakType);
    if (existing) return existing;

    // Create new streak
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
      patientId,
      type: streakType,
      currentCount: 0,
      longestCount: 0,
      startDate: now,
      lastActivityDate: now,
      isActive: true,
      freezeCount: 0,
      metadata: {},
    };
  }

  /**
   * Update streak count based on activity
   */
  private static updateStreakCount(
    streak: Streak,
    wasActive: boolean
  ): Streak {
    const now = new Date();

    if (wasActive) {
      // Continue existing streak
      streak.currentCount++;
    } else {
      // Start new streak
      streak.currentCount = 1;
      streak.startDate = now;
    }

    // Update longest streak if needed
    if (streak.currentCount > streak.longestCount) {
      streak.longestCount = streak.currentCount;
    }

    streak.lastActivityDate = now;
    streak.updatedAt = now;
    streak.isActive = true;

    return streak;
  }

  /**
   * Check if streak is still active
   */
  private static isStreakActive(streak: Streak): boolean {
    if (!streak.lastActivityDate) return false;

    const now = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const daysSinceActivity = this.getDaysDifference(lastActivity, now);

    // Streak is active if last activity was yesterday
    return daysSinceActivity === 1;
  }

  /**
   * Use streak freeze to protect streak
   */
  static async useStreakFreeze(
    patientId: string,
    streakType: StreakType
  ): Promise<{
    success: boolean;
    streak: Streak;
    remainingFreezes: number;
  }> {
    const streak = await this.findStreak(patientId, streakType);
    if (!streak) {
      throw new Error("Streak not found");
    }

    if (streak.freezeCount <= 0) {
      return {
        success: false,
        streak,
        remainingFreezes: 0,
      };
    }

    // Use a freeze
    streak.freezeCount--;
    streak.metadata.freezeUsedAt = new Date().toISOString();
    streak.updatedAt = new Date();

    // Consider this as activity to maintain streak
    await this.recordActivity(patientId, streakType, {
      freezeUsed: true,
    });

    return {
      success: true,
      streak,
      remainingFreezes: streak.freezeCount,
    };
  }

  /**
   * Award streak freeze as reward
   */
  static async awardStreakFreeze(
    patientId: string,
    streakType: StreakType,
    count: number = 1
  ): Promise<Streak> {
    const streak = await this.getOrCreateStreak(patientId, streakType);
    streak.freezeCount += count;
    streak.updatedAt = new Date();
    return streak;
  }

  /**
   * Check for streak milestones
   */
  private static checkMilestone(currentCount: number): number | null {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    return milestones.find((m) => m === currentCount) || null;
  }

  /**
   * Calculate milestone reward points
   */
  private static calculateMilestoneReward(milestone: number): number {
    const basePoints = 50;
    const multiplier = Math.log2(milestone / 7 + 1);
    return Math.round(basePoints * multiplier);
  }

  /**
   * Get streak statistics for a patient
   */
  static async getStreakStats(
    patientId: string
  ): Promise<StreakStatistics> {
    const streaks = await this.getAllStreaks(patientId);

    const activeStreaks = streaks.filter((s) => this.isStreakActive(s));
    const totalCurrentDays = streaks.reduce((sum, s) => sum + s.currentCount, 0);
    const longestEver = Math.max(...streaks.map((s) => s.longestCount), 0);
    const totalFreezes = streaks.reduce((sum, s) => sum + s.freezeCount, 0);

    return {
      activeStreakCount: activeStreaks.length,
      totalCurrentDays,
      longestStreakEver: longestEver,
      totalFreezesAvailable: totalFreezes,
      streaksByType: this.groupStreaksByType(streaks),
      nextMilestones: this.getNextMilestones(streaks),
    };
  }

  /**
   * Check all streaks and reset expired ones
   */
  static async checkAndResetExpiredStreaks(): Promise<void> {
    const allStreaks = await this.getAllActiveStreaks();
    const now = new Date();

    for (const streak of allStreaks) {
      const daysSinceActivity = this.getDaysDifference(
        new Date(streak.lastActivityDate),
        now
      );

      // If more than 1 day has passed without freeze, reset streak
      if (daysSinceActivity > 1) {
        await this.resetStreak(streak);
        await this.sendStreakLostNotification(streak);
      } else if (daysSinceActivity === 1) {
        // Send warning for at-risk streak
        await this.sendStreakWarningNotification(streak);
      }
    }
  }

  /**
   * Reset a streak (when broken)
   */
  private static async resetStreak(streak: Streak): Promise<void> {
    // Save the broken streak to history
    await this.saveStreakHistory(streak);

    // Reset current count but keep longest
    streak.currentCount = 0;
    streak.isActive = false;
    streak.updatedAt = new Date();
    streak.metadata.lastBrokenAt = new Date().toISOString();
  }

  /**
   * Get streak recovery options
   */
  static async getRecoveryOptions(
    patientId: string,
    streakType: StreakType
  ): Promise<RecoveryOption[]> {
    const streak = await this.findStreak(patientId, streakType);
    if (!streak) return [];

    const options: RecoveryOption[] = [];

    // Freeze option
    if (streak.freezeCount > 0) {
      options.push({
        type: "freeze",
        name: "Use Streak Freeze",
        description: "Protect your streak for today using a freeze",
        cost: 0,
        available: true,
      });
    }

    // Point recovery option
    const recoveryCost = this.calculateRecoveryCost(streak.currentCount);
    options.push({
      type: "points",
      name: "Recover with Points",
      description: "Spend points to recover your streak",
      cost: recoveryCost,
      available: true,
    });

    return options;
  }

  /**
   * Calculate cost to recover a streak with points
   */
  private static calculateRecoveryCost(streakLength: number): number {
    // Base cost increases with streak length
    const baseCost = 100;
    const lengthMultiplier = Math.log2(streakLength + 1);
    return Math.round(baseCost * lengthMultiplier);
  }

  /**
   * Get leaderboard for specific streak type
   */
  static async getStreakLeaderboard(
    organizationId: string,
    streakType: StreakType,
    limit: number = 10
  ): Promise<StreakLeaderboardEntry[]> {
    const allStreaks = await this.getStreaksByType(organizationId, streakType);

    return allStreaks
      .filter((s) => s.isActive)
      .sort((a, b) => b.currentCount - a.currentCount)
      .slice(0, limit)
      .map((streak, index) => ({
        rank: index + 1,
        patientId: streak.patientId,
        displayName: "Anonymous", // Would fetch from profile
        streakType: streak.type,
        currentCount: streak.currentCount,
        longestCount: streak.longestCount,
        startDate: streak.startDate,
      }));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private static getDaysDifference(date1: Date, date2: Date): number {
    const day1 = this.getDateOnly(date1);
    const day2 = this.getDateOnly(date2);
    const diffTime = Math.abs(day2.getTime() - day1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private static async findStreak(
    patientId: string,
    streakType: StreakType
  ): Promise<Streak | null> {
    // Mock - would query database
    return null;
  }

  private static async hasActivityToday(
    streakId: string,
    date: Date
  ): Promise<boolean> {
    // Mock - would query database
    return false;
  }

  private static async createStreakActivity(
    streakId: string,
    patientId: string,
    date: Date,
    completed: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Mock - would insert into database
  }

  private static async getAllStreaks(patientId: string): Promise<Streak[]> {
    // Mock - would query database
    return [];
  }

  private static async getAllActiveStreaks(): Promise<Streak[]> {
    // Mock - would query database
    return [];
  }

  private static async getStreaksByType(
    organizationId: string,
    streakType: StreakType
  ): Promise<Streak[]> {
    // Mock - would query database
    return [];
  }

  private static async saveStreakHistory(streak: Streak): Promise<void> {
    // Mock - would save to database
  }

  private static async sendStreakWarningNotification(streak: Streak): Promise<void> {
    // Mock - would send notification
  }

  private static async sendStreakLostNotification(streak: Streak): Promise<void> {
    // Mock - would send notification
  }

  private static groupStreaksByType(streaks: Streak[]): Record<StreakType, number> {
    const grouped: Partial<Record<StreakType, number>> = {};
    streaks.forEach((streak) => {
      grouped[streak.type] = streak.currentCount;
    });
    return grouped as Record<StreakType, number>;
  }

  private static getNextMilestones(streaks: Streak[]): NextMilestone[] {
    const milestones = [7, 14, 30, 60, 90, 180, 365];

    return streaks
      .filter((s) => s.isActive)
      .map((streak) => {
        const nextMilestone = milestones.find(
          (m) => m > streak.currentCount
        );
        return {
          streakType: streak.type,
          currentCount: streak.currentCount,
          nextMilestone: nextMilestone || null,
          daysUntil: nextMilestone ? nextMilestone - streak.currentCount : null,
        };
      })
      .filter((m) => m.nextMilestone !== null);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface StreakStatistics {
  activeStreakCount: number;
  totalCurrentDays: number;
  longestStreakEver: number;
  totalFreezesAvailable: number;
  streaksByType: Record<StreakType, number>;
  nextMilestones: NextMilestone[];
}

interface NextMilestone {
  streakType: StreakType;
  currentCount: number;
  nextMilestone: number | null;
  daysUntil: number | null;
}

interface RecoveryOption {
  type: "freeze" | "points" | "challenge";
  name: string;
  description: string;
  cost: number;
  available: boolean;
}

interface StreakLeaderboardEntry {
  rank: number;
  patientId: string;
  displayName: string;
  streakType: StreakType;
  currentCount: number;
  longestCount: number;
  startDate: Date;
}
