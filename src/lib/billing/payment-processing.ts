/**
 * Lithic Enterprise v0.3 - Payment Processing Engine
 * ERA/835 processing, automated payment posting, refunds
 */

import type {
  ERA,
  ERAStatus,
  ClaimPayment,
  PaymentAdjustment,
  ServiceLinePayment,
  AdjustmentGroupCode,
  PaymentPosting,
  PostingMethod,
  PostedPayment,
  PostedAdjustment,
  Refund,
  RefundReason,
  RefundMethod,
  RefundStatus,
} from "@/types/billing-enterprise";
import type { Claim } from "@/types/billing";

// ============================================================================
// Payment Processing Engine
// ============================================================================

export class PaymentProcessingEngine {
  /**
   * Parse EDI 835 (ERA) file
   */
  async parseERA835(rawContent: string): Promise<ERA> {
    const lines = rawContent.split("\n");
    const segments = lines.map((line) => this.parseSegment(line));

    // Extract key information
    const eraNumber = this.extractERANumber(segments);
    const payerInfo = this.extractPayerInfo(segments);
    const checkInfo = this.extractCheckInfo(segments);
    const claimPayments = this.extractClaimPayments(segments);

    const totalPayment = claimPayments.reduce(
      (sum, cp) => sum + cp.paidAmount,
      0
    );

    return {
      id: crypto.randomUUID(),
      organizationId: "org-123", // From context
      eraNumber,
      payerId: payerInfo.payerId,
      payerName: payerInfo.payerName,
      checkNumber: checkInfo.checkNumber,
      checkDate: checkInfo.checkDate,
      paymentAmount: totalPayment,
      eftTraceNumber: checkInfo.eftTraceNumber,
      receivedDate: new Date(),
      processedDate: null,
      processedBy: null,
      status: ERAStatus.RECEIVED,
      claimPayments,
      raw835Content: rawContent,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };
  }

  /**
   * Auto-post payments from ERA
   */
  async autoPostERA(era: ERA): Promise<{
    posted: number;
    suspended: number;
    errors: Array<{ claimNumber: string; error: string }>;
  }> {
    let posted = 0;
    let suspended = 0;
    const errors: Array<{ claimNumber: string; error: string }> = [];

    for (const claimPayment of era.claimPayments) {
      try {
        // Find matching claim
        const claim = await this.findClaimByNumber(claimPayment.claimNumber);

        if (!claim) {
          errors.push({
            claimNumber: claimPayment.claimNumber,
            error: "Claim not found in system",
          });
          suspended++;
          continue;
        }

        // Validate payment amounts
        const validation = this.validatePayment(claim, claimPayment);

        if (!validation.isValid) {
          errors.push({
            claimNumber: claimPayment.claimNumber,
            error: validation.error || "Validation failed",
          });
          suspended++;
          continue;
        }

        // Post the payment
        await this.postPayment(era.id, claim, claimPayment);
        posted++;
      } catch (error: any) {
        errors.push({
          claimNumber: claimPayment.claimNumber,
          error: error.message,
        });
        suspended++;
      }
    }

    // Update ERA status
    if (posted === era.claimPayments.length) {
      era.status = ERAStatus.POSTED;
    } else if (posted > 0) {
      era.status = ERAStatus.PARTIALLY_POSTED;
    } else {
      era.status = ERAStatus.ERROR;
    }

    era.processedDate = new Date();
    era.processedBy = "auto-post";

    return { posted, suspended, errors };
  }

  /**
   * Post a payment to a claim
   */
  private async postPayment(
    eraId: string,
    claim: Claim,
    claimPayment: ClaimPayment
  ): Promise<PaymentPosting> {
    const payments: PostedPayment[] = [];
    const adjustments: PostedAdjustment[] = [];
    let transfersToPatient = 0;

    // Post service line payments
    for (const serviceLine of claimPayment.serviceLine) {
      const charge = claim.charges?.find((c) => c.cptCode === serviceLine.procedureCode);

      if (!charge) {
        console.warn(`Charge not found for code ${serviceLine.procedureCode}`);
        continue;
      }

      // Post insurance payment
      if (serviceLine.paidAmount > 0) {
        payments.push({
          chargeId: charge.id,
          amount: serviceLine.paidAmount,
          paymentType: "INSURANCE",
          checkNumber: null,
          transactionId: eraId,
        });
      }

      // Post adjustments
      for (const adjustment of serviceLine.adjustments) {
        adjustments.push({
          chargeId: charge.id,
          amount: adjustment.amount,
          adjustmentType: adjustment.groupCode,
          reasonCode: adjustment.reasonCode,
          description: adjustment.description,
        });

        // Track patient responsibility
        if (adjustment.groupCode === AdjustmentGroupCode.PR) {
          transfersToPatient += adjustment.amount;
        }
      }
    }

    // Calculate deductible, coinsurance, copay from claim-level
    if (claimPayment.deductible > 0) {
      transfersToPatient += claimPayment.deductible;
    }
    if (claimPayment.coinsurance > 0) {
      transfersToPatient += claimPayment.coinsurance;
    }
    if (claimPayment.copay > 0) {
      transfersToPatient += claimPayment.copay;
    }

    return {
      id: crypto.randomUUID(),
      eraId,
      claimId: claim.id,
      paymentDate: claimPayment.serviceDate,
      postedDate: new Date(),
      postedBy: "auto-post",
      postingMethod: PostingMethod.AUTOMATIC_ERA,
      payments,
      adjustments,
      transfersToPatient,
      notes: `Auto-posted from ERA ${eraId}`,
    };
  }

