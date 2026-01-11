/**
 * Pharmacogenomics (PGx) Engine
 * Implements CPIC guidelines for drug-gene interactions and personalized medication recommendations
 */

import type {
  Variant,
  PGxRecommendation,
  PGxDrugRecommendation,
  PGxPhenotype,
  MetabolizerStatus,
  FunctionStatus,
  DrugRecommendation,
  PGxEvidence,
  EvidenceLevel,
} from "@/types/genomics";

/**
 * Generate PGx recommendations based on variants
 */
export async function generatePGxRecommendations(
  variants: Variant[]
): Promise<PGxRecommendation[]> {
  const recommendations: PGxRecommendation[] = [];

  // Extract pharmacogenes from variants
  const pharmacogenes = extractPharmacogenes(variants);

  // Process each pharmacogene
  for (const [gene, geneVariants] of Object.entries(pharmacogenes)) {
    const diplotype = determineDiplotype(gene, geneVariants);
    const phenotype = determinePhenotype(gene, diplotype);
    const drugRecommendations = getDrugRecommendations(gene, phenotype);

    if (drugRecommendations.length > 0) {
      const recommendation: PGxRecommendation = {
        id: crypto.randomUUID(),
        organizationId: "",
        patientId: geneVariants[0]?.id || "",
        gene,
        diplotype,
        phenotype,
        activityScore: calculateActivityScore(gene, diplotype),
        drugs: drugRecommendations,
        guideline: "CPIC",
        guidelineVersion: "2024.1",
        evidence: getEvidenceLevel(gene),
        recommendations: generateRecommendationText(gene, phenotype, drugRecommendations),
        alternatives: generateAlternatives(gene, drugRecommendations),
        monitoring: getMonitoringGuidance(gene, phenotype),
        clinicalContext: null,
        dateIssued: new Date(),
        issuedBy: "PGx Engine",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: "system",
        updatedBy: "system",
      };

      recommendations.push(recommendation);
    }
  }

  return recommendations;
}

/**
 * Extract pharmacogenes from variants
 */
function extractPharmacogenes(variants: Variant[]): Record<string, Variant[]> {
  const pharmacogenes = [
    "CYP2D6", "CYP2C19", "CYP2C9", "CYP3A5", "SLCO1B1", "TPMT",
    "DPYD", "UGT1A1", "VKORC1", "CFTR", "IFNL3", "G6PD", "HLA-B",
    "HLA-A", "CYP4F2", "NUDT15", "CACNA1S", "RYR1", "MT-RNR1",
    "CYP2B6", "CYP3A4", "ABCG2", "NAT2", "COMT"
  ];

  const geneVariants: Record<string, Variant[]> = {};

  for (const variant of variants) {
    if (pharmacogenes.includes(variant.gene)) {
      if (!geneVariants[variant.gene]) {
        geneVariants[variant.gene] = [];
      }
      geneVariants[variant.gene].push(variant);
    }
  }

  return geneVariants;
}

/**
 * Determine diplotype from variants
 */
function determineDiplotype(gene: string, variants: Variant[]): string {
  // Simplified diplotype determination
  // In real implementation, this would use star allele nomenclature
  // and complex haplotype phasing algorithms

  if (gene === "CYP2D6") {
    return determineCYP2D6Diplotype(variants);
  } else if (gene === "CYP2C19") {
    return determineCYP2C19Diplotype(variants);
  } else if (gene === "CYP2C9") {
    return determineCYP2C9Diplotype(variants);
  } else if (gene === "SLCO1B1") {
    return determineSLCO1B1Diplotype(variants);
  } else if (gene === "TPMT") {
    return determineTPMTDiplotype(variants);
  } else if (gene === "DPYD") {
    return determineDPYDDiplotype(variants);
  }

  return "*1/*1"; // Wild-type default
}

/**
 * CYP2D6 diplotype determination
 */
function determineCYP2D6Diplotype(variants: Variant[]): string {
  // Key CYP2D6 variants
  const hasNoFunctionAllele = variants.some(v =>
    v.hgvsCoding?.includes("c.506-1G>A") || // *4
    v.hgvsCoding?.includes("c.1023C>T") // *6
  );

  const hasDecreasedFunctionAllele = variants.some(v =>
    v.hgvsCoding?.includes("c.100C>T") || // *10
    v.hgvsCoding?.includes("c.1457G>C") // *41
  );

  const hasIncreasedFunctionAllele = variants.some(v =>
    v.info?.CN > 2 // Gene duplication
  );

  if (hasNoFunctionAllele && variants.length === 2) {
    return "*4/*4";
  } else if (hasNoFunctionAllele) {
    return "*1/*4";
  } else if (hasDecreasedFunctionAllele) {
    return "*1/*10";
  } else if (hasIncreasedFunctionAllele) {
    return "*1/*1xN";
  }

  return "*1/*1";
}

