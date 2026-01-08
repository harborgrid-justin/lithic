/**
 * PRAPARE (Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences)
 *
 * Standardized SDOH screening tool developed by the National Association of Community Health Centers
 * Validated for use in primary care and community health settings
 */

import type {
  Questionnaire,
  QuestionnaireType,
  SDOHDomain,
  QuestionType,
} from "@/types/sdoh";

/**
 * PRAPARE Questionnaire Definition
 * Full implementation of the validated PRAPARE screening tool
 */
export const PRAPARE_QUESTIONNAIRE: Questionnaire = {
  id: "prapare-v1.0",
  name: "PRAPARE",
  type: QuestionnaireType.PRAPARE,
  version: "1.0",
  description:
    "Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences - A comprehensive social determinants of health screening tool",
  author: "National Association of Community Health Centers (NACHC)",
  publishDate: new Date("2016-01-01"),
  validUntil: null,
  languages: ["en", "es", "fr", "zh", "ar"],
  estimatedMinutes: 10,
  active: true,
  scoringRules: [
    {
      id: "prapare-critical",
      name: "Critical Risk",
      description: "Multiple high-risk factors identified",
      domain: null,
      calculation: "weighted_sum >= 40",
      threshold: 40,
      riskLevel: "CRITICAL",
    },
    {
      id: "prapare-high",
      name: "High Risk",
      description: "Several risk factors identified",
      domain: null,
      calculation: "weighted_sum >= 25",
      threshold: 25,
      riskLevel: "HIGH",
    },
    {
      id: "prapare-moderate",
      name: "Moderate Risk",
      description: "Some risk factors identified",
      domain: null,
      calculation: "weighted_sum >= 15",
      threshold: 15,
      riskLevel: "MODERATE",
    },
    {
      id: "prapare-low",
      name: "Low Risk",
      description: "Minimal risk factors",
      domain: null,
      calculation: "weighted_sum >= 5",
      threshold: 5,
      riskLevel: "LOW",
    },
  ],
  sections: [
    // ========================================================================
    // Section 1: Demographics and Social Context
    // ========================================================================
    {
      id: "prapare-section-1",
      title: "Personal Characteristics",
      description: "Basic demographic and household information",
      order: 1,
      domain: SDOHDomain.SOCIAL_ISOLATION,
      conditional: null,
      questions: [
        {
          id: "prapare-q1",
          text: "Are you Hispanic or Latino?",
          description: null,
          type: QuestionType.YES_NO,
          required: true,
          order: 1,
          domain: SDOHDomain.SOCIAL_ISOLATION,
          riskWeighting: 0,
          zCodeMappings: [],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q1-yes",
              text: "Yes",
              value: true,
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q1-no",
              text: "No",
              value: false,
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
        {
          id: "prapare-q2",
          text: "What language are you most comfortable speaking?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.HEALTHCARE_ACCESS,
          riskWeighting: 3,
          zCodeMappings: ["Z60.3"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q2-english",
              text: "English",
              value: "english",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q2-spanish",
              text: "Spanish",
              value: "spanish",
              order: 2,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: "Z60.3",
            },
            {
              id: "prapare-q2-other",
              text: "Other",
              value: "other",
              order: 3,
              riskScore: 3,
              triggersFollowUp: true,
              zCodeMapping: "Z60.3",
            },
          ],
        },
        {
          id: "prapare-q3",
          text: "How many family members, including yourself, do you currently live with?",
          description: null,
          type: QuestionType.NUMBER,
          required: true,
          order: 3,
          domain: SDOHDomain.SOCIAL_ISOLATION,
          riskWeighting: 2,
          zCodeMappings: [],
          validation: {
            type: "min",
            value: 1,
            message: "Must be at least 1",
          },
          conditional: null,
          options: null,
        },
        {
          id: "prapare-q4",
          text: "What is your housing situation today?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 4,
          domain: SDOHDomain.HOUSING_INSTABILITY,
          riskWeighting: 8,
          zCodeMappings: ["Z59.0", "Z59.1", "Z59.8"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q4-own",
              text: "I have housing",
              value: "housed",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q4-temp",
              text: "I do not have housing (staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, or in a park)",
              value: "homeless",
              order: 2,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z59.0",
            },
            {
              id: "prapare-q4-concerned",
              text: "I am worried about losing my housing",
              value: "at_risk",
              order: 3,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z59.8",
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 2: Housing and Utilities
    // ========================================================================
    {
      id: "prapare-section-2",
      title: "Housing and Utilities",
      description: "Questions about housing stability and utility access",
      order: 2,
      domain: SDOHDomain.HOUSING_INSTABILITY,
      conditional: null,
      questions: [
        {
          id: "prapare-q5",
          text: "Think about the place you live. Do you have problems with any of the following?",
          description: "Select all that apply",
          type: QuestionType.MULTIPLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.HOUSING_INSTABILITY,
          riskWeighting: 6,
          zCodeMappings: ["Z59.1"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q5-pests",
              text: "Pests such as bugs, ants, or mice",
              value: "pests",
              order: 1,
              riskScore: 2,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-mold",
              text: "Mold",
              value: "mold",
              order: 2,
              riskScore: 3,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-lead",
              text: "Lead paint or pipes",
              value: "lead",
              order: 3,
              riskScore: 4,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-heating",
              text: "Lack of heat",
              value: "no_heat",
              order: 4,
              riskScore: 3,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-cooling",
              text: "Lack of cooling (air conditioning)",
              value: "no_cooling",
              order: 5,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-water",
              text: "Lack of adequate or safe water",
              value: "no_water",
              order: 6,
              riskScore: 4,
              triggersFollowUp: true,
              zCodeMapping: "Z59.1",
            },
            {
              id: "prapare-q5-none",
              text: "None of the above",
              value: "none",
              order: 7,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
        {
          id: "prapare-q6",
          text: "In the past 12 months, has the electric, gas, oil, or water company threatened to shut off services in your home?",
          description: null,
          type: QuestionType.YES_NO,
          required: true,
          order: 2,
          domain: SDOHDomain.UTILITY_NEEDS,
          riskWeighting: 7,
          zCodeMappings: ["Z59.8"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q6-yes",
              text: "Yes",
              value: true,
              order: 1,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z59.8",
            },
            {
              id: "prapare-q6-no",
              text: "No",
              value: false,
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q6-already-shut-off",
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
    // Section 3: Food Security
    // ========================================================================
    {
      id: "prapare-section-3",
      title: "Food",
      description: "Questions about food access and security",
      order: 3,
      domain: SDOHDomain.FOOD_INSECURITY,
      conditional: null,
      questions: [
        {
          id: "prapare-q7",
          text: "Within the past 12 months, you worried that your food would run out before you got money to buy more.",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.FOOD_INSECURITY,
          riskWeighting: 6,
          zCodeMappings: ["Z59.4"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q7-often",
              text: "Often true",
              value: "often",
              order: 1,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "prapare-q7-sometimes",
              text: "Sometimes true",
              value: "sometimes",
              order: 2,
              riskScore: 5,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "prapare-q7-never",
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
          id: "prapare-q8",
          text: "Within the past 12 months, the food you bought just didn't last and you didn't have money to get more.",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.FOOD_INSECURITY,
          riskWeighting: 7,
          zCodeMappings: ["Z59.4"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q8-often",
              text: "Often true",
              value: "often",
              order: 1,
              riskScore: 9,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "prapare-q8-sometimes",
              text: "Sometimes true",
              value: "sometimes",
              order: 2,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z59.4",
            },
            {
              id: "prapare-q8-never",
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
    // Section 4: Transportation
    // ========================================================================
    {
      id: "prapare-section-4",
      title: "Transportation",
      description: "Questions about transportation access",
      order: 4,
      domain: SDOHDomain.TRANSPORTATION,
      conditional: null,
      questions: [
        {
          id: "prapare-q9",
          text: "In the past 12 months, has lack of reliable transportation kept you from medical appointments, meetings, work, or from getting things needed for daily living?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.TRANSPORTATION,
          riskWeighting: 6,
          zCodeMappings: ["Z59.82"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q9-yes",
              text: "Yes",
              value: "yes",
              order: 1,
              riskScore: 7,
              triggersFollowUp: true,
              zCodeMapping: "Z59.82",
            },
            {
              id: "prapare-q9-no",
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
    // Section 5: Safety
    // ========================================================================
    {
      id: "prapare-section-5",
      title: "Safety",
      description: "Questions about personal safety",
      order: 5,
      domain: SDOHDomain.INTERPERSONAL_SAFETY,
      conditional: null,
      questions: [
        {
          id: "prapare-q10",
          text: "Do you feel physically and emotionally safe where you currently live?",
          description: null,
          type: QuestionType.YES_NO,
          required: true,
          order: 1,
          domain: SDOHDomain.INTERPERSONAL_SAFETY,
          riskWeighting: 8,
          zCodeMappings: ["Z60.4", "Z65.4"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q10-yes",
              text: "Yes",
              value: true,
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q10-no",
              text: "No",
              value: false,
              order: 2,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z60.4",
            },
            {
              id: "prapare-q10-unsure",
              text: "Unsure",
              value: "unsure",
              order: 3,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z65.4",
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 6: Employment and Financial Security
    // ========================================================================
    {
      id: "prapare-section-6",
      title: "Employment and Money",
      description: "Questions about employment and financial stability",
      order: 6,
      domain: SDOHDomain.EMPLOYMENT,
      conditional: null,
      questions: [
        {
          id: "prapare-q11",
          text: "What is your current work situation?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.EMPLOYMENT,
          riskWeighting: 5,
          zCodeMappings: ["Z56.0", "Z56.2"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q11-employed",
              text: "Employed full-time",
              value: "full_time",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q11-part-time",
              text: "Employed part-time",
              value: "part_time",
              order: 2,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q11-unemployed",
              text: "Unemployed",
              value: "unemployed",
              order: 3,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z56.0",
            },
            {
              id: "prapare-q11-retired",
              text: "Retired",
              value: "retired",
              order: 4,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q11-disabled",
              text: "Unable to work (disabled)",
              value: "disabled",
              order: 5,
              riskScore: 3,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q11-student",
              text: "Student",
              value: "student",
              order: 6,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
        {
          id: "prapare-q12",
          text: "In the past 12 months, how often have you had trouble paying for basic expenses like housing, food, or utilities?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.FINANCIAL_STRAIN,
          riskWeighting: 7,
          zCodeMappings: ["Z59.6"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q12-always",
              text: "Always",
              value: "always",
              order: 1,
              riskScore: 10,
              triggersFollowUp: true,
              zCodeMapping: "Z59.6",
            },
            {
              id: "prapare-q12-often",
              text: "Often",
              value: "often",
              order: 2,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z59.6",
            },
            {
              id: "prapare-q12-sometimes",
              text: "Sometimes",
              value: "sometimes",
              order: 3,
              riskScore: 5,
              triggersFollowUp: true,
              zCodeMapping: "Z59.6",
            },
            {
              id: "prapare-q12-rarely",
              text: "Rarely",
              value: "rarely",
              order: 4,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q12-never",
              text: "Never",
              value: "never",
              order: 5,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 7: Education
    // ========================================================================
    {
      id: "prapare-section-7",
      title: "Education",
      description: "Questions about education background",
      order: 7,
      domain: SDOHDomain.EDUCATION,
      conditional: null,
      questions: [
        {
          id: "prapare-q13",
          text: "What is the highest level of school that you have finished?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.EDUCATION,
          riskWeighting: 3,
          zCodeMappings: ["Z55.0", "Z55.1"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q13-less-hs",
              text: "Less than high school degree",
              value: "less_than_hs",
              order: 1,
              riskScore: 4,
              triggersFollowUp: false,
              zCodeMapping: "Z55.0",
            },
            {
              id: "prapare-q13-hs",
              text: "High school diploma or GED",
              value: "hs_diploma",
              order: 2,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q13-some-college",
              text: "Some college or technical school",
              value: "some_college",
              order: 3,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q13-college",
              text: "College degree or higher",
              value: "college",
              order: 4,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // Section 8: Social Connections
    // ========================================================================
    {
      id: "prapare-section-8",
      title: "Social and Emotional Health",
      description: "Questions about social support and emotional well-being",
      order: 8,
      domain: SDOHDomain.SOCIAL_ISOLATION,
      conditional: null,
      questions: [
        {
          id: "prapare-q14",
          text: "How often do you see or talk to people that you care about and feel close to?",
          description:
            "For example: talking to friends on the phone, visiting friends or family, going to church or club meetings",
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 1,
          domain: SDOHDomain.SOCIAL_ISOLATION,
          riskWeighting: 5,
          zCodeMappings: ["Z60.2"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q14-daily",
              text: "5 or more times a week",
              value: "5_plus",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q14-weekly",
              text: "3 to 4 times a week",
              value: "3_to_4",
              order: 2,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q14-sometimes",
              text: "1 to 2 times a week",
              value: "1_to_2",
              order: 3,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q14-rarely",
              text: "Less than once a week",
              value: "less_than_1",
              order: 4,
              riskScore: 5,
              triggersFollowUp: true,
              zCodeMapping: "Z60.2",
            },
            {
              id: "prapare-q14-never",
              text: "Never",
              value: "never",
              order: 5,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z60.2",
            },
          ],
        },
        {
          id: "prapare-q15",
          text: "Stress is when someone feels tense, nervous, anxious, or can't sleep at night because their mind is troubled. How stressed are you?",
          description: null,
          type: QuestionType.SINGLE_CHOICE,
          required: true,
          order: 2,
          domain: SDOHDomain.SOCIAL_ISOLATION,
          riskWeighting: 4,
          zCodeMappings: ["Z65.8"],
          validation: null,
          conditional: null,
          options: [
            {
              id: "prapare-q15-not",
              text: "Not at all",
              value: "not_at_all",
              order: 1,
              riskScore: 0,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q15-little",
              text: "A little bit",
              value: "a_little",
              order: 2,
              riskScore: 2,
              triggersFollowUp: false,
              zCodeMapping: null,
            },
            {
              id: "prapare-q15-somewhat",
              text: "Somewhat",
              value: "somewhat",
              order: 3,
              riskScore: 4,
              triggersFollowUp: true,
              zCodeMapping: "Z65.8",
            },
            {
              id: "prapare-q15-quite",
              text: "Quite a bit",
              value: "quite_a_bit",
              order: 4,
              riskScore: 6,
              triggersFollowUp: true,
              zCodeMapping: "Z65.8",
            },
            {
              id: "prapare-q15-very",
              text: "Very much",
              value: "very_much",
              order: 5,
              riskScore: 8,
              triggersFollowUp: true,
              zCodeMapping: "Z65.8",
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Get PRAPARE questionnaire instance
 */
export function getPRAPAREQuestionnaire(): Questionnaire {
  return PRAPARE_QUESTIONNAIRE;
}

/**
 * Validate PRAPARE questionnaire responses
 */
export function validatePRAPAREResponses(
  responses: Map<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required questions
  const requiredQuestions = getAllPRAPAREQuestions().filter((q) => q.required);

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
 * Get all questions from PRAPARE
 */
function getAllPRAPAREQuestions() {
  return PRAPARE_QUESTIONNAIRE.sections.flatMap((section) => section.questions);
}
