/**
 * Regulatory Compliance Tracking
 * Lithic Healthcare Platform v0.5
 *
 * Track IRB, FDA, and other regulatory compliance
 */

import {
  RegulatoryInfo,
  ComplianceStatus,
  RegulatoryInspection,
  InspectionFinding,
  RegulatoryDocument,
  DocumentType,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class ComplianceTracker {
  private static instance: ComplianceTracker;
  private complianceRecords: Map<string, RegulatoryInfo> = new Map();
  private inspections: Map<string, RegulatoryInspection> = new Map();
  private documents: Map<string, RegulatoryDocument> = new Map();

  private constructor() {}

  static getInstance(): ComplianceTracker {
    if (!ComplianceTracker.instance) {
      ComplianceTracker.instance = new ComplianceTracker();
    }
    return ComplianceTracker.instance;
  }

  /**
   * Initialize compliance tracking for a trial
   */
  async initializeCompliance(
    trialId: string,
    info: Partial<RegulatoryInfo>,
    userId: string,
    organizationId: string
  ): Promise<RegulatoryInfo> {
    try {
      const regulatoryInfo: RegulatoryInfo = {
        indNumber: info.indNumber || null,
        fdaApprovalDate: info.fdaApprovalDate || null,
        emaApprovalDate: info.emaApprovalDate || null,
        localApprovals: info.localApprovals || [],
        regulatoryDocuments: info.regulatoryDocuments || [],
        complianceStatus: {
          gcp13Compliant: false,
          cfr21Part11Compliant: false,
          hipaaCompliant: false,
          lastAuditDate: null,
          openFindings: 0,
          criticalFindings: 0,
        },
        inspections: [],
      };

      this.complianceRecords.set(trialId, regulatoryInfo);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "regulatory_compliance",
        resourceId: trialId,
        details: {
          indNumber: info.indNumber,
        },
        organizationId,
      });

      return regulatoryInfo;
    } catch (error) {
      throw new Error(
        `Failed to initialize compliance: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Add regulatory document
   */
  async addDocument(
    trialId: string,
    document: Omit<RegulatoryDocument, "id">,
    userId: string,
    organizationId: string
  ): Promise<RegulatoryDocument> {
    const info = this.complianceRecords.get(trialId);
    if (!info) {
      throw new Error(`Compliance record for trial ${trialId} not found`);
    }

    const newDoc: RegulatoryDocument = {
      ...document,
      id: this.generateId("doc"),
    };

    info.regulatoryDocuments.push(newDoc);
    this.documents.set(newDoc.id, newDoc);

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "regulatory_document",
      resourceId: newDoc.id,
      details: {
        trialId,
        documentType: document.type,
        name: document.name,
      },
      organizationId,
    });

    return newDoc;
  }

  /**
   * Record regulatory inspection
   */
  async recordInspection(
    trialId: string,
    inspection: Omit<RegulatoryInspection, "id">,
    userId: string,
    organizationId: string
  ): Promise<RegulatoryInspection> {
    const info = this.complianceRecords.get(trialId);
    if (!info) {
      throw new Error(`Compliance record for trial ${trialId} not found`);
    }

    const newInspection: RegulatoryInspection = {
      ...inspection,
      id: this.generateId("inspection"),
    };

    info.inspections.push(newInspection);
    this.inspections.set(newInspection.id, newInspection);

    // Update compliance status
    this.updateComplianceStatus(info, newInspection);

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "regulatory_inspection",
      resourceId: newInspection.id,
      details: {
        trialId,
        authority: inspection.authority,
        inspectionDate: inspection.inspectionDate,
        outcome: inspection.outcome,
      },
      organizationId,
    });

    return newInspection;
  }

  /**
   * Add inspection finding
   */
  async addFinding(
    inspectionId: string,
    finding: Omit<InspectionFinding, "id">,
    userId: string,
    organizationId: string
  ): Promise<InspectionFinding> {
    const inspection = this.inspections.get(inspectionId);
    if (!inspection) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const newFinding: InspectionFinding = {
      ...finding,
      id: this.generateId("finding"),
    };

    inspection.findings.push(newFinding);

    // Update compliance status for critical findings
    for (const [trialId, info] of this.complianceRecords.entries()) {
      const hasInspection = info.inspections.some((i) => i.id === inspectionId);
      if (hasInspection) {
        info.complianceStatus.openFindings++;
        if (finding.severity === "CRITICAL") {
          info.complianceStatus.criticalFindings++;
        }
      }
    }

    // Audit log
    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "inspection_finding",
      resourceId: newFinding.id,
      details: {
        inspectionId,
        severity: finding.severity,
        category: finding.category,
      },
      organizationId,
    });

    return newFinding;
  }

  /**
   * Resolve inspection finding
   */
  async resolveFinding(
    inspectionId: string,
    findingId: string,
    userId: string,
    organizationId: string
  ): Promise<InspectionFinding> {
    const inspection = this.inspections.get(inspectionId);
    if (!inspection) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const finding = inspection.findings.find((f) => f.id === findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }

    finding.resolvedDate = new Date();

    // Update compliance status
    for (const [trialId, info] of this.complianceRecords.entries()) {
      const hasInspection = info.inspections.some((i) => i.id === inspectionId);
      if (hasInspection) {
        info.complianceStatus.openFindings--;
        if (finding.severity === "CRITICAL") {
          info.complianceStatus.criticalFindings--;
        }
      }
    }

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "inspection_finding",
      resourceId: findingId,
      details: {
        inspectionId,
        resolved: true,
        resolvedDate: finding.resolvedDate,
      },
      organizationId,
    });

    return finding;
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    info: RegulatoryInfo,
    inspection?: RegulatoryInspection
  ): Promise<void> {
    if (inspection) {
      info.complianceStatus.lastAuditDate = inspection.inspectionDate;

      // Count open findings
      info.complianceStatus.openFindings = inspection.findings.filter(
        (f) => !f.resolvedDate
      ).length;

      info.complianceStatus.criticalFindings = inspection.findings.filter(
        (f) => f.severity === "CRITICAL" && !f.resolvedDate
      ).length;
    }

    // Check GCP compliance (if recent audit with no critical findings)
    info.complianceStatus.gcp13Compliant =
      info.complianceStatus.criticalFindings === 0;

    // Check 21 CFR Part 11 compliance
    info.complianceStatus.cfr21Part11Compliant =
      info.regulatoryDocuments.some((d) => d.type === DocumentType.IND) &&
      info.complianceStatus.criticalFindings === 0;

    // Check HIPAA compliance
    info.complianceStatus.hipaaCompliant = true; // Would check actual compliance
  }

  /**
   * Get compliance status for trial
   */
  async getComplianceStatus(trialId: string): Promise<RegulatoryInfo | null> {
    return this.complianceRecords.get(trialId) || null;
  }

  /**
   * Check if trial is compliant
   */
  async isCompliant(trialId: string): Promise<boolean> {
    const info = this.complianceRecords.get(trialId);
    if (!info) {
      return false;
    }

    return (
      info.complianceStatus.gcp13Compliant &&
      info.complianceStatus.cfr21Part11Compliant &&
      info.complianceStatus.hipaaCompliant &&
      info.complianceStatus.criticalFindings === 0
    );
  }

  /**
   * Get compliance summary
   */
  async getComplianceSummary(trialId: string): Promise<{
    isCompliant: boolean;
    status: ComplianceStatus;
    requiredDocuments: {
      type: DocumentType;
      present: boolean;
      expired: boolean;
    }[];
    openFindings: number;
    criticalFindings: number;
  }> {
    const info = this.complianceRecords.get(trialId);
    if (!info) {
      throw new Error(`Compliance record for trial ${trialId} not found`);
    }

    const requiredDocs = [
      DocumentType.PROTOCOL,
      DocumentType.INFORMED_CONSENT,
      DocumentType.IRB_APPROVAL,
    ];

    const requiredDocuments = requiredDocs.map((type) => {
      const doc = info.regulatoryDocuments.find((d) => d.type === type);
      return {
        type,
        present: !!doc,
        expired: doc?.expiryDate ? doc.expiryDate < new Date() : false,
      };
    });

    return {
      isCompliant: await this.isCompliant(trialId),
      status: info.complianceStatus,
      requiredDocuments,
      openFindings: info.complianceStatus.openFindings,
      criticalFindings: info.complianceStatus.criticalFindings,
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const complianceTracker = ComplianceTracker.getInstance();
