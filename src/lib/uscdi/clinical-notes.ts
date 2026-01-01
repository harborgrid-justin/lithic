/**
 * USCDI v3 Clinical Notes Implementation
 * Support for all clinical note types and C-CDA documents
 */

import { z } from "zod";

/**
 * Clinical Note Types per USCDI v3
 * Using LOINC codes
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
  OPERATIVE_NOTE = "11504-8",
  NURSES_NOTE = "34746-8",
  EMERGENCY_DEPARTMENT_NOTE = "34111-5",
  RADIOLOGY_NOTE = "18726-0",
}

export const ClinicalNoteTypeDisplay: Record<ClinicalNoteType, string> = {
  [ClinicalNoteType.CONSULTATION_NOTE]: "Consultation note",
  [ClinicalNoteType.DISCHARGE_SUMMARY]: "Discharge summary",
  [ClinicalNoteType.HISTORY_AND_PHYSICAL]: "History and physical note",
  [ClinicalNoteType.IMAGING_NARRATIVE]: "Imaging narrative",
  [ClinicalNoteType.LABORATORY_REPORT]: "Laboratory report",
  [ClinicalNoteType.PATHOLOGY_REPORT]: "Pathology report",
  [ClinicalNoteType.PROCEDURE_NOTE]: "Procedure note",
  [ClinicalNoteType.PROGRESS_NOTE]: "Progress note",
  [ClinicalNoteType.OPERATIVE_NOTE]: "Operative note",
  [ClinicalNoteType.NURSES_NOTE]: "Nurse note",
  [ClinicalNoteType.EMERGENCY_DEPARTMENT_NOTE]: "Emergency department note",
  [ClinicalNoteType.RADIOLOGY_NOTE]: "Radiology note",
};

/**
 * Clinical Note Document Types
 */
export enum ClinicalDocumentType {
  CCDA = "ccda",
  PLAIN_TEXT = "text/plain",
  HTML = "text/html",
  PDF = "application/pdf",
  XML = "application/xml",
  FHIR_JSON = "application/fhir+json",
}

/**
 * C-CDA Document Types
 */
export enum CCDADocumentType {
  CONTINUITY_OF_CARE = "34133-9",
  CONSULTATION_NOTE = "11488-4",
  DISCHARGE_SUMMARY = "18842-5",
  HISTORY_AND_PHYSICAL = "34117-2",
  OPERATIVE_NOTE = "11504-8",
  PROCEDURE_NOTE = "28570-0",
  PROGRESS_NOTE = "11506-3",
  REFERRAL_NOTE = "57133-1",
  TRANSFER_SUMMARY = "18761-7",
  CARE_PLAN = "52521-2",
}

export const CCDADocumentTypeDisplay: Record<CCDADocumentType, string> = {
  [CCDADocumentType.CONTINUITY_OF_CARE]: "Continuity of Care Document (CCD)",
  [CCDADocumentType.CONSULTATION_NOTE]: "Consultation Note",
  [CCDADocumentType.DISCHARGE_SUMMARY]: "Discharge Summary",
  [CCDADocumentType.HISTORY_AND_PHYSICAL]: "History and Physical",
  [CCDADocumentType.OPERATIVE_NOTE]: "Operative Note",
  [CCDADocumentType.PROCEDURE_NOTE]: "Procedure Note",
  [CCDADocumentType.PROGRESS_NOTE]: "Progress Note",
  [CCDADocumentType.REFERRAL_NOTE]: "Referral Note",
  [CCDADocumentType.TRANSFER_SUMMARY]: "Transfer Summary",
  [CCDADocumentType.CARE_PLAN]: "Care Plan",
};

/**
 * Clinical Note Status
 */
export enum DocumentStatus {
  CURRENT = "current",
  SUPERSEDED = "superseded",
  ENTERED_IN_ERROR = "entered-in-error",
}

/**
 * Document Reference Content
 */
export interface DocumentContent {
  attachment: {
    contentType: string;
    language?: string;
    data?: string; // Base64 encoded
    url?: string;
    size?: number;
    hash?: string; // SHA-1 hash
    title?: string;
    creation?: string;
  };
  format?: {
    system: string;
    code: string;
    display?: string;
  };
}

/**
 * Clinical Note Metadata
 */
