/**
 * Patient Eligibility Screening Engine
 * Lithic Healthcare Platform v0.5
 *
 * Automated and manual eligibility assessment for clinical trials
 */

import {
  EligibilityCriteria,
  Criterion,
  CriterionResult,
  EligibilityAssessment,
  EligibilityAction,
  CriterionDataType,
  ComparisonOperator,
} from "@/types/research";
import { Patient } from "@/types/patient";
import { auditLogger } from "@/lib/audit-logger";

export class EligibilityEngine {
  private static instance: EligibilityEngine;
  private assessments: Map<string, EligibilityAssessment> = new Map();

  private constructor() {}

  static getInstance(): EligibilityEngine {
    if (!EligibilityEngine.instance) {
      EligibilityEngine.instance = new EligibilityEngine();
    }
    return EligibilityEngine.instance;
  }

  /**
   * Assess patient eligibility for a trial
   */
  async assessEligibility(
    patientId: string,
    trialId: string,
    criteria: EligibilityCriteria,
    patientData: any,
    userId: string,
    manualOverrides?: Record<string, { met: boolean; reason: string }>
  ): Promise<EligibilityAssessment> {
    try {
      // Evaluate inclusion criteria
      const inclusionResults = await this.evaluateCriteria(
        criteria.inclusionCriteria,
        patientData,
        manualOverrides
      );

      // Evaluate exclusion criteria
      const exclusionResults = await this.evaluateCriteria(
        criteria.exclusionCriteria,
        patientData,
        manualOverrides
      );

      // Check age eligibility
      const ageEligible = this.checkAgeEligibility(
        patientData.dateOfBirth,
        criteria.minAge,
        criteria.maxAge,
        criteria.ageUnit
      );

      // Check sex eligibility
      const sexEligible =
        criteria.sex === "ALL" || patientData.gender === criteria.sex;

      // Combine all results
      const allResults = [...inclusionResults, ...exclusionResults];

      // Determine overall eligibility
      const inclusionMet = inclusionResults.every((r) => r.met);
      const exclusionMet = exclusionResults.every((r) => !r.met); // All exclusions should NOT be met
      const overallEligible =
        inclusionMet && exclusionMet && ageEligible && sexEligible;

      // Calculate eligibility score (percentage of criteria met)
      const totalCriteria = allResults.length + 2; // +2 for age and sex
      const metCriteria =
        allResults.filter((r) => r.met).length +
        (ageEligible ? 1 : 0) +
        (sexEligible ? 1 : 0);
      const score = (metCriteria / totalCriteria) * 100;

      // Determine recommended action
      const recommendedAction = this.determineAction(
        overallEligible,
        score,
        allResults
      );

      // Create assessment
      const assessment: EligibilityAssessment = {
        id: this.generateId(),
        patientId,
        trialId,
        assessedAt: new Date(),
        assessedBy: userId,
        overallEligible,
        score,
        results: allResults,
        notes: this.generateAssessmentNotes(
          allResults,
          ageEligible,
          sexEligible
        ),
        recommendedAction,
      };

      // Store assessment
      this.assessments.set(assessment.id, assessment);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "eligibility_assessment",
        resourceId: assessment.id,
        details: {
          patientId,
          trialId,
          overallEligible,
          score,
        },
        organizationId: patientData.organizationId || "",
      });

