/**
 * Genetic Risk Assessment Engine
 * Calculates disease risk based on genetic variants, family history, and clinical factors
 */

import type {
  Variant,
  VariantInterpretation,
  GeneticRiskAssessment,
  RiskCategory,
  RiskFactor,
  ProtectiveFactor,
  AgeSpecificRisk,
  ConfidenceInterval,
} from "@/types/genomics";

/**
 * Assess genetic risk from variants
 */
export async function assessGeneticRisk(
  variants: Variant[],
  interpretations: VariantInterpretation[]
): Promise<GeneticRiskAssessment[]> {
  const assessments: GeneticRiskAssessment[] = [];

  // Group variants by disease
  const diseaseVariants = groupVariantsByDisease(variants, interpretations);

  for (const [condition, conditionVariants] of Object.entries(diseaseVariants)) {
    const assessment = await calculateDiseaseRisk(condition, conditionVariants);
    assessments.push(assessment);
  }

  return assessments;
}

/**
 * Group variants by associated disease
 */
function groupVariantsByDisease(
  variants: Variant[],
  interpretations: VariantInterpretation[]
): Record<string, Array<{ variant: Variant; interpretation: VariantInterpretation }>> {
  const diseaseMap: Record<string, Array<{ variant: Variant; interpretation: VariantInterpretation }>> = {};

  for (const variant of variants) {
    const interpretation = interpretations.find((i) => i.variantId === variant.id);

    if (interpretation && interpretation.diseases.length > 0) {
      for (const disease of interpretation.diseases) {
        if (!diseaseMap[disease.disease]) {
          diseaseMap[disease.disease] = [];
        }
        diseaseMap[disease.disease].push({ variant, interpretation });
      }
    }
  }

  return diseaseMap;
}

/**
 * Calculate disease risk
 */
async function calculateDiseaseRisk(
  condition: string,
  variantData: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): Promise<GeneticRiskAssessment> {
  const pathogenicVariants = variantData.filter(
    (vd) =>
      vd.interpretation.classification === "PATHOGENIC" ||
      vd.interpretation.classification === "LIKELY_PATHOGENIC"
  );

  let riskCategory: RiskCategory;
  let relativeRisk: number | null = null;
  let lifetimeRisk: number | null = null;

  // Calculate risk based on condition and variants
  if (condition.includes("Breast") || condition.includes("Ovarian")) {
    const breastCancerRisk = calculateBreastCancerRisk(pathogenicVariants);
    riskCategory = breastCancerRisk.category;
    relativeRisk = breastCancerRisk.relativeRisk;
    lifetimeRisk = breastCancerRisk.lifetimeRisk;
  } else if (condition.includes("Colorectal")) {
    const colorectalRisk = calculateColorectalCancerRisk(pathogenicVariants);
    riskCategory = colorectalRisk.category;
    relativeRisk = colorectalRisk.relativeRisk;
    lifetimeRisk = colorectalRisk.lifetimeRisk;
  } else if (condition.includes("Cardiovascular") || condition.includes("Cardiac")) {
    const cardiacRisk = calculateCardiacRisk(pathogenicVariants);
    riskCategory = cardiacRisk.category;
    relativeRisk = cardiacRisk.relativeRisk;
  } else {
    riskCategory = "AVERAGE";
    relativeRisk = 1.0;
  }

  const riskFactors = identifyRiskFactors(pathogenicVariants);
  const protectiveFactors = identifyProtectiveFactors([]);
  const recommendations = generateRiskRecommendations(condition, riskCategory, pathogenicVariants);

  const assessment: GeneticRiskAssessment = {
    id: crypto.randomUUID(),
    organizationId: "",
    patientId: "",
    condition,
    conditionCode: null,
    riskCategory,
    relativeRisk,
    absoluteRisk: null,
    lifetimeRisk,
    ageSpecificRisk: generateAgeSpecificRisk(condition, lifetimeRisk),
    riskFactors,
    protectiveFactors,
    modelUsed: "Genetic Risk Model v1.0",
    modelVersion: "1.0",
    confidenceInterval: calculateConfidenceInterval(relativeRisk),
    interpretation: generateRiskInterpretation(condition, riskCategory, relativeRisk),
    recommendations,
    screeningGuidelines: getScreeningGuidelines(condition, riskCategory),
    preventiveActions: getPreventiveActions(condition, riskCategory),
    assessedBy: "Risk Assessment Engine",
    assessedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return assessment;
}

/**
 * Calculate breast cancer risk
 */
function calculateBreastCancerRisk(
  variants: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): { category: RiskCategory; relativeRisk: number; lifetimeRisk: number } {
  const hasBRCA1 = variants.some((v) => v.variant.gene === "BRCA1");
  const hasBRCA2 = variants.some((v) => v.variant.gene === "BRCA2");
  const hasPTEN = variants.some((v) => v.variant.gene === "PTEN");
  const hasTP53 = variants.some((v) => v.variant.gene === "TP53");

  if (hasBRCA1) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 5.0,
      lifetimeRisk: 0.72, // 72% lifetime risk
    };
  } else if (hasBRCA2) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 4.0,
      lifetimeRisk: 0.69, // 69% lifetime risk
    };
  } else if (hasTP53) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 4.5,
      lifetimeRisk: 0.85, // 85% lifetime risk (Li-Fraumeni)
    };
  } else if (hasPTEN) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 3.0,
      lifetimeRisk: 0.85, // 85% lifetime risk (Cowden syndrome)
    };
  }

  return {
    category: "AVERAGE",
    relativeRisk: 1.0,
    lifetimeRisk: 0.125, // 12.5% population risk
  };
}

