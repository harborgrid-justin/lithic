/**
 * Clinical Entity Extraction
 *
 * Advanced NLP for extracting structured clinical entities:
 * - Medications (with dose, route, frequency)
 * - Diagnoses (with ICD-10 codes)
 * - Procedures (with CPT codes)
 * - Lab results
 * - Vital signs
 *
 * @module ai/nlp/entity-extractor
 */

import { GPTClient, ChatMessage } from '../gpt/client';

/**
 * Extracted medication entity
 */
export interface MedicationEntity {
  name: string;
  genericName?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  startDate?: string;
  status: 'active' | 'discontinued' | 'completed';
  prescriber?: string;
  indication?: string;
}

/**
 * Extracted diagnosis entity
 */
export interface DiagnosisEntity {
  name: string;
  icd10Code?: string;
  status: 'active' | 'resolved' | 'history_of';
  onset?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  isPrimary?: boolean;
}

/**
 * Extracted procedure entity
 */
export interface ProcedureEntity {
  name: string;
  cptCode?: string;
  date?: string;
  provider?: string;
  location?: string;
  indication?: string;
}

/**
 * Extracted lab result entity
 */
export interface LabResultEntity {
  testName: string;
  loincCode?: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag?: 'normal' | 'high' | 'low' | 'critical';
  date?: string;
}

/**
 * Extracted vital signs
 */
export interface VitalSignsEntity {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    unit: 'mmHg';
  };
  heartRate?: {
    value: number;
    unit: 'bpm';
  };
  temperature?: {
    value: number;
    unit: 'F' | 'C';
  };
  respiratoryRate?: {
    value: number;
    unit: 'breaths/min';
  };
  oxygenSaturation?: {
    value: number;
    unit: '%';
    supplementalO2?: boolean;
  };
  height?: {
    value: number;
    unit: 'cm' | 'in';
  };
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  bmi?: number;
  timestamp?: string;
}

/**
 * Allergy entity
 */
export interface AllergyEntity {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  type?: 'drug' | 'food' | 'environmental';
  onset?: string;
}

/**
 * Complete extracted entities
 */
export interface ExtractedEntities {
  medications: MedicationEntity[];
  diagnoses: DiagnosisEntity[];
  procedures: ProcedureEntity[];
  labResults: LabResultEntity[];
  vitalSigns?: VitalSignsEntity;
  allergies: AllergyEntity[];
  socialHistory?: {
    smokingStatus?: 'never' | 'former' | 'current';
    packsPerDay?: number;
    alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';
    substanceUse?: string[];
  };
  familyHistory?: Array<{
    relation: string;
    condition: string;
    ageAtOnset?: number;
  }>;
}

/**
 * Medication patterns for regex extraction
 */
const MEDICATION_PATTERNS = {
  // Medication name with dose
  nameWithDose: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|mL|units?)\b/gi,

  // Frequency patterns
  frequency: /\b(once|twice|three times|four times)\s+(daily|a day|per day)|q(\d+)h|BID|TID|QID|QHS|PRN/gi,

  // Route patterns
  route: /\b(PO|IV|IM|SQ|SC|topical|inhaled|sublingual|rectal)\b/gi,
};

/**
 * ICD-10 code pattern
 */
const ICD10_PATTERN = /\b([A-Z]\d{2}(?:\.\d{1,4})?)\b/g;

/**
 * CPT code pattern
 */
const CPT_PATTERN = /\b(\d{5})\b/g;

/**
 * LOINC code pattern
 */
const LOINC_PATTERN = /\b(\d{4,5}-\d)\b/g;

/**
 * Clinical Entity Extractor
 *
 * Uses hybrid approach:
 * 1. Regex patterns for structured data
 * 2. GPT-4 for complex entity extraction
 * 3. Post-processing and validation
 */
export class ClinicalEntityExtractor {
  private client: GPTClient;

  constructor(client: GPTClient) {
    this.client = client;
  }

  /**
   * Extract all clinical entities from text
   *
   * @param text - Clinical text to analyze
   * @returns Extracted entities
   */
  async extractEntities(text: string): Promise<ExtractedEntities> {
    // Try regex extraction first for performance
    const regexEntities = this.extractWithRegex(text);

    // Use GPT-4 for more sophisticated extraction
    const gptEntities = await this.extractWithGPT(text);

    // Merge and deduplicate results
    return this.mergeEntities(regexEntities, gptEntities);
  }

