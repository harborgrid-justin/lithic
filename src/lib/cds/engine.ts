/**
 * Core CDS Evaluation Engine
 * Evaluates clinical decision support rules and generates alerts
 */

import {
  CDSRule,
  CDSAlert,
  CDSContext,
  CDSEvaluationRequest,
  CDSEvaluationResult,
  CDSSuggestion,
  RuleCondition,
  ConditionOperator,
  ConditionType,
  AlertSeverity,
  AlertStatus,
  RuleCategory,
  EvaluationTrigger,
} from "@/types/cds";
import { auditLogger } from "@/lib/audit-logger";

/**
 * CDS Engine - Core evaluation logic
 */
export class CDSEngine {
  private rules: Map<string, CDSRule> = new Map();
  private evaluationCache: Map<string, CDSEvaluationResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Load rules into the engine
   */
  loadRules(rules: CDSRule[]): void {
    this.rules.clear();
    rules.forEach((rule) => {
      if (rule.enabled && this.isRuleActive(rule)) {
        this.rules.set(rule.id, rule);
      }
    });
  }

  /**
   * Evaluate CDS rules for a patient
   */
  async evaluate(request: CDSEvaluationRequest): Promise<CDSEvaluationResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached;
    }

    const alerts: CDSAlert[] = [];
    const suggestions: CDSSuggestion[] = [];
    let evaluatedRules = 0;
    let firedRules = 0;

    // Filter rules based on scope
    const rulesToEvaluate = this.filterRules(request);

    // Evaluate each rule
    for (const rule of rulesToEvaluate) {
      evaluatedRules++;

      try {
        const fired = await this.evaluateRule(rule, request.context);

        if (fired) {
          firedRules++;

          // Generate alert or suggestion based on rule action
          const alert = this.generateAlert(rule, request, request.context);
          if (alert) {
            alerts.push(alert);
          }

          // Generate suggestions if applicable
          const ruleSuggestions = this.generateSuggestions(
            rule,
            request.context,
          );
          suggestions.push(...ruleSuggestions);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        // Continue with other rules
      }
    }

    // Sort alerts by severity and priority
    alerts.sort((a, b) => {
      const severityOrder = {
        [AlertSeverity.CRITICAL]: 5,
        [AlertSeverity.HIGH]: 4,
        [AlertSeverity.MODERATE]: 3,
        [AlertSeverity.LOW]: 2,
        [AlertSeverity.INFO]: 1,
      };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const evaluationTime = Date.now() - startTime;

    const result: CDSEvaluationResult = {
      patientId: request.patientId,
      encounterId: request.encounterId || null,
      alerts,
      suggestions,
      orderSets: [], // Populated by order set recommendations
      evaluatedRules,
      firedRules,
      evaluationTime,
      timestamp: new Date(),
    };

    // Cache result
    this.evaluationCache.set(cacheKey, result);

    // Audit log
    await this.auditEvaluation(request, result);

    return result;
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: CDSRule,
    context: CDSContext,
  ): Promise<boolean> {
    if (!rule.conditions || rule.conditions.length === 0) {
      return false;
    }

    // Evaluate all conditions
    const results = await Promise.all(
      rule.conditions.map((condition) =>
        this.evaluateCondition(condition, context),
      ),
    );

    // Combine results based on logical operators
    return this.combineConditionResults(rule.conditions, results);
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: RuleCondition,
    context: CDSContext,
  ): Promise<boolean> {
    let result = false;

    try {
      switch (condition.type) {
        case ConditionType.PATIENT_AGE:
          result = this.evaluateNumericCondition(
            context.patientAge,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_GENDER:
          result = this.evaluateStringCondition(
            context.patientGender,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_WEIGHT:
          result = this.evaluateNumericCondition(
            context.patientWeight,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_PREGNANCY:
          result = this.evaluateBooleanCondition(
            context.isPregnant,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_LACTATION:
          result = this.evaluateBooleanCondition(
            context.isLactating,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_ALLERGY:
          result = this.evaluateAllergyCondition(
            context.allergies,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.PATIENT_DIAGNOSIS:
          result = this.evaluateDiagnosisCondition(
            context.diagnoses,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.MEDICATION_ACTIVE:
          result = this.evaluateMedicationCondition(
            context.activeMedications,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.LAB_RESULT:
          result = this.evaluateLabCondition(
            context.recentLabs,
            condition.field,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.RENAL_FUNCTION:
          result = this.evaluateRenalFunction(
            context.renalFunction,
            condition.operator,
            condition.value,
          );
          break;

        case ConditionType.HEPATIC_FUNCTION:
          result = this.evaluateHepaticFunction(
            context.hepaticFunction,
            condition.operator,
            condition.value,
          );
          break;

        default:
          result = false;
      }

      // Apply negation if specified
      if (condition.negate) {
        result = !result;
      }
    } catch (error) {
      console.error(`Error evaluating condition ${condition.id}:`, error);
      result = false;
    }

    return result;
  }

  /**
   * Evaluate numeric condition
   */
  private evaluateNumericCondition(
    actualValue: number | null | undefined,
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (actualValue === null || actualValue === undefined) {
      return operator === ConditionOperator.NOT_EXISTS;
    }

    const expected =
      typeof expectedValue === "number"
        ? expectedValue
        : parseFloat(expectedValue);

    switch (operator) {
      case ConditionOperator.EQUALS:
        return actualValue === expected;
      case ConditionOperator.NOT_EQUALS:
        return actualValue !== expected;
      case ConditionOperator.GREATER_THAN:
        return actualValue > expected;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return actualValue >= expected;
      case ConditionOperator.LESS_THAN:
        return actualValue < expected;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return actualValue <= expected;
      case ConditionOperator.BETWEEN:
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          return (
            actualValue >= expectedValue[0] && actualValue <= expectedValue[1]
          );
        }
        return false;
      case ConditionOperator.EXISTS:
        return true;
      case ConditionOperator.NOT_EXISTS:
        return false;
      default:
        return false;
    }
  }

  /**
   * Evaluate string condition
   */
  private evaluateStringCondition(
    actualValue: string | null | undefined,
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (actualValue === null || actualValue === undefined) {
      return operator === ConditionOperator.NOT_EXISTS;
    }

    const actual = actualValue.toLowerCase();
    const expected = String(expectedValue).toLowerCase();

    switch (operator) {
      case ConditionOperator.EQUALS:
        return actual === expected;
      case ConditionOperator.NOT_EQUALS:
        return actual !== expected;
      case ConditionOperator.CONTAINS:
        return actual.includes(expected);
      case ConditionOperator.NOT_CONTAINS:
        return !actual.includes(expected);
      case ConditionOperator.IN:
        return (
          Array.isArray(expectedValue) &&
          expectedValue.some((v) => actual === String(v).toLowerCase())
        );
      case ConditionOperator.NOT_IN:
        return (
          Array.isArray(expectedValue) &&
          !expectedValue.some((v) => actual === String(v).toLowerCase())
        );
      case ConditionOperator.MATCHES_PATTERN:
        try {
          const regex = new RegExp(expected, "i");
          return regex.test(actual);
        } catch {
          return false;
        }
      case ConditionOperator.EXISTS:
        return true;
      case ConditionOperator.NOT_EXISTS:
        return false;
      default:
        return false;
    }
  }

  /**
   * Evaluate boolean condition
   */
  private evaluateBooleanCondition(
    actualValue: boolean,
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    const expected = Boolean(expectedValue);

    switch (operator) {
      case ConditionOperator.EQUALS:
        return actualValue === expected;
      case ConditionOperator.NOT_EQUALS:
        return actualValue !== expected;
      default:
        return false;
    }
  }

  /**
   * Evaluate allergy condition
   */
  private evaluateAllergyCondition(
    allergies: CDSContext["allergies"],
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (operator === ConditionOperator.NOT_EXISTS) {
      return allergies.length === 0;
    }
    if (operator === ConditionOperator.EXISTS) {
      return allergies.length > 0;
    }

    const allergenNames = allergies.map((a) => a.allergen.toLowerCase());
    const expected = String(expectedValue).toLowerCase();

    switch (operator) {
      case ConditionOperator.CONTAINS:
        return allergenNames.some((name) => name.includes(expected));
      case ConditionOperator.NOT_CONTAINS:
        return !allergenNames.some((name) => name.includes(expected));
      case ConditionOperator.IN:
        return (
          Array.isArray(expectedValue) &&
          expectedValue.some((v) =>
            allergenNames.includes(String(v).toLowerCase()),
          )
        );
      default:
        return false;
    }
  }

  /**
   * Evaluate diagnosis condition
   */
  private evaluateDiagnosisCondition(
    diagnoses: CDSContext["diagnoses"],
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (operator === ConditionOperator.NOT_EXISTS) {
      return diagnoses.length === 0;
    }
    if (operator === ConditionOperator.EXISTS) {
      return diagnoses.length > 0;
    }

    const icdCodes = diagnoses.map((d) => d.icdCode.toLowerCase());
    const expected = String(expectedValue).toLowerCase();

    switch (operator) {
      case ConditionOperator.CONTAINS:
        return icdCodes.some((code) => code.includes(expected));
      case ConditionOperator.IN:
        return (
          Array.isArray(expectedValue) &&
          expectedValue.some((v) => icdCodes.includes(String(v).toLowerCase()))
        );
      default:
        return false;
    }
  }

  /**
   * Evaluate medication condition
   */
  private evaluateMedicationCondition(
    medications: CDSContext["activeMedications"],
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (operator === ConditionOperator.NOT_EXISTS) {
      return medications.length === 0;
    }
    if (operator === ConditionOperator.EXISTS) {
      return medications.length > 0;
    }

    const medNames = medications.map((m) => m.genericName.toLowerCase());
    const expected = String(expectedValue).toLowerCase();

    switch (operator) {
      case ConditionOperator.CONTAINS:
        return medNames.some((name) => name.includes(expected));
      case ConditionOperator.IN:
        return (
          Array.isArray(expectedValue) &&
          expectedValue.some((v) => medNames.includes(String(v).toLowerCase()))
        );
      default:
        return false;
    }
  }

  /**
   * Evaluate lab condition
   */
  private evaluateLabCondition(
    labs: CDSContext["recentLabs"],
    field: string,
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    const lab = labs.find(
      (l) => l.code === field || l.name.toLowerCase() === field.toLowerCase(),
    );

    if (!lab) {
      return operator === ConditionOperator.NOT_EXISTS;
    }

    return this.evaluateNumericCondition(lab.value, operator, expectedValue);
  }

  /**
   * Evaluate renal function
   */
  private evaluateRenalFunction(
    renalFunction: CDSContext["renalFunction"],
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (!renalFunction) {
      return operator === ConditionOperator.NOT_EXISTS;
    }

    // Can check GFR, stage, etc.
    return this.evaluateNumericCondition(
      renalFunction.gfr,
      operator,
      expectedValue,
    );
  }

  /**
   * Evaluate hepatic function
   */
  private evaluateHepaticFunction(
    hepaticFunction: CDSContext["hepaticFunction"],
    operator: ConditionOperator,
    expectedValue: any,
  ): boolean {
    if (!hepaticFunction) {
      return operator === ConditionOperator.NOT_EXISTS;
    }

    // Can check Child-Pugh score, class, etc.
    return this.evaluateNumericCondition(
      hepaticFunction.childPughScore,
      operator,
      expectedValue,
    );
  }

  /**
   * Combine condition results based on logical operators
   */
  private combineConditionResults(
    conditions: RuleCondition[],
    results: boolean[],
  ): boolean {
    if (conditions.length === 0 || results.length === 0) {
      return false;
    }

    // Default to AND logic
    let combinedResult = results[0];

    for (let i = 1; i < results.length; i++) {
      const logicalOp = conditions[i].logicalOperator || "AND";

      if (logicalOp === "AND") {
        combinedResult = combinedResult && results[i];
      } else if (logicalOp === "OR") {
        combinedResult = combinedResult || results[i];
      }
    }

    return combinedResult;
  }

  /**
   * Generate alert from fired rule
   */
  private generateAlert(
    rule: CDSRule,
    request: CDSEvaluationRequest,
    context: CDSContext,
  ): CDSAlert | null {
    const action = rule.actions[0]; // Take first action
    if (!action) return null;

    const now = new Date();
    const alert: CDSAlert = {
      id: this.generateId(),
      organizationId: "", // Set from context
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: "CDS_ENGINE",
      updatedBy: "CDS_ENGINE",
      patientId: request.patientId,
      encounterId: request.encounterId || null,
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      title: rule.name,
      message: action.message,
      recommendation: action.recommendation,
      alternatives: action.alternatives,
      evidence: {
        ruleVersion: rule.version,
        evidenceLevel: rule.evidenceLevel,
        references: rule.references,
        clinicalData: this.extractClinicalData(context),
        calculatedValues: {},
      },
      context,
      triggeredAt: now,
      triggeredBy: "CDS_ENGINE",
      status: AlertStatus.ACTIVE,
      acknowledgedAt: null,
      acknowledgedBy: null,
      overriddenAt: null,
      overriddenBy: null,
      overrideReason: null,
      dismissedAt: null,
      dismissedBy: null,
      expiresAt: null,
      requiresOverride: action.requiresOverride,
      notificationSent: false,
      escalated: action.escalate,
      escalationLevel: action.escalationLevel,
    };

    return alert;
  }

  /**
   * Generate suggestions from rule
   */
  private generateSuggestions(
    rule: CDSRule,
    context: CDSContext,
  ): CDSSuggestion[] {
    const suggestions: CDSSuggestion[] = [];

    rule.actions.forEach((action, index) => {
      if (action.recommendation) {
        suggestions.push({
          id: `${rule.id}-suggestion-${index}`,
          type: this.mapCategoryToSuggestionType(rule.category),
          title: rule.name,
          description: action.recommendation,
          evidence: rule.references,
          action: null,
          priority: rule.priority,
        });
      }
    });

    return suggestions;
  }

  /**
   * Map rule category to suggestion type
   */
  private mapCategoryToSuggestionType(
    category: RuleCategory,
  ): CDSSuggestion["type"] {
    const mapping: Record<RuleCategory, CDSSuggestion["type"]> = {
      [RuleCategory.DRUG_INTERACTION]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.DRUG_ALLERGY]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.DUPLICATE_THERAPY]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.AGE_DOSING]: "DOSE_ADJUSTMENT",
      [RuleCategory.RENAL_DOSING]: "DOSE_ADJUSTMENT",
      [RuleCategory.HEPATIC_DOSING]: "DOSE_ADJUSTMENT",
      [RuleCategory.LAB_MONITORING]: "LAB_MONITORING",
      [RuleCategory.DIAGNOSIS_GUIDELINE]: "CLINICAL_GUIDELINE",
      [RuleCategory.PREVENTIVE_CARE]: "PREVENTIVE_CARE",
      [RuleCategory.ORDER_SET]: "ORDER_SET",
      [RuleCategory.CONTRAINDICATION]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.PREGNANCY]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.LACTATION]: "ALTERNATIVE_MEDICATION",
      [RuleCategory.QUALITY_MEASURE]: "CLINICAL_GUIDELINE",
      [RuleCategory.CLINICAL_PATHWAY]: "CLINICAL_GUIDELINE",
    };

    return mapping[category] || "CLINICAL_GUIDELINE";
  }

  /**
   * Filter rules based on request scope
   */
  private filterRules(request: CDSEvaluationRequest): CDSRule[] {
    const rules: CDSRule[] = [];

    this.rules.forEach((rule) => {
      // Skip if rule is in exclude list
      if (request.excludeRules?.includes(rule.id)) {
        return;
      }

      // Filter by scope if provided
      if (request.scope && request.scope.length > 0) {
        if (!request.scope.includes(rule.category)) {
          return;
        }
      }

      rules.push(rule);
    });

    return rules;
  }

  /**
   * Check if rule is currently active
   */
  private isRuleActive(rule: CDSRule): boolean {
    const now = new Date();

    if (rule.effectiveDate && new Date(rule.effectiveDate) > now) {
      return false;
    }

    if (rule.expirationDate && new Date(rule.expirationDate) < now) {
      return false;
    }

    return true;
  }

  /**
   * Extract clinical data for evidence
   */
  private extractClinicalData(context: CDSContext): Record<string, any> {
    return {
      age: context.patientAge,
      weight: context.patientWeight,
      gender: context.patientGender,
      pregnant: context.isPregnant,
      lactating: context.isLactating,
      medicationCount: context.activeMedications.length,
      diagnosisCount: context.diagnoses.length,
      allergyCount: context.allergies.length,
    };
  }

  /**
   * Generate cache key for evaluation
   */
  private getCacheKey(request: CDSEvaluationRequest): string {
    return `${request.patientId}-${request.trigger}-${JSON.stringify(request.scope || [])}`;
  }

  /**
   * Audit evaluation
   */
  private async auditEvaluation(
    request: CDSEvaluationRequest,
    result: CDSEvaluationResult,
  ): Promise<void> {
    try {
      await auditLogger.log({
        resourceType: "patient",
        resourceId: request.patientId,
        action: "read",
        actor: {
          userId: "CDS_ENGINE",
          username: "CDS Engine",
          role: "system",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          trigger: request.trigger,
          alertsGenerated: result.alerts.length,
          suggestionsGenerated: result.suggestions.length,
          evaluationTime: result.evaluationTime,
        },
      });
    } catch (error) {
      console.error("Failed to audit CDS evaluation:", error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomUUID?.() || Math.random().toString(36).substring(2);
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }
}

// Export singleton instance
export const cdsEngine = new CDSEngine();
