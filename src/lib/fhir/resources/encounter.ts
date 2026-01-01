/**
 * FHIR Encounter Resource Transformer
 * Transform between internal encounter data and FHIR R4 Encounter resource
 */

import type { Encounter } from "../resources";
import { createReference, createCodeableConcept } from "../resources";

export interface InternalEncounter {
  id: string;
  patientId: string;
  type: string;
  typeDisplay?: string | null;
  status:
    | "PLANNED"
    | "ARRIVED"
    | "TRIAGED"
    | "IN_PROGRESS"
    | "ON_LEAVE"
    | "FINISHED"
    | "CANCELLED"
    | "ENTERED_IN_ERROR";
  class: string;
  classDisplay?: string | null;
  priority?: string | null;
  startDate: Date;
  endDate?: Date | null;
  providerId?: string | null;
  providerName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  serviceProviderId?: string | null;
  reasonForVisit?: string | null;
  reasonCode?: string | null;
  reasonCodeSystem?: string | null;
  chiefComplaint?: string | null;
  diagnosisIds?: string[];
  length?: number | null; // in minutes
  admissionSource?: string | null;
  dischargeDisposition?: string | null;
  appointmentId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal encounter to FHIR Encounter resource
 */
export function encounterToFHIR(encounter: InternalEncounter): Encounter {
  const statusMap: Record<string, Encounter["status"]> = {
    PLANNED: "planned",
    ARRIVED: "arrived",
    TRIAGED: "triaged",
    IN_PROGRESS: "in-progress",
    ON_LEAVE: "onleave",
    FINISHED: "finished",
    CANCELLED: "cancelled",
    ENTERED_IN_ERROR: "entered-in-error",
  };

  const classCodeMap: Record<string, { code: string; display: string }> = {
    AMB: { code: "AMB", display: "ambulatory" },
    EMER: { code: "EMER", display: "emergency" },
    IMP: { code: "IMP", display: "inpatient encounter" },
    ACUTE: { code: "ACUTE", display: "inpatient acute" },
    NONAC: { code: "NONAC", display: "inpatient non-acute" },
    OBSENC: { code: "OBSENC", display: "observation encounter" },
    PRENC: { code: "PRENC", display: "pre-admission" },
    SS: { code: "SS", display: "short stay" },
    VR: { code: "VR", display: "virtual" },
  };

  const classInfo = classCodeMap[encounter.class] || {
    code: encounter.class,
    display: encounter.classDisplay || encounter.class,
  };

  const fhirEncounter: Encounter = {
    resourceType: "Encounter",
    id: encounter.id,
    meta: {
      lastUpdated:
        encounter.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
      ],
    },
    status: statusMap[encounter.status] || "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: classInfo.code,
      display: classInfo.display,
    },
    subject: createReference("Patient", encounter.patientId),
    period: {
      start: encounter.startDate.toISOString(),
      end: encounter.endDate?.toISOString(),
    },
  };

  // Add type
  if (encounter.type) {
    fhirEncounter.type = [
      createCodeableConcept(
        "http://snomed.info/sct",
        encounter.type,
        encounter.typeDisplay,
      ),
    ];
  }

  // Add priority
  if (encounter.priority) {
    fhirEncounter.priority = createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
      encounter.priority,
    );
  }

  // Add participant (provider)
  if (encounter.providerId) {
    fhirEncounter.participant = [
      {
        type: [
          createCodeableConcept(
            "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
            "PPRF",
            "primary performer",
          ),
        ],
        individual: createReference(
          "Practitioner",
          encounter.providerId,
          encounter.providerName,
        ),
      },
    ];
  }

  // Add location
  if (encounter.locationId) {
    fhirEncounter.location = [
      {
        location: createReference(
          "Location",
          encounter.locationId,
          encounter.locationName,
        ),
        status: encounter.status === "IN_PROGRESS" ? "active" : "completed",
      },
    ];
  }

  // Add reason for visit
  if (encounter.reasonForVisit || encounter.reasonCode) {
    fhirEncounter.reasonCode = [
      encounter.reasonCode
        ? createCodeableConcept(
            encounter.reasonCodeSystem || "http://snomed.info/sct",
            encounter.reasonCode,
            encounter.reasonForVisit,
          )
        : { text: encounter.reasonForVisit },
    ];
  }

  // Add diagnoses
  if (encounter.diagnosisIds && encounter.diagnosisIds.length > 0) {
    fhirEncounter.diagnosis = encounter.diagnosisIds.map((id, index) => ({
      condition: createReference("Condition", id),
      use:
        index === 0
          ? createCodeableConcept(
              "http://terminology.hl7.org/CodeSystem/diagnosis-role",
              "AD",
              "Admission diagnosis",
            )
          : undefined,
      rank: index + 1,
    }));
  }

  // Add service provider (organization)
  if (encounter.serviceProviderId) {
    fhirEncounter.serviceProvider = createReference(
      "Organization",
      encounter.serviceProviderId,
    );
  }

  // Add appointment reference
  if (encounter.appointmentId) {
    // Appointment reference would be in extension or basedOn
  }

  return fhirEncounter;
}

