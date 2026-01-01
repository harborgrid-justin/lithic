/**
 * AHC HRSN (Accountable Health Communities Health-Related Social Needs) Screening Tool
 * Centers for Medicare & Medicaid Services (CMS)
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// AHC HRSN Core Domains
// ============================================================================

export enum AHCDomain {
  HOUSING_INSTABILITY = "HOUSING_INSTABILITY",
  FOOD_INSECURITY = "FOOD_INSECURITY",
  TRANSPORTATION = "TRANSPORTATION",
  UTILITIES = "UTILITIES",
  INTERPERSONAL_SAFETY = "INTERPERSONAL_SAFETY",
}

export interface AHCQuestion {
  id: string;
  domain: AHCDomain;
  questionText: string;
  questionTextEs: string;
  loincCode: string;
  responseType: "yes_no" | "frequency" | "text";
  options?: AHCOption[];
  required: boolean;
  supplemental?: boolean; // Supplemental questions for deeper assessment
}

export interface AHCOption {
  value: string;
  label: string;
  labelEs: string;
  indicatesNeed: boolean; // Does this response indicate a social need?
}

// ============================================================================
// AHC HRSN Question Bank
// ============================================================================

export const AHC_HRSN_QUESTIONS: AHCQuestion[] = [
  // Housing Instability
  {
    id: "ahc_housing_worry",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText:
      "Within the past 12 months, you worried that your food would run out before you got money to buy more.",
    questionTextEs:
      "En los últimos 12 meses, le preocupó que se le acabara la comida antes de tener dinero para comprar más.",
    loincCode: "88122-7",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "often", label: "Often true", labelEs: "A menudo cierto", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes true", labelEs: "A veces cierto", indicatesNeed: true },
      { value: "never", label: "Never true", labelEs: "Nunca cierto", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_housing_eviction",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText:
      "Within the past 12 months, the food you bought just didn't last and you didn't have money to get more.",
    questionTextEs:
      "En los últimos 12 meses, la comida que compró no duró y no tenía dinero para comprar más.",
    loincCode: "88123-5",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "often", label: "Often true", labelEs: "A menudo cierto", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes true", labelEs: "A veces cierto", indicatesNeed: true },
      { value: "never", label: "Never true", labelEs: "Nunca cierto", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_housing_status",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Think about the place you live. Do you have problems with any of the following?",
    questionTextEs: "Piense en el lugar donde vive. ¿Tiene problemas con alguno de los siguientes?",
    loincCode: "71802-3",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "pests", label: "Pests such as bugs, ants, or mice", labelEs: "Plagas como insectos, hormigas o ratones", indicatesNeed: true },
      { value: "mold", label: "Mold", labelEs: "Moho", indicatesNeed: true },
      { value: "lead", label: "Lead paint or pipes", labelEs: "Pintura o tuberías de plomo", indicatesNeed: true },
      { value: "water", label: "Lack of heat, water, or electricity", labelEs: "Falta de calefacción, agua o electricidad", indicatesNeed: true },
      { value: "oven", label: "Oven or stove not working", labelEs: "Horno o estufa que no funciona", indicatesNeed: true },
      { value: "smoke", label: "Smoke detectors missing or not working", labelEs: "Detectores de humo faltantes o que no funcionan", indicatesNeed: true },
      { value: "water_leaks", label: "Water leaks", labelEs: "Fugas de agua", indicatesNeed: true },
      { value: "none", label: "None of the above", labelEs: "Ninguno de los anteriores", indicatesNeed: false },
    ],
  },

  // Food Insecurity
  {
    id: "ahc_food_worry",
    domain: AHCDomain.FOOD_INSECURITY,
    questionText: "Within the past 12 months, you worried that your food would run out before you got money to buy more.",
    questionTextEs: "En los últimos 12 meses, le preocupó que se le acabara la comida antes de tener dinero para comprar más.",
    loincCode: "88122-7",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "often", label: "Often true", labelEs: "A menudo cierto", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes true", labelEs: "A veces cierto", indicatesNeed: true },
      { value: "never", label: "Never true", labelEs: "Nunca cierto", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_food_last",
    domain: AHCDomain.FOOD_INSECURITY,
    questionText: "Within the past 12 months, the food you bought just didn't last and you didn't have money to get more.",
    questionTextEs: "En los últimos 12 meses, la comida que compró no duró y no tenía dinero para comprar más.",
    loincCode: "88123-5",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "often", label: "Often true", labelEs: "A menudo cierto", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes true", labelEs: "A veces cierto", indicatesNeed: true },
      { value: "never", label: "Never true", labelEs: "Nunca cierto", indicatesNeed: false },
    ],
  },

  // Transportation
  {
    id: "ahc_transportation",
    domain: AHCDomain.TRANSPORTATION,
    questionText:
      "Within the past 12 months, has lack of reliable transportation kept you from medical appointments, meetings, work or from getting things needed for daily living?",
    questionTextEs:
      "En los últimos 12 meses, ¿la falta de transporte confiable le ha impedido asistir a citas médicas, reuniones, trabajar o conseguir cosas necesarias para la vida diaria?",
    loincCode: "93026-3",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: true },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: false },
    ],
  },

  // Utilities
  {
    id: "ahc_utilities",
    domain: AHCDomain.UTILITIES,
    questionText:
      "Within the past 12 months, has the electric, gas, oil, or water company threatened to shut off services in your home?",
    questionTextEs:
      "En los últimos 12 meses, ¿la compañía de electricidad, gas, petróleo o agua ha amenazado con cerrar los servicios en su hogar?",
    loincCode: "96778-2",
    responseType: "yes_no",
    required: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: true },
      { value: "already_shut", label: "Already shut off", labelEs: "Ya cerrado", indicatesNeed: true },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: false },
    ],
  },

  // Interpersonal Safety
  {
    id: "ahc_safety",
    domain: AHCDomain.INTERPERSONAL_SAFETY,
    questionText:
      "Within the past 12 months, how often does anyone, including family, physically hurt you?",
    questionTextEs:
      "En los últimos 12 meses, ¿con qué frecuencia alguien, incluida la familia, le ha lastimado físicamente?",
    loincCode: "76501-6",
    responseType: "frequency",
    required: true,
    options: [
      { value: "often", label: "Often", labelEs: "A menudo", indicatesNeed: true },
      { value: "fairly_often", label: "Fairly often", labelEs: "Bastante a menudo", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes", labelEs: "A veces", indicatesNeed: true },
      { value: "rarely", label: "Rarely", labelEs: "Raramente", indicatesNeed: false },
      { value: "never", label: "Never", labelEs: "Nunca", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_safety_insult",
    domain: AHCDomain.INTERPERSONAL_SAFETY,
    questionText:
      "Within the past 12 months, how often does anyone, including family, insult or talk down to you?",
    questionTextEs:
      "En los últimos 12 meses, ¿con qué frecuencia alguien, incluida la familia, le insulta o le habla mal?",
    loincCode: "93025-5",
    responseType: "frequency",
    required: true,
    options: [
      { value: "often", label: "Often", labelEs: "A menudo", indicatesNeed: true },
      { value: "fairly_often", label: "Fairly often", labelEs: "Bastante a menudo", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes", labelEs: "A veces", indicatesNeed: true },
      { value: "rarely", label: "Rarely", labelEs: "Raramente", indicatesNeed: false },
      { value: "never", label: "Never", labelEs: "Nunca", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_safety_threaten",
    domain: AHCDomain.INTERPERSONAL_SAFETY,
    questionText:
      "Within the past 12 months, how often does anyone, including family, threaten you with harm?",
    questionTextEs:
      "En los últimos 12 meses, ¿con qué frecuencia alguien, incluida la familia, le amenaza con hacerle daño?",
    loincCode: "93026-3",
    responseType: "frequency",
    required: true,
    options: [
      { value: "often", label: "Often", labelEs: "A menudo", indicatesNeed: true },
      { value: "fairly_often", label: "Fairly often", labelEs: "Bastante a menudo", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes", labelEs: "A veces", indicatesNeed: true },
      { value: "rarely", label: "Rarely", labelEs: "Raramente", indicatesNeed: false },
      { value: "never", label: "Never", labelEs: "Nunca", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_safety_scream",
    domain: AHCDomain.INTERPERSONAL_SAFETY,
    questionText:
      "Within the past 12 months, how often does anyone, including family, scream or curse at you?",
    questionTextEs:
      "En los últimos 12 meses, ¿con qué frecuencia alguien, incluida la familia, le grita o le maldice?",
    loincCode: "93027-1",
    responseType: "frequency",
    required: true,
    options: [
      { value: "often", label: "Often", labelEs: "A menudo", indicatesNeed: true },
      { value: "fairly_often", label: "Fairly often", labelEs: "Bastante a menudo", indicatesNeed: true },
      { value: "sometimes", label: "Sometimes", labelEs: "A veces", indicatesNeed: true },
      { value: "rarely", label: "Rarely", labelEs: "Raramente", indicatesNeed: false },
      { value: "never", label: "Never", labelEs: "Nunca", indicatesNeed: false },
    ],
  },
];

// ============================================================================
// Supplemental Questions (Deep Dive)
// ============================================================================

export const AHC_SUPPLEMENTAL_QUESTIONS: AHCQuestion[] = [
  {
    id: "ahc_supp_education",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "What is the highest level of school that you have finished?",
    questionTextEs: "¿Cuál es el nivel más alto de escuela que ha terminado?",
    loincCode: "82589-3",
    responseType: "text",
    required: false,
    supplemental: true,
  },
  {
    id: "ahc_supp_employment",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Are you currently working?",
    questionTextEs: "¿Está trabajando actualmente?",
    loincCode: "67875-5",
    responseType: "yes_no",
    required: false,
    supplemental: true,
    options: [
      { value: "yes_full", label: "Yes, full time", labelEs: "Sí, tiempo completo", indicatesNeed: false },
      { value: "yes_part", label: "Yes, part time", labelEs: "Sí, tiempo parcial", indicatesNeed: false },
      { value: "no_looking", label: "No, but looking for work", labelEs: "No, pero buscando trabajo", indicatesNeed: true },
      { value: "no_disabled", label: "No, unable to work", labelEs: "No, no puede trabajar", indicatesNeed: true },
      { value: "no_retired", label: "No, retired", labelEs: "No, jubilado", indicatesNeed: false },
      { value: "no_not_looking", label: "No, not looking for work", labelEs: "No, no buscando trabajo", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_supp_insurance",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Do you have health insurance coverage?",
    questionTextEs: "¿Tiene cobertura de seguro de salud?",
    loincCode: "76437-3",
    responseType: "yes_no",
    required: false,
    supplemental: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: false },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: true },
    ],
  },
  {
    id: "ahc_supp_childcare",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Do you need help finding or paying for childcare?",
    questionTextEs: "¿Necesita ayuda para encontrar o pagar el cuidado de niños?",
    loincCode: "96779-0",
    responseType: "yes_no",
    required: false,
    supplemental: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: true },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_supp_clothing",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Do you need help finding or paying for clothing?",
    questionTextEs: "¿Necesita ayuda para encontrar o pagar ropa?",
    loincCode: "96780-8",
    responseType: "yes_no",
    required: false,
    supplemental: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: true },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: false },
    ],
  },
  {
    id: "ahc_supp_phone",
    domain: AHCDomain.HOUSING_INSTABILITY,
    questionText: "Do you need help finding or paying for a phone?",
    questionTextEs: "¿Necesita ayuda para encontrar o pagar un teléfono?",
    loincCode: "96781-6",
    responseType: "yes_no",
    required: false,
    supplemental: true,
    options: [
      { value: "yes", label: "Yes", labelEs: "Sí", indicatesNeed: true },
      { value: "no", label: "No", labelEs: "No", indicatesNeed: false },
    ],
  },
];

// ============================================================================
// Response and Scoring
// ============================================================================

export interface AHCResponse {
  questionId: string;
  value: string | string[];
  indicatesNeed: boolean;
}

export interface AHCScreeningResult {
  responses: AHCResponse[];
  identifiedDomains: AHCDomain[];
  totalNeeds: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  needsByDomain: Map<AHCDomain, number>;
  recommendations: AHCRecommendation[];
  completedAt: Date;
  completedBy: string;
  language: string;
  supplementalCompleted: boolean;
}

export interface AHCRecommendation {
  domain: AHCDomain;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description: string;
  resourceTypes: string[];
}

/**
 * Process AHC HRSN screening responses
 */
