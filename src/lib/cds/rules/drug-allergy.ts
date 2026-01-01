/**
 * Drug-Allergy Checking
 * Cross-reactivity and allergy matching for medication safety
 */

import {
  DrugAllergyInteraction,
  ContextMedication,
  ContextAllergy,
} from "@/types/cds";
import { AllergySeverity } from "@/types/patient";

/**
 * Cross-reactivity database
 * Maps allergens to drugs with cross-reactivity potential
 */
interface CrossReactivityRule {
  allergen: string;
  drugClass: string;
  crossReactivityRisk: "HIGH" | "MODERATE" | "LOW";
  description: string;
  management: string;
}

const CROSS_REACTIVITY_DATABASE: CrossReactivityRule[] = [
  {
    allergen: "penicillin",
    drugClass: "cephalosporin",
    crossReactivityRisk: "MODERATE",
    description:
      "Historical cross-reactivity between penicillins and cephalosporins",
    management:
      "Modern studies show low cross-reactivity (1-3%) except for 1st generation cephalosporins with similar R1 side chains. Use with caution if penicillin allergy is IgE-mediated.",
  },
  {
    allergen: "penicillin",
    drugClass: "carbapenem",
    crossReactivityRisk: "LOW",
    description: "Low cross-reactivity between penicillins and carbapenems",
    management:
      "Carbapenems generally safe in penicillin-allergic patients unless severe IgE-mediated reaction. Consider allergy testing if uncertain.",
  },
  {
    allergen: "sulfonamide antibiotic",
    drugClass: "sulfonamide non-antibiotic",
    crossReactivityRisk: "LOW",
    description:
      "Minimal cross-reactivity between sulfonamide antibiotics and non-antibiotic sulfonamides",
    management:
      "Non-antibiotic sulfonamides (furosemide, hydrochlorothiazide) generally safe in patients with sulfa antibiotic allergy.",
  },
  {
    allergen: "aspirin",
    drugClass: "nsaid",
    crossReactivityRisk: "HIGH",
    description:
      "High cross-reactivity among NSAIDs in aspirin-sensitive patients",
    management:
      "Avoid all NSAIDs in patients with aspirin sensitivity. Consider selective COX-2 inhibitors with caution.",
  },
  {
    allergen: "codeine",
    drugClass: "opioid",
    crossReactivityRisk: "MODERATE",
    description: "Variable cross-reactivity among opioids",
    management:
      "Switch to structurally different opioid. Consider opioids from different chemical classes.",
  },
];

/**
 * Specific drug-allergen mappings
 */
interface DrugAllergenMapping {
  drug: string;
  allergens: string[];
  ingredients: string[];
}

const DRUG_ALLERGEN_MAPPINGS: DrugAllergenMapping[] = [
  {
    drug: "amoxicillin",
    allergens: ["penicillin", "amoxicillin", "beta-lactam"],
    ingredients: ["amoxicillin trihydrate"],
  },
  {
    drug: "cephalexin",
    allergens: ["cephalosporin", "cephalexin", "beta-lactam"],
    ingredients: ["cephalexin"],
  },
  {
    drug: "sulfamethoxazole",
    allergens: [
      "sulfa",
      "sulfonamide",
      "sulfamethoxazole",
      "trimethoprim-sulfamethoxazole",
    ],
    ingredients: ["sulfamethoxazole"],
  },
  {
    drug: "ibuprofen",
    allergens: ["nsaid", "ibuprofen", "aspirin"],
    ingredients: ["ibuprofen"],
  },
  {
    drug: "hydrocodone",
    allergens: ["opioid", "hydrocodone", "codeine"],
    ingredients: ["hydrocodone bitartrate"],
  },
];

/**
 * Drug-Allergy Checker
 */
