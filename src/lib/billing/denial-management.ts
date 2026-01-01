/**
 * Lithic Enterprise v0.3 - Denial Management System
 * Root cause analysis, appeal generation, and denial prevention
 */

import type {
  DenialAnalysis,
  DenialRootCause,
  DenialCategoryDetail,
  AdjustmentGroupCode,
  RecoverabilityScore,
  DenialAction,
  ResolutionStep,
  AppealLetter,
  SupportingDocument,
  DocumentType,
} from "@/types/billing-enterprise";
import type { Denial, Claim } from "@/types/billing";

// ============================================================================
// Denial Management Engine
// ============================================================================

export class DenialManagementEngine {
  /**
   * Analyze a denial and recommend actions
   */
  async analyzeDenial(
    denial: Denial,
    claim: Claim
  ): Promise<DenialAnalysis> {
    // Determine root cause
    const rootCause = this.determineRootCause(denial, claim);

    // Categorize the denial
    const category = this.categorizeDenial(denial);

    // Assess if preventable
    const preventable = this.isPreventable(rootCause);
    const preventionStrategy = preventable
      ? this.getPreventionStrategy(rootCause)
      : null;

    // Calculate recoverability
    const recoverability = this.assessRecoverability(denial, rootCause);

    // Recommend action
    const recommendedAction = this.recommendAction(
      denial,
      rootCause,
      recoverability
    );

    // Determine if can be auto-resolved
    const automatedResolution = this.canAutoResolve(rootCause, denial);

    // Generate resolution steps
    const resolutionSteps = this.generateResolutionSteps(
      recommendedAction,
      rootCause,
      denial
    );

    // Calculate financial impact
    const estimatedRecoveryAmount = this.estimateRecoveryAmount(
      denial,
      recoverability
    );
    const costToAppeal = this.estimateAppealCost(denial);
    const roi = estimatedRecoveryAmount - costToAppeal;

    return {
      id: crypto.randomUUID(),
      organizationId: denial.organizationId,
      denialId: denial.id,
      claimId: denial.claimId,
      analysisDate: new Date(),
      rootCause,
      category,
      preventable,
      preventionStrategy,
      recoverability,
      recommendedAction,
      automatedResolution,
      resolutionSteps,
      estimatedRecoveryAmount,
      costToAppeal,
      roi,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };
  }

  /**
   * Determine root cause of denial
   */
  private determineRootCause(denial: Denial, claim: Claim): DenialRootCause {
    const denialCode = denial.denialCode.toUpperCase();
    const denialReason = denial.denialReason.toLowerCase();

    // Check for common patterns
    if (
      denialReason.includes("eligibility") ||
      denialReason.includes("not eligible")
    ) {
      return DenialRootCause.ELIGIBILITY_NOT_VERIFIED;
    }

    if (
      denialReason.includes("authorization") ||
      denialReason.includes("prior auth")
    ) {
      return DenialRootCause.MISSING_AUTHORIZATION;
    }

    if (
      denialReason.includes("timely filing") ||
      denialReason.includes("late")
    ) {
      return DenialRootCause.TIMELY_FILING_MISSED;
    }

    if (
      denialReason.includes("duplicate") ||
      denialCode === "18" ||
      denialCode === "D9"
    ) {
      return DenialRootCause.DUPLICATE_CLAIM;
    }

    if (
      denialReason.includes("medical necessity") ||
      denialCode === "50" ||
      denialCode === "96"
    ) {
      return DenialRootCause.MEDICAL_NECESSITY;
    }

    if (
      denialReason.includes("coding") ||
      denialReason.includes("invalid code")
    ) {
      return DenialRootCause.CODING_ERROR;
    }

    if (
      denialReason.includes("documentation") ||
      denialReason.includes("records")
    ) {
      return DenialRootCause.INSUFFICIENT_DOCUMENTATION;
    }

    if (
      denialReason.includes("registration") ||
      denialReason.includes("demographics")
    ) {
      return DenialRootCause.REGISTRATION_ERROR;
    }

    if (
      denialReason.includes("coordination of benefits") ||
      denialReason.includes("cob")
    ) {
      return DenialRootCause.COORDINATION_OF_BENEFITS;
    }

    if (
      denialReason.includes("not covered") ||
      denialReason.includes("non-covered")
    ) {
      return DenialRootCause.NON_COVERED_SERVICE;
    }

    return DenialRootCause.BILLING_ERROR;
  }

