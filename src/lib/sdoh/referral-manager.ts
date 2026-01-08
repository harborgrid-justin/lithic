/**
 * SDOH Referral Management System
 *
 * Comprehensive closed-loop referral tracking system for managing
 * referrals to community resources and social services.
 */

import type {
  SDOHReferral,
  ReferralStatus,
  ContactAttempt,
  ReferralOutcome,
  OutcomeType,
  ContactMethod,
  CommunityResource,
} from "@/types/sdoh";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Referral Manager Class
// ============================================================================

export class ReferralManager {
  /**
   * Create a new referral
   */
  async createReferral(
    referralData: Partial<SDOHReferral>
  ): Promise<SDOHReferral> {
    // Create referral with initial status
    const referral: SDOHReferral = {
      id: uuidv4(),
      ...referralData,
      status: ReferralStatus.PENDING,
      contactAttempts: [],
      outcomes: [],
      closedDate: null,
      closedReason: null,
      followUpRequired: true,
    } as SDOHReferral;

    return referral;
  }

  /**
   * Update referral status
   */
  async updateStatus(
    referralId: string,
    status: ReferralStatus,
    notes?: string
  ): Promise<void> {
    // Update status and track status changes
    // In production, this would update database
  }

  /**
   * Record contact attempt
   */
  async recordContactAttempt(
    referralId: string,
    attempt: Omit<ContactAttempt, "id">
  ): Promise<ContactAttempt> {
    const contactAttempt: ContactAttempt = {
      id: uuidv4(),
      ...attempt,
    };

    // Save to database
    return contactAttempt;
  }

  /**
   * Record referral outcome
   */
  async recordOutcome(
    referralId: string,
    outcome: Omit<ReferralOutcome, "id">
  ): Promise<ReferralOutcome> {
    const referralOutcome: ReferralOutcome = {
      id: uuidv4(),
      ...outcome,
    };

    // Update referral status based on outcome
    if (outcome.type === OutcomeType.NEED_MET) {
      await this.updateStatus(referralId, ReferralStatus.COMPLETED);
    }

    return referralOutcome;
  }

  /**
   * Calculate closed-loop rate
   */
  calculateClosedLoopRate(referrals: SDOHReferral[]): number {
    const completedReferrals = referrals.filter(
      (r) =>
        r.status === ReferralStatus.COMPLETED ||
        r.status === ReferralStatus.UNSUCCESSFUL
    );

    return referrals.length > 0
      ? Math.round((completedReferrals.length / referrals.length) * 100)
      : 0;
  }

  /**
   * Calculate time to completion
   */
  calculateAverageTimeToCompletion(referrals: SDOHReferral[]): number {
    const completedReferrals = referrals.filter(
      (r) => r.closedDate && r.referredDate
    );

    if (completedReferrals.length === 0) return 0;

    const totalDays = completedReferrals.reduce((sum, r) => {
      const days =
        (r.closedDate!.getTime() - r.referredDate.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedReferrals.length);
  }

  /**
   * Get referrals needing follow-up
   */
  getReferralsNeedingFollowUp(referrals: SDOHReferral[]): SDOHReferral[] {
    const now = new Date();

    return referrals.filter((r) => {
      if (
        r.status === ReferralStatus.COMPLETED ||
        r.status === ReferralStatus.CANCELLED
      ) {
        return false;
      }

      // No contact in 7 days
      const lastContact =
        r.contactAttempts.length > 0
          ? r.contactAttempts[r.contactAttempts.length - 1]
          : null;

      if (!lastContact) {
        const daysSinceReferral =
          (now.getTime() - r.referredDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceReferral > 3;
      }

      const daysSinceContact =
        (now.getTime() - lastContact.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceContact > 7;
    });
  }

  /**
   * Generate referral metrics
   */
  generateMetrics(referrals: SDOHReferral[]): ReferralMetrics {
    const byStatus: Record<ReferralStatus, number> = {
      [ReferralStatus.PENDING]: 0,
      [ReferralStatus.SENT]: 0,
      [ReferralStatus.ACCEPTED]: 0,
      [ReferralStatus.CONTACTED]: 0,
      [ReferralStatus.IN_PROGRESS]: 0,
      [ReferralStatus.COMPLETED]: 0,
      [ReferralStatus.DECLINED]: 0,
      [ReferralStatus.NO_SHOW]: 0,
      [ReferralStatus.CANCELLED]: 0,
      [ReferralStatus.UNSUCCESSFUL]: 0,
    };

    for (const referral of referrals) {
      byStatus[referral.status]++;
    }

    const successful = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED
    ).length;

    const closedReferrals = referrals.filter(
      (r) =>
        r.status === ReferralStatus.COMPLETED ||
        r.status === ReferralStatus.UNSUCCESSFUL ||
        r.status === ReferralStatus.CANCELLED
    );

    return {
      total: referrals.length,
      byStatus,
      successRate:
        closedReferrals.length > 0
          ? Math.round((successful / closedReferrals.length) * 100)
          : 0,
      closedLoopRate: this.calculateClosedLoopRate(referrals),
      averageTimeToCompletion: this.calculateAverageTimeToCompletion(referrals),
      needingFollowUp: this.getReferralsNeedingFollowUp(referrals).length,
    };
  }

  /**
   * Send referral notification
   */
  async sendReferralNotification(
    referral: SDOHReferral,
    resource: CommunityResource
  ): Promise<void> {
    // Send notification to resource
    // In production, this would integrate with email/fax/API
  }

  /**
   * Check referral eligibility
   */
  checkEligibility(
    patientData: any,
    resource: CommunityResource
  ): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check eligibility criteria
    if (resource.eligibilityCriteria) {
      // Parse and evaluate criteria
      // This is a simplified version
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface ReferralMetrics {
  total: number;
  byStatus: Record<ReferralStatus, number>;
  successRate: number;
  closedLoopRate: number;
  averageTimeToCompletion: number;
  needingFollowUp: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format referral status for display
 */
export function formatReferralStatus(status: ReferralStatus): string {
  return status.replace(/_/g, " ");
}

/**
 * Get status color
 */
export function getStatusColor(status: ReferralStatus): string {
  const colors: Record<ReferralStatus, string> = {
    [ReferralStatus.PENDING]: "#94a3b8",
    [ReferralStatus.SENT]: "#3b82f6",
    [ReferralStatus.ACCEPTED]: "#8b5cf6",
    [ReferralStatus.CONTACTED]: "#06b6d4",
    [ReferralStatus.IN_PROGRESS]: "#f59e0b",
    [ReferralStatus.COMPLETED]: "#10b981",
    [ReferralStatus.DECLINED]: "#ef4444",
    [ReferralStatus.NO_SHOW]: "#f97316",
    [ReferralStatus.CANCELLED]: "#6b7280",
    [ReferralStatus.UNSUCCESSFUL]: "#dc2626",
  };
  return colors[status];
}

/**
 * Export singleton instance
 */
export const referralManager = new ReferralManager();
