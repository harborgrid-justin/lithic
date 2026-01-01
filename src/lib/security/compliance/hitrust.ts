/**
 * HITRUST CSF (Common Security Framework) Controls
 * Healthcare-specific security framework combining HIPAA, ISO, NIST
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { ComplianceControl, ComplianceFramework, ControlStatus, ControlPriority } from "@/types/security";

export const HITRUST_CONTROLS: Partial<ComplianceControl>[] = [
  { framework: ComplianceFramework.HITRUST, controlId: "01.a", category: "Access Control", title: "User Registration", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "01.b", category: "Access Control", title: "Privilege Management", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "01.c", category: "Access Control", title: "User Password Management", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "01.d", category: "Access Control", title: "Review of User Access Rights", priority: ControlPriority.HIGH, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "02.a", category: "Audit Logging", title: "Audit Logging", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "03.a", category: "Cryptography", title: "Cryptographic Controls", priority: ControlPriority.CRITICAL, automated: true },
  { framework: ComplianceFramework.HITRUST, controlId: "09.a", category: "Incident Management", title: "Incident Management Process", priority: ControlPriority.CRITICAL, automated: false },
];

export class HITRUSTComplianceService {
  static async initializeControls(organizationId: string, ownerId: string): Promise<void> {
    const { prisma } = await import("@/lib/db");
    for (const control of HITRUST_CONTROLS) {
      await prisma.complianceControl.upsert({
        where: {
          organizationId_framework_controlId: {
            organizationId,
            framework: ComplianceFramework.HITRUST,
            controlId: control.controlId!,
          },
        },
        create: { ...control, organizationId, owner: ownerId, status: ControlStatus.NOT_TESTED, evidence: [] } as any,
        update: {},
      });
    }
  }
}

export const initializeHITRUSTControls = (orgId: string, ownerId: string) => HITRUSTComplianceService.initializeControls(orgId, ownerId);