      return assessment;
    } catch (error) {
      throw new Error(
        `Failed to assess eligibility: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Evaluate a set of criteria against patient data
   */
  private async evaluateCriteria(
    criteria: Criterion[],
    patientData: any,
    manualOverrides?: Record<string, { met: boolean; reason: string }>
  ): Promise<CriterionResult[]> {
    const results: CriterionResult[] = [];

    for (const criterion of criteria) {
      // Check for manual override
      if (manualOverrides && manualOverrides[criterion.id]) {
        const override = manualOverrides[criterion.id];
        results.push({
          criterionId: criterion.id,
          met: override.met,
          value: null,
          automatedCheck: false,
          manualOverride: true,
          overrideReason: override.reason,
          notes: `Manual override: ${override.reason}`,
        });
        continue;
      }

      // Attempt automated evaluation if automatable
      if (criterion.automatable) {
        const result = await this.evaluateCriterion(criterion, patientData);
        results.push(result);
      } else {
        // Criteria that require manual review
        results.push({
          criterionId: criterion.id,
          met: false,
          value: null,
          automatedCheck: false,
          manualOverride: false,
          overrideReason: null,
          notes: "Requires manual review",
        });
      }
    }

    return results;
  }

  /**
   * Evaluate a single criterion
   */
  private async evaluateCriterion(
    criterion: Criterion,
    patientData: any
  ): Promise<CriterionResult> {
    try {
      let actualValue: any;
      let met = false;

      // Extract value based on data type
      switch (criterion.dataType) {
        case CriterionDataType.BOOLEAN:
          actualValue = this.extractValue(patientData, criterion);
          met = this.compareBoolean(actualValue, criterion.value);
          break;

        case CriterionDataType.NUMERIC:
          actualValue = this.extractNumericValue(patientData, criterion);
          met = this.compareNumeric(
            actualValue,
            criterion.value,
            criterion.comparisonOperator!
          );
          break;

        case CriterionDataType.TEXT:
          actualValue = this.extractValue(patientData, criterion);
          met = this.compareText(
            actualValue,
            criterion.value,
            criterion.comparisonOperator!
          );
          break;

        case CriterionDataType.DATE:
          actualValue = this.extractDateValue(patientData, criterion);
          met = this.compareDate(
            actualValue,
            criterion.value,
            criterion.comparisonOperator!
          );
          break;

        case CriterionDataType.CODE:
          actualValue = this.extractValue(patientData, criterion);
          met = this.compareCode(
            actualValue,
            criterion.value,
            criterion.comparisonOperator!
          );
          break;

        case CriterionDataType.OBSERVATION:
        case CriterionDataType.CONDITION:
        case CriterionDataType.MEDICATION:
        case CriterionDataType.PROCEDURE:
          actualValue = await this.extractClinicalData(
            patientData,
            criterion
          );
          met = this.compareClinicalData(
            actualValue,
            criterion.value,
            criterion.comparisonOperator!
          );
          break;

        default:
          actualValue = null;
          met = false;
      }

      return {
        criterionId: criterion.id,
        met,
        value: actualValue,
        automatedCheck: true,
        manualOverride: false,
        overrideReason: null,
        notes: null,
      };
    } catch (error) {
      return {
        criterionId: criterion.id,
        met: false,
        value: null,
        automatedCheck: false,
        manualOverride: false,
        overrideReason: null,
        notes: `Error evaluating criterion: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Check age eligibility
   */
  private checkAgeEligibility(
    dateOfBirth: Date,
    minAge: number | null,
    maxAge: number | null,
    ageUnit: string
  ): boolean {
    if (!dateOfBirth) return false;

    const age = this.calculateAge(dateOfBirth);
    let ageInUnit: number;

    switch (ageUnit) {
      case "YEARS":
        ageInUnit = age;
        break;
      case "MONTHS":
        ageInUnit = age * 12;
        break;
      case "WEEKS":
        ageInUnit = age * 52;
        break;
      case "DAYS":
        ageInUnit = age * 365;
        break;
      default:
        ageInUnit = age;
    }

    if (minAge !== null && ageInUnit < minAge) return false;
    if (maxAge !== null && ageInUnit > maxAge) return false;

    return true;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Extract value from patient data using criterion configuration
   */
  private extractValue(patientData: any, criterion: Criterion): any {
    if (criterion.fhirPath) {
      return this.evaluateFHIRPath(patientData, criterion.fhirPath);
    }

    // Fallback to direct property access
    const keys = criterion.code.split(".");
    let value = patientData;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    return value;
  }

  /**
   * Extract numeric value with unit conversion
   */
  private extractNumericValue(patientData: any, criterion: Criterion): number | null {
    const value = this.extractValue(patientData, criterion);
    if (value === null || value === undefined) return null;

    // Handle value with units
    if (typeof value === "object" && "value" in value) {
      return parseFloat(value.value);
    }

    return parseFloat(value);
  }

  /**
   * Extract date value
   */
  private extractDateValue(patientData: any, criterion: Criterion): Date | null {
    const value = this.extractValue(patientData, criterion);
    if (!value) return null;

    return new Date(value);
  }

  /**
   * Extract clinical data (observations, conditions, etc.)
   */
  private async extractClinicalData(
    patientData: any,
    criterion: Criterion
  ): Promise<any> {
    // This would integrate with FHIR resources
    // For now, return mock data structure
    return {
      exists: false,
      values: [],
    };
  }

  /**
   * Evaluate FHIRPath expression
   */
  private evaluateFHIRPath(data: any, path: string): any {
    // Simplified FHIRPath evaluation
    // In production, use a proper FHIRPath library
    const parts = path.split(".");
    let result = data;

    for (const part of parts) {
      if (result === null || result === undefined) {
        return null;
      }
      result = result[part];
    }

    return result;
  }

  // Comparison methods

  private compareBoolean(actual: any, expected: boolean): boolean {
    return Boolean(actual) === expected;
  }

  private compareNumeric(
    actual: number | null,
    expected: number,
    operator: ComparisonOperator
  ): boolean {
    if (actual === null) return false;

    switch (operator) {
      case ComparisonOperator.EQUAL:
        return actual === expected;
      case ComparisonOperator.NOT_EQUAL:
        return actual !== expected;
      case ComparisonOperator.GREATER_THAN:
        return actual > expected;
      case ComparisonOperator.GREATER_THAN_OR_EQUAL:
        return actual >= expected;
      case ComparisonOperator.LESS_THAN:
        return actual < expected;
      case ComparisonOperator.LESS_THAN_OR_EQUAL:
        return actual <= expected;
      default:
        return false;
    }
  }

  private compareText(
    actual: string,
    expected: string,
    operator: ComparisonOperator
  ): boolean {
    if (!actual) return false;

    const actualLower = actual.toLowerCase();
    const expectedLower = expected.toLowerCase();

    switch (operator) {
      case ComparisonOperator.EQUAL:
        return actualLower === expectedLower;
      case ComparisonOperator.NOT_EQUAL:
        return actualLower !== expectedLower;
      case ComparisonOperator.CONTAINS:
        return actualLower.includes(expectedLower);
      case ComparisonOperator.NOT_CONTAINS:
        return !actualLower.includes(expectedLower);
      default:
        return false;
    }
  }

  private compareDate(
    actual: Date | null,
    expected: Date,
    operator: ComparisonOperator
  ): boolean {
    if (!actual) return false;

    const actualTime = actual.getTime();
    const expectedTime = new Date(expected).getTime();

    switch (operator) {
      case ComparisonOperator.EQUAL:
        return actualTime === expectedTime;
      case ComparisonOperator.NOT_EQUAL:
        return actualTime !== expectedTime;
      case ComparisonOperator.GREATER_THAN:
        return actualTime > expectedTime;
      case ComparisonOperator.GREATER_THAN_OR_EQUAL:
        return actualTime >= expectedTime;
      case ComparisonOperator.LESS_THAN:
        return actualTime < expectedTime;
      case ComparisonOperator.LESS_THAN_OR_EQUAL:
        return actualTime <= expectedTime;
      default:
        return false;
    }
  }

  private compareCode(
    actual: string | string[],
    expected: string | string[],
    operator: ComparisonOperator
  ): boolean {
    if (!actual) return false;

    const actualArray = Array.isArray(actual) ? actual : [actual];
    const expectedArray = Array.isArray(expected) ? expected : [expected];

    switch (operator) {
      case ComparisonOperator.EQUAL:
        return actualArray.some((a) => expectedArray.includes(a));
      case ComparisonOperator.NOT_EQUAL:
        return !actualArray.some((a) => expectedArray.includes(a));
      case ComparisonOperator.IN:
        return actualArray.some((a) => expectedArray.includes(a));
      case ComparisonOperator.NOT_IN:
        return !actualArray.some((a) => expectedArray.includes(a));
      default:
        return false;
    }
  }

  private compareClinicalData(
    actual: any,
    expected: any,
    operator: ComparisonOperator
  ): boolean {
    if (!actual || !actual.exists) return false;

    // Compare based on operator
    switch (operator) {
      case ComparisonOperator.EQUAL:
        return actual.exists === true;
      case ComparisonOperator.NOT_EQUAL:
        return actual.exists === false;
      default:
        return false;
    }
  }

  /**
   * Determine recommended action based on assessment
   */
  private determineAction(
    overallEligible: boolean,
    score: number,
    results: CriterionResult[]
  ): EligibilityAction {
    if (overallEligible) {
      return EligibilityAction.PROCEED_TO_ENROLLMENT;
    }

    // Check if close to eligible (score > 80%)
    if (score >= 80) {
      return EligibilityAction.REQUIRES_REVIEW;
    }

    // Check if any results require manual review
    const hasManualReview = results.some(
      (r) => !r.automatedCheck && !r.manualOverride
    );
    if (hasManualReview) {
      return EligibilityAction.REQUIRES_REVIEW;
    }

    // Check if this is a screening assessment
    const hasNonMetRequired = results.some((r) => !r.met);
    if (hasNonMetRequired) {
      return EligibilityAction.SCREEN_FAILURE;
    }

    return EligibilityAction.NOT_ELIGIBLE;
  }

  /**
   * Generate assessment notes
   */
  private generateAssessmentNotes(
    results: CriterionResult[],
    ageEligible: boolean,
    sexEligible: boolean
  ): string {
    const notes: string[] = [];

    if (!ageEligible) {
      notes.push("Patient does not meet age requirements");
    }

    if (!sexEligible) {
      notes.push("Patient does not meet sex requirements");
    }

    const notMet = results.filter((r) => !r.met);
    if (notMet.length > 0) {
      notes.push(`${notMet.length} criteria not met`);
    }

    const requiresReview = results.filter(
      (r) => !r.automatedCheck && !r.manualOverride
    );
    if (requiresReview.length > 0) {
      notes.push(`${requiresReview.length} criteria require manual review`);
    }

    return notes.join("; ");
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(id: string): Promise<EligibilityAssessment | null> {
    return this.assessments.get(id) || null;
  }

  /**
   * Get all assessments for a patient
   */
  async getPatientAssessments(
    patientId: string
  ): Promise<EligibilityAssessment[]> {
    return Array.from(this.assessments.values()).filter(
      (a) => a.patientId === patientId
    );
  }

  /**
   * Get all assessments for a trial
   */
  async getTrialAssessments(
    trialId: string
  ): Promise<EligibilityAssessment[]> {
    return Array.from(this.assessments.values()).filter(
      (a) => a.trialId === trialId
    );
  }

  private generateId(): string {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const eligibilityEngine = EligibilityEngine.getInstance();
