/**
 * SDOH Outcomes Analytics and Reporting
 * Population health insights and ROI calculation
 * SDOH & Care Coordination Specialist - Agent 7
 */

import type {
  SDOHOutcome,
  OutcomeStatus,
  ImprovementLevel,
} from "./tracker";

// ============================================================================
// Analytics Types
// ============================================================================

export interface SDOHAnalytics {
  organizationId: string;
  timeRange: TimeRange;
  generatedAt: Date;

  // Overall Metrics
  totalPatientsScreened: number;
  totalNeedsIdentified: number;
  totalReferralsMade: number;
  totalOutcomesTracked: number;

  // Needs Distribution
  needsByCategory: Record<string, number>;
  needsBySeverity: Record<string, number>;
  mostCommonNeeds: NeedStatistic[];

  // Resolution Metrics
  resolutionRate: number;
  avgTimeToResolution: number; // in days
  resolutionByCategory: Record<string, ResolutionMetric>;

  // Improvement Metrics
  overallImprovementRate: number;
  improvementByCategory: Record<string, ImprovementMetric>;

  // Health Impact
  healthcareUtilizationImpact?: UtilizationImpact;
  clinicalImpact?: ClinicalImpactMetrics;

  // Financial Impact
  costAnalysis?: CostAnalysis;
  roi?: ROICalculation;

  // Demographics
  demographicBreakdown?: DemographicAnalytics;

  // Trends
  trends?: TrendAnalytics;

  // Quality Metrics
  patientSatisfactionAvg?: number;
  followUpCompletionRate?: number;
  closedLoopRate?: number;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "Q1 2024", "FY 2024"
}

export interface NeedStatistic {
  category: string;
  count: number;
  percentage: number;
  avgSeverity: number;
  resolutionRate: number;
}

export interface ResolutionMetric {
  totalCases: number;
  resolved: number;
  partiallyResolved: number;
  unresolved: number;
  rate: number; // percentage
  avgDaysToResolution: number;
}

export interface ImprovementMetric {
  totalMeasurements: number;
  significantlyBetter: number;
  somewhatBetter: number;
  noChange: number;
  worse: number;
  improvementRate: number; // percentage showing any improvement
}

export interface UtilizationImpact {
  erVisitsReduced: number;
  erVisitsReductionPercent: number;
  hospitalizationsReduced: number;
  hospitalizationsReductionPercent: number;
  primaryCareVisitsIncreased: number;
  primaryCareIncreasePercent: number;
  estimatedCostSavings: number;
}

export interface ClinicalImpactMetrics {
  patientsWithImprovedOutcomes: number;
  improvementRate: number;
  commonImprovements: string[];
  medicationAdherenceImprovement: number;
  preventiveCareCompletionRate: number;
}

export interface CostAnalysis {
  totalProgramCost: number;
  costPerPatient: number;
  costPerNeedAddressed: number;
  costPerResolution: number;
  resourceCostBreakdown: Record<string, number>;
}

export interface ROICalculation {
  totalInvestment: number;
  totalReturn: number;
  netReturn: number;
  roiPercent: number;
  breakEvenPoint?: number; // months
  returnSources: ReturnSource[];
}

export interface ReturnSource {
  category: string;
  amount: number;
  description: string;
}

