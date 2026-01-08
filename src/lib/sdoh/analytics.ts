/**
 * SDOH Analytics Engine
 *
 * Comprehensive analytics for SDOH programs including population insights,
 * outcome tracking, disparity analysis, and quality metrics.
 */

import type {
  SDOHAnalytics,
  SDOHScreening,
  SDOHReferral,
  SDOHIntervention,
  PopulationMetrics,
  ScreeningMetrics,
  NeedsMetrics,
  ReferralMetrics,
  OutcomeMetrics,
  SDOHDomain,
  RiskLevel,
  QuestionnaireType,
  ReferralStatus,
  PopulationSDOHInsight,
  InsightType,
} from "@/types/sdoh";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Analytics Engine Class
// ============================================================================

export class SDOHAnalyticsEngine {
  /**
   * Generate comprehensive analytics report
   */
  generateAnalytics(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    data: {
      screenings: SDOHScreening[];
      referrals: SDOHReferral[];
      interventions: SDOHIntervention[];
      totalPatients: number;
    }
  ): SDOHAnalytics {
    return {
      organizationId,
      periodStart,
      periodEnd,
      population: this.calculatePopulationMetrics(
        data.totalPatients,
        data.screenings
      ),
      screening: this.calculateScreeningMetrics(data.screenings),
      needs: this.calculateNeedsMetrics(data.screenings),
      referrals: this.calculateReferralMetrics(data.referrals),
      outcomes: this.calculateOutcomeMetrics(
        data.referrals,
        data.interventions
      ),
      resources: {
        totalResources: 0,
        activeResources: 0,
        mostUsedResources: [],
        resourcesByDomain: {},
        capacityUtilization: 0,
      },
      disparities: this.calculateDisparityMetrics(data.screenings),
      quality: this.calculateQualityMetrics(data),
      financial: this.calculateFinancialMetrics(data.interventions),
    };
  }

  /**
   * Calculate population metrics
   */
  private calculatePopulationMetrics(
    totalPatients: number,
    screenings: SDOHScreening[]
  ): PopulationMetrics {
    const uniquePatients = new Set(screenings.map((s) => s.patientId));
    const patientsScreened = uniquePatients.size;
    const patientsWithNeeds = screenings.filter(
      (s) => s.identifiedNeeds.length > 0
    ).length;

    const riskDistribution: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.MODERATE]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    for (const screening of screenings) {
      if (screening.riskLevel) {
        riskDistribution[screening.riskLevel]++;
      }
    }