  /**
   * Manually post a payment
   */
  async postManualPayment(
    claimId: string,
    payment: {
      amount: number;
      paymentDate: Date;
      checkNumber?: string;
      chargeAllocations: Array<{
        chargeId: string;
        amount: number;
      }>;
      adjustments?: Array<{
        chargeId: string;
        amount: number;
        type: string;
        reason: string;
      }>;
    }
  ): Promise<PaymentPosting> {
    const payments: PostedPayment[] = payment.chargeAllocations.map((alloc) => ({
      chargeId: alloc.chargeId,
      amount: alloc.amount,
      paymentType: "INSURANCE",
      checkNumber: payment.checkNumber || null,
      transactionId: null,
    }));

    const adjustments: PostedAdjustment[] =
      payment.adjustments?.map((adj) => ({
        chargeId: adj.chargeId,
        amount: adj.amount,
        adjustmentType: adj.type,
        reasonCode: adj.reason,
        description: adj.reason,
      })) || [];

    return {
      id: crypto.randomUUID(),
      eraId: null,
      claimId,
      paymentDate: payment.paymentDate,
      postedDate: new Date(),
      postedBy: "manual", // From auth context
      postingMethod: PostingMethod.MANUAL_PAYMENT,
      payments,
      adjustments,
      transfersToPatient: 0,
      notes: payment.checkNumber
        ? `Manual payment - Check #${payment.checkNumber}`
        : "Manual payment",
    };
  }

  /**
   * Process a refund request
   */
  async processRefund(
    refundRequest: {
      patientId: string;
      originalPaymentId: string;
      amount: number;
      reason: RefundReason;
      method: RefundMethod;
      notes?: string;
    }
  ): Promise<Refund> {
    // Validate refund eligibility
    const validation = await this.validateRefund(
      refundRequest.originalPaymentId,
      refundRequest.amount
    );

    if (!validation.eligible) {
      throw new Error(validation.reason);
    }

    const refundNumber = this.generateRefundNumber();

    const refund: Refund = {
      id: crypto.randomUUID(),
      organizationId: "org-123",
      refundNumber,
      patientId: refundRequest.patientId,
      originalPaymentId: refundRequest.originalPaymentId,
      reason: refundRequest.reason,
      amount: refundRequest.amount,
      method: refundRequest.method,
      status: RefundStatus.REQUESTED,
      requestedBy: "current-user",
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      processedAt: null,
      checkNumber: null,
      transactionId: null,
      notes: refundRequest.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "current-user",
      updatedBy: "current-user",
    };

    // Auto-approve small refunds (<$100)
    if (refundRequest.amount < 100) {
      refund.status = RefundStatus.APPROVED;
      refund.approvedBy = "auto-approved";
      refund.approvedAt = new Date();
    } else {
      refund.status = RefundStatus.PENDING_APPROVAL;
    }

    return refund;
  }

  /**
   * Approve a refund
   */
  async approveRefund(
    refundId: string,
    approverId: string
  ): Promise<Refund> {
    // In production, would fetch from database
    const refund = await this.getRefundById(refundId);

    if (refund.status !== RefundStatus.PENDING_APPROVAL) {
      throw new Error("Refund is not in pending approval status");
    }

    refund.status = RefundStatus.APPROVED;
    refund.approvedBy = approverId;
    refund.approvedAt = new Date();
    refund.updatedAt = new Date();

    return refund;
  }

