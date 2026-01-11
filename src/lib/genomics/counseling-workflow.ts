/**
 * Genetic Counseling Workflow Engine
 * Manages genetic counseling sessions, consent, and patient education
 */

import type {
  GeneticCounselingSession,
  CounselingType,
  PreTestCounseling,
  PostTestCounseling,
  CounselingReferral,
  CounselingStatus,
  GenomicData,
  VariantInterpretation,
} from "@/types/genomics";

/**
 * Create pre-test counseling session
 */
export function createPreTestCounseling(
  patientId: string,
  counselorId: string,
  indication: string
): GeneticCounselingSession {
  const preTestData: PreTestCounseling = {
    familyHistoryReviewed: false,
    testOptionsDiscussed: [],
    testRecommendation: "",
    riskBenefitDiscussion: "",
    limitationsDiscussed: false,
    costDiscussed: false,
    insuranceCoverageReviewed: false,
    psychologicalImpactDiscussed: false,
    discriminationRisksDiscussed: false,
  };

  const session: GeneticCounselingSession = {
    id: crypto.randomUUID(),
    organizationId: "",
    patientId,
    counselorId,
    sessionType: "PRE_TEST" as CounselingType,
    sessionDate: new Date(),
    duration: 60,
    indication,
    preTestCounseling: preTestData,
    postTestCounseling: null,
    riskAssessment: null,
    educationProvided: [],
    materialsProvided: [],
    informedConsentObtained: false,
    consentFormUrl: null,
    patientQuestions: null,
    patientConcerns: null,
    psychosocialAssessment: null,
    referrals: [],
    followUpPlan: null,
    nextSessionDate: null,
    sessionNotes: "",
    status: "COMPLETED" as CounselingStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: counselorId,
    updatedBy: counselorId,
  };

  return session;
}

/**
 * Create post-test counseling session
 */
export function createPostTestCounseling(
  patientId: string,
  counselorId: string,
  genomicData: GenomicData
): GeneticCounselingSession {
  const hasPathogenicVariants = genomicData.variants.some(
    (v) =>
      v.interpretation?.classification === "PATHOGENIC" ||
      v.interpretation?.classification === "LIKELY_PATHOGENIC"
  );

  const postTestData: PostTestCounseling = {
    resultsExplained: false,
    clinicalSignificanceDiscussed: false,
    medicalManagementOptions: [],
    screeningRecommendations: null,
    familyImplications: null,
    cascadeTestingRecommended: hasPathogenicVariants,
    psychologicalSupport: null,
    patientUnderstanding: "GOOD",
  };

  const session: GeneticCounselingSession = {
    id: crypto.randomUUID(),
    organizationId: "",
    patientId,
    counselorId,
    sessionType: "POST_TEST" as CounselingType,
    sessionDate: new Date(),
    duration: 60,
    indication: "Results disclosure",
    preTestCounseling: null,
    postTestCounseling: postTestData,
    riskAssessment: null,
    educationProvided: [],
    materialsProvided: [],
    informedConsentObtained: true, // Already obtained in pre-test
    consentFormUrl: null,
    patientQuestions: null,
    patientConcerns: null,
    psychosocialAssessment: null,
    referrals: [],
    followUpPlan: null,
    nextSessionDate: null,
    sessionNotes: "",
    status: "COMPLETED" as CounselingStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: counselorId,
    updatedBy: counselorId,
  };

  return session;
}

/**
 * Generate counseling talking points based on test results
 */