/**
 * Transform FHIR Encounter resource to internal encounter data
 */
export function encounterFromFHIR(
  fhirEncounter: Encounter,
): Partial<InternalEncounter> {
  const statusMap: Record<Encounter["status"], InternalEncounter["status"]> = {
    planned: "PLANNED",
    arrived: "ARRIVED",
    triaged: "TRIAGED",
    "in-progress": "IN_PROGRESS",
    onleave: "ON_LEAVE",
    finished: "FINISHED",
    cancelled: "CANCELLED",
    "entered-in-error": "ENTERED_IN_ERROR",
    unknown: "PLANNED",
  };

  const patientId = fhirEncounter.subject?.reference?.split("/")?.[1] || "";
  const provider = fhirEncounter.participant?.find((p) =>
    p.type?.some((t) => t.coding?.some((c) => c.code === "PPRF")),
  );
  const location = fhirEncounter.location?.[0];

  const internalEncounter: Partial<InternalEncounter> = {
    id: fhirEncounter.id,
    patientId,
    status: statusMap[fhirEncounter.status] || "PLANNED",
    class: fhirEncounter.class.code || "",
    classDisplay: fhirEncounter.class.display,
    type: fhirEncounter.type?.[0]?.coding?.[0]?.code || "",
    typeDisplay:
      fhirEncounter.type?.[0]?.coding?.[0]?.display ||
      fhirEncounter.type?.[0]?.text,
    priority: fhirEncounter.priority?.coding?.[0]?.code,
    startDate: fhirEncounter.period?.start
      ? new Date(fhirEncounter.period.start)
      : new Date(),
    endDate: fhirEncounter.period?.end
      ? new Date(fhirEncounter.period.end)
      : undefined,
    providerId: provider?.individual?.reference?.split("/")?.[1],
    providerName: provider?.individual?.display,
    locationId: location?.location.reference?.split("/")?.[1],
    locationName: location?.location.display,
    reasonForVisit:
      fhirEncounter.reasonCode?.[0]?.text ||
      fhirEncounter.reasonCode?.[0]?.coding?.[0]?.display,
    reasonCode: fhirEncounter.reasonCode?.[0]?.coding?.[0]?.code,
    reasonCodeSystem: fhirEncounter.reasonCode?.[0]?.coding?.[0]?.system,
    diagnosisIds: fhirEncounter.diagnosis
      ?.map((d) => d.condition.reference?.split("/")?.[1] || "")
      .filter(Boolean),
    serviceProviderId:
      fhirEncounter.serviceProvider?.reference?.split("/")?.[1],
    updatedAt: fhirEncounter.meta?.lastUpdated
      ? new Date(fhirEncounter.meta.lastUpdated)
      : undefined,
  };

  // Calculate length in minutes
  if (internalEncounter.startDate && internalEncounter.endDate) {
    internalEncounter.length = Math.round(
      (internalEncounter.endDate.getTime() -
        internalEncounter.startDate.getTime()) /
        60000,
    );
  }

  return internalEncounter;
}

/**
 * Validate encounter data for FHIR conversion
 */
export function validateEncounter(encounter: Partial<InternalEncounter>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!encounter.patientId) errors.push("Patient ID is required");
  if (!encounter.status) errors.push("Status is required");
  if (!encounter.class) errors.push("Class is required");
  if (!encounter.startDate) errors.push("Start date is required");

  // Validate dates
  if (
    encounter.startDate &&
    encounter.endDate &&
    encounter.startDate > encounter.endDate
  ) {
    errors.push("Start date cannot be after end date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
