/**
 * Age-Appropriate Dosing Rules
 * Pediatric and geriatric dosing recommendations
 */

import { ContextMedication, CDSContext } from "@/types/cds";

/**
 * Age-based dosing rule
 */
interface AgeDosingRule {
  drug: string;
  ageGroup:
    | "NEONATE"
    | "INFANT"
    | "CHILD"
    | "ADOLESCENT"
    | "ADULT"
    | "GERIATRIC";
  minAge?: number; // years
  maxAge?: number; // years
  recommendation: string;
  maxDose?: string;
  renalAdjustment?: boolean;
  hepaticAdjustment?: boolean;
  warning?: string;
}

const AGE_DOSING_RULES: AgeDosingRule[] = [
  // Acetaminophen pediatric dosing
  {
    drug: "acetaminophen",
    ageGroup: "NEONATE",
    maxAge: 0.25,
    recommendation:
      "Dosing: 10-15 mg/kg/dose every 6-8 hours. Maximum: 60 mg/kg/day.",
    warning: "Use caution in neonates. Monitor for hepatotoxicity.",
  },
  {
    drug: "acetaminophen",
    ageGroup: "INFANT",
    minAge: 0.25,
    maxAge: 2,
    recommendation:
      "Dosing: 10-15 mg/kg/dose every 4-6 hours. Maximum: 75 mg/kg/day (not to exceed 4000 mg/day).",
  },
  {
    drug: "acetaminophen",
    ageGroup: "CHILD",
    minAge: 2,
    maxAge: 12,
    recommendation:
      "Dosing: 10-15 mg/kg/dose every 4-6 hours. Maximum: 75 mg/kg/day (not to exceed 4000 mg/day).",
  },
  {
    drug: "acetaminophen",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "Consider dose reduction in frail elderly. Maximum: 3000 mg/day to reduce hepatotoxicity risk.",
    warning:
      "Increased risk of hepatotoxicity in elderly, especially with chronic use.",
  },

  // Amoxicillin pediatric dosing
  {
    drug: "amoxicillin",
    ageGroup: "NEONATE",
    maxAge: 0.25,
    recommendation: "Dosing: 20-30 mg/kg/day divided every 12 hours.",
    warning: "Adjust for gestational age and postnatal age.",
  },
  {
    drug: "amoxicillin",
    ageGroup: "INFANT",
    minAge: 0.25,
    maxAge: 2,
    recommendation:
      "Dosing: 20-40 mg/kg/day divided every 8-12 hours. For otitis media: 80-90 mg/kg/day.",
  },
  {
    drug: "amoxicillin",
    ageGroup: "CHILD",
    minAge: 2,
    maxAge: 12,
    recommendation:
      "Dosing: 25-45 mg/kg/day divided every 12 hours or 20-40 mg/kg/day divided every 8 hours.",
    maxDose:
      "1500 mg/day for routine infections, 3000 mg/day for severe infections",
  },

  // Metformin age considerations
  {
    drug: "metformin",
    ageGroup: "CHILD",
    minAge: 10,
    maxAge: 18,
    recommendation: "Starting dose: 500 mg twice daily. Maximum: 2000 mg/day.",
    warning: "Monitor for lactic acidosis. Ensure adequate renal function.",
    renalAdjustment: true,
  },
  {
    drug: "metformin",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "Use with caution. Assess renal function before initiating and periodically.",
    warning:
      "Increased risk of lactic acidosis in elderly with reduced renal function. Contraindicated if eGFR < 30.",
    renalAdjustment: true,
  },

  // Aspirin pediatric warning
  {
    drug: "aspirin",
    ageGroup: "CHILD",
    maxAge: 18,
    recommendation: "AVOID for viral illnesses due to Reye syndrome risk.",
    warning:
      "Contraindicated in children with viral infections (flu, chickenpox) due to risk of Reye syndrome.",
  },

  // Benzodiazepines in elderly
  {
    drug: "diazepam",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "Use lowest effective dose. Start with 2-2.5 mg once or twice daily.",
    warning:
      "Beers Criteria: Avoid benzodiazepines in elderly. Increased risk of falls, fractures, cognitive impairment.",
  },
  {
    drug: "alprazolam",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "Use lowest effective dose. Start with 0.25 mg 2-3 times daily.",
    warning:
      "Beers Criteria: Avoid benzodiazepines in elderly. Consider non-benzodiazepine alternatives.",
  },

  // Anticholinergics in elderly
  {
    drug: "diphenhydramine",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "AVOID in elderly. Consider alternatives for sleep or allergies.",
    warning:
      "Beers Criteria: Strong anticholinergic. Risk of confusion, constipation, urinary retention, falls.",
  },

  // NSAIDs in elderly
  {
    drug: "ibuprofen",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation:
      "Use lowest effective dose for shortest duration. Maximum: 1200 mg/day.",
    warning:
      "Increased risk of GI bleeding, cardiovascular events, and renal impairment in elderly.",
    renalAdjustment: true,
  },

  // Digoxin in elderly
  {
    drug: "digoxin",
    ageGroup: "GERIATRIC",
    minAge: 65,
    recommendation: "Reduce dose. Target level: 0.5-0.9 ng/mL.",
    warning:
      "Elderly are more susceptible to digoxin toxicity. Monitor levels and renal function closely.",
    renalAdjustment: true,
  },

  // Morphine pediatric
  {
    drug: "morphine",
    ageGroup: "NEONATE",
    maxAge: 0.25,
    recommendation:
      "Dosing: 0.05-0.1 mg/kg/dose every 4 hours as needed. Use with extreme caution.",
    warning:
      "Neonates have reduced morphine clearance. Risk of respiratory depression.",
  },
  {
    drug: "morphine",
    ageGroup: "INFANT",
    minAge: 0.25,
    maxAge: 2,
    recommendation: "Dosing: 0.1-0.2 mg/kg/dose every 3-4 hours as needed.",
    warning:
      "Monitor for respiratory depression. Adjust dose based on response.",
  },
];

