/**
 * HIPAA Security Rule Controls
 * Implementation of all HIPAA technical, physical, and administrative safeguards
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { ComplianceControl, ControlStatus, ControlPriority, ComplianceFramework } from "@/types/security";

export const HIPAA_CONTROLS: Partial<ComplianceControl>[] = [
  // Administrative Safeguards
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(1)(i)",
    category: "Administrative Safeguards",
    title: "Security Management Process",
    description: "Implement policies and procedures to prevent, detect, contain, and correct security violations",
    requirement: "Risk Analysis, Risk Management, Sanction Policy, Information System Activity Review",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(3)(i)",
    category: "Administrative Safeguards",
    title: "Workforce Security",
    description: "Implement policies and procedures to ensure workforce access to ePHI",
    requirement: "Authorization and/or supervision, workforce clearance, termination procedures",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(4)(i)",
    category: "Administrative Safeguards",
    title: "Information Access Management",
    description: "Implement policies for authorizing access to ePHI",
    requirement: "Isolating health care clearinghouse functions, access authorization, access establishment",
    priority: ControlPriority.HIGH,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(5)(i)",
    category: "Administrative Safeguards",
    title: "Security Awareness and Training",
    description: "Implement security awareness and training program for all workforce members",
    requirement: "Security reminders, protection from malicious software, log-in monitoring, password management",
    priority: ControlPriority.HIGH,
    automated: false,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(6)(i)",
    category: "Administrative Safeguards",
    title: "Security Incident Procedures",
    description: "Implement policies to address security incidents",
    requirement: "Response and reporting procedures",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(7)(i)",
    category: "Administrative Safeguards",
    title: "Contingency Plan",
    description: "Establish policies for responding to emergencies",
    requirement: "Data backup, disaster recovery, emergency mode operation, testing, applications and data criticality analysis",
    priority: ControlPriority.CRITICAL,
    automated: false,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.308(a)(8)",
    category: "Administrative Safeguards",
    title: "Evaluation",
    description: "Perform periodic technical and non-technical evaluation",
    requirement: "Regular evaluation of security controls effectiveness",
    priority: ControlPriority.HIGH,
    automated: true,
  },

  // Physical Safeguards
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.310(a)(1)",
    category: "Physical Safeguards",
    title: "Facility Access Controls",
    description: "Implement policies to limit physical access to electronic information systems",
    requirement: "Contingency operations, facility security plan, access control and validation, maintenance records",
    priority: ControlPriority.HIGH,
    automated: false,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.310(b)",
    category: "Physical Safeguards",
    title: "Workstation Use",
    description: "Implement policies for workstation functions and access to ePHI",
    requirement: "Proper workstation use policies",
    priority: ControlPriority.MEDIUM,
    automated: false,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.310(c)",
    category: "Physical Safeguards",
    title: "Workstation Security",
    description: "Implement physical safeguards for workstations accessing ePHI",
    requirement: "Restrict access and protect from unauthorized access",
    priority: ControlPriority.MEDIUM,
    automated: false,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.310(d)(1)",
    category: "Physical Safeguards",
    title: "Device and Media Controls",
    description: "Implement policies for disposal, media reuse, accountability, and data backup",
    requirement: "Disposal, media reuse, accountability, data backup and storage",
    priority: ControlPriority.HIGH,
    automated: true,
  },

  // Technical Safeguards
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.312(a)(1)",
    category: "Technical Safeguards",
    title: "Access Control",
    description: "Implement technical policies to allow only authorized access to ePHI",
    requirement: "Unique user identification, emergency access, automatic logoff, encryption and decryption",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.312(b)",
    category: "Technical Safeguards",
    title: "Audit Controls",
    description: "Implement hardware, software, and procedural mechanisms to record and examine activity",
    requirement: "Record and examine access and other activity in systems containing ePHI",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.312(c)(1)",
    category: "Technical Safeguards",
    title: "Integrity",
    description: "Implement policies to ensure ePHI is not improperly altered or destroyed",
    requirement: "Mechanism to authenticate ePHI",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.312(d)",
    category: "Technical Safeguards",
    title: "Person or Entity Authentication",
    description: "Implement procedures to verify identity of persons or entities",
    requirement: "Verify that person or entity is who they claim to be",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
  {
    framework: ComplianceFramework.HIPAA,
    controlId: "164.312(e)(1)",
    category: "Technical Safeguards",
    title: "Transmission Security",
    description: "Implement technical security measures to guard against unauthorized access during transmission",
    requirement: "Integrity controls, encryption",
    priority: ControlPriority.CRITICAL,
    automated: true,
  },
];

export class HIPAAComplianceService {
  /**
   * Initialize HIPAA controls for organization
   */
  static async initializeControls(organizationId: string, ownerId: string): Promise<void> {
    for (const control of HIPAA_CONTROLS) {
      await prisma.complianceControl.upsert({
        where: {
          organizationId_framework_controlId: {
            organizationId,
            framework: ComplianceFramework.HIPAA,
            controlId: control.controlId!,
          },
        },
        create: {
          ...control,
          organizationId,
          owner: ownerId,
          status: ControlStatus.NOT_TESTED,
          evidence: [],
        } as any,
        update: {},
      });
    }
  }

  /**
   * Assess HIPAA compliance status
   */
  static async assessCompliance(organizationId: string): Promise<{
    overallScore: number;
    compliantControls: number;
    totalControls: number;
    criticalFindings: number;
    status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
  }> {
    const controls = await prisma.complianceControl.findMany({
      where: {
        organizationId,
        framework: ComplianceFramework.HIPAA,
      },
    });

    const totalControls = controls.length;
    const compliantControls = controls.filter(
      (c) => c.status === ControlStatus.COMPLIANT,
    ).length;
    const criticalFindings = controls.filter(
      (c) =>
        c.priority === ControlPriority.CRITICAL &&
        c.status === ControlStatus.NON_COMPLIANT,
    ).length;

    const overallScore = (compliantControls / totalControls) * 100;

    let status: "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT";
    if (overallScore >= 95 && criticalFindings === 0) {
      status = "COMPLIANT";
    } else if (overallScore >= 70) {
      status = "PARTIALLY_COMPLIANT";
    } else {
      status = "NON_COMPLIANT";
    }

    return {
      overallScore,
      compliantControls,
      totalControls,
      criticalFindings,
      status,
    };
  }

  /**
   * Test specific control
   */
  static async testControl(
    controlId: string,
    organizationId: string,
    testResults: {
      passed: boolean;
      findings?: string[];
      evidence?: any;
    },
  ): Promise<void> {
    const status = testResults.passed
      ? ControlStatus.COMPLIANT
      : ControlStatus.NON_COMPLIANT;

    await prisma.complianceControl.update({
      where: {
        organizationId_framework_controlId: {
          organizationId,
          framework: ComplianceFramework.HIPAA,
          controlId,
        },
      },
      data: {
        status,
        testDate: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        findings: testResults.findings || [],
        evidence: testResults.evidence
          ? [...((await prisma.complianceControl.findFirst({
              where: { controlId, organizationId },
            }))?.evidence as any[] || []), testResults.evidence]
          : undefined,
      },
    });
  }

  /**
   * Generate HIPAA compliance report
   */
  static async generateReport(organizationId: string): Promise<any> {
    const assessment = await this.assessCompliance(organizationId);
    const controls = await prisma.complianceControl.findMany({
      where: {
        organizationId,
        framework: ComplianceFramework.HIPAA,
      },
    });

    return {
      framework: ComplianceFramework.HIPAA,
      generatedAt: new Date(),
      ...assessment,
      controls: controls.map((c) => ({
        controlId: c.controlId,
        title: c.title,
        status: c.status,
        priority: c.priority,
        lastTested: c.testDate,
        findings: c.findings,
      })),
    };
  }
}

export const initializeHIPAAControls = (organizationId: string, ownerId: string) =>
  HIPAAComplianceService.initializeControls(organizationId, ownerId);
export const assessHIPAACompliance = (organizationId: string) =>
  HIPAAComplianceService.assessCompliance(organizationId);
export const testHIPAAControl = (controlId: string, organizationId: string, testResults: any) =>
  HIPAAComplianceService.testControl(controlId, organizationId, testResults);
export const generateHIPAAReport = (organizationId: string) =>
  HIPAAComplianceService.generateReport(organizationId);
