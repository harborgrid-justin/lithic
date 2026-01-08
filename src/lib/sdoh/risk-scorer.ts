/**
 * SDOH Risk Scoring Algorithm
 *
 * Advanced risk scoring engine that analyzes SDOH screening results,
 * calculates composite risk scores, and stratifies patients by risk level.
 */

import type {
  SDOHScreening,
  RiskLevel,
  SDOHDomain,
  IdentifiedNeed,
  ScreeningResponse,
} from "@/types/sdoh";

// ============================================================================
// Risk Scoring Configuration
// ============================================================================

const DOMAIN_WEIGHTS: Record<SDOHDomain, number> = {
  [SDOHDomain.HOUSING_INSTABILITY]: 1.5,
  [SDOHDomain.FOOD_INSECURITY]: 1.4,
  [SDOHDomain.TRANSPORTATION]: 1.2,
  [SDOHDomain.UTILITY_NEEDS]: 1.3,
  [SDOHDomain.INTERPERSONAL_SAFETY]: 1.6,
  [SDOHDomain.EMPLOYMENT]: 1.1,
  [SDOHDomain.EDUCATION]: 1.0,
  [SDOHDomain.FINANCIAL_STRAIN]: 1.3,
  [SDOHDomain.SOCIAL_ISOLATION]: 1.2,
  [SDOHDomain.HEALTHCARE_ACCESS]: 1.4,
  [SDOHDomain.LEGAL_ISSUES]: 1.1,
  [SDOHDomain.CHILDCARE]: 1.2,
};

const RISK_THRESHOLDS = {
  CRITICAL: 70,
  HIGH: 50,
  MODERATE: 30,
  LOW: 10,
  NONE: 0,
};

// ============================================================================
// Risk Scorer Class
// ============================================================================

export class RiskScorer {
  /**
   * Calculate comprehensive risk score from screening
   */
  calculateCompositeScore(screening: SDOHScreening): number {
    const domainScores = this.calculateDomainScores(screening.responses);
    const needsSeverityScore = this.calculateNeedsSeverityScore(
      screening.identifiedNeeds
    );
    const riskIndicatorCount = this.countRiskIndicators(screening.responses);

    // Weighted composite score
    const compositeScore =
      domainScores * 0.5 + needsSeverityScore * 0.3 + riskIndicatorCount * 0.2;

    return Math.min(100, Math.round(compositeScore));
  }

  /**
   * Determine risk level from score
   */
  determineRiskLevel(score: number): RiskLevel {
    if (score >= RISK_THRESHOLDS.CRITICAL) return RiskLevel.CRITICAL;
    if (score >= RISK_THRESHOLDS.HIGH) return RiskLevel.HIGH;
    if (score >= RISK_THRESHOLDS.MODERATE) return RiskLevel.MODERATE;
    if (score >= RISK_THRESHOLDS.LOW) return RiskLevel.LOW;
    return RiskLevel.NONE;
  }

  /**
   * Calculate domain-specific risk scores
   */
  calculateDomainScores(responses: ScreeningResponse[]): number {
    const domainMap = new Map<SDOHDomain, number[]>();

    // Group responses by domain
    for (const response of responses) {
      if (response.riskIndicator) {
        const existing = domainMap.get(response.domain) || [];
        existing.push(response.weight);
        domainMap.set(response.domain, existing);
      }
    }

    // Calculate weighted domain scores
    let totalScore = 0;
    let domainCount = 0;

    for (const [domain, weights] of domainMap.entries()) {
      const domainScore = weights.reduce((sum, w) => sum + w, 0);
      const domainWeight = DOMAIN_WEIGHTS[domain] || 1.0;
      totalScore += domainScore * domainWeight;
      domainCount++;
    }

    return domainCount > 0 ? totalScore / domainCount : 0;
  }

