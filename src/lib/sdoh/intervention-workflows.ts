/**
 * SDOH Intervention Workflow Engine
 *
 * Manages intervention planning, execution, tracking, and outcomes
 * for addressing social determinants of health needs.
 */

import type {
  SDOHIntervention,
  InterventionActivity,
  InterventionOutcome,
} from "@/types/sdoh";
import {
  InterventionType,
  InterventionStatus,
  Priority,
  SDOHDomain,
} from "@/types/sdoh";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Intervention Workflow Manager
// ============================================================================

export class InterventionWorkflowManager {
  /**
   * Create new intervention
   */
  createIntervention(
    data: Partial<SDOHIntervention>
  ): SDOHIntervention {
    const intervention: Partial<SDOHIntervention> = {
      id: uuidv4(),
      ...data,
      status: InterventionStatus.PLANNED,
      activities: [],
      resources: [],
      outcomes: null,
      cost: null,
      fundingSource: null,
      evidenceBased: false,
      evidenceSource: null,
      startDate: new Date(),
      endDate: null,
    };

    return intervention as SDOHIntervention;
  }

  /**
   * Add activity to intervention
   */
  addActivity(
    description: string,
    scheduledDate: Date | null
  ): InterventionActivity {
    return {
      id: uuidv4(),
      description,
      scheduledDate,
      completedDate: null,
      performedBy: null,
      status: "PENDING",
      notes: null,
      duration: null,
    };
  }

  /**
   * Complete activity
   */
  completeActivity(
    activity: InterventionActivity,
    performedBy: string,
    duration: number,
    notes?: string
  ): void {
    activity.status = "COMPLETED";
    activity.completedDate = new Date();
    activity.performedBy = performedBy;
    activity.duration = duration;
    if (notes) activity.notes = notes;
  }

  /**
   * Record intervention outcome
   */
  recordOutcome(
    intervention: SDOHIntervention,
    outcome: Omit<InterventionOutcome, "completedDate">
  ): void {
    intervention.outcomes = {
      ...outcome,
      completedDate: new Date(),
    };

    intervention.status = outcome.success
      ? InterventionStatus.COMPLETED
      : InterventionStatus.UNSUCCESSFUL;
    intervention.endDate = new Date();
  }

  /**
   * Calculate intervention progress
   */
  calculateProgress(intervention: SDOHIntervention): number {
    if (intervention.activities.length === 0) return 0;

    const completedActivities = intervention.activities.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    return Math.round(
      (completedActivities / intervention.activities.length) * 100
    );
  }

  /**
   * Get intervention timeline
   */
  getTimeline(intervention: SDOHIntervention): Timeline {
    const events: TimelineEvent[] = [];

    // Add start event
    events.push({
      date: intervention.startDate,
      type: "START",
      description: `Intervention started: ${intervention.title}`,
    });

    // Add activity events
    for (const activity of intervention.activities) {
      if (activity.completedDate) {
        events.push({
          date: activity.completedDate,
          type: "ACTIVITY",
          description: activity.description,
        });
      }
    }

    // Add outcome event
    if (intervention.outcomes) {
      events.push({
        date: intervention.outcomes.completedDate,
        type: "OUTCOME",
        description: `Outcome: ${intervention.outcomes.success ? "Successful" : "Unsuccessful"}`,
      });
    }

    // Sort by date
    return {
      events: events.sort((a, b) => a.date.getTime() - b.date.getTime()),
      duration: this.calculateDuration(intervention),
    };
  }

  /**
   * Calculate cost-effectiveness
   */
  calculateCostEffectiveness(
    intervention: SDOHIntervention
  ): CostEffectiveness | null {
    if (!intervention.cost || !intervention.outcomes) return null;

    const costPerActivity = intervention.cost / intervention.activities.length;

    return {
      totalCost: intervention.cost,
      costPerActivity,
      success: intervention.outcomes.success,
      needMet: intervention.outcomes.needMet,
      roi: intervention.outcomes.needMet ? 1.5 : 0, // Simplified ROI
    };
  }