export function processAHCScreening(
  responses: AHCResponse[],
  includeSupplemental = false
): AHCScreeningResult {
  const needsByDomain = new Map<AHCDomain, number>();
  const identifiedDomains = new Set<AHCDomain>();
  let totalNeeds = 0;

  // Count needs by domain
  responses.forEach((response) => {
    const question = [...AHC_HRSN_QUESTIONS, ...AHC_SUPPLEMENTAL_QUESTIONS].find(
      (q) => q.id === response.questionId
    );
    if (!question) return;

    if (response.indicatesNeed) {
      totalNeeds++;
      identifiedDomains.add(question.domain);
      needsByDomain.set(
        question.domain,
        (needsByDomain.get(question.domain) || 0) + 1
      );
    }
  });

  // Determine risk level
  let riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  if (totalNeeds === 0) {
    riskLevel = "LOW";
  } else if (totalNeeds <= 2) {
    riskLevel = "MODERATE";
  } else if (totalNeeds <= 4) {
    riskLevel = "HIGH";
  } else {
    riskLevel = "CRITICAL";
  }

  // Generate recommendations
  const recommendations = generateAHCRecommendations(
    Array.from(identifiedDomains),
    needsByDomain
  );

  return {
    responses,
    identifiedDomains: Array.from(identifiedDomains),
    totalNeeds,
    riskLevel,
    needsByDomain,
    recommendations,
    completedAt: new Date(),
    completedBy: "",
    language: "en",
    supplementalCompleted: includeSupplemental,
  };
}