/**
 * CYP2C19 diplotype determination
 */
function determineCYP2C19Diplotype(variants: Variant[]): string {
  const hasNoFunctionAllele = variants.some(v =>
    v.dbSnpId === "rs4244285" || // *2
    v.dbSnpId === "rs4986893" // *3
  );

  const hasIncreasedFunctionAllele = variants.some(v =>
    v.dbSnpId === "rs12248560" // *17
  );

  if (hasNoFunctionAllele && variants.length === 2) {
    return "*2/*2";
  } else if (hasNoFunctionAllele) {
    return "*1/*2";
  } else if (hasIncreasedFunctionAllele) {
    return "*1/*17";
  }

  return "*1/*1";
}

/**
 * CYP2C9 diplotype determination
 */
function determineCYP2C9Diplotype(variants: Variant[]): string {
  const has2Allele = variants.some(v => v.dbSnpId === "rs1799853"); // *2
  const has3Allele = variants.some(v => v.dbSnpId === "rs1057910"); // *3

  if (has2Allele && has3Allele) {
    return "*2/*3";
  } else if (has2Allele) {
    return "*1/*2";
  } else if (has3Allele) {
    return "*1/*3";
  }

  return "*1/*1";
}

/**
 * SLCO1B1 diplotype determination
 */
function determineSLCO1B1Diplotype(variants: Variant[]): string {
  const has5Allele = variants.some(v => v.dbSnpId === "rs4149056"); // *5

  if (has5Allele) {
    return variants.length > 1 ? "*5/*5" : "*1/*5";
  }

  return "*1/*1";
}

/**
 * TPMT diplotype determination
 */
function determineTPMTDiplotype(variants: Variant[]): string {
  const has3AAllele = variants.some(v => v.dbSnpId === "rs1800460"); // *3A

  if (has3AAllele) {
    return variants.length > 1 ? "*3A/*3A" : "*1/*3A";
  }

  return "*1/*1";
}

/**
 * DPYD diplotype determination
 */
function determineDPYDDiplotype(variants: Variant[]): string {
  const has2AAllele = variants.some(v => v.dbSnpId === "rs3918290"); // *2A

  if (has2AAllele) {
    return variants.length > 1 ? "*2A/*2A" : "*1/*2A";
  }

  return "*1/*1";
}

/**
 * Determine phenotype from diplotype
 */
function determinePhenotype(gene: string, diplotype: string): PGxPhenotype {
  const phenotypeMap = getPhenotypeMap(gene);
  const phenotypeData = phenotypeMap[diplotype] || phenotypeMap["*1/*1"];

  return phenotypeData;
}

/**
 * Get phenotype mapping for gene
 */
function getPhenotypeMap(gene: string): Record<string, PGxPhenotype> {
  const maps: Record<string, Record<string, PGxPhenotype>> = {
    CYP2D6: {
      "*1/*1": { metabolizer: "NORMAL" as MetabolizerStatus, function: "NORMAL" as FunctionStatus, description: "Normal metabolizer" },
      "*1/*4": { metabolizer: "INTERMEDIATE" as MetabolizerStatus, function: "DECREASED" as FunctionStatus, description: "Intermediate metabolizer" },
      "*4/*4": { metabolizer: "POOR" as MetabolizerStatus, function: "NO_FUNCTION" as FunctionStatus, description: "Poor metabolizer" },
      "*1/*1xN": { metabolizer: "ULTRARAPID" as MetabolizerStatus, function: "INCREASED" as FunctionStatus, description: "Ultrarapid metabolizer" },
    },
    CYP2C19: {
      "*1/*1": { metabolizer: "NORMAL" as MetabolizerStatus, function: "NORMAL" as FunctionStatus, description: "Normal metabolizer" },
      "*1/*2": { metabolizer: "INTERMEDIATE" as MetabolizerStatus, function: "DECREASED" as FunctionStatus, description: "Intermediate metabolizer" },
      "*2/*2": { metabolizer: "POOR" as MetabolizerStatus, function: "NO_FUNCTION" as FunctionStatus, description: "Poor metabolizer" },
      "*1/*17": { metabolizer: "RAPID" as MetabolizerStatus, function: "INCREASED" as FunctionStatus, description: "Rapid metabolizer" },
    },
    CYP2C9: {
      "*1/*1": { metabolizer: "NORMAL" as MetabolizerStatus, function: "NORMAL" as FunctionStatus, description: "Normal metabolizer" },
      "*1/*2": { metabolizer: "INTERMEDIATE" as MetabolizerStatus, function: "DECREASED" as FunctionStatus, description: "Intermediate metabolizer" },
      "*1/*3": { metabolizer: "INTERMEDIATE" as MetabolizerStatus, function: "DECREASED" as FunctionStatus, description: "Intermediate metabolizer" },
    },
  };

  return maps[gene] || {
    "*1/*1": { metabolizer: "NORMAL" as MetabolizerStatus, function: "NORMAL" as FunctionStatus, description: "Normal function" },
  };
}