/**
 * Weight-based dosing calculator
 */
interface WeightBasedDose {
  dosePerKg: number;
  unit: string;
  frequency: string;
  maxDailyDose?: number;
  maxSingleDose?: number;
}

export interface AgeDosingAlert {
  type: "AGE_INAPPROPRIATE" | "DOSE_ADJUSTMENT" | "CONTRAINDICATED" | "CAUTION";
  severity: "HIGH" | "MODERATE" | "LOW";
  medication: ContextMedication;
  patientAge: number;
  recommendation: string;
  warning?: string;
  suggestedDose?: string;
}

/**
 * Age-Appropriate Dosing Checker
 */
export class AgeDosingChecker {
  /**
   * Check medications for age-appropriate dosing
   */
  checkAgeDosing(
    medications: ContextMedication[],
    context: CDSContext,
  ): AgeDosingAlert[] {
    const alerts: AgeDosingAlert[] = [];

    if (!context.patientAge && context.patientAge !== 0) {
      return alerts;
    }

    for (const medication of medications) {
      const alert = this.checkSingleMedication(
        medication,
        context.patientAge,
        context,
      );
      if (alert) {
        alerts.push(alert);
      }
    }

    return this.sortBySeverity(alerts);
  }

  /**
   * Check single medication for age appropriateness
   */
  private checkSingleMedication(
    medication: ContextMedication,
    age: number,
    context: CDSContext,
  ): AgeDosingAlert | null {
    const medName = medication.genericName.toLowerCase();

    // Find applicable age dosing rules
    const applicableRules = AGE_DOSING_RULES.filter((rule) => {
      const matchesDrug = rule.drug.toLowerCase() === medName;
      const matchesAge =
        (!rule.minAge || age >= rule.minAge) &&
        (!rule.maxAge || age < rule.maxAge);
      return matchesDrug && matchesAge;
    });

    if (applicableRules.length === 0) {
      return null;
    }

    // Use the most specific rule
    const rule = applicableRules[0];

    // Determine alert severity
    const severity = this.determineSeverity(rule, medication);

    // Determine alert type
    const type = this.determineAlertType(rule);

    return {
      type,
      severity,
      medication,
      patientAge: age,
      recommendation: rule.recommendation,
      warning: rule.warning,
      suggestedDose: rule.maxDose,
    };
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(
    rule: AgeDosingRule,
    medication: ContextMedication,
  ): "HIGH" | "MODERATE" | "LOW" {
    if (rule.warning) {
      if (
        rule.warning.toLowerCase().includes("contraindicated") ||
        rule.warning.toLowerCase().includes("avoid")
      ) {
        return "HIGH";
      }
      if (rule.warning.toLowerCase().includes("caution")) {
        return "MODERATE";
      }
    }

    if (rule.ageGroup === "NEONATE" || rule.ageGroup === "GERIATRIC") {
      return "MODERATE";
    }

    return "LOW";
  }

  /**
   * Determine alert type
   */
  private determineAlertType(rule: AgeDosingRule): AgeDosingAlert["type"] {
    if (rule.warning) {
      if (rule.warning.toLowerCase().includes("contraindicated")) {
        return "CONTRAINDICATED";
      }
      if (rule.warning.toLowerCase().includes("avoid")) {
        return "CONTRAINDICATED";
      }
      if (rule.warning.toLowerCase().includes("caution")) {
        return "CAUTION";
      }
    }

    if (rule.recommendation.toLowerCase().includes("avoid")) {
      return "CONTRAINDICATED";
    }

    if (rule.maxDose || rule.recommendation.toLowerCase().includes("maximum")) {
      return "DOSE_ADJUSTMENT";
    }

    return "CAUTION";
  }

  /**
   * Calculate weight-based dose
   */
  calculateWeightBasedDose(
    medication: string,
    weight: number,
    age: number,
    doseConfig: WeightBasedDose,
  ): {
    recommendedDose: number;
    unit: string;
    exceedsMax: boolean;
    recommendation: string;
  } {
    const calculatedDose = weight * doseConfig.dosePerKg;
    let recommendedDose = calculatedDose;
    let exceedsMax = false;

    // Check against maximum single dose
    if (doseConfig.maxSingleDose && calculatedDose > doseConfig.maxSingleDose) {
      recommendedDose = doseConfig.maxSingleDose;
      exceedsMax = true;
    }

    const recommendation = exceedsMax
      ? `Calculated dose (${calculatedDose.toFixed(1)} ${doseConfig.unit}) exceeds maximum single dose. Use ${recommendedDose} ${doseConfig.unit} ${doseConfig.frequency}.`
      : `Recommended dose: ${recommendedDose.toFixed(1)} ${doseConfig.unit} ${doseConfig.frequency}`;

    return {
      recommendedDose,
      unit: doseConfig.unit,
      exceedsMax,
      recommendation,
    };
  }

  /**
   * Get Beers Criteria alerts for elderly
   */
  getBeersCriteriaAlerts(
    medications: ContextMedication[],
    age: number,
  ): AgeDosingAlert[] {
    if (age < 65) {
      return [];
    }

    const beersCriteriaMeds = [
      "diphenhydramine",
      "hydroxyzine",
      "diazepam",
      "alprazolam",
      "lorazepam",
      "zolpidem",
      "cyclobenzaprine",
      "amitriptyline",
      "doxepin",
      "promethazine",
    ];

    const alerts: AgeDosingAlert[] = [];

    for (const medication of medications) {
      const medName = medication.genericName.toLowerCase();
      if (beersCriteriaMeds.some((m) => medName.includes(m))) {
        alerts.push({
          type: "AGE_INAPPROPRIATE",
          severity: "MODERATE",
          medication,
          patientAge: age,
          recommendation:
            "Beers Criteria: Potentially inappropriate medication in elderly. Consider alternative.",
          warning:
            "This medication is on the Beers Criteria list of potentially inappropriate medications for elderly patients.",
        });
      }
    }

    return alerts;
  }

  /**
   * Get pediatric safety alerts
   */
  getPediatricSafetyAlerts(
    medications: ContextMedication[],
    age: number,
  ): AgeDosingAlert[] {
    if (age >= 18) {
      return [];
    }

    const alerts: AgeDosingAlert[] = [];

    for (const medication of medications) {
      const medName = medication.genericName.toLowerCase();

      // Aspirin in children
      if (medName.includes("aspirin") && age < 18) {
        alerts.push({
          type: "CONTRAINDICATED",
          severity: "HIGH",
          medication,
          patientAge: age,
          recommendation:
            "AVOID aspirin in children due to risk of Reye syndrome.",
          warning: "Contraindicated in children with viral infections.",
        });
      }

      // Tetracyclines in children < 8
      if (
        (medName.includes("tetracycline") || medName.includes("doxycycline")) &&
        age < 8
      ) {
        alerts.push({
          type: "CONTRAINDICATED",
          severity: "HIGH",
          medication,
          patientAge: age,
          recommendation: "AVOID tetracyclines in children under 8 years old.",
          warning:
            "Risk of permanent tooth discoloration and enamel hypoplasia.",
        });
      }

      // Fluoroquinolones in children
      if (
        (medName.includes("ciprofloxacin") ||
          medName.includes("levofloxacin")) &&
        age < 18
      ) {
        alerts.push({
          type: "CAUTION",
          severity: "MODERATE",
          medication,
          patientAge: age,
          recommendation:
            "Use fluoroquinolones in pediatrics only when no alternative exists.",
          warning:
            "Risk of musculoskeletal adverse events. Reserved for specific indications.",
        });
      }
    }

    return alerts;
  }

  /**
   * Sort alerts by severity
   */
  private sortBySeverity(alerts: AgeDosingAlert[]): AgeDosingAlert[] {
    const severityOrder = { HIGH: 3, MODERATE: 2, LOW: 1 };

    return alerts.sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get age group from age
   */
  getAgeGroup(age: number): string {
    if (age < 0.25) return "NEONATE";
    if (age < 2) return "INFANT";
    if (age < 12) return "CHILD";
    if (age < 18) return "ADOLESCENT";
    if (age < 65) return "ADULT";
    return "GERIATRIC";
  }
}

// Export singleton instance
export const ageDosingChecker = new AgeDosingChecker();
