/**
 * Care Protocol Engine
 * Evidence-based clinical pathway execution with variance tracking and outcome measurement
 */

import {
  CareProtocol,
  ProtocolExecution,
  ProtocolExecutionStatus,
  ProtocolVariance,
  ProtocolOutcomeResult,
  ProtocolStep,
  ProtocolStepType,
  VarianceType,
  EvidenceLevel,
  ProtocolCategory,
  ProtocolStatus,
  WorkflowDefinition,
} from "@/types/workflow";
import { workflowEngine } from "./engine";

// ============================================================================
// Care Protocol Manager Class
// ============================================================================

export class CareProtocolManager {
  private protocols: Map<string, CareProtocol> = new Map();
  private executions: Map<string, ProtocolExecution> = new Map();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Create a new care protocol
   */
  async createProtocol(params: CreateProtocolParams): Promise<CareProtocol> {
    const protocol: CareProtocol = {
      id: this.generateId(),
      name: params.name,
      code: params.code,
      version: params.version || "1.0",
      description: params.description,
      category: params.category,
      condition: params.condition,
      icd10Codes: params.icd10Codes || [],
      workflowDefinitionId: params.workflowDefinitionId,
      steps: params.steps,
      outcomes: params.outcomes,
      evidenceLevel: params.evidenceLevel || EvidenceLevel.C,
      source: params.source || "",
      references: params.references || [],
      status: ProtocolStatus.DRAFT,
      effectiveDate: params.effectiveDate || new Date(),
      expirationDate: params.expirationDate || null,
      metadata: params.metadata || {},
      organizationId: params.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: params.createdBy,
      updatedBy: params.createdBy,
    };

    this.protocols.set(protocol.id, protocol);
    this.emitEvent("protocol:created", protocol);

    return protocol;
  }

