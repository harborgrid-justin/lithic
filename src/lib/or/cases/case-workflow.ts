/**
 * OR Case Workflow Manager
 * Manages surgical case lifecycle, status tracking, and milestone timestamps
 */

import { addMinutes, differenceInMinutes } from "date-fns";
import type { SurgicalCase, CaseStatus } from "@/types/or-management";

export interface CaseWorkflow {
  caseId: string;
  currentStatus: CaseStatus;
  milestones: Milestone[];
  timeline: TimelineEvent[];
  alerts: WorkflowAlert[];
}

export interface Milestone {
  name: string;
  status: CaseStatus;
  expectedTime: Date | null;
  actualTime: Date | null;
  duration: number | null;
  completedBy: string | null;
  isRequired: boolean;
  isCompleted: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  eventType: EventType;
  description: string;
  performedBy: string;
  metadata: Record<string, any>;
}

export enum EventType {
  CASE_CREATED = "CASE_CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  PATIENT_ARRIVED = "PATIENT_ARRIVED",
  PRE_OP_COMPLETED = "PRE_OP_COMPLETED",
  CONSENT_SIGNED = "CONSENT_SIGNED",
  PATIENT_IN_ROOM = "PATIENT_IN_ROOM",
  TIMEOUT_COMPLETED = "TIMEOUT_COMPLETED",
  ANESTHESIA_START = "ANESTHESIA_START",
  INCISION = "INCISION",
  PROCEDURE_MILESTONE = "PROCEDURE_MILESTONE",
  CLOSURE_START = "CLOSURE_START",
  PROCEDURE_END = "PROCEDURE_END",
  PATIENT_TO_RECOVERY = "PATIENT_TO_RECOVERY",
  CASE_COMPLETED = "CASE_COMPLETED",
  CASE_DELAYED = "CASE_DELAYED",
  CASE_CANCELLED = "CASE_CANCELLED",
}

export interface WorkflowAlert {
  id: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export class CaseWorkflowManager {
  private readonly STANDARD_MILESTONES: Array<{
    name: string;
    status: CaseStatus;
    isRequired: boolean;
  }> = [
    { name: "Case Scheduled", status: CaseStatus.SCHEDULED, isRequired: true },
    { name: "Patient Arrived", status: CaseStatus.PRE_OP, isRequired: true },
    { name: "Pre-Op Complete", status: CaseStatus.READY, isRequired: true },
    { name: "Patient in OR", status: CaseStatus.IN_ROOM, isRequired: true },
    { name: "Anesthesia Start", status: CaseStatus.ANESTHESIA_START, isRequired: true },
    { name: "Procedure Start", status: CaseStatus.PROCEDURE_START, isRequired: true },
    { name: "Procedure End", status: CaseStatus.PROCEDURE_END, isRequired: true },
    { name: "To Recovery", status: CaseStatus.RECOVERY, isRequired: true },
    { name: "Case Complete", status: CaseStatus.COMPLETED, isRequired: true },
  ];

  initializeWorkflow(surgicalCase: SurgicalCase): CaseWorkflow {
    const milestones: Milestone[] = this.STANDARD_MILESTONES.map((m) => ({
      name: m.name,
      status: m.status,
      expectedTime: this.calculateExpectedTime(surgicalCase, m.status),
      actualTime: null,
      duration: null,
      completedBy: null,
      isRequired: m.isRequired,
      isCompleted: false,
    }));

    return {
      caseId: surgicalCase.id,
      currentStatus: surgicalCase.status,
      milestones,
      timeline: [
        {
          id: `event_${Date.now()}`,
          timestamp: new Date(surgicalCase.createdAt),
          eventType: EventType.CASE_CREATED,
          description: `Case created for ${surgicalCase.patientName}`,
          performedBy: surgicalCase.createdBy,
          metadata: { procedureName: surgicalCase.procedureName },
        },
      ],
      alerts: [],
    };
  }

  updateStatus(
    workflow: CaseWorkflow,
    newStatus: CaseStatus,
    performedBy: string,
    notes?: string
  ): CaseWorkflow {
    const now = new Date();
    const milestone = workflow.milestones.find((m) => m.status === newStatus);

    if (milestone && !milestone.isCompleted) {
      milestone.actualTime = now;
      milestone.completedBy = performedBy;
      milestone.isCompleted = true;

      if (milestone.expectedTime) {
        milestone.duration = differenceInMinutes(now, milestone.expectedTime);
      }
    }

    const event: TimelineEvent = {
      id: `event_${Date.now()}`,
      timestamp: now,
      eventType: EventType.STATUS_CHANGED,
      description: `Status changed to ${newStatus}`,
      performedBy,
      metadata: { previousStatus: workflow.currentStatus, notes },
    };

    return {
      ...workflow,
      currentStatus: newStatus,
      timeline: [...workflow.timeline, event],
      milestones: workflow.milestones,
    };
  }

  recordMilestone(
    workflow: CaseWorkflow,
    eventType: EventType,
    description: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): CaseWorkflow {
    const event: TimelineEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date(),
      eventType,
      description,
      performedBy,
      metadata: metadata || {},
    };

    return {
      ...workflow,
      timeline: [...workflow.timeline, event],
    };
  }

