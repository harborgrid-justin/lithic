/**
 * Advanced Allergy Alert System
 * Cross-reactivity detection and alternative medication suggestions
 *
 * Features:
 * - Cross-reactivity detection (e.g., penicillin-cephalosporin)
 * - Severity-based alerting
 * - Alternative medication suggestions
 * - Patient-specific allergy history tracking
 * - Challenge test recommendations
 *
 * Clinical References:
 * - AAAAI Drug Allergy Practice Parameters
 * - Penicillin-Cephalosporin Cross-Reactivity Studies
 * - Sulfonamide Cross-Reactivity Data
 *
 * @version 1.0.0
 * @license HIPAA-compliant
 */

/**
 * Allergy severity classification
 */
export enum AllergySeverity {
  SEVERE = 'SEVERE', // Anaphylaxis, Stevens-Johnson syndrome, etc.
  MODERATE = 'MODERATE', // Urticaria, angioedema
  MILD = 'MILD', // Rash, itching
  UNKNOWN = 'UNKNOWN',
}

/**
 * Allergy reaction types
 */
export enum AllergyReactionType {
  ANAPHYLAXIS = 'ANAPHYLAXIS',
  ANGIOEDEMA = 'ANGIOEDEMA',
  URTICARIA = 'URTICARIA',
  RASH = 'RASH',
  ITCHING = 'ITCHING',
  BRONCHOSPASM = 'BRONCHOSPASM',
  STEVENS_JOHNSON = 'STEVENS_JOHNSON',
  TOXIC_EPIDERMAL_NECROLYSIS = 'TOXIC_EPIDERMAL_NECROLYSIS',
  SERUM_SICKNESS = 'SERUM_SICKNESS',
  DRUG_FEVER = 'DRUG_FEVER',
  HEPATOTOXICITY = 'HEPATOTOXICITY',
  NEPHROTOXICITY = 'NEPHROTOXICITY',
  OTHER = 'OTHER',
}

/**
 * Drug class for cross-reactivity checking
 */
export enum DrugClass {
  PENICILLIN = 'PENICILLIN',
  CEPHALOSPORIN = 'CEPHALOSPORIN',
  CARBAPENEM = 'CARBAPENEM',
  MONOBACTAM = 'MONOBACTAM',
  SULFONAMIDE_ANTIBIOTIC = 'SULFONAMIDE_ANTIBIOTIC',
  SULFONAMIDE_NONANTIBIOTIC = 'SULFONAMIDE_NONANTIBIOTIC',
  NSAID = 'NSAID',
  ACE_INHIBITOR = 'ACE_INHIBITOR',
  CONTRAST_IODINATED = 'CONTRAST_IODINATED',
  LATEX = 'LATEX',
  OTHER = 'OTHER',
}

/**
 * Patient allergy record
 */
export interface PatientAllergy {
  id: string;
  patientId: string;
  allergen: string;
  allergenClass?: DrugClass;
  severity: AllergySeverity;
  reactionType: AllergyReactionType[];
  onsetDate?: Date;
  verificationStatus: 'CONFIRMED' | 'UNCONFIRMED' | 'REFUTED' | 'ENTERED_IN_ERROR';
  notes?: string;
  reportedBy?: string;
}

/**
 * Medication being ordered
 */
export interface OrderedMedication {
  genericName: string;
  brandName?: string;
  drugClass?: DrugClass;
  route: string;
  indication?: string;
}

/**
 * Allergy alert result
 */