/**
 * Calculate activity score
 */
function calculateActivityScore(gene: string, diplotype: string): number | null {
  // Activity scores based on CPIC guidelines
  const activityScores: Record<string, Record<string, number>> = {
    CYP2D6: {
      "*1/*1": 2.0,
      "*1/*4": 1.0,
      "*4/*4": 0.0,
      "*1/*1xN": 3.0,
    },
    CYP2C19: {
      "*1/*1": 2.0,
      "*1/*2": 1.0,
      "*2/*2": 0.0,
      "*1/*17": 2.5,
    },
  };

  return activityScores[gene]?.[diplotype] || null;
}

/**
 * Get drug recommendations based on gene and phenotype
 */
function getDrugRecommendations(
  gene: string,
  phenotype: PGxPhenotype
): PGxDrugRecommendation[] {
  const recommendations: PGxDrugRecommendation[] = [];

  // CPIC drug-gene pairs
  const drugGenePairs = getDrugGenePairs();

  for (const pair of drugGenePairs) {
    if (pair.gene === gene) {
      const recommendation = generateDrugRecommendation(pair, phenotype);
      recommendations.push(recommendation);
    }
  }

  return recommendations;
}

/**
 * Get drug-gene pairs from CPIC guidelines
 */
function getDrugGenePairs(): Array<{ gene: string; drug: string; indication: string }> {
  return [
    { gene: "CYP2D6", drug: "Codeine", indication: "Pain management" },
    { gene: "CYP2D6", drug: "Tramadol", indication: "Pain management" },
    { gene: "CYP2D6", drug: "Amitriptyline", indication: "Depression" },
    { gene: "CYP2C19", drug: "Clopidogrel", indication: "Cardiovascular disease" },
    { gene: "CYP2C19", drug: "Voriconazole", indication: "Fungal infection" },
    { gene: "CYP2C9", drug: "Warfarin", indication: "Anticoagulation" },
    { gene: "CYP2C9", drug: "Phenytoin", indication: "Epilepsy" },
    { gene: "SLCO1B1", drug: "Simvastatin", indication: "Hyperlipidemia" },
    { gene: "TPMT", drug: "Azathioprine", indication: "Immunosuppression" },
    { gene: "TPMT", drug: "Mercaptopurine", indication: "Leukemia" },
    { gene: "DPYD", drug: "Fluorouracil", indication: "Cancer" },
    { gene: "DPYD", drug: "Capecitabine", indication: "Cancer" },
  ];
}

/**
 * Generate drug recommendation based on phenotype
 */