/**
 * Calculate colorectal cancer risk
 */
function calculateColorectalCancerRisk(
  variants: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): { category: RiskCategory; relativeRisk: number; lifetimeRisk: number } {
  const hasAPC = variants.some((v) => v.variant.gene === "APC");
  const hasLynchGenes = variants.some((v) =>
    ["MLH1", "MSH2", "MSH6", "PMS2", "EPCAM"].includes(v.variant.gene)
  );

  if (hasAPC) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 100.0,
      lifetimeRisk: 1.0, // Nearly 100% (FAP)
    };
  } else if (hasLynchGenes) {
    return {
      category: "VERY_HIGH",
      relativeRisk: 10.0,
      lifetimeRisk: 0.7, // 70% (Lynch syndrome)
    };
  }

  return {
    category: "AVERAGE",
    relativeRisk: 1.0,
    lifetimeRisk: 0.045, // 4.5% population risk
  };
}

/**
 * Calculate cardiac risk
 */
function calculateCardiacRisk(
  variants: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): { category: RiskCategory; relativeRisk: number } {
  const hasCardiomyopathyGenes = variants.some((v) =>
    ["MYH7", "MYBPC3", "TNNT2", "TNNI3", "TPM1"].includes(v.variant.gene)
  );

  const hasArrhythmiaGenes = variants.some((v) =>
    ["KCNQ1", "KCNH2", "SCN5A"].includes(v.variant.gene)
  );

  if (hasCardiomyopathyGenes || hasArrhythmiaGenes) {
    return {
      category: "HIGH",
      relativeRisk: 5.0,
    };
  }

  return {
    category: "AVERAGE",
    relativeRisk: 1.0,
  };
}

/**
 * Identify risk factors
 */
function identifyRiskFactors(
  variants: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  for (const vd of variants) {
    factors.push({
      type: "GENETIC",
      factor: `${vd.variant.gene} ${vd.variant.hgvsProtein || "variant"}`,
      contribution: null,
      modifiable: false,
    });
  }

  return factors;
}

/**
 * Identify protective factors
 */
function identifyProtectiveFactors(
  data: any[]
): ProtectiveFactor[] {
  // Placeholder for protective factors from lifestyle, medications, etc.
  return [];
}

/**
 * Generate age-specific risk
 */
function generateAgeSpecificRisk(
  condition: string,
  lifetimeRisk: number | null
): AgeSpecificRisk[] | null {
  if (!lifetimeRisk) return null;

  const ageRanges = ["20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"];
  const risks: AgeSpecificRisk[] = [];

  for (let i = 0; i < ageRanges.length; i++) {
    const ageMultiplier = Math.min(1.0, (i + 1) / ageRanges.length);
    risks.push({
      ageRange: ageRanges[i],
      risk: lifetimeRisk * ageMultiplier,
      unit: "PERCENTAGE",
    });
  }

  return risks;
}