export interface DemographicAnalytics {
  ageDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  raceEthnicityDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  insuranceDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

export interface TrendAnalytics {
  needsOverTime: TimeSeries[];
  resolutionRateOverTime: TimeSeries[];
  improvementOverTime: TimeSeries[];
  utilizationOverTime: TimeSeries[];
}

export interface TimeSeries {
  period: string;
  value: number;
  change?: number;
  changePercent?: number;
}

// ============================================================================
// Analytics Engine
// ============================================================================

export class SDOHAnalyticsEngine {
  /**
   * Generate comprehensive analytics report
   */
  generateAnalytics(
    outcomes: SDOHOutcome[],
    organizationId: string,
    timeRange: TimeRange
  ): SDOHAnalytics {
    // Filter outcomes by time range
    const filteredOutcomes = outcomes.filter(
      (o) =>
        o.identifiedDate >= timeRange.startDate &&
        o.identifiedDate <= timeRange.endDate
    );

    return {
      organizationId,
      timeRange,
      generatedAt: new Date(),
      totalPatientsScreened: this.countUniquePatients(filteredOutcomes),
      totalNeedsIdentified: filteredOutcomes.length,
      totalReferralsMade: this.countTotalReferrals(filteredOutcomes),
      totalOutcomesTracked: filteredOutcomes.filter(
        (o) => o.followUpMeasurements.length > 0
      ).length,
      needsByCategory: this.analyzeNeedsByCategory(filteredOutcomes),
      needsBySeverity: this.analyzeNeedsBySeverity(filteredOutcomes),
      mostCommonNeeds: this.analyzeMostCommonNeeds(filteredOutcomes),
      resolutionRate: this.calculateResolutionRate(filteredOutcomes),
      avgTimeToResolution: this.calculateAvgTimeToResolution(filteredOutcomes),
      resolutionByCategory: this.analyzeResolutionByCategory(filteredOutcomes),
      overallImprovementRate: this.calculateImprovementRate(filteredOutcomes),
      improvementByCategory: this.analyzeImprovementByCategory(filteredOutcomes),
      healthcareUtilizationImpact: this.analyzeUtilizationImpact(filteredOutcomes),
      clinicalImpact: this.analyzeClinicalImpact(filteredOutcomes),
      costAnalysis: this.analyzeCosts(filteredOutcomes),
      roi: this.calculateROI(filteredOutcomes),
      patientSatisfactionAvg: this.calculateAvgSatisfaction(filteredOutcomes),
      followUpCompletionRate: this.calculateFollowUpRate(filteredOutcomes),
      closedLoopRate: this.calculateClosedLoopRate(filteredOutcomes),
    };
  }

  /**
   * Generate population insights
   */
  generatePopulationInsights(outcomes: SDOHOutcome[]): PopulationInsights {
    const uniquePatients = this.countUniquePatients(outcomes);

    return {
      totalPopulation: uniquePatients,
      patientsWithMultipleNeeds: this.countPatientsWithMultipleNeeds(outcomes),
      avgNeedsPerPatient: outcomes.length / uniquePatients,
      highRiskPatients: this.identifyHighRiskPatients(outcomes),
      unresolvedNeedsByPopulation: this.analyzeUnresolvedNeeds(outcomes),
      barrierAnalysis: this.analyzeBarriers(outcomes),
      successFactors: this.identifySuccessFactors(outcomes),
    };
  }

  /**
   * Calculate screening effectiveness
   */
  calculateScreeningEffectiveness(
    screeningsCompleted: number,
    needsIdentified: number,
    referralsCompleted: number
  ): ScreeningEffectiveness {
    return {
      screeningRate: screeningsCompleted,
      positiveScreeningRate: (needsIdentified / screeningsCompleted) * 100,
      referralConversionRate: (referralsCompleted / needsIdentified) * 100,
      avgNeedsPerPositiveScreen: needsIdentified / screeningsCompleted,
    };
  }

  /**
   * Generate health equity analysis
   */
  generateEquityAnalysis(
    outcomes: SDOHOutcome[],
    demographics: any[]
  ): EquityAnalysis {
    return {
      disparitiesByRace: this.analyzeOutcomesByDemographic(
        outcomes,
        demographics,
        "race"
      ),
      disparitiesByIncome: this.analyzeOutcomesByDemographic(
        outcomes,
        demographics,
        "income"
      ),
      disparitiesByLanguage: this.analyzeOutcomesByDemographic(
        outcomes,
        demographics,
        "language"
      ),
      disparitiesByGeography: this.analyzeOutcomesByDemographic(
        outcomes,
        demographics,
        "geography"
      ),
      recommendations: this.generateEquityRecommendations(outcomes),
    };
  }

  // ============================================================================
  // Private Analysis Methods
  // ============================================================================

  private countUniquePatients(outcomes: SDOHOutcome[]): number {
    const uniquePatients = new Set(outcomes.map((o) => o.patientId));
    return uniquePatients.size;
  }

  private countTotalReferrals(outcomes: SDOHOutcome[]): number {
    return outcomes.reduce((sum, o) => sum + o.referralIds.length, 0);
  }

