/**
 * FHIR R4 Resource Types and Utilities
 * Type-safe FHIR resource definitions and helpers
 */

import { z } from "zod";

// Common FHIR data types
export const CodingSchema = z.object({
  system: z.string().optional(),
  version: z.string().optional(),
  code: z.string().optional(),
  display: z.string().optional(),
  userSelected: z.boolean().optional(),
});

export const CodeableConceptSchema = z.object({
  coding: z.array(CodingSchema).optional(),
  text: z.string().optional(),
});

export const IdentifierSchema = z.object({
  use: z.enum(["usual", "official", "temp", "secondary", "old"]).optional(),
  type: CodeableConceptSchema.optional(),
  system: z.string().optional(),
  value: z.string().optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

export const HumanNameSchema = z.object({
  use: z
    .enum([
      "usual",
      "official",
      "temp",
      "nickname",
      "anonymous",
      "old",
      "maiden",
    ])
    .optional(),
  text: z.string().optional(),
  family: z.string().optional(),
  given: z.array(z.string()).optional(),
  prefix: z.array(z.string()).optional(),
  suffix: z.array(z.string()).optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

export const AddressSchema = z.object({
  use: z.enum(["home", "work", "temp", "old", "billing"]).optional(),
  type: z.enum(["postal", "physical", "both"]).optional(),
  text: z.string().optional(),
  line: z.array(z.string()).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

export const ContactPointSchema = z.object({
  system: z
    .enum(["phone", "fax", "email", "pager", "url", "sms", "other"])
    .optional(),
  value: z.string().optional(),
  use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
  rank: z.number().optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
});

export const ReferenceSchema = z.object({
  reference: z.string().optional(),
  type: z.string().optional(),
  identifier: IdentifierSchema.optional(),
  display: z.string().optional(),
});

// Patient Resource
export const PatientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string().optional(),
  meta: z
    .object({
      versionId: z.string().optional(),
      lastUpdated: z.string().optional(),
      profile: z.array(z.string()).optional(),
    })
    .optional(),
  identifier: z.array(IdentifierSchema).optional(),
  active: z.boolean().optional(),
  name: z.array(HumanNameSchema).optional(),
  telecom: z.array(ContactPointSchema).optional(),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  birthDate: z.string().optional(),
  deceasedBoolean: z.boolean().optional(),
  deceasedDateTime: z.string().optional(),
  address: z.array(AddressSchema).optional(),
  maritalStatus: CodeableConceptSchema.optional(),
  multipleBirthBoolean: z.boolean().optional(),
  multipleBirthInteger: z.number().optional(),
  photo: z
    .array(
      z.object({
        contentType: z.string().optional(),
        url: z.string().optional(),
        data: z.string().optional(),
      }),
    )
    .optional(),
  contact: z
    .array(
      z.object({
        relationship: z.array(CodeableConceptSchema).optional(),
        name: HumanNameSchema.optional(),
        telecom: z.array(ContactPointSchema).optional(),
        address: AddressSchema.optional(),
        gender: z.enum(["male", "female", "other", "unknown"]).optional(),
      }),
    )
    .optional(),
  communication: z
    .array(
      z.object({
        language: CodeableConceptSchema,
        preferred: z.boolean().optional(),
      }),
    )
    .optional(),
  generalPractitioner: z.array(ReferenceSchema).optional(),
  managingOrganization: ReferenceSchema.optional(),
});

// Observation Resource
export const ObservationSchema = z.object({
  resourceType: z.literal("Observation"),
  id: z.string().optional(),
  meta: z.any().optional(),
  status: z.enum([
    "registered",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "cancelled",
    "entered-in-error",
    "unknown",
  ]),
  category: z.array(CodeableConceptSchema).optional(),
  code: CodeableConceptSchema,
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  effectiveDateTime: z.string().optional(),
  effectivePeriod: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  issued: z.string().optional(),
  performer: z.array(ReferenceSchema).optional(),
  valueQuantity: z
    .object({
      value: z.number().optional(),
      comparator: z.enum(["<", "<=", ">=", ">"]).optional(),
      unit: z.string().optional(),
      system: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
  valueCodeableConcept: CodeableConceptSchema.optional(),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  valueInteger: z.number().optional(),
  valueRange: z
    .object({
      low: z.any().optional(),
      high: z.any().optional(),
    })
    .optional(),
  interpretation: z.array(CodeableConceptSchema).optional(),
  note: z
    .array(
      z.object({
        text: z.string(),
        authorReference: ReferenceSchema.optional(),
        time: z.string().optional(),
      }),
    )
    .optional(),
  referenceRange: z
    .array(
      z.object({
        low: z.any().optional(),
        high: z.any().optional(),
        type: CodeableConceptSchema.optional(),
        text: z.string().optional(),
      }),
    )
    .optional(),
  component: z.array(z.any()).optional(),
});

// Encounter Resource
export const EncounterSchema = z.object({
  resourceType: z.literal("Encounter"),
  id: z.string().optional(),
  meta: z.any().optional(),
  status: z.enum([
    "planned",
    "arrived",
    "triaged",
    "in-progress",
    "onleave",
    "finished",
    "cancelled",
    "entered-in-error",
    "unknown",
  ]),
  class: CodingSchema,
  type: z.array(CodeableConceptSchema).optional(),
  priority: CodeableConceptSchema.optional(),
  subject: ReferenceSchema.optional(),
  participant: z
    .array(
      z.object({
        type: z.array(CodeableConceptSchema).optional(),
        period: z
          .object({
            start: z.string().optional(),
            end: z.string().optional(),
          })
          .optional(),
        individual: ReferenceSchema.optional(),
      }),
    )
    .optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  diagnosis: z
    .array(
      z.object({
        condition: ReferenceSchema,
        use: CodeableConceptSchema.optional(),
        rank: z.number().optional(),
      }),
    )
    .optional(),
  location: z
    .array(
      z.object({
        location: ReferenceSchema,
        status: z
          .enum(["planned", "active", "reserved", "completed"])
          .optional(),
        period: z
          .object({
            start: z.string().optional(),
            end: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
  serviceProvider: ReferenceSchema.optional(),
});

// Medication Request Resource
export const MedicationRequestSchema = z.object({
  resourceType: z.literal("MedicationRequest"),
  id: z.string().optional(),
  meta: z.any().optional(),
  status: z.enum([
    "active",
    "on-hold",
    "cancelled",
    "completed",
    "entered-in-error",
    "stopped",
    "draft",
    "unknown",
  ]),
  intent: z.enum([
    "proposal",
    "plan",
    "order",
    "original-order",
    "reflex-order",
    "filler-order",
    "instance-order",
    "option",
  ]),
  medicationCodeableConcept: CodeableConceptSchema.optional(),
  medicationReference: ReferenceSchema.optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  authoredOn: z.string().optional(),
  requester: ReferenceSchema.optional(),
  performer: ReferenceSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  dosageInstruction: z
    .array(
      z.object({
        sequence: z.number().optional(),
        text: z.string().optional(),
        timing: z.any().optional(),
        route: CodeableConceptSchema.optional(),
        doseAndRate: z
          .array(
            z.object({
              type: CodeableConceptSchema.optional(),
              doseQuantity: z.any().optional(),
              rateRatio: z.any().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  dispenseRequest: z
    .object({
      validityPeriod: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
      numberOfRepeatsAllowed: z.number().optional(),
      quantity: z.any().optional(),
      expectedSupplyDuration: z.any().optional(),
    })
    .optional(),
});

// Condition Resource
export const ConditionSchema = z.object({
  resourceType: z.literal("Condition"),
  id: z.string().optional(),
  meta: z.any().optional(),
  clinicalStatus: CodeableConceptSchema.optional(),
  verificationStatus: CodeableConceptSchema.optional(),
  category: z.array(CodeableConceptSchema).optional(),
  severity: CodeableConceptSchema.optional(),
  code: CodeableConceptSchema.optional(),
  bodySite: z.array(CodeableConceptSchema).optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  onsetDateTime: z.string().optional(),
  onsetAge: z.any().optional(),
  onsetPeriod: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  abatementDateTime: z.string().optional(),
  recordedDate: z.string().optional(),
  recorder: ReferenceSchema.optional(),
  note: z
    .array(
      z.object({
        text: z.string(),
      }),
    )
    .optional(),
});

// DiagnosticReport Resource
export const DiagnosticReportSchema = z.object({
  resourceType: z.literal("DiagnosticReport"),
  id: z.string().optional(),
  meta: z.any().optional(),
  status: z.enum([
    "registered",
    "partial",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "appended",
    "cancelled",
    "entered-in-error",
    "unknown",
  ]),
  category: z.array(CodeableConceptSchema).optional(),
  code: CodeableConceptSchema,
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  effectiveDateTime: z.string().optional(),
  issued: z.string().optional(),
  performer: z.array(ReferenceSchema).optional(),
  result: z.array(ReferenceSchema).optional(),
  conclusion: z.string().optional(),
  conclusionCode: z.array(CodeableConceptSchema).optional(),
  presentedForm: z
    .array(
      z.object({
        contentType: z.string(),
        data: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .optional(),
});

// Appointment Resource
export const AppointmentSchema = z.object({
  resourceType: z.literal("Appointment"),
  id: z.string().optional(),
  meta: z.any().optional(),
  status: z.enum([
    "proposed",
    "pending",
    "booked",
    "arrived",
    "fulfilled",
    "cancelled",
    "noshow",
    "entered-in-error",
    "checked-in",
    "waitlist",
  ]),
  serviceCategory: z.array(CodeableConceptSchema).optional(),
  serviceType: z.array(CodeableConceptSchema).optional(),
  specialty: z.array(CodeableConceptSchema).optional(),
  appointmentType: CodeableConceptSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  priority: z.number().optional(),
  description: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  minutesDuration: z.number().optional(),
  participant: z.array(
    z.object({
      type: z.array(CodeableConceptSchema).optional(),
      actor: ReferenceSchema.optional(),
      required: z.enum(["required", "optional", "information-only"]).optional(),
      status: z.enum(["accepted", "declined", "tentative", "needs-action"]),
    }),
  ),
  comment: z.string().optional(),
});

// Bundle Resource
export const BundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  id: z.string().optional(),
  meta: z.any().optional(),
  type: z.enum([
    "document",
    "message",
    "transaction",
    "transaction-response",
    "batch",
    "batch-response",
    "history",
    "searchset",
    "collection",
  ]),
  total: z.number().optional(),
  link: z
    .array(
      z.object({
        relation: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
  entry: z
    .array(
      z.object({
        fullUrl: z.string().optional(),
        resource: z.any().optional(),
        request: z
          .object({
            method: z.enum(["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"]),
            url: z.string(),
          })
          .optional(),
        response: z
          .object({
            status: z.string(),
            location: z.string().optional(),
            etag: z.string().optional(),
            lastModified: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export type Coding = z.infer<typeof CodingSchema>;
export type CodeableConcept = z.infer<typeof CodeableConceptSchema>;
export type Identifier = z.infer<typeof IdentifierSchema>;
export type HumanName = z.infer<typeof HumanNameSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ContactPoint = z.infer<typeof ContactPointSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type Encounter = z.infer<typeof EncounterSchema>;
export type MedicationRequest = z.infer<typeof MedicationRequestSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type Bundle = z.infer<typeof BundleSchema>;

/**
 * Create a FHIR reference
 */
export function createReference(
  resourceType: string,
  id: string,
  display?: string,
): Reference {
  return {
    reference: `${resourceType}/${id}`,
    type: resourceType,
    display,
  };
}

/**
 * Create a CodeableConcept
 */
export function createCodeableConcept(
  system: string,
  code: string,
  display?: string,
): CodeableConcept {
  return {
    coding: [
      {
        system,
        code,
        display,
      },
    ],
    text: display,
  };
}

/**
 * Create a FHIR Identifier
 */
export function createIdentifier(
  system: string,
  value: string,
  use?: "usual" | "official" | "temp" | "secondary" | "old",
): Identifier {
  return {
    use,
    system,
    value,
  };
}

/**
 * Extract resource from bundle entry
 */
export function extractResources<T = any>(bundle: Bundle): T[] {
  return bundle.entry?.map((e) => e.resource).filter(Boolean) || [];
}

/**
 * Create a transaction bundle
 */
export function createTransactionBundle(
  entries: Array<{
    resource: any;
    request: {
      method: "GET" | "POST" | "PUT" | "DELETE";
      url: string;
    };
  }>,
): Bundle {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: entries.map((e) => ({
      resource: e.resource,
      request: e.request,
    })),
  };
}

/**
 * Create a search bundle
 */
export function createSearchBundle(resources: any[], total?: number): Bundle {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: total ?? resources.length,
    entry: resources.map((resource) => ({
      resource,
      fullUrl: resource.id
        ? `${resource.resourceType}/${resource.id}`
        : undefined,
    })),
  };
}
