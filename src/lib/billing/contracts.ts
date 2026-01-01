/**
 * Lithic Enterprise v0.3 - Contract Management System
 * Fee schedules, reimbursement analysis, underpayment detection
 */

import type {
  PayerContract,
  ContractType,
  ContractStatus,
  FeeSchedule,
  FeeScheduleEntry,
  ModifierRule,
  SpecialtyRate,
  ReimbursementMethod,
  PaymentTerms,
  CarveOut,
  PerformanceMetric,
  UnderpaymentDetection,
  UnderpaymentReason,
  UnderpaymentStatus,
  CodeType,
} from "@/types/billing-enterprise";
import type { Claim } from "@/types/billing";

// ============================================================================
// Contract Management Engine
// ============================================================================

export class ContractManagementEngine {
  /**
   * Calculate expected reimbursement based on contract
   */
  async calculateExpectedReimbursement(
    claim: Claim,
    contractId: string
  ): Promise<{
    total: number;
    breakdown: Array<{
      chargeId: string;
      code: string;
      billed: number;
      expected: number;
      method: string;
    }>;
  }> {
    const contract = await this.getContract(contractId);
    const activeFeeSchedule = this.getActiveFeeSchedule(contract);

    const breakdown: Array<{
      chargeId: string;
      code: string;
      billed: number;
      expected: number;
      method: string;
    }> = [];

    let total = 0;

    for (const charge of claim.charges || []) {
      const expected = this.calculateChargeReimbursement(
        charge,
        activeFeeSchedule,
        contract.reimbursementMethod
      );

      breakdown.push({
        chargeId: charge.id,
        code: charge.cptCode,
        billed: charge.totalCharge,
        expected: expected.amount,
        method: expected.method,
      });

      total += expected.amount;
    }

    return { total, breakdown };
  }

  /**
   * Calculate reimbursement for a single charge
   */
  private calculateChargeReimbursement(
    charge: any,
    feeSchedule: FeeSchedule | null,
    method: ReimbursementMethod
  ): { amount: number; method: string } {
    let baseAmount = 0;
    let calculationMethod = "";

    if (!feeSchedule) {
      // No fee schedule - use percentage of charges
      baseAmount = charge.totalCharge * 0.6; // Default 60%
      calculationMethod = "60% of charges (default)";
    } else {
      const feeEntry = feeSchedule.fees.find((f) => f.code === charge.cptCode);

      if (feeEntry) {
        if (feeEntry.flatRate) {
          // Flat rate
          baseAmount = feeEntry.flatRate * charge.quantity;
          calculationMethod = "Flat rate";
        } else if (feeEntry.contractedRate) {
          // Contracted rate
          baseAmount = feeEntry.contractedRate * charge.quantity;
          calculationMethod = "Contracted rate";
        } else if (feeEntry.percentOfMedicare) {
          // Percentage of Medicare
          const medicareRate = this.getMedicareRate(charge.cptCode);
          baseAmount =
            medicareRate * (feeEntry.percentOfMedicare / 100) * charge.quantity;
          calculationMethod = `${feeEntry.percentOfMedicare}% of Medicare`;
        } else {
          // Use allowed amount
          baseAmount = feeEntry.allowedAmount * charge.quantity;
          calculationMethod = "Allowed amount";
        }

        // Apply modifier adjustments
        if (charge.modifiers && charge.modifiers.length > 0) {
          baseAmount = this.applyModifierAdjustments(
            baseAmount,
            charge.modifiers,
            feeSchedule.modifierRules
          );
        }

        // Apply specialty rates
        if (feeSchedule.specialtyRates) {
          baseAmount = this.applySpecialtyRates(
            baseAmount,
            charge,
            feeSchedule.specialtyRates
          );
        }
      } else {
        // Code not in fee schedule - use percentage of charges
        baseAmount = charge.totalCharge * 0.5;
        calculationMethod = "50% of charges (not in fee schedule)";
      }
    }

    return { amount: baseAmount, method: calculationMethod };
  }

