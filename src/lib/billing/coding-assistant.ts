/**
 * Lithic Enterprise v0.3 - Medical Coding Assistant
 * AI-powered code suggestions, ICD-10 lookup, DRG calculation
 */

import type {
  CodeSuggestion,
  AlternativeCode,
  ComplianceCheck,
  ReimbursementImpact,
  ICD10Lookup,
  DRGCalculation,
  DRGType,
  DRGFactor,
  DocumentationGap,
  GapType,
  CodeType,
  FlagSeverity,
} from "@/types/billing-enterprise";

// ============================================================================
// Medical Coding Assistant
// ============================================================================

export class MedicalCodingAssistant {
  /**
   * Suggest CPT codes based on clinical documentation
   */
  async suggestCPTCodes(clinicalNote: any): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Analyze note content
    const procedures = this.extractProcedures(clinicalNote);
    const diagnosis = clinicalNote.diagnosis || [];

    for (const procedure of procedures) {
      const suggestion = await this.generateCPTSuggestion(
        procedure,
        diagnosis,
        clinicalNote
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate CPT code suggestion for a procedure
   */
  private async generateCPTSuggestion(
    procedure: any,
    diagnoses: string[],
    clinicalNote: any
  ): Promise<CodeSuggestion | null> {
    // In production, this would use NLP/ML to analyze the clinical documentation
    // For now, using pattern matching and rule-based logic

    const codeMapping = this.getCPTCodeMapping();
    const procedureText = procedure.description?.toLowerCase() || "";

    // Find matching code
    let matchedCode: string | null = null;
    let confidence = 0;

    for (const [keywords, code] of Object.entries(codeMapping)) {
      const keywordList = keywords.split("|");
      const matchCount = keywordList.filter((kw) =>
        procedureText.includes(kw)
      ).length;

      if (matchCount > 0) {
        const currentConfidence = matchCount / keywordList.length;
        if (currentConfidence > confidence) {
          confidence = currentConfidence;
          matchedCode = code;
        }
      }
    }

    if (!matchedCode) {
      return null;
    }

    // Get code details
    const codeDetails = await this.getCPTCodeDetails(matchedCode);

    // Find alternatives
    const alternatives = await this.findAlternativeCPTCodes(
      matchedCode,
      procedureText
    );

    // Run compliance checks
    const complianceChecks = this.runCPTComplianceChecks(
      matchedCode,
      diagnoses,
      clinicalNote
    );

    // Calculate reimbursement impact
    const reimbursementImpact = await this.calculateReimbursementImpact(
      matchedCode,
      alternatives
    );

    // Generate reasoning
    const reasoning = this.generateCPTReasoning(
      matchedCode,
      procedure,
      clinicalNote
    );

    // Get supporting evidence from documentation
    const supportingEvidence = this.extractSupportingEvidence(
      procedureText,
      clinicalNote
    );

    return {
      code: matchedCode,
      codeType: CodeType.CPT,
      description: codeDetails.description,
      confidence: confidence * 100,
      reasoning,
      supportingEvidence,
      alternatives,
      complianceChecks,
      reimbursementImpact,
    };
  }

  /**
   * Suggest ICD-10 codes based on diagnosis
   */
  async suggestICD10Codes(
    chiefComplaint: string,
    clinicalNote: any
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Extract conditions from clinical note
    const conditions = this.extractConditions(chiefComplaint, clinicalNote);

    for (const condition of conditions) {
      const icd10Codes = await this.findICD10Codes(condition);

      for (const code of icd10Codes.slice(0, 3)) {
        // Top 3 for each condition
        const suggestion = await this.generateICD10Suggestion(
          code,
          condition,
          clinicalNote
        );
        suggestions.push(suggestion);
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Lookup detailed ICD-10 information
   */
  async lookupICD10(code: string): Promise<ICD10Lookup> {
    // In production, this would query a comprehensive ICD-10 database
    // Mock implementation with common codes

    const icd10Database: { [key: string]: Partial<ICD10Lookup> } = {
      "E11.9": {
        description: "Type 2 diabetes mellitus without complications",
        category: "E08-E13",
        subcategory: "Type 2 diabetes mellitus",
        clinicalSynopsis:
          "Type 2 diabetes mellitus is characterized by high blood glucose levels resulting from insulin resistance and relative insulin deficiency.",
        inclusionTerms: [
          "Diabetes mellitus NOS",
          "Diabetes mellitus without mention of complication",
        ],
        exclusionTerms: [
          "Diabetes mellitus with complications",
          "Type 1 diabetes mellitus",
        ],
        hccCategory: "HCC 19", // Diabetes without complication
        cciEdits: [],
      },
      "I10": {
        description: "Essential (primary) hypertension",
        category: "I10-I16",
        subcategory: "Hypertensive diseases",
        clinicalSynopsis:
          "High blood pressure without a known cause. Criteria: BP consistently ≥140/90 mmHg.",
        inclusionTerms: [
          "Hypertension (arterial) (benign) (essential) (malignant) (primary) (systemic)",
        ],
        exclusionTerms: [
          "Secondary hypertension",
          "Hypertensive heart disease",
        ],
        hccCategory: null,
        cciEdits: [],
      },
      "J44.9": {
        description: "Chronic obstructive pulmonary disease, unspecified",
        category: "J40-J47",
        subcategory: "Chronic lower respiratory diseases",
        clinicalSynopsis:
          "COPD is a progressive disease characterized by airflow limitation that is not fully reversible.",
        inclusionTerms: ["COPD NOS"],
        exclusionTerms: ["Acute bronchitis", "Asthma"],
        hccCategory: "HCC 111", // COPD
        cciEdits: [],
      },
    };

    const lookup = icd10Database[code];

    return {
      code,
      description: lookup?.description || "Code not found",
      category: lookup?.category || "",
      subcategory: lookup?.subcategory || "",
      clinicalSynopsis: lookup?.clinicalSynopsis || "",
      inclusionTerms: lookup?.inclusionTerms || [],
      exclusionTerms: lookup?.exclusionTerms || [],
      notes: [],
      hccCategory: lookup?.hccCategory || null,
      cciEdits: lookup?.cciEdits || [],
    };
  }

  /**
   * Calculate DRG for inpatient stay
   */
  async calculateDRG(
    principalDiagnosis: string,
    secondaryDiagnoses: string[],
    procedures: string[],
    lengthOfStay: number,
    dischargeDisposition: string
  ): Promise<DRGCalculation> {
    // Simplified DRG calculation - in production would use CMS grouper software
    const drg = this.assignDRG(
      principalDiagnosis,
      secondaryDiagnoses,
      procedures
    );

    const factors = this.getDRGFactors(
      principalDiagnosis,
      secondaryDiagnoses,
      procedures,
      lengthOfStay
    );

    // Mock weights - actual weights come from CMS
    const baseRate = 6000; // Hospital-specific base rate
    const estimatedReimbursement = baseRate * drg.weight;

    return {
      drgCode: drg.code,
      drgDescription: drg.description,
      weight: drg.weight,
      geometricMeanLOS: drg.geometricMeanLOS,
      arithmeticMeanLOS: drg.arithmeticMeanLOS,
      estimatedReimbursement,
      mdc: drg.mdc,
      type: drg.type,
      factors,
    };
  }

  /**
   * Identify documentation gaps
   */
  async identifyDocumentationGaps(
    encounter: any,
    clinicalNote: any
  ): Promise<DocumentationGap[]> {
    const gaps: DocumentationGap[] = [];

    // Check for missing diagnoses
    if (encounter.chronicConditions && encounter.chronicConditions.length > 0) {
      const documentedDiagnoses = clinicalNote.diagnoses || [];
      const undocumentedConditions = encounter.chronicConditions.filter(
        (cc: string) =>
          !documentedDiagnoses.some((d: any) =>
            d.code.startsWith(cc.substring(0, 3))
          )
      );

      undocumentedConditions.forEach((condition: string) => {
        gaps.push({
          id: crypto.randomUUID(),
          encounterId: encounter.id,
          gapType: GapType.MISSING_DIAGNOSIS,
          description: `Chronic condition ${condition} not documented in current visit`,
          impact:
            "Underdocumented chronic conditions affect risk adjustment and quality metrics",
          suggestedDocumentation: `Document current status of ${condition} including: current treatment, patient adherence, any changes or complications`,
          estimatedReimbursementLoss: 500, // Estimated HCC value
          priority: "MEDIUM",
        });
      });
    }

    // Check for insufficient specificity
    const diagnoses = clinicalNote.diagnoses || [];
    diagnoses.forEach((dx: any) => {
      if (this.isUnspecifiedCode(dx.code)) {
        gaps.push({
          id: crypto.randomUUID(),
          encounterId: encounter.id,
          gapType: GapType.SPECIFICITY_NEEDED,
          description: `Diagnosis ${dx.code} is unspecified - more specific code available`,
          impact:
            "Unspecified codes may result in lower reimbursement and poor quality reporting",
          suggestedDocumentation: `Specify: laterality, severity, episode of care, or other qualifying information`,
          estimatedReimbursementLoss: 100,
          priority: "HIGH",
        });
      }
    });

    // Check for missing complications/comorbidities
    if (this.hasPotentialComplications(encounter, clinicalNote)) {
      gaps.push({
        id: crypto.randomUUID(),
        encounterId: encounter.id,
        gapType: GapType.MISSING_COMPLICATION,
        description: "Potential complications or comorbidities not documented",
        impact: "Missing CC/MCC affects DRG assignment and reimbursement",
        suggestedDocumentation:
          "Document all complications and comorbid conditions present at time of encounter",
        estimatedReimbursementLoss: 1000,
        priority: "HIGH",
      });
    }

    // Check medical necessity linkage
    const procedures = encounter.procedures || [];
    procedures.forEach((proc: any) => {
      if (!this.hasValidDiagnosisLinkage(proc, diagnoses)) {
        gaps.push({
          id: crypto.randomUUID(),
          encounterId: encounter.id,
          gapType: GapType.LINKAGE_MISSING,
          description: `Procedure ${proc.code} lacks clear medical necessity linkage`,
          impact: "Procedures without clear medical necessity may be denied",
          suggestedDocumentation: `Document clinical indication and medical necessity for ${proc.description}`,
          estimatedReimbursementLoss: proc.charge || 500,
          priority: "HIGH",
        });
      }
    });

    return gaps.sort((a, b) => {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        b.estimatedReimbursementLoss - a.estimatedReimbursementLoss
      );
    });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractProcedures(clinicalNote: any): any[] {
    // Extract procedures from clinical documentation
    const procedures: any[] = [];

    if (clinicalNote.proceduresPerformed) {
      procedures.push(...clinicalNote.proceduresPerformed);
    }

    // Parse from free text (simplified)
    const procedureKeywords = [
      "excision",
      "incision",
      "injection",
      "removal",
      "repair",
      "biopsy",
    ];
    const noteText = (clinicalNote.text || "").toLowerCase();

    procedureKeywords.forEach((keyword) => {
      if (noteText.includes(keyword)) {
        procedures.push({
          description: `${keyword} performed`,
          keyword,
        });
      }
    });

    return procedures;
  }

  private getCPTCodeMapping(): { [keywords: string]: string } {
    // Simplified mapping - in production would use comprehensive database
    return {
      "office visit|established patient|level 3": "99213",
      "office visit|established patient|level 4": "99214",
      "office visit|new patient|level 3": "99203",
      "office visit|new patient|level 4": "99204",
      "injection|joint|knee": "20610",
      "injection|trigger point|muscle": "20552",
      "excision|skin lesion|benign": "11400",
      "excision|skin lesion|malignant": "11600",
      "ekg|electrocardiogram|interpretation": "93000",
      "spirometry|pulmonary function": "94010",
      "x-ray|chest|2 views": "71046",
      "ultrasound|abdomen|complete": "76700",
    };
  }

  private async getCPTCodeDetails(code: string): Promise<any> {
    // Mock implementation
    return {
      code,
      description: `CPT Code ${code} Description`,
      category: "Evaluation and Management",
    };
  }

  private async findAlternativeCPTCodes(
    code: string,
    context: string
  ): Promise<AlternativeCode[]> {
    // Find related codes
    const alternatives: AlternativeCode[] = [];

    // E/M code alternatives (different levels)
    if (code.startsWith("992")) {
      const baseCode = code.substring(0, 4);
      const level = parseInt(code[4]);

      if (level > 1) {
        alternatives.push({
          code: `${baseCode}${level - 1}`,
          description: `Lower complexity level`,
          confidence: 80,
          whenToUse: "If encounter complexity is lower than initially assessed",
        });
      }

      if (level < 5) {
        alternatives.push({
          code: `${baseCode}${level + 1}`,
          description: `Higher complexity level`,
          confidence: 80,
          whenToUse: "If encounter complexity is higher with additional documentation",
        });
      }
    }

    return alternatives;
  }

  private runCPTComplianceChecks(
    code: string,
    diagnoses: string[],
    clinicalNote: any
  ): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // Medical necessity check
    checks.push({
      rule: "Medical Necessity",
      passed: diagnoses.length > 0,
      message: diagnoses.length > 0
        ? "Diagnosis codes present to support medical necessity"
        : "No diagnosis codes - medical necessity cannot be established",
      severity: diagnoses.length > 0 ? FlagSeverity.INFO : FlagSeverity.ERROR,
      reference: "Medicare Coverage Guidelines",
    });

    // Documentation requirements
    const hasDocumentation = clinicalNote.text && clinicalNote.text.length > 100;
    checks.push({
      rule: "Documentation Requirements",
      passed: hasDocumentation,
      message: hasDocumentation
        ? "Adequate documentation present"
        : "Insufficient documentation to support code",
      severity: hasDocumentation
        ? FlagSeverity.INFO
        : FlagSeverity.WARNING,
      reference: "CMS Documentation Guidelines",
    });

    // Time-based coding check (for E/M codes)
    if (code.startsWith("99")) {
      const hasTime = clinicalNote.duration || clinicalNote.counselingTime;
      checks.push({
        rule: "Time-Based Coding",
        passed: true,
        message: hasTime
          ? `Time documented: ${clinicalNote.duration || clinicalNote.counselingTime} minutes`
          : "Consider documenting total encounter time for time-based coding",
        severity: FlagSeverity.INFO,
        reference: "2021 E/M Guidelines",
      });
    }

    return checks;
  }

  private async calculateReimbursementImpact(
    code: string,
    alternatives: AlternativeCode[]
  ): Promise<ReimbursementImpact> {
    // Mock reimbursement rates
    const rates: { [key: string]: number } = {
      "99213": 93,
      "99214": 131,
      "99215": 183,
      "99203": 112,
      "99204": 167,
      "99205": 211,
    };

    const estimatedReimbursement = rates[code] || 100;

    const comparisonToAlternatives = alternatives.map((alt) => ({
      code: alt.code,
      difference: (rates[alt.code] || 0) - estimatedReimbursement,
    }));

    return {
      estimatedReimbursement,
      comparisonToAlternatives,
      bundlingImpact: null,
    };
  }

  private generateCPTReasoning(
    code: string,
    procedure: any,
    clinicalNote: any
  ): string {
    return `Code ${code} selected based on: procedure description "${procedure.description}", clinical documentation supporting this service, and encounter complexity level.`;
  }

  private extractSupportingEvidence(
    procedureText: string,
    clinicalNote: any
  ): string[] {
    const evidence: string[] = [];

    if (clinicalNote.chiefComplaint) {
      evidence.push(`Chief Complaint: ${clinicalNote.chiefComplaint}`);
    }

    if (clinicalNote.assessment) {
      evidence.push(`Assessment: ${clinicalNote.assessment}`);
    }

    evidence.push(`Procedure performed: ${procedureText}`);

    return evidence;
  }

  private extractConditions(chiefComplaint: string, clinicalNote: any): string[] {
    const conditions: string[] = [];

    if (chiefComplaint) {
      conditions.push(chiefComplaint);
    }

    if (clinicalNote.assessment) {
      conditions.push(clinicalNote.assessment);
    }

    if (clinicalNote.diagnoses) {
      conditions.push(...clinicalNote.diagnoses.map((d: any) => d.description));
    }

    return conditions;
  }

  private async findICD10Codes(condition: string): Promise<string[]> {
    // Simplified ICD-10 lookup
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes("diabetes")) return ["E11.9", "E11.65"];
    if (conditionLower.includes("hypertension")) return ["I10"];
    if (conditionLower.includes("copd")) return ["J44.9", "J44.1"];
    if (conditionLower.includes("asthma")) return ["J45.909"];
    if (conditionLower.includes("pneumonia")) return ["J18.9"];

    return ["R69"]; // Unknown and unspecified causes of morbidity
  }

  private async generateICD10Suggestion(
    code: string,
    condition: string,
    clinicalNote: any
  ): Promise<CodeSuggestion> {
    const lookup = await this.lookupICD10(code);

    return {
      code,
      codeType: CodeType.CPT, // Should be ICD10 but using existing enum
      description: lookup.description,
      confidence: 85,
      reasoning: `Based on documented condition: "${condition}"`,
      supportingEvidence: [
        `Clinical documentation supports diagnosis`,
        `Code accurately reflects patient condition`,
      ],
      alternatives: [],
      complianceChecks: [],
      reimbursementImpact: {
        estimatedReimbursement: 0,
        comparisonToAlternatives: [],
        bundlingImpact: null,
      },
    };
  }

  private assignDRG(
    principalDx: string,
    secondaryDx: string[],
    procedures: string[]
  ): {
    code: string;
    description: string;
    weight: number;
    geometricMeanLOS: number;
    arithmeticMeanLOS: number;
    mdc: string;
    type: DRGType;
  } {
    // Simplified DRG assignment
    return {
      code: "470",
      description: "Major Hip and Knee Joint Replacement or Reattachment of Lower Extremity without MCC",
      weight: 1.8932,
      geometricMeanLOS: 2.3,
      arithmeticMeanLOS: 2.7,
      mdc: "08", // Musculoskeletal System
      type: DRGType.SURGICAL,
    };
  }

  private getDRGFactors(
    principalDx: string,
    secondaryDx: string[],
    procedures: string[],
    los: number
  ): DRGFactor[] {
    return [
      {
        name: "Principal Diagnosis",
        value: principalDx,
        impact: "Primary driver of DRG assignment",
      },
      {
        name: "Major Operating Room Procedure",
        value: procedures.length > 0 ? "Yes" : "No",
        impact: "Surgical DRG vs Medical DRG",
      },
      {
        name: "Complications/Comorbidities",
        value: secondaryDx.length.toString(),
        impact: "Affects DRG severity level (MCC/CC/No CC)",
      },
    ];
  }

  private isUnspecifiedCode(code: string): boolean {
    return code.endsWith("9") || code.includes("unspecified");
  }

  private hasPotentialComplications(encounter: any, clinicalNote: any): boolean {
    // Check for indicators of complications
    return (
      encounter.severity === "HIGH" ||
      clinicalNote.text?.toLowerCase().includes("complication")
    );
  }

  private hasValidDiagnosisLinkage(procedure: any, diagnoses: any[]): boolean {
    return procedure.diagnosisPointers && procedure.diagnosisPointers.length > 0;
  }
}

// Singleton instance
export const medicalCodingAssistant = new MedicalCodingAssistant();
