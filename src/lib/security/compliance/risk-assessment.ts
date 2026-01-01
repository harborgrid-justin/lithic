/**
 * Security Risk Assessment Engine
 * Continuous risk monitoring and assessment
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { logAudit } from "../audit-logger";
import { RiskAssessment, RiskType, RiskCategory, RiskLikelihood, RiskImpact, RiskStatus } from "@/types/security";

export class RiskAssessmentService {
  static async createRiskAssessment(params: {
    organizationId: string;
    type: RiskType;
    category: RiskCategory;
    description: string;
    likelihood: RiskLikelihood;
    impact: RiskImpact;
    owner: string;
  }): Promise<RiskAssessment> {
    const riskScore = params.likelihood * params.impact;
    const inherentRisk = riskScore;

    const assessment = await prisma.riskAssessment.create({
      data: {
        ...params,
        riskScore,
        inherentRisk,
        residualRisk: inherentRisk,
        status: RiskStatus.IDENTIFIED,
        mitigation: [],
        controls: [],
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      userId: params.owner,
      organizationId: params.organizationId,
      action: "RISK_IDENTIFIED",
      resource: "RiskAssessment",
      details: `New risk identified: ${params.description}`,
      metadata: { riskId: assessment.id, riskScore },
    });

    return assessment as RiskAssessment;
  }

  static async getRiskScore(organizationId: string): Promise<number> {
    const risks = await prisma.riskAssessment.findMany({
      where: {
        organizationId,
        status: { in: [RiskStatus.IDENTIFIED, RiskStatus.ASSESSING, RiskStatus.MITIGATING, RiskStatus.MONITORING] },
      },
    });

    if (risks.length === 0) return 0;

    const totalRisk = risks.reduce((sum, r) => sum + r.residualRisk, 0);
    return Math.round(totalRisk / risks.length);
  }

  static async listRisks(organizationId: string, category?: RiskCategory): Promise<RiskAssessment[]> {
    const where: any = { organizationId };
    if (category) where.category = category;

    const risks = await prisma.riskAssessment.findMany({
      where,
      orderBy: { riskScore: "desc" },
    });

    return risks as RiskAssessment[];
  }
}

export const createRiskAssessment = (params: any) => RiskAssessmentService.createRiskAssessment(params);
export const getOrganizationRiskScore = (orgId: string) => RiskAssessmentService.getRiskScore(orgId);
export const listRisks = (orgId: string, category?: RiskCategory) => RiskAssessmentService.listRisks(orgId, category);