  /**
   * Extract medications from text
   *
   * @param text - Clinical text
   * @returns Extracted medications
   */
  async extractMedications(text: string): Promise<MedicationEntity[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a clinical NLP system. Extract medication information from clinical text.

Return a JSON array of medications with structure:
{
  "name": "medication name",
  "dose": "dose with unit",
  "route": "route",
  "frequency": "frequency",
  "status": "active/discontinued/completed"
}

Only extract medications that are clearly mentioned. Do not infer or hallucinate medications.`,
      },
      {
        role: 'user',
        content: `Extract medications from this text:\n\n${text}`,
      },
    ];

    const { content } = await this.client.createChatCompletion(messages, {
      temperature: 0.1,
      maxTokens: 1000,
    });

    try {
      const medications = JSON.parse(content);
      return Array.isArray(medications) ? medications : [];
    } catch {
      return [];
    }
  }

  /**
   * Extract diagnoses from text
   *
   * @param text - Clinical text
   * @returns Extracted diagnoses
   */
  async extractDiagnoses(text: string): Promise<DiagnosisEntity[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Extract diagnoses and medical conditions from clinical text.

Return a JSON array with structure:
{
  "name": "diagnosis name",
  "icd10Code": "code if mentioned",
  "status": "active/resolved/history_of",
  "severity": "mild/moderate/severe if mentioned"
}`,
      },
      {
        role: 'user',
        content: `Extract diagnoses:\n\n${text}`,
      },
    ];

    const { content } = await this.client.createChatCompletion(messages, {
      temperature: 0.1,
      maxTokens: 1000,
    });

    try {
      const diagnoses = JSON.parse(content);
      return Array.isArray(diagnoses) ? diagnoses : [];
    } catch {
      return this.extractDiagnosesWithRegex(text);
    }
  }

  /**
   * Extract vital signs from text
   *
   * @param text - Clinical text
   * @returns Extracted vital signs
   */
  extractVitalSigns(text: string): VitalSignsEntity | undefined {
    const vitals: VitalSignsEntity = {};

    // Blood pressure
    const bpMatch = text.match(/BP[:\s]+(\d{2,3})\/(\d{2,3})/i);
    if (bpMatch) {
      vitals.bloodPressure = {
        systolic: parseInt(bpMatch[1]!),
        diastolic: parseInt(bpMatch[2]!),
        unit: 'mmHg',
      };
    }

    // Heart rate
    const hrMatch = text.match(/HR[:\s]+(\d{2,3})\s*(?:bpm)?/i);
    if (hrMatch) {
      vitals.heartRate = {
        value: parseInt(hrMatch[1]!),
        unit: 'bpm',
      };
    }

    // Temperature
    const tempMatch = text.match(/(?:Temp|Temperature)[:\s]+(\d{2,3}(?:\.\d)?)\s*([FC])?/i);
    if (tempMatch) {
      vitals.temperature = {
        value: parseFloat(tempMatch[1]!),
        unit: (tempMatch[2]?.toUpperCase() as 'F' | 'C') || 'F',
      };
    }

    // Respiratory rate
    const rrMatch = text.match(/RR[:\s]+(\d{1,2})/i);
    if (rrMatch) {
      vitals.respiratoryRate = {
        value: parseInt(rrMatch[1]!),
        unit: 'breaths/min',
      };
    }

    // Oxygen saturation
    const o2Match = text.match(/(?:O2 Sat|SpO2)[:\s]+(\d{2,3})%/i);
    if (o2Match) {
      vitals.oxygenSaturation = {
        value: parseInt(o2Match[1]!),
        unit: '%',
      };
    }

    // Weight
    const weightMatch = text.match(/(?:Weight|Wt)[:\s]+(\d{2,3}(?:\.\d)?)\s*(kg|lbs?)/i);
    if (weightMatch) {
      vitals.weight = {
        value: parseFloat(weightMatch[1]!),
        unit: (weightMatch[2]?.toLowerCase().startsWith('kg') ? 'kg' : 'lbs') as 'kg' | 'lbs',
      };
    }

    // Height
    const heightMatch = text.match(/(?:Height|Ht)[:\s]+(\d{2,3}(?:\.\d)?)\s*(cm|in)/i);
    if (heightMatch) {
      vitals.height = {
        value: parseFloat(heightMatch[1]!),
        unit: heightMatch[2]?.toLowerCase() as 'cm' | 'in',
      };
    }

    return Object.keys(vitals).length > 0 ? vitals : undefined;
  }

  /**
   * Extract lab results from text
   *
   * @param text - Clinical text
   * @returns Extracted lab results
   */
  extractLabResults(text: string): LabResultEntity[] {
    const results: LabResultEntity[] = [];

    // Common lab patterns
    const labPatterns = [
      // "Glucose 125 mg/dL (H)"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z\/]+)?\s*(?:\(([HLN])\))?/g,
    ];

    labPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const testName = match[1]?.trim();
        const value = match[2];
        const unit = match[3];
        const flagLetter = match[4];

        if (testName && value) {
          results.push({
            testName,
            value,
            unit,
            flag: this.mapLabFlag(flagLetter),
          });
        }
      }
    });

    return results;
  }

  /**
   * Extract using regex patterns
   */
  private extractWithRegex(text: string): Partial<ExtractedEntities> {
    return {
      vitalSigns: this.extractVitalSigns(text),
      labResults: this.extractLabResults(text),
    };
  }

  /**
   * Extract using GPT-4
   */
  private async extractWithGPT(text: string): Promise<ExtractedEntities> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Extract all clinical entities from text and return as JSON.

