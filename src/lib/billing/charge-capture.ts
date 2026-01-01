/**
 * Lithic Enterprise v0.3 - Charge Capture Engine
 * Automated charge detection and E/M level calculation
 */

import type {
  ChargeCapture,
  CapturedCharge,
  ChargeCaptureStatus,
  CaptureMethod,
  ChargeCaptureFlag,
  FlagType,
  FlagSeverity,
  CodeType,
  Modifier,
  PlaceOfService,
  EMLevel,
  EMType,
  EMScore,
  EMFactor,
} from "@/types/billing-enterprise";

// ============================================================================
// Charge Capture Engine
// ============================================================================

export class ChargeCaptureEngine {
  /**
   * Automatically detect and capture charges from an encounter
   */
  async captureFromEncounter(
    encounterId: string,
    encounter: any
  ): Promise<ChargeCapture> {
    const charges: CapturedCharge[] = [];
    const flags: ChargeCaptureFlag[] = [];

    // Capture E/M code
    const emCharge = await this.captureEMCode(encounter);
    if (emCharge) {
      charges.push(emCharge);
    }

    // Capture procedure charges
    const procedureCharges = await this.captureProcedures(encounter);
    charges.push(...procedureCharges);

    // Capture medication charges
    const medicationCharges = await this.captureMedications(encounter);
    charges.push(...medicationCharges);

    // Capture lab/imaging orders
    const orderCharges = await this.captureOrders(encounter);
    charges.push(...orderCharges);

    // Validate charges
    const validationFlags = this.validateCharges(charges, encounter);
    flags.push(...validationFlags);

    // Calculate totals
    const totalCharges = charges.reduce((sum, c) => sum + c.totalCharge, 0);
    const totalExpectedReimbursement = await this.estimateReimbursement(
      charges,
      encounter.insuranceId
    );

    return {
      id: crypto.randomUUID(),
      organizationId: encounter.organizationId,
      encounterId: encounterId,
      patientId: encounter.patientId,
      providerId: encounter.providerId,
      serviceDate: encounter.date,
      status: ChargeCaptureStatus.PENDING_REVIEW,
      captureMethod: CaptureMethod.AUTO_FROM_ENCOUNTER,
      charges,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: null,
      totalCharges,
      totalExpectedReimbursement,
      flags,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    };
  }

  /**
   * Calculate and suggest E/M level based on encounter documentation
   */
  async captureEMCode(encounter: any): Promise<CapturedCharge | null> {
    const emLevel = this.calculateEMLevel(encounter);

    if (!emLevel) {
      return null;
    }

    // Determine appropriate modifiers
    const modifiers = this.determineEMModifiers(encounter);

    // Get pricing
    const unitPrice = await this.getCodePrice(emLevel.code, encounter.facility);

    return {
      id: crypto.randomUUID(),
      code: emLevel.code,
      codeType: CodeType.CPT,
      description: `${emLevel.type} Level ${emLevel.level}`,
      modifiers,
      units: 1,
      unitPrice,
      totalCharge: unitPrice,
      diagnosisPointers: [1], // Primary diagnosis
      placeOfService: this.determinePlaceOfService(encounter),
      revenueCode: null,
      ndcCode: null,
      drugQuantity: null,
      suggestedByAI: true,
      confidenceScore: emLevel.score.totalScore / 100,
    };
  }

  /**
   * Calculate E/M level using 2021+ guidelines
   */
  calculateEMLevel(encounter: any): EMLevel | null {
    const type = this.determineEMType(encounter);
    const score = this.calculateEMScore(encounter);

    // Map score to level
    let level = 1;
    let code = "";

    if (type === EMType.OFFICE_NEW) {
      if (score.totalScore >= 80) {
        level = 5;
        code = "99205";
      } else if (score.totalScore >= 60) {
        level = 4;
        code = "99204";
      } else if (score.totalScore >= 40) {
        level = 3;
        code = "99203";
      } else if (score.totalScore >= 20) {
        level = 2;
        code = "99202";
      } else {
        level = 1;
        code = "99201";
      }
    } else if (type === EMType.OFFICE_ESTABLISHED) {
      if (score.totalScore >= 80) {
        level = 5;
        code = "99215";
      } else if (score.totalScore >= 60) {
        level = 4;
        code = "99214";
      } else if (score.totalScore >= 40) {
        level = 3;
        code = "99213";
      } else if (score.totalScore >= 20) {
        level = 2;
        code = "99212";
      } else {
        level = 1;
        code = "99211";
      }
    } else if (type === EMType.EMERGENCY) {
      // ED levels 99281-99285
      if (score.totalScore >= 80) {
        level = 5;
        code = "99285";
      } else if (score.totalScore >= 60) {
        level = 4;
        code = "99284";
      } else if (score.totalScore >= 40) {
        level = 3;
        code = "99283";
      } else if (score.totalScore >= 20) {
        level = 2;
        code = "99282";
      } else {
        level = 1;
        code = "99281";
      }
    }

    const factors = this.getEMFactors(encounter);

    return {
      code,
      level,
      type,
      score,
      factors,
      recommendation: this.getEMRecommendation(score, level),
      supportingDocumentation: this.getSupportingDocumentation(encounter),
    };
  }

