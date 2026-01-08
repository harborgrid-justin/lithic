/**
 * Protocol Management and Version Control
 * Lithic Healthcare Platform v0.5
 *
 * Protocol versioning, amendments, and approvals tracking
 */

import {
  ProtocolVersion,
  Amendment,
  ProtocolApproval,
  ProtocolStatus,
  AmendmentType,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class ProtocolManager {
  private static instance: ProtocolManager;
  private protocols: Map<string, ProtocolVersion[]> = new Map();
  private amendments: Map<string, Amendment> = new Map();
  private approvals: Map<string, ProtocolApproval> = new Map();

  private constructor() {}

  static getInstance(): ProtocolManager {
    if (!ProtocolManager.instance) {
      ProtocolManager.instance = new ProtocolManager();
    }
    return ProtocolManager.instance;
  }

  /**
   * Create initial protocol version
   */
  async createProtocol(
    trialId: string,
    protocol: Omit<ProtocolVersion, "id" | "createdAt" | "updatedAt">,
    userId: string,
    organizationId: string
  ): Promise<ProtocolVersion> {
    try {
      const newProtocol: ProtocolVersion = {
        ...protocol,
        id: this.generateId("protocol"),
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      const versions = this.protocols.get(trialId) || [];
      versions.push(newProtocol);
      this.protocols.set(trialId, versions);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "protocol",
        resourceId: newProtocol.id,
        details: {
          trialId,
          versionNumber: newProtocol.versionNumber,
        },
        organizationId,
      });

      return newProtocol;
    } catch (error) {
      throw new Error(
        `Failed to create protocol: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create protocol amendment
   */
  async createAmendment(
    trialId: string,
    protocolId: string,
    amendment: Omit<Amendment, "id">,
    userId: string,
    organizationId: string
  ): Promise<Amendment> {
    try {
      const versions = this.protocols.get(trialId);
      if (!versions) {
        throw new Error(`No protocols found for trial ${trialId}`);
      }

      const protocol = versions.find((p) => p.id === protocolId);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }

      const newAmendment: Amendment = {
        ...amendment,
        id: this.generateId("amendment"),
      };

      // Add amendment to protocol
      protocol.amendments.push(newAmendment);
      this.amendments.set(newAmendment.id, newAmendment);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "protocol_amendment",
        resourceId: newAmendment.id,
        details: {
          trialId,
          protocolId,
          amendmentNumber: newAmendment.amendmentNumber,
          type: newAmendment.type,
        },
        organizationId,
      });

      return newAmendment;
    } catch (error) {
      throw new Error(
        `Failed to create amendment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create new protocol version (after substantial amendment)
   */
  async createNewVersion(
    trialId: string,
    currentProtocolId: string,
    newVersionData: Partial<ProtocolVersion>,
    userId: string,
    organizationId: string
  ): Promise<ProtocolVersion> {
    try {
      const versions = this.protocols.get(trialId) || [];
      const currentProtocol = versions.find((p) => p.id === currentProtocolId);

      if (!currentProtocol) {
        throw new Error(`Protocol ${currentProtocolId} not found`);
      }

      // Mark current protocol as superseded
      currentProtocol.status = ProtocolStatus.SUPERSEDED;
      currentProtocol.expiryDate = new Date();

      // Create new version
      const versionNumber = this.incrementVersion(
        currentProtocol.versionNumber
      );

      const newVersion: ProtocolVersion = {
        ...currentProtocol,
        ...newVersionData,
        id: this.generateId("protocol"),
        versionNumber,
        versionDate: new Date(),
        effectiveDate: newVersionData.effectiveDate || new Date(),
        expiryDate: null,
        status: ProtocolStatus.DRAFT,
        amendments: [],
        approvals: [],
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      versions.push(newVersion);
      this.protocols.set(trialId, versions);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "protocol_version",
        resourceId: newVersion.id,
        details: {
          trialId,
          previousVersion: currentProtocol.versionNumber,
          newVersion: versionNumber,
        },
        organizationId,
      });

      return newVersion;
    } catch (error) {
      throw new Error(
        `Failed to create new version: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Add protocol approval
   */
  async addApproval(
    trialId: string,
    protocolId: string,
    approval: Omit<ProtocolApproval, "id">,
    userId: string,
    organizationId: string
  ): Promise<ProtocolApproval> {
    try {
      const versions = this.protocols.get(trialId);
      if (!versions) {
        throw new Error(`No protocols found for trial ${trialId}`);
      }

      const protocol = versions.find((p) => p.id === protocolId);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }

      const newApproval: ProtocolApproval = {
        ...approval,
        id: this.generateId("approval"),
      };

      protocol.approvals.push(newApproval);
      this.approvals.set(newApproval.id, newApproval);

      // Update protocol status if needed
      if (protocol.status === ProtocolStatus.UNDER_REVIEW) {
        protocol.status = ProtocolStatus.APPROVED;
      }

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "protocol_approval",
        resourceId: newApproval.id,
        details: {
          trialId,
          protocolId,
          approverType: newApproval.approverType,
          approvalDate: newApproval.approvalDate,
        },
        organizationId,
      });

      return newApproval;
    } catch (error) {
      throw new Error(
        `Failed to add approval: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update protocol status
   */
  async updateStatus(
    trialId: string,
    protocolId: string,
    status: ProtocolStatus,
    userId: string,
    organizationId: string
  ): Promise<ProtocolVersion> {
    const versions = this.protocols.get(trialId);
    if (!versions) {
      throw new Error(`No protocols found for trial ${trialId}`);
    }

    const protocol = versions.find((p) => p.id === protocolId);
    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    const oldStatus = protocol.status;
    protocol.status = status;
    protocol.updatedAt = new Date();
    protocol.updatedBy = userId;

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "protocol_status",
      resourceId: protocolId,
      details: {
        trialId,
        oldStatus,
        newStatus: status,
      },
      organizationId,
    });

    return protocol;
  }

  /**
   * Get all protocol versions for a trial
   */
  async getProtocolVersions(trialId: string): Promise<ProtocolVersion[]> {
    return this.protocols.get(trialId) || [];
  }

  /**
   * Get current active protocol version
   */
  async getCurrentProtocol(trialId: string): Promise<ProtocolVersion | null> {
    const versions = this.protocols.get(trialId) || [];

    // Find active protocol
    const activeProtocol = versions.find(
      (p) => p.status === ProtocolStatus.ACTIVE
    );

    if (activeProtocol) {
      return activeProtocol;
    }

    // If no active, return most recent approved
    const approvedProtocols = versions.filter(
      (p) => p.status === ProtocolStatus.APPROVED
    );

    if (approvedProtocols.length > 0) {
      return approvedProtocols.sort(
        (a, b) => b.versionDate.getTime() - a.versionDate.getTime()
      )[0];
    }

    return null;
  }

  /**
   * Get protocol by ID
   */
  async getProtocol(
    trialId: string,
    protocolId: string
  ): Promise<ProtocolVersion | null> {
    const versions = this.protocols.get(trialId) || [];
    return versions.find((p) => p.id === protocolId) || null;
  }

  /**
   * Check if protocol has substantial amendments requiring new version
   */
  hasSubstantialAmendments(protocol: ProtocolVersion): boolean {
    return protocol.amendments.some(
      (a) => a.type === AmendmentType.SUBSTANTIAL
    );
  }

  /**
   * Calculate subjects affected by amendments
   */
  calculateAffectedSubjects(protocol: ProtocolVersion): number {
    return protocol.amendments.reduce(
      (total, amendment) => total + amendment.subjectsAffected,
      0
    );
  }

  /**
   * Check if reconsent is required
   */
  requiresReconsent(protocol: ProtocolVersion): boolean {
    return protocol.amendments.some((a) => a.reconsentRequired);
  }

  /**
   * Get approval status summary
   */
  getApprovalStatus(protocol: ProtocolVersion): {
    total: number;
    obtained: number;
    pending: number;
    expired: number;
  } {
    const requiredApprovers = ["IRB", "SPONSOR"];
    const obtained = protocol.approvals.filter((a) => {
      if (a.expiryDate) {
        return a.expiryDate > new Date();
      }
      return true;
    });

    const expired = protocol.approvals.filter(
      (a) => a.expiryDate && a.expiryDate <= new Date()
    );

    return {
      total: requiredApprovers.length,
      obtained: obtained.length,
      pending: requiredApprovers.length - obtained.length,
      expired: expired.length,
    };
  }

  /**
   * Validate protocol can be activated
   */
  canActivate(protocol: ProtocolVersion): {
    canActivate: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (protocol.status !== ProtocolStatus.APPROVED) {
      reasons.push("Protocol must be approved before activation");
    }

    const approvalStatus = this.getApprovalStatus(protocol);
    if (approvalStatus.obtained < approvalStatus.total) {
      reasons.push("Missing required approvals");
    }

    if (approvalStatus.expired > 0) {
      reasons.push("Some approvals have expired");
    }

    if (!protocol.documentUrl) {
      reasons.push("Protocol document must be uploaded");
    }

    return {
      canActivate: reasons.length === 0,
      reasons,
    };
  }

  // Private helper methods

  private incrementVersion(currentVersion: string): string {
    // Parse version (e.g., "1.0", "2.1", etc.)
    const parts = currentVersion.split(".");
    const major = parseInt(parts[0] || "0");
    const minor = parseInt(parts[1] || "0");

    // Increment major version
    return `${major + 1}.0`;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const protocolManager = ProtocolManager.getInstance();