  /**
   * Categorize denial with CARC/RARC codes
   */
  private categorizeDenial(denial: Denial): DenialCategoryDetail {
    const code = denial.denialCode;

    // Map common denial codes to CARC codes
    const carcMapping: { [key: string]: string } = {
      "1": "1", // Deductible
      "2": "2", // Coinsurance
      "3": "3", // Copay
      "16": "16", // No prior approval
      "18": "18", // Duplicate claim
      "22": "22", // Coordination of benefits
      "27": "27", // Expenses incurred after coverage terminated
      "29": "29", // Time limit for filing has expired
      "50": "50", // Non-covered service
      "96": "96", // Non-covered charge
      "97": "97", // Payment adjusted because benefit max reached
      "109": "109", // Claim not covered
      "119": "119", // Benefit max for period reached
    };

    const carc = carcMapping[code] || code;

    // Determine adjustment group code
    let groupCode: AdjustmentGroupCode = AdjustmentGroupCode.OA;
    if (["1", "2", "3"].includes(code)) {
      groupCode = AdjustmentGroupCode.PR; // Patient Responsibility
    } else if (["18", "22", "96", "97"].includes(code)) {
      groupCode = AdjustmentGroupCode.CO; // Contractual Obligation
    } else if (["16", "29", "50"].includes(code)) {
      groupCode = AdjustmentGroupCode.CO;
    }

    return {
      primary: denial.denialCategory,
      secondary: null,
      CARC: carc,
      RARC: null,
      groupCode,
    };
  }

  /**
   * Determine if denial was preventable
   */
  private isPreventable(rootCause: DenialRootCause): boolean {
    const preventableCauses = [
      DenialRootCause.REGISTRATION_ERROR,
      DenialRootCause.ELIGIBILITY_NOT_VERIFIED,
      DenialRootCause.MISSING_AUTHORIZATION,
      DenialRootCause.CODING_ERROR,
      DenialRootCause.TIMELY_FILING_MISSED,
      DenialRootCause.DUPLICATE_CLAIM,
      DenialRootCause.BILLING_ERROR,
      DenialRootCause.INCORRECT_PATIENT_INFO,
    ];

    return preventableCauses.includes(rootCause);
  }

  /**
   * Get prevention strategy for root cause
   */
  private getPreventionStrategy(rootCause: DenialRootCause): string {
    const strategies: { [key in DenialRootCause]: string } = {
      [DenialRootCause.REGISTRATION_ERROR]:
        "Implement real-time patient registration validation and verification",
      [DenialRootCause.ELIGIBILITY_NOT_VERIFIED]:
        "Require eligibility verification before service for all patients",
      [DenialRootCause.MISSING_AUTHORIZATION]:
        "Implement automated prior authorization tracking and alerts",
      [DenialRootCause.CODING_ERROR]:
        "Provide ongoing coder education and implement coding validation tools",
      [DenialRootCause.INSUFFICIENT_DOCUMENTATION]:
        "Use clinical documentation improvement (CDI) program",
      [DenialRootCause.MEDICAL_NECESSITY]:
        "Implement medical necessity checking at time of service",
      [DenialRootCause.TIMELY_FILING_MISSED]:
        "Implement automated claim submission workflow with aging alerts",
      [DenialRootCause.DUPLICATE_CLAIM]:
        "Implement duplicate claim detection before submission",
      [DenialRootCause.BILLING_ERROR]:
        "Implement automated claim scrubbing before submission",
      [DenialRootCause.COORDINATION_OF_BENEFITS]:
        "Verify COB information at registration and before billing",
      [DenialRootCause.NON_COVERED_SERVICE]:
        "Verify coverage for specific services before rendering",
      [DenialRootCause.INCORRECT_PATIENT_INFO]:
        "Implement patient demographic validation at each visit",
    };

    return strategies[rootCause];
  }

  /**
   * Assess recoverability of denial
   */
  private assessRecoverability(
    denial: Denial,
    rootCause: DenialRootCause
  ): RecoverabilityScore {
    // High recoverability
    if (
      [
        DenialRootCause.CODING_ERROR,
        DenialRootCause.BILLING_ERROR,
        DenialRootCause.INSUFFICIENT_DOCUMENTATION,
        DenialRootCause.REGISTRATION_ERROR,
      ].includes(rootCause)
    ) {
      return RecoverabilityScore.HIGH;
    }

    // Medium recoverability
    if (
      [
        DenialRootCause.MEDICAL_NECESSITY,
        DenialRootCause.MISSING_AUTHORIZATION,
        DenialRootCause.COORDINATION_OF_BENEFITS,
      ].includes(rootCause)
    ) {
      return RecoverabilityScore.MEDIUM;
    }

    // Low recoverability
    if (
      [
        DenialRootCause.TIMELY_FILING_MISSED,
        DenialRootCause.ELIGIBILITY_NOT_VERIFIED,
      ].includes(rootCause)
    ) {
      return RecoverabilityScore.LOW;
    }

    // Very low recoverability
    if (
      [
        DenialRootCause.NON_COVERED_SERVICE,
        DenialRootCause.DUPLICATE_CLAIM,
      ].includes(rootCause)
    ) {
      return RecoverabilityScore.VERY_LOW;
    }

    return RecoverabilityScore.MEDIUM;
  }