/**
 * Calculate confidence interval
 */
function calculateConfidenceInterval(
  relativeRisk: number | null
): ConfidenceInterval | null {
  if (!relativeRisk) return null;

  // Simplified CI calculation
  const margin = relativeRisk * 0.2;

  return {
    lower: Math.max(0, relativeRisk - margin),
    upper: relativeRisk + margin,
    confidenceLevel: 95,
  };
}

/**
 * Generate risk interpretation
 */
function generateRiskInterpretation(
  condition: string,
  category: RiskCategory,
  relativeRisk: number | null
): string {
  let interpretation = `Based on genetic testing, the patient has ${category.toLowerCase().replace("_", " ")} risk for ${condition}. `;

  if (relativeRisk && relativeRisk > 1) {
    interpretation += `The relative risk is approximately ${relativeRisk.toFixed(1)}x compared to the general population. `;
  }

  if (category === "VERY_HIGH" || category === "HIGH") {
    interpretation += `Enhanced screening and preventive measures are recommended. `;
  }

  return interpretation;
}

/**
 * Generate risk recommendations
 */
function generateRiskRecommendations(
  condition: string,
  category: RiskCategory,
  variants: Array<{ variant: Variant; interpretation: VariantInterpretation }>
): string {
  let recommendations = "";

  if (category === "VERY_HIGH" || category === "HIGH") {
    recommendations += "1. Enhanced surveillance program\n";
    recommendations += "2. Referral to genetic counselor\n";
    recommendations += "3. Discuss preventive options with specialist\n";
    recommendations += "4. Cascade testing for at-risk family members\n";
  }

  if (condition.includes("Breast")) {
    const hasBRCA = variants.some((v) =>
      ["BRCA1", "BRCA2"].includes(v.variant.gene)
    );
    if (hasBRCA) {
      recommendations += "5. Consider MRI screening in addition to mammography\n";
      recommendations += "6. Discuss risk-reducing options (medications, surgery)\n";
    }
  }

  if (condition.includes("Colorectal")) {
    recommendations += "5. Colonoscopy screening at earlier age\n";
    recommendations += "6. Consider aspirin chemoprevention\n";
  }

  return recommendations || "Standard screening guidelines apply.";
}

/**
 * Get screening guidelines
 */
function getScreeningGuidelines(
  condition: string,
  category: RiskCategory
): string | null {
  if (condition.includes("Breast") && (category === "VERY_HIGH" || category === "HIGH")) {
    return "Annual mammography and MRI starting at age 25-30, clinical breast exam every 6-12 months";
  }

  if (condition.includes("Colorectal") && (category === "VERY_HIGH" || category === "HIGH")) {
    return "Colonoscopy every 1-2 years starting at age 20-25 or 10 years before earliest cancer diagnosis in family";
  }

  if (condition.includes("Ovarian") && (category === "VERY_HIGH" || category === "HIGH")) {
    return "Consider risk-reducing salpingo-oophorectomy at age 35-40 or after childbearing complete";
  }

  return null;
}

/**
 * Get preventive actions
 */
function getPreventiveActions(
  condition: string,
  category: RiskCategory
): string | null {
  if (category === "VERY_HIGH" || category === "HIGH") {
    return "Lifestyle modifications (maintain healthy weight, regular exercise, balanced diet), avoid tobacco, limit alcohol, discuss chemoprevention with physician";
  }

  return null;
}

/**
 * Calculate polygenic risk score
 */
export function calculatePolygenicRiskScore(
  variants: Variant[],
  condition: string
): number {
  // Simplified PRS calculation
  // In real implementation, would use validated PRS models

  let score = 0;
  let variantCount = 0;

  for (const variant of variants) {
    if (variant.interpretation?.classification === "PATHOGENIC") {
      score += 2.0;
      variantCount++;
    } else if (variant.interpretation?.classification === "LIKELY_PATHOGENIC") {
      score += 1.5;
      variantCount++;
    } else if (variant.interpretation?.clinicalSignificance === "RISK_FACTOR") {
      score += 0.5;
      variantCount++;
    }
  }

  return variantCount > 0 ? score / variantCount : 1.0;
}

export default {
  assessGeneticRisk,
  calculatePolygenicRiskScore,
};