  /**
   * Apply modifier adjustments to reimbursement
   */
  private applyModifierAdjustments(
    baseAmount: number,
    modifiers: string[],
    modifierRules: ModifierRule[]
  ): number {
    let adjustedAmount = baseAmount;

    modifiers.forEach((modifierCode) => {
      const rule = modifierRules.find((r) => r.modifier === modifierCode);
      if (rule) {
        if (rule.adjustmentType === "PERCENTAGE") {
          adjustedAmount *= 1 + rule.adjustment / 100;
        } else {
          adjustedAmount += rule.adjustment;
        }
      } else {
        // Default modifier adjustments
        const defaultAdjustments: { [key: string]: number } = {
          "22": 20, // Increased procedural services (+20%)
          "26": -74, // Professional component only (-74% for technical)
          "50": -50, // Bilateral procedure (-50% for second side)
          "51": -50, // Multiple procedures (-50% for additional)
          "52": -50, // Reduced services (-50%)
          "53": -50, // Discontinued procedure (-50%)
          "62": -50, // Co-surgeons (-50% each)
          "66": 25, // Team surgery (+25%)
          "76": 0, // Repeat procedure (100%)
          "77": 0, // Repeat by another physician (100%)
          "78": -70, // Return to OR (-70%)
          "79": 0, // Unrelated procedure during postop (100%)
          "80": 16, // Assistant surgeon (+16%)
          "81": 16, // Minimum assistant (+16%)
          "82": 16, // Assistant when qualified not available (+16%)
          "TC": -26, // Technical component only (-26% for professional)
        };

        if (defaultAdjustments[modifierCode]) {
          adjustedAmount *= 1 + defaultAdjustments[modifierCode] / 100;
        }
      }
    });

    return adjustedAmount;
  }

  /**
   * Apply specialty rate multipliers
   */
  private applySpecialtyRates(
    baseAmount: number,
    charge: any,
    specialtyRates: SpecialtyRate[]
  ): number {
    // Would check provider specialty and apply multiplier if applicable
    // For now, return base amount
    return baseAmount;
  }

  /**
   * Get Medicare rate for a code (mock implementation)
   */
  private getMedicareRate(code: string): number {
    // In production, this would query the Medicare fee schedule database
    // Mock rates based on code ranges
    if (code.startsWith("99")) {
      const level = parseInt(code.slice(-1));
      return 30 + level * 20; // $30-$130 range
    } else if (code.startsWith("7")) {
      return 100; // Radiology
    } else if (code.startsWith("8")) {
      return 15; // Lab
    }
    return 50;
  }

  /**
   * Detect underpayments by comparing expected vs actual
   */
  async detectUnderpayments(
    claim: Claim,
    actualPayment: number,
    contractId: string
  ): Promise<UnderpaymentDetection | null> {
    const expected = await this.calculateExpectedReimbursement(
      claim,
      contractId
    );

    const variance = expected.total - actualPayment;
    const variancePercentage = (variance / expected.total) * 100;

    // Flag if underpaid by more than 5% or $25
    if (variance > 25 && variancePercentage > 5) {
      return {
        claimId: claim.id,
        expectedAmount: expected.total,
        paidAmount: actualPayment,
        variance,
        variancePercentage,
        reason: this.determineUnderpaymentReason(
          claim,
          expected.breakdown,
          actualPayment
        ),
        contractReference: contractId,
        flaggedAt: new Date(),
        status: UnderpaymentStatus.DETECTED,
      };
    }

    return null;
  }

  /**
   * Determine reason for underpayment
   */
  private determineUnderpaymentReason(
    claim: Claim,
    expectedBreakdown: any[],
    actualPayment: number
  ): UnderpaymentReason {
    // Logic to determine reason - simplified for now
    const hasModifiers = claim.charges?.some(
      (c) => c.modifiers && c.modifiers.length > 0
    );

    if (hasModifiers) {
      return UnderpaymentReason.MISSING_MODIFIER_PAYMENT;
    }

    // Check if bundling might be the issue
    if (claim.charges && claim.charges.length > 1) {
      return UnderpaymentReason.BUNDLING_ERROR;
    }

    return UnderpaymentReason.WRONG_CONTRACTED_RATE;
  }

