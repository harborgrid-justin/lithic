/**
 * Custom SDOH Screening Tool Builder
 * Configurable screening tools with branching logic
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// Custom Question Builder Types
// ============================================================================

export enum CustomQuestionType {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  NUMBER = "NUMBER",
  DATE = "DATE",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT",
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  BOOLEAN = "BOOLEAN",
  SCALE = "SCALE", // 1-10 scale
  LIKERT = "LIKERT", // Strongly disagree to strongly agree
}

export interface CustomQuestion {
  id: string;
  type: CustomQuestionType;
  text: string;
  translations?: Record<string, string>; // language code -> translated text
  description?: string;
  required: boolean;
  options?: CustomQuestionOption[];
  validation?: QuestionValidation;
  branchingLogic?: BranchingLogic[];
  category?: string;
  tags?: string[];
  scoring?: ScoringRule[];
  loincCode?: string;
  snomedCode?: string;
}

export interface CustomQuestionOption {
  value: string;
  label: string;
  translations?: Record<string, string>;
  score?: number;
  triggers?: string[]; // Trigger resource categories
  next?: string; // Next question ID for branching
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string; // Custom validation function name
  errorMessage?: string;
}

export interface BranchingLogic {
  condition: BranchCondition;
  action: BranchAction;
}

export interface BranchCondition {
  type: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in_range";
  questionId?: string; // If comparing to another question
  value: any;
  operator?: "AND" | "OR";
  conditions?: BranchCondition[]; // Nested conditions
}

export interface BranchAction {
  type: "show" | "hide" | "skip_to" | "end" | "trigger_alert";
  targetQuestionIds?: string[];
  skipToQuestionId?: string;
  alertMessage?: string;
  alertSeverity?: "info" | "warning" | "error";
}

export interface ScoringRule {
  condition: BranchCondition;
  score: number;
  weight?: number;
}

// ============================================================================
// Custom Screener Definition
// ============================================================================

export interface CustomScreener {
  id: string;
  name: string;
  version: string;
  organizationId: string;
  description: string;
  category: ScreenerCategory;
  questions: CustomQuestion[];
  scoringSystem?: ScoringSystem;
  riskStratification?: RiskStratification;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isTemplate: boolean;
  metadata?: Record<string, any>;
}

export enum ScreenerCategory {
  SDOH = "SDOH",
  BEHAVIORAL_HEALTH = "BEHAVIORAL_HEALTH",
  PEDIATRIC = "PEDIATRIC",
  GERIATRIC = "GERIATRIC",
  MATERNAL_HEALTH = "MATERNAL_HEALTH",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  PREVENTION = "PREVENTION",
  CUSTOM = "CUSTOM",
}

export interface ScoringSystem {
  method: "sum" | "weighted" | "categorical" | "custom";
  ranges?: ScoreRange[];
  customFunction?: string;
}

export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  severity: "low" | "moderate" | "high" | "critical";
  color?: string;
  recommendations?: string[];
}

export interface RiskStratification {
  enabled: boolean;
  algorithm: "score_based" | "domain_based" | "custom";
  thresholds?: RiskThreshold[];
}

export interface RiskThreshold {
  score: number;
  level: "low" | "moderate" | "high" | "critical";
  interventions: string[];
}

// ============================================================================
// Screener Response
// ============================================================================

export interface ScreenerResponse {
  questionId: string;
  value: any;
  score?: number;
  timestamp: Date;
}

export interface ScreenerSubmission {
  screenerId: string;
  patientId: string;
  organizationId: string;
  encounterId?: string;
  responses: ScreenerResponse[];
  completedBy: string;
  completedAt: Date;
  language: string;
  metadata?: Record<string, any>;
}

export interface ScreenerResult {
  submissionId: string;
  screenerId: string;
  patientId: string;
  responses: ScreenerResponse[];
  totalScore: number;
  scoreBreakdown?: Record<string, number>;
  riskLevel: "low" | "moderate" | "high" | "critical";
  identifiedNeeds: IdentifiedNeed[];
  triggeredAlerts: Alert[];
  recommendations: Recommendation[];
  completedAt: Date;
  completedBy: string;
}

export interface IdentifiedNeed {
  category: string;
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  questions: string[];
  resourceTypes: string[];
}

export interface Alert {
  severity: "info" | "warning" | "error";
  message: string;
  questionId: string;
  timestamp: Date;
}

export interface Recommendation {
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  description: string;
  actions: string[];
  resourceTypes: string[];
}

// ============================================================================
// Question Builder Functions
// ============================================================================

export class QuestionBuilder {
  private question: Partial<CustomQuestion>;

  constructor(id: string, type: CustomQuestionType) {
    this.question = {
      id,
      type,
      required: false,
      options: [],
      branchingLogic: [],
      scoring: [],
      tags: [],
    };
  }

  setText(text: string, translations?: Record<string, string>): this {
    this.question.text = text;
    this.question.translations = translations;
    return this;
  }

  setDescription(description: string): this {
    this.question.description = description;
    return this;
  }

  setRequired(required: boolean): this {
    this.question.required = required;
    return this;
  }

  addOption(option: CustomQuestionOption): this {
    if (!this.question.options) {
      this.question.options = [];
    }
    this.question.options.push(option);
    return this;
  }

  setValidation(validation: QuestionValidation): this {
    this.question.validation = validation;
    return this;
  }

  addBranchingLogic(logic: BranchingLogic): this {
    if (!this.question.branchingLogic) {
      this.question.branchingLogic = [];
    }
    this.question.branchingLogic.push(logic);
    return this;
  }

  setCategory(category: string): this {
    this.question.category = category;
    return this;
  }

  addTag(tag: string): this {
    if (!this.question.tags) {
      this.question.tags = [];
    }
    this.question.tags.push(tag);
    return this;
  }

  addScoringRule(rule: ScoringRule): this {
    if (!this.question.scoring) {
      this.question.scoring = [];
    }
    this.question.scoring.push(rule);
    return this;
  }

  setCodes(loincCode?: string, snomedCode?: string): this {
    this.question.loincCode = loincCode;
    this.question.snomedCode = snomedCode;
    return this;
  }

  build(): CustomQuestion {
    if (!this.question.text) {
      throw new Error("Question text is required");
    }
    return this.question as CustomQuestion;
  }
}

// ============================================================================
// Screener Builder Functions
// ============================================================================

export class ScreenerBuilder {
  private screener: Partial<CustomScreener>;

  constructor(name: string, organizationId: string) {
    this.screener = {
      id: generateScreenerId(),
      name,
      organizationId,
      version: "1.0.0",
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isTemplate: false,
    };
  }

  setDescription(description: string): this {
    this.screener.description = description;
    return this;
  }

  setCategory(category: ScreenerCategory): this {
    this.screener.category = category;
    return this;
  }

  addQuestion(question: CustomQuestion): this {
    if (!this.screener.questions) {
      this.screener.questions = [];
    }
    this.screener.questions.push(question);
    return this;
  }

  setScoringSystem(scoringSystem: ScoringSystem): this {
    this.screener.scoringSystem = scoringSystem;
    return this;
  }

  setRiskStratification(riskStratification: RiskStratification): this {
    this.screener.riskStratification = riskStratification;
    return this;
  }

  setCreatedBy(userId: string): this {
    this.screener.createdBy = userId;
    return this;
  }

  setIsTemplate(isTemplate: boolean): this {
    this.screener.isTemplate = isTemplate;
    return this;
  }

  setMetadata(metadata: Record<string, any>): this {
    this.screener.metadata = metadata;
    return this;
  }

  build(): CustomScreener {
    if (!this.screener.questions || this.screener.questions.length === 0) {
      throw new Error("Screener must have at least one question");
    }
    return this.screener as CustomScreener;
  }
}

// ============================================================================
// Screener Processing Functions
// ============================================================================

export class ScreenerProcessor {
  private screener: CustomScreener;

  constructor(screener: CustomScreener) {
    this.screener = screener;
  }

  /**
   * Process screener responses and generate result
   */
  process(submission: ScreenerSubmission): ScreenerResult {
    const totalScore = this.calculateScore(submission.responses);
    const scoreBreakdown = this.calculateScoreBreakdown(submission.responses);
    const riskLevel = this.determineRiskLevel(totalScore);
    const identifiedNeeds = this.identifyNeeds(submission.responses);
    const triggeredAlerts = this.checkAlerts(submission.responses);
    const recommendations = this.generateRecommendations(
      identifiedNeeds,
      riskLevel
    );

    return {
      submissionId: generateSubmissionId(),
      screenerId: submission.screenerId,
      patientId: submission.patientId,
      responses: submission.responses,
      totalScore,
      scoreBreakdown,
      riskLevel,
      identifiedNeeds,
      triggeredAlerts,
      recommendations,
      completedAt: submission.completedAt,
      completedBy: submission.completedBy,
    };
  }

  /**
   * Calculate total score
   */
  private calculateScore(responses: ScreenerResponse[]): number {
    if (!this.screener.scoringSystem) return 0;

    let totalScore = 0;

    responses.forEach((response) => {
      const question = this.screener.questions.find(
        (q) => q.id === response.questionId
      );
      if (!question) return;

      // Apply scoring rules
      if (question.scoring) {
        question.scoring.forEach((rule) => {
          if (this.evaluateCondition(rule.condition, response.value, responses)) {
            const weight = rule.weight || 1;
            totalScore += rule.score * weight;
          }
        });
      }

      // Check option scores
      if (question.options && typeof response.value === "string") {
        const option = question.options.find((opt) => opt.value === response.value);
        if (option?.score) {
          totalScore += option.score;
        }
      }
    });

    return totalScore;
  }

  /**
   * Calculate score breakdown by category
   */
  private calculateScoreBreakdown(
    responses: ScreenerResponse[]
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};

    responses.forEach((response) => {
      const question = this.screener.questions.find(
        (q) => q.id === response.questionId
      );
      if (!question?.category) return;

      if (!breakdown[question.category]) {
        breakdown[question.category] = 0;
      }

      breakdown[question.category] += response.score || 0;
    });

    return breakdown;
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(
    score: number
  ): "low" | "moderate" | "high" | "critical" {
    if (!this.screener.scoringSystem?.ranges) {
      // Default ranges
      if (score === 0) return "low";
      if (score <= 5) return "moderate";
      if (score <= 10) return "high";
      return "critical";
    }

    for (const range of this.screener.scoringSystem.ranges) {
      if (score >= range.min && score <= range.max) {
        return range.severity;
      }
    }

    return "moderate";
  }

  /**
   * Identify needs from responses
   */
  private identifyNeeds(responses: ScreenerResponse[]): IdentifiedNeed[] {
    const needsMap = new Map<string, IdentifiedNeed>();

    responses.forEach((response) => {
      const question = this.screener.questions.find(
        (q) => q.id === response.questionId
      );
      if (!question) return;

      // Check if response triggers any needs
      if (question.options && typeof response.value === "string") {
        const option = question.options.find((opt) => opt.value === response.value);
        if (option?.triggers) {
          option.triggers.forEach((trigger) => {
            if (!needsMap.has(trigger)) {
              needsMap.set(trigger, {
                category: trigger,
                severity: this.determineSeverity(option.score || 0),
                description: `${question.text}: ${option.label}`,
                questions: [question.id],
                resourceTypes: [trigger],
              });
            } else {
              const need = needsMap.get(trigger)!;
              need.questions.push(question.id);
            }
          });
        }
      }
    });

    return Array.from(needsMap.values());
  }

  /**
   * Check for triggered alerts
   */
  private checkAlerts(responses: ScreenerResponse[]): Alert[] {
    const alerts: Alert[] = [];

    responses.forEach((response) => {
      const question = this.screener.questions.find(
        (q) => q.id === response.questionId
      );
      if (!question?.branchingLogic) return;

      question.branchingLogic.forEach((logic) => {
        if (
          logic.action.type === "trigger_alert" &&
          this.evaluateCondition(logic.condition, response.value, responses)
        ) {
          alerts.push({
            severity: logic.action.alertSeverity || "info",
            message: logic.action.alertMessage || "Alert triggered",
            questionId: question.id,
            timestamp: new Date(),
          });
        }
      });
    });

    return alerts;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    needs: IdentifiedNeed[],
    riskLevel: string
  ): Recommendation[] {
    return needs.map((need) => ({
      priority:
        need.severity === "critical"
          ? "urgent"
          : need.severity === "high"
            ? "high"
            : need.severity === "moderate"
              ? "medium"
              : "low",
      category: need.category,
      description: `Address ${need.category} needs`,
      actions: [`Connect patient with ${need.category} resources`],
      resourceTypes: need.resourceTypes,
    }));
  }

  /**
   * Evaluate branching condition
   */
  private evaluateCondition(
    condition: BranchCondition,
    value: any,
    allResponses: ScreenerResponse[]
  ): boolean {
    switch (condition.type) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return Array.isArray(value) && value.includes(condition.value);
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "in_range":
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const num = Number(value);
          return num >= condition.value[0] && num <= condition.value[1];
        }
        return false;
      default:
        return false;
    }
  }

  private determineSeverity(score: number): "low" | "moderate" | "high" | "critical" {
    if (score === 0) return "low";
    if (score <= 2) return "moderate";
    if (score === 3) return "high";
    return "critical";
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateScreenerId(): string {
  return `screener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSubmissionId(): string {
  return `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const CustomQuestionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(CustomQuestionType),
  text: z.string(),
  translations: z.record(z.string()).optional(),
  description: z.string().optional(),
  required: z.boolean(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        translations: z.record(z.string()).optional(),
        score: z.number().optional(),
        triggers: z.array(z.string()).optional(),
        next: z.string().optional(),
      })
    )
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  loincCode: z.string().optional(),
  snomedCode: z.string().optional(),
});

export const CustomScreenerSchema = z.object({
  name: z.string(),
  organizationId: z.string(),
  description: z.string(),
  category: z.nativeEnum(ScreenerCategory),
  questions: z.array(CustomQuestionSchema),
  version: z.string().default("1.0.0"),
  isTemplate: z.boolean().default(false),
});
