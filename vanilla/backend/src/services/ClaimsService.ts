/**
 * ClaimsService - Handles medical claims management including
 * creation, submission, tracking, and appeals
 */

export class ClaimsService {
  constructor() {
    // Initialize database connections
  }

  async getClaims(page: number, limit: number, filters: any) {
    // Mock implementation - replace with actual database queries
    const claims = [
      {
        id: "CLM001",
        claimNumber: "CLM-2025-001",
        patientId: "PAT001",
        patientName: "John Doe",
        providerId: "PROV001",
        providerName: "Dr. Sarah Smith",
        payerId: "PAY001",
        payerName: "Blue Cross Blue Shield",
        serviceDate: "2025-12-01",
        submissionDate: "2025-12-05",
        totalCharge: 500.0,
        allowedAmount: 400.0,
        paidAmount: 320.0,
        patientResponsibility: 80.0,
        status: "paid",
        claimType: "professional",
        placeOfService: "office",
      },
      {
        id: "CLM002",
        claimNumber: "CLM-2025-002",
        patientId: "PAT002",
        patientName: "Jane Smith",
        providerId: "PROV001",
        providerName: "Dr. Sarah Smith",
        payerId: "PAY002",
        payerName: "Aetna",
        serviceDate: "2025-12-10",
        submissionDate: "2025-12-12",
        totalCharge: 350.0,
        allowedAmount: 0,
        paidAmount: 0,
        patientResponsibility: 0,
        status: "submitted",
        claimType: "professional",
        placeOfService: "office",
      },
    ];

    const summary = {
      total: claims.length,
      byStatus: {
        draft: 5,
        ready: 10,
        submitted: 25,
        accepted: 15,
        paid: 40,
        denied: 8,
        appealed: 2,
      },
      totalCharges: 25000.0,
      totalPaid: 18000.0,
      totalOutstanding: 7000.0,
    };

    return {
      claims,
      pagination: {
        page,
        limit,
        total: claims.length,
        totalPages: Math.ceil(claims.length / limit),
      },
      summary,
    };
  }

  async getClaimById(id: string) {
    return {
      id,
      claimNumber: "CLM-2025-001",
      patientId: "PAT001",
      patientName: "John Doe",
      patientDOB: "1980-05-15",
      patientGender: "M",
      patientAddress: "123 Main St, City, ST 12345",
      subscriberId: "SUB123456",
      providerId: "PROV001",
      providerName: "Dr. Sarah Smith",
      providerNPI: "1234567890",
      billingProviderId: "BP001",
      billingProviderName: "City Medical Center",
      billingProviderNPI: "0987654321",
      billingProviderTaxId: "12-3456789",
      payerId: "PAY001",
      payerName: "Blue Cross Blue Shield",
      payerAddress: "456 Insurance Ave, City, ST 12345",
      serviceDate: "2025-12-01",
      serviceFromDate: "2025-12-01",
      serviceToDate: "2025-12-01",
      admissionDate: null,
      dischargeDate: null,
      placeOfService: "office",
      claimType: "professional",
      billingType: "CMS-1500",
      status: "paid",
      submissionDate: "2025-12-05",
      submissionMethod: "electronic",
      acceptanceDate: "2025-12-06",
      paymentDate: "2025-12-15",
      lineItems: [
        {
          lineNumber: 1,
          serviceDate: "2025-12-01",
          placeOfService: "11",
          procedureCode: "99213",
          modifiers: [],
          diagnosisPointers: ["A"],
          charge: 150.0,
          units: 1,
          allowedAmount: 120.0,
          paidAmount: 96.0,
          adjustmentAmount: 30.0,
          adjustmentReason: "CO-45",
          patientResponsibility: 24.0,
        },
        {
          lineNumber: 2,
          serviceDate: "2025-12-01",
          placeOfService: "11",
          procedureCode: "85025",
          modifiers: [],
          diagnosisPointers: ["A"],
          charge: 50.0,
          units: 1,
          allowedAmount: 40.0,
          paidAmount: 32.0,
          adjustmentAmount: 10.0,
          adjustmentReason: "CO-45",
          patientResponsibility: 8.0,
        },
      ],
      diagnosisCodes: [
        {
          pointer: "A",
          code: "I10",
          description: "Essential (primary) hypertension",
        },
      ],
      totalCharge: 200.0,
      totalAllowedAmount: 160.0,
      totalPaidAmount: 128.0,
      totalAdjustmentAmount: 40.0,
      totalPatientResponsibility: 32.0,
      adjustments: [
        {
          code: "CO-45",
          groupCode: "CO",
          reasonCode: "45",
          description: "Charge exceeds fee schedule",
          amount: 40.0,
        },
      ],
      payments: [
        {
          id: "PMT001",
          paymentDate: "2025-12-15",
          amount: 128.0,
          checkNumber: "1234567",
          method: "ERA",
        },
      ],
      notes: [],
      attachments: [],
      createdAt: "2025-12-05T10:00:00Z",
      createdBy: "billing_user",
      updatedAt: "2025-12-15T14:30:00Z",
      updatedBy: "billing_user",
    };
  }