  private analyzeNeedsByCategory(
    outcomes: SDOHOutcome[]
  ): Record<string, number> {
    const categories: Record<string, number> = {};
    outcomes.forEach((o) => {
      categories[o.needCategory] = (categories[o.needCategory] || 0) + 1;
    });
    return categories;
  }

  private analyzeNeedsBySeverity(
    outcomes: SDOHOutcome[]
  ): Record<string, number> {
    const severity: Record<string, number> = {};
    outcomes.forEach((o) => {
      severity[o.severity] = (severity[o.severity] || 0) + 1;
    });
    return severity;
  }

  private analyzeMostCommonNeeds(outcomes: SDOHOutcome[]): NeedStatistic[] {
    const categoryStats = new Map<string, NeedStatistic>();

    outcomes.forEach((o) => {
      if (!categoryStats.has(o.needCategory)) {
        categoryStats.set(o.needCategory, {
          category: o.needCategory,
          count: 0,
          percentage: 0,
          avgSeverity: 0,
          resolutionRate: 0,
        });
      }

      const stat = categoryStats.get(o.needCategory)!;
      stat.count++;
    });

    // Calculate percentages and resolution rates
    const total = outcomes.length;
    categoryStats.forEach((stat, category) => {
      stat.percentage = (stat.count / total) * 100;
      const categoryOutcomes = outcomes.filter((o) => o.needCategory === category);
      stat.resolutionRate = this.calculateResolutionRate(categoryOutcomes);
    });

    return Array.from(categoryStats.values()).sort((a, b) => b.count - a.count);
  }

  private calculateResolutionRate(outcomes: SDOHOutcome[]): number {
    if (outcomes.length === 0) return 0;
    const resolved = outcomes.filter(
      (o) =>
        o.status === OutcomeStatus.FULLY_RESOLVED ||
        o.status === OutcomeStatus.PARTIALLY_RESOLVED
    ).length;
    return (resolved / outcomes.length) * 100;
  }