Structure:
{
  "medications": [{"name": "", "dose": "", "route": "", "frequency": "", "status": ""}],
  "diagnoses": [{"name": "", "icd10Code": "", "status": ""}],
  "procedures": [{"name": "", "cptCode": "", "date": ""}],
  "labResults": [{"testName": "", "value": "", "unit": "", "flag": ""}],
  "allergies": [{"allergen": "", "reaction": "", "severity": ""}]
}

Only include entities explicitly mentioned in the text.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const { content } = await this.client.createChatCompletion(messages, {
      temperature: 0.1,
      maxTokens: 2000,
    });

    try {
      const entities = JSON.parse(content);
      return {
        medications: entities.medications || [],
        diagnoses: entities.diagnoses || [],
        procedures: entities.procedures || [],
        labResults: entities.labResults || [],
        allergies: entities.allergies || [],
      };
    } catch {
      return {
        medications: [],
        diagnoses: [],
        procedures: [],
        labResults: [],
        allergies: [],
      };
    }
  }

  /**
   * Merge entities from multiple sources
   */
  private mergeEntities(
    regex: Partial<ExtractedEntities>,
    gpt: ExtractedEntities
  ): ExtractedEntities {
    return {
      medications: gpt.medications || [],
      diagnoses: gpt.diagnoses || [],
      procedures: gpt.procedures || [],
      labResults: [...(regex.labResults || []), ...(gpt.labResults || [])],
      vitalSigns: regex.vitalSigns || gpt.vitalSigns,
      allergies: gpt.allergies || [],
      socialHistory: gpt.socialHistory,
      familyHistory: gpt.familyHistory,
    };
  }

  /**
   * Extract diagnoses using regex
   */
  private extractDiagnosesWithRegex(text: string): DiagnosisEntity[] {
    const diagnoses: DiagnosisEntity[] = [];

    // Look for ICD-10 codes
    let match;
    while ((match = ICD10_PATTERN.exec(text)) !== null) {
      const code = match[1];
      // Try to extract condition name near the code
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(text.length, match.index + 50);
      const context = text.slice(contextStart, contextEnd);

      diagnoses.push({
        name: context.trim(),
        icd10Code: code,
        status: 'active',
      });
    }

    return diagnoses;
  }

  /**
   * Map lab flag letter to enum
   */
  private mapLabFlag(flag?: string): 'normal' | 'high' | 'low' | 'critical' | undefined {
    if (!flag) return undefined;

    switch (flag.toUpperCase()) {
      case 'H':
        return 'high';
      case 'L':
        return 'low';
      case 'C':
        return 'critical';
      case 'N':
        return 'normal';
      default:
        return undefined;
    }
  }
}

/**
 * Create singleton entity extractor
 */
let extractorInstance: ClinicalEntityExtractor | null = null;

export function getEntityExtractor(client: GPTClient): ClinicalEntityExtractor {
  if (!extractorInstance) {
    extractorInstance = new ClinicalEntityExtractor(client);
  }
  return extractorInstance;
}