export class DrugAllergyChecker {
  /**
   * Check for drug-allergy conflicts
   */
  checkAllergies(
    medications: ContextMedication[],
    allergies: ContextAllergy[],
  ): DrugAllergyInteraction[] {
    const conflicts: DrugAllergyInteraction[] = [];

    for (const medication of medications) {
      for (const allergy of allergies) {
        const conflict = this.checkSingleAllergy(medication, allergy);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return this.sortBySeverity(conflicts);
  }

  /**
   * Check single medication against single allergy
   */
  private checkSingleAllergy(
    medication: ContextMedication,
    allergy: ContextAllergy,
  ): DrugAllergyInteraction | null {
    const medName = medication.genericName.toLowerCase();
    const allergen = allergy.allergen.toLowerCase();

    // Direct match
    if (this.isDirectMatch(medName, allergen)) {
      return {
        drugId: medication.id,
        drugName: medication.name,
        allergen: allergy.allergen,
        crossReactivity: false,
        severity: allergy.severity,
        description: `Patient has documented allergy to ${allergy.allergen}`,
        management: this.getDirectMatchManagement(allergy.severity),
      };
    }

    // Check drug-allergen mappings
    const mapping = DRUG_ALLERGEN_MAPPINGS.find(
      (m) => m.drug.toLowerCase() === medName,
    );
    if (mapping) {
      const matchedAllergen = mapping.allergens.find(
        (a) =>
          allergen.includes(a.toLowerCase()) ||
          a.toLowerCase().includes(allergen),
      );
      if (matchedAllergen) {
        return {
          drugId: medication.id,
          drugName: medication.name,
          allergen: allergy.allergen,
          crossReactivity: false,
          severity: allergy.severity,
          description: `${medication.name} contains or is related to ${allergy.allergen}`,
          management: this.getDirectMatchManagement(allergy.severity),
        };
      }
    }

    // Check cross-reactivity
    const crossReactivity = this.checkCrossReactivity(medication, allergy);
    if (crossReactivity) {
      return crossReactivity;
    }

    return null;
  }

  /**
   * Check for direct allergen match
   */
  private isDirectMatch(drugName: string, allergen: string): boolean {
    return (
      drugName === allergen ||
      drugName.includes(allergen) ||
      allergen.includes(drugName)
    );
  }

  /**
   * Check for cross-reactivity
   */
  private checkCrossReactivity(
    medication: ContextMedication,
    allergy: ContextAllergy,
  ): DrugAllergyInteraction | null {
    const allergen = allergy.allergen.toLowerCase();
    const drugClass = medication.therapeuticClass?.toLowerCase() || "";

    for (const rule of CROSS_REACTIVITY_DATABASE) {
      const matchesAllergen = allergen.includes(rule.allergen.toLowerCase());
      const matchesDrugClass = drugClass.includes(rule.drugClass.toLowerCase());

      if (matchesAllergen && matchesDrugClass) {
        // Determine severity based on cross-reactivity risk and allergy severity
        const severity = this.calculateCrossReactivitySeverity(
          allergy.severity,
          rule.crossReactivityRisk,
        );

        return {
          drugId: medication.id,
          drugName: medication.name,
          allergen: allergy.allergen,
          crossReactivity: true,
          severity,
          description: `${rule.description}. Patient allergic to ${allergy.allergen}, ${medication.name} is a ${rule.drugClass}.`,
          management: rule.management,
        };
      }
    }

    return null;
  }

  /**
   * Calculate severity for cross-reactive allergies
   */
  private calculateCrossReactivitySeverity(
    allergySeverity: AllergySeverity,
    crossReactivityRisk: "HIGH" | "MODERATE" | "LOW",
  ): AllergySeverity {
    // If original allergy is severe/life-threatening, maintain high severity
    if (
      allergySeverity === AllergySeverity.SEVERE ||
      allergySeverity === AllergySeverity.LIFE_THREATENING
    ) {
      if (crossReactivityRisk === "HIGH") {
        return AllergySeverity.SEVERE;
      } else if (crossReactivityRisk === "MODERATE") {
        return AllergySeverity.MODERATE;
      } else {
        return AllergySeverity.MILD;
      }
    }

    // For moderate/mild allergies, downgrade based on cross-reactivity risk
    if (crossReactivityRisk === "HIGH") {
      return AllergySeverity.MODERATE;
    } else if (crossReactivityRisk === "MODERATE") {
      return AllergySeverity.MILD;
    } else {
      return AllergySeverity.MILD;
    }
  }

  /**
   * Get management recommendation for direct matches
   */
  private getDirectMatchManagement(severity: AllergySeverity): string {
    switch (severity) {
      case AllergySeverity.LIFE_THREATENING:
        return "CONTRAINDICATED. Do not administer. Select alternative medication immediately.";
      case AllergySeverity.SEVERE:
        return "Avoid use. Severe reaction documented. Select alternative medication.";
      case AllergySeverity.MODERATE:
        return "Use with extreme caution. Consider alternative. If used, monitor closely for allergic reaction.";
      case AllergySeverity.MILD:
        return "Use with caution. Previous mild reaction documented. Monitor for signs of allergic reaction.";
      default:
        return "Review allergy history. Consider alternative if appropriate.";
    }
  }

  /**
   * Sort conflicts by severity
   */
  private sortBySeverity(
    conflicts: DrugAllergyInteraction[],
  ): DrugAllergyInteraction[] {
    const severityOrder = {
      [AllergySeverity.LIFE_THREATENING]: 4,
      [AllergySeverity.SEVERE]: 3,
      [AllergySeverity.MODERATE]: 2,
      [AllergySeverity.MILD]: 1,
    };

    return conflicts.sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get suggested alternatives for allergic medications
   */
  getSuggestedAlternatives(
    medication: ContextMedication,
    allergy: ContextAllergy,
  ): string[] {
    const alternatives: string[] = [];
    const allergen = allergy.allergen.toLowerCase();

    // Penicillin allergy alternatives
    if (allergen.includes("penicillin")) {
      if (allergy.severity === AllergySeverity.LIFE_THREATENING) {
        alternatives.push(
          "Azithromycin",
          "Fluoroquinolone (if appropriate)",
          "Clindamycin",
        );
      } else {
        alternatives.push(
          "3rd/4th generation cephalosporin",
          "Azithromycin",
          "Fluoroquinolone",
        );
      }
    }

    // NSAID allergy alternatives
    if (allergen.includes("nsaid") || allergen.includes("aspirin")) {
      alternatives.push("Acetaminophen", "Tramadol", "Opioid analgesics");
    }

    // Sulfa allergy alternatives
    if (allergen.includes("sulfa")) {
      alternatives.push(
        "Non-sulfonamide antibiotics",
        "Fluoroquinolones",
        "Macrolides",
      );
    }

    // Opioid allergy alternatives
    if (allergen.includes("opioid") || allergen.includes("codeine")) {
      alternatives.push(
        "Structurally different opioid",
        "Tramadol",
        "Non-opioid analgesics",
      );
    }

    return alternatives;
  }

  /**
   * Validate allergy documentation
   */
  validateAllergyDocumentation(allergy: ContextAllergy): {
    isWellDocumented: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Check if reaction is documented
    if (!allergy.reaction || allergy.reaction.toLowerCase() === "unknown") {
      recommendations.push(
        "Document specific allergic reaction (rash, anaphylaxis, etc.)",
      );
    }

    // Check if severity is appropriate for reaction type
    if (allergy.reaction) {
      const reaction = allergy.reaction.toLowerCase();
      if (
        reaction.includes("anaphylaxis") &&
        allergy.severity !== AllergySeverity.LIFE_THREATENING
      ) {
        recommendations.push(
          "Consider updating severity to LIFE_THREATENING for anaphylaxis",
        );
      }
    }

    return {
      isWellDocumented: recommendations.length === 0,
      recommendations,
    };
  }
}

// Export singleton instance
export const drugAllergyChecker = new DrugAllergyChecker();