  private determineEMType(encounter: any): EMType {
    if (encounter.encounterType === "EMERGENCY") {
      return EMType.EMERGENCY;
    } else if (encounter.encounterType === "INPATIENT") {
      return encounter.isInitial
        ? EMType.HOSPITAL_INITIAL
        : EMType.HOSPITAL_SUBSEQUENT;
    } else if (encounter.encounterType === "CONSULTATION") {
      return EMType.CONSULTATION;
    } else {
      return encounter.isNewPatient
        ? EMType.OFFICE_NEW
        : EMType.OFFICE_ESTABLISHED;
    }
  }

  private calculateEMScore(encounter: any): EMScore {
    // History scoring (0-30 points)
    const history = this.scoreHistory(encounter);

    // Exam scoring (0-30 points)
    const exam = this.scoreExam(encounter);

    // Medical Decision Making (0-40 points)
    const mdm = this.scoreMDM(encounter);

    // Time-based scoring (if applicable)
    const time = encounter.duration || null;

    const totalScore = history + exam + mdm;

    return {
      history,
      exam,
      mdm,
      time,
      totalScore,
    };
  }

  private scoreHistory(encounter: any): number {
    let score = 0;
    const note = encounter.clinicalNote || {};

    // Chief complaint
    if (note.chiefComplaint) score += 5;

    // HPI elements (8 elements)
    const hpiElements = [
      note.location,
      note.quality,
      note.severity,
      note.duration,
      note.timing,
      note.context,
      note.modifyingFactors,
      note.associatedSignsSymptoms,
    ].filter(Boolean).length;

    if (hpiElements >= 4) score += 10;
    else score += hpiElements * 2;

    // ROS (14 systems)
    const rosCount = note.reviewOfSystems?.length || 0;
    if (rosCount >= 10) score += 10;
    else if (rosCount >= 2) score += 5;
    else if (rosCount >= 1) score += 2;

    // PFSH (Past, Family, Social History)
    const pfshCount = [note.pastHistory, note.familyHistory, note.socialHistory]
      .filter(Boolean).length;
    score += pfshCount * 3;

    return Math.min(score, 30);
  }

  private scoreExam(encounter: any): number {
    let score = 0;
    const vitals = encounter.vitals || {};
    const exam = encounter.physicalExam || {};

    // Vital signs
    if (
      vitals.bloodPressure ||
      vitals.pulse ||
      vitals.temperature ||
      vitals.respiratoryRate
    ) {
      score += 5;
    }

    // Body areas/organ systems examined
    const systemsExamined = Object.keys(exam).length;
    if (systemsExamined >= 8) score += 25;
    else if (systemsExamined >= 4) score += 15;
    else if (systemsExamined >= 2) score += 10;
    else score += systemsExamined * 5;

    return Math.min(score, 30);
  }

  private scoreMDM(encounter: any): number {
    let score = 0;

    // Number of diagnoses/management options
    const diagnosesCount = encounter.diagnoses?.length || 0;
    if (diagnosesCount >= 4) score += 15;
    else score += diagnosesCount * 3;

    // Amount of data reviewed
    const dataPoints = [
      encounter.labsOrdered,
      encounter.imagingOrdered,
      encounter.labsReviewed,
      encounter.imagingReviewed,
      encounter.priorRecordsReviewed,
    ].filter(Boolean).length;
    score += dataPoints * 3;

    // Risk level
    const riskFactors = this.assessRisk(encounter);
    score += riskFactors * 5;

    // Complexity factors
    if (encounter.chronicIllnessWithExacerbation) score += 5;
    if (encounter.newProblemWithWorkup) score += 5;
    if (encounter.prescriptionDrugManagement) score += 3;

    return Math.min(score, 40);
  }

