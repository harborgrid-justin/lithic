/**
 * Medical Vocabulary Database for Voice Recognition
 * Comprehensive medical terminology, abbreviations, and phonetic mappings
 */

import { MedicalTerm, MedicalTermCategory } from "@/types/voice";

// ============================================================================
// Medical Terminology Database
// ============================================================================

export const MEDICAL_TERMS: MedicalTerm[] = [
  // Common Diagnoses
  {
    term: "hypertension",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["high blood pressure", "HTN"],
    abbreviations: ["HTN", "HBP"],
    icd10: "I10",
    snomed: "38341003",
  },
  {
    term: "diabetes mellitus",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["diabetes", "DM"],
    abbreviations: ["DM", "IDDM", "NIDDM"],
    icd10: "E11.9",
    snomed: "73211009",
  },
  {
    term: "chronic obstructive pulmonary disease",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["COPD", "chronic bronchitis", "emphysema"],
    abbreviations: ["COPD"],
    icd10: "J44.9",
    snomed: "13645005",
  },
  {
    term: "coronary artery disease",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["CAD", "coronary heart disease", "ischemic heart disease"],
    abbreviations: ["CAD", "CHD", "IHD"],
    icd10: "I25.10",
    snomed: "53741008",
  },
  {
    term: "congestive heart failure",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["CHF", "heart failure"],
    abbreviations: ["CHF", "HF"],
    icd10: "I50.9",
    snomed: "42343007",
  },
  {
    term: "atrial fibrillation",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["AFib", "A-fib"],
    abbreviations: ["AFib", "AF"],
    icd10: "I48.91",
    snomed: "49436004",
  },
  {
    term: "pneumonia",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["lung infection"],
    abbreviations: ["PNA"],
    icd10: "J18.9",
    snomed: "233604007",
  },
  {
    term: "urinary tract infection",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["UTI", "bladder infection"],
    abbreviations: ["UTI"],
    icd10: "N39.0",
    snomed: "68566005",
  },
  {
    term: "gastroesophageal reflux disease",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["GERD", "acid reflux"],
    abbreviations: ["GERD"],
    icd10: "K21.9",
    snomed: "235595009",
  },
  {
    term: "asthma",
    category: MedicalTermCategory.DIAGNOSIS,
    synonyms: ["reactive airway disease"],
    abbreviations: ["RAD"],
    icd10: "J45.909",
    snomed: "195967001",
  },

  // Common Medications
  {
    term: "lisinopril",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Prinivil", "Zestril"],
    abbreviations: [],
  },
  {
    term: "metformin",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Glucophage"],
    abbreviations: [],
  },
  {
    term: "atorvastatin",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Lipitor"],
    abbreviations: [],
  },
  {
    term: "amlodipine",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Norvasc"],
    abbreviations: [],
  },
  {
    term: "levothyroxine",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Synthroid"],
    abbreviations: [],
  },
  {
    term: "omeprazole",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Prilosec"],
    abbreviations: [],
  },
  {
    term: "albuterol",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Proventil", "Ventolin"],
    abbreviations: [],
  },
  {
    term: "gabapentin",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Neurontin"],
    abbreviations: [],
  },
  {
    term: "losartan",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Cozaar"],
    abbreviations: [],
  },
  {
    term: "metoprolol",
    category: MedicalTermCategory.MEDICATION,
    synonyms: ["Lopressor", "Toprol"],
    abbreviations: [],
  },

  // Anatomy
  {
    term: "myocardium",
    category: MedicalTermCategory.ANATOMY,
    synonyms: ["heart muscle"],
    abbreviations: [],
  },
  {
    term: "cerebellum",
    category: MedicalTermCategory.ANATOMY,
    synonyms: [],
    abbreviations: [],
  },
  {
    term: "esophagus",
    category: MedicalTermCategory.ANATOMY,
    synonyms: [],
    abbreviations: [],
  },
  {
    term: "duodenum",
    category: MedicalTermCategory.ANATOMY,
    synonyms: [],
    abbreviations: [],
  },

  // Lab Tests
  {
    term: "complete blood count",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["CBC"],
    abbreviations: ["CBC"],
    loinc: "58410-2",
  },
  {
    term: "basic metabolic panel",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["BMP"],
    abbreviations: ["BMP"],
    loinc: "51990-0",
  },
  {
    term: "comprehensive metabolic panel",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["CMP"],
    abbreviations: ["CMP"],
    loinc: "24323-8",
  },
  {
    term: "hemoglobin A1c",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["A1c", "HbA1c"],
    abbreviations: ["A1c", "HbA1c"],
    loinc: "4548-4",
  },
  {
    term: "thyroid stimulating hormone",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["TSH"],
    abbreviations: ["TSH"],
    loinc: "3016-3",
  },
  {
    term: "lipid panel",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["cholesterol panel"],
    abbreviations: [],
    loinc: "57698-3",
  },
  {
    term: "urinalysis",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["UA"],
    abbreviations: ["UA"],
    loinc: "24356-8",
  },
  {
    term: "prothrombin time",
    category: MedicalTermCategory.LAB_TEST,
    synonyms: ["PT", "INR"],
    abbreviations: ["PT", "INR"],
    loinc: "5902-2",
  },

  // Procedures
  {
    term: "electrocardiogram",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: ["ECG", "EKG"],
    abbreviations: ["ECG", "EKG"],
  },
  {
    term: "echocardiogram",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: ["echo"],
    abbreviations: ["ECHO"],
  },
  {
    term: "colonoscopy",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: [],
    abbreviations: [],
  },
  {
    term: "endoscopy",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: ["EGD"],
    abbreviations: ["EGD"],
  },
  {
    term: "computed tomography",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: ["CT scan", "CAT scan"],
    abbreviations: ["CT"],
  },
  {
    term: "magnetic resonance imaging",
    category: MedicalTermCategory.PROCEDURE,
    synonyms: ["MRI"],
    abbreviations: ["MRI"],
  },

  // Vital Signs
  {
    term: "blood pressure",
    category: MedicalTermCategory.VITAL_SIGN,
    synonyms: ["BP"],
    abbreviations: ["BP"],
  },
  {
    term: "heart rate",
    category: MedicalTermCategory.VITAL_SIGN,
    synonyms: ["pulse", "HR"],
    abbreviations: ["HR"],
  },
  {
    term: "respiratory rate",
    category: MedicalTermCategory.VITAL_SIGN,
    synonyms: ["RR"],
    abbreviations: ["RR"],
  },
  {
    term: "oxygen saturation",
    category: MedicalTermCategory.VITAL_SIGN,
    synonyms: ["O2 sat", "SpO2"],
    abbreviations: ["SpO2"],
  },
  {
    term: "temperature",
    category: MedicalTermCategory.VITAL_SIGN,
    synonyms: ["temp"],
    abbreviations: ["T"],
  },
];

