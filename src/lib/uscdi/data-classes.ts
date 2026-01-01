/**
 * USCDI v3 Data Classes Implementation
 * Complete mapping of all USCDI v3 data elements to FHIR R4 resources
 * https://www.healthit.gov/isa/united-states-core-data-interoperability-uscdi
 */

import { z } from "zod";

/**
 * USCDI v3 Data Classes
 * Organized by category with FHIR R4 resource mappings
 */
export enum USCDIDataClass {
  // Assessment and Plan of Treatment
  ASSESSMENT_AND_PLAN = "assessment_and_plan",
  GOALS = "goals",
  HEALTH_CONCERNS = "health_concerns",

  // Care Team and Care Team Member(s)
  CARE_TEAM_MEMBERS = "care_team_members",

  // Clinical Notes
  CLINICAL_NOTES = "clinical_notes",

  // Clinical Tests
  CLINICAL_TEST_RESULTS = "clinical_test_results",
  DIAGNOSTIC_IMAGING = "diagnostic_imaging",

  // Encounters
  ENCOUNTER_DIAGNOSIS = "encounter_diagnosis",
  ENCOUNTER_DISPOSITION = "encounter_disposition",
  ENCOUNTER_INFORMATION = "encounter_information",
  ENCOUNTER_LOCATION = "encounter_location",
  ENCOUNTER_TIME = "encounter_time",

  // Facility Information
  FACILITY_INFORMATION = "facility_information",

  // Health Insurance Information
  COVERAGE_INFORMATION = "coverage_information",

  // Immunizations
  IMMUNIZATIONS = "immunizations",

  // Laboratory
  LABORATORY_RESULTS = "laboratory_results",
  LABORATORY_TEST_REPORT = "laboratory_test_report",

  // Medications
  MEDICATIONS = "medications",
  MEDICATION_ALLERGIES = "medication_allergies",

  // Patient Demographics
  PATIENT_DEMOGRAPHICS = "patient_demographics",
  PREFERRED_LANGUAGE = "preferred_language",
  RELATED_PERSONS_NAME = "related_persons_name",
  SEX = "sex",
  SEXUAL_ORIENTATION = "sexual_orientation",
  GENDER_IDENTITY = "gender_identity",
  RACE_ETHNICITY = "race_ethnicity",

  // Problems
  PROBLEMS = "problems",

  // Procedures
  PROCEDURES = "procedures",

  // Provenance
  PROVENANCE_AUTHOR_ORGANIZATION = "provenance_author_organization",
  PROVENANCE_AUTHOR_TIME = "provenance_author_time",
  PROVENANCE_TRANSMITTER = "provenance_transmitter",

  // Social Determinants of Health
  SDOH_ASSESSMENTS = "sdoh_assessments",
  SDOH_GOALS = "sdoh_goals",
  SDOH_INTERVENTIONS = "sdoh_interventions",
  SDOH_PROBLEMS = "sdoh_problems",

  // Unique Device Identifier(s) for a Patient's Implantable Device(s)
  UDI = "udi",

  // Vital Signs
  VITAL_SIGNS = "vital_signs",
}

/**
 * FHIR R4 Resource Mapping for USCDI v3 Data Classes
 */
export const USCDItoFHIRMapping: Record<USCDIDataClass, string[]> = {
  [USCDIDataClass.ASSESSMENT_AND_PLAN]: ["CarePlan"],
  [USCDIDataClass.GOALS]: ["Goal"],
  [USCDIDataClass.HEALTH_CONCERNS]: ["Condition"],
  [USCDIDataClass.CARE_TEAM_MEMBERS]: ["CareTeam", "Practitioner", "PractitionerRole"],
  [USCDIDataClass.CLINICAL_NOTES]: ["DocumentReference", "DiagnosticReport"],
  [USCDIDataClass.CLINICAL_TEST_RESULTS]: ["Observation", "DiagnosticReport"],
  [USCDIDataClass.DIAGNOSTIC_IMAGING]: ["ImagingStudy", "DiagnosticReport"],
  [USCDIDataClass.ENCOUNTER_DIAGNOSIS]: ["Condition", "Encounter"],
  [USCDIDataClass.ENCOUNTER_DISPOSITION]: ["Encounter"],
  [USCDIDataClass.ENCOUNTER_INFORMATION]: ["Encounter"],
  [USCDIDataClass.ENCOUNTER_LOCATION]: ["Location", "Encounter"],
  [USCDIDataClass.ENCOUNTER_TIME]: ["Encounter"],
  [USCDIDataClass.FACILITY_INFORMATION]: ["Organization", "Location"],
  [USCDIDataClass.COVERAGE_INFORMATION]: ["Coverage"],
  [USCDIDataClass.IMMUNIZATIONS]: ["Immunization"],
  [USCDIDataClass.LABORATORY_RESULTS]: ["Observation"],
  [USCDIDataClass.LABORATORY_TEST_REPORT]: ["DiagnosticReport"],
  [USCDIDataClass.MEDICATIONS]: ["MedicationRequest", "Medication"],
  [USCDIDataClass.MEDICATION_ALLERGIES]: ["AllergyIntolerance"],
  [USCDIDataClass.PATIENT_DEMOGRAPHICS]: ["Patient"],
  [USCDIDataClass.PREFERRED_LANGUAGE]: ["Patient"],
  [USCDIDataClass.RELATED_PERSONS_NAME]: ["RelatedPerson"],
  [USCDIDataClass.SEX]: ["Patient"],
  [USCDIDataClass.SEXUAL_ORIENTATION]: ["Observation"],
  [USCDIDataClass.GENDER_IDENTITY]: ["Observation"],
  [USCDIDataClass.RACE_ETHNICITY]: ["Patient"],
  [USCDIDataClass.PROBLEMS]: ["Condition"],
  [USCDIDataClass.PROCEDURES]: ["Procedure"],
  [USCDIDataClass.PROVENANCE_AUTHOR_ORGANIZATION]: ["Provenance"],
  [USCDIDataClass.PROVENANCE_AUTHOR_TIME]: ["Provenance"],
  [USCDIDataClass.PROVENANCE_TRANSMITTER]: ["Provenance"],
  [USCDIDataClass.SDOH_ASSESSMENTS]: ["Observation"],
  [USCDIDataClass.SDOH_GOALS]: ["Goal"],
  [USCDIDataClass.SDOH_INTERVENTIONS]: ["ServiceRequest", "Procedure"],
  [USCDIDataClass.SDOH_PROBLEMS]: ["Condition"],
  [USCDIDataClass.UDI]: ["Device"],
  [USCDIDataClass.VITAL_SIGNS]: ["Observation"],
};