  private assessRisk(encounter: any): number {
    let risk = 0;

    // Presenting problem risk
    if (encounter.severity === "HIGH" || encounter.severity === "CRITICAL") {
      risk += 3;
    } else if (encounter.severity === "MODERATE") {
      risk += 2;
    } else {
      risk += 1;
    }

    // Diagnostic procedures
    if (encounter.invasiveProcedure) risk += 2;

    // Management options selected
    if (encounter.prescriptionDrugManagement) risk += 1;
    if (encounter.surgeryRecommended) risk += 2;
    if (encounter.hospitalAdmission) risk += 3;

    return risk;
  }

  private getEMFactors(encounter: any): EMFactor[] {
    const factors: EMFactor[] = [];

    if (encounter.duration) {
      factors.push({
        category: "Time",
        description: `${encounter.duration} minutes total encounter time`,
        points: Math.floor(encounter.duration / 5),
      });
    }

    if (encounter.diagnoses?.length > 0) {
      factors.push({
        category: "Complexity",
        description: `${encounter.diagnoses.length} diagnoses addressed`,
        points: encounter.diagnoses.length * 3,
      });
    }

    return factors;
  }

  private getEMRecommendation(score: EMScore, level: number): string {
    if (score.totalScore >= 80) {
      return `Level ${level} is appropriate based on high complexity with score of ${score.totalScore}`;
    } else if (score.totalScore >= 60) {
      return `Level ${level} is supported by moderate to high complexity`;
    } else if (score.totalScore >= 40) {
      return `Level ${level} reflects moderate complexity encounter`;
    } else {
      return `Level ${level} appropriate for straightforward encounter`;
    }
  }

  private getSupportingDocumentation(encounter: any): string[] {
    const docs: string[] = [];

    if (encounter.clinicalNote?.chiefComplaint) {
      docs.push("Chief complaint documented");
    }
    if (encounter.clinicalNote?.hpi) {
      docs.push("History of present illness documented");
    }
    if (encounter.physicalExam) {
      docs.push("Physical examination documented");
    }
    if (encounter.assessmentAndPlan) {
      docs.push("Assessment and plan documented");
    }

    return docs;
  }

  /**
   * Capture procedure charges from encounter
   */
  private async captureProcedures(encounter: any): Promise<CapturedCharge[]> {
    const charges: CapturedCharge[] = [];
    const procedures = encounter.procedures || [];

    for (const procedure of procedures) {
      const code = procedure.cptCode || procedure.code;
      if (!code) continue;

      const modifiers = this.determineProcedureModifiers(procedure, encounter);
      const unitPrice = await this.getCodePrice(code, encounter.facility);

      charges.push({
        id: crypto.randomUUID(),
        code,
        codeType: CodeType.CPT,
        description: procedure.description || "",
        modifiers,
        units: procedure.units || 1,
        unitPrice,
        totalCharge: unitPrice * (procedure.units || 1),
        diagnosisPointers: procedure.diagnosisPointers || [1],
        placeOfService: this.determinePlaceOfService(encounter),
        revenueCode: procedure.revenueCode || null,
        ndcCode: null,
        drugQuantity: null,
        suggestedByAI: true,
        confidenceScore: 0.95,
      });
    }

    return charges;
  }

  /**
   * Capture medication administration charges
   */
  private async captureMedications(encounter: any): Promise<CapturedCharge[]> {
    const charges: CapturedCharge[] = [];
    const medications = encounter.medicationsAdministered || [];

    for (const med of medications) {
      // J-codes for injectable medications
      if (med.routeOfAdministration === "injection" && med.jCode) {
        const unitPrice = await this.getCodePrice(med.jCode, encounter.facility);

        charges.push({
          id: crypto.randomUUID(),
          code: med.jCode,
          codeType: CodeType.HCPCS,
          description: med.medicationName,
          modifiers: [],
          units: med.unitsAdministered || 1,
          unitPrice,
          totalCharge: unitPrice * (med.unitsAdministered || 1),
          diagnosisPointers: [1],
          placeOfService: this.determinePlaceOfService(encounter),
          revenueCode: "0636", // Drugs requiring detailed coding
          ndcCode: med.ndcCode || null,
          drugQuantity: med.quantity || null,
          suggestedByAI: true,
          confidenceScore: 0.9,
        });
      }
    }

    return charges;
  }