  /**
   * Calculate score based on identified needs severity
   */
  private calculateNeedsSeverityScore(needs: IdentifiedNeed[]): number {
    if (needs.length === 0) return 0;

    const severityScores: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 20,
      [RiskLevel.MODERATE]: 50,
      [RiskLevel.HIGH]: 75,
      [RiskLevel.CRITICAL]: 100,
    };

    const totalSeverity = needs.reduce(
      (sum, need) => sum + (severityScores[need.severity] || 0),
      0
    );

    return totalSeverity / needs.length;
  }

  /**
   * Count total risk indicators
   */
  private countRiskIndicators(responses: ScreeningResponse[]): number {
    const riskCount = responses.filter((r) => r.riskIndicator).length;
    const totalResponses = responses.length;

    return totalResponses > 0 ? (riskCount / totalResponses) * 100 : 0;
  }

  /**
   * Get domain-specific risk breakdown
   */
  getDomainRiskBreakdown(screening: SDOHScreening): Map<SDOHDomain, RiskLevel> {
    const domainRisks = new Map<SDOHDomain, RiskLevel>();
    const domainScores = new Map<SDOHDomain, number[]>();

    // Collect scores by domain
    for (const response of screening.responses) {
      if (response.riskIndicator) {
        const existing = domainScores.get(response.domain) || [];
        existing.push(response.weight);
        domainScores.set(response.domain, existing);
      }
    }

    // Calculate risk level for each domain
    for (const [domain, weights] of domainScores.entries()) {
      const avgWeight =
        weights.reduce((sum, w) => sum + w, 0) / weights.length;
      const score = (avgWeight / 10) * 100; // Normalize to 0-100
      domainRisks.set(domain, this.determineRiskLevel(score));
    }

    return domainRisks;
  }

  /**
   * Calculate risk trajectory (comparing multiple screenings)
   */
  calculateRiskTrajectory(screenings: SDOHScreening[]): RiskTrajectory {
    if (screenings.length < 2) {
      return {
        trend: "INSUFFICIENT_DATA",
        currentScore: screenings[0]?.riskScore || 0,
        previousScore: null,
        changePercent: 0,
        improvingDomains: [],
        worseningDomains: [],
      };
    }

    const sortedScreenings = [...screenings].sort(
      (a, b) => b.completedAt!.getTime() - a.completedAt!.getTime()
    );

    const current = sortedScreenings[0]!;
    const previous = sortedScreenings[1]!;

    const currentScore = current.riskScore || 0;
    const previousScore = previous.riskScore || 0;
    const changePercent =
      previousScore > 0
        ? ((currentScore - previousScore) / previousScore) * 100
        : 0;

    const trend = this.determineTrend(changePercent);
    const domainComparison = this.compareDomainRisks(current, previous);

    return {
      trend,
      currentScore,
      previousScore,
      changePercent: Math.round(changePercent * 10) / 10,
      improvingDomains: domainComparison.improving,
      worseningDomains: domainComparison.worsening,
    };
  }

  /**
   * Predict future risk based on historical data
   */
  predictFutureRisk(screenings: SDOHScreening[]): RiskPrediction {
    if (screenings.length < 3) {
      return {
        predictedRiskLevel: RiskLevel.NONE,
        confidence: 0,
        timeframe: "INSUFFICIENT_DATA",
        recommendedActions: [],
      };
    }

    const trajectory = this.calculateRiskTrajectory(screenings);
    const volatility = this.calculateRiskVolatility(screenings);

    let predictedLevel = RiskLevel.NONE;
    let confidence = 0;

    if (trajectory.trend === "WORSENING") {
      predictedLevel = this.escalateRiskLevel(
        this.determineRiskLevel(trajectory.currentScore)
      );
      confidence = Math.min(90, 60 + volatility.stability * 30);
    } else if (trajectory.trend === "IMPROVING") {
      predictedLevel = this.deescalateRiskLevel(
        this.determineRiskLevel(trajectory.currentScore)
      );
      confidence = Math.min(85, 55 + volatility.stability * 30);
    } else {
      predictedLevel = this.determineRiskLevel(trajectory.currentScore);
      confidence = Math.min(80, 70 + volatility.stability * 10);
    }

    return {
      predictedRiskLevel: predictedLevel,
      confidence: Math.round(confidence),
      timeframe: "3_MONTHS",
      recommendedActions: this.generateRecommendedActions(
        predictedLevel,
        trajectory
      ),
    };
  }

  /**
   * Calculate population risk stratification
   */
  stratifyPopulation(screenings: SDOHScreening[]): PopulationStratification {
    const stratification: PopulationStratification = {
      total: screenings.length,
      byRiskLevel: {
        [RiskLevel.NONE]: 0,
        [RiskLevel.LOW]: 0,
        [RiskLevel.MODERATE]: 0,
        [RiskLevel.HIGH]: 0,
        [RiskLevel.CRITICAL]: 0,
      },
      highRiskPatients: [],
      domainPrevalence: new Map(),
    };

    for (const screening of screenings) {
      if (screening.riskLevel) {
        stratification.byRiskLevel[screening.riskLevel]++;

        if (
          screening.riskLevel === RiskLevel.HIGH ||
          screening.riskLevel === RiskLevel.CRITICAL
        ) {
          stratification.highRiskPatients.push({
            patientId: screening.patientId,
            riskScore: screening.riskScore || 0,
            riskLevel: screening.riskLevel,
            needsCount: screening.identifiedNeeds.length,
          });
        }
      }

      // Track domain prevalence
      for (const need of screening.identifiedNeeds) {
        const current = stratification.domainPrevalence.get(need.domain) || 0;
        stratification.domainPrevalence.set(need.domain, current + 1);
      }
    }

    return stratification;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private determineTrend(changePercent: number): RiskTrend {
    if (changePercent > 10) return "WORSENING";
    if (changePercent < -10) return "IMPROVING";
    return "STABLE";
  }

  private compareDomainRisks(
    current: SDOHScreening,
    previous: SDOHScreening
  ): { improving: SDOHDomain[]; worsening: SDOHDomain[] } {
    const currentDomains = this.getDomainRiskBreakdown(current);
    const previousDomains = this.getDomainRiskBreakdown(previous);

    const improving: SDOHDomain[] = [];
    const worsening: SDOHDomain[] = [];

    const allDomains = new Set([
      ...currentDomains.keys(),
      ...previousDomains.keys(),
    ]);

    for (const domain of allDomains) {
      const currentRisk = currentDomains.get(domain) || RiskLevel.NONE;
      const previousRisk = previousDomains.get(domain) || RiskLevel.NONE;

      const currentScore = this.riskLevelToScore(currentRisk);
      const previousScore = this.riskLevelToScore(previousRisk);

      if (currentScore < previousScore) {
        improving.push(domain);
      } else if (currentScore > previousScore) {
        worsening.push(domain);
      }
    }

    return { improving, worsening };
  }

  private riskLevelToScore(level: RiskLevel): number {
    const scores: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.LOW]: 1,
      [RiskLevel.MODERATE]: 2,
      [RiskLevel.HIGH]: 3,
      [RiskLevel.CRITICAL]: 4,
    };
    return scores[level];
  }

  private escalateRiskLevel(current: RiskLevel): RiskLevel {
    const escalation: Record<RiskLevel, RiskLevel> = {
      [RiskLevel.NONE]: RiskLevel.LOW,
      [RiskLevel.LOW]: RiskLevel.MODERATE,
      [RiskLevel.MODERATE]: RiskLevel.HIGH,
      [RiskLevel.HIGH]: RiskLevel.CRITICAL,
      [RiskLevel.CRITICAL]: RiskLevel.CRITICAL,
    };
    return escalation[current];
  }

  private deescalateRiskLevel(current: RiskLevel): RiskLevel {
    const deescalation: Record<RiskLevel, RiskLevel> = {
      [RiskLevel.NONE]: RiskLevel.NONE,
      [RiskLevel.LOW]: RiskLevel.NONE,
      [RiskLevel.MODERATE]: RiskLevel.LOW,
      [RiskLevel.HIGH]: RiskLevel.MODERATE,
      [RiskLevel.CRITICAL]: RiskLevel.HIGH,
    };
    return deescalation[current];
  }

  private calculateRiskVolatility(
    screenings: SDOHScreening[]
  ): { volatility: number; stability: number } {
    const scores = screenings
      .filter((s) => s.riskScore !== null)
      .map((s) => s.riskScore!);

    if (scores.length < 2) {
      return { volatility: 0, stability: 1 };
    }

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    const volatility = stdDev / mean;
    const stability = Math.max(0, 1 - volatility);

    return { volatility, stability };
  }

  private generateRecommendedActions(
    predictedLevel: RiskLevel,
    trajectory: RiskTrajectory
  ): string[] {
    const actions: string[] = [];

    if (predictedLevel === RiskLevel.CRITICAL || predictedLevel === RiskLevel.HIGH) {
      actions.push("Immediate care coordination intervention required");
      actions.push("Schedule follow-up within 7 days");
      actions.push("Connect with community resources immediately");
    }

    if (trajectory.worseningDomains.length > 0) {
      actions.push(
        `Focus on worsening domains: ${trajectory.worseningDomains.join(", ")}`
      );
    }

    if (trajectory.trend === "WORSENING") {
      actions.push("Increase screening frequency to monthly");
      actions.push("Consider case management referral");
    }

    return actions;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface RiskTrajectory {
  trend: RiskTrend;
  currentScore: number;
  previousScore: number | null;
  changePercent: number;
  improvingDomains: SDOHDomain[];
  worseningDomains: SDOHDomain[];
}

type RiskTrend = "IMPROVING" | "STABLE" | "WORSENING" | "INSUFFICIENT_DATA";

interface RiskPrediction {
  predictedRiskLevel: RiskLevel;
  confidence: number; // 0-100
  timeframe: "3_MONTHS" | "6_MONTHS" | "12_MONTHS" | "INSUFFICIENT_DATA";
  recommendedActions: string[];
}

interface PopulationStratification {
  total: number;
  byRiskLevel: Record<RiskLevel, number>;
  highRiskPatients: Array<{
    patientId: string;
    riskScore: number;
    riskLevel: RiskLevel;
    needsCount: number;
  }>;
  domainPrevalence: Map<SDOHDomain, number>;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compare risk between two screenings
 */
export function compareRisk(
  current: SDOHScreening,
  previous: SDOHScreening
): {
  improved: boolean;
  worsened: boolean;
  stable: boolean;
  scoreDelta: number;
} {
  const currentScore = current.riskScore || 0;
  const previousScore = previous.riskScore || 0;
  const delta = currentScore - previousScore;

  return {
    improved: delta < -5,
    worsened: delta > 5,
    stable: Math.abs(delta) <= 5,
    scoreDelta: delta,
  };
}

/**
 * Calculate risk percentile within population
 */
export function calculateRiskPercentile(
  score: number,
  populationScores: number[]
): number {
  const sorted = [...populationScores].sort((a, b) => a - b);
  const lowerCount = sorted.filter((s) => s < score).length;
  return Math.round((lowerCount / sorted.length) * 100);
}

/**
 * Get risk color coding for UI
 */
export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    [RiskLevel.NONE]: "#10b981", // green
    [RiskLevel.LOW]: "#84cc16", // lime
    [RiskLevel.MODERATE]: "#f59e0b", // amber
    [RiskLevel.HIGH]: "#f97316", // orange
    [RiskLevel.CRITICAL]: "#ef4444", // red
  };
  return colors[level];
}

/**
 * Export singleton instance
 */
export const riskScorer = new RiskScorer();
