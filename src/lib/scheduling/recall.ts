/**
 * Recall System - Preventive Care & Follow-up Management
 * Automated patient recall for preventive care, screenings, and follow-ups
 */

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";
import type {
  Appointment,
  AppointmentType,
  ReminderMethod,
} from "@/types/scheduling";

// ============================================================================
// Types
// ============================================================================

export interface RecallDefinition {
  id: string;
  name: string;
  description: string;
  category: RecallCategory;
  triggerType: RecallTriggerType;
  intervalMonths?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: "M" | "F" | "ALL";
  conditions?: string[];
  procedureCodes?: string[];
  appointmentTypes?: AppointmentType[];
  priority: RecallPriority;
  autoSchedule: boolean;
  reminderSchedule: ReminderSchedule;
  complianceWindow: number; // days
}

export enum RecallCategory {
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  POST_PROCEDURE = "POST_PROCEDURE",
  MEDICATION_REVIEW = "MEDICATION_REVIEW",
  LAB_FOLLOW_UP = "LAB_FOLLOW_UP",
  IMAGING_FOLLOW_UP = "IMAGING_FOLLOW_UP",
  REFERRAL_FOLLOW_UP = "REFERRAL_FOLLOW_UP",
  WELLNESS_VISIT = "WELLNESS_VISIT",
}

export enum RecallTriggerType {
  TIME_BASED = "TIME_BASED",
  AGE_BASED = "AGE_BASED",
  CONDITION_BASED = "CONDITION_BASED",
  PROCEDURE_BASED = "PROCEDURE_BASED",
  LAB_RESULT = "LAB_RESULT",
  MANUAL = "MANUAL",
}

export enum RecallPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
}

export interface ReminderSchedule {
  initialDays: number; // Days before due date for first reminder
  followUpDays: number[]; // Days for follow-up reminders
  methods: ReminderMethod[];
  maxAttempts: number;
}

export interface PatientRecall {
  id: string;
  patientId: string;
  patientName: string;
  recallDefinitionId: string;
  recallType: RecallCategory;
  dueDate: Date;
  priority: RecallPriority;
  status: RecallStatus;
  reason: string;
  lastAppointmentDate?: Date;
  lastAppointmentType?: AppointmentType;
  attempts: ContactAttempt[];
  scheduledAppointmentId?: string;
  completedDate?: Date;
  dismissedDate?: Date;
  dismissalReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RecallStatus {
  PENDING = "PENDING",
  CONTACTED = "CONTACTED",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  OVERDUE = "OVERDUE",
  DISMISSED = "DISMISSED",
  UNABLE_TO_CONTACT = "UNABLE_TO_CONTACT",
}

export interface ContactAttempt {
  id: string;
  date: Date;
  method: ReminderMethod;
  status: ContactStatus;
  contactedBy?: string;
  notes?: string;
  nextAttemptDate?: Date;
}

export enum ContactStatus {
  SUCCESS = "SUCCESS",
  NO_ANSWER = "NO_ANSWER",
  LEFT_MESSAGE = "LEFT_MESSAGE",
  WRONG_NUMBER = "WRONG_NUMBER",
  DECLINED = "DECLINED",
  SCHEDULED = "SCHEDULED",
}

export interface RecallCampaign {
  id: string;
  name: string;
  description: string;
  recallDefinitionIds: string[];
  targetPatients: string[];
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  totalTargets: number;
  contacted: number;
  scheduled: number;
  completed: number;
  createdBy: string;
  createdAt: Date;
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface ComplianceReport {
  recallType: RecallCategory;
  totalDue: number;
  completed: number;
  overdue: number;
  scheduled: number;
  complianceRate: number;
  avgDaysOverdue: number;
  byPriority: {
    [priority: string]: {
      total: number;
      completed: number;
      rate: number;
    };
  };
}

// ============================================================================
// Recall Manager Class
// ============================================================================

export class RecallManager {
  private definitions: Map<string, RecallDefinition> = new Map();
  private recalls: Map<string, PatientRecall> = new Map();
  private campaigns: Map<string, RecallCampaign> = new Map();

