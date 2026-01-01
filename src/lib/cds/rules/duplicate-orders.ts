/**
 * Duplicate Order Detection
 * Identifies duplicate therapy and redundant orders
 */

import { ContextMedication } from "@/types/cds";

/**
 * Therapeutic class equivalence mapping
 */
interface TherapeuticClassEquivalence {
  class: string;
  subclasses: string[];
  description: string;
}

const THERAPEUTIC_CLASSES: TherapeuticClassEquivalence[] = [
  {
    class: "Statin",
    subclasses: ["HMG-CoA Reductase Inhibitor", "Cholesterol-Lowering Agent"],
    description: "Cholesterol-lowering medications",
  },
  {
    class: "ACE Inhibitor",
    subclasses: ["Angiotensin-Converting Enzyme Inhibitor"],
    description: "Blood pressure medications that inhibit ACE",
  },
  {
    class: "ARB",
    subclasses: [
      "Angiotensin Receptor Blocker",
      "Angiotensin II Receptor Antagonist",
    ],
    description: "Blood pressure medications that block angiotensin receptors",
  },
  {
    class: "Beta Blocker",
    subclasses: ["Beta-Adrenergic Blocker", "Beta-Adrenergic Antagonist"],
    description: "Blood pressure and heart rate medications",
  },
  {
    class: "Proton Pump Inhibitor",
    subclasses: ["PPI", "Gastric Acid Suppressant"],
    description: "Acid reflux medications",
  },
  {
    class: "H2 Blocker",
    subclasses: ["H2 Receptor Antagonist", "Histamine-2 Blocker"],
    description: "Acid reflux medications",
  },
  {
    class: "NSAID",
    subclasses: ["Nonsteroidal Anti-Inflammatory Drug", "COX Inhibitor"],
    description: "Anti-inflammatory pain medications",
  },
  {
    class: "SSRI",
    subclasses: ["Selective Serotonin Reuptake Inhibitor"],
    description: "Antidepressant medications",
  },
  {
    class: "Benzodiazepine",
    subclasses: ["Anxiolytic", "Sedative-Hypnotic"],
    description: "Anti-anxiety medications",
  },
];

/**
 * Duplicate detection rule
 */
interface DuplicateRule {
  type: "SAME_DRUG" | "SAME_CLASS" | "SAME_INGREDIENT" | "REDUNDANT_THERAPY";
  severity: "HIGH" | "MODERATE" | "LOW";
  allowedTimeGap?: number; // hours
}

export interface DuplicateTherapyAlert {
  type: string;
  severity: "HIGH" | "MODERATE" | "LOW";
  medication1: ContextMedication;
  medication2: ContextMedication;
  reason: string;
  recommendation: string;
}

/**
 * Duplicate Order Detector
 */
export class DuplicateOrderDetector {
  /**
   * Detect duplicate medications
   */
  detectDuplicates(
    newMedications: ContextMedication[],
    existingMedications: ContextMedication[],
  ): DuplicateTherapyAlert[] {
    const duplicates: DuplicateTherapyAlert[] = [];

    // Check new meds against existing meds
    for (const newMed of newMedications) {
      for (const existingMed of existingMedications) {
        const duplicate = this.checkPairForDuplicate(newMed, existingMed);
        if (duplicate) {
          duplicates.push(duplicate);
        }
      }
    }

    // Check new meds against each other
    for (let i = 0; i < newMedications.length; i++) {
      for (let j = i + 1; j < newMedications.length; j++) {
        const duplicate = this.checkPairForDuplicate(
          newMedications[i],
          newMedications[j],
        );
        if (duplicate) {
          duplicates.push(duplicate);
        }
      }
    }

    return this.sortBySeverity(duplicates);
  }

