/**
 * SOC 2 Type II Trust Service Criteria Controls
 * Implementation of Security, Availability, Processing Integrity, Confidentiality, Privacy
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { ComplianceControl, ControlStatus, ControlPriority, ComplianceFramework } from "@/types/security";

export const SOC2_CONTROLS: Partial<ComplianceControl>[] = [
  // Security (CC)
  { framework: ComplianceFramework.SOC2, controlId: "CC1.1", category: "Control Environment", title: "COSO Principles - Demonstrates Commitment to Integrity and Ethical Values", priority: ControlPriority.CRITICAL, automated: false },
  { framework: ComplianceFramework.SOC2, controlId: "CC2.1", category: "Communication and Information", title: "Internal Communication of Information", priority: ControlPriority.HIGH, automated: false },
  { framework: ComplianceFramework.SOC2, controlId: "CC3.1", category: "Risk Assessment", title: "Specifies Objectives with Sufficient Clarity", priority: ControlPriority.HIGH, automated: false },
  { framework: ComplianceFramework.SOC2, controlId: "CC4.1", category: "Monitoring Activities", title: "Conducts Ongoing and Separate Evaluations", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "CC5.1", category: "Control Activities", title: "Selects and Develops Control Activities", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "CC6.1", category: "Logical and Physical Access", title: "Implements Logical Access Security Software", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "CC6.6", category: "Logical and Physical Access", title: "Implements Encryption to Protect Data", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "CC7.2", category: "System Operations", title: "Monitors System Components", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "CC8.1", category: "Change Management", title: "Authorizes, Designs, Develops and Documents Changes", priority: ControlPriority.HIGH, automated: false },

  // Availability (A)
  { framework: ComplianceFramework.SOC2, controlId: "A1.1", category: "Availability", title: "System Availability Performance Monitoring", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "A1.2", category: "Availability", title: "Recovery and Business Continuity", priority: ControlPriority.CRITICAL, automated: false },

  // Confidentiality (C)
  { framework: ComplianceFramework.SOC2, controlId: "C1.1", category: "Confidentiality", title: "Identifies and Maintains Confidential Information", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.SOC2, controlId: "C1.2", category: "Confidentiality", title: "Disposes of Confidential Information", priority: ControlPriority.MEDIUM, automated: false },
];

export class SOC2ComplianceService {
  static async initializeControls(organizationId: string, ownerId: string): Promise<void> {
    const { prisma } = await import("@/lib/db");
    for (const control of SOC2_CONTROLS) {
      await prisma.complianceControl.upsert({
        where: {
          organizationId_framework_controlId: {
            organizationId,
            framework: ComplianceFramework.SOC2,
            controlId: control.controlId!,
          },
        },
        create: { ...control, organizationId, owner: ownerId, status: ControlStatus.NOT_TESTED, evidence: [] } as any,
        update: {},
      });
    }
  }

  static async assessCompliance(organizationId: string): Promise<any> {
    const { prisma } = await import("@/lib/db");
    const controls = await prisma.complianceControl.findMany({
      where: { organizationId, framework: ComplianceFramework.SOC2 },
    });

    const compliantControls = controls.filter((c) => c.status === ControlStatus.COMPLIANT).length;
    const overallScore = (compliantControls / controls.length) * 100;

    return {
      overallScore,
      compliantControls,
      totalControls: controls.length,
      status: overallScore >= 90 ? "COMPLIANT" : overallScore >= 70 ? "PARTIALLY_COMPLIANT" : "NON_COMPLIANT",
    };
  }
}

export const initializeSOC2Controls = (orgId: string, ownerId: string) => SOC2ComplianceService.initializeControls(orgId, ownerId);
export const assessSOC2Compliance = (orgId: string) => SOC2ComplianceService.assessCompliance(orgId);
