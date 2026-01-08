/**
 * Precision Medicine Engine
 * Integrates genomic data to provide personalized treatment recommendations
 */

import type {
  PrecisionMedicineProfile,
  PrecisionMedicineRecommendation,
  ClinicalTrialMatch,
  TargetedTherapy,
  Biomarker,
  GenomicData,
  Variant,
  PGxRecommendation,
  RecommendationType,
} from "@/types/genomics";

/**
 * Generate precision medicine profile for patient
 */
export async function generatePrecisionMedicineProfile(
  patientId: string,
  genomicTests: GenomicData[]
): Promise<PrecisionMedicineProfile> {
  const allVariants = genomicTests.flatMap((test) => test.variants);
  const allPgxRecommendations = genomicTests.flatMap(
    (test) => test.pgxRecommendations
  );
  const allRiskAssessments = genomicTests.flatMap(
    (test) => test.riskAssessments
  );

  const genomicDataSummary = {
    totalVariants: allVariants.length,
    pathogenicVariants: allVariants.filter(
      (v) => v.interpretation?.classification === "PATHOGENIC"
    ).length,
    likelyPathogenicVariants: allVariants.filter(
      (v) => v.interpretation?.classification === "LIKELY_PATHOGENIC"
    ).length,
    vusVariants: allVariants.filter(
      (v) => v.interpretation?.classification === "UNCERTAIN_SIGNIFICANCE"
    ).length,
    actionableVariants: allVariants.filter(
      (v) =>
        v.interpretation?.classification === "PATHOGENIC" ||
        v.interpretation?.classification === "LIKELY_PATHOGENIC" ||
        v.interpretation?.clinicalSignificance === "DRUG_RESPONSE"
    ).length,
    incidentalFindings: 0, // Would be calculated from ACMG SF list
    lastTestDate:
      genomicTests.length > 0
        ? genomicTests[genomicTests.length - 1].performedDate
        : null,
  };

  const pgxProfile = {
    genes: allPgxRecommendations.map((pgx) => ({
      gene: pgx.gene,
      diplotype: pgx.diplotype,
      phenotype: pgx.phenotype.description,
      affectedDrugClasses: pgx.drugs.map((d) => d.drug),
    })),
    drugInteractions: allPgxRecommendations.reduce(
      (sum, pgx) => sum + pgx.drugs.length,
      0
    ),
    activeAlerts: allPgxRecommendations.filter(
      (pgx) => pgx.drugs.some((d) => d.recommendation !== "USE_AS_DIRECTED")
    ).length,
    lastUpdated: new Date(),
  };

  const recommendations = await generateRecommendations(
    patientId,
    allVariants,
    allPgxRecommendations,
    allRiskAssessments
  );

  const clinicalTrials = await findMatchingClinicalTrials(
    allVariants,
    allRiskAssessments
  );

  const targetedTherapies = await identifyTargetedTherapies(allVariants);

  const biomarkers = await extractBiomarkers(allVariants);

  const profile: PrecisionMedicineProfile = {
    id: crypto.randomUUID(),
    organizationId: "",
    patientId,
    genomicData: genomicDataSummary,
    pgxProfile,
    diseaseRisks: allRiskAssessments.map((risk) => ({
      condition: risk.condition,
      riskLevel: risk.riskCategory,
      riskScore: risk.relativeRisk,
      requiresAction:
        risk.riskCategory === "HIGH" || risk.riskCategory === "VERY_HIGH",
    })),
    activeRecommendations: recommendations.filter(
      (r) => r.status === "PENDING" || r.status === "IN_PROGRESS"
    ),
    clinicalTrials,
    targetedTherapies,
    biomarkers,
    lastUpdated: new Date(),
    updatedBy: "Precision Medicine Engine",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return profile;
}

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(
  patientId: string,
  variants: Variant[],
  pgxRecommendations: PGxRecommendation[],
  riskAssessments: any[]
): Promise<PrecisionMedicineRecommendation[]> {
  const recommendations: PrecisionMedicineRecommendation[] = [];

  // PGx-based medication recommendations
  for (const pgx of pgxRecommendations) {
    for (const drug of pgx.drugs) {
      if (drug.recommendation !== "USE_AS_DIRECTED") {
        recommendations.push({
          id: crypto.randomUUID(),
          organizationId: "",
          patientId,
          type: "MEDICATION_CHANGE" as RecommendationType,
          priority: drug.strength === "STRONG" ? "HIGH" : "MEDIUM",
          title: `${drug.drug} - ${drug.recommendation.replace(/_/g, " ")}`,
          description: drug.recommendationText,
          rationale: `Patient is ${pgx.phenotype.description.toLowerCase()} for ${pgx.gene}`,
          evidence: `CPIC Level ${pgx.evidence.level}`,
          actionItems: [
            {
              description: "Review current medications",
              completed: false,
              completedDate: null,
            },
            {
              description:
                drug.recommendation === "USE_ALTERNATIVE"
                  ? `Consider alternative: ${drug.alternatives.join(", ")}`
                  : "Adjust dosing per recommendation",
              completed: false,
              completedDate: null,
            },
          ],
          targetDate: null,
          status: "PENDING",
          assignedTo: null,
          completedDate: null,
          outcome: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          createdBy: "system",
          updatedBy: "system",
        });
      }
    }
  }

  // Risk-based screening recommendations
  for (const risk of riskAssessments) {
    if (risk.riskCategory === "HIGH" || risk.riskCategory === "VERY_HIGH") {
      recommendations.push({
        id: crypto.randomUUID(),
        organizationId: "",
        patientId,
        type: "SCREENING" as RecommendationType,
        priority: "HIGH",
        title: `Enhanced screening for ${risk.condition}`,
        description: risk.screeningGuidelines || "Enhanced surveillance recommended",
        rationale: risk.interpretation,
        evidence: `Lifetime risk: ${((risk.lifetimeRisk || 0) * 100).toFixed(1)}%`,
        actionItems: [
          {
            description: "Schedule screening appointment",
            completed: false,
            completedDate: null,
          },
          {
            description: "Discuss with specialist",
            completed: false,
            completedDate: null,
          },
        ],
        targetDate: null,
        status: "PENDING",
        assignedTo: null,
        completedDate: null,
        outcome: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: "system",
        updatedBy: "system",
      });
    }
  }

  // Cascade testing recommendations
  const pathogenicVariants = variants.filter(
    (v) =>
      v.interpretation?.classification === "PATHOGENIC" ||
      v.interpretation?.classification === "LIKELY_PATHOGENIC"
  );

  if (pathogenicVariants.length > 0) {
    recommendations.push({
      id: crypto.randomUUID(),
      organizationId: "",
      patientId,
      type: "CASCADE_TESTING" as RecommendationType,
      priority: "MEDIUM",
      title: "Cascade testing for at-risk family members",
      description:
        "Consider genetic testing for first-degree relatives due to pathogenic variant(s) identified",
      rationale: `${pathogenicVariants.length} pathogenic variant(s) identified in: ${[...new Set(pathogenicVariants.map((v) => v.gene))].join(", ")}`,
      evidence: "ACMG/NSGC guidelines for cascade testing",
      actionItems: [
        {
          description: "Identify at-risk family members",
          completed: false,
          completedDate: null,
        },
        {
          description: "Provide genetic counseling information",
          completed: false,
          completedDate: null,
        },
      ],
      targetDate: null,
      status: "PENDING",
      assignedTo: null,
      completedDate: null,
      outcome: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "system",
      updatedBy: "system",
    });
  }

  return recommendations;
}

/**
 * Find matching clinical trials
 */
async function findMatchingClinicalTrials(
  variants: Variant[],
  riskAssessments: any[]
): Promise<ClinicalTrialMatch[]> {
  const trials: ClinicalTrialMatch[] = [];

  // Match based on pathogenic variants
  const pathogenicVariants = variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  );

  for (const variant of pathogenicVariants) {
    // Simplified trial matching - in reality would query ClinicalTrials.gov API
    if (variant.gene === "BRCA1" || variant.gene === "BRCA2") {
      trials.push({
        trialId: "NCT12345678",
        title: "PARP Inhibitor Study for BRCA-mutated Cancers",
        phase: "Phase III",
        status: "Recruiting",
        sponsor: "Example Pharma",
        condition: "Breast Cancer, Ovarian Cancer",
        intervention: "Olaparib",
        eligibilityCriteria: "BRCA1/2 pathogenic variant, stage II-IV disease",
        matchReason: `Patient has ${variant.gene} pathogenic variant`,
        matchScore: 0.9,
        locations: ["Multiple US locations"],
        contactInfo: "trials@example.com",
        url: "https://clinicaltrials.gov/ct2/show/NCT12345678",
      });
    }
  }

  return trials;
}

