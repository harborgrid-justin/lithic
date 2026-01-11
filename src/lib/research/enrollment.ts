/**
 * Subject Enrollment Workflow
 * Lithic Healthcare Platform v0.5
 *
 * Complete enrollment process from screening to randomization
 */

import {
  StudySubject,
  SubjectStatus,
  ConsentStatus,
  SubjectVisit,
  VisitStatus,
  UnblindingEvent,
  UnblindingReason,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class EnrollmentManager {
  private static instance: EnrollmentManager;
  private subjects: Map<string, StudySubject> = new Map();
  private subjectsByTrial: Map<string, Set<string>> = new Map();
  private subjectsBySite: Map<string, Set<string>> = new Map();
  private subjectsByPatient: Map<string, string> = new Map(); // patientId -> subjectId

  private constructor() {}

  static getInstance(): EnrollmentManager {
    if (!EnrollmentManager.instance) {
      EnrollmentManager.instance = new EnrollmentManager();
    }
    return EnrollmentManager.instance;
  }

  /**
   * Screen patient for trial enrollment
   */
  async screenSubject(
    patientId: string,
    trialId: string,
    siteId: string,
    userId: string,
    organizationId: string
  ): Promise<StudySubject> {
    try {
      // Check if patient already enrolled
      const existingSubject = this.subjectsByPatient.get(
        `${patientId}_${trialId}`
      );
      if (existingSubject) {
        throw new Error("Patient already enrolled or screening for this trial");
      }

      // Generate screening number
      const screeningNumber = await this.generateScreeningNumber(
        trialId,
        siteId
      );

      const subject: StudySubject = {
        id: this.generateId(),
        subjectId: screeningNumber, // Will be replaced with subject ID if enrolled
        patientId,
        trialId,
        siteId,
        armId: null,
        randomizationNumber: null,
        enrollmentDate: new Date(),
        status: SubjectStatus.SCREENING,
        consentStatus: ConsentStatus.NOT_OBTAINED,
        consentDate: null,
        consentVersion: null,
        consentForm: null,
        screeningDate: new Date(),
        screeningNumber,
        withdrawalDate: null,
        withdrawalReason: null,
        completionDate: null,
        visits: [],
        adherence: {
          overallRate: 100,
          missedVisits: 0,
          protocolDeviations: 0,
          dosageAdherence: 100,
          lastAssessed: new Date(),
        },
        blinded: false,
        unblindingLog: [],
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      this.subjects.set(subject.id, subject);
      this.indexSubject(subject);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "subject_screening",
        resourceId: subject.id,
        details: {
          screeningNumber,
          trialId,
          siteId,
        },
        organizationId,
      });

      return subject;
    } catch (error) {
      throw new Error(
        `Failed to screen subject: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Obtain informed consent
   */
  async obtainConsent(
    subjectId: string,
    consentVersion: string,
    consentFormUrl: string,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (subject.status !== SubjectStatus.SCREENING) {
      throw new Error("Consent can only be obtained during screening");
    }

    subject.consentStatus = ConsentStatus.OBTAINED;
    subject.consentDate = new Date();
    subject.consentVersion = consentVersion;
    subject.consentForm = consentFormUrl;
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_consent",
      resourceId: subjectId,
      details: {
        consentVersion,
        consentDate: subject.consentDate,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Enroll subject in trial
   */
  async enrollSubject(
    subjectId: string,
    armId: string | null,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (subject.status !== SubjectStatus.SCREENING) {
      throw new Error("Only screening subjects can be enrolled");
    }

    if (subject.consentStatus !== ConsentStatus.OBTAINED) {
      throw new Error("Informed consent must be obtained before enrollment");
    }

    // Generate subject ID
    const newSubjectId = await this.generateSubjectId(
      subject.trialId,
      subject.siteId
    );

    subject.subjectId = newSubjectId;
    subject.status = SubjectStatus.ENROLLED;
    subject.armId = armId;
    subject.enrollmentDate = new Date();
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_enrollment",
      resourceId: subjectId,
      details: {
        subjectId: newSubjectId,
        armId,
        enrollmentDate: subject.enrollmentDate,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Activate subject (post-enrollment)
   */
  async activateSubject(
    subjectId: string,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (subject.status !== SubjectStatus.ENROLLED) {
      throw new Error("Only enrolled subjects can be activated");
    }

    subject.status = SubjectStatus.ACTIVE;
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    this.subjects.set(subjectId, subject);

    return subject;
  }

  /**
   * Mark screening as failed
   */
  async screenFailure(
    subjectId: string,
    reason: string,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (subject.status !== SubjectStatus.SCREENING) {
      throw new Error("Only screening subjects can be marked as screen failure");
    }

    subject.status = SubjectStatus.SCREEN_FAILURE;
    subject.withdrawalReason = reason;
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_screen_failure",
      resourceId: subjectId,
      details: {
        reason,
        screeningNumber: subject.screeningNumber,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Withdraw subject from study
   */
  async withdrawSubject(
    subjectId: string,
    reason: string,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (
      ![
        SubjectStatus.ENROLLED,
        SubjectStatus.ACTIVE,
      ].includes(subject.status)
    ) {
      throw new Error("Subject cannot be withdrawn from current status");
    }

    subject.status = SubjectStatus.WITHDRAWN;
    subject.withdrawalDate = new Date();
    subject.withdrawalReason = reason;
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    // Withdraw consent
    subject.consentStatus = ConsentStatus.WITHDRAWN;

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_withdrawal",
      resourceId: subjectId,
      details: {
        reason,
        withdrawalDate: subject.withdrawalDate,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Complete subject participation
   */
  async completeSubject(
    subjectId: string,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (subject.status !== SubjectStatus.ACTIVE) {
      throw new Error("Only active subjects can be completed");
    }

    subject.status = SubjectStatus.COMPLETED;
    subject.completionDate = new Date();
    subject.updatedAt = new Date();
    subject.updatedBy = userId;

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_completion",
      resourceId: subjectId,
      details: {
        completionDate: subject.completionDate,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Add visit to subject schedule
   */
  async addVisit(
    subjectId: string,
    visit: Omit<SubjectVisit, "id">,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    const newVisit: SubjectVisit = {
      ...visit,
      id: this.generateId(),
    };

    subject.visits.push(newVisit);
    subject.updatedAt = new Date();

    this.subjects.set(subjectId, subject);

    return subject;
  }

  /**
   * Update visit status
   */
  async updateVisitStatus(
    subjectId: string,
    visitId: string,
    status: VisitStatus,
    actualDate: Date | null,
    userId: string
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    const visit = subject.visits.find((v) => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    visit.status = status;
    if (actualDate) {
      visit.actualDate = actualDate;
    }

    subject.updatedAt = new Date();

    // Update adherence if visit missed
    if (status === VisitStatus.MISSED) {
      subject.adherence.missedVisits++;
      this.recalculateAdherence(subject);
    }

    this.subjects.set(subjectId, subject);

    return subject;
  }

  /**
   * Unblind subject (emergency or study completion)
   */
  async unblindSubject(
    subjectId: string,
    reason: UnblindingReason,
    details: string,
    userId: string,
    emergency: boolean = false
  ): Promise<StudySubject> {
    const subject = this.subjects.get(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    if (!subject.blinded) {
      throw new Error("Subject is not blinded");
    }

    const unblindingEvent: UnblindingEvent = {
      id: this.generateId(),
      unblindedAt: new Date(),
      unblindedBy: userId,
      reason,
      emergencyUnblinding: emergency,
      approvedBy: emergency ? null : userId,
      details,
    };

    subject.unblindingLog.push(unblindingEvent);
    subject.blinded = false;
    subject.updatedAt = new Date();

    this.subjects.set(subjectId, subject);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "subject_unblinding",
      resourceId: subjectId,
      details: {
        reason,
        emergency,
        unblindedAt: unblindingEvent.unblindedAt,
      },
      organizationId: subject.organizationId,
    });

    return subject;
  }

  /**
   * Get subject by ID
   */
  async getSubject(subjectId: string): Promise<StudySubject | null> {
    return this.subjects.get(subjectId) || null;
  }

  /**
   * Get all subjects for a trial
   */
  async getTrialSubjects(trialId: string): Promise<StudySubject[]> {
    const subjectIds = this.subjectsByTrial.get(trialId) || new Set();
    const subjects: StudySubject[] = [];

    for (const subjectId of subjectIds) {
      const subject = this.subjects.get(subjectId);
      if (subject) {
        subjects.push(subject);
      }
    }

    return subjects;
  }

  /**
   * Get all subjects for a site
   */
  async getSiteSubjects(siteId: string): Promise<StudySubject[]> {
    const subjectIds = this.subjectsBySite.get(siteId) || new Set();
    const subjects: StudySubject[] = [];

    for (const subjectId of subjectIds) {
      const subject = this.subjects.get(subjectId);
      if (subject) {
        subjects.push(subject);
      }
    }

    return subjects;
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(trialId: string): Promise<{
    screening: number;
    enrolled: number;
    active: number;
    completed: number;
    withdrawn: number;
    screenFailures: number;
    lostToFollowUp: number;
  }> {
    const subjects = await this.getTrialSubjects(trialId);

    return {
      screening: subjects.filter((s) => s.status === SubjectStatus.SCREENING)
        .length,
      enrolled: subjects.filter((s) => s.status === SubjectStatus.ENROLLED)
        .length,
      active: subjects.filter((s) => s.status === SubjectStatus.ACTIVE).length,
      completed: subjects.filter((s) => s.status === SubjectStatus.COMPLETED)
        .length,
      withdrawn: subjects.filter((s) => s.status === SubjectStatus.WITHDRAWN)
        .length,
      screenFailures: subjects.filter(
        (s) => s.status === SubjectStatus.SCREEN_FAILURE
      ).length,
      lostToFollowUp: subjects.filter(
        (s) => s.status === SubjectStatus.LOST_TO_FOLLOWUP
      ).length,
    };
  }

  // Private helper methods

  private indexSubject(subject: StudySubject): void {
    // Index by trial
    if (!this.subjectsByTrial.has(subject.trialId)) {
      this.subjectsByTrial.set(subject.trialId, new Set());
    }
    this.subjectsByTrial.get(subject.trialId)!.add(subject.id);

    // Index by site
    if (!this.subjectsBySite.has(subject.siteId)) {
      this.subjectsBySite.set(subject.siteId, new Set());
    }
    this.subjectsBySite.get(subject.siteId)!.add(subject.id);

    // Index by patient
    const key = `${subject.patientId}_${subject.trialId}`;
    this.subjectsByPatient.set(key, subject.id);
  }

  private async generateScreeningNumber(
    trialId: string,
    siteId: string
  ): Promise<string> {
    const subjectIds = this.subjectsByTrial.get(trialId) || new Set();
    const count = subjectIds.size + 1;

    const trialCode = trialId.substring(0, 6).toUpperCase();
    const siteCode = siteId.substring(0, 3).toUpperCase();
    const sequence = count.toString().padStart(4, "0");

    return `${trialCode}-${siteCode}-S${sequence}`;
  }

  private async generateSubjectId(
    trialId: string,
    siteId: string
  ): Promise<string> {
    const subjects = await this.getTrialSubjects(trialId);
    const enrolled = subjects.filter(
      (s) =>
        s.status !== SubjectStatus.SCREENING &&
        s.status !== SubjectStatus.SCREEN_FAILURE
    );
    const count = enrolled.length + 1;

    const trialCode = trialId.substring(0, 6).toUpperCase();
    const siteCode = siteId.substring(0, 3).toUpperCase();
    const sequence = count.toString().padStart(4, "0");

    return `${trialCode}-${siteCode}-${sequence}`;
  }

  private recalculateAdherence(subject: StudySubject): void {
    const totalVisits = subject.visits.length;
    if (totalVisits === 0) {
      subject.adherence.overallRate = 100;
      return;
    }

    const completedVisits = subject.visits.filter(
      (v) => v.status === VisitStatus.COMPLETED
    ).length;

    subject.adherence.overallRate =
      (completedVisits / totalVisits) * 100;
    subject.adherence.lastAssessed = new Date();
  }

  private generateId(): string {
    return `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const enrollmentManager = EnrollmentManager.getInstance();