export interface ClinicalNoteMetadata {
  id?: string;
  resourceType: "DocumentReference";
  status: DocumentStatus;
  docStatus?: "preliminary" | "final" | "amended" | "entered-in-error";
  type: {
    coding: Array<{
      system: "http://loinc.org";
      code: ClinicalNoteType | CCDADocumentType;
      display: string;
    }>;
  };
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  subject: {
    reference: string;
    display?: string;
  };
  date?: string;
  author?: Array<{
    reference: string;
    display?: string;
  }>;
  authenticator?: {
    reference: string;
    display?: string;
  };
  custodian?: {
    reference: string;
    display?: string;
  };
  description?: string;
  securityLabel?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  content: DocumentContent[];
  context?: {
    encounter?: Array<{
      reference: string;
    }>;
    event?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    }>;
    period?: {
      start?: string;
      end?: string;
    };
    facilityType?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    practiceSetting?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
  };
}

/**
 * Note Section Types
 */
export enum NoteSectionType {
  CHIEF_COMPLAINT = "10154-3",
  HISTORY_OF_PRESENT_ILLNESS = "10164-2",
  PAST_MEDICAL_HISTORY = "11348-0",
  MEDICATIONS = "10160-0",
  ALLERGIES = "48765-2",
  FAMILY_HISTORY = "10157-6",
  SOCIAL_HISTORY = "29762-2",
  PHYSICAL_EXAM = "29545-1",
  ASSESSMENT = "51848-0",
  PLAN = "18776-5",
  ASSESSMENT_AND_PLAN = "51847-2",
  DIAGNOSTIC_RESULTS = "30954-2",
  VITAL_SIGNS = "8716-3",
  REVIEW_OF_SYSTEMS = "10187-3",
  PROCEDURES = "47519-4",
  IMMUNIZATIONS = "11369-6",
}

export const NoteSectionDisplay: Record<NoteSectionType, string> = {
  [NoteSectionType.CHIEF_COMPLAINT]: "Chief complaint",
  [NoteSectionType.HISTORY_OF_PRESENT_ILLNESS]: "History of present illness",
  [NoteSectionType.PAST_MEDICAL_HISTORY]: "Past medical history",
  [NoteSectionType.MEDICATIONS]: "Medications",
  [NoteSectionType.ALLERGIES]: "Allergies",
  [NoteSectionType.FAMILY_HISTORY]: "Family history",
  [NoteSectionType.SOCIAL_HISTORY]: "Social history",
  [NoteSectionType.PHYSICAL_EXAM]: "Physical examination",
  [NoteSectionType.ASSESSMENT]: "Assessment",
  [NoteSectionType.PLAN]: "Plan",
  [NoteSectionType.ASSESSMENT_AND_PLAN]: "Assessment and plan",
  [NoteSectionType.DIAGNOSTIC_RESULTS]: "Diagnostic results",
  [NoteSectionType.VITAL_SIGNS]: "Vital signs",
  [NoteSectionType.REVIEW_OF_SYSTEMS]: "Review of systems",
  [NoteSectionType.PROCEDURES]: "Procedures",
  [NoteSectionType.IMMUNIZATIONS]: "Immunizations",
};

/**
 * Helper function to create a clinical note document reference
 */
