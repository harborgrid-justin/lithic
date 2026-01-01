/**
 * USCDI v3 Patient Demographics Implementation
 * Extended demographics including sexual orientation, gender identity, and granular race/ethnicity
 */

import { z } from "zod";

/**
 * US Core Race Extension
 * Based on OMB (Office of Management and Budget) categories
 */
export interface USCoreRaceExtension {
  url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race";
  extension: Array<{
    url: "ombCategory" | "detailed" | "text";
    valueCoding?: {
      system: "urn:oid:2.16.840.1.113883.6.238";
      code: string;
      display: string;
    };
    valueString?: string;
  }>;
}

/**
 * OMB Race Categories
 */
export enum OMBRaceCategory {
  AMERICAN_INDIAN_OR_ALASKA_NATIVE = "1002-5",
  ASIAN = "2028-9",
  BLACK_OR_AFRICAN_AMERICAN = "2054-5",
  NATIVE_HAWAIIAN_OR_OTHER_PACIFIC_ISLANDER = "2076-8",
  WHITE = "2106-3",
}

export const OMBRaceCategoryDisplay: Record<OMBRaceCategory, string> = {
  [OMBRaceCategory.AMERICAN_INDIAN_OR_ALASKA_NATIVE]: "American Indian or Alaska Native",
  [OMBRaceCategory.ASIAN]: "Asian",
  [OMBRaceCategory.BLACK_OR_AFRICAN_AMERICAN]: "Black or African American",
  [OMBRaceCategory.NATIVE_HAWAIIAN_OR_OTHER_PACIFIC_ISLANDER]: "Native Hawaiian or Other Pacific Islander",
  [OMBRaceCategory.WHITE]: "White",
};

/**
 * Detailed Race Categories (subset of examples)
 */
export const DetailedRaceCodes: Record<string, string> = {
  "1004-1": "American Indian",
  "1006-6": "Abenaki",
  "1008-2": "Algonquian",
  "1010-8": "Apache",
  "1011-6": "Chiricahua",
  "1012-4": "Fort Sill Apache",
  "1013-2": "Jicarilla Apache",
  "1014-0": "Lipan Apache",
  "1015-7": "Mescalero Apache",
  "1016-5": "Oklahoma Apache",
  "1017-3": "Payson Apache",
  "1018-1": "San Carlos Apache",
  "1019-9": "White Mountain Apache",
  "2029-7": "Asian Indian",
  "2030-5": "Bangladeshi",
  "2031-3": "Bhutanese",
  "2032-1": "Burmese",
  "2033-9": "Cambodian",
  "2034-7": "Chinese",
  "2035-4": "Taiwanese",
  "2036-2": "Filipino",
  "2037-0": "Hmong",
  "2038-8": "Indonesian",
  "2039-6": "Japanese",
  "2040-4": "Korean",
  "2041-2": "Laotian",
  "2042-0": "Malaysian",
  "2043-8": "Okinawan",
  "2044-6": "Pakistani",
  "2045-3": "Sri Lankan",
  "2046-1": "Thai",
  "2047-9": "Vietnamese",
  "2056-0": "Black",
  "2058-6": "African American",
  "2060-2": "African",
  "2067-7": "Jamaican",
  "2068-5": "West Indian",
  "2079-2": "Polynesian",
  "2080-0": "Native Hawaiian",
  "2081-8": "Samoan",
  "2082-6": "Tahitian",
  "2083-4": "Tongan",
  "2085-9": "Micronesian",
  "2086-7": "Guamanian or Chamorro",
  "2087-5": "Guamanian",
  "2088-3": "Chamorro",
  "2089-1": "Mariana Islander",
  "2090-9": "Marshallese",
  "2091-7": "Palauan",
  "2092-5": "Carolinian",
  "2093-3": "Kosraean",
  "2094-1": "Pohnpeian",
  "2095-8": "Saipanese",
  "2096-6": "Kiribati",
  "2097-4": "Chuukese",
  "2098-2": "Yapese",
  "2100-6": "Melanesian",
  "2101-4": "Fijian",
  "2102-2": "Papua New Guinean",
  "2103-0": "Solomon Islander",
  "2104-8": "New Hebrides",
  "2108-9": "European",
  "2109-7": "Armenian",
  "2110-5": "English",
  "2111-3": "French",
  "2112-1": "German",
  "2113-9": "Irish",
  "2114-7": "Italian",
  "2115-4": "Polish",
  "2116-2": "Scottish",
};

/**
 * US Core Ethnicity Extension
 */
export interface USCoreEthnicityExtension {
  url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity";
  extension: Array<{
    url: "ombCategory" | "detailed" | "text";
    valueCoding?: {
      system: "urn:oid:2.16.840.1.113883.6.238";
      code: string;
      display: string;
    };
    valueString?: string;
  }>;
}

