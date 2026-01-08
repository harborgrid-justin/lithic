/**
 * Research Billing and Coverage Analysis
 * Lithic Healthcare Platform v0.5
 *
 * Determines what's billable to insurance vs sponsor
 */

import {
  CoverageAnalysis,
  ProcedureCoverage,
  VisitType,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class BillingAnalyzer {
  private static instance: BillingAnalyzer;
  private analyses: Map<string, CoverageAnalysis> = new Map();

  private constructor() {}

  static getInstance(): BillingAnalyzer {
    if (!BillingAnalyzer.instance) {
      BillingAnalyzer.instance = new BillingAnalyzer();
    }
    return BillingAnalyzer.instance;
  }

  /**
   * Analyze coverage for trial procedures
   */
  async analyzeCoverage(
    trialId: string,
    procedures: Array<{
      code: string;
      name: string;
      visitType: VisitType;
      frequency: number;
    }>,
    userId: string,
    organizationId: string
  ): Promise<CoverageAnalysis> {
    try {
      const procedureCoverages: ProcedureCoverage[] = [];

      for (const proc of procedures) {
        const coverage = await this.determineProcedureCoverage(proc);
        procedureCoverages.push(coverage);
      }

      const analysis: CoverageAnalysis = {
        id: this.generateId(),
        trialId,
        procedures: procedureCoverages,
        generatedAt: new Date(),
        generatedBy: userId,
      };

      this.analyses.set(analysis.id, analysis);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "coverage_analysis",
        resourceId: analysis.id,
        details: {
          trialId,
          procedureCount: procedures.length,
        },
        organizationId,
      });

      return analysis;
    } catch (error) {
      throw new Error(
        `Failed to analyze coverage: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Determine coverage for a specific procedure
   */
  private async determineProcedureCoverage(procedure: {
    code: string;
    name: string;
    visitType: VisitType;
    frequency: number;
  }): Promise<ProcedureCoverage> {
    // Determine if procedure is standard of care or research-only
    const isStandardOfCare = await this.isStandardOfCare(
      procedure.code,
      procedure.visitType
    );

    return {
      procedureCode: procedure.code,
      procedureName: procedure.name,
      visitType: procedure.visitType,
      standardOfCare: isStandardOfCare,
      researchOnly: !isStandardOfCare,
      billableToInsurance: isStandardOfCare,
      billableToSponsor: !isStandardOfCare,
      cost: await this.estimateCost(procedure.code),
      frequency: procedure.frequency,
    };
  }

  /**
   * Check if procedure is standard of care
   */
  private async isStandardOfCare(
    procedureCode: string,
    visitType: VisitType
  ): Promise<boolean> {
    // This would integrate with clinical guidelines database
    // For now, simple heuristic: screening and baseline visits are usually SOC
    const socVisitTypes = [VisitType.SCREENING, VisitType.BASELINE];

    // Common SOC procedures (simplified)
    const socProcedures = [
      "99213", // Office visit
      "80053", // Comprehensive metabolic panel
      "85025", // CBC
      "93000", // ECG
    ];

    return (
      socVisitTypes.includes(visitType) ||
      socProcedures.includes(procedureCode)
    );
  }

  /**
   * Estimate procedure cost
   */
  private async estimateCost(procedureCode: string): Promise<number> {
    // This would integrate with fee schedule database
    // Returning mock data
    const costs: Record<string, number> = {
      "99213": 150.0,
      "80053": 45.0,
      "85025": 25.0,
      "93000": 75.0,
    };

    return costs[procedureCode] || 100.0;
  }

  /**
   * Calculate total study costs
   */
  async calculateStudyCosts(analysisId: string): Promise<{
    totalCost: number;
    insuranceCost: number;
    sponsorCost: number;
    perSubjectCost: number;
  }> {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    let totalCost = 0;
    let insuranceCost = 0;
    let sponsorCost = 0;

    for (const proc of analysis.procedures) {
      const cost = (proc.cost || 0) * proc.frequency;
      totalCost += cost;

      if (proc.billableToInsurance) {
        insuranceCost += cost;
      }
      if (proc.billableToSponsor) {
        sponsorCost += cost;
      }
    }

    return {
      totalCost,
      insuranceCost,
      sponsorCost,
      perSubjectCost: totalCost,
    };
  }

  /**
   * Generate billing summary report
   */
  async generateBillingSummary(analysisId: string): Promise<{
    analysis: CoverageAnalysis;
    costs: any;
    breakdown: {
      standardOfCare: number;
      researchOnly: number;
    };
  }> {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    const costs = await this.calculateStudyCosts(analysisId);

    const standardOfCare = analysis.procedures.filter((p) => p.standardOfCare)
      .length;
    const researchOnly = analysis.procedures.filter((p) => p.researchOnly)
      .length;

    return {
      analysis,
      costs,
      breakdown: {
        standardOfCare,
        researchOnly,
      },
    };
  }

  private generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const billingAnalyzer = BillingAnalyzer.getInstance();