// ============================================================================
// Medical Abbreviations Dictionary
// ============================================================================

export const MEDICAL_ABBREVIATIONS: Record<string, string> = {
  // Vital Signs
  BP: "blood pressure",
  HR: "heart rate",
  RR: "respiratory rate",
  T: "temperature",
  SpO2: "oxygen saturation",
  BMI: "body mass index",

  // Common Diagnoses
  HTN: "hypertension",
  DM: "diabetes mellitus",
  CAD: "coronary artery disease",
  CHF: "congestive heart failure",
  COPD: "chronic obstructive pulmonary disease",
  MI: "myocardial infarction",
  CVA: "cerebrovascular accident",
  TIA: "transient ischemic attack",
  PE: "pulmonary embolism",
  DVT: "deep vein thrombosis",
  AFib: "atrial fibrillation",
  UTI: "urinary tract infection",
  GERD: "gastroesophageal reflux disease",
  CKD: "chronic kidney disease",
  ESRD: "end-stage renal disease",

  // Lab Tests
  CBC: "complete blood count",
  CMP: "comprehensive metabolic panel",
  BMP: "basic metabolic panel",
  LFT: "liver function test",
  PT: "prothrombin time",
  PTT: "partial thromboplastin time",
  INR: "international normalized ratio",
  TSH: "thyroid stimulating hormone",
  PSA: "prostate-specific antigen",
  UA: "urinalysis",
  ABG: "arterial blood gas",
  ESR: "erythrocyte sedimentation rate",
  CRP: "C-reactive protein",

  // Procedures
  ECG: "electrocardiogram",
  EKG: "electrocardiogram",
  EEG: "electroencephalogram",
  MRI: "magnetic resonance imaging",
  CT: "computed tomography",
  PET: "positron emission tomography",
  CXR: "chest x-ray",
  EGD: "esophagogastroduodenoscopy",
  ERCP: "endoscopic retrograde cholangiopancreatography",

  // Departments
  ED: "emergency department",
  ER: "emergency room",
  ICU: "intensive care unit",
  CCU: "cardiac care unit",
  OR: "operating room",
  PACU: "post-anesthesia care unit",

  // Medical Terms
  SOB: "shortness of breath",
  DOE: "dyspnea on exertion",
  CP: "chest pain",
  HA: "headache",
  "N/V": "nausea and vomiting",
  LOC: "loss of consciousness",
  AMS: "altered mental status",
  ROM: "range of motion",
  LE: "lower extremity",
  UE: "upper extremity",
  RLE: "right lower extremity",
  LLE: "left lower extremity",
  RUE: "right upper extremity",
  LUE: "left upper extremity",

  // Medication Routes
  PO: "by mouth",
  IV: "intravenous",
  IM: "intramuscular",
  SC: "subcutaneous",
  SQ: "subcutaneous",
  SL: "sublingual",
  PR: "per rectum",
  TOP: "topical",

  // Frequency
  QD: "once daily",
  BID: "twice daily",
  TID: "three times daily",
  QID: "four times daily",
  QHS: "at bedtime",
  PRN: "as needed",
  STAT: "immediately",
  AC: "before meals",
  PC: "after meals",

  // Status
  WNL: "within normal limits",
  NAD: "no acute distress",
  "A&O": "alert and oriented",
  DNR: "do not resuscitate",
  DNI: "do not intubate",
  NPO: "nothing by mouth",
  VSS: "vital signs stable",

  // Other
  "H/O": "history of",
  "S/P": "status post",
  "R/O": "rule out",
  "C/O": "complains of",
  "D/C": "discontinue",
  "F/U": "follow up",
  NKDA: "no known drug allergies",
};