  constructor() {
    this.initializeStandardRecalls();
  }

  // --------------------------------------------------------------------------
  // Recall Definition Management
  // --------------------------------------------------------------------------

  private initializeStandardRecalls() {
    // Annual Physical
    this.addRecallDefinition({
      id: "annual_physical",
      name: "Annual Physical Exam",
      description: "Annual preventive physical examination",
      category: RecallCategory.PREVENTIVE_CARE,
      triggerType: RecallTriggerType.TIME_BASED,
      intervalMonths: 12,
      appointmentTypes: [AppointmentType.ANNUAL_PHYSICAL],
      priority: RecallPriority.MEDIUM,
      autoSchedule: false,
      reminderSchedule: {
        initialDays: 30,
        followUpDays: [14, 7, 0],
        methods: [ReminderMethod.EMAIL, ReminderMethod.SMS],
        maxAttempts: 3,
      },
      complianceWindow: 60,
    });

    // Diabetes Follow-up
    this.addRecallDefinition({
      id: "diabetes_followup",
      name: "Diabetes Follow-up",
      description: "Quarterly follow-up for diabetes management",
      category: RecallCategory.CHRONIC_DISEASE,
      triggerType: RecallTriggerType.CONDITION_BASED,
      intervalMonths: 3,
      conditions: ["E11.9", "E11.65"], // ICD-10 diabetes codes
      appointmentTypes: [AppointmentType.FOLLOW_UP],
      priority: RecallPriority.HIGH,
      autoSchedule: false,
      reminderSchedule: {
        initialDays: 14,
        followUpDays: [7, 3, 0],
        methods: [ReminderMethod.PHONE, ReminderMethod.SMS],
        maxAttempts: 4,
      },
      complianceWindow: 30,
    });

    // Mammogram Screening
    this.addRecallDefinition({
      id: "mammogram_screening",
      name: "Mammogram Screening",
      description: "Annual mammogram for women 40+",
      category: RecallCategory.PREVENTIVE_CARE,
      triggerType: RecallTriggerType.AGE_BASED,
      intervalMonths: 12,
      ageRange: { min: 40, max: 120 },
      gender: "F",
      appointmentTypes: [AppointmentType.IMAGING_ONLY],
      priority: RecallPriority.HIGH,
      autoSchedule: false,
      reminderSchedule: {
        initialDays: 30,
        followUpDays: [14, 0],
        methods: [ReminderMethod.EMAIL, ReminderMethod.PHONE],
        maxAttempts: 3,
      },
      complianceWindow: 45,
    });

    // Colonoscopy Screening
    this.addRecallDefinition({
      id: "colonoscopy_screening",
      name: "Colonoscopy Screening",
      description: "Colon cancer screening for age 50+",
      category: RecallCategory.PREVENTIVE_CARE,
      triggerType: RecallTriggerType.AGE_BASED,
      intervalMonths: 120, // Every 10 years
      ageRange: { min: 50, max: 75 },
      appointmentTypes: [AppointmentType.PROCEDURE],
      priority: RecallPriority.HIGH,
      autoSchedule: false,
      reminderSchedule: {
        initialDays: 60,
        followUpDays: [30, 14, 0],
        methods: [ReminderMethod.EMAIL, ReminderMethod.PHONE],
        maxAttempts: 3,
      },
      complianceWindow: 90,
    });

    // Well-Child Visit
    this.addRecallDefinition({
      id: "well_child_visit",
      name: "Well-Child Visit",
      description: "Pediatric wellness checkup",
      category: RecallCategory.WELLNESS_VISIT,
      triggerType: RecallTriggerType.AGE_BASED,
      intervalMonths: 12,
      ageRange: { min: 0, max: 18 },
      appointmentTypes: [AppointmentType.WELL_CHILD],
      priority: RecallPriority.MEDIUM,
      autoSchedule: false,
      reminderSchedule: {
        initialDays: 30,
        followUpDays: [14, 0],
        methods: [ReminderMethod.EMAIL, ReminderMethod.SMS],
        maxAttempts: 3,
      },
      complianceWindow: 30,
    });
  }