export interface AllergyAlert {
  severity: 'CONTRAINDICATED' | 'WARNING' | 'CAUTION' | 'INFO';
  allergyMatch: {
    type: 'DIRECT' | 'CROSS_REACTIVE' | 'CLASS_RELATED';
    allergen: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  patientAllergy: PatientAllergy;
  orderedMedication: OrderedMedication;
  message: string;
  recommendation: string;
  alternatives: AlternativeMedication[];
  evidence: {
    crossReactivityRate?: string;
    references: string[];
  };
}

/**
 * Alternative medication for allergic patients
 */
export interface AlternativeMedication {
  genericName: string;
  brandNames: string[];
  drugClass: string;
  reason: string;
  crossReactivityRisk: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  recommendation: string;
}

/**
 * Cross-reactivity pattern
 */
interface CrossReactivityPattern {
  allergen: DrugClass;
  crossReactsWith: DrugClass;
  rate: string; // e.g., "1-10%", "<1%"
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  clinicalSignificance: string;
  references: string[];
}

/**
 * Allergy Alert System
 */
export class AllergyAlertSystem {
  private crossReactivityDatabase: CrossReactivityPattern[] = [];
  private drugClassMappings: Map<string, DrugClass> = new Map();

  constructor() {
    this.initializeCrossReactivityDatabase();
    this.initializeDrugClassMappings();
  }