export function createClinicalNoteDocument(
  patientId: string,
  noteType: ClinicalNoteType | CCDADocumentType,
  content: string,
  contentType: string,
  authorId?: string,
  encounterId?: string,
  metadata?: Partial<ClinicalNoteMetadata>
): ClinicalNoteMetadata {
  const display =
    ClinicalNoteTypeDisplay[noteType as ClinicalNoteType] ||
    CCDADocumentTypeDisplay[noteType as CCDADocumentType];

  return {
    resourceType: "DocumentReference",
    status: DocumentStatus.CURRENT,
    docStatus: "final",
    type: {
      coding: [
        {
          system: "http://loinc.org",
          code: noteType,
          display,
        },
      ],
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    date: new Date().toISOString(),
    author: authorId
      ? [
          {
            reference: `Practitioner/${authorId}`,
          },
        ]
      : undefined,
    content: [
      {
        attachment: {
          contentType,
          data: Buffer.from(content).toString("base64"),
          creation: new Date().toISOString(),
        },
      },
    ],
    context: encounterId
      ? {
          encounter: [
            {
              reference: `Encounter/${encounterId}`,
            },
          ],
        }
      : undefined,
    ...metadata,
  };
}

/**
 * Helper function to create a C-CDA document reference
 */
export function createCCDADocument(
  patientId: string,
  documentType: CCDADocumentType,
  ccdaXml: string,
  authorId?: string,
  metadata?: Partial<ClinicalNoteMetadata>
): ClinicalNoteMetadata {
  return {
    resourceType: "DocumentReference",
    status: DocumentStatus.CURRENT,
    docStatus: "final",
    type: {
      coding: [
        {
          system: "http://loinc.org",
          code: documentType,
          display: CCDADocumentTypeDisplay[documentType],
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category",
            code: "clinical-note",
            display: "Clinical Note",
          },
        ],
      },
    ],
    subject: {
      reference: `Patient/${patientId}`,
    },
    date: new Date().toISOString(),
    author: authorId
      ? [
          {
            reference: `Practitioner/${authorId}`,
          },
        ]
      : undefined,
    content: [
      {
        attachment: {
          contentType: "application/xml",
          data: Buffer.from(ccdaXml).toString("base64"),
          creation: new Date().toISOString(),
        },
        format: {
          system: "http://ihe.net/fhir/ValueSet/IHE.FormatCode.codesystem",
          code: "urn:hl7-org:sdwg:ccda-structuredBody:2.1",
          display: "C-CDA Structured Body",
        },
      },
    ],
    ...metadata,
  };
}

/**
 * Note Validation Schemas
 */
export const ClinicalNoteSchema = z.object({
  resourceType: z.literal("DocumentReference"),
  status: z.nativeEnum(DocumentStatus),
  docStatus: z.enum(["preliminary", "final", "amended", "entered-in-error"]).optional(),
  type: z.object({
    coding: z.array(
      z.object({
        system: z.literal("http://loinc.org"),
        code: z.string(),
        display: z.string(),
      })
    ),
  }),
  subject: z.object({
    reference: z.string(),
    display: z.string().optional(),
  }),
  date: z.string().optional(),
  author: z
    .array(
      z.object({
        reference: z.string(),
        display: z.string().optional(),
      })
    )
    .optional(),
  content: z.array(
    z.object({
      attachment: z.object({
        contentType: z.string(),
        language: z.string().optional(),
        data: z.string().optional(),
        url: z.string().optional(),
        size: z.number().optional(),
        hash: z.string().optional(),
        title: z.string().optional(),
        creation: z.string().optional(),
      }),
      format: z
        .object({
          system: z.string(),
          code: z.string(),
          display: z.string().optional(),
        })
        .optional(),
    })
  ),
});

/**
 * Helper to validate clinical note
 */
export function validateClinicalNote(note: unknown): boolean {
  try {
    ClinicalNoteSchema.parse(note);
    return true;
  } catch (error) {
    console.error("Clinical note validation error:", error);
    return false;
  }
}

/**
 * Helper to extract text from clinical note
 */
export function extractNoteText(note: ClinicalNoteMetadata): string | null {
  const content = note.content[0];
  if (!content) return null;

  if (content.attachment.data) {
    try {
      return Buffer.from(content.attachment.data, "base64").toString("utf-8");
    } catch (error) {
      console.error("Error decoding note content:", error);
      return null;
    }
  }

  return null;
}

/**
 * Helper to search notes by type
 */
export function filterNotesByType(
  notes: ClinicalNoteMetadata[],
  noteType: ClinicalNoteType | CCDADocumentType
): ClinicalNoteMetadata[] {
  return notes.filter((note) =>
    note.type.coding.some((coding) => coding.code === noteType)
  );
}

/**
 * Helper to get most recent note
 */
export function getMostRecentNote(
  notes: ClinicalNoteMetadata[]
): ClinicalNoteMetadata | null {
  if (notes.length === 0) return null;

  return notes.reduce((latest, current) => {
    const latestDate = latest.date ? new Date(latest.date) : new Date(0);
    const currentDate = current.date ? new Date(current.date) : new Date(0);
    return currentDate > latestDate ? current : latest;
  });
}