  addRecallDefinition(definition: RecallDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  getRecallDefinition(id: string): RecallDefinition | undefined {
    return this.definitions.get(id);
  }

  getAllRecallDefinitions(): RecallDefinition[] {
    return Array.from(this.definitions.values());
  }

  // --------------------------------------------------------------------------
  // Patient Recall Generation
  // --------------------------------------------------------------------------

  generateRecalls(
    patientId: string,
    patientInfo: {
      name: string;
      dateOfBirth: Date;
      gender: "M" | "F";
      conditions?: string[];
    },
    appointments: Appointment[],
  ): PatientRecall[] {
    const recalls: PatientRecall[] = [];
    const now = new Date();

    for (const definition of this.definitions.values()) {
      // Check if patient matches criteria
      if (!this.matchesCriteria(patientInfo, definition)) {
        continue;
      }

      // Find last relevant appointment
      const lastAppointment = this.findLastRelevantAppointment(
        appointments,
        definition,
      );

      // Calculate due date
      const dueDate = this.calculateDueDate(lastAppointment, definition);

      // Only create recall if due date is in the future or recently past
      const daysDiff = differenceInDays(dueDate, now);
      if (daysDiff > -definition.complianceWindow) {
        const recall: PatientRecall = {
          id: `recall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          patientId,
          patientName: patientInfo.name,
          recallDefinitionId: definition.id,
          recallType: definition.category,
          dueDate,
          priority: definition.priority,
          status: daysDiff < 0 ? RecallStatus.OVERDUE : RecallStatus.PENDING,
          reason: definition.description,
          lastAppointmentDate: lastAppointment?.startTime,
          lastAppointmentType: lastAppointment?.appointmentType,
          attempts: [],
          createdAt: now,
          updatedAt: now,
        };

        recalls.push(recall);
        this.recalls.set(recall.id, recall);
      }
    }

    return recalls;
  }

  private matchesCriteria(
    patientInfo: {
      dateOfBirth: Date;
      gender: "M" | "F";
      conditions?: string[];
    },
    definition: RecallDefinition,
  ): boolean {
    // Check age range
    if (definition.ageRange) {
      const age = differenceInMonths(new Date(), patientInfo.dateOfBirth) / 12;
      if (age < definition.ageRange.min || age > definition.ageRange.max) {
        return false;
      }
    }

    // Check gender
    if (definition.gender && definition.gender !== "ALL") {
      if (patientInfo.gender !== definition.gender) {
        return false;
      }
    }

    // Check conditions
    if (definition.conditions && definition.conditions.length > 0) {
      if (!patientInfo.conditions || patientInfo.conditions.length === 0) {
        return false;
      }
      const hasCondition = definition.conditions.some((cond) =>
        patientInfo.conditions!.includes(cond),
      );
      if (!hasCondition) {
        return false;
      }
    }

    return true;
  }

  private findLastRelevantAppointment(
    appointments: Appointment[],
    definition: RecallDefinition,
  ): Appointment | null {
    const relevantAppointments = appointments.filter((appt) => {
      if (appt.status === "CANCELLED" || appt.status === "NO_SHOW") {
        return false;
      }

      if (
        definition.appointmentTypes &&
        definition.appointmentTypes.length > 0
      ) {
        return definition.appointmentTypes.includes(appt.appointmentType);
      }

      return true;
    });

    if (relevantAppointments.length === 0) return null;

    // Sort by date, most recent first
    relevantAppointments.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    return relevantAppointments[0];
  }

  private calculateDueDate(
    lastAppointment: Appointment | null,
    definition: RecallDefinition,
  ): Date {
    const baseDate = lastAppointment
      ? new Date(lastAppointment.startTime)
      : new Date();

    if (definition.intervalMonths) {
      return addMonths(baseDate, definition.intervalMonths);
    }

    // Default to 1 year
    return addYears(baseDate, 1);
  }

  // --------------------------------------------------------------------------
  // Contact Attempt Management
  // --------------------------------------------------------------------------

  recordContactAttempt(
    recallId: string,
    method: ReminderMethod,
    status: ContactStatus,
    contactedBy?: string,
    notes?: string,
  ): ContactAttempt {
    const recall = this.recalls.get(recallId);
    if (!recall) {
      throw new Error(`Recall ${recallId} not found`);
    }

    const attempt: ContactAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(),
      method,
      status,
      contactedBy,
      notes,
    };

    recall.attempts.push(attempt);

    // Update recall status
    if (status === ContactStatus.SCHEDULED) {
      recall.status = RecallStatus.SCHEDULED;
    } else if (
      status === ContactStatus.SUCCESS ||
      status === ContactStatus.LEFT_MESSAGE
    ) {
      recall.status = RecallStatus.CONTACTED;
    } else if (status === ContactStatus.DECLINED) {
      recall.status = RecallStatus.DISMISSED;
      recall.dismissedDate = new Date();
      recall.dismissalReason = "Patient declined";
    }

    // Check if max attempts reached
    const definition = this.definitions.get(recall.recallDefinitionId);
    if (
      definition &&
      recall.attempts.length >= definition.reminderSchedule.maxAttempts &&
      recall.status === RecallStatus.PENDING
    ) {
      recall.status = RecallStatus.UNABLE_TO_CONTACT;
    }

    recall.updatedAt = new Date();

    return attempt;
  }

  // --------------------------------------------------------------------------
  // Recall Campaign Management
  // --------------------------------------------------------------------------

  createCampaign(params: {
    name: string;
    description: string;
    recallDefinitionIds: string[];
    targetPatients: string[];
    startDate: Date;
    endDate: Date;
    createdBy: string;
  }): RecallCampaign {
    const campaign: RecallCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      recallDefinitionIds: params.recallDefinitionIds,
      targetPatients: params.targetPatients,
      startDate: params.startDate,
      endDate: params.endDate,
      status: CampaignStatus.DRAFT,
      totalTargets: params.targetPatients.length,
      contacted: 0,
      scheduled: 0,
      completed: 0,
      createdBy: params.createdBy,
      createdAt: new Date(),
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  updateCampaignStatus(campaignId: string, status: CampaignStatus): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = status;
    }
  }

  // --------------------------------------------------------------------------
  // Compliance & Reporting
  // --------------------------------------------------------------------------

  generateComplianceReport(
    recalls: PatientRecall[],
    category?: RecallCategory,
  ): ComplianceReport {
    const filtered = category
      ? recalls.filter((r) => r.recallType === category)
      : recalls;

    const totalDue = filtered.length;
    const completed = filtered.filter(
      (r) => r.status === RecallStatus.COMPLETED,
    ).length;
    const overdue = filtered.filter(
      (r) => r.status === RecallStatus.OVERDUE,
    ).length;
    const scheduled = filtered.filter(
      (r) => r.status === RecallStatus.SCHEDULED,
    ).length;

    const complianceRate =
      totalDue > 0 ? (completed / totalDue) * 100 : 0;

    // Calculate average days overdue
    const overdueRecalls = filtered.filter(
      (r) => r.status === RecallStatus.OVERDUE,
    );
    const totalDaysOverdue = overdueRecalls.reduce((sum, r) => {
      return sum + Math.abs(differenceInDays(new Date(), r.dueDate));
    }, 0);
    const avgDaysOverdue =
      overdueRecalls.length > 0
        ? totalDaysOverdue / overdueRecalls.length
        : 0;

    // Break down by priority
    const byPriority: ComplianceReport["byPriority"] = {};
    for (let priority = 1; priority <= 4; priority++) {
      const priorityRecalls = filtered.filter(
        (r) => r.priority === priority,
      );
      const priorityCompleted = priorityRecalls.filter(
        (r) => r.status === RecallStatus.COMPLETED,
      ).length;

      byPriority[priority] = {
        total: priorityRecalls.length,
        completed: priorityCompleted,
        rate:
          priorityRecalls.length > 0
            ? (priorityCompleted / priorityRecalls.length) * 100
            : 0,
      };
    }

    return {
      recallType: category || RecallCategory.PREVENTIVE_CARE,
      totalDue,
      completed,
      overdue,
      scheduled,
      complianceRate,
      avgDaysOverdue,
      byPriority,
    };
  }

  getOverdueRecalls(days: number = 0): PatientRecall[] {
    const cutoffDate = addDays(new Date(), -days);
    return Array.from(this.recalls.values()).filter(
      (r) =>
        r.status === RecallStatus.OVERDUE &&
        isBefore(r.dueDate, cutoffDate),
    );
  }

  getUpcomingRecalls(days: number = 30): PatientRecall[] {
    const endDate = addDays(new Date(), days);
    return Array.from(this.recalls.values()).filter(
      (r) =>
        r.status === RecallStatus.PENDING &&
        isBefore(r.dueDate, endDate),
    );
  }

  // --------------------------------------------------------------------------
  // Automated Outreach
  // --------------------------------------------------------------------------

  scheduleAutomatedReminders(recall: PatientRecall): Date[] {
    const definition = this.definitions.get(recall.recallDefinitionId);
    if (!definition) return [];

    const schedule = definition.reminderSchedule;
    const reminderDates: Date[] = [];

    // Initial reminder
    const initialDate = addDays(recall.dueDate, -schedule.initialDays);
    if (isAfter(initialDate, new Date())) {
      reminderDates.push(initialDate);
    }

    // Follow-up reminders
    for (const days of schedule.followUpDays) {
      const followUpDate = addDays(recall.dueDate, -days);
      if (isAfter(followUpDate, new Date())) {
        reminderDates.push(followUpDate);
      }
    }

    return reminderDates.sort((a, b) => a.getTime() - b.getTime());
  }

  processAutomatedReminders(): {
    sent: number;
    failed: number;
    scheduled: number;
  } {
    const today = startOfDay(new Date());
    let sent = 0;
    let failed = 0;
    let scheduled = 0;

    for (const recall of this.recalls.values()) {
      if (
        recall.status !== RecallStatus.PENDING &&
        recall.status !== RecallStatus.CONTACTED
      ) {
        continue;
      }

      const reminderDates = this.scheduleAutomatedReminders(recall);
      for (const date of reminderDates) {
        if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
          // Send reminder (in real implementation)
          // For now, just record the attempt
          const definition = this.definitions.get(recall.recallDefinitionId);
          if (definition) {
            const method = definition.reminderSchedule.methods[0];
            try {
              this.recordContactAttempt(
                recall.id,
                method,
                ContactStatus.LEFT_MESSAGE,
                "Automated System",
                "Automated reminder sent",
              );
              sent++;
            } catch (error) {
              failed++;
            }
          }
        } else if (isAfter(date, today)) {
          scheduled++;
        }
      }
    }

    return { sent, failed, scheduled };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let recallManagerInstance: RecallManager | null = null;

export function getRecallManager(): RecallManager {
  if (!recallManagerInstance) {
    recallManagerInstance = new RecallManager();
  }
  return recallManagerInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function prioritizeRecalls(recalls: PatientRecall[]): PatientRecall[] {
  return recalls.sort((a, b) => {
    // First by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by due date
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

export function categorizeRecalls(
  recalls: PatientRecall[],
): Map<RecallCategory, PatientRecall[]> {
  const categorized = new Map<RecallCategory, PatientRecall[]>();

  for (const recall of recalls) {
    const existing = categorized.get(recall.recallType) || [];
    existing.push(recall);
    categorized.set(recall.recallType, existing);
  }

  return categorized;
}
