/**
 * SDOH Screening Engine
 *
 * Core engine for administering SDOH screening questionnaires,
 * processing responses, and calculating risk scores.
 */

import type {
  SDOHScreening,
  Questionnaire,
  QuestionnaireType,
  ScreeningResponse,
  IdentifiedNeed,
  RiskLevel,
  SDOHDomain,
  Question,
  ConditionalLogic,
  Priority,
} from "@/types/sdoh";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Screening Engine Class
// ============================================================================

export class ScreeningEngine {
  private questionnaire: Questionnaire;
  private responses: Map<string, ScreeningResponse>;
  private identifiedNeeds: IdentifiedNeed[];

  constructor(questionnaire: Questionnaire) {
    this.questionnaire = questionnaire;
    this.responses = new Map();
    this.identifiedNeeds = [];
  }

  /**
   * Initialize a new screening session
   */
  initializeScreening(
    patientId: string,
    administeredBy: string,
    encounterId?: string,
    language = "en"
  ): Partial<SDOHScreening> {
    return {
      id: uuidv4(),
      patientId,
      encounterId: encounterId || null,
      questionnaireType: this.questionnaire.type,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      completedAt: null,
      administeredBy,
      language,
      responses: [],
      riskScore: null,
      riskLevel: null,
      identifiedNeeds: [],
      recommendedZCodes: [],
      notes: null,
      followUpRequired: false,
      followUpDate: null,
    };
  }

  /**
   * Get all questions that should be displayed based on current responses
   */
  getActiveQuestions(): Question[] {
    const activeQuestions: Question[] = [];

    for (const section of this.questionnaire.sections) {
      // Check section conditional logic
      if (section.conditional && !this.evaluateConditional(section.conditional)) {
        continue;
      }

      for (const question of section.questions) {
        // Check question conditional logic
        if (question.conditional && !this.evaluateConditional(question.conditional)) {
          continue;
        }

        activeQuestions.push(question);
      }
    }

    return activeQuestions.sort((a, b) => a.order - b.order);
  }

  /**
   * Record a response to a question
   */
  recordResponse(
    questionId: string,
    answer: any,
    answerText: string
  ): ScreeningResponse {
    const question = this.findQuestion(questionId);

    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    // Validate response
    this.validateResponse(question, answer);

    // Determine risk indicator
    const riskIndicator = this.isRiskIndicator(question, answer);

    const response: ScreeningResponse = {
      questionId,
      questionText: question.text,
      answer,
      answerText,
      domain: question.domain,
      riskIndicator,
      weight: question.riskWeighting,
    };

    this.responses.set(questionId, response);

    // Check if this response triggers need identification
    if (riskIndicator) {
      this.identifyNeedFromResponse(question, response);
    }

    return response;
  }

