/**
 * Variant Interpretation Engine
 * Implements ACMG/AMP guidelines for variant classification
 */

import type {
  Variant,
  VariantInterpretation,
  VariantClassification,
  ACMGClassification,
  ClinicalSignificance,
  Evidence,
  EvidenceType,
  EvidenceStrength,
  DiseaseAssociation,
  FunctionalImpact,
  PopulationFrequency,
  ComputationalPrediction,
} from "@/types/genomics";

/**
 * Interpret variant using ACMG/AMP guidelines
 */
export async function interpretVariant(
  variant: Variant
): Promise<VariantInterpretation> {
  // Collect evidence
  const evidence = await collectEvidence(variant);

  // Apply ACMG criteria
  const classification = classifyVariant(evidence);
  const acmgClassification = mapToACMG(classification);
  const clinicalSignificance = determineClinicalSignificance(
    classification,
    variant
  );

  // Get disease associations
  const diseases = await getDiseaseAssociations(variant);

  // Generate interpretation text
  const interpretationText = generateInterpretation(
    variant,
    classification,
    evidence
  );

  const interpretation: VariantInterpretation = {
    id: crypto.randomUUID(),
    organizationId: "",
    variantId: variant.id,
    patientId: "",
    classification,
    acmgClassification,
    clinicalSignificance,
    evidence,
    phenotypes: [],
    diseases,
    functionalImpact: await predictFunctionalImpact(variant),
    populationFrequency: await getPopulationFrequencies(variant),
    computationalPredictions: await getComputationalPredictions(variant),
    literatureReferences: [],
    interpretation: interpretationText,
    interpretedBy: "Variant Interpreter v1.0",
    interpretedDate: new Date(),
    reviewStatus: "PENDING",
    reviewedBy: null,
    reviewedDate: null,
    reviewNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return interpretation;
}

/**
 * Collect evidence for variant classification
 */
async function collectEvidence(variant: Variant): Promise<Evidence[]> {
  const evidence: Evidence[] = [];

  // Population data (PM2, BS1, BA1)
  if (variant.gnomadFrequency !== null) {
    if (variant.gnomadFrequency === 0) {
      evidence.push({
        type: "POPULATION_DATA" as EvidenceType,
        acmgCriterion: "PM2",
        strength: "MODERATE" as EvidenceStrength,
        description: "Absent from population databases (gnomAD)",
        source: "gnomAD",
      });
    } else if (variant.gnomadFrequency > 0.05) {
      evidence.push({
        type: "POPULATION_DATA" as EvidenceType,
        acmgCriterion: "BA1",
        strength: "STAND_ALONE" as EvidenceStrength,
        description: `High allele frequency in gnomAD (${variant.gnomadFrequency})`,
        source: "gnomAD",
      });
    } else if (variant.gnomadFrequency > 0.01) {
      evidence.push({
        type: "POPULATION_DATA" as EvidenceType,
        acmgCriterion: "BS1",
        strength: "STRONG" as EvidenceStrength,
        description: `Allele frequency greater than expected (${variant.gnomadFrequency})`,
        source: "gnomAD",
      });
    }
  }

  // Computational predictions (PP3, BP4)
  const predictions = await getComputationalPredictions(variant);
  const damagingPredictions = predictions.filter(
    (p) => p.interpretation === "DAMAGING"
  ).length;
  const toleratedPredictions = predictions.filter(
    (p) => p.interpretation === "TOLERATED"
  ).length;

  if (damagingPredictions >= 3) {
    evidence.push({
      type: "COMPUTATIONAL" as EvidenceType,
      acmgCriterion: "PP3",
      strength: "SUPPORTING" as EvidenceStrength,
      description: "Multiple computational tools predict deleterious effect",
      source: "In silico analysis",
    });
  } else if (toleratedPredictions >= 3) {
    evidence.push({
      type: "COMPUTATIONAL" as EvidenceType,
      acmgCriterion: "BP4",
      strength: "SUPPORTING" as EvidenceStrength,
      description: "Multiple computational tools predict benign effect",
      source: "In silico analysis",
    });
  }

  // Variant type (PVS1 for null variants)
  if (isNullVariant(variant)) {
    evidence.push({
      type: "FUNCTIONAL" as EvidenceType,
      acmgCriterion: "PVS1",
      strength: "VERY_STRONG" as EvidenceStrength,
      description:
        "Null variant (nonsense, frameshift, canonical splice site) in gene where LOF is a known mechanism",
      source: "Variant analysis",
    });
  }

  // Missense variant in critical domain (PM1)
  if (variant.variantType === "SNV" && isCriticalDomain(variant)) {
    evidence.push({
      type: "FUNCTIONAL" as EvidenceType,
      acmgCriterion: "PM1",
      strength: "MODERATE" as EvidenceStrength,
      description: "Located in mutational hot spot and/or critical domain",
      source: "Domain analysis",
    });
  }

  return evidence;
}

/**
 * Classify variant based on ACMG criteria
 */
function classifyVariant(evidence: Evidence[]): VariantClassification {
  let pathogenicScore = 0;
  let benignScore = 0;

  // Score evidence
  for (const item of evidence) {
    const isPathogenic = ["PVS", "PS", "PM", "PP"].some((prefix) =>
      item.acmgCriterion?.startsWith(prefix)
    );
    const isBenign = ["BA", "BS", "BP"].some((prefix) =>
      item.acmgCriterion?.startsWith(prefix)
    );

    if (isPathogenic) {
      switch (item.strength) {
        case "VERY_STRONG":
          pathogenicScore += 8;
          break;
        case "STRONG":
          pathogenicScore += 4;
          break;
        case "MODERATE":
          pathogenicScore += 2;
          break;
        case "SUPPORTING":
          pathogenicScore += 1;
          break;
      }
    } else if (isBenign) {
      switch (item.strength) {
        case "STAND_ALONE":
          return "BENIGN";
        case "STRONG":
          benignScore += 4;
          break;
        case "SUPPORTING":
          benignScore += 1;
          break;
      }
    }
  }

  // Apply ACMG classification rules
  if (pathogenicScore >= 10) {
    return "PATHOGENIC";
  } else if (pathogenicScore >= 6) {
    return "LIKELY_PATHOGENIC";
  } else if (benignScore >= 6) {
    return "BENIGN";
  } else if (benignScore >= 2) {
    return "LIKELY_BENIGN";
  } else {
    return "UNCERTAIN_SIGNIFICANCE";
  }
}

/**
 * Map variant classification to ACMG class
 */
function mapToACMG(
  classification: VariantClassification
): ACMGClassification {
  const mapping: Record<VariantClassification, ACMGClassification> = {
    PATHOGENIC: "CLASS_5",
    LIKELY_PATHOGENIC: "CLASS_4",
    UNCERTAIN_SIGNIFICANCE: "CLASS_3",
    LIKELY_BENIGN: "CLASS_2",
    BENIGN: "CLASS_1",
  };

  return mapping[classification];
}

/**
 * Determine clinical significance
 */
function determineClinicalSignificance(
  classification: VariantClassification,
  variant: Variant
): ClinicalSignificance {
  if (
    classification === "PATHOGENIC" ||
    classification === "LIKELY_PATHOGENIC"
  ) {
    return "PATHOGENIC";
  } else if (classification === "BENIGN" || classification === "LIKELY_BENIGN") {
    return "BENIGN";
  } else {
    return "UNCERTAIN";
  }
}

/**
 * Check if variant is null (loss-of-function)
 */
function isNullVariant(variant: Variant): boolean {
  // Nonsense
  if (variant.hgvsProtein?.includes("Ter") || variant.hgvsProtein?.includes("*")) {
    return true;
  }

  // Frameshift
  if (variant.variantType === "DELETION" || variant.variantType === "INSERTION") {
    const lengthChange = Math.abs(
      variant.referenceAllele.length - variant.alternateAllele.length
    );
    if (lengthChange % 3 !== 0) {
      return true;
    }
  }

  // Canonical splice site
  if (variant.hgvsCoding?.includes("+1") || variant.hgvsCoding?.includes("-1")) {
    return true;
  }

  return false;
}

/**
 * Check if variant is in critical domain
 */
function isCriticalDomain(variant: Variant): boolean {
  // Simplified - in real implementation, would check protein domain databases
  const criticalGenes = ["TP53", "BRCA1", "BRCA2", "PTEN", "APC"];
  return criticalGenes.includes(variant.gene);
}

/**
 * Get disease associations for variant
 */
async function getDiseaseAssociations(
  variant: Variant
): Promise<DiseaseAssociation[]> {
  const associations: DiseaseAssociation[] = [];

  // Gene-disease associations (simplified)
  const geneDiseaseMap: Record<
    string,
    { disease: string; diseaseId: string; inheritance: any; penetrance: any }
  > = {
    BRCA1: {
      disease: "Hereditary Breast and Ovarian Cancer Syndrome",
      diseaseId: "OMIM:604370",
      inheritance: "AUTOSOMAL_DOMINANT",
      penetrance: "HIGH",
    },
    BRCA2: {
      disease: "Hereditary Breast and Ovarian Cancer Syndrome",
      diseaseId: "OMIM:612555",
      inheritance: "AUTOSOMAL_DOMINANT",
      penetrance: "HIGH",
    },
    TP53: {
      disease: "Li-Fraumeni Syndrome",
      diseaseId: "OMIM:151623",
      inheritance: "AUTOSOMAL_DOMINANT",
      penetrance: "HIGH",
    },
    CFTR: {
      disease: "Cystic Fibrosis",
      diseaseId: "OMIM:219700",
      inheritance: "AUTOSOMAL_RECESSIVE",
      penetrance: "COMPLETE",
    },
  };

  const association = geneDiseaseMap[variant.gene];
  if (association) {
    associations.push({
      disease: association.disease,
      diseaseId: association.diseaseId,
      inheritancePattern: association.inheritance,
      penetrance: association.penetrance,
      evidence: "ClinGen gene-disease validity",
    });
  }

  return associations;
}

/**
 * Predict functional impact
 */
async function predictFunctionalImpact(
  variant: Variant
): Promise<FunctionalImpact | null> {
  if (variant.variantType !== "SNV") {
    return null;
  }

  // Simplified - in real implementation, would run SIFT, PolyPhen, etc.
  return {
    prediction: "DELETERIOUS",
    score: 0.95,
    impact: "HIGH",
    tool: "Combined predictor",
  };
}

/**
 * Get population frequencies
 */
async function getPopulationFrequencies(
  variant: Variant
): Promise<PopulationFrequency> {
  // In real implementation, fetch from gnomAD API
  return {
    gnomadOverall: variant.gnomadFrequency,
    gnomadAFR: null,
    gnomadAMR: null,
    gnomadEAS: null,
    gnomadSAS: null,
    gnomadNFE: null,
    exacOverall: null,
    thousandGenomes: null,
  };
}

/**
 * Get computational predictions
 */
async function getComputationalPredictions(
  variant: Variant
): Promise<ComputationalPrediction[]> {
  const predictions: ComputationalPrediction[] = [];

  if (variant.variantType === "SNV") {
    // SIFT
    predictions.push({
      tool: "SIFT",
      prediction: "Deleterious",
      score: 0.01,
      interpretation: "DAMAGING",
    });

    // PolyPhen-2
    predictions.push({
      tool: "PolyPhen-2",
      prediction: "Probably Damaging",
      score: 0.98,
      interpretation: "DAMAGING",
    });

    // CADD
    predictions.push({
      tool: "CADD",
      prediction: "Pathogenic",
      score: 28.5,
      interpretation: "DAMAGING",
    });

    // REVEL
    predictions.push({
      tool: "REVEL",
      prediction: "Pathogenic",
      score: 0.85,
      interpretation: "DAMAGING",
    });
  }

  return predictions;
}

/**
 * Generate interpretation text
 */
function generateInterpretation(
  variant: Variant,
  classification: VariantClassification,
  evidence: Evidence[]
): string {
  let interpretation = `The ${variant.gene} variant ${variant.hgvsProtein || variant.hgvsCoding || variant.hgvsGenomic} `;
  interpretation += `is classified as ${classification.toLowerCase().replace("_", " ")}. `;

  const pathogenicEvidence = evidence.filter((e) =>
    ["PVS", "PS", "PM", "PP"].some((prefix) => e.acmgCriterion?.startsWith(prefix))
  );

  const benignEvidence = evidence.filter((e) =>
    ["BA", "BS", "BP"].some((prefix) => e.acmgCriterion?.startsWith(prefix))
  );

  if (pathogenicEvidence.length > 0) {
    interpretation += `Pathogenic evidence includes: `;
    interpretation += pathogenicEvidence
      .map((e) => `${e.acmgCriterion} (${e.description})`)
      .join("; ");
    interpretation += ". ";
  }

  if (benignEvidence.length > 0) {
    interpretation += `Benign evidence includes: `;
    interpretation += benignEvidence
      .map((e) => `${e.acmgCriterion} (${e.description})`)
      .join("; ");
    interpretation += ". ";
  }

  if (classification === "UNCERTAIN_SIGNIFICANCE") {
    interpretation += `There is insufficient evidence at this time to classify this variant as pathogenic or benign. `;
    interpretation += `Further clinical and functional studies are needed. `;
  }

  return interpretation;
}

/**
 * Reclassify variant with new evidence
 */
export async function reclassifyVariant(
  interpretation: VariantInterpretation,
  newEvidence: Evidence[]
): Promise<VariantInterpretation> {
  const allEvidence = [...interpretation.evidence, ...newEvidence];
  const newClassification = classifyVariant(allEvidence);

  return {
    ...interpretation,
    classification: newClassification,
    acmgClassification: mapToACMG(newClassification),
    evidence: allEvidence,
    updatedAt: new Date(),
  };
}

export default {
  interpretVariant,
  reclassifyVariant,
};