  async createClaim(claimData: any, userId: string) {
    const claim = {
      id: `CLM${Date.now()}`,
      claimNumber: `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`,
      ...claimData,
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: userId,
      totalCharge: this.calculateTotalCharge(claimData.lineItems || []),
    };

    console.log("Creating claim:", claim);

    return claim;
  }

  async updateClaim(id: string, updates: any, userId: string) {
    const claim = await this.getClaimById(id);

    const updatedClaim = {
      ...claim,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    if (updates.lineItems) {
      updatedClaim.totalCharge = this.calculateTotalCharge(updates.lineItems);
    }

    console.log("Updating claim:", updatedClaim);

    return updatedClaim;
  }

  async voidClaim(id: string, reason: string, userId: string) {
    console.log(`Voiding claim ${id} - Reason: ${reason} - By: ${userId}`);

    // Update claim status to voided
    // Record void reason in history
    // Reverse any posted payments

    return true;
  }

  async validateClaim(claimData: any) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!claimData.patientId) errors.push("Patient ID is required");
    if (!claimData.providerId) errors.push("Provider ID is required");
    if (!claimData.payerId) errors.push("Payer ID is required");
    if (!claimData.serviceDate) errors.push("Service date is required");
    if (!claimData.lineItems || claimData.lineItems.length === 0) {
      errors.push("At least one line item is required");
    }

    // Diagnosis codes validation
    if (!claimData.diagnosisCodes || claimData.diagnosisCodes.length === 0) {
      errors.push("At least one diagnosis code is required");
    }

    // Line items validation
    if (claimData.lineItems) {
      claimData.lineItems.forEach((item: any, index: number) => {
        if (!item.procedureCode) {
          errors.push(`Line ${index + 1}: Procedure code is required`);
        }
        if (!item.charge || item.charge <= 0) {
          errors.push(`Line ${index + 1}: Valid charge amount is required`);
        }
        if (!item.diagnosisPointers || item.diagnosisPointers.length === 0) {
          warnings.push(`Line ${index + 1}: No diagnosis pointer linked`);
        }
      });
    }

    // Date validations
    if (claimData.serviceDate) {
      const serviceDate = new Date(claimData.serviceDate);
      const today = new Date();
      if (serviceDate > today) {
        errors.push("Service date cannot be in the future");
      }

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (serviceDate < oneYearAgo) {
        warnings.push(
          "Service date is more than one year old - may be past timely filing",
        );
      }
    }