  /**
   * Recommend action based on analysis
   */
  private recommendAction(
    denial: Denial,
    rootCause: DenialRootCause,
    recoverability: RecoverabilityScore
  ): DenialAction {
    // If not appealable, write off or transfer to patient
    if (!denial.appealable) {
      if (denial.denialCategory === "ELIGIBILITY") {
        return DenialAction.PATIENT_RESPONSIBILITY;
      }
      return DenialAction.WRITE_OFF;
    }

    // Based on root cause
    switch (rootCause) {
      case DenialRootCause.CODING_ERROR:
      case DenialRootCause.BILLING_ERROR:
      case DenialRootCause.REGISTRATION_ERROR:
        return DenialAction.RESUBMIT_WITH_CORRECTION;

      case DenialRootCause.INSUFFICIENT_DOCUMENTATION:
      case DenialRootCause.MEDICAL_NECESSITY:
        return DenialAction.REQUEST_DOCUMENTATION;

      case DenialRootCause.MISSING_AUTHORIZATION:
        return DenialAction.CONTACT_PAYER;

      case DenialRootCause.DUPLICATE_CLAIM:
        return DenialAction.WRITE_OFF;

      case DenialRootCause.NON_COVERED_SERVICE:
        return DenialAction.PATIENT_RESPONSIBILITY;

      default:
        if (recoverability === RecoverabilityScore.HIGH) {
          return DenialAction.APPEAL_IMMEDIATELY;
        } else if (recoverability === RecoverabilityScore.VERY_LOW) {
          return DenialAction.WRITE_OFF;
        }
        return DenialAction.APPEAL_IMMEDIATELY;
    }
  }

  /**
   * Determine if denial can be auto-resolved
   */
  private canAutoResolve(
    rootCause: DenialRootCause,
    denial: Denial
  ): boolean {
    // Simple corrections can be automated
    const autoResolvable = [
      DenialRootCause.DUPLICATE_CLAIM,
      DenialRootCause.REGISTRATION_ERROR,
    ];

    return autoResolvable.includes(rootCause) && denial.amount < 100;
  }