  addAlert(
    workflow: CaseWorkflow,
    severity: WorkflowAlert["severity"],
    message: string
  ): CaseWorkflow {
    const alert: WorkflowAlert = {
      id: `alert_${Date.now()}`,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    return {
      ...workflow,
      alerts: [...workflow.alerts, alert],
    };
  }

  checkForDelays(workflow: CaseWorkflow): WorkflowAlert[] {
    const alerts: WorkflowAlert[] = [];
    const now = new Date();

    for (const milestone of workflow.milestones) {
      if (!milestone.isCompleted && milestone.expectedTime) {
        const delay = differenceInMinutes(now, milestone.expectedTime);
        if (delay > 15) {
          alerts.push({
            id: `delay_${milestone.status}`,
            severity: delay > 30 ? "ERROR" : "WARNING",
            message: `${milestone.name} delayed by ${delay} minutes`,
            timestamp: now,
            acknowledged: false,
          });
        }
      }
    }

    return alerts;
  }

  private calculateExpectedTime(
    surgicalCase: SurgicalCase,
    status: CaseStatus
  ): Date | null {
    const baseTime = new Date(surgicalCase.scheduledStartTime);

    const offsets: Record<CaseStatus, number> = {
      [CaseStatus.SCHEDULED]: -60,
      [CaseStatus.PRE_OP]: -30,
      [CaseStatus.READY]: 0,
      [CaseStatus.IN_ROOM]: 0,
      [CaseStatus.ANESTHESIA_START]: 5,
      [CaseStatus.PROCEDURE_START]: 15,
      [CaseStatus.PROCEDURE_END]: 15 + surgicalCase.estimatedDuration,
      [CaseStatus.RECOVERY]: 20 + surgicalCase.estimatedDuration,
      [CaseStatus.COMPLETED]: 90 + surgicalCase.estimatedDuration,
      [CaseStatus.CONFIRMED]: -120,
      [CaseStatus.CLOSING]: surgicalCase.estimatedDuration - 30,
      [CaseStatus.DELAYED]: 0,
      [CaseStatus.CANCELLED]: 0,
      [CaseStatus.BUMP]: 0,
    };

    return addMinutes(baseTime, offsets[status] || 0);
  }

  getWorkflowProgress(workflow: CaseWorkflow): {
    completedMilestones: number;
    totalMilestones: number;
    percentComplete: number;
    estimatedCompletion: Date | null;
  } {
    const requiredMilestones = workflow.milestones.filter((m) => m.isRequired);
    const completedMilestones = requiredMilestones.filter((m) => m.isCompleted);

    const percentComplete =
      (completedMilestones.length / requiredMilestones.length) * 100;

    const lastCompleted = completedMilestones[completedMilestones.length - 1];
    const estimatedCompletion = lastCompleted?.actualTime
      ? addMinutes(lastCompleted.actualTime, 60)
      : null;

    return {
      completedMilestones: completedMilestones.length,
      totalMilestones: requiredMilestones.length,
      percentComplete,
      estimatedCompletion,
    };
  }
}

let managerInstance: CaseWorkflowManager | null = null;

export function getCaseWorkflowManager(): CaseWorkflowManager {
  if (!managerInstance) {
    managerInstance = new CaseWorkflowManager();
  }
  return managerInstance;
}