  /**
   * Calculate overall risk score based on all responses
   */
  calculateRiskScore(): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const response of this.responses.values()) {
      if (response.riskIndicator) {
        totalScore += response.weight;
      }
      totalWeight += response.weight;
    }

    // Normalize to 0-100 scale
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  /**
   * Determine risk level based on score and rules
   */
  determineRiskLevel(score: number): RiskLevel {
    const applicableRules = this.questionnaire.scoringRules
      .filter((rule) => score >= rule.threshold)
      .sort((a, b) => b.threshold - a.threshold);

    return applicableRules.length > 0
      ? applicableRules[0]!.riskLevel
      : RiskLevel.NONE;
  }

  /**
   * Get all identified needs from responses
   */
  getIdentifiedNeeds(): IdentifiedNeed[] {
    return this.identifiedNeeds;
  }

  /**
   * Get recommended Z-codes based on identified needs
   */
  getRecommendedZCodes(): string[] {
    const zCodes = new Set<string>();

    // Collect Z-codes from responses
    for (const response of this.responses.values()) {
      if (response.riskIndicator) {
        const question = this.findQuestion(response.questionId);
        if (question?.zCodeMappings) {
          question.zCodeMappings.forEach((code) => zCodes.add(code));
        }
      }
    }

    // Collect Z-codes from identified needs
    for (const need of this.identifiedNeeds) {
      need.zCodes.forEach((code) => zCodes.add(code));
    }

    return Array.from(zCodes).sort();
  }

  /**
   * Complete the screening and generate final results
   */
  completeScreening(): Partial<SDOHScreening> {
    const riskScore = this.calculateRiskScore();
    const riskLevel = this.determineRiskLevel(riskScore);
    const identifiedNeeds = this.getIdentifiedNeeds();
    const recommendedZCodes = this.getRecommendedZCodes();
    const followUpRequired = identifiedNeeds.some(
      (need) => need.requiresIntervention
    );

    return {
      status: "COMPLETED",
      completedAt: new Date(),
      responses: Array.from(this.responses.values()),
      riskScore,
      riskLevel,
      identifiedNeeds,
      recommendedZCodes,
      followUpRequired,
      followUpDate: followUpRequired
        ? this.calculateFollowUpDate(riskLevel)
        : null,
    };
  }

  /**
   * Get completion progress (0-100%)
   */
  getProgress(): number {
    const activeQuestions = this.getActiveQuestions();
    const requiredQuestions = activeQuestions.filter((q) => q.required);
    const answeredRequired = requiredQuestions.filter((q) =>
      this.responses.has(q.id)
    );

    return requiredQuestions.length > 0
      ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
      : 0;
  }

  /**
   * Validate that all required questions are answered
   */
  isComplete(): boolean {
    const activeQuestions = this.getActiveQuestions();
    const requiredQuestions = activeQuestions.filter((q) => q.required);

    return requiredQuestions.every((q) => this.responses.has(q.id));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private findQuestion(questionId: string): Question | undefined {
    for (const section of this.questionnaire.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  }

  private evaluateConditional(conditional: ConditionalLogic): boolean {
    const results = conditional.conditions.map((condition) =>
      this.evaluateCondition(condition)
    );

    return conditional.operator === "AND"
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  private evaluateCondition(condition: {
    questionId: string;
    operator: string;
    value: any;
  }): boolean {
    const response = this.responses.get(condition.questionId);
    if (!response) return false;

    const answer = response.answer;

    switch (condition.operator) {
      case "equals":
        return answer === condition.value;
      case "notEquals":
        return answer !== condition.value;
      case "contains":
        return Array.isArray(answer)
          ? answer.includes(condition.value)
          : false;
      case "greaterThan":
        return typeof answer === "number" && answer > condition.value;
      case "lessThan":
        return typeof answer === "number" && answer < condition.value;
      default:
        return false;
    }
  }

  private validateResponse(question: Question, answer: any): void {
    if (question.required && (answer === null || answer === undefined || answer === "")) {
      throw new Error(`Question "${question.text}" is required`);
    }

    if (question.validation) {
      const validation = question.validation;

      switch (validation.type) {
        case "min":
          if (typeof answer === "number" && answer < validation.value) {
            throw new Error(validation.message);
          }
          break;
        case "max":
          if (typeof answer === "number" && answer > validation.value) {
            throw new Error(validation.message);
          }
          break;
        case "pattern":
          if (typeof answer === "string" && !new RegExp(validation.value).test(answer)) {
            throw new Error(validation.message);
          }
          break;
      }
    }
  }

  private isRiskIndicator(question: Question, answer: any): boolean {
    // Check if the answer has a risk score > 0
    if (question.options) {
      const selectedOption = question.options.find((opt) => opt.value === answer);
      return selectedOption ? selectedOption.riskScore > 0 : false;
    }

    // For yes/no questions, "yes" typically indicates risk
    if (question.type === "YES_NO") {
      return answer === true || answer === "yes" || answer === "YES";
    }

    return false;
  }

  private identifyNeedFromResponse(
    question: Question,
    response: ScreeningResponse
  ): void {
    // Check if a need for this domain already exists
    const existingNeed = this.identifiedNeeds.find(
      (need) => need.domain === question.domain
    );

    if (existingNeed) {
      // Update existing need
      if (question.zCodeMappings.length > 0) {
        existingNeed.zCodes.push(...question.zCodeMappings);
        existingNeed.zCodes = Array.from(new Set(existingNeed.zCodes)); // Remove duplicates
      }
    } else {
      // Create new identified need
      const severity = this.determineSeverityFromWeight(response.weight);

      const need: IdentifiedNeed = {
        id: uuidv4(),
        domain: question.domain,
        category: this.getDomainCategory(question.domain),
        description: `${question.domain.replace(/_/g, " ")} need identified: ${response.answerText}`,
        severity,
        identified: new Date(),
        zCodes: question.zCodeMappings || [],
        requiresIntervention: severity === RiskLevel.HIGH || severity === RiskLevel.CRITICAL,
        priority: this.severityToPriority(severity),
      };

      this.identifiedNeeds.push(need);
    }
  }

  private determineSeverityFromWeight(weight: number): RiskLevel {
    if (weight >= 8) return RiskLevel.CRITICAL;
    if (weight >= 6) return RiskLevel.HIGH;
    if (weight >= 4) return RiskLevel.MODERATE;
    if (weight >= 2) return RiskLevel.LOW;
    return RiskLevel.NONE;
  }

  private severityToPriority(severity: RiskLevel): Priority {
    switch (severity) {
      case RiskLevel.CRITICAL:
        return Priority.URGENT;
      case RiskLevel.HIGH:
        return Priority.HIGH;
      case RiskLevel.MODERATE:
        return Priority.MEDIUM;
      default:
        return Priority.LOW;
    }
  }

  private getDomainCategory(domain: SDOHDomain): string {
    const categoryMap: Record<SDOHDomain, string> = {
      [SDOHDomain.HOUSING_INSTABILITY]: "Housing",
      [SDOHDomain.FOOD_INSECURITY]: "Food",
      [SDOHDomain.TRANSPORTATION]: "Transportation",
      [SDOHDomain.UTILITY_NEEDS]: "Utilities",
      [SDOHDomain.INTERPERSONAL_SAFETY]: "Safety",
      [SDOHDomain.EMPLOYMENT]: "Employment",
      [SDOHDomain.EDUCATION]: "Education",
      [SDOHDomain.FINANCIAL_STRAIN]: "Financial",
      [SDOHDomain.SOCIAL_ISOLATION]: "Social Connection",
      [SDOHDomain.HEALTHCARE_ACCESS]: "Healthcare Access",
      [SDOHDomain.LEGAL_ISSUES]: "Legal",
      [SDOHDomain.CHILDCARE]: "Childcare",
    };
    return categoryMap[domain] || domain;
  }

  private calculateFollowUpDate(riskLevel: RiskLevel): Date {
    const daysMap: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: 7,
      [RiskLevel.HIGH]: 14,
      [RiskLevel.MODERATE]: 30,
      [RiskLevel.LOW]: 60,
      [RiskLevel.NONE]: 90,
    };

    const days = daysMap[riskLevel] || 30;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + days);
    return followUpDate;
  }
}