export function generateTalkingPoints(
  genomicData: GenomicData
): {
  keyFindings: string[];
  discussionPoints: string[];
  patientEducation: string[];
  nextSteps: string[];
} {
  const keyFindings: string[] = [];
  const discussionPoints: string[] = [];
  const patientEducation: string[] = [];
  const nextSteps: string[] = [];

  const pathogenicVariants = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  );

  const likelyPathogenicVariants = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "LIKELY_PATHOGENIC"
  );

  const vusVariants = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "UNCERTAIN_SIGNIFICANCE"
  );

  // Key findings
  if (pathogenicVariants.length > 0) {
    keyFindings.push(
      `${pathogenicVariants.length} pathogenic variant(s) identified`
    );
    for (const variant of pathogenicVariants) {
      keyFindings.push(`${variant.gene}: ${variant.hgvsProtein || variant.hgvsCoding}`);
    }
  }

  if (likelyPathogenicVariants.length > 0) {
    keyFindings.push(
      `${likelyPathogenicVariants.length} likely pathogenic variant(s) identified`
    );
  }

  if (vusVariants.length > 0) {
    keyFindings.push(
      `${vusVariants.length} variant(s) of uncertain significance identified`
    );
  }

  // Discussion points
  if (pathogenicVariants.length > 0) {
    discussionPoints.push("Explain pathogenic variant findings and disease associations");
    discussionPoints.push("Discuss inheritance pattern and recurrence risk");
    discussionPoints.push("Review penetrance and expressivity");
    discussionPoints.push("Explain surveillance and management recommendations");
  }

  if (vusVariants.length > 0) {
    discussionPoints.push("Explain meaning of VUS and current limitations in interpretation");
    discussionPoints.push("Discuss possibility of reclassification in the future");
    discussionPoints.push("VUS should not be used for clinical decision-making");
  }

  discussionPoints.push("Address emotional and psychological impact");
  discussionPoints.push("Discuss implications for family members");

  // Patient education
  patientEducation.push("Genetics basics and inheritance patterns");
  patientEducation.push("Understanding test results and limitations");

  if (pathogenicVariants.length > 0) {
    patientEducation.push("Disease-specific information and resources");
    patientEducation.push("Support groups and advocacy organizations");
  }

  patientEducation.push("Genetic discrimination laws (GINA, ADA)");
  patientEducation.push("Life insurance considerations");

  // Next steps
  if (pathogenicVariants.length > 0) {
    nextSteps.push("Referral to appropriate specialist(s)");
    nextSteps.push("Develop surveillance and screening plan");
    nextSteps.push("Consider cascade testing for at-risk relatives");
    nextSteps.push("Update medical records and alert providers");
  }

  if (genomicData.pgxRecommendations.length > 0) {
    nextSteps.push("Review medication list with prescribing physician");
    nextSteps.push("Share PGx results with pharmacy");
  }

  nextSteps.push("Schedule follow-up counseling session");
  nextSteps.push("Provide written summary of results");

  return {
    keyFindings,
    discussionPoints,
    patientEducation,
    nextSteps,
  };
}

/**
 * Assess patient understanding and psychosocial needs
 */
export function assessPatientNeeds(
  sessionNotes: string,
  patientQuestions: string | null,
  patientConcerns: string | null
): {
  understandingLevel: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  psychosocialNeeds: string[];
  recommendedInterventions: string[];
} {
  // Simplified assessment - in reality would use standardized tools

  const psychosocialNeeds: string[] = [];
  const recommendedInterventions: string[] = [];

  // Analyze concerns
  if (patientConcerns) {
    const concerns = patientConcerns.toLowerCase();

    if (concerns.includes("anxiet") || concerns.includes("worr")) {
      psychosocialNeeds.push("Anxiety about results");
      recommendedInterventions.push("Referral to mental health counselor");
    }

    if (concerns.includes("family") || concerns.includes("children")) {
      psychosocialNeeds.push("Concerns about family implications");
      recommendedInterventions.push("Family counseling session");
    }

    if (concerns.includes("insuranc") || concerns.includes("discrimination")) {
      psychosocialNeeds.push("Concerns about discrimination");
      recommendedInterventions.push("Education about GINA and legal protections");
    }

    if (concerns.includes("guilt")) {
      psychosocialNeeds.push("Guilt about passing variant to children");
      recommendedInterventions.push("Psychological counseling");
    }
  }

  // Default interventions
  if (psychosocialNeeds.length === 0) {
    recommendedInterventions.push("Provide educational resources");
    recommendedInterventions.push("Schedule follow-up to address questions");
  }

  return {
    understandingLevel: "GOOD",
    psychosocialNeeds,
    recommendedInterventions,
  };
}

/**
 * Generate family letter for cascade testing
 */
export function generateFamilyLetter(
  genomicData: GenomicData,
  patientName: string
): string {
  const pathogenicVariants = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  );

  if (pathogenicVariants.length === 0) {
    return "";
  }

  const genes = [...new Set(pathogenicVariants.map((v) => v.gene))].join(", ");

  const letter = `
Dear Family Member,

${patientName} recently had genetic testing that identified a change (variant) in the ${genes} gene(s). This finding may have important health implications for blood relatives.

What does this mean?

Genetic variants in ${genes} can be inherited from parents and passed to children. If you are a first-degree relative (parent, sibling, or child) of ${patientName}, you have a 50% chance of carrying the same genetic variant.

Why is this important?

If you carry this variant, it may:
- Increase your risk for certain health conditions
- Affect how you respond to certain medications
- Have implications for your children

What should you do?

1. Discuss this information with your healthcare provider
2. Consider meeting with a genetic counselor to review your personal and family history
3. Ask about genetic testing to determine if you carry the same variant
4. Share this information with other blood relatives who may also be at risk

Where can you get more information?

Please contact our genetics department at [phone number] to schedule a genetic counseling appointment. A genetic counselor can:
- Review your family history
- Explain the variant and its implications
- Discuss testing options
- Address your questions and concerns

This letter is provided as a courtesy and is not a medical recommendation. Please consult with your healthcare provider regarding your specific situation.

Sincerely,
Genetic Counseling Team
`;

  return letter.trim();
}