  /**
   * Calculate patient responsibility
   */
  calculatePatientResponsibility(
    claimPayment: ClaimPayment
  ): {
    deductible: number;
    coinsurance: number;
    copay: number;
    nonCovered: number;
    total: number;
  } {
    let nonCovered = 0;

    // Sum up non-covered amounts from adjustments
    claimPayment.serviceLine.forEach((sl) => {
      sl.adjustments.forEach((adj) => {
        if (
          adj.groupCode === AdjustmentGroupCode.PR &&
          adj.reasonCode === "96"
        ) {
          // Non-covered charge
          nonCovered += adj.amount;
        }
      });
    });

    const total =
      claimPayment.deductible +
      claimPayment.coinsurance +
      claimPayment.copay +
      nonCovered;

    return {
      deductible: claimPayment.deductible,
      coinsurance: claimPayment.coinsurance,
      copay: claimPayment.copay,
      nonCovered,
      total,
    };
  }

  /**
   * Generate aging report
   */
  generateARAgingReport(claims: Claim[]): {
    current: { count: number; amount: number };
    days30: { count: number; amount: number };
    days60: { count: number; amount: number };
    days90: { count: number; amount: number };
    days120Plus: { count: number; amount: number };
    total: { count: number; amount: number };
  } {
    const now = new Date();
    const buckets = {
      current: { count: 0, amount: 0 },
      days30: { count: 0, amount: 0 },
      days60: { count: 0, amount: 0 },
      days90: { count: 0, amount: 0 },
      days120Plus: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 },
    };