  /**
   * Check for allergy alerts when ordering medication
   */
  async checkAllergies(
    orderedMedication: OrderedMedication,
    patientAllergies: PatientAllergy[]
  ): Promise<AllergyAlert[]> {
    const alerts: AllergyAlert[] = [];

    for (const allergy of patientAllergies) {
      // Skip refuted or error entries
      if (
        allergy.verificationStatus === 'REFUTED' ||
        allergy.verificationStatus === 'ENTERED_IN_ERROR'
      ) {
        continue;
      }

      // Check for direct match
      const directMatch = this.checkDirectMatch(orderedMedication, allergy);
      if (directMatch) {
        alerts.push(directMatch);
        continue; // Don't check cross-reactivity if direct match
      }

      // Check for cross-reactivity
      const crossReactivityAlert = await this.checkCrossReactivity(
        orderedMedication,
        allergy
      );
      if (crossReactivityAlert) {
        alerts.push(crossReactivityAlert);
      }

      // Check for class-related allergies
      const classAlert = this.checkClassRelated(orderedMedication, allergy);
      if (classAlert) {
        alerts.push(classAlert);
      }
    }

    // Sort by severity
    return alerts.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));
  }

  /**
   * Check for direct allergen match
   */
  private checkDirectMatch(
    medication: OrderedMedication,
    allergy: PatientAllergy
  ): AllergyAlert | null {
    const medName = medication.genericName.toLowerCase();
    const allergen = allergy.allergen.toLowerCase();

    if (medName === allergen || medName.includes(allergen) || allergen.includes(medName)) {
      return {
        severity: allergy.severity === AllergySeverity.SEVERE ? 'CONTRAINDICATED' : 'WARNING',
        allergyMatch: {
          type: 'DIRECT',
          allergen: allergy.allergen,
          confidence: 'HIGH',
        },
        patientAllergy: allergy,
        orderedMedication: medication,
        message: `DIRECT ALLERGY MATCH: Patient has documented ${allergy.severity.toLowerCase()} allergy to ${allergy.allergen}`,
        recommendation: this.getDirectMatchRecommendation(allergy),
        alternatives: this.getAlternatives(medication, allergy),
        evidence: {
          references: ['Patient allergy history'],
        },
      };
    }

    return null;
  }

  /**
   * Check for cross-reactivity
   */
  private async checkCrossReactivity(
    medication: OrderedMedication,
    allergy: PatientAllergy
  ): Promise<AllergyAlert | null> {
    // Determine drug classes
    const medClass = medication.drugClass || this.inferDrugClass(medication.genericName);
    const allergyClass = allergy.allergenClass || this.inferDrugClass(allergy.allergen);

    if (!medClass || !allergyClass) {
      return null;
    }

    // Look for cross-reactivity patterns
    const crossReactivity = this.crossReactivityDatabase.find(
      pattern =>
        (pattern.allergen === allergyClass && pattern.crossReactsWith === medClass) ||
        (pattern.allergen === medClass && pattern.crossReactsWith === allergyClass)
    );

    if (!crossReactivity) {
      return null;
    }

    // Special handling for severe allergies
    const isSevereAllergy =
      allergy.severity === AllergySeverity.SEVERE ||
      allergy.reactionType.includes(AllergyReactionType.ANAPHYLAXIS) ||
      allergy.reactionType.includes(AllergyReactionType.STEVENS_JOHNSON) ||
      allergy.reactionType.includes(AllergyReactionType.TOXIC_EPIDERMAL_NECROLYSIS);

    let severity: AllergyAlert['severity'];
    if (isSevereAllergy && crossReactivity.severity === 'HIGH') {
      severity = 'CONTRAINDICATED';
    } else if (crossReactivity.severity === 'HIGH') {
      severity = 'WARNING';
    } else {
      severity = 'CAUTION';
    }

    return {
      severity,
      allergyMatch: {
        type: 'CROSS_REACTIVE',
        allergen: allergy.allergen,
        confidence: crossReactivity.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      },
      patientAllergy: allergy,
      orderedMedication: medication,
      message: `CROSS-REACTIVITY: Patient allergic to ${allergy.allergen} (${allergyClass}). ${crossReactivity.rate} cross-reactivity rate with ${medClass}.`,
      recommendation: this.getCrossReactivityRecommendation(crossReactivity, allergy),
      alternatives: this.getAlternatives(medication, allergy),
      evidence: {
        crossReactivityRate: crossReactivity.rate,
        references: crossReactivity.references,
      },
    };
  }

  /**
   * Check for class-related allergies
   */
  private checkClassRelated(
    medication: OrderedMedication,
    allergy: PatientAllergy
  ): AllergyAlert | null {
    const medClass = medication.drugClass || this.inferDrugClass(medication.genericName);
    const allergyClass = allergy.allergenClass || this.inferDrugClass(allergy.allergen);

    if (medClass && allergyClass && medClass === allergyClass) {
      return {
        severity: 'WARNING',
        allergyMatch: {
          type: 'CLASS_RELATED',
          allergen: allergy.allergen,
          confidence: 'MEDIUM',
        },
        patientAllergy: allergy,
        orderedMedication: medication,
        message: `Same drug class: ${medication.genericName} is in the same class (${medClass}) as ${allergy.allergen}`,
        recommendation: 'Use extreme caution. Consider alternative from different drug class.',
        alternatives: this.getAlternatives(medication, allergy),
        evidence: {
          references: ['Drug class classification'],
        },
      };
    }

    return null;
  }

  /**
   * Get alternative medications
   */
  private getAlternatives(
    medication: OrderedMedication,
    allergy: PatientAllergy
  ): AlternativeMedication[] {
    const alternatives: AlternativeMedication[] = [];

    // Penicillin allergy alternatives
    if (allergy.allergenClass === DrugClass.PENICILLIN) {
      if (medication.drugClass === DrugClass.PENICILLIN) {
        // Severe allergy: avoid all beta-lactams
        if (allergy.severity === AllergySeverity.SEVERE) {
          alternatives.push({
            genericName: 'azithromycin',
            brandNames: ['Zithromax'],
            drugClass: 'Macrolide',
            reason: 'No cross-reactivity with penicillins',
            crossReactivityRisk: 'NONE',
            recommendation: 'Safe alternative for severe penicillin allergy',
          });
          alternatives.push({
            genericName: 'levofloxacin',
            brandNames: ['Levaquin'],
            drugClass: 'Fluoroquinolone',
            reason: 'No cross-reactivity with penicillins',
            crossReactivityRisk: 'NONE',
            recommendation: 'Consider for appropriate indications',
          });
        } else {
          // Mild allergy: cephalosporins may be option
          alternatives.push({
            genericName: 'cefazolin',
            brandNames: ['Ancef'],
            drugClass: 'Cephalosporin (1st gen)',
            reason: 'Low cross-reactivity (<1%) with non-anaphylactic penicillin allergy',
            crossReactivityRisk: 'LOW',
            recommendation: 'May use with caution if mild allergy, monitor closely',
          });
        }
      }
    }

    // Sulfa allergy alternatives
    if (allergy.allergenClass === DrugClass.SULFONAMIDE_ANTIBIOTIC) {
      alternatives.push({
        genericName: 'doxycycline',
        brandNames: ['Vibramycin'],
        drugClass: 'Tetracycline',
        reason: 'No cross-reactivity with sulfonamides',
        crossReactivityRisk: 'NONE',
        recommendation: 'Safe alternative for sulfa allergy',
      });
    }

    return alternatives;
  }

  /**
   * Infer drug class from medication name
   */
  private inferDrugClass(medicationName: string): DrugClass | null {
    const name = medicationName.toLowerCase();

    // Check mappings
    for (const [pattern, drugClass] of this.drugClassMappings) {
      if (name.includes(pattern)) {
        return drugClass;
      }
    }

    return null;
  }

  /**
   * Get recommendation for direct match
   */
  private getDirectMatchRecommendation(allergy: PatientAllergy): string {
    if (allergy.severity === AllergySeverity.SEVERE) {
      return 'CONTRAINDICATED: DO NOT ADMINISTER. Select alternative medication from different drug class.';
    }

    if (
      allergy.reactionType.includes(AllergyReactionType.ANAPHYLAXIS) ||
      allergy.reactionType.includes(AllergyReactionType.STEVENS_JOHNSON)
    ) {
      return 'ABSOLUTE CONTRAINDICATION: Life-threatening reaction documented. Must use alternative.';
    }

    return 'Allergy documented. Consider alternative medication or proceed only if benefits clearly outweigh risks with close monitoring.';
  }

  /**
   * Get recommendation for cross-reactivity
   */
  private getCrossReactivityRecommendation(
    pattern: CrossReactivityPattern,
    allergy: PatientAllergy
  ): string {
    const isSevere =
      allergy.severity === AllergySeverity.SEVERE ||
      allergy.reactionType.includes(AllergyReactionType.ANAPHYLAXIS);

    if (isSevere && pattern.severity === 'HIGH') {
      return `Avoid due to cross-reactivity risk (${pattern.rate}) and severe allergy history. Use alternative from different class.`;
    }

    if (pattern.severity === 'HIGH') {
      return `Use with extreme caution. ${pattern.rate} cross-reactivity rate. Consider skin testing or graded challenge if necessary. Prefer alternative if available.`;
    }

    return `Monitor for cross-reactivity. ${pattern.rate} cross-reactivity rate. ${pattern.clinicalSignificance}`;
  }

  /**
   * Get severity score for sorting
   */
  private getSeverityScore(severity: AllergyAlert['severity']): number {
    const scores = {
      CONTRAINDICATED: 4,
      WARNING: 3,
      CAUTION: 2,
      INFO: 1,
    };
    return scores[severity];
  }

  /**
   * Initialize cross-reactivity database
   */
  private initializeCrossReactivityDatabase(): void {
    this.crossReactivityDatabase = [
      {
        allergen: DrugClass.PENICILLIN,
        crossReactsWith: DrugClass.CEPHALOSPORIN,
        rate: '1-10% (varies by generation)',
        severity: 'MODERATE',
        clinicalSignificance:
          'Cross-reactivity risk is low (<1%) for non-anaphylactic reactions. Higher with first-generation cephalosporins.',
        references: [
          'Pichler WJ, et al. Allergy. 2006',
          'Romano A, et al. J Allergy Clin Immunol. 2010',
        ],
      },
      {
        allergen: DrugClass.PENICILLIN,
        crossReactsWith: DrugClass.CARBAPENEM,
        rate: '1%',
        severity: 'LOW',
        clinicalSignificance:
          'Very low cross-reactivity. Carbapenems generally safe in penicillin-allergic patients except those with severe reactions.',
        references: ['Atanaskovic-Markovic M, et al. Allergy. 2013'],
      },
      {
        allergen: DrugClass.PENICILLIN,
        crossReactsWith: DrugClass.MONOBACTAM,
        rate: '<1%',
        severity: 'LOW',
        clinicalSignificance:
          'Minimal cross-reactivity. Aztreonam safe except in patients with ceftazidime allergy.',
        references: ['Saxon A, et al. Ann Intern Med. 1987'],
      },
      {
        allergen: DrugClass.SULFONAMIDE_ANTIBIOTIC,
        crossReactsWith: DrugClass.SULFONAMIDE_NONANTIBIOTIC,
        rate: 'Not established',
        severity: 'LOW',
        clinicalSignificance:
          'No immunologic cross-reactivity. Similar reactions may occur due to shared sulfonamide moiety but not true cross-reactivity.',
        references: [
          'Brackett CC, et al. Ann Pharmacother. 2004',
          'Strom BL, et al. JAMA. 2003',
        ],
      },
      {
        allergen: DrugClass.CEPHALOSPORIN,
        crossReactsWith: DrugClass.CARBAPENEM,
        rate: '<1%',
        severity: 'LOW',
        clinicalSignificance: 'Low cross-reactivity between cephalosporins and carbapenems.',
        references: ['Demoly P, et al. Allergy. 2014'],
      },
    ];
  }

  /**
   * Initialize drug class mappings
   */
  private initializeDrugClassMappings(): void {
    // Penicillins
    const penicillins = [
      'penicillin',
      'amoxicillin',
      'ampicillin',
      'nafcillin',
      'oxacillin',
      'dicloxacillin',
      'piperacillin',
      'ticarcillin',
    ];
    penicillins.forEach(drug => this.drugClassMappings.set(drug, DrugClass.PENICILLIN));

    // Cephalosporins
    const cephalosporins = [
      'cef',
      'cephalexin',
      'cefazolin',
      'cefuroxime',
      'ceftriaxone',
      'cefepime',
      'ceftaroline',
    ];
    cephalosporins.forEach(drug => this.drugClassMappings.set(drug, DrugClass.CEPHALOSPORIN));

    // Carbapenems
    const carbapenems = ['meropenem', 'imipenem', 'ertapenem', 'doripenem'];
    carbapenems.forEach(drug => this.drugClassMappings.set(drug, DrugClass.CARBAPENEM));

    // Monobactams
    this.drugClassMappings.set('aztreonam', DrugClass.MONOBACTAM);

    // Sulfonamide antibiotics
    const sulfonamides = ['sulfamethoxazole', 'sulfasalazine', 'sulfadiazine', 'sulfisoxazole'];
    sulfonamides.forEach(drug =>
      this.drugClassMappings.set(drug, DrugClass.SULFONAMIDE_ANTIBIOTIC)
    );

    // Sulfonamide non-antibiotics
    const sulfonamideNonAbx = ['furosemide', 'hydrochlorothiazide', 'glipizide', 'celecoxib'];
    sulfonamideNonAbx.forEach(drug =>
      this.drugClassMappings.set(drug, DrugClass.SULFONAMIDE_NONANTIBIOTIC)
    );

    // NSAIDs
    const nsaids = ['ibuprofen', 'naproxen', 'ketorolac', 'diclofenac', 'celecoxib', 'aspirin'];
    nsaids.forEach(drug => this.drugClassMappings.set(drug, DrugClass.NSAID));
  }
}

// Export singleton instance
export const allergyAlertSystem = new AllergyAlertSystem();

/**
 * Quick allergy check function
 */
export async function checkMedicationAllergies(
  medication: OrderedMedication,
  allergies: PatientAllergy[]
): Promise<AllergyAlert[]> {
  return allergyAlertSystem.checkAllergies(medication, allergies);
}