/**
 * Identify targeted therapies
 */
async function identifyTargetedTherapies(
  variants: Variant[]
): Promise<TargetedTherapy[]> {
  const therapies: TargetedTherapy[] = [];

  for (const variant of variants) {
    // Oncology-specific targeted therapies
    if (variant.gene === "EGFR") {
      therapies.push({
        drug: "Osimertinib",
        drugClass: "EGFR Tyrosine Kinase Inhibitor",
        target: "EGFR",
        indication: "Non-small cell lung cancer with EGFR mutations",
        biomarkerRequired: "EGFR mutation",
        biomarkerStatus: "POSITIVE",
        evidence: "FDA approved, NCCN Category 1",
        fdaApproved: true,
        guidelineRecommended: true,
      });
    }

    if (variant.gene === "HER2") {
      therapies.push({
        drug: "Trastuzumab",
        drugClass: "HER2-targeted monoclonal antibody",
        target: "HER2",
        indication: "HER2-positive breast cancer",
        biomarkerRequired: "HER2 amplification",
        biomarkerStatus: "POSITIVE",
        evidence: "FDA approved, NCCN Category 1",
        fdaApproved: true,
        guidelineRecommended: true,
      });
    }

    if (variant.gene === "BRAF") {
      therapies.push({
        drug: "Vemurafenib + Cobimetinib",
        drugClass: "BRAF/MEK inhibitor combination",
        target: "BRAF V600E",
        indication: "Melanoma with BRAF V600E mutation",
        biomarkerRequired: "BRAF V600E mutation",
        biomarkerStatus: "POSITIVE",
        evidence: "FDA approved, NCCN Category 1",
        fdaApproved: true,
        guidelineRecommended: true,
      });
    }
  }

  return therapies;
}