// ============================================================================
// Phonetic Corrections
// ============================================================================

export const PHONETIC_CORRECTIONS: Record<string, string> = {
  "high per tension": "hypertension",
  "die a beet ease": "diabetes",
  "a fib": "atrial fibrillation",
  "see oh pee dee": "COPD",
  "you tea eye": "UTI",
  "gerd": "GERD",
  "see bee see": "CBC",
  "see em pee": "CMP",
  "bee em pee": "BMP",
  "eee kay gee": "EKG",
  "eee cee gee": "ECG",
  "em are eye": "MRI",
  "see tee": "CT",
  "lip it or": "Lipitor",
  "glass off age": "Glucophage",
  "sin throid": "Synthroid",
  "pro vent ill": "Proventil",
};

// ============================================================================
// Context-Aware Vocabulary
// ============================================================================

export const CONTEXT_VOCABULARY: Record<string, string[]> = {
  cardiology: [
    "myocardial infarction",
    "coronary artery disease",
    "atrial fibrillation",
    "heart failure",
    "cardiomyopathy",
    "endocarditis",
    "pericarditis",
    "valvular disease",
    "arrhythmia",
    "angina",
  ],
  pulmonology: [
    "COPD",
    "asthma",
    "pneumonia",
    "pulmonary embolism",
    "interstitial lung disease",
    "bronchitis",
    "pleural effusion",
    "pneumothorax",
    "respiratory failure",
  ],
  gastroenterology: [
    "GERD",
    "peptic ulcer disease",
    "inflammatory bowel disease",
    "Crohn's disease",
    "ulcerative colitis",
    "diverticulitis",
    "hepatitis",
    "cirrhosis",
    "pancreatitis",
  ],
  neurology: [
    "stroke",
    "seizure",
    "migraine",
    "multiple sclerosis",
    "Parkinson's disease",
    "Alzheimer's disease",
    "neuropathy",
    "meningitis",
    "encephalitis",
  ],
  endocrinology: [
    "diabetes mellitus",
    "hypothyroidism",
    "hyperthyroidism",
    "Cushing's syndrome",
    "Addison's disease",
    "hyperlipidemia",
    "metabolic syndrome",
  ],
};