  /**
   * Check if two medications are duplicates
   */
  private checkPairForDuplicate(
    med1: ContextMedication,
    med2: ContextMedication,
  ): DuplicateTherapyAlert | null {
    // Same exact drug
    if (this.isSameDrug(med1, med2)) {
      return {
        type: "SAME_DRUG",
        severity: "HIGH",
        medication1: med1,
        medication2: med2,
        reason: `Duplicate order for ${med1.genericName}`,
        recommendation:
          "Remove duplicate order. Verify intended dose and frequency.",
      };
    }

    // Same ingredient (different brand names)
    if (this.hasSameIngredient(med1, med2)) {
      return {
        type: "SAME_INGREDIENT",
        severity: "HIGH",
        medication1: med1,
        medication2: med2,
        reason: `Both medications contain the same active ingredient (${med1.genericName})`,
        recommendation:
          "Consolidate to single medication to avoid duplicate dosing.",
      };
    }

    // Same therapeutic class
    if (this.isSameTherapeuticClass(med1, med2)) {
      return {
        type: "SAME_CLASS",
        severity: "MODERATE",
        medication1: med1,
        medication2: med2,
        reason: `Both medications are in the same therapeutic class${med1.therapeuticClass ? ` (${med1.therapeuticClass})` : ""}`,
        recommendation:
          "Review for duplicate therapy. Consider consolidating unless combination is clinically indicated.",
      };
    }

    // Redundant therapy (e.g., ACE + ARB)
    const redundancy = this.checkRedundantTherapy(med1, med2);
    if (redundancy) {
      return redundancy;
    }

    return null;
  }

  /**
   * Check if medications are the exact same drug
   */
  private isSameDrug(
    med1: ContextMedication,
    med2: ContextMedication,
  ): boolean {
    // Compare by RXCUI
    if (med1.rxcui && med2.rxcui && med1.rxcui === med2.rxcui) {
      return true;
    }

    // Compare by generic name
    const name1 = med1.genericName.toLowerCase().trim();
    const name2 = med2.genericName.toLowerCase().trim();

    return name1 === name2;
  }

  /**
   * Check if medications have the same active ingredient
   */
  private hasSameIngredient(
    med1: ContextMedication,
    med2: ContextMedication,
  ): boolean {
    // This would ideally check ingredient lists
    // For now, use generic name comparison
    return this.isSameDrug(med1, med2);
  }

