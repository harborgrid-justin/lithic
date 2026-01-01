/**
 * PRAPARE (Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences) Screening Tool
 * National Association of Community Health Centers (NACHC)
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// PRAPARE Question Types
// ============================================================================

export enum PrapareQuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
}

export interface PrapareQuestion {
  id: string;
  category: PrapareCategory;
  questionText: string;
  questionTextEs: string; // Spanish translation
  type: PrapareQuestionType;
  options?: PrapareOption[];
  loinc?: string; // LOINC code for standardization
  required: boolean;
  skipLogic?: SkipLogic;
}

export interface PrapareOption {
  value: string;
  label: string;
  labelEs: string;
  score?: number;
  triggers?: string[]; // Trigger additional questions or resources
}

export interface SkipLogic {
  showIf?: {
    questionId: string;
    values: string[];
  };
  hideIf?: {
    questionId: string;
    values: string[];
  };
}

export enum PrapareCategory {
  DEMOGRAPHICS = "DEMOGRAPHICS",
  FAMILY_HOME = "FAMILY_HOME",
  MONEY_RESOURCES = "MONEY_RESOURCES",
  SOCIAL_EMOTIONAL = "SOCIAL_EMOTIONAL",
  OPTIONAL = "OPTIONAL",
}

// ============================================================================
// PRAPARE Question Bank
// ============================================================================

export const PRAPARE_QUESTIONS: PrapareQuestion[] = [
  // Demographics
  {
    id: "prapare_race",
    category: PrapareCategory.DEMOGRAPHICS,
    questionText: "What is your race?",
    questionTextEs: "¿Cuál es su raza?",
    type: PrapareQuestionType.MULTIPLE_CHOICE,
    loinc: "32624-9",
    required: false,
    options: [
      { value: "american_indian", label: "American Indian/Alaskan Native", labelEs: "Indígena americano/nativo de Alaska" },
      { value: "asian", label: "Asian", labelEs: "Asiático" },
      { value: "black", label: "Black/African American", labelEs: "Negro/Afroamericano" },
      { value: "pacific_islander", label: "Pacific Islander", labelEs: "Isleño del Pacífico" },
      { value: "white", label: "White", labelEs: "Blanco" },
      { value: "other", label: "Other", labelEs: "Otro" },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_ethnicity",
    category: PrapareCategory.DEMOGRAPHICS,
    questionText: "Are you Hispanic or Latino?",
    questionTextEs: "¿Es usted hispano o latino?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "69490-1",
    required: false,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí" },
      { value: "no", label: "No", labelEs: "No" },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_language",
    category: PrapareCategory.DEMOGRAPHICS,
    questionText: "What language are you most comfortable speaking?",
    questionTextEs: "¿En qué idioma se siente más cómodo hablando?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "54899-0",
    required: true,
    options: [
      { value: "english", label: "English", labelEs: "Inglés" },
      { value: "spanish", label: "Spanish", labelEs: "Español" },
      { value: "chinese", label: "Chinese", labelEs: "Chino" },
      { value: "vietnamese", label: "Vietnamese", labelEs: "Vietnamita" },
      { value: "korean", label: "Korean", labelEs: "Coreano" },
      { value: "russian", label: "Russian", labelEs: "Ruso" },
      { value: "arabic", label: "Arabic", labelEs: "Árabe" },
      { value: "other", label: "Other", labelEs: "Otro" },
    ],
  },
  {
    id: "prapare_veteran",
    category: PrapareCategory.DEMOGRAPHICS,
    questionText: "Have you been discharged from the armed forces of the United States?",
    questionTextEs: "¿Ha sido dado de baja de las fuerzas armadas de los Estados Unidos?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "55280-2",
    required: false,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", triggers: ["veteran_services"] },
      { value: "no", label: "No", labelEs: "No" },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },

  // Family and Home
  {
    id: "prapare_household_size",
    category: PrapareCategory.FAMILY_HOME,
    questionText: "How many family members, including yourself, do you currently live with?",
    questionTextEs: "¿Cuántos miembros de la familia, incluido usted, viven actualmente con usted?",
    type: PrapareQuestionType.NUMBER,
    loinc: "63512-8",
    required: true,
  },
  {
    id: "prapare_housing",
    category: PrapareCategory.FAMILY_HOME,
    questionText: "What is your housing situation today?",
    questionTextEs: "¿Cuál es su situación de vivienda hoy?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "71802-3",
    required: true,
    options: [
      { value: "own", label: "I have housing", labelEs: "Tengo vivienda", score: 0 },
      { value: "temp", label: "I do not have housing (staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, or in a park)", labelEs: "No tengo vivienda (me quedo con otros, en un hotel, en un refugio, viviendo afuera en la calle, en una playa, en un automóvil o en un parque)", score: 4, triggers: ["housing_assistance", "homeless_services"] },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_housing_worry",
    category: PrapareCategory.FAMILY_HOME,
    questionText: "Are you worried about losing your housing?",
    questionTextEs: "¿Le preocupa perder su vivienda?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "93159-2",
    required: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", score: 3, triggers: ["housing_assistance", "legal_aid"] },
      { value: "no", label: "No", labelEs: "No", score: 0 },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
    skipLogic: {
      showIf: {
        questionId: "prapare_housing",
        values: ["own"],
      },
    },
  },
  {
    id: "prapare_neighborhood",
    category: PrapareCategory.FAMILY_HOME,
    questionText: "What address do you live at?",
    questionTextEs: "¿En qué dirección vive?",
    type: PrapareQuestionType.TEXT,
    loinc: "56799-0",
    required: false,
  },

  // Money and Resources
  {
    id: "prapare_employment",
    category: PrapareCategory.MONEY_RESOURCES,
    questionText: "What is your current work situation?",
    questionTextEs: "¿Cuál es su situación laboral actual?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "67875-5",
    required: true,
    options: [
      { value: "employed", label: "Employed", labelEs: "Empleado", score: 0 },
      { value: "unemployed", label: "Unemployed", labelEs: "Desempleado", score: 3, triggers: ["employment_services", "job_training"] },
      { value: "homemaker", label: "Homemaker", labelEs: "Ama de casa", score: 0 },
      { value: "student", label: "Student", labelEs: "Estudiante", score: 0 },
      { value: "retired", label: "Retired", labelEs: "Jubilado", score: 0 },
      { value: "disabled", label: "Unable to work", labelEs: "No puede trabajar", score: 2, triggers: ["disability_services"] },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_insurance",
    category: PrapareCategory.MONEY_RESOURCES,
    questionText: "What is your main insurance?",
    questionTextEs: "¿Cuál es su seguro principal?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "76437-3",
    required: true,
    options: [
      { value: "none", label: "None/uninsured", labelEs: "Ninguno/sin seguro", score: 3, triggers: ["insurance_enrollment"] },
      { value: "medicaid", label: "Medicaid", labelEs: "Medicaid", score: 0 },
      { value: "chip", label: "CHIP Medicaid", labelEs: "CHIP Medicaid", score: 0 },
      { value: "medicare", label: "Medicare", labelEs: "Medicare", score: 0 },
      { value: "other_public", label: "Other public insurance", labelEs: "Otro seguro público", score: 0 },
      { value: "private", label: "Private insurance", labelEs: "Seguro privado", score: 0 },
    ],
  },
  {
    id: "prapare_income",
    category: PrapareCategory.MONEY_RESOURCES,
    questionText: "During the past year, what was the total combined income for you and the family members you live with? This information will help us determine if you are eligible for any benefits.",
    questionTextEs: "Durante el año pasado, ¿cuál fue el ingreso total combinado para usted y los miembros de la familia con los que vive? Esta información nos ayudará a determinar si es elegible para algún beneficio.",
    type: PrapareQuestionType.NUMBER,
    loinc: "63586-2",
    required: false,
  },
  {
    id: "prapare_material_needs",
    category: PrapareCategory.MONEY_RESOURCES,
    questionText: "In the past year, have you or any family members you live with been unable to get any of the following when it was really needed?",
    questionTextEs: "En el año pasado, ¿usted o algún miembro de la familia con el que vive no pudo obtener alguno de los siguientes cuando realmente lo necesitaba?",
    type: PrapareQuestionType.MULTIPLE_CHOICE,
    loinc: "93030-5",
    required: true,
    options: [
      { value: "food", label: "Food", labelEs: "Comida", score: 3, triggers: ["food_assistance", "snap"] },
      { value: "clothing", label: "Clothing", labelEs: "Ropa", score: 2, triggers: ["clothing_assistance"] },
      { value: "utilities", label: "Utilities", labelEs: "Servicios públicos", score: 3, triggers: ["utility_assistance"] },
      { value: "childcare", label: "Child care", labelEs: "Cuidado de niños", score: 2, triggers: ["childcare_assistance"] },
      { value: "medicine", label: "Medicine or Any Health Care", labelEs: "Medicina o cualquier atención médica", score: 4, triggers: ["medication_assistance", "healthcare_access"] },
      { value: "phone", label: "Phone", labelEs: "Teléfono", score: 2, triggers: ["phone_assistance"] },
      { value: "none", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_transportation",
    category: PrapareCategory.MONEY_RESOURCES,
    questionText: "Has lack of transportation kept you from medical appointments, meetings, work, or from getting things needed for daily living?",
    questionTextEs: "¿La falta de transporte le ha impedido asistir a citas médicas, reuniones, trabajar o conseguir cosas necesarias para la vida diaria?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "93026-3",
    required: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", score: 3, triggers: ["transportation_assistance"] },
      { value: "no", label: "No", labelEs: "No", score: 0 },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },

  // Social and Emotional Health
  {
    id: "prapare_social_integration",
    category: PrapareCategory.SOCIAL_EMOTIONAL,
    questionText: "How often do you see or talk to people that you care about and feel close to?",
    questionTextEs: "¿Con qué frecuencia ve o habla con personas que le importan y con las que se siente cercano?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "93029-7",
    required: true,
    options: [
      { value: "5_or_more", label: "5 or more times a week", labelEs: "5 o más veces por semana", score: 0 },
      { value: "3_to_4", label: "3 to 4 times a week", labelEs: "3 a 4 veces por semana", score: 0 },
      { value: "1_to_2", label: "1 to 2 times a week", labelEs: "1 a 2 veces por semana", score: 1 },
      { value: "less_than_1", label: "Less than once a week", labelEs: "Menos de una vez por semana", score: 2, triggers: ["social_services", "support_groups"] },
      { value: "never", label: "Never", labelEs: "Nunca", score: 3, triggers: ["social_services", "mental_health"] },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_stress",
    category: PrapareCategory.SOCIAL_EMOTIONAL,
    questionText: "Stress is when someone feels tense, nervous, anxious or can't sleep at night because their mind is troubled. How stressed are you?",
    questionTextEs: "El estrés es cuando alguien se siente tenso, nervioso, ansioso o no puede dormir por la noche porque su mente está preocupada. ¿Qué tan estresado está?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    loinc: "93038-8",
    required: true,
    options: [
      { value: "not_at_all", label: "Not at all", labelEs: "Para nada", score: 0 },
      { value: "a_little_bit", label: "A little bit", labelEs: "Un poco", score: 1 },
      { value: "somewhat", label: "Somewhat", labelEs: "Algo", score: 2 },
      { value: "quite_a_bit", label: "Quite a bit", labelEs: "Bastante", score: 3, triggers: ["mental_health", "stress_management"] },
      { value: "very_much", label: "Very much", labelEs: "Mucho", score: 4, triggers: ["mental_health", "crisis_support"] },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },

  // Optional Questions
  {
    id: "prapare_refugee",
    category: PrapareCategory.OPTIONAL,
    questionText: "In the past year, have you spent more than 2 nights in a row in a jail, prison, detention center, or juvenile correctional facility?",
    questionTextEs: "En el año pasado, ¿ha pasado más de 2 noches seguidas en una cárcel, prisión, centro de detención o centro correccional juvenil?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    required: false,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", triggers: ["reentry_services", "legal_aid"] },
      { value: "no", label: "No", labelEs: "No" },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_safety",
    category: PrapareCategory.OPTIONAL,
    questionText: "Are you a refugee?",
    questionTextEs: "¿Es usted refugiado?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    required: false,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", triggers: ["refugee_services", "immigration_services"] },
      { value: "no", label: "No", labelEs: "No" },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
  {
    id: "prapare_domestic_violence",
    category: PrapareCategory.OPTIONAL,
    questionText: "Do you feel physically and emotionally safe where you currently live?",
    questionTextEs: "¿Se siente física y emocionalmente seguro donde vive actualmente?",
    type: PrapareQuestionType.SINGLE_CHOICE,
    required: false,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí" },
      { value: "no", label: "No", labelEs: "No", triggers: ["domestic_violence", "safe_housing", "crisis_support"] },
      { value: "unsure", label: "Unsure", labelEs: "No estoy seguro", triggers: ["domestic_violence"] },
      { value: "decline", label: "I choose not to answer this question", labelEs: "Prefiero no responder esta pregunta" },
    ],
  },
];

// ============================================================================
// Scoring and Risk Stratification
// ============================================================================

export interface PrapareResponse {
  questionId: string;
  value: string | string[] | number;
  score?: number;
}

export interface PrapareScreeningResult {
  responses: PrapareResponse[];
  totalScore: number;
  riskLevel: RiskLevel;
  identifiedNeeds: IdentifiedNeed[];
  recommendedResources: string[];
  completedAt: Date;
  completedBy: string;
  language: string;
}

export enum RiskLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface IdentifiedNeed {
  category: string;
  severity: RiskLevel;
  description: string;
  triggers: string[];
}

/**
 * Calculate PRAPARE screening score and identify needs
 */
