/**
 * LOINC (Logical Observation Identifiers Names and Codes)
 * Standard codes for laboratory and clinical observations
 */

export interface LOINCCode {
  code: string;
  component: string;
  property: string;
  timing: string;
  system: string;
  scale: string;
  method: string;
  displayName: string;
  commonName?: string;
  relatedNames?: string[];
  unit?: string;
  category:
    | "chemistry"
    | "hematology"
    | "microbiology"
    | "immunology"
    | "pathology"
    | "molecular"
    | "toxicology"
    | "endocrinology"
    | "coagulation";
}

export const LOINC_CODES: Record<string, LOINCCode> = {
  // CHEMISTRY
  "2345-7": {
    code: "2345-7",
    component: "Glucose",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Glucose [Mass/volume] in Serum or Plasma",
    commonName: "Blood Glucose",
    unit: "mg/dL",
    category: "chemistry",
  },
  "2160-0": {
    code: "2160-0",
    component: "Creatinine",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Creatinine [Mass/volume] in Serum or Plasma",
    commonName: "Serum Creatinine",
    unit: "mg/dL",
    category: "chemistry",
  },
  "2951-2": {
    code: "2951-2",
    component: "Sodium",
    property: "SCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Sodium [Moles/volume] in Serum or Plasma",
    commonName: "Sodium",
    unit: "mmol/L",
    category: "chemistry",
  },
  "2823-3": {
    code: "2823-3",
    component: "Potassium",
    property: "SCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Potassium [Moles/volume] in Serum or Plasma",
    commonName: "Potassium",
    unit: "mmol/L",
    category: "chemistry",
  },
  "2075-0": {
    code: "2075-0",
    component: "Chloride",
    property: "SCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Chloride [Moles/volume] in Serum or Plasma",
    commonName: "Chloride",
    unit: "mmol/L",
    category: "chemistry",
  },
  "2028-9": {
    code: "2028-9",
    component: "Carbon dioxide",
    property: "SCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Carbon dioxide, total [Moles/volume] in Serum or Plasma",
    commonName: "CO2",
    unit: "mmol/L",
    category: "chemistry",
  },
  "3094-0": {
    code: "3094-0",
    component: "Urea nitrogen",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Urea nitrogen [Mass/volume] in Serum or Plasma",
    commonName: "BUN",
    unit: "mg/dL",
    category: "chemistry",
  },
  "1742-6": {
    code: "1742-6",
    component: "Alanine aminotransferase",
    property: "CCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName:
      "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
    commonName: "ALT",
    unit: "U/L",
    category: "chemistry",
  },
  "1920-8": {
    code: "1920-8",
    component: "Aspartate aminotransferase",
    property: "CCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName:
      "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
    commonName: "AST",
    unit: "U/L",
    category: "chemistry",
  },
  "1975-2": {
    code: "1975-2",
    component: "Bilirubin.total",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Bilirubin.total [Mass/volume] in Serum or Plasma",
    commonName: "Total Bilirubin",
    unit: "mg/dL",
    category: "chemistry",
  },
  "17861-6": {
    code: "17861-6",
    component: "Calcium",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Calcium [Mass/volume] in Serum or Plasma",
    commonName: "Calcium",
    unit: "mg/dL",
    category: "chemistry",
  },

  // HEMATOLOGY
  "6690-2": {
    code: "6690-2",
    component: "Leukocytes",
    property: "NCnc",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "",
    displayName: "Leukocytes [#/volume] in Blood by Automated count",
    commonName: "WBC",
    unit: "10*3/uL",
    category: "hematology",
  },
  "789-8": {
    code: "789-8",
    component: "Erythrocytes",
    property: "NCnc",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "",
    displayName: "Erythrocytes [#/volume] in Blood by Automated count",
    commonName: "RBC",
    unit: "10*6/uL",
    category: "hematology",
  },
  "718-7": {
    code: "718-7",
    component: "Hemoglobin",
    property: "MCnc",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "",
    displayName: "Hemoglobin [Mass/volume] in Blood",
    commonName: "Hemoglobin",
    unit: "g/dL",
    category: "hematology",
  },
  "4544-3": {
    code: "4544-3",
    component: "Hematocrit",
    property: "VFr",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "",
    displayName: "Hematocrit [Volume Fraction] of Blood by Automated count",
    commonName: "Hematocrit",
    unit: "%",
    category: "hematology",
  },
  "787-2": {
    code: "787-2",
    component: "MCV",
    property: "EntVol",
    timing: "Pt",
    system: "RBC",
    scale: "Qn",
    method: "",
    displayName: "MCV [Entitic volume] by Automated count",
    commonName: "MCV",
    unit: "fL",
    category: "hematology",
  },
  "785-6": {
    code: "785-6",
    component: "MCH",
    property: "EntMass",
    timing: "Pt",
    system: "RBC",
    scale: "Qn",
    method: "",
    displayName: "MCH [Entitic mass] by Automated count",
    commonName: "MCH",
    unit: "pg",
    category: "hematology",
  },
  "786-4": {
    code: "786-4",
    component: "MCHC",
    property: "MCnc",
    timing: "Pt",
    system: "RBC",
    scale: "Qn",
    method: "",
    displayName: "MCHC [Mass/volume] by Automated count",
    commonName: "MCHC",
    unit: "g/dL",
    category: "hematology",
  },
  "777-3": {
    code: "777-3",
    component: "Platelets",
    property: "NCnc",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "",
    displayName: "Platelets [#/volume] in Blood by Automated count",
    commonName: "Platelets",
    unit: "10*3/uL",
    category: "hematology",
  },

  // COAGULATION
  "5902-2": {
    code: "5902-2",
    component: "Prothrombin time",
    property: "Time",
    timing: "Pt",
    system: "PPP",
    scale: "Qn",
    method: "",
    displayName: "Prothrombin time (PT)",
    commonName: "PT",
    unit: "sec",
    category: "coagulation",
  },
  "6301-6": {
    code: "6301-6",
    component: "INR",
    property: "Ratio",
    timing: "Pt",
    system: "PPP",
    scale: "Qn",
    method: "",
    displayName: "INR in Platelet poor plasma by Coagulation assay",
    commonName: "INR",
    unit: "{INR}",
    category: "coagulation",
  },
  "3173-2": {
    code: "3173-2",
    component: "aPTT",
    property: "Time",
    timing: "Pt",
    system: "PPP",
    scale: "Qn",
    method: "",
    displayName: "aPTT in Platelet poor plasma by Coagulation assay",
    commonName: "aPTT",
    unit: "sec",
    category: "coagulation",
  },

  // ENDOCRINOLOGY
  "1558-6": {
    code: "1558-6",
    component: "Fasting glucose",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Fasting glucose [Mass/volume] in Serum or Plasma",
    commonName: "Fasting Glucose",
    unit: "mg/dL",
    category: "endocrinology",
  },
  "4548-4": {
    code: "4548-4",
    component: "Hemoglobin A1c",
    property: "MFr",
    timing: "Pt",
    system: "Bld",
    scale: "Qn",
    method: "HPLC",
    displayName: "Hemoglobin A1c/Hemoglobin.total in Blood",
    commonName: "HbA1c",
    unit: "%",
    category: "endocrinology",
  },
  "3016-3": {
    code: "3016-3",
    component: "Thyrotropin",
    property: "SCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Thyrotropin [Units/volume] in Serum or Plasma",
    commonName: "TSH",
    unit: "uIU/mL",
    category: "endocrinology",
  },
  "3051-0": {
    code: "3051-0",
    component: "Thyroxine (T4) free",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Thyroxine (T4) free [Mass/volume] in Serum or Plasma",
    commonName: "Free T4",
    unit: "ng/dL",
    category: "endocrinology",
  },

  // IMMUNOLOGY
  "1988-5": {
    code: "1988-5",
    component: "C-reactive protein",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "C reactive protein [Mass/volume] in Serum or Plasma",
    commonName: "CRP",
    unit: "mg/L",
    category: "immunology",
  },

  // MICROBIOLOGY
  "600-7": {
    code: "600-7",
    component: "Bacteria identified",
    property: "Prid",
    timing: "Pt",
    system: "Specimen",
    scale: "Nom",
    method: "Culture",
    displayName: "Bacteria identified in Specimen by Culture",
    commonName: "Bacterial Culture",
    category: "microbiology",
  },
  "630-4": {
    code: "630-4",
    component: "Bacteria identified",
    property: "Prid",
    timing: "Pt",
    system: "Urine",
    scale: "Nom",
    method: "Culture",
    displayName: "Bacteria identified in Urine by Culture",
    commonName: "Urine Culture",
    category: "microbiology",
  },

  // LIPID PANEL
  "2093-3": {
    code: "2093-3",
    component: "Cholesterol.total",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Cholesterol [Mass/volume] in Serum or Plasma",
    commonName: "Total Cholesterol",
    unit: "mg/dL",
    category: "chemistry",
  },
  "2571-8": {
    code: "2571-8",
    component: "Triglyceride",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Triglyceride [Mass/volume] in Serum or Plasma",
    commonName: "Triglycerides",
    unit: "mg/dL",
    category: "chemistry",
  },
  "2085-9": {
    code: "2085-9",
    component: "Cholesterol in HDL",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "",
    displayName: "Cholesterol in HDL [Mass/volume] in Serum or Plasma",
    commonName: "HDL Cholesterol",
    unit: "mg/dL",
    category: "chemistry",
  },
  "13457-7": {
    code: "13457-7",
    component: "Cholesterol in LDL",
    property: "MCnc",
    timing: "Pt",
    system: "Ser/Plas",
    scale: "Qn",
    method: "Calculated",
    displayName:
      "Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation",
    commonName: "LDL Cholesterol (calc)",
    unit: "mg/dL",
    category: "chemistry",
  },
};