  /**
   * Capture charges from lab/imaging orders
   */
  private async captureOrders(encounter: any): Promise<CapturedCharge[]> {
    const charges: CapturedCharge[] = [];
    const orders = encounter.orders || [];

    for (const order of orders) {
      if (order.billable === false) continue;

      const code = order.cptCode || order.code;
      if (!code) continue;

      const unitPrice = await this.getCodePrice(code, encounter.facility);

      charges.push({
        id: crypto.randomUUID(),
        code,
        codeType: CodeType.CPT,
        description: order.description || "",
        modifiers: order.modifiers || [],
        units: 1,
        unitPrice,
        totalCharge: unitPrice,
        diagnosisPointers: order.diagnosisPointers || [1],
        placeOfService: this.determinePlaceOfService(encounter),
        revenueCode: order.revenueCode || null,
        ndcCode: null,
        drugQuantity: null,
        suggestedByAI: true,
        confidenceScore: 0.95,
      });
    }

    return charges;
  }

  /**
   * Determine appropriate modifiers for E/M codes
   */
  private determineEMModifiers(encounter: any): Modifier[] {
    const modifiers: Modifier[] = [];

    // Modifier 25: Significant, separately identifiable E/M on same day as procedure
    if (encounter.procedures && encounter.procedures.length > 0) {
      modifiers.push({
        code: "25",
        description:
          "Significant, Separately Identifiable Evaluation and Management Service",
        sequence: 1,
      });
    }

    // Modifier 57: Decision for surgery
    if (encounter.surgeryScheduled) {
      modifiers.push({
        code: "57",
        description: "Decision for Surgery",
        sequence: modifiers.length + 1,
      });
    }

    return modifiers;
  }

  /**
   * Determine appropriate modifiers for procedures
   */
  private determineProcedureModifiers(
    procedure: any,
    encounter: any
  ): Modifier[] {
    const modifiers: Modifier[] = [];

    // Modifier 59: Distinct procedural service
    if (procedure.distinctService) {
      modifiers.push({
        code: "59",
        description: "Distinct Procedural Service",
        sequence: 1,
      });
    }

    // Modifier 76: Repeat procedure by same physician
    if (procedure.repeatProcedure) {
      modifiers.push({
        code: "76",
        description: "Repeat Procedure by Same Physician",
        sequence: modifiers.length + 1,
      });
    }

    // Anatomical modifiers (LT, RT, etc.)
    if (procedure.laterality === "LEFT") {
      modifiers.push({
        code: "LT",
        description: "Left side",
        sequence: modifiers.length + 1,
      });
    } else if (procedure.laterality === "RIGHT") {
      modifiers.push({
        code: "RT",
        description: "Right side",
        sequence: modifiers.length + 1,
      });
    }

    return modifiers;
  }

  /**
   * Validate charges for common issues
   */
  private validateCharges(
    charges: CapturedCharge[],
    encounter: any
  ): ChargeCaptureFlag[] {
    const flags: ChargeCaptureFlag[] = [];

    // Check for missing modifiers
    charges.forEach((charge) => {
      if (this.requiresModifier25(charge, charges)) {
        flags.push({
          type: FlagType.MISSING_MODIFIER,
          severity: FlagSeverity.WARNING,
          message: `Code ${charge.code} may require modifier 25`,
          field: `charge.${charge.id}.modifiers`,
        });
      }
    });

    // Check for duplicate charges
    const codeCounts = new Map<string, number>();
    charges.forEach((charge) => {
      const key = `${charge.code}-${charge.modifiers.map((m) => m.code).join(",")}`;
      codeCounts.set(key, (codeCounts.get(key) || 0) + 1);
    });

    codeCounts.forEach((count, key) => {
      if (count > 1) {
        flags.push({
          type: FlagType.DUPLICATE_CHARGE,
          severity: FlagSeverity.WARNING,
          message: `Duplicate charge detected: ${key}`,
          field: null,
        });
      }
    });

    // Check for medical necessity
    charges.forEach((charge) => {
      if (!this.hasMedicalNecessity(charge, encounter)) {
        flags.push({
          type: FlagType.MEDICAL_NECESSITY,
          severity: FlagSeverity.ERROR,
          message: `Medical necessity not established for ${charge.code}`,
          field: `charge.${charge.id}`,
        });
      }
    });

    return flags;
  }