export function calculatePrapareScore(
  responses: PrapareResponse[]
): PrapareScreeningResult {
  let totalScore = 0;
  const identifiedNeeds: IdentifiedNeed[] = [];
  const recommendedResources = new Set<string>();

  responses.forEach((response) => {
    const question = PRAPARE_QUESTIONS.find((q) => q.id === response.questionId);
    if (!question) return;

    // Calculate score
    if (Array.isArray(response.value)) {
      // Multiple choice
      response.value.forEach((val) => {
        const option = question.options?.find((opt) => opt.value === val);
        if (option?.score) {
          totalScore += option.score;
        }
        if (option?.triggers) {
          option.triggers.forEach((t) => recommendedResources.add(t));
        }
      });
    } else if (typeof response.value === "string") {
      // Single choice
      const option = question.options?.find(
        (opt) => opt.value === response.value
      );
      if (option?.score) {
        totalScore += option.score;
      }
      if (option?.triggers) {
        option.triggers.forEach((t) => recommendedResources.add(t));
      }
    }
  });

  // Determine risk level
  let riskLevel: RiskLevel;
  if (totalScore === 0) {
    riskLevel = RiskLevel.LOW;
  } else if (totalScore <= 5) {
    riskLevel = RiskLevel.MODERATE;
  } else if (totalScore <= 10) {
    riskLevel = RiskLevel.HIGH;
  } else {
    riskLevel = RiskLevel.CRITICAL;
  }

  // Identify specific needs
  const needsMap = new Map<string, IdentifiedNeed>();

  responses.forEach((response) => {
    const question = PRAPARE_QUESTIONS.find((q) => q.id === response.questionId);
    if (!question) return;

    const values = Array.isArray(response.value)
      ? response.value
      : [response.value];

    values.forEach((val) => {
      const option = question.options?.find((opt) => opt.value === val);
      if (option?.triggers) {
        option.triggers.forEach((trigger) => {
          if (!needsMap.has(trigger)) {
            needsMap.set(trigger, {
              category: trigger,
              severity: determineSeverity(option.score || 0),
              description: `${question.questionText}: ${option.label}`,
              triggers: [trigger],
            });
          }
        });
      }
    });
  });

  return {
    responses,
    totalScore,
    riskLevel,
    identifiedNeeds: Array.from(needsMap.values()),
    recommendedResources: Array.from(recommendedResources),
    completedAt: new Date(),
    completedBy: "",
    language: "en",
  };
}

function determineSeverity(score: number): RiskLevel {
  if (score === 0) return RiskLevel.LOW;
  if (score <= 2) return RiskLevel.MODERATE;
  if (score === 3) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}

// ============================================================================
// Validation Schema
// ============================================================================

export const PrapareResponseSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
  score: z.number().optional(),
});

export const PrapareScreeningSchema = z.object({
  patientId: z.string(),
  organizationId: z.string(),
  encounterId: z.string().optional(),
  responses: z.array(PrapareResponseSchema),
  language: z.enum(["en", "es"]).default("en"),
  completedBy: z.string(),
});

export type PrapareScreeningSubmission = z.infer<typeof PrapareScreeningSchema>;
