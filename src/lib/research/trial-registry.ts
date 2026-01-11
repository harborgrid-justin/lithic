/**
 * Clinical Trial Registry and Management
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive trial registry system with protocol version control
 */

import {
  ClinicalTrial,
  TrialStatus,
  TrialPhase,
  ProtocolVersion,
  TrialSearchParams,
  TrialMetrics,
  StudySite,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class TrialRegistry {
  private static instance: TrialRegistry;
  private trials: Map<string, ClinicalTrial> = new Map();
  private trialsByOrganization: Map<string, Set<string>> = new Map();
  private trialsBySponsor: Map<string, Set<string>> = new Map();

  private constructor() {}

  static getInstance(): TrialRegistry {
    if (!TrialRegistry.instance) {
      TrialRegistry.instance = new TrialRegistry();
    }
    return TrialRegistry.instance;
  }

  /**
   * Register a new clinical trial
   */
  async registerTrial(
    trial: Omit<ClinicalTrial, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<ClinicalTrial> {
    try {
      // Validate trial ID uniqueness
      const existingTrial = await this.getTrialByTrialId(trial.trialId);
      if (existingTrial) {
        throw new Error(
          `Trial with ID ${trial.trialId} already exists in registry`
        );
      }

      // Create new trial record
      const newTrial: ClinicalTrial = {
        ...trial,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
        version: 1,
        versionHistory: [],
      };

      // Store trial
      this.trials.set(newTrial.id, newTrial);

      // Index by organization
      if (!this.trialsByOrganization.has(newTrial.organizationId)) {
        this.trialsByOrganization.set(newTrial.organizationId, new Set());
      }
      this.trialsByOrganization.get(newTrial.organizationId)!.add(newTrial.id);

      // Index by sponsor
      if (!this.trialsBySponsor.has(newTrial.sponsorName)) {
        this.trialsBySponsor.set(newTrial.sponsorName, new Set());
      }
      this.trialsBySponsor.get(newTrial.sponsorName)!.add(newTrial.id);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "clinical_trial",
        resourceId: newTrial.id,
        details: {
          trialId: newTrial.trialId,
          title: newTrial.title,
          phase: newTrial.phase,
          status: newTrial.status,
        },
        organizationId: newTrial.organizationId,
      });

      return newTrial;
    } catch (error) {
      throw new Error(
        `Failed to register trial: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get trial by internal ID
   */
  async getTrial(id: string): Promise<ClinicalTrial | null> {
    return this.trials.get(id) || null;
  }

  /**
   * Get trial by trial ID (e.g., NCT number)
   */
  async getTrialByTrialId(trialId: string): Promise<ClinicalTrial | null> {
    for (const trial of this.trials.values()) {
      if (trial.trialId === trialId) {
        return trial;
      }
    }
    return null;
  }

  /**
   * Update trial information
   */
  async updateTrial(
    id: string,
    updates: Partial<ClinicalTrial>,
    userId: string
  ): Promise<ClinicalTrial> {
    const trial = await this.getTrial(id);
    if (!trial) {
      throw new Error(`Trial ${id} not found`);
    }

    // Create updated trial
    const updatedTrial: ClinicalTrial = {
      ...trial,
      ...updates,
      id: trial.id, // Prevent ID change
      trialId: trial.trialId, // Prevent trial ID change
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.trials.set(id, updatedTrial);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "clinical_trial",
      resourceId: id,
      details: { updates },
      organizationId: trial.organizationId,
    });

    return updatedTrial;
  }

  /**
   * Update trial status
   */
  async updateTrialStatus(
    id: string,
    status: TrialStatus,
    userId: string,
    reason?: string
  ): Promise<ClinicalTrial> {
    const trial = await this.getTrial(id);
    if (!trial) {
      throw new Error(`Trial ${id} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(trial.status, status);

    const updatedTrial = await this.updateTrial(
      id,
      { status },
      userId
    );

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "clinical_trial_status",
      resourceId: id,
      details: {
        oldStatus: trial.status,
        newStatus: status,
        reason,
      },
      organizationId: trial.organizationId,
    });

    return updatedTrial;
  }

  /**
   * Add protocol version
   */
  async addProtocolVersion(
    trialId: string,
    version: ProtocolVersion,
    userId: string
  ): Promise<ClinicalTrial> {
    const trial = await this.getTrial(trialId);
    if (!trial) {
      throw new Error(`Trial ${trialId} not found`);
    }

    const versionHistory = [...trial.versionHistory, version];
    const versionNumber = trial.version + 1;

    const updatedTrial = await this.updateTrial(
      trialId,
      {
        version: versionNumber,
        versionHistory,
      },
      userId
    );

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "protocol_version",
      resourceId: trialId,
      details: {
        versionNumber: version.versionNumber,
        versionDate: version.versionDate,
      },
      organizationId: trial.organizationId,
    });

    return updatedTrial;
  }

  /**
   * Search trials with filters
   */
  async searchTrials(
    params: TrialSearchParams,
    organizationId: string
  ): Promise<{ trials: ClinicalTrial[]; total: number }> {
    let results: ClinicalTrial[] = [];

    // Get trials for organization
    const orgTrialIds = this.trialsByOrganization.get(organizationId) || new Set();
    for (const trialId of orgTrialIds) {
      const trial = this.trials.get(trialId);
      if (trial) {
        results.push(trial);
      }
    }

    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(
        (trial) =>
          trial.title.toLowerCase().includes(query) ||
          trial.trialId.toLowerCase().includes(query) ||
          trial.indication.toLowerCase().includes(query) ||
          trial.sponsorName.toLowerCase().includes(query)
      );
    }

    if (params.phase && params.phase.length > 0) {
      results = results.filter((trial) => params.phase!.includes(trial.phase));
    }

    if (params.status && params.status.length > 0) {
      results = results.filter((trial) =>
        params.status!.includes(trial.status)
      );
    }

    if (params.type && params.type.length > 0) {
      results = results.filter((trial) => params.type!.includes(trial.type));
    }

    if (params.indication) {
      results = results.filter((trial) =>
        trial.indication
          .toLowerCase()
          .includes(params.indication!.toLowerCase())
      );
    }

    if (params.sponsorName) {
      results = results.filter((trial) =>
        trial.sponsorName
          .toLowerCase()
          .includes(params.sponsorName!.toLowerCase())
      );
    }

    const total = results.length;

    // Apply sorting
    if (params.sortBy) {
      results.sort((a, b) => {
        const aValue = this.getNestedProperty(a, params.sortBy!);
        const bValue = this.getNestedProperty(b, params.sortBy!);

        if (aValue < bValue) return params.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return params.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    results = results.slice(start, end);

    return { trials: results, total };
  }

  /**
   * Get trials by sponsor
   */
  async getTrialsBySponsor(
    sponsorName: string
  ): Promise<ClinicalTrial[]> {
    const trialIds = this.trialsBySponsor.get(sponsorName) || new Set();
    const trials: ClinicalTrial[] = [];

    for (const trialId of trialIds) {
      const trial = this.trials.get(trialId);
      if (trial) {
        trials.push(trial);
      }
    }

    return trials;
  }

  /**
   * Get active trials for enrollment
   */
  async getActiveTrials(
    organizationId: string
  ): Promise<ClinicalTrial[]> {
    const activeStatuses: TrialStatus[] = [
      TrialStatus.RECRUITING,
      TrialStatus.ACTIVE,
      TrialStatus.ENROLLING_BY_INVITATION,
    ];

    const { trials } = await this.searchTrials(
      { status: activeStatuses },
      organizationId
    );

    return trials;
  }

  /**
   * Get trial metrics
   */
  async getTrialMetrics(trialId: string): Promise<TrialMetrics> {
    const trial = await this.getTrial(trialId);
    if (!trial) {
      throw new Error(`Trial ${trialId} not found`);
    }

    // Calculate enrollment metrics
    const enrollmentMetrics = {
      target: trial.enrollment.targetEnrollment,
      enrolled: trial.enrollment.currentEnrollment,
      screening: trial.enrollment.screeningCount,
      screenFailures:
        trial.enrollment.screeningCount - trial.enrollment.currentEnrollment,
      enrollmentRate:
        trial.enrollment.screeningCount > 0
          ? (trial.enrollment.currentEnrollment /
              trial.enrollment.screeningCount) *
            100
          : 0,
      projectedCompletion: this.calculateProjectedCompletion(trial),
    };

    // Calculate site metrics
    const siteMetrics = trial.locations.map((site) => ({
      siteId: site.id,
      siteName: site.siteName,
      enrollment: site.actualEnrollment,
      screenFailures:
        site.targetEnrollment > 0
          ? Math.floor(
              site.actualEnrollment *
                (enrollmentMetrics.screenFailures /
                  enrollmentMetrics.enrolled)
            )
          : 0,
      dropouts: 0, // Would need to query subject data
      protocolDeviations: site.performance.protocolDeviations,
      queryRate: site.performance.queryRate,
    }));

    return {
      trialId: trial.id,
      enrollmentMetrics,
      retentionMetrics: {
        activeSubjects: enrollmentMetrics.enrolled,
        completedSubjects: 0,
        withdrawnSubjects: 0,
        lostToFollowUp: 0,
        retentionRate: 100,
      },
      safetyMetrics: {
        totalAEs: 0,
        totalSAEs: 0,
        totalSUSARs: 0,
        deathCount: 0,
        aeRate: 0,
        saeRate: 0,
      },
      qualityMetrics: {
        protocolDeviations: siteMetrics.reduce(
          (sum, site) => sum + site.protocolDeviations,
          0
        ),
        openQueries: 0,
        resolvedQueries: 0,
        queryRate: 0,
        dataCompleteness: 0,
        verificationRate: 0,
      },
      siteMetrics,
      generatedAt: new Date(),
    };
  }

  /**
   * Add study site to trial
   */
  async addStudySite(
    trialId: string,
    site: StudySite,
    userId: string
  ): Promise<ClinicalTrial> {
    const trial = await this.getTrial(trialId);
    if (!trial) {
      throw new Error(`Trial ${trialId} not found`);
    }

    const locations = [...trial.locations, site];

    const updatedTrial = await this.updateTrial(
      trialId,
      { locations },
      userId
    );

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "study_site",
      resourceId: site.id,
      details: {
        trialId: trial.trialId,
        siteNumber: site.siteNumber,
        siteName: site.siteName,
      },
      organizationId: trial.organizationId,
    });

    return updatedTrial;
  }

  /**
   * Update study site
   */
  async updateStudySite(
    trialId: string,
    siteId: string,
    updates: Partial<StudySite>,
    userId: string
  ): Promise<ClinicalTrial> {
    const trial = await this.getTrial(trialId);
    if (!trial) {
      throw new Error(`Trial ${trialId} not found`);
    }

    const locations = trial.locations.map((site) =>
      site.id === siteId ? { ...site, ...updates, updatedAt: new Date() } : site
    );

    const updatedTrial = await this.updateTrial(
      trialId,
      { locations },
      userId
    );

    return updatedTrial;
  }

  // Private helper methods

  private validateStatusTransition(
    currentStatus: TrialStatus,
    newStatus: TrialStatus
  ): void {
    const validTransitions: Record<TrialStatus, TrialStatus[]> = {
      [TrialStatus.PLANNING]: [
        TrialStatus.PENDING_APPROVAL,
        TrialStatus.WITHDRAWN,
      ],
      [TrialStatus.PENDING_APPROVAL]: [
        TrialStatus.APPROVED,
        TrialStatus.WITHDRAWN,
      ],
      [TrialStatus.APPROVED]: [
        TrialStatus.RECRUITING,
        TrialStatus.WITHDRAWN,
      ],
      [TrialStatus.RECRUITING]: [
        TrialStatus.ACTIVE,
        TrialStatus.ENROLLING_BY_INVITATION,
        TrialStatus.SUSPENDED,
        TrialStatus.TERMINATED,
      ],
      [TrialStatus.ENROLLING_BY_INVITATION]: [
        TrialStatus.ACTIVE,
        TrialStatus.SUSPENDED,
        TrialStatus.TERMINATED,
      ],
      [TrialStatus.ACTIVE]: [
        TrialStatus.SUSPENDED,
        TrialStatus.COMPLETED,
        TrialStatus.TERMINATED,
      ],
      [TrialStatus.SUSPENDED]: [
        TrialStatus.ACTIVE,
        TrialStatus.TERMINATED,
      ],
      [TrialStatus.TERMINATED]: [],
      [TrialStatus.COMPLETED]: [],
      [TrialStatus.WITHDRAWN]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private calculateProjectedCompletion(
    trial: ClinicalTrial
  ): Date | null {
    if (
      !trial.enrollment.enrollmentStart ||
      trial.enrollment.currentEnrollment === 0
    ) {
      return null;
    }

    const enrollmentDays =
      (new Date().getTime() - trial.enrollment.enrollmentStart.getTime()) /
      (1000 * 60 * 60 * 24);
    const enrollmentRate =
      trial.enrollment.currentEnrollment / enrollmentDays;
    const remaining =
      trial.enrollment.targetEnrollment - trial.enrollment.currentEnrollment;
    const daysToCompletion = remaining / enrollmentRate;

    const projected = new Date();
    projected.setDate(projected.getDate() + Math.ceil(daysToCompletion));

    return projected;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }

  private generateId(): string {
    return `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const trialRegistry = TrialRegistry.getInstance();
