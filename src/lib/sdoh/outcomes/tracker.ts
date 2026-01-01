/**
 * SDOH Outcomes Tracking System
 * Long-term need resolution and impact measurement
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// Outcome Types
// ============================================================================

export enum OutcomeStatus {
  IDENTIFIED = "IDENTIFIED",
  IN_PROGRESS = "IN_PROGRESS",
  PARTIALLY_RESOLVED = "PARTIALLY_RESOLVED",
  FULLY_RESOLVED = "FULLY_RESOLVED",
  UNRESOLVED = "UNRESOLVED",
  UNABLE_TO_CONTACT = "UNABLE_TO_CONTACT",
}

export enum MeasurementFrequency {
  ONE_TIME = "ONE_TIME",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUALLY = "ANNUALLY",
}

export interface SDOHOutcome {
  id: string;
  organizationId: string;
  patientId: string;

  // Need Information
  needCategory: string;
  needDescription: string;
  identifiedDate: Date;
  severity: "low" | "moderate" | "high" | "critical";

  // Intervention
  screeningId?: string;
  referralIds: string[];
  resourcesUsed: ResourceUsage[];
  interventionsProvided: Intervention[];

  // Status and Resolution
  status: OutcomeStatus;
  resolutionDate?: Date;
  resolutionMethod?: string;
  resolutionNotes?: string;
  partiallyResolvedDate?: Date;

  // Measurements
  baselineMeasurement?: OutcomeMeasurement;
  followUpMeasurements: OutcomeMeasurement[];
  measurementFrequency: MeasurementFrequency;
  nextMeasurementDate?: Date;

  // Impact
  healthImpact?: HealthImpact;
  socialImpact?: SocialImpact;
  economicImpact?: EconomicImpact;

  // Patient Feedback
  patientSatisfaction?: number; // 1-5
  patientFeedback?: string;
  willingToRecommend?: boolean;

  // Follow-up
  followUpRequired: boolean;
  followUpSchedule: FollowUpSchedule[];
  missedFollowUps: number;

  // Barriers
  barriers: Barrier[];
  facilitators: Facilitator[];

  // Metadata
  trackedBy: string;
  createdAt: Date;
  updatedAt: Date;
  closedDate?: Date;
  tags: string[];
  notes?: string;
}

export interface ResourceUsage {
  resourceId: string;
  resourceName: string;
  category: string;
  dateUsed: Date;
  frequency: number; // Number of times used
  duration?: number; // Duration in days
  costToPatient?: number;
  effectivenessRating?: number; // 1-5
}

export interface Intervention {
  id: string;
  type: string;
  description: string;
  providedBy: string;
  providedDate: Date;
  completedDate?: Date;
  successful: boolean;
  notes?: string;
}

export interface OutcomeMeasurement {
  id: string;
  measurementDate: Date;
  measuredBy: string;
  method: MeasurementMethod;

  // Standardized Measures
  hungerVitalSign?: HungerVitalSign;
  housingStability?: HousingStabilityMeasure;
  foodSecurity?: FoodSecurityMeasure;
  transportationAccess?: TransportationAccessMeasure;
  financialStrain?: FinancialStrainMeasure;
  socialConnection?: SocialConnectionMeasure;

  // Custom Measures
  customMeasures?: CustomMeasure[];

  // Overall Assessment
  overallImprovement: ImprovementLevel;
  notes?: string;
}

export enum MeasurementMethod {
  PHONE_INTERVIEW = "PHONE_INTERVIEW",
  IN_PERSON_INTERVIEW = "IN_PERSON_INTERVIEW",
  ONLINE_SURVEY = "ONLINE_SURVEY",
  MEDICAL_RECORD_REVIEW = "MEDICAL_RECORD_REVIEW",
  PATIENT_PORTAL = "PATIENT_PORTAL",
  AUTOMATED = "AUTOMATED",
}

export enum ImprovementLevel {
  SIGNIFICANTLY_WORSE = "SIGNIFICANTLY_WORSE",
  SOMEWHAT_WORSE = "SOMEWHAT_WORSE",
  NO_CHANGE = "NO_CHANGE",
  SOMEWHAT_BETTER = "SOMEWHAT_BETTER",
  SIGNIFICANTLY_BETTER = "SIGNIFICANTLY_BETTER",
}

export interface HungerVitalSign {
  foodRanOut: "often" | "sometimes" | "never";
  foodDidntLast: "often" | "sometimes" | "never";
  score: number; // 0-2, higher is worse
}

export interface HousingStabilityMeasure {
  hasStableHousing: boolean;
  housingType: string;
  housingQuality: number; // 1-5
  affordabilityStrain: number; // 1-5
  threatened: boolean;
}

export interface FoodSecurityMeasure {
  level: "high" | "marginal" | "low" | "very_low";
  score: number;
  daysWithoutFood: number;
}

export interface TransportationAccessMeasure {
  hasReliableTransportation: boolean;
  transportationType: string[];
  missedAppointments: number;
  transportationBarriers: string[];
}

export interface FinancialStrainMeasure {
  level: number; // 1-5
  unableToPayBills: boolean;
  utilityThreatened: boolean;
  incomeStability: "stable" | "unstable" | "increasing" | "decreasing";
}

export interface SocialConnectionMeasure {
  socialContactFrequency: number; // Times per week
  feelingIsolated: boolean;
  isolationScore: number; // 1-5
  supportNetworkSize: number;
}

export interface CustomMeasure {
  name: string;
  value: number | string | boolean;
  unit?: string;
  interpretation?: string;
}

export interface HealthImpact {
  healthcareUtilization?: HealthcareUtilization;
  clinicalOutcomes?: ClinicalOutcome[];
  medicationAdherence?: MedicationAdherence;
  preventiveCareCompleted?: boolean;
  emergencyVisitsAvoided?: number;
}

export interface HealthcareUtilization {
  erVisitsBefore: number;
  erVisitsAfter: number;
  hospitalizationsBefore: number;
  hospitalizationsAfter: number;
  primaryCareVisitsBefore: number;
  primaryCareVisitsAfter: number;
  measurementPeriodMonths: number;
}

export interface ClinicalOutcome {
  measure: string;
  baselineValue: number;
  currentValue: number;
  unit: string;
  improved: boolean;
}

export interface MedicationAdherence {
  baselineAdherence: number; // percentage
  currentAdherence: number; // percentage
  improved: boolean;
}

export interface SocialImpact {
  employmentStatus?: EmploymentChange;
  educationAttainment?: EducationChange;
  housingStability?: HousingStabilityChange;
  familyStability?: FamilyStabilityChange;
  socialConnections?: SocialConnectionChange;
}

export interface EmploymentChange {
  before: string;
  after: string;
  improved: boolean;
}

export interface EducationChange {
  before: string;
  after: string;
  improved: boolean;
}

export interface HousingStabilityChange {
  before: string;
  after: string;
  improved: boolean;
  monthsStable: number;
}

export interface FamilyStabilityChange {
  before: string;
  after: string;
  childrenAffected: number;
  improved: boolean;
}

export interface SocialConnectionChange {
  before: number; // social connection score
  after: number;
  improved: boolean;
}

export interface EconomicImpact {
  costToHealthSystem?: number;
  costToPatient?: number;
  costAvoidance?: number;
  roi?: number;
  productivityGain?: number;
}

export interface FollowUpSchedule {
  id: string;
  scheduledDate: Date;
  completedDate?: Date;
  method: MeasurementMethod;
  completed: boolean;
  notes?: string;
  rescheduledTo?: Date;
  cancelledReason?: string;
}

export interface Barrier {
  type: BarrierType;
  description: string;
  identifiedDate: Date;
  resolved: boolean;
  resolutionDate?: Date;
  impact: "low" | "medium" | "high";
}

export enum BarrierType {
  FINANCIAL = "FINANCIAL",
  TRANSPORTATION = "TRANSPORTATION",
  LANGUAGE = "LANGUAGE",
  LITERACY = "LITERACY",
  TECHNOLOGY_ACCESS = "TECHNOLOGY_ACCESS",
  CULTURAL = "CULTURAL",
  DOCUMENTATION = "DOCUMENTATION",
  ELIGIBILITY = "ELIGIBILITY",
  AWARENESS = "AWARENESS",
  TRUST = "TRUST",
  STIGMA = "STIGMA",
  CAPACITY = "CAPACITY",
  OTHER = "OTHER",
}

export interface Facilitator {
  type: string;
  description: string;
  impact: "low" | "medium" | "high";
}

// ============================================================================
// Outcome Tracker
// ============================================================================

export class OutcomeTracker {
  private outcomes: Map<string, SDOHOutcome> = new Map();

  /**
   * Create new outcome tracking record
   */
  createOutcome(request: CreateOutcomeRequest): SDOHOutcome {
    const outcomeId = this.generateOutcomeId();
    const now = new Date();

    const outcome: SDOHOutcome = {
      id: outcomeId,
      organizationId: request.organizationId,
      patientId: request.patientId,
      needCategory: request.needCategory,
      needDescription: request.needDescription,
      identifiedDate: request.identifiedDate || now,
      severity: request.severity,
      screeningId: request.screeningId,
      referralIds: request.referralIds || [],
      resourcesUsed: [],
      interventionsProvided: [],
      status: OutcomeStatus.IDENTIFIED,
      followUpMeasurements: [],
      measurementFrequency: request.measurementFrequency || MeasurementFrequency.MONTHLY,
      followUpRequired: true,
      followUpSchedule: [],
      missedFollowUps: 0,
      barriers: [],
      facilitators: [],
      trackedBy: request.trackedBy,
      createdAt: now,
      updatedAt: now,
      tags: [],
    };

    // Schedule initial follow-up
    this.scheduleNextFollowUp(outcome);

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Add baseline measurement
   */
  addBaselineMeasurement(
    outcomeId: string,
    measurement: Omit<OutcomeMeasurement, "id">
  ): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    outcome.baselineMeasurement = {
      ...measurement,
      id: this.generateMeasurementId(),
    };
    outcome.updatedAt = new Date();

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Add follow-up measurement
   */
  addFollowUpMeasurement(
    outcomeId: string,
    measurement: Omit<OutcomeMeasurement, "id">
  ): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    const newMeasurement: OutcomeMeasurement = {
      ...measurement,
      id: this.generateMeasurementId(),
    };

    outcome.followUpMeasurements.push(newMeasurement);
    outcome.updatedAt = new Date();

    // Update status based on improvement
    this.updateStatusFromMeasurement(outcome, newMeasurement);

    // Schedule next follow-up
    this.scheduleNextFollowUp(outcome);

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Record resource usage
   */
  addResourceUsage(outcomeId: string, usage: ResourceUsage): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    outcome.resourcesUsed.push(usage);
    outcome.status = OutcomeStatus.IN_PROGRESS;
    outcome.updatedAt = new Date();

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Add intervention
   */
  addIntervention(
    outcomeId: string,
    intervention: Omit<Intervention, "id">
  ): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    outcome.interventionsProvided.push({
      ...intervention,
      id: this.generateInterventionId(),
    });
    outcome.updatedAt = new Date();

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Add barrier
   */
  addBarrier(outcomeId: string, barrier: Barrier): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    outcome.barriers.push(barrier);
    outcome.updatedAt = new Date();

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Resolve barrier
   */
  resolveBarrier(outcomeId: string, barrierId: number): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    if (outcome.barriers[barrierId]) {
      outcome.barriers[barrierId].resolved = true;
      outcome.barriers[barrierId].resolutionDate = new Date();
      outcome.updatedAt = new Date();
    }

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Mark outcome as resolved
   */
  resolveOutcome(
    outcomeId: string,
    resolutionMethod: string,
    notes?: string
  ): SDOHOutcome {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome) {
      throw new Error("Outcome not found");
    }

    outcome.status = OutcomeStatus.FULLY_RESOLVED;
    outcome.resolutionDate = new Date();
    outcome.resolutionMethod = resolutionMethod;
    outcome.resolutionNotes = notes;
    outcome.closedDate = new Date();
    outcome.updatedAt = new Date();

    this.outcomes.set(outcomeId, outcome);
    return outcome;
  }

  /**
   * Get outcomes for patient
   */
  getPatientOutcomes(patientId: string): SDOHOutcome[] {
    return Array.from(this.outcomes.values()).filter(
      (o) => o.patientId === patientId
    );
  }

  /**
   * Get outcomes by status
   */
  getOutcomesByStatus(status: OutcomeStatus): SDOHOutcome[] {
    return Array.from(this.outcomes.values()).filter((o) => o.status === status);
  }

  /**
   * Get outcomes needing follow-up
   */
  getOutcomesNeedingFollowUp(): SDOHOutcome[] {
    const now = new Date();
    return Array.from(this.outcomes.values()).filter(
      (o) =>
        o.followUpRequired &&
        o.nextMeasurementDate &&
        o.nextMeasurementDate <= now &&
        o.status !== OutcomeStatus.FULLY_RESOLVED
    );
  }

  /**
   * Calculate improvement trend
   */
  calculateImprovementTrend(outcomeId: string): {
    trend: "improving" | "stable" | "declining" | "insufficient_data";
    changePercent?: number;
    measurements: number;
  } {
    const outcome = this.outcomes.get(outcomeId);
    if (!outcome || outcome.followUpMeasurements.length < 2) {
      return { trend: "insufficient_data", measurements: 0 };
    }

    const measurements = outcome.followUpMeasurements;
    const improvements = measurements.map((m) => {
      switch (m.overallImprovement) {
        case ImprovementLevel.SIGNIFICANTLY_BETTER:
          return 2;
        case ImprovementLevel.SOMEWHAT_BETTER:
          return 1;
        case ImprovementLevel.NO_CHANGE:
          return 0;
        case ImprovementLevel.SOMEWHAT_WORSE:
          return -1;
        case ImprovementLevel.SIGNIFICANTLY_WORSE:
          return -2;
      }
    });

    const avgImprovement =
      improvements.reduce((a, b) => a + b, 0) / improvements.length;

    let trend: "improving" | "stable" | "declining";
    if (avgImprovement > 0.5) trend = "improving";
    else if (avgImprovement < -0.5) trend = "declining";
    else trend = "stable";

    return {
      trend,
      changePercent: avgImprovement * 50, // Convert to percentage
      measurements: measurements.length,
    };
  }

  /**
   * Schedule next follow-up
   */
  private scheduleNextFollowUp(outcome: SDOHOutcome): void {
    const now = new Date();
    let daysToAdd = 30; // Default monthly

    switch (outcome.measurementFrequency) {
      case MeasurementFrequency.WEEKLY:
        daysToAdd = 7;
        break;
      case MeasurementFrequency.BIWEEKLY:
        daysToAdd = 14;
        break;
      case MeasurementFrequency.QUARTERLY:
        daysToAdd = 90;
        break;
      case MeasurementFrequency.ANNUALLY:
        daysToAdd = 365;
        break;
    }

    outcome.nextMeasurementDate = new Date(
      now.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Update status based on measurement
   */
  private updateStatusFromMeasurement(
    outcome: SDOHOutcome,
    measurement: OutcomeMeasurement
  ): void {
    if (
      measurement.overallImprovement === ImprovementLevel.SIGNIFICANTLY_BETTER
    ) {
      outcome.status = OutcomeStatus.PARTIALLY_RESOLVED;
      outcome.partiallyResolvedDate = measurement.measurementDate;
    }
  }

  private generateOutcomeId(): string {
    return `OUTCOME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMeasurementId(): string {
    return `MEASURE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInterventionId(): string {
    return `INTERVENTION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateOutcomeRequest {
  organizationId: string;
  patientId: string;
  needCategory: string;
  needDescription: string;
  identifiedDate?: Date;
  severity: "low" | "moderate" | "high" | "critical";
  screeningId?: string;
  referralIds?: string[];
  measurementFrequency?: MeasurementFrequency;
  trackedBy: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const CreateOutcomeSchema = z.object({
  organizationId: z.string(),
  patientId: z.string(),
  needCategory: z.string(),
  needDescription: z.string().min(10),
  severity: z.enum(["low", "moderate", "high", "critical"]),
  screeningId: z.string().optional(),
  referralIds: z.array(z.string()).optional(),
  measurementFrequency: z.nativeEnum(MeasurementFrequency).optional(),
  trackedBy: z.string(),
});