/**
 * Calculate counseling session complexity score
 */
export function calculateSessionComplexity(
  genomicData: GenomicData | null,
  sessionType: CounselingType
): {
  score: number;
  complexity: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Base complexity by session type
  if (sessionType === "POST_TEST") {
    score += 10;
    factors.push("Post-test results disclosure");
  }

  if (!genomicData) {
    return { score, complexity: "LOW", factors };
  }

  // Number of variants
  const pathogenicCount = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  ).length;

  if (pathogenicCount > 0) {
    score += pathogenicCount * 15;
    factors.push(`${pathogenicCount} pathogenic variant(s)`);
  }

  // VUS complexity
  const vusCount = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "UNCERTAIN_SIGNIFICANCE"
  ).length;

  if (vusCount > 2) {
    score += 10;
    factors.push("Multiple VUS requiring explanation");
  }

  // PGx recommendations
  if (genomicData.pgxRecommendations.length > 0) {
    score += genomicData.pgxRecommendations.length * 5;
    factors.push(`${genomicData.pgxRecommendations.length} PGx recommendation(s)`);
  }

  // Cancer risk
  const hasCancerRisk = genomicData.riskAssessments.some(
    (r) =>
      r.condition.toLowerCase().includes("cancer") &&
      (r.riskCategory === "HIGH" || r.riskCategory === "VERY_HIGH")
  );

  if (hasCancerRisk) {
    score += 20;
    factors.push("High cancer risk requiring detailed discussion");
  }

  let complexity: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  if (score >= 60) {
    complexity = "VERY_HIGH";
  } else if (score >= 40) {
    complexity = "HIGH";
  } else if (score >= 20) {
    complexity = "MODERATE";
  } else {
    complexity = "LOW";
  }

  return { score, complexity, factors };
}

/**
 * Generate informed consent checklist
 */
export function generateConsentChecklist(
  testType: string
): {
  section: string;
  items: Array<{ item: string; required: boolean }>;
}[] {
  return [
    {
      section: "Test Information",
      items: [
        { item: "Purpose and goals of genetic testing explained", required: true },
        { item: "Test methodology and limitations discussed", required: true },
        { item: "Possible test results explained (positive, negative, VUS)", required: true },
        { item: "Test accuracy and error rates discussed", required: true },
      ],
    },
    {
      section: "Risks and Benefits",
      items: [
        { item: "Potential benefits of testing explained", required: true },
        { item: "Psychological risks discussed", required: true },
        { item: "Impact on family members discussed", required: true },
        { item: "Discrimination risks and GINA protections explained", required: true },
      ],
    },
    {
      section: "Privacy and Data Use",
      items: [
        { item: "How results will be stored and who has access", required: true },
        { item: "Research use of data (if applicable)", required: false },
        { item: "Data sharing policies explained", required: true },
      ],
    },
    {
      section: "Results and Follow-up",
      items: [
        { item: "How and when results will be provided", required: true },
        { item: "Follow-up counseling availability explained", required: true },
        { item: "Re-testing or confirmation testing if needed", required: false },
      ],
    },
    {
      section: "Incidental Findings",
      items: [
        { item: "ACMG secondary findings policy explained", required: true },
        { item: "Patient preference for receiving incidental findings documented", required: true },
      ],
    },
    {
      section: "Financial",
      items: [
        { item: "Cost of testing discussed", required: true },
        { item: "Insurance coverage reviewed", required: true },
        { item: "Out-of-pocket expenses estimated", required: false },
      ],
    },
    {
      section: "Questions and Understanding",
      items: [
        { item: "Patient questions addressed", required: true },
        { item: "Patient demonstrates understanding", required: true },
        { item: "Patient provided with written materials", required: true },
      ],
    },
  ];
}

export default {
  createPreTestCounseling,
  createPostTestCounseling,
  generateTalkingPoints,
  assessPatientNeeds,
  generateFamilyLetter,
  calculateSessionComplexity,
  generateConsentChecklist,
};