  private calculateAvgTimeToResolution(outcomes: SDOHOutcome[]): number {
    const resolvedOutcomes = outcomes.filter(
      (o) => o.status === OutcomeStatus.FULLY_RESOLVED && o.resolutionDate
    );

    if (resolvedOutcomes.length === 0) return 0;

    const totalDays = resolvedOutcomes.reduce((sum, o) => {
      const days =
        (o.resolutionDate!.getTime() - o.identifiedDate.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / resolvedOutcomes.length;
  }

  private analyzeResolutionByCategory(
    outcomes: SDOHOutcome[]
  ): Record<string, ResolutionMetric> {
    const categories = new Set(outcomes.map((o) => o.needCategory));
    const metrics: Record<string, ResolutionMetric> = {};

    categories.forEach((category) => {
      const categoryOutcomes = outcomes.filter((o) => o.needCategory === category);
      const resolved = categoryOutcomes.filter(
        (o) => o.status === OutcomeStatus.FULLY_RESOLVED
      ).length;
      const partiallyResolved = categoryOutcomes.filter(
        (o) => o.status === OutcomeStatus.PARTIALLY_RESOLVED
      ).length;
      const unresolved = categoryOutcomes.length - resolved - partiallyResolved;

      metrics[category] = {
        totalCases: categoryOutcomes.length,
        resolved,
        partiallyResolved,
        unresolved,
        rate: (resolved / categoryOutcomes.length) * 100,
        avgDaysToResolution: this.calculateAvgTimeToResolution(categoryOutcomes),
      };
    });

    return metrics;
  }

  private calculateImprovementRate(outcomes: SDOHOutcome[]): number {
    const outcomesWithMeasurements = outcomes.filter(
      (o) => o.followUpMeasurements.length > 0
    );

    if (outcomesWithMeasurements.length === 0) return 0;

    const improved = outcomesWithMeasurements.filter((o) => {
      const lastMeasurement =
        o.followUpMeasurements[o.followUpMeasurements.length - 1];
      return (
        lastMeasurement.overallImprovement === ImprovementLevel.SOMEWHAT_BETTER ||
        lastMeasurement.overallImprovement ===
          ImprovementLevel.SIGNIFICANTLY_BETTER
      );
    }).length;

    return (improved / outcomesWithMeasurements.length) * 100;
  }

  private analyzeImprovementByCategory(
    outcomes: SDOHOutcome[]
  ): Record<string, ImprovementMetric> {
    const categories = new Set(outcomes.map((o) => o.needCategory));
    const metrics: Record<string, ImprovementMetric> = {};

    categories.forEach((category) => {
      const categoryOutcomes = outcomes.filter(
        (o) => o.needCategory === category && o.followUpMeasurements.length > 0
      );

      const measurements = categoryOutcomes.flatMap((o) => o.followUpMeasurements);

      const significantlyBetter = measurements.filter(
        (m) => m.overallImprovement === ImprovementLevel.SIGNIFICANTLY_BETTER
      ).length;
      const somewhatBetter = measurements.filter(
        (m) => m.overallImprovement === ImprovementLevel.SOMEWHAT_BETTER
      ).length;
      const noChange = measurements.filter(
        (m) => m.overallImprovement === ImprovementLevel.NO_CHANGE
      ).length;
      const worse = measurements.filter(
        (m) =>
          m.overallImprovement === ImprovementLevel.SOMEWHAT_WORSE ||
          m.overallImprovement === ImprovementLevel.SIGNIFICANTLY_WORSE
      ).length;

      metrics[category] = {
        totalMeasurements: measurements.length,
        significantlyBetter,
        somewhatBetter,
        noChange,
        worse,
        improvementRate:
          ((significantlyBetter + somewhatBetter) / measurements.length) * 100,
      };
    });

    return metrics;
  }

  private analyzeUtilizationImpact(
    outcomes: SDOHOutcome[]
  ): UtilizationImpact | undefined {
    const outcomesWithHealthImpact = outcomes.filter(
      (o) => o.healthImpact?.healthcareUtilization
    );

    if (outcomesWithHealthImpact.length === 0) return undefined;

    let totalERReduction = 0;
    let totalHospReduction = 0;
    let totalPCPIncrease = 0;
    let totalCostSavings = 0;

    outcomesWithHealthImpact.forEach((o) => {
      const util = o.healthImpact!.healthcareUtilization!;
      totalERReduction += util.erVisitsBefore - util.erVisitsAfter;
      totalHospReduction +=
        util.hospitalizationsBefore - util.hospitalizationsAfter;
      totalPCPIncrease +=
        util.primaryCareVisitsAfter - util.primaryCareVisitsBefore;
    });

    // Estimated cost savings ($1,000 per ER visit, $10,000 per hospitalization)
    totalCostSavings = totalERReduction * 1000 + totalHospReduction * 10000;

    return {
      erVisitsReduced: totalERReduction,
      erVisitsReductionPercent: 0, // Calculate based on baseline
      hospitalizationsReduced: totalHospReduction,
      hospitalizationsReductionPercent: 0,
      primaryCareVisitsIncreased: totalPCPIncrease,
      primaryCareIncreasePercent: 0,
      estimatedCostSavings: totalCostSavings,
    };
  }

  private analyzeClinicalImpact(
    outcomes: SDOHOutcome[]
  ): ClinicalImpactMetrics | undefined {
    const outcomesWithImpact = outcomes.filter((o) => o.healthImpact);
    if (outcomesWithImpact.length === 0) return undefined;

    const patientsWithImprovement = outcomesWithImpact.filter((o) => {
      return (
        o.healthImpact?.clinicalOutcomes?.some((c) => c.improved) ||
        o.healthImpact?.medicationAdherence?.improved
      );
    }).length;

    return {
      patientsWithImprovedOutcomes: patientsWithImprovement,
      improvementRate: (patientsWithImprovement / outcomesWithImpact.length) * 100,
      commonImprovements: [],
      medicationAdherenceImprovement: 0,
      preventiveCareCompletionRate: 0,
    };
  }

  private analyzeCosts(outcomes: SDOHOutcome[]): CostAnalysis | undefined {
    // Placeholder - implement based on actual cost data
    return undefined;
  }

  private calculateROI(outcomes: SDOHOutcome[]): ROICalculation | undefined {
    // Placeholder - implement based on cost and benefit data
    return undefined;
  }

  private calculateAvgSatisfaction(outcomes: SDOHOutcome[]): number {
    const withSatisfaction = outcomes.filter((o) => o.patientSatisfaction);
    if (withSatisfaction.length === 0) return 0;

    const total = withSatisfaction.reduce(
      (sum, o) => sum + o.patientSatisfaction!,
      0
    );
    return total / withSatisfaction.length;
  }

  private calculateFollowUpRate(outcomes: SDOHOutcome[]): number {
    const withFollowUp = outcomes.filter((o) => o.followUpRequired);
    if (withFollowUp.length === 0) return 0;

    const completed = withFollowUp.filter(
      (o) => o.followUpMeasurements.length > 0
    ).length;
    return (completed / withFollowUp.length) * 100;
  }

  private calculateClosedLoopRate(outcomes: SDOHOutcome[]): number {
    const withReferrals = outcomes.filter((o) => o.referralIds.length > 0);
    if (withReferrals.length === 0) return 0;

    const closedLoop = withReferrals.filter(
      (o) =>
        o.status === OutcomeStatus.FULLY_RESOLVED ||
        o.status === OutcomeStatus.PARTIALLY_RESOLVED
    ).length;

    return (closedLoop / withReferrals.length) * 100;
  }

  private countPatientsWithMultipleNeeds(outcomes: SDOHOutcome[]): number {
    const patientNeedCounts = new Map<string, number>();
    outcomes.forEach((o) => {
      patientNeedCounts.set(o.patientId, (patientNeedCounts.get(o.patientId) || 0) + 1);
    });

    return Array.from(patientNeedCounts.values()).filter((count) => count > 1)
      .length;
  }

  private identifyHighRiskPatients(outcomes: SDOHOutcome[]): number {
    const patientRisk = new Map<string, number>();
    outcomes.forEach((o) => {
      const severityScore =
        o.severity === "critical" ? 4 : o.severity === "high" ? 3 : o.severity === "moderate" ? 2 : 1;
      const currentRisk = patientRisk.get(o.patientId) || 0;
      patientRisk.set(o.patientId, currentRisk + severityScore);
    });

    return Array.from(patientRisk.values()).filter((risk) => risk >= 6).length;
  }

  private analyzeUnresolvedNeeds(
    outcomes: SDOHOutcome[]
  ): Record<string, number> {
    const unresolved = outcomes.filter(
      (o) => o.status === OutcomeStatus.UNRESOLVED || o.status === OutcomeStatus.IN_PROGRESS
    );

    return this.analyzeNeedsByCategory(unresolved);
  }

  private analyzeBarriers(outcomes: SDOHOutcome[]): Record<string, number> {
    const barrierCounts: Record<string, number> = {};
    outcomes.forEach((o) => {
      o.barriers.forEach((b) => {
        barrierCounts[b.type] = (barrierCounts[b.type] || 0) + 1;
      });
    });
    return barrierCounts;
  }

  private identifySuccessFactors(outcomes: SDOHOutcome[]): string[] {
    // Analyze facilitators from successful outcomes
    const successful = outcomes.filter(
      (o) => o.status === OutcomeStatus.FULLY_RESOLVED
    );
    const factors = new Set<string>();
    successful.forEach((o) => {
      o.facilitators.forEach((f) => factors.add(f.type));
    });
    return Array.from(factors);
  }

  private analyzeOutcomesByDemographic(
    outcomes: SDOHOutcome[],
    demographics: any[],
    field: string
  ): Record<string, any> {
    // Placeholder - implement based on demographic data structure
    return {};
  }

  private generateEquityRecommendations(outcomes: SDOHOutcome[]): string[] {
    // Placeholder - generate recommendations based on disparity analysis
    return [];
  }
}

// ============================================================================
// Additional Analytics Types
// ============================================================================

export interface PopulationInsights {
  totalPopulation: number;
  patientsWithMultipleNeeds: number;
  avgNeedsPerPatient: number;
  highRiskPatients: number;
  unresolvedNeedsByPopulation: Record<string, number>;
  barrierAnalysis: Record<string, number>;
  successFactors: string[];
}

export interface ScreeningEffectiveness {
  screeningRate: number;
  positiveScreeningRate: number;
  referralConversionRate: number;
  avgNeedsPerPositiveScreen: number;
}

export interface EquityAnalysis {
  disparitiesByRace: Record<string, any>;
  disparitiesByIncome: Record<string, any>;
  disparitiesByLanguage: Record<string, any>;
  disparitiesByGeography: Record<string, any>;
  recommendations: string[];
}