// ============================================================================
// Screening Utilities
// ============================================================================

/**
 * Calculate screening completion rate for a population
 */
export function calculateScreeningRate(
  totalPatients: number,
  screenedPatients: number
): number {
  return totalPatients > 0
    ? Math.round((screenedPatients / totalPatients) * 100)
    : 0;
}

/**
 * Determine if a screening is due based on last screening date
 */
export function isScreeningDue(
  lastScreeningDate: Date | null,
  intervalMonths = 12
): boolean {
  if (!lastScreeningDate) return true;

  const monthsSinceLastScreening =
    (Date.now() - lastScreeningDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  return monthsSinceLastScreening >= intervalMonths;
}

/**
 * Get next recommended screening date
 */
export function getNextScreeningDate(
  lastScreeningDate: Date,
  intervalMonths = 12
): Date {
  const nextDate = new Date(lastScreeningDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  return nextDate;
}

/**
 * Aggregate needs across multiple screenings
 */
export function aggregateNeeds(
  screenings: SDOHScreening[]
): Map<SDOHDomain, number> {
  const needsByDomain = new Map<SDOHDomain, number>();

  for (const screening of screenings) {
    for (const need of screening.identifiedNeeds) {
      const current = needsByDomain.get(need.domain) || 0;
      needsByDomain.set(need.domain, current + 1);
    }
  }

  return needsByDomain;
}

/**
 * Calculate positive screening rate
 */
export function calculatePositiveScreeningRate(
  screenings: SDOHScreening[]
): number {
  const completedScreenings = screenings.filter(
    (s) => s.status === "COMPLETED"
  );
  const positiveScreenings = completedScreenings.filter(
    (s) => s.identifiedNeeds.length > 0
  );

  return completedScreenings.length > 0
    ? Math.round((positiveScreenings.length / completedScreenings.length) * 100)
    : 0;
}

/**
 * Get risk level distribution
 */
export function getRiskDistribution(
  screenings: SDOHScreening[]
): Record<RiskLevel, number> {
  const distribution: Record<RiskLevel, number> = {
    [RiskLevel.NONE]: 0,
    [RiskLevel.LOW]: 0,
    [RiskLevel.MODERATE]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.CRITICAL]: 0,
  };

  for (const screening of screenings) {
    if (screening.riskLevel) {
      distribution[screening.riskLevel]++;
    }
  }

  return distribution;
}

/**
 * Multi-language support - Get questionnaire in specified language
 */
export function getLocalizedQuestionnaire(
  questionnaire: Questionnaire,
  language: string
): Questionnaire {
  // In a real implementation, this would load translations from a database
  // For now, we'll return the original questionnaire
  // Language translation would be handled by a separate translation service
  return questionnaire;
}

/**
 * Export screening results to common formats
 */
export function exportScreeningResults(
  screening: SDOHScreening,
  format: "JSON" | "CSV" | "PDF" = "JSON"
): string {
  switch (format) {
    case "JSON":
      return JSON.stringify(screening, null, 2);
    case "CSV":
      return convertToCSV(screening);
    case "PDF":
      // PDF generation would be handled by a separate library
      return JSON.stringify(screening, null, 2);
    default:
      return JSON.stringify(screening, null, 2);
  }
}

function convertToCSV(screening: SDOHScreening): string {
  const headers = [
    "Question ID",
    "Question",
    "Answer",
    "Domain",
    "Risk Indicator",
  ];

  const rows = screening.responses.map((r) => [
    r.questionId,
    r.questionText,
    r.answerText,
    r.domain,
    r.riskIndicator ? "Yes" : "No",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
}