function generateDrugRecommendation(
  pair: { gene: string; drug: string; indication: string },
  phenotype: PGxPhenotype
): PGxDrugRecommendation {
  const { gene, drug } = pair;
  let recommendation: DrugRecommendation;
  let recommendationText: string;
  let strength: "STRONG" | "MODERATE" | "OPTIONAL" | "NO_RECOMMENDATION";
  let alternatives: string[] = [];
  let dosageGuidance: string | null = null;
  let monitoring: string | null = null;

  // Gene-specific recommendations
  if (gene === "CYP2D6") {
    if (phenotype.metabolizer === "POOR") {
      if (drug === "Codeine" || drug === "Tramadol") {
        recommendation = "AVOID";
        recommendationText = `Avoid ${drug}. Patient is a CYP2D6 poor metabolizer and will not adequately convert ${drug} to its active form.`;
        strength = "STRONG";
        alternatives = drug === "Codeine" ? ["Morphine", "Oxycodone", "Hydromorphone"] : ["Oxycodone", "Morphine"];
      } else {
        recommendation = "DECREASE_DOSE";
        recommendationText = `Consider 50% dose reduction and titrate to effect. Monitor for adverse effects.`;
        strength = "MODERATE";
        monitoring = "Monitor for adverse effects at regular intervals";
      }
    } else if (phenotype.metabolizer === "ULTRARAPID") {
      recommendation = "AVOID";
      recommendationText = `Avoid ${drug}. Patient is a CYP2D6 ultrarapid metabolizer at increased risk of toxicity.`;
      strength = "STRONG";
      alternatives = ["Morphine", "Oxycodone"];
    } else {
      recommendation = "USE_AS_DIRECTED";
      recommendationText = "Use standard dosing per prescribing guidelines.";
      strength = "OPTIONAL";
    }
  } else if (gene === "CYP2C19") {
    if (drug === "Clopidogrel") {
      if (phenotype.metabolizer === "POOR" || phenotype.metabolizer === "INTERMEDIATE") {
        recommendation = "USE_ALTERNATIVE";
        recommendationText = "Use alternative antiplatelet agent (e.g., prasugrel, ticagrelor) due to reduced clopidogrel efficacy.";
        strength = "STRONG";
        alternatives = ["Prasugrel", "Ticagrelor"];
      } else {
        recommendation = "USE_AS_DIRECTED";
        recommendationText = "Use standard dosing.";
        strength = "OPTIONAL";
      }
    } else {
      recommendation = "USE_AS_DIRECTED";
      recommendationText = "Use standard dosing.";
      strength = "OPTIONAL";
    }
  } else if (gene === "TPMT") {
    if (phenotype.function === "NO_FUNCTION") {
      recommendation = "AVOID";
      recommendationText = `Avoid ${drug}. Start with drastically reduced doses (reduce daily dose by 10-fold and dose 3 times per week) or use alternative agent.`;
      strength = "STRONG";
      alternatives = ["Mycophenolate", "Methotrexate"];
      monitoring = "Frequent CBC monitoring required";
    } else if (phenotype.function === "DECREASED") {
      recommendation = "DECREASE_DOSE";
      recommendationText = "Reduce starting dose by 30-70% and adjust based on tolerance.";
      strength = "STRONG";
      dosageGuidance = "Start at 30-70% of standard dose";
      monitoring = "Weekly CBC for first month, then biweekly";
    } else {
      recommendation = "USE_AS_DIRECTED";
      recommendationText = "Use standard dosing with routine monitoring.";
      strength = "MODERATE";
      monitoring = "Standard CBC monitoring per guidelines";
    }
  } else {
    recommendation = "USE_AS_DIRECTED";
    recommendationText = "Use standard dosing per prescribing guidelines.";
    strength = "OPTIONAL";
  }

  return {
    drug,
    rxnormCode: null,
    atcCode: null,
    recommendation,
    recommendationText,
    strength,
    alternatives,
    dosageGuidance,
    monitoring,
  };
}

/**
 * Generate recommendation summary text
 */
function generateRecommendationText(
  gene: string,
  phenotype: PGxPhenotype,
  drugs: PGxDrugRecommendation[]
): string {
  const highPriority = drugs.filter(d => d.strength === "STRONG");

  let text = `Patient has ${gene} ${phenotype.description.toLowerCase()} phenotype. `;

  if (highPriority.length > 0) {
    text += `Strong recommendations apply for: ${highPriority.map(d => d.drug).join(", ")}. `;
  }

  text += "See detailed drug recommendations for specific guidance.";

  return text;
}

/**
 * Generate alternatives text
 */
function generateAlternatives(
  gene: string,
  drugs: PGxDrugRecommendation[]
): string | null {
  const withAlternatives = drugs.filter(d => d.alternatives.length > 0);

  if (withAlternatives.length === 0) {
    return null;
  }

  return withAlternatives
    .map(d => `${d.drug}: Consider ${d.alternatives.join(", ")}`)
    .join("; ");
}

/**
 * Get monitoring guidance
 */
function getMonitoringGuidance(gene: string, phenotype: PGxPhenotype): string | null {
  if (gene === "TPMT" && phenotype.function !== "NORMAL") {
    return "Frequent complete blood count monitoring required";
  }

  if (gene === "CYP2C9") {
    return "INR monitoring if on warfarin";
  }

  return null;
}

/**
 * Get evidence level for gene
 */
function getEvidenceLevel(gene: string): PGxEvidence {
  const evidenceLevels: Record<string, PGxEvidence> = {
    CYP2D6: {
      level: "LEVEL_1A" as EvidenceLevel,
      source: ["CPIC", "PharmGKB"],
      studies: 50,
      quality: "HIGH",
    },
    CYP2C19: {
      level: "LEVEL_1A" as EvidenceLevel,
      source: ["CPIC", "PharmGKB"],
      studies: 45,
      quality: "HIGH",
    },
    TPMT: {
      level: "LEVEL_1A" as EvidenceLevel,
      source: ["CPIC", "PharmGKB"],
      studies: 40,
      quality: "HIGH",
    },
  };

  return evidenceLevels[gene] || {
    level: "LEVEL_3" as EvidenceLevel,
    source: ["PharmGKB"],
    studies: null,
    quality: "MODERATE",
  };
}

export default {
  generatePGxRecommendations,
};