  /**
   * Activate protocol
   */
  async activateProtocol(protocolId: string, userId: string): Promise<CareProtocol> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error("Protocol not found");
    }

    // Validate protocol before activation
    this.validateProtocol(protocol);

    protocol.status = ProtocolStatus.ACTIVE;
    protocol.updatedAt = new Date();
    protocol.updatedBy = userId;

    this.emitEvent("protocol:activated", protocol);

    return protocol;
  }

  /**
   * Start protocol execution
   */
  async startProtocolExecution(
    protocolId: string,
    context: ProtocolExecutionContext
  ): Promise<ProtocolExecution> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error("Protocol not found");
    }

    if (protocol.status !== ProtocolStatus.ACTIVE) {
      throw new Error("Protocol is not active");
    }

    const execution: ProtocolExecution = {
      id: this.generateId(),
      protocolId: protocol.id,
      protocol,
      workflowInstanceId: "",
      patientId: context.patientId,
      encounterId: context.encounterId,
      startedBy: context.userId,
      startedAt: new Date(),
      completedAt: null,
      status: ProtocolExecutionStatus.IN_PROGRESS,
      currentStep: 0,
      completedSteps: [],
      variances: [],
      outcomes: [],
      metadata: {},
      organizationId: context.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: context.userId,
      updatedBy: context.userId,
    };

    // Start associated workflow
    const workflowInstance = await workflowEngine.startWorkflow(
      context.workflowDefinition,
      {
        userId: context.userId,
        patientId: context.patientId,
        encounterId: context.encounterId,
        protocolExecutionId: execution.id,
        organizationId: context.organizationId,
      },
      {
        protocolId: protocol.id,
        protocolName: protocol.name,
        steps: protocol.steps,
        patientId: context.patientId,
      }
    );

    execution.workflowInstanceId = workflowInstance.id;
    this.executions.set(execution.id, execution);

    this.emitEvent("protocol:execution:started", execution);

    return execution;
  }

  /**
   * Complete protocol step
   */
  async completeStep(
    executionId: string,
    stepId: string,
    context: StepCompletionContext
  ): Promise<ProtocolExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    const protocol = execution.protocol!;
    const step = protocol.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error("Protocol step not found");
    }

    // Check if step was modified (variance)
    if (context.isVariance) {
      await this.recordVariance(executionId, {
        stepId,
        type: context.varianceType!,
        reason: context.varianceReason!,
        documentedBy: context.userId,
        approved: false,
      });
    }

    // Mark step as completed
    if (!execution.completedSteps.includes(stepId)) {
      execution.completedSteps.push(stepId);
    }

    // Update current step
    const stepIndex = protocol.steps.findIndex((s) => s.id === stepId);
    execution.currentStep = stepIndex + 1;

    execution.updatedAt = new Date();
    execution.updatedBy = context.userId;

    this.emitEvent("protocol:step:completed", { execution, step });

    // Check if all steps are completed
    if (execution.completedSteps.length === protocol.steps.length) {
      await this.completeExecution(executionId, context.userId);
    }

    return execution;
  }

  /**
   * Record protocol variance
   */
  async recordVariance(
    executionId: string,
    variance: Omit<ProtocolVariance, "id" | "documentedAt" | "approvedBy" | "approvedAt">
  ): Promise<ProtocolVariance> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    const newVariance: ProtocolVariance = {
      id: this.generateId(),
      ...variance,
      documentedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    };

    execution.variances.push(newVariance);
    execution.updatedAt = new Date();

    this.emitEvent("protocol:variance:recorded", {
      execution,
      variance: newVariance,
    });

    return newVariance;
  }

  /**
   * Approve variance
   */
  async approveVariance(
    executionId: string,
    varianceId: string,
    userId: string
  ): Promise<ProtocolVariance> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    const variance = execution.variances.find((v) => v.id === varianceId);
    if (!variance) {
      throw new Error("Variance not found");
    }

    variance.approved = true;
    variance.approvedBy = userId;
    variance.approvedAt = new Date();

    execution.updatedAt = new Date();

    this.emitEvent("protocol:variance:approved", { execution, variance });

    return variance;
  }

  /**
   * Record outcome measurement
   */
  async recordOutcome(
    executionId: string,
    outcome: Omit<ProtocolOutcomeResult, "measuredAt">
  ): Promise<ProtocolOutcomeResult> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    const newOutcome: ProtocolOutcomeResult = {
      ...outcome,
      measuredAt: new Date(),
    };

    execution.outcomes.push(newOutcome);
    execution.updatedAt = new Date();

    this.emitEvent("protocol:outcome:recorded", { execution, outcome: newOutcome });

    return newOutcome;
  }

  /**
   * Complete protocol execution
   */
  async completeExecution(executionId: string, userId: string): Promise<ProtocolExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    execution.status = ProtocolExecutionStatus.COMPLETED;
    execution.completedAt = new Date();
    execution.updatedAt = new Date();
    execution.updatedBy = userId;

    this.emitEvent("protocol:execution:completed", execution);

    // Generate completion report
    const report = this.generateCompletionReport(execution);
    this.emitEvent("protocol:report:generated", report);

    return execution;
  }

  /**
   * Discontinue protocol execution
   */
  async discontinueExecution(
    executionId: string,
    reason: string,
    userId: string
  ): Promise<ProtocolExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    execution.status = ProtocolExecutionStatus.DISCONTINUED;
    execution.completedAt = new Date();
    execution.metadata.discontinuationReason = reason;
    execution.metadata.discontinuedBy = userId;
    execution.updatedAt = new Date();
    execution.updatedBy = userId;

    this.emitEvent("protocol:execution:discontinued", execution);

    return execution;
  }

  /**
   * Put execution on hold
   */
  async holdExecution(
    executionId: string,
    reason: string,
    userId: string
  ): Promise<ProtocolExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    execution.status = ProtocolExecutionStatus.ON_HOLD;
    execution.metadata.holdReason = reason;
    execution.metadata.heldBy = userId;
    execution.metadata.heldAt = new Date();
    execution.updatedAt = new Date();
    execution.updatedBy = userId;

    this.emitEvent("protocol:execution:held", execution);

    return execution;
  }

  /**
   * Resume execution from hold
   */
  async resumeExecution(executionId: string, userId: string): Promise<ProtocolExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error("Protocol execution not found");
    }

    if (execution.status !== ProtocolExecutionStatus.ON_HOLD) {
      throw new Error("Execution is not on hold");
    }

    execution.status = ProtocolExecutionStatus.IN_PROGRESS;
    execution.metadata.resumedBy = userId;
    execution.metadata.resumedAt = new Date();
    execution.updatedAt = new Date();
    execution.updatedBy = userId;

    this.emitEvent("protocol:execution:resumed", execution);

    return execution;
  }

  /**
   * Get protocol by condition
   */
  getProtocolsByCondition(condition: string): CareProtocol[] {
    return Array.from(this.protocols.values()).filter(
      (p) =>
        p.status === ProtocolStatus.ACTIVE &&
        (p.condition.toLowerCase().includes(condition.toLowerCase()) ||
          p.name.toLowerCase().includes(condition.toLowerCase()))
    );
  }

  /**
   * Get protocol by ICD-10 code
   */
  getProtocolsByICD10(icd10Code: string): CareProtocol[] {
    return Array.from(this.protocols.values()).filter(
      (p) => p.status === ProtocolStatus.ACTIVE && p.icd10Codes.includes(icd10Code)
    );
  }

  /**
   * Get patient protocol executions
   */
  getPatientExecutions(patientId: string): ProtocolExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.patientId === patientId
    );
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ProtocolExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.status === ProtocolExecutionStatus.IN_PROGRESS
    );
  }

  /**
   * Get variance statistics
   */
  getVarianceStatistics(protocolId?: string): VarianceStatistics {
    let executions = Array.from(this.executions.values());
    if (protocolId) {
      executions = executions.filter((e) => e.protocolId === protocolId);
    }

    const totalExecutions = executions.length;
    const executionsWithVariances = executions.filter((e) => e.variances.length > 0).length;

    const allVariances = executions.flatMap((e) => e.variances);
    const variancesByType = this.groupBy(allVariances, (v) => v.type);

    const approvedVariances = allVariances.filter((v) => v.approved).length;
    const approvalRate = allVariances.length > 0 ? (approvedVariances / allVariances.length) * 100 : 0;

    return {
      totalExecutions,
      executionsWithVariances,
      totalVariances: allVariances.length,
      variancesByType,
      approvalRate,
    };
  }

  /**
   * Get outcome statistics
   */
  getOutcomeStatistics(protocolId: string): OutcomeStatistics {
    const executions = Array.from(this.executions.values()).filter(
      (e) => e.protocolId === protocolId && e.status === ProtocolExecutionStatus.COMPLETED
    );

    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error("Protocol not found");
    }

    const outcomeStats: OutcomeStatistics = {
      totalExecutions: executions.length,
      outcomesMeasured: {},
      targetAchievementRate: {},
    };

    protocol.outcomes.forEach((outcome) => {
      const measurements = executions.flatMap((e) =>
        e.outcomes.filter((o) => o.outcomeId === outcome.id)
      );

      outcomeStats.outcomesMeasured[outcome.name] = measurements.length;

      const targetAchieved = measurements.filter((m) => m.achievedTarget).length;
      outcomeStats.targetAchievementRate[outcome.name] =
        measurements.length > 0 ? (targetAchieved / measurements.length) * 100 : 0;
    });

    return outcomeStats;
  }

  /**
   * Generate completion report
   */
  private generateCompletionReport(execution: ProtocolExecution): ProtocolCompletionReport {
    const protocol = execution.protocol!;
    const duration = execution.completedAt
      ? execution.completedAt.getTime() - execution.startedAt.getTime()
      : 0;

    return {
      executionId: execution.id,
      protocolId: protocol.id,
      protocolName: protocol.name,
      patientId: execution.patientId,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt!,
      duration,
      status: execution.status,
      totalSteps: protocol.steps.length,
      completedSteps: execution.completedSteps.length,
      variances: execution.variances,
      varianceCount: execution.variances.length,
      outcomes: execution.outcomes,
      outcomeAchievementRate: this.calculateOutcomeAchievementRate(execution),
      adherenceRate: this.calculateAdherenceRate(execution),
    };
  }

  /**
   * Calculate outcome achievement rate
   */
  private calculateOutcomeAchievementRate(execution: ProtocolExecution): number {
    if (execution.outcomes.length === 0) return 0;
    const achieved = execution.outcomes.filter((o) => o.achievedTarget).length;
    return (achieved / execution.outcomes.length) * 100;
  }

  /**
   * Calculate protocol adherence rate
   */
  private calculateAdherenceRate(execution: ProtocolExecution): number {
    const protocol = execution.protocol!;
    const totalSteps = protocol.steps.length;
    const varianceCount = execution.variances.length;

    if (totalSteps === 0) return 100;
    return ((totalSteps - varianceCount) / totalSteps) * 100;
  }

  /**
   * Validate protocol
   */
  private validateProtocol(protocol: CareProtocol): void {
    if (!protocol.name || !protocol.code) {
      throw new Error("Protocol must have name and code");
    }

    if (protocol.steps.length === 0) {
      throw new Error("Protocol must have at least one step");
    }

    if (!protocol.workflowDefinitionId) {
      throw new Error("Protocol must be linked to a workflow definition");
    }

    // Validate step ordering
    const orders = protocol.steps.map((s) => s.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error("Protocol steps must have unique order numbers");
    }
  }

  /**
   * Group items by key function
   */
  private groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Record<K, number> {
    const result = {} as Record<K, number>;
    items.forEach((item) => {
      const key = keyFn(item);
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  }

  /**
   * Register event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Protocol Template Library
// ============================================================================

export const protocolTemplates = {
  /**
   * Sepsis Management Protocol (Evidence Level A)
   */
  sepsis: (): Omit<CreateProtocolParams, "organizationId" | "createdBy"> => ({
    name: "Sepsis Management Protocol",
    code: "SEPSIS-001",
    version: "2.0",
    description: "Evidence-based sepsis management following Surviving Sepsis Campaign guidelines",
    category: ProtocolCategory.TREATMENT,
    condition: "Sepsis",
    icd10Codes: ["A41.9", "R65.20", "R65.21"],
    workflowDefinitionId: "",
    evidenceLevel: EvidenceLevel.A,
    source: "Surviving Sepsis Campaign 2021",
    references: [
      "Evans L, et al. Surviving Sepsis Campaign: International Guidelines 2021",
    ],
    steps: [
      {
        id: "step-1",
        order: 1,
        name: "Initial Recognition",
        description: "Identify sepsis using qSOFA or SIRS criteria",
        type: ProtocolStepType.ASSESSMENT,
        duration: 15,
        required: true,
        conditions: [],
        actions: [
          {
            type: "ASSESSMENT",
            description: "Calculate qSOFA score",
            parameters: {},
            required: true,
          },
        ],
        alternatives: [],
      },
      {
        id: "step-2",
        order: 2,
        name: "Obtain Cultures",
        description: "Obtain blood cultures before antibiotic administration",
        type: ProtocolStepType.PROCEDURE,
        duration: 10,
        required: true,
        conditions: [],
        actions: [
          {
            type: "LAB_ORDER",
            description: "Order blood cultures x2",
            parameters: { test: "BLOOD_CULTURE" },
            required: true,
          },
        ],
        alternatives: [],
      },
      {
        id: "step-3",
        order: 3,
        name: "Administer Antibiotics",
        description: "Administer broad-spectrum antibiotics within 1 hour",
        type: ProtocolStepType.MEDICATION,
        duration: 60,
        required: true,
        conditions: [],
        actions: [
          {
            type: "MEDICATION",
            description: "Administer broad-spectrum antibiotics",
            parameters: {},
            required: true,
          },
        ],
        alternatives: [],
      },
      {
        id: "step-4",
        order: 4,
        name: "Fluid Resuscitation",
        description: "Administer 30ml/kg crystalloid for hypotension or lactate ≥4",
        type: ProtocolStepType.INTERVENTION,
        duration: 180,
        required: true,
        conditions: [],
        actions: [
          {
            type: "FLUID_ADMINISTRATION",
            description: "Crystalloid bolus",
            parameters: { volume: "30ml/kg" },
            required: true,
          },
        ],
        alternatives: [],
      },
      {
        id: "step-5",
        order: 5,
        name: "Reassessment",
        description: "Reassess hemodynamics and lactate",
        type: ProtocolStepType.ASSESSMENT,
        duration: 30,
        required: true,
        conditions: [],
        actions: [
          {
            type: "VITAL_SIGNS",
            description: "Check vital signs",
            parameters: {},
            required: true,
          },
          {
            type: "LAB_ORDER",
            description: "Repeat lactate",
            parameters: { test: "LACTATE" },
            required: true,
          },
        ],
        alternatives: [],
      },
    ],
    outcomes: [
      {
        id: "outcome-1",
        name: "Time to Antibiotics",
        measure: "Minutes from recognition to antibiotic administration",
        target: 60,
        unit: "minutes",
        timeframe: "Initial presentation",
      },
      {
        id: "outcome-2",
        name: "Lactate Clearance",
        measure: "Percentage decrease in lactate at 6 hours",
        target: "20%",
        unit: "percentage",
        timeframe: "6 hours",
      },
      {
        id: "outcome-3",
        name: "Mortality",
        measure: "30-day mortality rate",
        target: "20%",
        unit: "percentage",
        timeframe: "30 days",
      },
    ],
  }),

  /**
   * Chest Pain Evaluation Protocol (Evidence Level B)
   */
  chestPain: (): Omit<CreateProtocolParams, "organizationId" | "createdBy"> => ({
    name: "Chest Pain Evaluation Protocol",
    code: "CHEST-001",
    version: "1.5",
    description: "Systematic chest pain evaluation for acute coronary syndrome",
    category: ProtocolCategory.DIAGNOSIS,
    condition: "Chest Pain",
    icd10Codes: ["R07.9", "I20.0", "I21.0"],
    workflowDefinitionId: "",
    evidenceLevel: EvidenceLevel.B,
    source: "AHA/ACC Guidelines",
    references: [
      "AHA/ACC Guideline for the Management of Acute Coronary Syndromes",
    ],
    steps: [],
    outcomes: [],
  }),
};

// ============================================================================
// Types
// ============================================================================

interface CreateProtocolParams {
  name: string;
  code: string;
  version?: string;
  description: string;
  category: ProtocolCategory;
  condition: string;
  icd10Codes?: string[];
  workflowDefinitionId: string;
  steps: ProtocolStep[];
  outcomes: any[];
  evidenceLevel?: EvidenceLevel;
  source?: string;
  references?: string[];
  effectiveDate?: Date;
  expirationDate?: Date;
  metadata?: Record<string, any>;
  organizationId: string;
  createdBy: string;
}

interface ProtocolExecutionContext {
  userId: string;
  patientId: string;
  encounterId: string;
  organizationId: string;
  workflowDefinition: WorkflowDefinition;
}

interface StepCompletionContext {
  userId: string;
  isVariance: boolean;
  varianceType?: VarianceType;
  varianceReason?: string;
}

interface VarianceStatistics {
  totalExecutions: number;
  executionsWithVariances: number;
  totalVariances: number;
  variancesByType: Record<VarianceType, number>;
  approvalRate: number;
}

interface OutcomeStatistics {
  totalExecutions: number;
  outcomesMeasured: Record<string, number>;
  targetAchievementRate: Record<string, number>;
}

interface ProtocolCompletionReport {
  executionId: string;
  protocolId: string;
  protocolName: string;
  patientId: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  status: ProtocolExecutionStatus;
  totalSteps: number;
  completedSteps: number;
  variances: ProtocolVariance[];
  varianceCount: number;
  outcomes: ProtocolOutcomeResult[];
  outcomeAchievementRate: number;
  adherenceRate: number;
}

type EventHandler = (data: any) => void;

// ============================================================================
// Singleton Instance
// ============================================================================

export const careProtocolManager = new CareProtocolManager();
