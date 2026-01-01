/**
 * Lithic Enterprise v0.3 - Claims Processing Engine
 * EDI 837 generation, validation, and submission
 */

import type {
  ClaimBatch,
  BatchStatus,
  ClaimValidation,
  ValidationError,
  ValidationWarning,
  PayerCheck,
  EDI837File,
  EDI837Segment,
} from "@/types/billing-enterprise";
import type { Claim, ClaimType } from "@/types/billing";

// ============================================================================
// Claims Processing Engine
// ============================================================================

export class ClaimsProcessor {
  /**
   * Validate a claim before submission
   */
  async validateClaim(claim: Claim): Promise<ClaimValidation> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validations
    if (!claim.patientId) {
      errors.push({
        code: "MISSING_PATIENT",
        field: "patientId",
        message: "Patient ID is required",
        severity: "CRITICAL",
      });
    }

    if (!claim.insuranceId) {
      errors.push({
        code: "MISSING_INSURANCE",
        field: "insuranceId",
        message: "Insurance information is required",
        severity: "CRITICAL",
      });
    }

    if (!claim.primaryDiagnosis) {
      errors.push({
        code: "MISSING_DIAGNOSIS",
        field: "primaryDiagnosis",
        message: "Primary diagnosis is required",
        severity: "ERROR",
      });
    }

    if (!claim.charges || claim.charges.length === 0) {
      errors.push({
        code: "NO_CHARGES",
        field: "charges",
        message: "At least one charge is required",
        severity: "CRITICAL",
      });
    }

    // Charge validations
    claim.charges?.forEach((charge, index) => {
      if (!charge.cptCode) {
        errors.push({
          code: "MISSING_CPT",
          field: `charges[${index}].cptCode`,
          message: "CPT code is required for each charge",
          severity: "ERROR",
        });
      }

      if (!charge.quantity || charge.quantity < 1) {
        errors.push({
          code: "INVALID_QUANTITY",
          field: `charges[${index}].quantity`,
          message: "Quantity must be at least 1",
          severity: "ERROR",
        });
      }

      if (!charge.diagnosisPointers || charge.diagnosisPointers.length === 0) {
        warnings.push({
          code: "MISSING_DX_POINTER",
          field: `charges[${index}].diagnosisPointers`,
          message: "Diagnosis pointer recommended for medical necessity",
          canOverride: true,
        });
      }
    });

    // Provider validations
    if (!claim.billingProvider) {
      errors.push({
        code: "MISSING_BILLING_PROVIDER",
        field: "billingProvider",
        message: "Billing provider is required",
        severity: "ERROR",
      });
    }

    if (!claim.renderingProvider) {
      warnings.push({
        code: "MISSING_RENDERING_PROVIDER",
        field: "renderingProvider",
        message: "Rendering provider recommended",
        canOverride: true,
      });
    }

    // Date validations
    if (claim.serviceDate > new Date()) {
      errors.push({
        code: "FUTURE_SERVICE_DATE",
        field: "serviceDate",
        message: "Service date cannot be in the future",
        severity: "ERROR",
      });
    }