  /**
   * Model contract changes
   */
  modelContractChange(
    currentContract: PayerContract,
    proposedChanges: Partial<FeeSchedule>,
    historicalClaims: Claim[]
  ): {
    currentRevenue: number;
    projectedRevenue: number;
    difference: number;
    percentChange: number;
    impactByCode: Array<{
      code: string;
      currentRate: number;
      proposedRate: number;
      claimCount: number;
      revenueImpact: number;
    }>;
  } {
    let currentRevenue = 0;
    let projectedRevenue = 0;

    const codeImpactMap = new Map<
      string,
      {
        code: string;
        currentRate: number;
        proposedRate: number;
        claimCount: number;
        revenueImpact: number;
      }
    >();

    const currentFeeSchedule = this.getActiveFeeSchedule(currentContract);
    const proposedFeeSchedule = {
      ...currentFeeSchedule!,
      ...proposedChanges,
    } as FeeSchedule;

    historicalClaims.forEach((claim) => {
      claim.charges?.forEach((charge) => {
        // Calculate with current rates
        const currentReimbursement = this.calculateChargeReimbursement(
          charge,
          currentFeeSchedule,
          currentContract.reimbursementMethod
        );
        currentRevenue += currentReimbursement.amount;

        // Calculate with proposed rates
        const proposedReimbursement = this.calculateChargeReimbursement(
          charge,
          proposedFeeSchedule,
          currentContract.reimbursementMethod
        );
        projectedRevenue += proposedReimbursement.amount;

        // Track by code
        const code = charge.cptCode;
        if (!codeImpactMap.has(code)) {
          codeImpactMap.set(code, {
            code,
            currentRate: currentReimbursement.amount / charge.quantity,
            proposedRate: proposedReimbursement.amount / charge.quantity,
            claimCount: 0,
            revenueImpact: 0,
          });
        }

        const codeImpact = codeImpactMap.get(code)!;
        codeImpact.claimCount++;
        codeImpact.revenueImpact +=
          proposedReimbursement.amount - currentReimbursement.amount;
      });
    });

    const difference = projectedRevenue - currentRevenue;
    const percentChange = (difference / currentRevenue) * 100;

    return {
      currentRevenue,
      projectedRevenue,
      difference,
      percentChange,
      impactByCode: Array.from(codeImpactMap.values()).sort(
        (a, b) => Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact)
      ),
    };
  }

  /**
   * Analyze contract performance
   */
  analyzeContractPerformance(
    contract: PayerContract,
    claims: Claim[]
  ): {
    totalClaims: number;
    totalBilled: number;
    totalPaid: number;
    averageReimbursementRate: number;
    averageDaysToPayment: number;
    denialRate: number;
    performanceMetrics: {
      metric: string;
      target: number;
      actual: number;
      status: "EXCEEDS" | "MEETS" | "BELOW";
    }[];
  } {
    const totalClaims = claims.length;
    const totalBilled = claims.reduce((sum, c) => sum + c.totalCharges, 0);
    const totalPaid = claims.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const averageReimbursementRate = (totalPaid / totalBilled) * 100;

    // Calculate average days to payment
    const paidClaims = claims.filter((c) => c.paidAmount && c.paidAmount > 0);
    const totalDays = paidClaims.reduce((sum, c) => {
      if (c.submittedDate) {
        const days = Math.floor(
          (new Date().getTime() - new Date(c.submittedDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);
    const averageDaysToPayment =
      paidClaims.length > 0 ? totalDays / paidClaims.length : 0;

    // Calculate denial rate
    const deniedClaims = claims.filter((c) => c.status === "DENIED").length;
    const denialRate = (deniedClaims / totalClaims) * 100;

    // Evaluate performance metrics
    const performanceMetrics = contract.performanceMetrics.map((metric) => {
      const actual = metric.actual || 0;
      let status: "EXCEEDS" | "MEETS" | "BELOW";

      if (actual > metric.target * 1.1) {
        status = "EXCEEDS";
      } else if (actual >= metric.target * 0.9) {
        status = "MEETS";
      } else {
        status = "BELOW";
      }

      return {
        metric: metric.name,
        target: metric.target,
        actual,
        status,
      };
    });

    return {
      totalClaims,
      totalBilled,
      totalPaid,
      averageReimbursementRate,
      averageDaysToPayment,
      denialRate,
      performanceMetrics,
    };
  }

  /**
   * Compare contracts side by side
   */
  compareContracts(
    contract1: PayerContract,
    contract2: PayerContract
  ): {
    reimbursementComparison: Array<{
      code: string;
      contract1Rate: number;
      contract2Rate: number;
      difference: number;
      percentDiff: number;
    }>;
    termsComparison: {
      field: string;
      contract1: any;
      contract2: any;
    }[];
    recommendation: string;
  } {
    const fs1 = this.getActiveFeeSchedule(contract1);
    const fs2 = this.getActiveFeeSchedule(contract2);

    const reimbursementComparison: Array<{
      code: string;
      contract1Rate: number;
      contract2Rate: number;
      difference: number;
      percentDiff: number;
    }> = [];

    if (fs1 && fs2) {
      // Get all unique codes
      const allCodes = new Set([
        ...fs1.fees.map((f) => f.code),
        ...fs2.fees.map((f) => f.code),
      ]);

      allCodes.forEach((code) => {
        const fee1 = fs1.fees.find((f) => f.code === code);
        const fee2 = fs2.fees.find((f) => f.code === code);

        const rate1 = fee1?.contractedRate || fee1?.allowedAmount || 0;
        const rate2 = fee2?.contractedRate || fee2?.allowedAmount || 0;

        if (rate1 > 0 || rate2 > 0) {
          const difference = rate2 - rate1;
          const percentDiff = rate1 > 0 ? (difference / rate1) * 100 : 0;

          reimbursementComparison.push({
            code,
            contract1Rate: rate1,
            contract2Rate: rate2,
            difference,
            percentDiff,
          });
        }
      });
    }

    const termsComparison = [
      {
        field: "Payment Terms (Days)",
        contract1: contract1.paymentTerms.netDays,
        contract2: contract2.paymentTerms.netDays,
      },
      {
        field: "Contract Type",
        contract1: contract1.contractType,
        contract2: contract2.contractType,
      },
      {
        field: "Auto Renew",
        contract1: contract1.autoRenew,
        contract2: contract2.autoRenew,
      },
    ];

    // Generate recommendation
    const avgDiff =
      reimbursementComparison.reduce((sum, c) => sum + c.percentDiff, 0) /
      reimbursementComparison.length;

    let recommendation = "";
    if (avgDiff > 10) {
      recommendation = `Contract 2 offers approximately ${avgDiff.toFixed(1)}% higher reimbursement rates on average. Recommend negotiating Contract 1 rates or shifting volume to Contract 2.`;
    } else if (avgDiff < -10) {
      recommendation = `Contract 1 offers approximately ${Math.abs(avgDiff).toFixed(1)}% higher reimbursement rates on average. Contract 1 is more favorable.`;
    } else {
      recommendation = `Contracts are comparable in reimbursement rates. Consider other factors such as payment terms and administrative burden.`;
    }

    return {
      reimbursementComparison: reimbursementComparison
        .sort((a, b) => Math.abs(b.percentDiff) - Math.abs(a.percentDiff))
        .slice(0, 20), // Top 20
      termsComparison,
      recommendation,
    };
  }

  /**
   * Check for contract expiration
   */
  getExpiringContracts(
    contracts: PayerContract[],
    daysThreshold: number = 90
  ): Array<{
    contract: PayerContract;
    daysUntilExpiration: number;
    renewalAction: "AUTO_RENEW" | "NEEDS_NEGOTIATION" | "EXPIRING";
  }> {
    const now = new Date();
    const threshold = new Date(
      now.getTime() + daysThreshold * 24 * 60 * 60 * 1000
    );

    return contracts
      .filter((c) => c.expirationDate && new Date(c.expirationDate) <= threshold)
      .map((contract) => {
        const daysUntilExpiration = Math.floor(
          (new Date(contract.expirationDate!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let renewalAction: "AUTO_RENEW" | "NEEDS_NEGOTIATION" | "EXPIRING";
        if (contract.autoRenew) {
          renewalAction = "AUTO_RENEW";
        } else if (daysUntilExpiration > contract.notificationDays) {
          renewalAction = "NEEDS_NEGOTIATION";
        } else {
          renewalAction = "EXPIRING";
        }

        return {
          contract,
          daysUntilExpiration,
          renewalAction,
        };
      })
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get active fee schedule for a contract
   */
  private getActiveFeeSchedule(
    contract: PayerContract
  ): FeeSchedule | null {
    if (!contract.feeSchedules || contract.feeSchedules.length === 0) {
      return null;
    }

    const now = new Date();

    // Find the fee schedule that is currently active
    const activeSchedule = contract.feeSchedules.find((fs) => {
      const effectiveDate = new Date(fs.effectiveDate);
      const expirationDate = fs.expirationDate
        ? new Date(fs.expirationDate)
        : null;

      return (
        effectiveDate <= now && (!expirationDate || expirationDate >= now)
      );
    });

    // If no active schedule, return the most recent one
    if (!activeSchedule) {
      return contract.feeSchedules.sort(
        (a, b) =>
          new Date(b.effectiveDate).getTime() -
          new Date(a.effectiveDate).getTime()
      )[0];
    }

    return activeSchedule;
  }

  /**
   * Get contract by ID (mock implementation)
   */
  private async getContract(contractId: string): Promise<PayerContract> {
    // In production, this would query the database
    // Returning a mock contract for demonstration
    return {
      id: contractId,
      organizationId: "org-123",
      payerId: "payer-123",
      payerName: "Mock Insurance Co",
      contractNumber: "CONTRACT-001",
      contractType: ContractType.FEE_FOR_SERVICE,
      effectiveDate: new Date("2024-01-01"),
      expirationDate: new Date("2025-12-31"),
      status: ContractStatus.ACTIVE,
      feeSchedules: [
        {
          id: "fs-1",
          name: "Standard Fee Schedule",
          effectiveDate: new Date("2024-01-01"),
          expirationDate: null,
          fees: [],
          modifierRules: [],
          specialtyRates: [],
        },
      ],
      reimbursementMethod: ReimbursementMethod.FEE_SCHEDULE,
      paymentTerms: {
        netDays: 30,
        discountPercentage: null,
        discountDays: null,
        interestRate: null,
        latePaymentFee: null,
      },
      carveOuts: [],
      performanceMetrics: [],
      autoRenew: false,
      notificationDays: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };
  }
}

// Singleton instance
export const contractManagementEngine = new ContractManagementEngine();