// ============================================================================
// Medical Vocabulary Service
// ============================================================================

export class MedicalVocabularyService {
  private termMap: Map<string, MedicalTerm>;
  private abbreviationMap: Map<string, string>;
  private phoneticMap: Map<string, string>;

  constructor() {
    this.termMap = new Map();
    this.abbreviationMap = new Map(Object.entries(MEDICAL_ABBREVIATIONS));
    this.phoneticMap = new Map(Object.entries(PHONETIC_CORRECTIONS));

    // Build term map with all searchable variants
    MEDICAL_TERMS.forEach((term) => {
      this.termMap.set(term.term.toLowerCase(), term);
      term.synonyms.forEach((synonym) => {
        this.termMap.set(synonym.toLowerCase(), term);
      });
      term.abbreviations.forEach((abbr) => {
        this.termMap.set(abbr.toLowerCase(), term);
      });
    });
  }

  /**
   * Find medical term by search string
   */
  findTerm(search: string): MedicalTerm | undefined {
    return this.termMap.get(search.toLowerCase());
  }

  /**
   * Expand medical abbreviation
   */
  expandAbbreviation(abbreviation: string): string | undefined {
    return this.abbreviationMap.get(abbreviation.toUpperCase());
  }

  /**
   * Apply phonetic correction
   */
  correctPhonetic(phrase: string): string {
    const lower = phrase.toLowerCase();
    return this.phoneticMap.get(lower) || phrase;
  }

  /**
   * Process transcript with medical vocabulary
   */
  processTranscript(transcript: string): string {
    let processed = transcript;

    // Apply phonetic corrections
    this.phoneticMap.forEach((correct, incorrect) => {
      const regex = new RegExp(incorrect, "gi");
      processed = processed.replace(regex, correct);
    });

    // Expand common abbreviations (but preserve when intentional)
    const words = processed.split(/\s+/);
    const expandedWords = words.map((word) => {
      const cleanWord = word.replace(/[.,!?;:]$/, "");
      const punctuation = word.slice(cleanWord.length);
      const expanded = this.abbreviationMap.get(cleanWord.toUpperCase());
      return expanded ? expanded + punctuation : word;
    });

    return expandedWords.join(" ");
  }

  /**
   * Get vocabulary for specific medical specialty
   */
  getSpecialtyVocabulary(specialty: string): string[] {
    return CONTEXT_VOCABULARY[specialty.toLowerCase()] || [];
  }

  /**
   * Get all terms by category
   */
  getTermsByCategory(category: MedicalTermCategory): MedicalTerm[] {
    return MEDICAL_TERMS.filter((term) => term.category === category);
  }

  /**
   * Search terms with fuzzy matching
   */
  searchTerms(query: string, limit: number = 10): MedicalTerm[] {
    const lowerQuery = query.toLowerCase();
    const matches: { term: MedicalTerm; score: number }[] = [];

    this.termMap.forEach((term) => {
      const termLower = term.term.toLowerCase();
      if (termLower.includes(lowerQuery)) {
        const score = termLower.startsWith(lowerQuery) ? 2 : 1;
        matches.push({ term, score });
      }
    });

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => m.term);
  }

  /**
   * Validate medical term
   */
  isValidMedicalTerm(term: string): boolean {
    return this.termMap.has(term.toLowerCase());
  }

  /**
   * Get term with codes (ICD-10, SNOMED, LOINC)
   */
  getTermWithCodes(term: string): MedicalTerm | undefined {
    const found = this.findTerm(term);
    if (found && (found.icd10 || found.snomed || found.loinc)) {
      return found;
    }
    return undefined;
  }
}

// Singleton instance
export const medicalVocabulary = new MedicalVocabularyService();