    const daysSinceService = Math.floor(
      (new Date().getTime() - new Date(claim.serviceDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceService > 90) {
      warnings.push({
        code: "TIMELY_FILING_WARNING",
        field: "serviceDate",
        message: `Service is ${daysSinceService} days old. Check timely filing limits.`,
        canOverride: false,
      });
    }

    // Payer-specific validations
    const payerChecks = await this.runPayerSpecificRules(claim);

    return {
      claimId: claim.id,
      isValid: errors.length === 0,
      errors,
      warnings,
      payerSpecificChecks: payerChecks,
    };
  }

  /**
   * Run payer-specific validation rules
   */
  private async runPayerSpecificRules(claim: Claim): Promise<PayerCheck[]> {
    const checks: PayerCheck[] = [];

    // Mock payer rules - in production, these would be loaded from a rules engine
    const payerRules = this.getPayerRules(claim.insuranceId);

    const payerCheck: PayerCheck = {
      payerId: claim.insuranceId,
      payerName: "Mock Insurance Co", // Would fetch from database
      checks: [],
    };

    // Example rule: Prior auth required for certain procedures
    if (payerRules.requiresPriorAuth) {
      const requiresAuth = claim.charges?.some(
        (c) => this.isPriorAuthRequired(c.cptCode)
      );
      payerCheck.checks.push({
        rule: "Prior Authorization Required",
        passed: requiresAuth ? !!claim.priorAuthNumber : true,
        message: requiresAuth
          ? claim.priorAuthNumber
            ? "Prior auth number present"
            : "Prior auth number required for this procedure"
          : "Prior auth not required",
      });
    }

    // Example rule: Referral required
    if (payerRules.requiresReferral) {
      payerCheck.checks.push({
        rule: "Referral Required",
        passed: !!claim.referralNumber,
        message: claim.referralNumber
          ? "Referral number present"
          : "Referral number required for specialist visits",
      });
    }

    // Example rule: Maximum units per service
    const unitsCheck = this.checkMaximumUnits(claim);
    payerCheck.checks.push(unitsCheck);

    checks.push(payerCheck);

    return checks;
  }

  private getPayerRules(payerId: string): any {
    // Mock rules - in production, load from database
    return {
      requiresPriorAuth: true,
      requiresReferral: false,
      maximumUnits: {
        "99214": 1,
        "97110": 4, // Physical therapy
      },
    };
  }

  private isPriorAuthRequired(cptCode: string): boolean {
    // Mock logic - in production, check against payer-specific lists
    const priorAuthCodes = ["27447", "27130", "43644"]; // Example surgical codes
    return priorAuthCodes.includes(cptCode);
  }

  private checkMaximumUnits(claim: Claim): {
    rule: string;
    passed: boolean;
    message: string;
  } {
    const maxUnits = this.getPayerRules(claim.insuranceId).maximumUnits;
    let passed = true;
    let message = "All service units within limits";

    claim.charges?.forEach((charge) => {
      const max = maxUnits[charge.cptCode];
      if (max && charge.quantity > max) {
        passed = false;
        message = `Code ${charge.cptCode} exceeds maximum of ${max} units`;
      }
    });

    return {
      rule: "Maximum Units Per Service",
      passed,
      message,
    };
  }

  /**
   * Generate EDI 837 Professional (P) file
   */
  generateEDI837P(claims: Claim[]): EDI837File {
    const interchangeControlNumber = this.generateControlNumber();
    const functionalGroupControlNumber = this.generateControlNumber();
    const transactionControlNumber = this.generateControlNumber();

    const segments: EDI837Segment[] = [];

    // ISA - Interchange Control Header
    segments.push(this.createISASegment(interchangeControlNumber));

    // GS - Functional Group Header
    segments.push(
      this.createGSSegment(functionalGroupControlNumber, claims.length)
    );

    // ST - Transaction Set Header
    segments.push(this.createSTSegment(transactionControlNumber));

    // BHT - Beginning of Hierarchical Transaction
    segments.push(this.createBHTSegment());

    // Loop 1000A - Submitter
    segments.push(...this.createSubmitterLoop());

    // Loop 1000B - Receiver
    segments.push(...this.createReceiverLoop());

    // Loop 2000A - Billing Provider Hierarchical Level
    claims.forEach((claim, claimIndex) => {
      segments.push(...this.createBillingProviderLoop(claim, claimIndex + 1));

      // Loop 2000B - Subscriber Hierarchical Level
      segments.push(...this.createSubscriberLoop(claim, claimIndex + 1));

      // Loop 2000C - Patient Hierarchical Level (if different from subscriber)
      if (claim.patientId !== claim.insuranceId) {
        segments.push(...this.createPatientLoop(claim, claimIndex + 1));
      }

      // Loop 2300 - Claim Information
      segments.push(...this.createClaimLoop(claim));

      // Loop 2400 - Service Line
      claim.charges?.forEach((charge, chargeIndex) => {
        segments.push(...this.createServiceLineLoop(charge, chargeIndex + 1));
      });
    });

    // SE - Transaction Set Trailer
    segments.push(
      this.createSESegment(transactionControlNumber, segments.length + 1)
    );

    // GE - Functional Group Trailer
    segments.push(this.createGESegment(functionalGroupControlNumber));

    // IEA - Interchange Control Trailer
    segments.push(this.createIEASegment(interchangeControlNumber));

    const rawContent = this.segmentsToEDI(segments);

    return {
      interchangeControlNumber,
      functionalGroupControlNumber,
      transactionControlNumber,
      submitterId: "LITHIC001",
      receiverId: "CLEARINGHOUSE",
      segments,
      rawContent,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate EDI 837 Institutional (I) file
   */
  generateEDI837I(claims: Claim[]): EDI837File {
    // Similar structure to 837P but with institutional-specific segments
    // For brevity, using same implementation with institutional flag
    const file = this.generateEDI837P(claims);
    // In production, would have different segments for UB-04 claims
    return file;
  }

  // ============================================================================
  // EDI Segment Creators
  // ============================================================================

  private createISASegment(controlNumber: string): EDI837Segment {
    return {
      segmentId: "ISA",
      position: 1,
      data: {
        authorizationQualifier: "00",
        authorizationInfo: " ".repeat(10),
        securityQualifier: "00",
        securityInfo: " ".repeat(10),
        senderIdQualifier: "ZZ",
        senderId: "LITHIC001".padEnd(15),
        receiverIdQualifier: "ZZ",
        receiverId: "CLEARINGHOUSE".padEnd(15),
        date: this.formatEDIDate(new Date()),
        time: this.formatEDITime(new Date()),
        standardsId: "^",
        versionNumber: "00501",
        controlNumber: controlNumber.padStart(9, "0"),
        acknowledgmentRequested: "1",
        usageIndicator: "P", // P=Production, T=Test
        componentSeparator: ":",
      },
    };
  }

  private createGSSegment(
    controlNumber: string,
    claimCount: number
  ): EDI837Segment {
    return {
      segmentId: "GS",
      position: 2,
      data: {
        functionalIdCode: "HC", // Health Care Claim
        applicationSenderCode: "LITHIC001",
        applicationReceiverCode: "CLEARINGHOUSE",
        date: this.formatEDIDate(new Date()),
        time: this.formatEDITime(new Date()),
        groupControlNumber: controlNumber,
        responsibleAgencyCode: "X",
        versionCode: "005010X222A1", // 837P version
      },
    };
  }

  private createSTSegment(controlNumber: string): EDI837Segment {
    return {
      segmentId: "ST",
      position: 3,
      data: {
        transactionSetId: "837",
        controlNumber: controlNumber.padStart(4, "0"),
        implementationGuide: "005010X222A1",
      },
    };
  }

  private createBHTSegment(): EDI837Segment {
    return {
      segmentId: "BHT",
      position: 4,
      data: {
        hierarchicalStructureCode: "0019", // Information source, receiver, dependent
        transactionSetPurpose: "00", // Original
        referenceId: `BATCH${Date.now()}`,
        date: this.formatEDIDate(new Date()),
        time: this.formatEDITime(new Date()),
        transactionType: "CH", // Chargeable
      },
    };
  }

  private createSubmitterLoop(): EDI837Segment[] {
    return [
      {
        segmentId: "NM1",
        position: 5,
        data: {
          entityIdCode: "41", // Submitter
          entityTypeQualifier: "2", // Non-person
          name: "LITHIC HEALTHCARE",
          idCodeQualifier: "46", // Electronic Transmitter ID Number
          idCode: "LITHIC001",
        },
      },
      {
        segmentId: "PER",
        position: 6,
        data: {
          contactFunctionCode: "IC", // Information Contact
          name: "BILLING DEPARTMENT",
          communicationNumberQualifier: "TE", // Telephone
          communicationNumber: "8005551234",
          communicationNumberQualifier2: "EM", // Email
          communicationNumber2: "billing@lithic.health",
        },
      },
    ];
  }

  private createReceiverLoop(): EDI837Segment[] {
    return [
      {
        segmentId: "NM1",
        position: 7,
        data: {
          entityIdCode: "40", // Receiver
          entityTypeQualifier: "2", // Non-person
          name: "CLEARINGHOUSE NAME",
          idCodeQualifier: "46",
          idCode: "CLEARINGHOUSE",
        },
      },
    ];
  }

  private createBillingProviderLoop(
    claim: Claim,
    hierarchicalId: number
  ): EDI837Segment[] {
    return [
      {
        segmentId: "HL",
        position: 100,
        data: {
          hierarchicalIdNumber: hierarchicalId.toString(),
          hierarchicalParentIdNumber: "",
          hierarchicalLevelCode: "20", // Information Source
          hierarchicalChildCode: "1", // Additional subordinate HL present
        },
      },
      {
        segmentId: "PRV",
        position: 101,
        data: {
          providerCode: "BI", // Billing
          referenceIdQualifier: "PXC", // Health Care Provider Taxonomy
          providerId: "207Q00000X", // Family Medicine
        },
      },
      {
        segmentId: "NM1",
        position: 102,
        data: {
          entityIdCode: "85", // Billing Provider
          entityTypeQualifier: "2",
          name: "LITHIC MEDICAL GROUP",
          idCodeQualifier: "XX", // NPI
          idCode: claim.billingProvider,
        },
      },
    ];
  }

  private createSubscriberLoop(
    claim: Claim,
    hierarchicalId: number
  ): EDI837Segment[] {
    return [
      {
        segmentId: "HL",
        position: 200,
        data: {
          hierarchicalIdNumber: (hierarchicalId * 10 + 1).toString(),
          hierarchicalParentIdNumber: hierarchicalId.toString(),
          hierarchicalLevelCode: "22", // Subscriber
          hierarchicalChildCode: "0", // No subordinate HL
        },
      },
      {
        segmentId: "SBR",
        position: 201,
        data: {
          payerResponsibilitySequence: "P", // Primary
          individualRelationshipCode: "18", // Self
          groupNumber: "GROUP123",
          groupName: "",
          insuranceTypeCode: "",
          coordinationOfBenefits: "",
          yesNoCondition: "",
          employmentStatus: "",
          claimFilingIndicator: "CI", // Commercial Insurance
        },
      },
    ];
  }

  private createPatientLoop(
    claim: Claim,
    hierarchicalId: number
  ): EDI837Segment[] {
    return [
      {
        segmentId: "HL",
        position: 300,
        data: {
          hierarchicalIdNumber: (hierarchicalId * 10 + 2).toString(),
          hierarchicalParentIdNumber: (hierarchicalId * 10 + 1).toString(),
          hierarchicalLevelCode: "23", // Dependent
          hierarchicalChildCode: "0",
        },
      },
      {
        segmentId: "PAT",
        position: 301,
        data: {
          individualRelationshipCode: "01", // Spouse
          patientLocationCode: "",
          employmentStatusCode: "",
          studentStatusCode: "",
          dateTimePeriodFormat: "",
          dateTimePeriod: "",
          unitOfMeasure: "",
          weight: "",
          pregnancyIndicator: "",
        },
      },
    ];
  }

  private createClaimLoop(claim: Claim): EDI837Segment[] {
    const segments: EDI837Segment[] = [];

    // CLM - Claim Information
    segments.push({
      segmentId: "CLM",
      position: 400,
      data: {
        claimId: claim.claimNumber,
        claimAmount: claim.totalCharges.toFixed(2),
        claimFilingIndicator: "",
        nonInstitutionalClaimType: "",
        healthCareServiceLocation: claim.placeOfService,
        providerSignatureIndicator: "Y",
        assignmentOfBenefits: "Y",
        benefitsAssignmentCertification: "Y",
        releaseOfInformation: "Y",
      },
    });

    // DTP - Date - Service Date
    segments.push({
      segmentId: "DTP",
      position: 401,
      data: {
        dateQualifier: "472", // Service
        dateFormatQualifier: "D8",
        date: this.formatEDIDate(claim.serviceDate),
      },
    });

    // HI - Health Care Diagnosis Code
    const diagnosisCodes = [
      claim.primaryDiagnosis,
      ...(claim.secondaryDiagnoses || []),
    ].filter(Boolean);

    segments.push({
      segmentId: "HI",
      position: 402,
      data: {
        diagnosisCodes: diagnosisCodes.map((code, index) => ({
          codeListQualifier: index === 0 ? "ABK" : "ABF", // Principal vs Secondary
          industryCode: code,
        })),
      },
    });

    return segments;
  }

  private createServiceLineLoop(
    charge: any,
    lineNumber: number
  ): EDI837Segment[] {
    const segments: EDI837Segment[] = [];

    // LX - Service Line Number
    segments.push({
      segmentId: "LX",
      position: 500,
      data: {
        assignedNumber: lineNumber.toString(),
      },
    });

    // SV1 - Professional Service
    segments.push({
      segmentId: "SV1",
      position: 501,
      data: {
        productServiceIdQualifier: "HC", // HCPCS
        procedureCode: charge.cptCode,
        modifiers: charge.modifiers || [],
        lineItemChargeAmount: charge.totalCharge.toFixed(2),
        unitBasis: "UN", // Unit
        serviceUnitCount: charge.quantity.toString(),
        placeOfService: charge.placeOfService,
        diagnosisCodePointers: charge.diagnosisPointers || [1],
      },
    });

    // DTP - Date of Service
    segments.push({
      segmentId: "DTP",
      position: 502,
      data: {
        dateQualifier: "472",
        dateFormatQualifier: "D8",
        date: this.formatEDIDate(charge.serviceDate || new Date()),
      },
    });

    return segments;
  }

  private createSESegment(
    controlNumber: string,
    segmentCount: number
  ): EDI837Segment {
    return {
      segmentId: "SE",
      position: 999,
      data: {
        segmentCount: segmentCount.toString(),
        controlNumber: controlNumber.padStart(4, "0"),
      },
    };
  }

  private createGESegment(controlNumber: string): EDI837Segment {
    return {
      segmentId: "GE",
      position: 1000,
      data: {
        numberOfTransactionSets: "1",
        groupControlNumber: controlNumber,
      },
    };
  }

  private createIEASegment(controlNumber: string): EDI837Segment {
    return {
      segmentId: "IEA",
      position: 1001,
      data: {
        numberOfFunctionalGroups: "1",
        interchangeControlNumber: controlNumber.padStart(9, "0"),
      },
    };
  }

  /**
   * Convert segments to EDI format
   */
  private segmentsToEDI(segments: EDI837Segment[]): string {
    const lines: string[] = [];

    segments.forEach((segment) => {
      const elements: string[] = [segment.segmentId];

      // Convert data object to array of elements
      Object.values(segment.data).forEach((value) => {
        if (Array.isArray(value)) {
          elements.push(
            value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(":")
          );
        } else {
          elements.push(String(value));
        }
      });

      lines.push(elements.join("*") + "~");
    });

    return lines.join("\n");
  }

  /**
   * Create a claim batch
   */
  async createBatch(claimIds: string[], clearinghouseId: string): Promise<ClaimBatch> {
    const batchNumber = `BATCH${Date.now()}`;

    return {
      id: crypto.randomUUID(),
      organizationId: "org-123", // From context
      batchNumber,
      status: BatchStatus.DRAFT,
      claimIds,
      clearinghouseId,
      submissionDate: null,
      edi837File: null,
      edi997Acknowledgment: null,
      totalClaims: claimIds.length,
      totalCharges: 0, // Would calculate from claims
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      submittedBy: "current-user", // From auth context
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "current-user",
      updatedBy: "current-user",
    };
  }

  /**
   * Submit batch to clearinghouse
   */
  async submitBatch(batch: ClaimBatch, claims: Claim[]): Promise<ClaimBatch> {
    // Generate EDI 837
    const edi837 = this.generateEDI837P(claims);

    // In production, would actually transmit to clearinghouse
    // For now, simulate successful submission

    return {
      ...batch,
      status: BatchStatus.SUBMITTED,
      submissionDate: new Date(),
      edi837File: edi837.rawContent,
      successCount: claims.length,
      errorCount: 0,
      warningCount: 0,
      updatedAt: new Date(),
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateControlNumber(): string {
    return Math.floor(Math.random() * 1000000000).toString();
  }

  private formatEDIDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, "");
  }

  private formatEDITime(date: Date): string {
    return date.toISOString().slice(11, 19).replace(/:/g, "");
  }
}

// Singleton instance
export const claimsProcessor = new ClaimsProcessor();
