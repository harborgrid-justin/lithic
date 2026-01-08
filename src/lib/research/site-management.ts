/**
 * Multi-Site Trial Management
 * Lithic Healthcare Platform v0.5
 *
 * Manage study sites, investigators, and performance
 */

import {
  StudySite,
  SiteStatus,
  Investigator,
  StudyCoordinator,
  SitePerformance,
  SiteRegulatory,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class SiteManager {
  private static instance: SiteManager;
  private sites: Map<string, StudySite> = new Map();
  private sitesByTrial: Map<string, Set<string>> = new Map();

  private constructor() {}

  static getInstance(): SiteManager {
    if (!SiteManager.instance) {
      SiteManager.instance = new SiteManager();
    }
    return SiteManager.instance;
  }

  /**
   * Add study site to trial
   */
  async addSite(
    trialId: string,
    site: Omit<StudySite, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<StudySite> {
    try {
      const newSite: StudySite = {
        ...site,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      this.sites.set(newSite.id, newSite);

      // Index by trial
      if (!this.sitesByTrial.has(trialId)) {
        this.sitesByTrial.set(trialId, new Set());
      }
      this.sitesByTrial.get(trialId)!.add(newSite.id);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "study_site",
        resourceId: newSite.id,
        details: {
          trialId,
          siteNumber: newSite.siteNumber,
          siteName: newSite.siteName,
        },
        organizationId: newSite.organizationId,
      });

      return newSite;
    } catch (error) {
      throw new Error(
        `Failed to add site: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update site information
   */
  async updateSite(
    siteId: string,
    updates: Partial<StudySite>,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const updatedSite: StudySite = {
      ...site,
      ...updates,
      id: site.id,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.sites.set(siteId, updatedSite);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "study_site",
      resourceId: siteId,
      details: { updates },
      organizationId: site.organizationId,
    });

    return updatedSite;
  }

  /**
   * Update site status
   */
  async updateSiteStatus(
    siteId: string,
    status: SiteStatus,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const oldStatus = site.status;
    site.status = status;
    site.updatedAt = new Date();

    // Set activation/closeout dates
    if (status === SiteStatus.ACTIVE && !site.activationDate) {
      site.activationDate = new Date();
    }
    if (status === SiteStatus.CLOSED && !site.closeoutDate) {
      site.closeoutDate = new Date();
    }

    this.sites.set(siteId, site);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "site_status",
      resourceId: siteId,
      details: {
        oldStatus,
        newStatus: status,
      },
      organizationId: site.organizationId,
    });

    return site;
  }

  /**
   * Update site regulatory information
   */
  async updateRegulatory(
    siteId: string,
    regulatory: Partial<SiteRegulatory>,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    site.regulatory = {
      ...site.regulatory,
      ...regulatory,
    };
    site.updatedAt = new Date();

    this.sites.set(siteId, site);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "site_regulatory",
      resourceId: siteId,
      details: { regulatory },
      organizationId: site.organizationId,
    });

    return site;
  }

  /**
   * Update site performance metrics
   */
  async updatePerformance(
    siteId: string,
    performance: Partial<SitePerformance>,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    site.performance = {
      ...site.performance,
      ...performance,
    };
    site.updatedAt = new Date();

    this.sites.set(siteId, site);

    return site;
  }

  /**
   * Add investigator to site
   */
  async addInvestigator(
    siteId: string,
    investigator: Investigator,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    site.subInvestigators.push(investigator);
    site.updatedAt = new Date();

    this.sites.set(siteId, site);

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "site_investigator",
      resourceId: siteId,
      details: {
        investigatorId: investigator.userId,
        name: investigator.name,
      },
      organizationId: site.organizationId,
    });

    return site;
  }

  /**
   * Add study coordinator to site
   */
  async addCoordinator(
    siteId: string,
    coordinator: StudyCoordinator,
    userId: string
  ): Promise<StudySite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    site.studyCoordinators.push(coordinator);
    site.updatedAt = new Date();

    this.sites.set(siteId, site);

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "site_coordinator",
      resourceId: siteId,
      details: {
        coordinatorId: coordinator.userId,
        name: coordinator.name,
        isPrimary: coordinator.isPrimary,
      },
      organizationId: site.organizationId,
    });

    return site;
  }

  /**
   * Get site by ID
   */
  async getSite(siteId: string): Promise<StudySite | null> {
    return this.sites.get(siteId) || null;
  }

  /**
   * Get all sites for a trial
   */
  async getTrialSites(trialId: string): Promise<StudySite[]> {
    const siteIds = this.sitesByTrial.get(trialId) || new Set();
    const sites: StudySite[] = [];

    for (const siteId of siteIds) {
      const site = this.sites.get(siteId);
      if (site) {
        sites.push(site);
      }
    }

    return sites;
  }

  /**
   * Get active sites for a trial
   */
  async getActiveSites(trialId: string): Promise<StudySite[]> {
    const sites = await this.getTrialSites(trialId);
    return sites.filter((s) => s.status === SiteStatus.ACTIVE);
  }

  /**
   * Calculate aggregate site performance
   */
  async calculateAggregatePerformance(
    trialId: string
  ): Promise<{
    totalSites: number;
    activeSites: number;
    totalEnrollment: number;
    targetEnrollment: number;
    avgEnrollmentRate: number;
    avgScreenFailureRate: number;
    avgDropoutRate: number;
    totalProtocolDeviations: number;
  }> {
    const sites = await this.getTrialSites(trialId);

    const totalSites = sites.length;
    const activeSites = sites.filter((s) => s.status === SiteStatus.ACTIVE)
      .length;

    const totalEnrollment = sites.reduce(
      (sum, s) => sum + s.actualEnrollment,
      0
    );
    const targetEnrollment = sites.reduce(
      (sum, s) => sum + s.targetEnrollment,
      0
    );

    const avgEnrollmentRate =
      sites.reduce((sum, s) => sum + s.performance.enrollmentRate, 0) /
      totalSites;

    const avgScreenFailureRate =
      sites.reduce((sum, s) => sum + s.performance.screenFailureRate, 0) /
      totalSites;

    const avgDropoutRate =
      sites.reduce((sum, s) => sum + s.performance.dropoutRate, 0) /
      totalSites;

    const totalProtocolDeviations = sites.reduce(
      (sum, s) => sum + s.performance.protocolDeviations,
      0
    );

    return {
      totalSites,
      activeSites,
      totalEnrollment,
      targetEnrollment,
      avgEnrollmentRate,
      avgScreenFailureRate,
      avgDropoutRate,
      totalProtocolDeviations,
    };
  }

  /**
   * Identify underperforming sites
   */
  async identifyUnderperformingSites(
    trialId: string,
    thresholds: {
      enrollmentRate?: number;
      screenFailureRate?: number;
      dropoutRate?: number;
      protocolDeviations?: number;
    }
  ): Promise<StudySite[]> {
    const sites = await this.getActiveSites(trialId);

    return sites.filter((site) => {
      const perf = site.performance;

      if (
        thresholds.enrollmentRate &&
        perf.enrollmentRate < thresholds.enrollmentRate
      ) {
        return true;
      }

      if (
        thresholds.screenFailureRate &&
        perf.screenFailureRate > thresholds.screenFailureRate
      ) {
        return true;
      }

      if (
        thresholds.dropoutRate &&
        perf.dropoutRate > thresholds.dropoutRate
      ) {
        return true;
      }

      if (
        thresholds.protocolDeviations &&
        perf.protocolDeviations > thresholds.protocolDeviations
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Check site readiness for activation
   */
  async checkSiteReadiness(siteId: string): Promise<{
    ready: boolean;
    missingItems: string[];
  }> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error(`Site ${siteId} not found`);
    }

    const missingItems: string[] = [];

    if (!site.regulatory.irbApprovalDate) {
      missingItems.push("IRB approval");
    }

    if (!site.regulatory.contractExecuted) {
      missingItems.push("Contract execution");
    }

    if (!site.regulatory.budgetApproved) {
      missingItems.push("Budget approval");
    }

    if (!site.principalInvestigator.gcp13Certified) {
      missingItems.push("PI GCP certification");
    }

    if (!site.principalInvestigator.gcp1572Signed) {
      missingItems.push("FDA Form 1572");
    }

    if (!site.principalInvestigator.cvOnFile) {
      missingItems.push("PI CV");
    }

    if (!site.principalInvestigator.trainingComplete) {
      missingItems.push("PI training");
    }

    return {
      ready: missingItems.length === 0,
      missingItems,
    };
  }

  private generateId(): string {
    return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const siteManager = SiteManager.getInstance();