  /**
   * Check if medications are in the same therapeutic class
   */
  private isSameTherapeuticClass(
    med1: ContextMedication,
    med2: ContextMedication,
  ): boolean {
    if (!med1.therapeuticClass || !med2.therapeuticClass) {
      return false;
    }

    const class1 = med1.therapeuticClass.toLowerCase();
    const class2 = med2.therapeuticClass.toLowerCase();

    // Exact match
    if (class1 === class2) {
      return true;
    }

    // Check therapeutic class equivalencies
    for (const classGroup of THERAPEUTIC_CLASSES) {
      const matchesClass1 = this.matchesTherapeuticClass(class1, classGroup);
      const matchesClass2 = this.matchesTherapeuticClass(class2, classGroup);

      if (matchesClass1 && matchesClass2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if class matches therapeutic class group
   */
  private matchesTherapeuticClass(
    drugClass: string,
    classGroup: TherapeuticClassEquivalence,
  ): boolean {
    const normalizedClass = drugClass.toLowerCase();
    const normalizedGroupClass = classGroup.class.toLowerCase();

    if (normalizedClass.includes(normalizedGroupClass)) {
      return true;
    }

    return classGroup.subclasses.some((subclass) =>
      normalizedClass.includes(subclass.toLowerCase()),
    );
  }

  /**
   * Check for redundant therapy combinations
   */
  private checkRedundantTherapy(
    med1: ContextMedication,
    med2: ContextMedication,
  ): DuplicateTherapyAlert | null {
    if (!med1.therapeuticClass || !med2.therapeuticClass) {
      return null;
    }

    const class1 = med1.therapeuticClass.toLowerCase();
    const class2 = med2.therapeuticClass.toLowerCase();

    // ACE Inhibitor + ARB (generally redundant)
    if (
      (class1.includes("ace inhibitor") && class2.includes("arb")) ||
      (class1.includes("arb") && class2.includes("ace inhibitor"))
    ) {
      return {
        type: "REDUNDANT_THERAPY",
        severity: "MODERATE",
        medication1: med1,
        medication2: med2,
        reason:
          "ACE Inhibitor and ARB combination is generally not recommended",
        recommendation:
          "Consider using only one agent unless specifically indicated for heart failure with reduced ejection fraction.",
      };
    }

    // PPI + H2 Blocker (redundant)
    if (
      (class1.includes("proton pump inhibitor") && class2.includes("h2")) ||
      (class1.includes("h2") && class2.includes("proton pump inhibitor"))
    ) {
      return {
        type: "REDUNDANT_THERAPY",
        severity: "MODERATE",
        medication1: med1,
        medication2: med2,
        reason: "PPI and H2 blocker combination is generally redundant",
        recommendation:
          "PPI alone is typically sufficient for acid suppression. Consider discontinuing H2 blocker.",
      };
    }

    // Multiple NSAIDs
    if (class1.includes("nsaid") && class2.includes("nsaid")) {
      return {
        type: "REDUNDANT_THERAPY",
        severity: "HIGH",
        medication1: med1,
        medication2: med2,
        reason:
          "Multiple NSAIDs increase risk of adverse effects without additional benefit",
        recommendation:
          "Use only one NSAID. Combining NSAIDs increases GI bleeding and cardiovascular risks.",
      };
    }

    // Multiple benzodiazepines
    if (
      class1.includes("benzodiazepine") &&
      class2.includes("benzodiazepine")
    ) {
      return {
        type: "REDUNDANT_THERAPY",
        severity: "MODERATE",
        medication1: med1,
        medication2: med2,
        reason:
          "Multiple benzodiazepines may indicate inappropriate polypharmacy",
        recommendation:
          "Review indication for each benzodiazepine. Consider consolidating to single agent if appropriate.",
      };
    }

    return null;
  }

  /**
   * Sort duplicates by severity
   */
  private sortBySeverity(
    duplicates: DuplicateTherapyAlert[],
  ): DuplicateTherapyAlert[] {
    const severityOrder = { HIGH: 3, MODERATE: 2, LOW: 1 };

    return duplicates.sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Check for dose duplication (same drug, different formulations)
   */
  checkDoseDuplication(
    medications: ContextMedication[],
  ): {
    isDuplicate: boolean;
    totalDailyDose?: string;
    medications: ContextMedication[];
  }[] {
    const grouped = new Map<string, ContextMedication[]>();

    // Group by generic name
    medications.forEach((med) => {
      const key = med.genericName.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(med);
    });

    const results: {
      isDuplicate: boolean;
      totalDailyDose?: string;
      medications: ContextMedication[];
    }[] = [];

    grouped.forEach((meds) => {
      if (meds.length > 1) {
        results.push({
          isDuplicate: true,
          medications: meds,
        });
      }
    });

    return results;
  }

  /**
   * Get recommendation for resolving duplicate
   */
  getResolutionRecommendation(alert: DuplicateTherapyAlert): string[] {
    const recommendations: string[] = [];

    switch (alert.type) {
      case "SAME_DRUG":
        recommendations.push("Discontinue one of the duplicate orders");
        recommendations.push("Verify the intended dose and frequency");
        recommendations.push(
          "Check if extended-release and immediate-release formulations are both intended",
        );
        break;

      case "SAME_CLASS":
        recommendations.push("Review clinical indication for each medication");
        recommendations.push(
          "Consider consolidating to single agent if therapeutic goals can be met",
        );
        recommendations.push(
          "Document rationale if both medications are clinically necessary",
        );
        break;

      case "REDUNDANT_THERAPY":
        recommendations.push(
          "Evaluate if combination is evidence-based for this patient",
        );
        recommendations.push("Consider discontinuing one agent");
        recommendations.push(
          "Review current guidelines for this therapeutic area",
        );
        break;
    }

    return recommendations;
  }
}

// Export singleton instance
export const duplicateOrderDetector = new DuplicateOrderDetector();