  /**
   * Generate step-by-step resolution plan
   */
  private generateResolutionSteps(
    action: DenialAction,
    rootCause: DenialRootCause,
    denial: Denial
  ): ResolutionStep[] {
    const steps: ResolutionStep[] = [];
    const now = new Date();

    switch (action) {
      case DenialAction.RESUBMIT_WITH_CORRECTION:
        steps.push({
          order: 1,
          action: "Identify and correct the error",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 2,
          action: "Submit corrected claim",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;

      case DenialAction.APPEAL_IMMEDIATELY:
        steps.push({
          order: 1,
          action: "Gather supporting documentation",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 2,
          action: "Generate appeal letter",
          responsible: "BILLING_MANAGER",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 3,
          action: "Submit appeal",
          responsible: "BILLING_MANAGER",
          deadline: denial.appealDeadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;

      case DenialAction.REQUEST_DOCUMENTATION:
        steps.push({
          order: 1,
          action: "Contact provider for additional documentation",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 2,
          action: "Review and compile documentation",
          responsible: "CODING_SPECIALIST",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 3,
          action: "Submit documentation to payer",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;

      case DenialAction.CONTACT_PAYER:
        steps.push({
          order: 1,
          action: "Call payer to discuss denial",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;

      case DenialAction.PATIENT_RESPONSIBILITY:
        steps.push({
          order: 1,
          action: "Transfer balance to patient account",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 2,
          action: "Send patient statement",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;

      case DenialAction.WRITE_OFF:
        steps.push({
          order: 1,
          action: "Get approval for write-off",
          responsible: "BILLING_MANAGER",
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        steps.push({
          order: 2,
          action: "Post adjustment",
          responsible: "BILLING_STAFF",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          completed: false,
          completedAt: null,
          notes: null,
        });
        break;
    }

    return steps;
  }

  /**
   * Estimate recovery amount
   */
  private estimateRecoveryAmount(
    denial: Denial,
    recoverability: RecoverabilityScore
  ): number {
    const multipliers = {
      [RecoverabilityScore.HIGH]: 0.8,
      [RecoverabilityScore.MEDIUM]: 0.5,
      [RecoverabilityScore.LOW]: 0.2,
      [RecoverabilityScore.VERY_LOW]: 0.05,
    };

    return denial.amount * multipliers[recoverability];
  }

  /**
   * Estimate cost to appeal
   */
  private estimateAppealCost(denial: Denial): number {
    // Base cost for appeal processing
    const baseCost = 50;

    // Additional cost for complex appeals
    const complexityCost =
      denial.amount > 1000 ? 100 : denial.amount > 500 ? 50 : 0;

    return baseCost + complexityCost;
  }

  /**
   * Generate appeal letter
   */
  async generateAppealLetter(
    denial: Denial,
    claim: Claim,
    analysis: DenialAnalysis
  ): Promise<AppealLetter> {
    const template = this.selectAppealTemplate(analysis.rootCause);
    const content = this.populateAppealTemplate(template, denial, claim, analysis);

    const supportingDocs = await this.gatherSupportingDocuments(
      claim,
      analysis.rootCause
    );

    return {
      id: crypto.randomUUID(),
      denialId: denial.id,
      claimId: claim.id,
      template,
      generatedContent: content,
      customizations: null,
      supportingDocuments: supportingDocs,
      generatedAt: new Date(),
      generatedBy: "system",
      sentAt: null,
      trackingNumber: null,
    };
  }

  /**
   * Select appropriate appeal template
   */
  private selectAppealTemplate(rootCause: DenialRootCause): string {
    const templates: { [key in DenialRootCause]: string } = {
      [DenialRootCause.MEDICAL_NECESSITY]: "MEDICAL_NECESSITY_APPEAL",
      [DenialRootCause.CODING_ERROR]: "CODING_CORRECTION_APPEAL",
      [DenialRootCause.MISSING_AUTHORIZATION]: "AUTHORIZATION_APPEAL",
      [DenialRootCause.INSUFFICIENT_DOCUMENTATION]: "DOCUMENTATION_APPEAL",
      [DenialRootCause.TIMELY_FILING_MISSED]: "TIMELY_FILING_APPEAL",
      [DenialRootCause.ELIGIBILITY_NOT_VERIFIED]: "ELIGIBILITY_APPEAL",
      [DenialRootCause.REGISTRATION_ERROR]: "REGISTRATION_APPEAL",
      [DenialRootCause.BILLING_ERROR]: "BILLING_CORRECTION_APPEAL",
      [DenialRootCause.COORDINATION_OF_BENEFITS]: "COB_APPEAL",
      [DenialRootCause.DUPLICATE_CLAIM]: "DUPLICATE_APPEAL",
      [DenialRootCause.NON_COVERED_SERVICE]: "COVERAGE_APPEAL",
      [DenialRootCause.INCORRECT_PATIENT_INFO]: "PATIENT_INFO_APPEAL",
    };

    return templates[rootCause];
  }

  /**
   * Populate appeal template with claim data
   */
  private populateAppealTemplate(
    template: string,
    denial: Denial,
    claim: Claim,
    analysis: DenialAnalysis
  ): string {
    const today = new Date().toLocaleDateString();

    let content = `
Date: ${today}

[Insurance Company Name]
[Address]
[City, State ZIP]

Re: Appeal of Claim Denial
Claim Number: ${claim.claimNumber}
Patient Name: [Patient Name]
Date of Service: ${new Date(claim.serviceDate).toLocaleDateString()}
Denial Code: ${denial.denialCode}
Denial Reason: ${denial.denialReason}

Dear Claims Review Department,

We are writing to formally appeal the denial of the above-referenced claim.
We respectfully disagree with the denial for the following reasons:

`;

    // Add template-specific content
    switch (template) {
      case "MEDICAL_NECESSITY_APPEAL":
        content += `
MEDICAL NECESSITY

The services rendered were medically necessary and appropriate for the patient's condition.
The patient presented with ${claim.primaryDiagnosis} which required the specific treatment provided.

Clinical rationale:
- The patient's medical condition necessitated this intervention
- The treatment follows evidence-based clinical guidelines
- Alternative, less intensive treatments had been attempted without success
- The service was ordered by a qualified physician

We have attached supporting medical documentation including clinical notes,
test results, and relevant medical literature supporting the medical necessity of this service.
`;
        break;

      case "CODING_CORRECTION_APPEAL":
        content += `
CODING CORRECTION

Upon review of the denial, we have identified a coding error in the original submission.
We are resubmitting with the corrected codes:

Original Code(s): [List original codes]
Corrected Code(s): [List corrected codes]

The corrected codes accurately reflect the services provided and are supported by the medical documentation.
`;
        break;

      case "AUTHORIZATION_APPEAL":
        content += `
PRIOR AUTHORIZATION

We are appealing the denial due to lack of prior authorization.

[If authorization was obtained:]
Prior authorization was obtained on [date] under authorization number ${claim.priorAuthNumber}.
We have attached a copy of the authorization for your review.

[If authorization was not required:]
Based on the plan's coverage guidelines, prior authorization was not required for this service
under the circumstances present at the time of service.
`;
        break;

      case "DOCUMENTATION_APPEAL":
        content += `
ADDITIONAL DOCUMENTATION

We are providing additional documentation to support this claim. The attached records demonstrate:

- Complete medical necessity for the services rendered
- Appropriate diagnosis codes reflecting the patient's condition
- Proper procedure codes for services performed
- Provider qualifications and credentials

Please review the comprehensive documentation attached and reconsider this denial.
`;
        break;
    }

    content += `

We believe that upon review of the complete medical record and this appeal, you will find
that the services were medically necessary, appropriately coded, and covered under the
patient's benefit plan.

We request that you reconsider this denial and process payment for the full amount of
$${denial.amount.toFixed(2)} as soon as possible.

If you need any additional information, please contact our billing department at [phone number].

Thank you for your prompt attention to this matter.

Sincerely,

[Billing Manager Name]
[Title]
Lithic Healthcare
`;

    return content;
  }

  /**
   * Gather supporting documents for appeal
   */
  private async gatherSupportingDocuments(
    claim: Claim,
    rootCause: DenialRootCause
  ): Promise<SupportingDocument[]> {
    const documents: SupportingDocument[] = [];

    // Always include claim form
    documents.push({
      id: crypto.randomUUID(),
      type: DocumentType.OTHER,
      name: "Original Claim Form",
      url: `/documents/claims/${claim.id}/claim-form.pdf`,
      uploadedAt: new Date(),
    });

    // Add documents based on root cause
    switch (rootCause) {
      case DenialRootCause.MEDICAL_NECESSITY:
      case DenialRootCause.INSUFFICIENT_DOCUMENTATION:
        documents.push({
          id: crypto.randomUUID(),
          type: DocumentType.CLINICAL_NOTE,
          name: "Clinical Documentation",
          url: `/documents/encounters/${claim.encounterId}/notes.pdf`,
          uploadedAt: new Date(),
        });
        documents.push({
          id: crypto.randomUUID(),
          type: DocumentType.LETTER_OF_MEDICAL_NECESSITY,
          name: "Letter of Medical Necessity",
          url: `/documents/claims/${claim.id}/lmn.pdf`,
          uploadedAt: new Date(),
        });
        break;

      case DenialRootCause.MISSING_AUTHORIZATION:
        if (claim.priorAuthNumber) {
          documents.push({
            id: crypto.randomUUID(),
            type: DocumentType.AUTHORIZATION,
            name: "Prior Authorization",
            url: `/documents/authorizations/${claim.priorAuthNumber}.pdf`,
            uploadedAt: new Date(),
          });
        }
        break;
    }

    return documents;
  }

  /**
   * Track denial trends for prevention
   */
  analyzeDenialTrends(denials: Denial[]): {
    byCategory: { [key: string]: number };
    byPayer: { [key: string]: number };
    byProvider: { [key: string]: number };
    byRootCause: { [key: string]: number };
    preventableRate: number;
    topIssues: Array<{ issue: string; count: number; impact: number }>;
  } {
    const byCategory: { [key: string]: number } = {};
    const byPayer: { [key: string]: number } = {};
    const byProvider: { [key: string]: number } = {};
    const byRootCause: { [key: string]: number } = {};
    let preventableCount = 0;

    denials.forEach((denial) => {
      // By category
      byCategory[denial.denialCategory] =
        (byCategory[denial.denialCategory] || 0) + 1;

      // Note: Would need to join with claim data for payer/provider
      // Simulating here
      const mockPayer = "PAYER_" + (denial.id.charCodeAt(0) % 3);
      byPayer[mockPayer] = (byPayer[mockPayer] || 0) + 1;
    });

    const preventableRate = (preventableCount / denials.length) * 100;

    // Identify top issues
    const topIssues = Object.entries(byCategory)
      .map(([issue, count]) => ({
        issue,
        count,
        impact: count * 500, // Mock: average denial amount
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    return {
      byCategory,
      byPayer,
      byProvider,
      byRootCause,
      preventableRate,
      topIssues,
    };
  }
}

// Singleton instance
export const denialManagementEngine = new DenialManagementEngine();