export const COMMON_PANELS = {
  CMP: {
    name: "Comprehensive Metabolic Panel",
    code: "24323-8",
    tests: [
      "2345-7",
      "2160-0",
      "2951-2",
      "2823-3",
      "2075-0",
      "2028-9",
      "3094-0",
      "1742-6",
      "1920-8",
      "1975-2",
      "17861-6",
    ],
  },
  BMP: {
    name: "Basic Metabolic Panel",
    code: "24324-6",
    tests: [
      "2345-7",
      "2160-0",
      "2951-2",
      "2823-3",
      "2075-0",
      "2028-9",
      "3094-0",
      "17861-6",
    ],
  },
  CBC: {
    name: "Complete Blood Count",
    code: "58410-2",
    tests: [
      "6690-2",
      "789-8",
      "718-7",
      "4544-3",
      "787-2",
      "785-6",
      "786-4",
      "777-3",
    ],
  },
  LIPID: {
    name: "Lipid Panel",
    code: "24331-1",
    tests: ["2093-3", "2571-8", "2085-9", "13457-7"],
  },
  HEPATIC: {
    name: "Hepatic Function Panel",
    code: "24325-3",
    tests: ["1742-6", "1920-8", "1975-2", "17861-6"],
  },
  THYROID: {
    name: "Thyroid Panel",
    code: "24348-5",
    tests: ["3016-3", "3051-0"],
  },
  COAG: {
    name: "Coagulation Panel",
    code: "34714-6",
    tests: ["5902-2", "6301-6", "3173-2"],
  },
};

export function getLOINCCode(code: string): LOINCCode | undefined {
  return LOINC_CODES[code];
}

export function getLOINCCodesByCategory(
  category: LOINCCode["category"],
): LOINCCode[] {
  return Object.values(LOINC_CODES).filter(
    (loinc) => loinc.category === category,
  );
}

export function searchLOINCCodes(query: string): LOINCCode[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(LOINC_CODES).filter(
    (loinc) =>
      loinc.displayName.toLowerCase().includes(lowerQuery) ||
      loinc.commonName?.toLowerCase().includes(lowerQuery) ||
      loinc.component.toLowerCase().includes(lowerQuery) ||
      loinc.code.includes(query),
  );
}
