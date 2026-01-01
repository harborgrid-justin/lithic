/**
 * FHIR Procedure Resource Transformer
 * Transform between internal procedure data and FHIR R4 Procedure resource
 */

import { createReference, createCodeableConcept } from "../resources";

export interface Procedure {
  resourceType: "Procedure";
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
  status:
    | "preparation"
    | "in-progress"
    | "not-done"
    | "on-hold"
    | "stopped"
    | "completed"
    | "entered-in-error"
    | "unknown";
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject: {
    reference?: string;
    display?: string;
  };
  encounter?: {
    reference?: string;
    display?: string;
  };
  performedDateTime?: string;
  performedPeriod?: {
    start?: string;
    end?: string;
  };
  performer?: Array<{
    function?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    actor: {
      reference?: string;
      display?: string;
    };
  }>;
  location?: {
    reference?: string;
    display?: string;
  };
  reasonCode?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  bodySite?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  outcome?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  complication?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  note?: Array<{
    text: string;
    time?: string;
  }>;
  usedReference?: Array<{
    reference?: string;
    display?: string;
  }>;
}

export interface InternalProcedure {
  id: string;
  patientId: string;
  encounterId?: string | null;
  code: string;
  codeSystem: string;
  display: string;
  status:
    | "PREPARATION"
    | "IN_PROGRESS"
    | "NOT_DONE"
    | "ON_HOLD"
    | "STOPPED"
    | "COMPLETED"
    | "ENTERED_IN_ERROR";
  category?: string | null;
  performedDate?: Date | null;
  performedStartDate?: Date | null;
  performedEndDate?: Date | null;
  performerId?: string | null;
  performerName?: string | null;
  performerFunction?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  reasonForProcedure?: string | null;
  reasonCode?: string | null;
  reasonCodeSystem?: string | null;
  bodySite?: string | null;
  bodySiteCode?: string | null;
  outcome?: string | null;
  outcomeCode?: string | null;
  complications?: string | null;
  notes?: string | null;
  usedDeviceIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal procedure to FHIR Procedure resource
 */
export function procedureToFHIR(procedure: InternalProcedure): Procedure {
  const statusMap: Record<string, Procedure["status"]> = {
    PREPARATION: "preparation",
    IN_PROGRESS: "in-progress",
    NOT_DONE: "not-done",
    ON_HOLD: "on-hold",
    STOPPED: "stopped",
    COMPLETED: "completed",
    ENTERED_IN_ERROR: "entered-in-error",
  };

  const fhirProcedure: Procedure = {
    resourceType: "Procedure",
    id: procedure.id,
    meta: {
      lastUpdated:
        procedure.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure",
      ],
    },
    status: statusMap[procedure.status] || "completed",
    code: createCodeableConcept(
      procedure.codeSystem,
      procedure.code,
      procedure.display,
    ),
    subject: createReference("Patient", procedure.patientId),
  };

  // Add encounter
  if (procedure.encounterId) {
    fhirProcedure.encounter = createReference(
      "Encounter",
      procedure.encounterId,
    );
  }

  // Add performed date/period
  if (procedure.performedDate) {
    fhirProcedure.performedDateTime = procedure.performedDate.toISOString();
  } else if (procedure.performedStartDate || procedure.performedEndDate) {
    fhirProcedure.performedPeriod = {
      start: procedure.performedStartDate?.toISOString(),
      end: procedure.performedEndDate?.toISOString(),
    };
  }

  // Add performer
  if (procedure.performerId) {
    fhirProcedure.performer = [
      {
        function: procedure.performerFunction
          ? createCodeableConcept(
              "http://snomed.info/sct",
              procedure.performerFunction,
            )
          : undefined,
        actor: createReference(
          "Practitioner",
          procedure.performerId,
          procedure.performerName,
        ),
      },
    ];
  }

  // Add location
  if (procedure.locationId) {
    fhirProcedure.location = createReference(
      "Location",
      procedure.locationId,
      procedure.locationName,
    );
  }

  // Add reason
  if (procedure.reasonForProcedure || procedure.reasonCode) {
    fhirProcedure.reasonCode = [
      procedure.reasonCode
        ? createCodeableConcept(
            procedure.reasonCodeSystem || "http://snomed.info/sct",
            procedure.reasonCode,
            procedure.reasonForProcedure,
          )
        : { text: procedure.reasonForProcedure },
    ];
  }

  // Add body site
  if (procedure.bodySite || procedure.bodySiteCode) {
    fhirProcedure.bodySite = [
      createCodeableConcept(
        "http://snomed.info/sct",
        procedure.bodySiteCode || "",
        procedure.bodySite,
      ),
    ];
  }