/**
 * OMB Ethnicity Categories
 */
export enum OMBEthnicityCategory {
  HISPANIC_OR_LATINO = "2135-2",
  NOT_HISPANIC_OR_LATINO = "2186-5",
}

export const OMBethnicityCategoryDisplay: Record<OMBEthnicityCategory, string> = {
  [OMBEthnicityCategory.HISPANIC_OR_LATINO]: "Hispanic or Latino",
  [OMBEthnicityCategory.NOT_HISPANIC_OR_LATINO]: "Not Hispanic or Latino",
};

/**
 * Detailed Ethnicity Categories
 */
export const DetailedethnicityCodes: Record<string, string> = {
  "2137-8": "Spaniard",
  "2138-6": "Andalusian",
  "2139-4": "Asturian",
  "2140-2": "Castillian",
  "2141-0": "Catalonian",
  "2142-8": "Belearic Islander",
  "2143-6": "Gallego",
  "2144-4": "Valencian",
  "2145-1": "Canarian",
  "2146-9": "Spanish Basque",
  "2148-5": "Mexican",
  "2149-3": "Mexican American",
  "2150-1": "Mexicano",
  "2151-9": "Chicano",
  "2152-7": "La Raza",
  "2153-5": "Mexican American Indian",
  "2155-0": "Central American",
  "2156-8": "Costa Rican",
  "2157-6": "Guatemalan",
  "2158-4": "Honduran",
  "2159-2": "Nicaraguan",
  "2160-0": "Panamanian",
  "2161-8": "Salvadoran",
  "2162-6": "Central American Indian",
  "2165-9": "South American",
  "2166-7": "Argentinean",
  "2167-5": "Bolivian",
  "2168-3": "Chilean",
  "2169-1": "Colombian",
  "2170-9": "Ecuadorian",
  "2171-7": "Paraguayan",
  "2172-5": "Peruvian",
  "2173-3": "Uruguayan",
  "2174-1": "Venezuelan",
  "2175-8": "South American Indian",
  "2176-6": "Criollo",
  "2178-2": "Latin American",
  "2180-8": "Puerto Rican",
  "2182-4": "Cuban",
  "2184-0": "Dominican",
};

/**
 * US Core Birth Sex Extension
 */
export interface USCoreBirthSexExtension {
  url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex";
  valueCode: "F" | "M" | "UNK";
}

/**
 * Sexual Orientation Value Set
 * Based on LOINC and SNOMED CT
 */
export enum SexualOrientationCode {
  LESBIAN_OR_GAY = "38628009",
  STRAIGHT_OR_HETEROSEXUAL = "20430005",
  BISEXUAL = "42035005",
  SOMETHING_ELSE = "other",
  DONT_KNOW = "261665006",
  CHOOSE_NOT_TO_DISCLOSE = "asked-declined",
  PANSEXUAL = "pansexual",
  QUEER = "queer",
  ASEXUAL = "asexual",
}

export const SexualOrientationDisplay: Record<SexualOrientationCode, string> = {
  [SexualOrientationCode.LESBIAN_OR_GAY]: "Lesbian, gay or homosexual",
  [SexualOrientationCode.STRAIGHT_OR_HETEROSEXUAL]: "Straight or heterosexual",
  [SexualOrientationCode.BISEXUAL]: "Bisexual",
  [SexualOrientationCode.SOMETHING_ELSE]: "Something else",
  [SexualOrientationCode.DONT_KNOW]: "Don't know",
  [SexualOrientationCode.CHOOSE_NOT_TO_DISCLOSE]: "Choose not to disclose",
  [SexualOrientationCode.PANSEXUAL]: "Pansexual",
  [SexualOrientationCode.QUEER]: "Queer",
  [SexualOrientationCode.ASEXUAL]: "Asexual",
};

/**
 * Gender Identity Value Set
 */
export enum GenderIdentityCode {
  MALE = "446151000124109",
  FEMALE = "446141000124107",
  NON_BINARY = "nonbinary",
  TRANSGENDER_MALE = "407377005",
  TRANSGENDER_FEMALE = "407376001",
  OTHER = "other",
  UNKNOWN = "unknown",
  ASKED_DECLINED = "asked-declined",
}

export const GenderIdentityDisplay: Record<GenderIdentityCode, string> = {
  [GenderIdentityCode.MALE]: "Identifies as male",
  [GenderIdentityCode.FEMALE]: "Identifies as female",
  [GenderIdentityCode.NON_BINARY]: "Non-binary",
  [GenderIdentityCode.TRANSGENDER_MALE]: "Transgender male",
  [GenderIdentityCode.TRANSGENDER_FEMALE]: "Transgender female",
  [GenderIdentityCode.OTHER]: "Other",
  [GenderIdentityCode.UNKNOWN]: "Unknown",
  [GenderIdentityCode.ASKED_DECLINED]: "Asked but declined to answer",
};

