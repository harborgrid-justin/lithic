/**
 * AHC-HRSN (Accountable Health Communities Health-Related Social Needs)
 *
 * Standardized SDOH screening tool developed by CMS for the Accountable Health Communities Model
 * Core 10-question screening tool validated for identifying health-related social needs
 */

import type {
  Questionnaire,
  QuestionnaireType,
  SDOHDomain,
  QuestionType,
} from "@/types/sdoh";

/**
 * AHC-HRSN Questionnaire Definition
 * Full implementation of the validated AHC-HRSN screening tool
 */
export const AHC_HRSN_QUESTIONNAIRE: Questionnaire = {
  id: "ahc-hrsn-v1.0",
  name: "AHC-HRSN",
  type: QuestionnaireType.AHC_HRSN,
  version: "1.0",
  description:
    "Accountable Health Communities Health-Related Social Needs Screening Tool - CMS standardized 10-question screening",
  author: "Centers for Medicare & Medicaid Services (CMS)",
  publishDate: new Date("2017-01-01"),
  validUntil: null,
  languages: ["en", "es"],
  estimatedMinutes: 5,
  active: true,
  scoringRules: [
    {
      id: "ahc-critical",
      name: "Critical Risk",
      description: "Multiple urgent needs identified",
      domain: null,
      calculation: "risk_count >= 4",
      threshold: 4,
      riskLevel: "CRITICAL",
    },
    {
      id: "ahc-high",
      name: "High Risk",
      description: "Several needs identified",
      domain: null,
      calculation: "risk_count >= 3",
      threshold: 3,
      riskLevel: "HIGH",
    },
    {
      id: "ahc-moderate",
      name: "Moderate Risk",
      description: "Some needs identified",
      domain: null,
      calculation: "risk_count >= 2",
      threshold: 2,
      riskLevel: "MODERATE",
    },
    {
      id: "ahc-low",
      name: "Low Risk",
      description: "One need identified",
      domain: null,
      calculation: "risk_count >= 1",
      threshold: 1,
      riskLevel: "LOW",
    },
  ],
  sections: [
    // ========================================================================
    // Section 1: Housing Stability (Questions 1-3)
    // ========================================================================
    {
      id: "ahc-section-1",
      title: "Housing Stability",
      description: "Questions about housing situation",
      order: 1,
      domain: SDOHDomain.HOUSING_INSTABILITY,
      conditional: null,
      questions: [
        {
          id: "ahc-q1",
          text: "What is your living situation today?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.HOUSING_INSTABILITY,
          riskWeighting: 10,
          zCodeMappings: ["Z59.0", "Z59.1", "Z59.8"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q1-stable",
              text: "I have a steady place to live",
              value: "stable",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q1-temp",
              text: "I have a place to live today, but I am worried about losing it in the future",
              value: "at_risk",
              order: 2,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z59.8",
            },
            {
              id: "ahc-q1-unstable",
              text: "I do not have a steady place to live (I am temporarily staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, abandoned building, bus or train station, or in a park)",
              value: "homeless",
              order: 3,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z59.0",
            },
          ],
        },
        {
          id: "ahc-q2",
          text: "Think about the place you live. Do you have problems with any of the following?",
          description: "Check all that apply",
          type: QuestionType.MULTIPLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.HOUSING_INSTABILITY,
          riskWeighting: 6,
          zCodeMappings: ["Z59.1"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q2-pests",
              text: "Bug infestation",
              value: "pests",
              order: 1,
              riskScore: 2,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-mold",
              text: "Mold",
              value: "mold",
              order: 2,
              riskScore: 3,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-lead",
              text: "Lead paint or pipes",
              value: "lead",
              order: 3,
              riskScore: 4,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-heating",
              text: "Inadequate heating",
              value: "no_heat",
              order: 4,
              riskScore: 3,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-oven",
              text: "Oven or stove not working",
              value: "no_oven",
              order: 5,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-smoke",
              text: "Smoke detectors missing or not working",
              value: "no_smoke_detector",
              order: 6,
              riskScore: 2,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-water",
              text: "Water leaks",
              value: "water_leaks",
              order: 7,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: "Z59.1",
            },
            {
              id: "ahc-q2-none",
              text: "None of the above",
              value: "none",
              order: 8,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 2: Food Insecurity (Question 4)
    // ========================================================================
    {
      id: "ahc-section-2",
      title: "Food",
      description: "Questions about food security",
      order: 2,
      domain: SDOHDomain.FOOD_INSECURITY,
      conditional: null,
      questions: [
        {
          id: "ahc-q3",
          text: "Within the past 12 months, you worried that your food would run out before you got money to buy more.",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.FOOD_INSECURITY,
          riskWeighting: 8,
          zCodeMappings: ["Z59.4"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q3-often",
              text: "Often true",
              value: "often",
              order: 1,
              riskScore: 9,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "ahc-q3-sometimes",
              text: "Sometimes true",
              value: "sometimes",
              order: 2,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "ahc-q3-never",
              text: "Never true",
              value: "never",
              order: 3,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
        {
          id: "ahc-q4",
          text: "Within the past 12 months, the food you bought just didn't last and you didn't have money to get more.",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.FOOD_INSECURITY,
          riskWeighting: 9,
          zCodeMappings: ["Z59.4"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q4-often",
              text: "Often true",
              value: "often",
              order: 1,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "ahc-q4-sometimes",
              text: "Sometimes true",
              value: "sometimes",
              order: 2,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "ahc-q4-never",
              text: "Never true",
              value: "never",
              order: 3,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 3: Transportation (Question 5)
    // ========================================================================
    {
      id: "ahc-section-3",
      title: "Transportation",
      description: "Questions about transportation barriers",
      order: 3,
      domain: SDOHDomain.TRANSPORTATION,
      conditional: null,
      questions: [
        {
          id: "ahc-q5",
          text: "In the past 12 months, has lack of transportation kept you from medical appointments, meetings, work, or from getting things needed for daily living?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.TRANSPORTATION,
          riskWeighting: 7,
          zCodeMappings: ["Z59.82"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q5-yes",
              text: "Yes",
              value: "yes",
              order: 1,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z59.82",
            },
            {
              id: "ahc-q5-no",
              text: "No",
              value: "no",
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 4: Utilities (Question 6)
    // ========================================================================
    {
      id: "ahc-section-4",
      title: "Utilities",
      description: "Questions about utility access",
      order: 4,
      domain: SDOHDomain.UTILITY_NEEDS,
      conditional: null,
      questions: [
        {
          id: "ahc-q6",
          text: "In the past 12 months has the electric, gas, oil, or water company threatened to shut off services in your home?",
          description: null,
          type: QuestionType.YES_NO,
          required: true,
          order: 1,
          domain: SDOHDomain.UTILITY_NEEDS,
          riskWeighting: 7,
          zCodeMappings: ["Z59.8"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q6-yes",
              text: "Yes",
              value: true,
              order: 1,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z59.8",
            },
            {
              id: "ahc-q6-no",
              text: "No",
              value: false,
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q6-already-shut-off",
              text: "Already shut off",
              value: "shut_off",
              order: 3,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z59.8",
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 5: Safety (Questions 7-8)
    // ========================================================================
    {
      id: "ahc-section-5",
      title: "Safety",
      description: "Questions about personal safety",
      order: 5,
      domain: SDOHDomain.INTERPERSONAL_SAFETY,
      conditional: null,
      questions: [
        {
          id: "ahc-q7",
          text: "How often does anyone, including family and friends, physically hurt you?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.INTERPERSONAL_SAFETY,
          riskWeighting: 10,
          zCodeMappings: ["Z69.11", "Z69.12"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q7-never",
              text: "Never",
              value: "never",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q7-rarely",
              text: "Rarely",
              value: "rarely",
              order: 2,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z69.11",
            },
            {
              id: "ahc-q7-sometimes",
              text: "Sometimes",
              value: "sometimes",
              order: 3,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z69.12",
            },
            {
              id: "ahc-q7-fairly-often",
              text: "Fairly often",
              value: "fairly_often",
              order: 4,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z69.12",
            },
            {
              id: "ahc-q7-frequently",
              text: "Frequently",
              value: "frequently",
              order: 5,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z69.12",
            },
          ],
        },
        {
          id: "ahc-q8",
          text: "How often does anyone, including family and friends, insult or talk down to you?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.INTERPERSONAL_SAFETY,
          riskWeighting: 7,
          zCodeMappings: ["Z69.11"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q8-never",
              text: "Never",
              value: "never",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q8-rarely",
              text: "Rarely",
              value: "rarely",
              order: 2,
              riskScore: 3,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q8-sometimes",
              text: "Sometimes",
              value: "sometimes",
              order: 3,
              riskScore: 5,
              triggersFollowUp: true,
              zCodeMapping: "Z69.11",
            },
            {
              id: "ahc-q8-fairly-often",
              text: "Fairly often",
              value: "fairly_often",
              order: 4,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z69.11",
            },
            {
              id: "ahc-q8-frequently",
              text: "Frequently",
              value: "frequently",
              order: 5,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z69.11",
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 6: Social Support (Question 9)
    // ========================================================================
    {
      id: "ahc-section-6",
      title: "Social Support",
      description: "Questions about social connections",
      order: 6,
      domain: SDOHDomain.SOCIAL_ISOLATION,
      conditional: null,
      questions: [
        {
          id: "ahc-q9",
          text: "How often do you feel lonely or isolated from those around you?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.SOCIAL_ISOLATION,
          riskWeighting: 6,
          zCodeMappings: ["Z60.2"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q9-never",
              text: "Never",
              value: "never",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q9-rarely",
              text: "Rarely",
              value: "rarely",
              order: 2,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "ahc-q9-sometimes",
              text: "Sometimes",
              value: "sometimes",
              order: 3,
              riskScore: 4,
              triggersFollowUp: true,
              zCodeMapping: "Z60.2",
            },
            {
              id: "ahc-q9-often",
              text: "Often",
              value: "often",
              order: 4,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z60.2",
            },
            {
              id: "ahc-q9-always",
              text: "Always",
              value: "always",
              order: 5,
              riskScore: 9,
              triggersFollowUp: true,
              zCodeMapping: "Z60.2",
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 7: Financial Strain (Question 10)
    // ========================================================================
    {
      id: "ahc-section-7",
      title: "Financial Strain",
      description: "Questions about financial hardship",
      order: 7,
      domain: SDOHDomain.FINANCIAL_STRAIN,
      conditional: null,
      questions: [
        {
          id: "ahc-q10",
          text: "Do you speak a language other than English at home?",
          description: null,
          type: QuestionType.YES_NO,
          required: true,
          order: 1,
          domain: SDOHDomain.HEALTHCARE_ACCESS,
          riskWeighting: 3,
          zCodeMappings: ["Z60.3"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "ahc-q10-yes",
              text: "Yes",
              value: true,
              order: 1,
              riskScore: 3,
              triggersFollowUp: false,
              zCodeMapping: "Z60.3",
            },
            {
              id: "ahc-q10-no",
              text: "No",
              value: false,
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Get AHC-HRSN questionnaire instance
 */
export function getAHCHRSNQuestionnaire(): Questionnaire {
  return AHC_HRSN_QUESTIONNAIRE;
}

/**
 * Validate AHC-HRSN questionnaire responses
 */
export function validateAHCHRSNResponses(
  responses: Map<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required questions (all 10 questions are required)
  const requiredQuestions = getAllAHCQuestions().filter((q) => q.required);

  for (const question of requiredQuestions) {
    if (!responses.has(question.id)) {
      errors.push(`Required question not answered: ${question.text}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all questions from AHC-HRSN
 */
function getAllAHCQuestions() {
  return AHC_HRSN_QUESTIONNAIRE.sections.flatMap((section) => section.questions);
}