  // Add outcome
  if (procedure.outcome || procedure.outcomeCode) {
    fhirProcedure.outcome = procedure.outcomeCode
      ? createCodeableConcept(
          "http://snomed.info/sct",
          procedure.outcomeCode,
          procedure.outcome,
        )
      : { text: procedure.outcome };
  }

  // Add complications
  if (procedure.complications) {
    fhirProcedure.complication = [{ text: procedure.complications }];
  }

  // Add notes
  if (procedure.notes) {
    fhirProcedure.note = [{ text: procedure.notes }];
  }

  // Add used devices
  if (procedure.usedDeviceIds && procedure.usedDeviceIds.length > 0) {
    fhirProcedure.usedReference = procedure.usedDeviceIds.map((id) =>
      createReference("Device", id),
    );
  }

  return fhirProcedure;
}

/**
 * Transform FHIR Procedure resource to internal procedure data
 */
export function procedureFromFHIR(
  fhirProcedure: Procedure,
): Partial<InternalProcedure> {
  const statusMap: Record<Procedure["status"], InternalProcedure["status"]> = {
    preparation: "PREPARATION",
    "in-progress": "IN_PROGRESS",
    "not-done": "NOT_DONE",
    "on-hold": "ON_HOLD",
    stopped: "STOPPED",
    completed: "COMPLETED",
    "entered-in-error": "ENTERED_IN_ERROR",
    unknown: "COMPLETED",
  };

  const patientId = fhirProcedure.subject.reference?.split("/")?.[1] || "";
  const encounterId = fhirProcedure.encounter?.reference?.split("/")?.[1];
  const performer = fhirProcedure.performer?.[0];
  const performerId = performer?.actor.reference?.split("/")?.[1];

  const internalProcedure: Partial<InternalProcedure> = {
    id: fhirProcedure.id,
    patientId,
    encounterId,
    code: fhirProcedure.code.coding?.[0]?.code || "",
    codeSystem: fhirProcedure.code.coding?.[0]?.system || "",
    display:
      fhirProcedure.code.text || fhirProcedure.code.coding?.[0]?.display || "",
    status: statusMap[fhirProcedure.status] || "COMPLETED",
    performedDate: fhirProcedure.performedDateTime
      ? new Date(fhirProcedure.performedDateTime)
      : undefined,
    performedStartDate: fhirProcedure.performedPeriod?.start
      ? new Date(fhirProcedure.performedPeriod.start)
      : undefined,
    performedEndDate: fhirProcedure.performedPeriod?.end
      ? new Date(fhirProcedure.performedPeriod.end)
      : undefined,
    performerId,
    performerName: performer?.actor.display,
    performerFunction: performer?.function?.coding?.[0]?.code,
    locationId: fhirProcedure.location?.reference?.split("/")?.[1],
    locationName: fhirProcedure.location?.display,
    reasonForProcedure:
      fhirProcedure.reasonCode?.[0]?.text ||
      fhirProcedure.reasonCode?.[0]?.coding?.[0]?.display,
    reasonCode: fhirProcedure.reasonCode?.[0]?.coding?.[0]?.code,
    reasonCodeSystem: fhirProcedure.reasonCode?.[0]?.coding?.[0]?.system,
    bodySite:
      fhirProcedure.bodySite?.[0]?.text ||
      fhirProcedure.bodySite?.[0]?.coding?.[0]?.display,
    bodySiteCode: fhirProcedure.bodySite?.[0]?.coding?.[0]?.code,
    outcome:
      fhirProcedure.outcome?.text ||
      fhirProcedure.outcome?.coding?.[0]?.display,
    outcomeCode: fhirProcedure.outcome?.coding?.[0]?.code,
    complications: fhirProcedure.complication?.[0]?.text,
    notes: fhirProcedure.note?.[0]?.text,
    usedDeviceIds: fhirProcedure.usedReference
      ?.map((ref) => ref.reference?.split("/")?.[1] || "")
      .filter(Boolean),
    updatedAt: fhirProcedure.meta?.lastUpdated
      ? new Date(fhirProcedure.meta.lastUpdated)
      : undefined,
  };

  return internalProcedure;
}

/**
 * Validate procedure data for FHIR conversion
 */
export function validateProcedure(procedure: Partial<InternalProcedure>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!procedure.patientId) errors.push("Patient ID is required");
  if (!procedure.code) errors.push("Code is required");
  if (!procedure.codeSystem) errors.push("Code system is required");
  if (!procedure.status) errors.push("Status is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}