    // NPI validation (basic format check)
    if (claimData.providerNPI && !this.isValidNPI(claimData.providerNPI)) {
      errors.push("Invalid provider NPI format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async submitClaim(
    id: string,
    submissionMethod: string,
    edi837Data: any,
    userId: string,
  ) {
    const claim = await this.getClaimById(id);

    // Update claim status
    const updatedClaim = {
      ...claim,
      status: "submitted",
      submissionDate: new Date().toISOString(),
      submissionMethod,
      submittedBy: userId,
    };

    if (submissionMethod === "electronic" && edi837Data) {
      // Store EDI data
      updatedClaim.edi837 = edi837Data;
    }

    console.log("Submitting claim:", updatedClaim);

    return {
      claim: updatedClaim,
      submissionId: `SUB${Date.now()}`,
      batchId: submissionMethod === "electronic" ? `BATCH${Date.now()}` : null,
      edi837: submissionMethod === "electronic" ? edi837Data : null,
    };
  }

  async resubmitClaim(
    id: string,
    correctionCode: string,
    notes: string,
    userId: string,
  ) {
    const claim = await this.getClaimById(id);

    const resubmission = {
      ...claim,
      status: "resubmitted",
      originalClaimId: id,
      correctionCode,
      resubmissionNotes: notes,
      resubmittedAt: new Date().toISOString(),
      resubmittedBy: userId,
      submissionCount: (claim.submissionCount || 1) + 1,
    };

    console.log("Resubmitting claim:", resubmission);

    return resubmission;
  }

  async checkClaimStatus(id: string, userId: string) {
    // In real implementation, this would query payer's API
    const status = {
      claimId: id,
      claimNumber: "CLM-2025-001",
      currentStatus: "processing",
      payerStatus: "in_process",
      lastUpdated: new Date().toISOString(),
      processingStage: "adjudication",
      estimatedCompletionDate: "2025-12-30",
      statusHistory: [
        {
          status: "submitted",
          date: "2025-12-05",
          notes: "Claim received by payer",
        },
        {
          status: "accepted",
          date: "2025-12-06",
          notes: "Passed initial validation",
        },
        {
          status: "processing",
          date: "2025-12-10",
          notes: "Under adjudication review",
        },
      ],
      checkedAt: new Date().toISOString(),
      checkedBy: userId,
    };

    return status;
  }

  async getClaimHistory(id: string) {
    return [
      {
        id: "HIST001",
        claimId: id,
        action: "created",
        status: "draft",
        performedBy: "billing_user",
        performedAt: "2025-12-05T09:00:00Z",
        notes: "Claim created from encounter",
      },
      {
        id: "HIST002",
        claimId: id,
        action: "validated",
        status: "ready",
        performedBy: "billing_user",
        performedAt: "2025-12-05T09:30:00Z",
        notes: "Claim passed validation",
      },
      {
        id: "HIST003",
        claimId: id,
        action: "submitted",
        status: "submitted",
        performedBy: "billing_user",
        performedAt: "2025-12-05T10:00:00Z",
        notes: "Submitted electronically via EDI 837",
      },
      {
        id: "HIST004",
        claimId: id,
        action: "accepted",
        status: "accepted",
        performedBy: "system",
        performedAt: "2025-12-06T14:00:00Z",
        notes: "Accepted by payer",
      },
      {
        id: "HIST005",
        claimId: id,
        action: "payment_received",
        status: "paid",
        performedBy: "system",
        performedAt: "2025-12-15T10:00:00Z",
        notes: "Payment received via ERA",
      },
    ];
  }

  async createAppeal(claimId: string, appealData: any, userId: string) {
    const appeal = {
      id: `APL${Date.now()}`,
      claimId,
      appealLevel: appealData.appealLevel || 1,
      appealReason: appealData.reason,
      appealType: appealData.type, // 'reconsideration', 'redetermination', 'hearing'
      denialCode: appealData.denialCode,
      denialReason: appealData.denialReason,
      requestedAmount: appealData.requestedAmount,
      supportingDocuments: appealData.documents || [],
      letterContent: appealData.letterContent,
      dueDate: this.calculateAppealDueDate(appealData.appealLevel),
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    console.log("Creating appeal:", appeal);

    return appeal;
  }

  async getClaimsByBatch(batchId: string) {
    return [
      {
        id: "CLM001",
        claimNumber: "CLM-2025-001",
        batchId,
        patientName: "John Doe",
        status: "submitted",
        totalCharge: 200.0,
      },
      {
        id: "CLM002",
        claimNumber: "CLM-2025-002",
        batchId,
        patientName: "Jane Smith",
        status: "submitted",
        totalCharge: 350.0,
      },
    ];
  }

  async submitBatchClaims(
    claimIds: string[],
    submissionMethod: string,
    userId: string,
  ) {
    const batchId = `BATCH${Date.now()}`;
    const results = {
      batchId,
      successful: [] as any[],
      failed: [] as any[],
      totalSubmitted: 0,
      totalCharge: 0,
    };

    for (const claimId of claimIds) {
      try {
        const claim = await this.getClaimById(claimId);

        // Validate claim
        const validation = await this.validateClaim(claim);
        if (!validation.isValid) {
          results.failed.push({
            claimId,
            errors: validation.errors,
          });
          continue;
        }

        // Submit claim
        const result = await this.submitClaim(
          claimId,
          submissionMethod,
          null,
          userId,
        );
        results.successful.push(result);
        results.totalSubmitted++;
        results.totalCharge += claim.totalCharge;
      } catch (error) {
        results.failed.push({
          claimId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async getClaimsStats(startDate: string, endDate: string, groupBy: string) {
    return {
      totalClaims: 250,
      totalCharge: 75000.0,
      totalPaid: 55000.0,
      totalDenied: 5000.0,
      totalPending: 15000.0,
      averageClaimAmount: 300.0,
      averageDaysToPayment: 18,
      acceptanceRate: 92,
      denialRate: 8,
      byStatus: {
        draft: { count: 10, amount: 3000.0 },
        ready: { count: 15, amount: 4500.0 },
        submitted: { count: 50, amount: 15000.0 },
        accepted: { count: 30, amount: 9000.0 },
        paid: { count: 120, amount: 36000.0 },
        denied: { count: 20, amount: 6000.0 },
        appealed: { count: 5, amount: 1500.0 },
      },
      byPayer: [
        {
          payerId: "PAY001",
          payerName: "Blue Cross Blue Shield",
          claimCount: 100,
          totalCharge: 30000.0,
          totalPaid: 24000.0,
          denialRate: 5,
        },
        {
          payerId: "PAY002",
          payerName: "Aetna",
          claimCount: 80,
          totalCharge: 24000.0,
          totalPaid: 19200.0,
          denialRate: 8,
        },
      ],
      trend: [
        { date: "2025-12-01", submitted: 20, paid: 15, denied: 2 },
        { date: "2025-12-08", submitted: 25, paid: 18, denied: 3 },
        { date: "2025-12-15", submitted: 30, paid: 22, denied: 1 },
      ],
      topDenialReasons: [
        { code: "CO-16", description: "Claim lacks information", count: 8 },
        { code: "CO-18", description: "Duplicate claim", count: 5 },
        { code: "CO-45", description: "Charge exceeds fee schedule", count: 4 },
      ],
    };
  }

  // Helper methods

  private calculateTotalCharge(lineItems: any[]): number {
    return lineItems.reduce((total, item) => {
      return total + item.charge * (item.units || 1);
    }, 0);
  }

  private isValidNPI(npi: string): boolean {
    // Basic NPI validation (10 digits)
    return /^\d{10}$/.test(npi);
  }

  private calculateAppealDueDate(level: number): string {
    const daysToAdd = level === 1 ? 120 : level === 2 ? 180 : 60;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate.toISOString().split("T")[0];
  }
}
