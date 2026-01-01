/**
 * Compliance Reporting Service
 * Generate comprehensive compliance reports
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { ComplianceReport, ComplianceFramework, ReportType, ControlStatus } from "@/types/security";

export class ComplianceReportingService {
  static async generateReport(params: {
    organizationId: string;
    framework: ComplianceFramework;
    reportType: ReportType;
    periodStart: Date;
    periodEnd: Date;
    generatedBy: string;
  }): Promise<ComplianceReport> {
    const controls = await prisma.complianceControl.findMany({
      where: {
        organizationId: params.organizationId,
        framework: params.framework,
      },
    });

    const controlsTested = controls.filter((c) => c.testDate && c.testDate >= params.periodStart && c.testDate <= params.periodEnd).length;
    const controlsPassed = controls.filter((c) => c.status === ControlStatus.COMPLIANT).length;
    const controlsFailed = controls.filter((c) => c.status === ControlStatus.NON_COMPLIANT).length;
    const overallScore = controls.length > 0 ? (controlsPassed / controls.length) * 100 : 0;

    const findings = controls
      .filter((c) => c.findings && (c.findings as any[]).length > 0)
      .map((c) => ({
        id: crypto.randomUUID(),
        controlId: c.controlId,
        severity: c.priority === "CRITICAL" ? "CRITICAL" : "HIGH",
        description: ((c.findings as any[])[0] as string) || "",
        impact: "Security control non-compliance",
        recommendation: "Implement remediation plan",
        status: "OPEN",
      })) as any;

    const report = await prisma.complianceReport.create({
      data: {
        organizationId: params.organizationId,
        framework: params.framework,
        reportType: params.reportType,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        overallScore,
        controlsTested,
        controlsPassed,
        controlsFailed,
        findings,
        recommendations: ["Implement automated compliance testing", "Schedule regular security audits"],
        generatedBy: params.generatedBy,
        generatedAt: new Date(),
      },
    });

    return report as ComplianceReport;
  }

  static async exportReport(reportId: string, format: "pdf" | "xlsx" | "json"): Promise<string> {
    const report = await prisma.complianceReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new Error("Report not found");

    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }

    // PDF/XLSX export would use libraries like pdfkit or exceljs
    return `Report export not yet implemented for format: ${format}`;
  }
}

export const generateComplianceReport = (params: any) => ComplianceReportingService.generateReport(params);
export const exportComplianceReport = (reportId: string, format: "pdf" | "xlsx" | "json") =>
  ComplianceReportingService.exportReport(reportId, format);