/**
 * Pronouns Extension (emerging standard)
 */
export interface PronounsExtension {
  url: "http://hl7.org/fhir/StructureDefinition/individual-pronouns";
  extension: Array<{
    url: "value";
    valueCodeableConcept: {
      coding: Array<{
        system: "http://loinc.org";
        code: string;
        display: string;
      }>;
    };
  }>;
}

export enum PronounCode {
  HE_HIM_HIS = "LA29518-0",
  SHE_HER_HERS = "LA29519-8",
  THEY_THEM_THEIRS = "LA29520-6",
  OTHER = "LA46-8",
}

export const PronounDisplay: Record<PronounCode, string> = {
  [PronounCode.HE_HIM_HIS]: "he/him/his/his/himself",
  [PronounCode.SHE_HER_HERS]: "she/her/her/hers/herself",
  [PronounCode.THEY_THEM_THEIRS]: "they/them/their/theirs/themselves",
  [PronounCode.OTHER]: "Other",
};

/**
 * Helper function to create race extension
 */
export function createRaceExtension(
  ombCategories: OMBRaceCategory[],
  detailedCodes: string[] = [],
  text?: string
): USCoreRaceExtension {
  const extension: USCoreRaceExtension["extension"] = [];

  ombCategories.forEach((code) => {
    extension.push({
      url: "ombCategory",
      valueCoding: {
        system: "urn:oid:2.16.840.1.113883.6.238",
        code,
        display: OMBRaceCategoryDisplay[code],
      },
    });
  });

  detailedCodes.forEach((code) => {
    extension.push({
      url: "detailed",
      valueCoding: {
        system: "urn:oid:2.16.840.1.113883.6.238",
        code,
        display: DetailedRaceCodes[code] || code,
      },
    });
  });

  if (text) {
    extension.push({
      url: "text",
      valueString: text,
    });
  }

  return {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
    extension,
  };
}

/**
 * Helper function to create ethnicity extension
 */
export function createEthnicityExtension(
  ombCategory: OMBEthnicityCategory,
  detailedCodes: string[] = [],
  text?: string
): USCoreEthnicityExtension {
  const extension: USCoreEthnicityExtension["extension"] = [];

  extension.push({
    url: "ombCategory",
    valueCoding: {
      system: "urn:oid:2.16.840.1.113883.6.238",
      code: ombCategory,
      display: OMBethnicityCategoryDisplay[ombCategory],
    },
  });

  detailedCodes.forEach((code) => {
    extension.push({
      url: "detailed",
      valueCoding: {
        system: "urn:oid:2.16.840.1.113883.6.238",
        code,
        display: DetailedethnicityCodes[code] || code,
      },
    });
  });

  if (text) {
    extension.push({
      url: "text",
      valueString: text,
    });
  }

  return {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
    extension,
  };
}

/**
 * Helper function to create sexual orientation observation
 */
export function createSexualOrientationObservation(
  patientId: string,
  code: SexualOrientationCode,
  effectiveDate?: string
): object {
  return {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "social-history",
            display: "Social History",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "76690-7",
          display: "Sexual orientation",
        },
      ],
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    effectiveDateTime: effectiveDate || new Date().toISOString(),
    valueCodeableConcept: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code,
          display: SexualOrientationDisplay[code],
        },
      ],
      text: SexualOrientationDisplay[code],
    },
  };
}

/**
 * Helper function to create gender identity observation
 */
export function createGenderIdentityObservation(
  patientId: string,
  code: GenderIdentityCode,
  effectiveDate?: string
): object {
  return {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "social-history",
            display: "Social History",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "76691-5",
          display: "Gender identity",
        },
      ],
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    effectiveDateTime: effectiveDate || new Date().toISOString(),
    valueCodeableConcept: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code,
          display: GenderIdentityDisplay[code],
        },
      ],
      text: GenderIdentityDisplay[code],
    },
  };
}

/**
 * Validation schemas
 */
export const RaceExtensionSchema = z.object({
  url: z.literal("http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"),
  extension: z.array(
    z.object({
      url: z.enum(["ombCategory", "detailed", "text"]),
      valueCoding: z
        .object({
          system: z.literal("urn:oid:2.16.840.1.113883.6.238"),
          code: z.string(),
          display: z.string(),
        })
        .optional(),
      valueString: z.string().optional(),
    })
  ),
});

export const EthnicityExtensionSchema = z.object({
  url: z.literal("http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity"),
  extension: z.array(
    z.object({
      url: z.enum(["ombCategory", "detailed", "text"]),
      valueCoding: z
        .object({
          system: z.literal("urn:oid:2.16.840.1.113883.6.238"),
          code: z.string(),
          display: z.string(),
        })
        .optional(),
      valueString: z.string().optional(),
    })
  ),
});