  private requiresModifier25(
    charge: CapturedCharge,
    allCharges: CapturedCharge[]
  ): boolean {
    // E/M codes on same day as procedure typically need modifier 25
    const isEM = charge.code.startsWith("99");
    const hasProcedure = allCharges.some(
      (c) => !c.code.startsWith("99") && c.code !== charge.code
    );
    const hasModifier25 = charge.modifiers.some((m) => m.code === "25");

    return isEM && hasProcedure && !hasModifier25;
  }

  private hasMedicalNecessity(
    charge: CapturedCharge,
    encounter: any
  ): boolean {
    // Check if charge has valid diagnosis pointers
    if (!charge.diagnosisPointers || charge.diagnosisPointers.length === 0) {
      return false;
    }

    // Check if diagnoses exist
    const diagnoses = encounter.diagnoses || [];
    if (diagnoses.length === 0) {
      return false;
    }

    // All diagnosis pointers should be valid
    return charge.diagnosisPointers.every(
      (pointer) => pointer > 0 && pointer <= diagnoses.length
    );
  }

  /**
   * Determine place of service code
   */
  private determinePlaceOfService(encounter: any): PlaceOfService {
    const type = encounter.encounterType?.toUpperCase();
    const location = encounter.location?.toLowerCase();

    if (type === "EMERGENCY") return PlaceOfService.EMERGENCY_ROOM;
    if (type === "INPATIENT") return PlaceOfService.INPATIENT_HOSPITAL;
    if (type === "OUTPATIENT") return PlaceOfService.ON_CAMPUS_OUTPATIENT;
    if (location?.includes("urgent")) return PlaceOfService.URGENT_CARE;
    if (location?.includes("home")) return PlaceOfService.HOME;
    if (type === "TELEHEALTH") return PlaceOfService.OFFICE; // With telehealth modifier

    return PlaceOfService.OFFICE;
  }

  /**
   * Get price for a code from fee schedule
   */
  private async getCodePrice(
    code: string,
    facilityId: string
  ): Promise<number> {
    // In production, this would query the fee schedule database
    // For now, return mock pricing based on code ranges

    if (code.startsWith("99")) {
      // E/M codes
      const level = parseInt(code.slice(-1));
      return 50 + level * 30; // $50-$200 range
    } else if (code.startsWith("J")) {
      // J-codes (drugs)
      return 100;
    } else if (code.startsWith("8")) {
      // Lab codes
      return 25;
    } else if (code.startsWith("7")) {
      // Radiology codes
      return 150;
    }

    return 75; // Default
  }

  /**
   * Estimate reimbursement based on contracted rates
   */
  private async estimateReimbursement(
    charges: CapturedCharge[],
    insuranceId: string
  ): Promise<number> {
    // In production, this would use actual contract rates
    // Mock: assume 60% reimbursement rate
    const totalCharges = charges.reduce((sum, c) => sum + c.totalCharge, 0);
    return totalCharges * 0.6;
  }

  /**
   * Reconcile charges against what was actually performed
   */
  reconcileCharges(
    capturedCharges: CapturedCharge[],
    actualServices: any[]
  ): {
    matched: CapturedCharge[];
    missing: any[];
    extra: CapturedCharge[];
  } {
    const matched: CapturedCharge[] = [];
    const missing: any[] = [];
    const extra: CapturedCharge[] = [];

    const capturedCodes = new Set(capturedCharges.map((c) => c.code));
    const actualCodes = new Set(actualServices.map((s) => s.code));

    // Find matched charges
    capturedCharges.forEach((charge) => {
      if (actualCodes.has(charge.code)) {
        matched.push(charge);
      } else {
        extra.push(charge);
      }
    });

    // Find missing charges
    actualServices.forEach((service) => {
      if (!capturedCodes.has(service.code)) {
        missing.push(service);
      }
    });

    return { matched, missing, extra };
  }
}

// Singleton instance
export const chargeCaptureEngine = new ChargeCaptureEngine();