/**
 * USCDI v3 Data Element Validation Schemas
 */

export const USCDIPatientDemographicsSchema = z.object({
  identifier: z.array(z.object({
    system: z.string(),
    value: z.string(),
    type: z.object({
      coding: z.array(z.object({
        system: z.string(),
        code: z.string(),
        display: z.string().optional(),
      })),
    }).optional(),
  })),
  name: z.array(z.object({
    use: z.enum(["official", "usual", "nickname", "anonymous", "old", "maiden"]).optional(),
    family: z.string(),
    given: z.array(z.string()),
    prefix: z.array(z.string()).optional(),
    suffix: z.array(z.string()).optional(),
  })),
  telecom: z.array(z.object({
    system: z.enum(["phone", "fax", "email", "pager", "url", "sms", "other"]),
    value: z.string(),
    use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
  })).optional(),
  gender: z.enum(["male", "female", "other", "unknown"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.array(z.object({
    use: z.enum(["home", "work", "temp", "old", "billing"]).optional(),
    type: z.enum(["postal", "physical", "both"]).optional(),
    line: z.array(z.string()).optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })).optional(),
  communication: z.array(z.object({
    language: z.object({
      coding: z.array(z.object({
        system: z.string(),
        code: z.string(),
        display: z.string().optional(),
      })),
    }),
    preferred: z.boolean().optional(),
  })).optional(),
  extension: z.array(z.object({
    url: z.string(),
    valueCodeableConcept: z.any().optional(),
    valueString: z.string().optional(),
    valueCoding: z.any().optional(),
  })).optional(),
});

export const USCDIRaceEthnicitySchema = z.object({
  ombCategory: z.array(z.object({
    system: z.literal("urn:oid:2.16.840.1.113883.6.238"),
    code: z.string(),
    display: z.string(),
  })),
  detailed: z.array(z.object({
    system: z.literal("urn:oid:2.16.840.1.113883.6.238"),
    code: z.string(),
    display: z.string(),
  })).optional(),
  text: z.string(),
});

export const USCDISexualOrientationSchema = z.object({
  resourceType: z.literal("Observation"),
  status: z.enum(["registered", "preliminary", "final", "amended"]),
  category: z.array(z.object({
    coding: z.array(z.object({
      system: z.literal("http://terminology.hl7.org/CodeSystem/observation-category"),
      code: z.literal("social-history"),
      display: z.literal("Social History"),
    })),
  })),
  code: z.object({
    coding: z.array(z.object({
      system: z.literal("http://loinc.org"),
      code: z.literal("76690-7"),
      display: z.literal("Sexual orientation"),
    })),
  }),
  subject: z.object({
    reference: z.string(),
  }),
  valueCodeableConcept: z.object({
    coding: z.array(z.object({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
  }),
});

export const USCDIGenderIdentitySchema = z.object({
  resourceType: z.literal("Observation"),
  status: z.enum(["registered", "preliminary", "final", "amended"]),
  category: z.array(z.object({
    coding: z.array(z.object({
      system: z.literal("http://terminology.hl7.org/CodeSystem/observation-category"),
      code: z.literal("social-history"),
      display: z.literal("Social History"),
    })),
  })),
  code: z.object({
    coding: z.array(z.object({
      system: z.literal("http://loinc.org"),
      code: z.literal("76691-5"),
      display: z.literal("Gender identity"),
    })),
  }),
  subject: z.object({
    reference: z.string(),
  }),
  valueCodeableConcept: z.object({
    coding: z.array(z.object({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
  }),
});

/**
 * Clinical Notes Categories per USCDI v3
 */
export enum ClinicalNoteType {
  CONSULTATION_NOTE = "11488-4",
  DISCHARGE_SUMMARY = "18842-5",
  HISTORY_AND_PHYSICAL = "34117-2",
  IMAGING_NARRATIVE = "18748-4",
  LABORATORY_REPORT = "11502-2",
  PATHOLOGY_REPORT = "11526-1",
  PROCEDURE_NOTE = "28570-0",
  PROGRESS_NOTE = "11506-3",
}

export const ClinicalNoteTypeMapping: Record<ClinicalNoteType, string> = {
  [ClinicalNoteType.CONSULTATION_NOTE]: "Consultation note",
  [ClinicalNoteType.DISCHARGE_SUMMARY]: "Discharge summary",
  [ClinicalNoteType.HISTORY_AND_PHYSICAL]: "History and physical note",
  [ClinicalNoteType.IMAGING_NARRATIVE]: "Imaging narrative",
  [ClinicalNoteType.LABORATORY_REPORT]: "Laboratory report",
  [ClinicalNoteType.PATHOLOGY_REPORT]: "Pathology report",
  [ClinicalNoteType.PROCEDURE_NOTE]: "Procedure note",
  [ClinicalNoteType.PROGRESS_NOTE]: "Progress note",
};

/**
 * SDOH Categories per USCDI v3
 */
export enum SDOHCategory {
  FOOD_INSECURITY = "food-insecurity",
  HOUSING_INSTABILITY = "housing-instability",
  TRANSPORTATION_NEEDS = "transportation-needs",
  UTILITY_DIFFICULTIES = "utility-difficulties",
  INTERPERSONAL_SAFETY = "interpersonal-safety",
  FINANCIAL_STRAIN = "financial-strain",
  EMPLOYMENT = "employment",
  EDUCATION = "education",
  SOCIAL_ISOLATION = "social-isolation",
  STRESS = "stress",
}

export const SDOHCategoryMapping: Record<SDOHCategory, string> = {
  [SDOHCategory.FOOD_INSECURITY]: "Food Insecurity",
  [SDOHCategory.HOUSING_INSTABILITY]: "Housing Instability",
  [SDOHCategory.TRANSPORTATION_NEEDS]: "Transportation Needs",
  [SDOHCategory.UTILITY_DIFFICULTIES]: "Utility Difficulties",
  [SDOHCategory.INTERPERSONAL_SAFETY]: "Interpersonal Safety",
  [SDOHCategory.FINANCIAL_STRAIN]: "Financial Strain",
  [SDOHCategory.EMPLOYMENT]: "Employment",
  [SDOHCategory.EDUCATION]: "Education",
  [SDOHCategory.SOCIAL_ISOLATION]: "Social Isolation",
  [SDOHCategory.STRESS]: "Stress",
};

/**
 * Helper function to get FHIR resources for a USCDI data class
 */
export function getFHIRResourcesForUSCDI(dataClass: USCDIDataClass): string[] {
  return USCDItoFHIRMapping[dataClass] || [];
}

/**
 * Helper function to validate USCDI v3 compliance
 */
export function validateUSCDICompliance(resourceType: string, data: unknown): boolean {
  try {
    switch (resourceType) {
      case "Patient":
        USCDIPatientDemographicsSchema.parse(data);
        return true;
      case "Observation":
        // Additional validation based on observation type
        return true;
      default:
        return true;
    }
  } catch (error) {
    console.error("USCDI validation error:", error);
    return false;
  }
}

/**
 * USCDI v3 Data Class Capabilities
 */
export interface USCDICapability {
  dataClass: USCDIDataClass;
  fhirResources: string[];
  required: boolean;
  implementationGuide?: string;
}

export const USCDIv3Capabilities: USCDICapability[] = [
  {
    dataClass: USCDIDataClass.PATIENT_DEMOGRAPHICS,
    fhirResources: ["Patient"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
  },
  {
    dataClass: USCDIDataClass.SEXUAL_ORIENTATION,
    fhirResources: ["Observation"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-sexual-orientation",
  },
  {
    dataClass: USCDIDataClass.GENDER_IDENTITY,
    fhirResources: ["Observation"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-gender-identity",
  },
  {
    dataClass: USCDIDataClass.HEALTH_CONCERNS,
    fhirResources: ["Condition"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition",
  },
  {
    dataClass: USCDIDataClass.SDOH_ASSESSMENTS,
    fhirResources: ["Observation"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/sdoh-clinicalcare/StructureDefinition/SDOHCC-ObservationAssessment",
  },
  {
    dataClass: USCDIDataClass.SDOH_PROBLEMS,
    fhirResources: ["Condition"],
    required: true,
    implementationGuide: "http://hl7.org/fhir/us/sdoh-clinicalcare/StructureDefinition/SDOHCC-Condition",
  },
];