/**
 * Extract biomarkers from variants
 */
async function extractBiomarkers(variants: Variant[]): Promise<Biomarker[]> {
  const biomarkers: Biomarker[] = [];

  for (const variant of variants) {
    if (
      variant.interpretation?.classification === "PATHOGENIC" ||
      variant.interpretation?.classification === "LIKELY_PATHOGENIC"
    ) {
      biomarkers.push({
        name: `${variant.gene} ${variant.hgvsProtein || "variant"}`,
        type: "GENETIC",
        value: variant.alternateAllele,
        unit: null,
        status: "POSITIVE",
        clinicalSignificance:
          variant.interpretation?.clinicalSignificance || "PATHOGENIC",
        testDate: new Date(),
        testMethod: "Next-generation sequencing",
      });
    }
  }

  return biomarkers;
}

/**
 * Generate treatment optimization recommendations
 */
export async function optimizeTreatment(
  currentMedications: string[],
  pgxRecommendations: PGxRecommendation[]
): Promise<{
  optimized: boolean;
  changes: Array<{
    medication: string;
    issue: string;
    recommendation: string;
    alternative?: string;
  }>;
}> {
  const changes: Array<{
    medication: string;
    issue: string;
    recommendation: string;
    alternative?: string;
  }> = [];

  for (const medication of currentMedications) {
    for (const pgx of pgxRecommendations) {
      const drugRec = pgx.drugs.find((d) =>
        medication.toLowerCase().includes(d.drug.toLowerCase())
      );

      if (drugRec && drugRec.recommendation !== "USE_AS_DIRECTED") {
        changes.push({
          medication,
          issue: `Patient is ${pgx.phenotype.description.toLowerCase()} for ${pgx.gene}`,
          recommendation: drugRec.recommendationText,
          alternative: drugRec.alternatives.length > 0 ? drugRec.alternatives[0] : undefined,
        });
      }
    }
  }

  return {
    optimized: changes.length === 0,
    changes,
  };
}

/**
 * Calculate precision medicine score
 */
export function calculatePrecisionMedicineScore(
  profile: PrecisionMedicineProfile
): {
  score: number;
  category: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Actionable variants
  if (profile.genomicData.actionableVariants > 0) {
    score += profile.genomicData.actionableVariants * 10;
    factors.push(
      `${profile.genomicData.actionableVariants} actionable variant(s)`
    );
  }

  // PGx alerts
  if (profile.pgxProfile.activeAlerts > 0) {
    score += profile.pgxProfile.activeAlerts * 5;
    factors.push(`${profile.pgxProfile.activeAlerts} PGx alert(s)`);
  }

  // High-risk conditions
  const highRiskConditions = profile.diseaseRisks.filter(
    (r) => r.riskLevel === "HIGH" || r.riskLevel === "VERY_HIGH"
  );
  if (highRiskConditions.length > 0) {
    score += highRiskConditions.length * 15;
    factors.push(`${highRiskConditions.length} high-risk condition(s)`);
  }

  // Targeted therapies available
  if (profile.targetedTherapies.length > 0) {
    score += profile.targetedTherapies.length * 8;
    factors.push(
      `${profile.targetedTherapies.length} targeted therapy option(s)`
    );
  }

  // Clinical trial matches
  if (profile.clinicalTrials.length > 0) {
    score += profile.clinicalTrials.length * 6;
    factors.push(`${profile.clinicalTrials.length} clinical trial match(es)`);
  }

  let category: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  if (score >= 50) {
    category = "VERY_HIGH";
  } else if (score >= 30) {
    category = "HIGH";
  } else if (score >= 15) {
    category = "MODERATE";
  } else {
    category = "LOW";
  }

  return {
    score,
    category,
    factors,
  };
}

export default {
  generatePrecisionMedicineProfile,
  optimizeTreatment,
  calculatePrecisionMedicineScore,
};