  /**
   * Generate recommended interventions
   */
  recommendInterventions(
    domain: SDOHDomain,
    severity: string
  ): InterventionRecommendation[] {
    const recommendations: InterventionRecommendation[] = [];

    // Evidence-based intervention recommendations by domain
    const interventionDatabase = this.getInterventionDatabase();

    const domainInterventions = interventionDatabase.filter(
      (i) => i.domain === domain
    );

    for (const template of domainInterventions) {
      recommendations.push({
        ...template,
        priorityScore: this.calculatePriorityScore(template, severity),
      });
    }

    return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Track intervention metrics
   */
  calculateMetrics(interventions: SDOHIntervention[]): InterventionMetrics {
    const byStatus: Record<InterventionStatus, number> = {
      [InterventionStatus.PLANNED]: 0,
      [InterventionStatus.IN_PROGRESS]: 0,
      [InterventionStatus.COMPLETED]: 0,
      [InterventionStatus.ON_HOLD]: 0,
      [InterventionStatus.CANCELLED]: 0,
      [InterventionStatus.UNSUCCESSFUL]: 0,
    };

    let totalCost = 0;
    let successfulCount = 0;

    for (const intervention of interventions) {
      byStatus[intervention.status]++;

      if (intervention.cost) {
        totalCost += intervention.cost;
      }

      if (
        intervention.status === InterventionStatus.COMPLETED &&
        intervention.outcomes?.success
      ) {
        successfulCount++;
      }
    }

    const completedInterventions = interventions.filter(
      (i) =>
        i.status === InterventionStatus.COMPLETED ||
        i.status === InterventionStatus.UNSUCCESSFUL
    );

    return {
      total: interventions.length,
      byStatus,
      successRate:
        completedInterventions.length > 0
          ? Math.round(
              (successfulCount / completedInterventions.length) * 100
            )
          : 0,
      averageDuration: this.calculateAverageDuration(completedInterventions),
      totalCost,
      averageCost:
        interventions.length > 0
          ? Math.round(totalCost / interventions.length)
          : 0,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateDuration(intervention: SDOHIntervention): number {
    if (!intervention.endDate) {
      return Math.floor(
        (Date.now() - intervention.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    return Math.floor(
      (intervention.endDate.getTime() - intervention.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  private calculateAverageDuration(interventions: SDOHIntervention[]): number {
    if (interventions.length === 0) return 0;

    const totalDuration = interventions.reduce(
      (sum, i) => sum + this.calculateDuration(i),
      0
    );

    return Math.round(totalDuration / interventions.length);
  }

  private calculatePriorityScore(
    template: any,
    severity: string
  ): number {
    let score = template.baseScore || 50;

    if (severity === "CRITICAL") score += 30;
    else if (severity === "HIGH") score += 20;
    else if (severity === "MODERATE") score += 10;

    if (template.evidenceBased) score += 15;

    return Math.min(score, 100);
  }

  private getInterventionDatabase(): InterventionTemplate[] {
    // Simplified intervention database
    return [
      {
        type: InterventionType.REFERRAL,
        domain: SDOHDomain.FOOD_INSECURITY,
        title: "Food Bank Referral",
        description: "Connect patient with local food bank",
        evidenceBased: true,
        baseScore: 80,
      },
      {
        type: InterventionType.CASE_MANAGEMENT,
        domain: SDOHDomain.HOUSING_INSTABILITY,
        title: "Housing Case Management",
        description: "Intensive case management for housing stability",
        evidenceBased: true,
        baseScore: 90,
      },
      {
        type: InterventionType.NAVIGATION,
        domain: SDOHDomain.TRANSPORTATION,
        title: "Transportation Navigation",
        description: "Help patient access transportation resources",
        evidenceBased: true,
        baseScore: 75,
      },
    ];
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface Timeline {
  events: TimelineEvent[];
  duration: number;
}

interface TimelineEvent {
  date: Date;
  type: "START" | "ACTIVITY" | "OUTCOME";
  description: string;
}

interface CostEffectiveness {
  totalCost: number;
  costPerActivity: number;
  success: boolean;
  needMet: boolean;
  roi: number;
}

interface InterventionRecommendation {
  type: InterventionType;
  domain: SDOHDomain;
  title: string;
  description: string;
  evidenceBased: boolean;
  priorityScore: number;
}

interface InterventionTemplate {
  type: InterventionType;
  domain: SDOHDomain;
  title: string;
  description: string;
  evidenceBased: boolean;
  baseScore: number;
}

interface InterventionMetrics {
  total: number;
  byStatus: Record<InterventionStatus, number>;
  successRate: number;
  averageDuration: number;
  totalCost: number;
  averageCost: number;
}

/**
 * Export singleton instance
 */
export const interventionWorkflow = new InterventionWorkflowManager();