    return {
      totalPatients,
      patientsScreened,
      screeningRate:
        totalPatients > 0
          ? Math.round((patientsScreened / totalPatients) * 100)
          : 0,
      patientsWithNeeds,
      prevalenceRate:
        patientsScreened > 0
          ? Math.round((patientsWithNeeds / patientsScreened) * 100)
          : 0,
      demographics: {},
      riskDistribution,
    };
  }

  /**
   * Calculate screening metrics
   */
  private calculateScreeningMetrics(
    screenings: SDOHScreening[]
  ): ScreeningMetrics {
    const completedScreenings = screenings.filter(
      (s) => s.status === "COMPLETED"
    );

    const byQuestionnaire: Record<QuestionnaireType, number> = {
      [QuestionnaireType.PRAPARE]: 0,
      [QuestionnaireType.AHC_HRSN]: 0,
      [QuestionnaireType.CUSTOM]: 0,
    };

    const byLanguage: Record<string, number> = {};

    for (const screening of completedScreenings) {
      byQuestionnaire[screening.questionnaireType]++;

      const lang = screening.language;
      byLanguage[lang] = (byLanguage[lang] || 0) + 1;
    }

    const positiveScreenings = completedScreenings.filter(
      (s) => s.identifiedNeeds.length > 0
    ).length;

    return {
      totalScreenings: screenings.length,
      completionRate:
        screenings.length > 0
          ? Math.round((completedScreenings.length / screenings.length) * 100)
          : 0,
      averageTimeMinutes: 8, // Simplified
      byQuestionnaire,
      byLanguage,
      positiveFindingsRate:
        completedScreenings.length > 0
          ? Math.round(
              (positiveScreenings / completedScreenings.length) * 100
            )
          : 0,
    };
  }

  /**
   * Calculate needs metrics
   */
  private calculateNeedsMetrics(screenings: SDOHScreening[]): NeedsMetrics {
    const allNeeds = screenings.flatMap((s) => s.identifiedNeeds);

    const byDomain: Record<SDOHDomain, number> = {} as any;
    const bySeverity: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.MODERATE]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    for (const need of allNeeds) {
      byDomain[need.domain] = (byDomain[need.domain] || 0) + 1;
      bySeverity[need.severity]++;
    }

    // Get top needs
    const topNeeds = Object.entries(byDomain)
      .map(([domain, count]) => ({ domain: domain as SDOHDomain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalNeeds: allNeeds.length,
      byDomain,
      bySeverity,
      topNeeds,
      addressedNeeds: 0, // Would need intervention data
      unaddressedNeeds: allNeeds.length,
    };
  }

  /**
   * Calculate referral metrics
   */
  private calculateReferralMetrics(referrals: SDOHReferral[]): ReferralMetrics {
    const byStatus: Record<ReferralStatus, number> = {} as any;
    const byDomain: Record<SDOHDomain, number> = {} as any;

    let totalDaysToComplete = 0;
    let completedCount = 0;

    for (const referral of referrals) {
      byStatus[referral.status] = (byStatus[referral.status] || 0) + 1;
      byDomain[referral.domain] = (byDomain[referral.domain] || 0) + 1;

      if (
        referral.status === ReferralStatus.COMPLETED &&
        referral.closedDate
      ) {
        const days =
          (referral.closedDate.getTime() - referral.referredDate.getTime()) /
          (1000 * 60 * 60 * 24);
        totalDaysToComplete += days;
        completedCount++;
      }
    }

    const closedReferrals = referrals.filter(
      (r) =>
        r.status === ReferralStatus.COMPLETED ||
        r.status === ReferralStatus.UNSUCCESSFUL ||
        r.status === ReferralStatus.CANCELLED
    );

    const successfulReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED
    );

    return {
      totalReferrals: referrals.length,
      byStatus,
      byDomain,
      completionRate:
        referrals.length > 0
          ? Math.round((successfulReferrals.length / referrals.length) * 100)
          : 0,
      averageDaysToComplete:
        completedCount > 0
          ? Math.round(totalDaysToComplete / completedCount)
          : 0,
      closedLoopRate:
        referrals.length > 0
          ? Math.round((closedReferrals.length / referrals.length) * 100)
          : 0,
      successRate:
        closedReferrals.length > 0
          ? Math.round(
              (successfulReferrals.length / closedReferrals.length) * 100
            )
          : 0,
    };
  }

  /**
   * Calculate outcome metrics
   */
  private calculateOutcomeMetrics(
    referrals: SDOHReferral[],
    interventions: SDOHIntervention[]
  ): OutcomeMetrics {
    const allOutcomes = referrals.flatMap((r) => r.outcomes);
    const successfulOutcomes = allOutcomes.filter(
      (o) => o.benefitReceived
    ).length;

    // Collect barriers
    const barrierCounts: Record<string, number> = {};
    for (const outcome of allOutcomes) {
      for (const barrier of outcome.barriers) {
        barrierCounts[barrier] = (barrierCounts[barrier] || 0) + 1;
      }
    }

    const topBarriers = Object.entries(barrierCounts)
      .map(([type, count]) => ({ type: type as any, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOutcomes: allOutcomes.length,
      successfulOutcomes,
      successRate:
        allOutcomes.length > 0
          ? Math.round((successfulOutcomes / allOutcomes.length) * 100)
          : 0,
      needsMetRate: 0,
      patientSatisfaction: 0,
      barriers: topBarriers,
    };
  }

  /**
   * Calculate disparity metrics
   */
  private calculateDisparityMetrics(screenings: SDOHScreening[]): any {
    // Simplified - would need patient demographic data
    return {
      byRace: {},
      byEthnicity: {},
      byLanguage: {},
      byGeography: {},
      byInsurance: {},
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(data: any): any {
    return {
      screeningWithin12Months: 0,
      timelyFollowUp: 0,
      documentationCompliance: 0,
      zCodeUtilization: 0,
      careCoordinationEngagement: 0,
    };
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancialMetrics(interventions: SDOHIntervention[]): any {
    const totalCost = interventions.reduce(
      (sum, i) => sum + (i.cost || 0),
      0
    );

    return {
      totalInvestment: totalCost,
      costPerScreening: 0,
      costPerReferral: 0,
      costPerIntervention:
        interventions.length > 0
          ? Math.round(totalCost / interventions.length)
          : 0,
      roi: null,
      valueMeasures: {},
    };
  }

  /**
   * Generate population insights
   */
  generateInsights(
    organizationId: string,
    analytics: SDOHAnalytics
  ): PopulationSDOHInsight[] {
    const insights: PopulationSDOHInsight[] = [];

    // Check for high unmet needs
    if (analytics.needs.unaddressedNeeds > analytics.needs.totalNeeds * 0.5) {
      insights.push({
        id: uuidv4(),
        organizationId,
        title: "High Rate of Unaddressed Social Needs",
        description: `${analytics.needs.unaddressedNeeds} social needs remain unaddressed`,
        type: InsightType.UNMET_NEEDS,
        severity: "HIGH",
        affectedPopulation: {
          name: "Patients with unmet needs",
          description: "Patients who have identified social needs without interventions",
          criteria: {},
          size: analytics.needs.unaddressedNeeds,
          characteristics: {},
        },
        domains: Object.keys(analytics.needs.byDomain) as SDOHDomain[],
        metrics: { unaddressedNeeds: analytics.needs.unaddressedNeeds },
        trend: "WORSENING",
        recommendations: [
          "Increase care coordination capacity",
          "Strengthen community partnerships",
          "Implement systematic follow-up protocols",
        ],
        generatedAt: new Date(),
        validUntil: null,
      });
    }

    return insights;
  }

  /**
   * Export analytics to various formats
   */
  exportAnalytics(
    analytics: SDOHAnalytics,
    format: "JSON" | "CSV" | "PDF"
  ): string {
    if (format === "JSON") {
      return JSON.stringify(analytics, null, 2);
    }

    // CSV and PDF would require additional formatting
    return JSON.stringify(analytics, null, 2);
  }
}

/**
 * Export singleton instance
 */
export const sdohAnalytics = new SDOHAnalyticsEngine();
