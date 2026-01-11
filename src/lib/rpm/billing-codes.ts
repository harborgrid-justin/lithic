/**
 * RPM Billing Codes and Documentation Support
 * Handles CPT code tracking, billing period management, and reimbursement documentation
 */

import type {
  RPMBillingPeriod,
  BillingPeriodStatus,
  RPMBillingCode,
  BillingCodeCategory,
  BillableActivity,
  ActivityType,
  BillingRequirements,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit-logger";

/**
 * CPT Codes for Remote Patient Monitoring (2024)
 */
export const RPM_CPT_CODES = {
  // Device Setup and Patient Education
  RPM_SETUP: {
    code: "99453",
    description: "Remote monitoring of physiologic parameter(s), initial setup and patient education",
    category: BillingCodeCategory.DEVICE_SETUP,
    requirements: {
      minimumDays: 0,
      minimumReadings: 0,
      minimumMinutes: null,
      requiresInteractiveContact: false,
      requiresPhysicianReview: false,
    },
    reimbursementRange: { min: 18, max: 22 },
    billableOnce: true,
    notes: "One-time setup per device per episode",
  },

  // Device Supply and Data Transmission
  RPM_DEVICE_SUPPLY: {
    code: "99454",
    description: "Device supply with daily recording(s) or programmed alert(s) transmission to physician/qualified healthcare professional",
    category: BillingCodeCategory.DATA_TRANSMISSION,
    requirements: {
      minimumDays: 16,
      minimumReadings: 16,
      minimumMinutes: null,
      requiresInteractiveContact: false,
      requiresPhysicianReview: false,
    },
    reimbursementRange: { min: 52, max: 65 },
    billableOnce: false,
    notes: "Requires minimum 16 days of data in 30-day period",
  },

  // Initial Interactive Communication
  RPM_INITIAL_MONITORING: {
    code: "99457",
    description: "Remote physiologic monitoring treatment management services, first 20 minutes",
    category: BillingCodeCategory.INTERACTIVE_COMMUNICATION,
    requirements: {
      minimumDays: 0,
      minimumReadings: 0,
      minimumMinutes: 20,
      requiresInteractiveContact: true,
      requiresPhysicianReview: true,
    },
    reimbursementRange: { min: 48, max: 62 },
    billableOnce: false,
    notes: "Interactive communication with patient/caregiver",
  },

  // Additional Interactive Communication
  RPM_ADDITIONAL_MONITORING: {
    code: "99458",
    description: "Remote physiologic monitoring treatment management services, each additional 20 minutes",
    category: BillingCodeCategory.INTERACTIVE_COMMUNICATION,
    requirements: {
      minimumDays: 0,
      minimumReadings: 0,
      minimumMinutes: 20,
      requiresInteractiveContact: true,
      requiresPhysicianReview: true,
    },
    reimbursementRange: { min: 38, max: 50 },
    billableOnce: false,
    notes: "Additional 20-minute increments, requires 99457 first",
    requiresPrimaryCode: "99457",
  },

  // Respiratory-Specific RPM
  RPM_RESPIRATORY: {
    code: "99091",
    description: "Collection and interpretation of physiologic data, minimum 30 minutes",
    category: BillingCodeCategory.DATA_REVIEW,
    requirements: {
      minimumDays: 30,
      minimumReadings: 30,
      minimumMinutes: 30,
      requiresInteractiveContact: false,
      requiresPhysicianReview: true,
    },
    reimbursementRange: { min: 54, max: 68 },
    billableOnce: false,
    notes: "Respiratory or musculoskeletal monitoring",
  },
} as const;

export class RPMBillingManager {
  /**
   * Create or get current billing period for patient
   */
  async getCurrentBillingPeriod(
    patientId: string,
    organizationId: string
  ): Promise<RPMBillingPeriod> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Check if period exists
    let period = await db.rpmBillingPeriod.findFirst({
      where: {
        patientId,
        periodStart,
        periodEnd,
        organizationId,
      },
    });

    if (!period) {
      // Create new period
      period = await this.createBillingPeriod(patientId, periodStart, periodEnd, organizationId);
    }

    return period as RPMBillingPeriod;
  }

  /**
   * Create new billing period
   */
  async createBillingPeriod(
    patientId: string,
    periodStart: Date,
    periodEnd: Date,
    organizationId: string
  ): Promise<RPMBillingPeriod> {
    const period: RPMBillingPeriod = {
      id: crypto.randomUUID(),
      patientId,
      periodStart,
      periodEnd,
      status: BillingPeriodStatus.IN_PROGRESS,
      codes: [],
      totalMinutes: 0,
      deviceProvisioningMinutes: 0,
      setupMinutes: 0,
      educationMinutes: 0,
      dataReviewMinutes: 0,
      careCoordinationMinutes: 0,
      readingCount: 0,
      daysWithReadings: 0,
      complianceRate: 0,
      billableActivities: [],
      generatedBy: "system",
      reviewedBy: null,
      approvedAt: null,
      submittedToBilling: false,
      submittedAt: null,
      notes: null,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };

    await db.rpmBillingPeriod.create({ data: period });

    return period;
  }

  /**
   * Log billable activity
   */
  async logActivity(
    patientId: string,
    activity: Omit<BillableActivity, "id" | "timestamp">,
    organizationId: string
  ): Promise<void> {
    const period = await this.getCurrentBillingPeriod(patientId, organizationId);

    const billableActivity: BillableActivity = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...activity,
    };

    // Update period
    const updatedActivities = [...(period.billableActivities as BillableActivity[]), billableActivity];
    const totalMinutes = updatedActivities.reduce((sum, a) => sum + a.duration, 0);

    // Categorize minutes
    const updates: Partial<RPMBillingPeriod> = {
      billableActivities: updatedActivities,
      totalMinutes,
      updatedAt: new Date(),
    };

    switch (activity.type) {
      case ActivityType.DEVICE_PROVISIONING:
        updates.deviceProvisioningMinutes = (period.deviceProvisioningMinutes || 0) + activity.duration;
        updates.setupMinutes = (period.setupMinutes || 0) + activity.duration;
        break;
      case ActivityType.PATIENT_TRAINING:
        updates.educationMinutes = (period.educationMinutes || 0) + activity.duration;
        break;
      case ActivityType.DATA_REVIEW:
        updates.dataReviewMinutes = (period.dataReviewMinutes || 0) + activity.duration;
        break;
      case ActivityType.CARE_COORDINATION:
      case ActivityType.PATIENT_COMMUNICATION:
        updates.careCoordinationMinutes = (period.careCoordinationMinutes || 0) + activity.duration;
        break;
    }

    await db.rpmBillingPeriod.update({
      where: { id: period.id },
      data: updates,
    });

    // Audit log
    await auditLog({
      action: "RPM_ACTIVITY_LOGGED",
      entityType: "RPM_BILLING_PERIOD",
      entityId: period.id,
      userId: activity.userId,
      organizationId,
      metadata: { activity },
    });
  }

  /**
   * Update reading statistics for period
   */
  async updateReadingStatistics(
    patientId: string,
    organizationId: string
  ): Promise<void> {
    const period = await this.getCurrentBillingPeriod(patientId, organizationId);

    // Get readings for period
    const readings = await db.rpmReading.findMany({
      where: {
        patientId,
        timestamp: {
          gte: period.periodStart,
          lte: period.periodEnd,
        },
        deletedAt: null,
      },
    });

    // Calculate days with readings
    const daysWithReadings = new Set(
      readings.map((r) => r.timestamp.toISOString().split("T")[0] || "")
    ).size;

    // Calculate compliance
    const expectedDays = Math.ceil(
      (Date.now() - period.periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const complianceRate = expectedDays > 0 ? (daysWithReadings / expectedDays) * 100 : 0;

    await db.rpmBillingPeriod.update({
      where: { id: period.id },
      data: {
        readingCount: readings.length,
        daysWithReadings,
        complianceRate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calculate billable codes for period
   */
  async calculateBillableCodes(
    periodId: string,
    organizationId: string
  ): Promise<RPMBillingCode[]> {
    const period = await db.rpmBillingPeriod.findUnique({
      where: { id: periodId, organizationId },
    });

    if (!period) {
      throw new Error("Billing period not found");
    }

    const codes: RPMBillingCode[] = [];

    // Check RPM Setup (99453)
    const setupCode = this.evaluateSetupCode(period as RPMBillingPeriod);
    if (setupCode) codes.push(setupCode);

    // Check Device Supply (99454)
    const deviceCode = this.evaluateDeviceSupplyCode(period as RPMBillingPeriod);
    if (deviceCode) codes.push(deviceCode);

    // Check Interactive Communication (99457, 99458)
    const communicationCodes = this.evaluateCommunicationCodes(period as RPMBillingPeriod);
    codes.push(...communicationCodes);

    // Check Data Review (99091)
    const reviewCode = this.evaluateDataReviewCode(period as RPMBillingPeriod);
    if (reviewCode) codes.push(reviewCode);

    // Update period with codes
    await db.rpmBillingPeriod.update({
      where: { id: periodId },
      data: {
        codes,
        status: codes.some((c) => c.isBillable)
          ? BillingPeriodStatus.READY_FOR_REVIEW
          : BillingPeriodStatus.IN_PROGRESS,
        updatedAt: new Date(),
      },
    });

    return codes;
  }

  /**
   * Submit period for billing
   */
  async submitForBilling(
    periodId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    const period = await db.rpmBillingPeriod.findUnique({
      where: { id: periodId, organizationId },
    });

    if (!period) {
      throw new Error("Billing period not found");
    }

    if (period.status !== BillingPeriodStatus.APPROVED) {
      throw new Error("Period must be approved before submission");
    }

    await db.rpmBillingPeriod.update({
      where: { id: periodId },
      data: {
        submittedToBilling: true,
        submittedAt: new Date(),
        status: BillingPeriodStatus.SUBMITTED,
        updatedAt: new Date(),
      },
    });

    await auditLog({
      action: "RPM_BILLING_SUBMITTED",
      entityType: "RPM_BILLING_PERIOD",
      entityId: periodId,
      userId,
      organizationId,
      metadata: { codes: period.codes },
    });
  }

  /**
   * Get billing summary for patient
   */
  async getBillingSummary(patientId: string, organizationId: string) {
    const period = await this.getCurrentBillingPeriod(patientId, organizationId);
    const codes = await this.calculateBillableCodes(period.id, organizationId);

    const estimatedReimbursement = codes.reduce((sum, code) => {
      if (!code.isBillable) return sum;
      const cptCode = Object.values(RPM_CPT_CODES).find((c) => c.code === code.code);
      return sum + (cptCode?.reimbursementRange.min || 0) * code.quantity;
    }, 0);

    return {
      period,
      codes,
      estimatedReimbursement,
      complianceStatus: period.complianceRate >= 80 ? "compliant" : "non-compliant",
      nextSteps: this.getNextSteps(period as RPMBillingPeriod, codes),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private evaluateSetupCode(period: RPMBillingPeriod): RPMBillingCode | null {
    const cpt = RPM_CPT_CODES.RPM_SETUP;

    // Check if already billed in previous period
    // In real implementation, would check database

    const isBillable = period.setupMinutes > 0 || period.educationMinutes > 0;

    return {
      code: cpt.code,
      description: cpt.description,
      category: cpt.category,
      requirements: cpt.requirements,
      minutes: period.setupMinutes + period.educationMinutes,
      quantity: isBillable ? 1 : 0,
      isBillable,
      reason: isBillable ? null : "No setup or education activities recorded",
    };
  }

  private evaluateDeviceSupplyCode(period: RPMBillingPeriod): RPMBillingCode | null {
    const cpt = RPM_CPT_CODES.RPM_DEVICE_SUPPLY;

    const isBillable = period.daysWithReadings >= cpt.requirements.minimumDays;

    return {
      code: cpt.code,
      description: cpt.description,
      category: cpt.category,
      requirements: cpt.requirements,
      minutes: null,
      quantity: isBillable ? 1 : 0,
      isBillable,
      reason: isBillable
        ? null
        : `Insufficient days with readings (${period.daysWithReadings}/${cpt.requirements.minimumDays})`,
    };
  }

  private evaluateCommunicationCodes(period: RPMBillingPeriod): RPMBillingCode[] {
    const codes: RPMBillingCode[] = [];
    const initialCpt = RPM_CPT_CODES.RPM_INITIAL_MONITORING;
    const additionalCpt = RPM_CPT_CODES.RPM_ADDITIONAL_MONITORING;

    const communicationMinutes = period.careCoordinationMinutes;

    if (communicationMinutes >= 20) {
      // Initial 20 minutes
      codes.push({
        code: initialCpt.code,
        description: initialCpt.description,
        category: initialCpt.category,
        requirements: initialCpt.requirements,
        minutes: 20,
        quantity: 1,
        isBillable: true,
        reason: null,
      });

      // Additional 20-minute increments
      const additionalIncrements = Math.floor((communicationMinutes - 20) / 20);
      if (additionalIncrements > 0) {
        codes.push({
          code: additionalCpt.code,
          description: additionalCpt.description,
          category: additionalCpt.category,
          requirements: additionalCpt.requirements,
          minutes: additionalIncrements * 20,
          quantity: additionalIncrements,
          isBillable: true,
          reason: null,
        });
      }
    } else {
      codes.push({
        code: initialCpt.code,
        description: initialCpt.description,
        category: initialCpt.category,
        requirements: initialCpt.requirements,
        minutes: communicationMinutes,
        quantity: 0,
        isBillable: false,
        reason: `Insufficient interactive communication time (${communicationMinutes}/20 minutes)`,
      });
    }

    return codes;
  }

  private evaluateDataReviewCode(period: RPMBillingPeriod): RPMBillingCode | null {
    const cpt = RPM_CPT_CODES.RPM_RESPIRATORY;

    const isBillable =
      period.dataReviewMinutes >= (cpt.requirements.minimumMinutes || 0) &&
      period.daysWithReadings >= cpt.requirements.minimumDays;

    return {
      code: cpt.code,
      description: cpt.description,
      category: cpt.category,
      requirements: cpt.requirements,
      minutes: period.dataReviewMinutes,
      quantity: isBillable ? 1 : 0,
      isBillable,
      reason: isBillable
        ? null
        : `Insufficient data review time or days (${period.dataReviewMinutes}/${cpt.requirements.minimumMinutes} min, ${period.daysWithReadings}/${cpt.requirements.minimumDays} days)`,
    };
  }

  private getNextSteps(period: RPMBillingPeriod, codes: RPMBillingCode[]): string[] {
    const steps: string[] = [];

    const deviceCode = codes.find((c) => c.code === "99454");
    if (deviceCode && !deviceCode.isBillable) {
      const needed = 16 - period.daysWithReadings;
      steps.push(`Need ${needed} more days with readings to bill 99454`);
    }

    const communicationCode = codes.find((c) => c.code === "99457");
    if (communicationCode && !communicationCode.isBillable) {
      const needed = 20 - period.careCoordinationMinutes;
      steps.push(`Need ${needed} more minutes of interactive communication to bill 99457`);
    }

    if (period.complianceRate < 80) {
      steps.push(`Improve patient compliance (currently ${period.complianceRate.toFixed(0)}%)`);
    }

    if (steps.length === 0) {
      steps.push("Ready for review and submission");
    }

    return steps;
  }
}

export const rpmBillingManager = new RPMBillingManager();