/**
 * Generate recommendations based on identified needs
 */
function generateAHCRecommendations(
  domains: AHCDomain[],
  needsByDomain: Map<AHCDomain, number>
): AHCRecommendation[] {
  const recommendations: AHCRecommendation[] = [];

  domains.forEach((domain) => {
    const needCount = needsByDomain.get(domain) || 0;
    let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";

    if (needCount >= 3) priority = "URGENT";
    else if (needCount === 2) priority = "HIGH";
    else if (needCount === 1) priority = "MEDIUM";

    switch (domain) {
      case AHCDomain.HOUSING_INSTABILITY:
        recommendations.push({
          domain,
          priority,
          description: "Housing assistance and stability services needed",
          resourceTypes: [
            "housing_assistance",
            "emergency_shelter",
            "transitional_housing",
            "rental_assistance",
            "legal_aid",
          ],
        });
        break;

      case AHCDomain.FOOD_INSECURITY:
        recommendations.push({
          domain,
          priority,
          description: "Food assistance programs recommended",
          resourceTypes: [
            "food_pantry",
            "snap",
            "wic",
            "meals_on_wheels",
            "food_bank",
          ],
        });
        break;

      case AHCDomain.TRANSPORTATION:
        recommendations.push({
          domain,
          priority,
          description: "Transportation support services needed",
          resourceTypes: [
            "medical_transportation",
            "public_transit_vouchers",
            "ride_share_programs",
            "gas_assistance",
          ],
        });
        break;

      case AHCDomain.UTILITIES:
        recommendations.push({
          domain,
          priority,
          description: "Utility assistance programs recommended",
          resourceTypes: [
            "liheap",
            "utility_assistance",
            "weatherization",
            "emergency_assistance",
          ],
        });
        break;

      case AHCDomain.INTERPERSONAL_SAFETY:
        recommendations.push({
          domain,
          priority: "URGENT", // Always urgent for safety issues
          description: "Immediate safety assessment and intervention needed",
          resourceTypes: [
            "domestic_violence_hotline",
            "safe_shelter",
            "counseling",
            "legal_advocacy",
            "crisis_intervention",
          ],
        });
        break;
    }
  });

  return recommendations;
}

// ============================================================================
// Validation Schema
// ============================================================================

export const AHCResponseSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  indicatesNeed: z.boolean(),
});

export const AHCScreeningSchema = z.object({
  patientId: z.string(),
  organizationId: z.string(),
  encounterId: z.string().optional(),
  responses: z.array(AHCResponseSchema),
  includeSupplemental: z.boolean().default(false),
  language: z.enum(["en", "es"]).default("en"),
  completedBy: z.string(),
});

export type AHCScreeningSubmission = z.infer<typeof AHCScreeningSchema>;

/**
 * Calculate AHC HRSN screening score for risk stratification
 */
export function calculateAHCRiskScore(result: AHCScreeningResult): number {
  let score = 0;

  // Weight different domains
  const weights = {
    [AHCDomain.INTERPERSONAL_SAFETY]: 10, // Highest priority
    [AHCDomain.HOUSING_INSTABILITY]: 8,
    [AHCDomain.FOOD_INSECURITY]: 6,
    [AHCDomain.UTILITIES]: 5,
    [AHCDomain.TRANSPORTATION]: 4,
  };

  result.needsByDomain.forEach((count, domain) => {
    score += count * weights[domain];
  });

  return score;
}