    claims.forEach((claim) => {
      if (!claim.submittedDate || claim.paidAmount === claim.totalCharges) {
        return; // Skip if not submitted or fully paid
      }

      const balance =
        claim.totalCharges - (claim.paidAmount || 0) - (claim.adjustedAmount || 0);

      if (balance <= 0) {
        return;
      }

      const daysOld = Math.floor(
        (now.getTime() - new Date(claim.submittedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      buckets.total.count++;
      buckets.total.amount += balance;

      if (daysOld <= 30) {
        buckets.current.count++;
        buckets.current.amount += balance;
      } else if (daysOld <= 60) {
        buckets.days30.count++;
        buckets.days30.amount += balance;
      } else if (daysOld <= 90) {
        buckets.days60.count++;
        buckets.days60.amount += balance;
      } else if (daysOld <= 120) {
        buckets.days90.count++;
        buckets.days90.amount += balance;
      } else {
        buckets.days120Plus.count++;
        buckets.days120Plus.amount += balance;
      }
    });

    return buckets;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private parseSegment(line: string): { id: string; elements: string[] } {
    const elements = line.split("*");
    const id = elements[0];
    return { id, elements: elements.slice(1) };
  }

  private extractERANumber(
    segments: Array<{ id: string; elements: string[] }>
  ): string {
    // TRN segment contains trace number
    const trnSegment = segments.find((s) => s.id === "TRN");
    return trnSegment?.elements[1] || `ERA${Date.now()}`;
  }

  private extractPayerInfo(
    segments: Array<{ id: string; elements: string[] }>
  ): { payerId: string; payerName: string } {
    // N1 segment with entity identifier code "PR" is the payer
    const payerSegment = segments.find(
      (s) => s.id === "N1" && s.elements[0] === "PR"
    );
    return {
      payerId: payerSegment?.elements[3] || "UNKNOWN",
      payerName: payerSegment?.elements[1] || "Unknown Payer",
    };
  }

  private extractCheckInfo(
    segments: Array<{ id: string; elements: string[] }>
  ): {
    checkNumber: string | null;
    checkDate: Date;
    eftTraceNumber: string | null;
  } {
    // BPR segment contains payment information
    const bprSegment = segments.find((s) => s.id === "BPR");

    const checkNumber = bprSegment?.elements[15] || null;
    const checkDate = bprSegment?.elements[16]
      ? this.parseEDIDate(bprSegment.elements[16])
      : new Date();
    const eftTraceNumber = bprSegment?.elements[14] || null;

    return { checkNumber, checkDate, eftTraceNumber };
  }

  private extractClaimPayments(
    segments: Array<{ id: string; elements: string[] }>
  ): ClaimPayment[] {
    const claimPayments: ClaimPayment[] = [];
    let currentClaim: Partial<ClaimPayment> | null = null;
    let currentServiceLines: ServiceLinePayment[] = [];

    segments.forEach((segment) => {
      if (segment.id === "CLP") {
        // Claim payment information
        if (currentClaim) {
          currentClaim.serviceLine = currentServiceLines;
          claimPayments.push(currentClaim as ClaimPayment);
        }

        currentClaim = {
          claimId: "", // Will be matched later
          claimNumber: segment.elements[0],
          patientName: "",
          patientAccountNumber: segment.elements[6] || "",
          serviceDate: new Date(),
          billedAmount: parseFloat(segment.elements[2] || "0"),
          allowedAmount: 0,
          paidAmount: parseFloat(segment.elements[3] || "0"),
          deductible: 0,
          coinsurance: 0,
          copay: 0,
          patientResponsibility: parseFloat(segment.elements[4] || "0"),
          adjustments: [],
          serviceLine: [],
          remarCodes: [],
        };
        currentServiceLines = [];
      } else if (segment.id === "SVC" && currentClaim) {
        // Service line information
        const serviceLine: ServiceLinePayment = {
          lineNumber: currentServiceLines.length + 1,
          procedureCode: segment.elements[0].split(":")[1] || "",
          modifiers: [],
          billedAmount: parseFloat(segment.elements[1] || "0"),
          allowedAmount: 0,
          paidAmount: parseFloat(segment.elements[2] || "0"),
          adjustments: [],
          units: parseFloat(segment.elements[4] || "1"),
          dateOfService: currentClaim.serviceDate || new Date(),
        };
        currentServiceLines.push(serviceLine);
      } else if (segment.id === "CAS" && currentServiceLines.length > 0) {
        // Claim adjustment segment
        const groupCode = segment.elements[0] as AdjustmentGroupCode;
        const reasonCode = segment.elements[1];
        const amount = parseFloat(segment.elements[2] || "0");

        const adjustment: PaymentAdjustment = {
          groupCode,
          reasonCode,
          remarkCode: null,
          amount,
          description: this.getAdjustmentDescription(reasonCode),
        };

        const currentLine =
          currentServiceLines[currentServiceLines.length - 1];
        currentLine.adjustments.push(adjustment);
      } else if (segment.id === "DTM" && currentClaim) {
        // Date/time reference
        if (segment.elements[0] === "232") {
          // Service date
          currentClaim.serviceDate = this.parseEDIDate(segment.elements[1]);
        }
      }
    });

    // Add last claim
    if (currentClaim) {
      currentClaim.serviceLine = currentServiceLines;
      claimPayments.push(currentClaim as ClaimPayment);
    }

    return claimPayments;
  }

  private parseEDIDate(ediDate: string): Date {
    // YYYYMMDD or CCYYMMDD format
    const year = parseInt(ediDate.substring(0, 4));
    const month = parseInt(ediDate.substring(4, 6)) - 1;
    const day = parseInt(ediDate.substring(6, 8));
    return new Date(year, month, day);
  }

  private getAdjustmentDescription(reasonCode: string): string {
    const descriptions: { [key: string]: string } = {
      "1": "Deductible amount",
      "2": "Coinsurance amount",
      "3": "Copayment amount",
      "45": "Charge exceeds fee schedule/maximum allowable",
      "96": "Non-covered charge",
      "97": "Payment is included in allowance for another service/procedure",
      "109": "Claim/service not covered by this payer",
      "119": "Benefit maximum for this time period has been reached",
    };

    return descriptions[reasonCode] || `Adjustment code ${reasonCode}`;
  }

  private async findClaimByNumber(claimNumber: string): Promise<Claim | null> {
    // In production, would query database
    // Mock implementation
    return null;
  }

  private validatePayment(
    claim: Claim,
    payment: ClaimPayment
  ): { isValid: boolean; error?: string } {
    // Check if payment amount is reasonable
    if (payment.paidAmount > claim.totalCharges) {
      return {
        isValid: false,
        error: "Payment amount exceeds billed amount",
      };
    }

    // Check if already paid
    if (claim.status === "PAID") {
      return {
        isValid: false,
        error: "Claim already marked as paid",
      };
    }

    return { isValid: true };
  }

  private async validateRefund(
    originalPaymentId: string,
    amount: number
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Check if payment exists and has sufficient balance
    // Mock implementation
    if (amount <= 0) {
      return { eligible: false, reason: "Refund amount must be positive" };
    }

    if (amount > 10000) {
      return {
        eligible: false,
        reason: "Refund amount exceeds maximum allowed ($10,000)",
      };
    }

    return { eligible: true };
  }

  private generateRefundNumber(): string {
    return `REF${Date.now()}`;
  }

  private async getRefundById(refundId: string): Promise<Refund> {
    // Mock implementation
    throw new Error("Not implemented");
  }
}

// Singleton instance
export const paymentProcessingEngine = new PaymentProcessingEngine();
