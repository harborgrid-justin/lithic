/**
 * FHIR Condition Resource Transformer
 * Transform between internal condition/diagnosis data and FHIR R4 Condition resource
 */

import type { Condition } from "../resources";
import { createReference, createCodeableConcept } from "../resources";

export interface InternalCondition {
  id: string;
  patientId: string;
  encounterId?: string | null;
  code: string;
  codeSystem: string;
  display: string;
  clinicalStatus:
    | "ACTIVE"
    | "RECURRENCE"
    | "RELAPSE"
    | "INACTIVE"
    | "REMISSION"
    | "RESOLVED";
  verificationStatus:
    | "UNCONFIRMED"
    | "PROVISIONAL"
    | "DIFFERENTIAL"
    | "CONFIRMED"
    | "REFUTED"
    | "ENTERED_IN_ERROR";
  category?: string | null;
  severity?: string | null;
  severityCode?: string | null;
  bodySite?: string | null;
  bodySiteCode?: string | null;
  onsetDate?: Date | null;
  onsetAge?: number | null;
  abatementDate?: Date | null;
  abatementAge?: number | null;
  recordedDate?: Date | null;
  recorderId?: string | null;
  recorderName?: string | null;
  asserterId?: string | null;
  asserterName?: string | null;
  notes?: string | null;
  stage?: string | null;
  evidence?: Array<{
    code?: string;
    codeSystem?: string;
    display?: string;
    detailId?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal condition to FHIR Condition resource
 */
export function conditionToFHIR(condition: InternalCondition): Condition {
  const clinicalStatusMap: Record<string, string> = {
    ACTIVE: "active",
    RECURRENCE: "recurrence",
    RELAPSE: "relapse",
    INACTIVE: "inactive",
    REMISSION: "remission",
    RESOLVED: "resolved",
  };

  const verificationStatusMap: Record<string, string> = {
    UNCONFIRMED: "unconfirmed",
    PROVISIONAL: "provisional",
    DIFFERENTIAL: "differential",
    CONFIRMED: "confirmed",
    REFUTED: "refuted",
    ENTERED_IN_ERROR: "entered-in-error",
  };

  const fhirCondition: Condition = {
    resourceType: "Condition",
    id: condition.id,
    meta: {
      lastUpdated:
        condition.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition",
      ],
    },
    clinicalStatus: createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/condition-clinical",
      clinicalStatusMap[condition.clinicalStatus] || "active",
    ),
    verificationStatus: createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      verificationStatusMap[condition.verificationStatus] || "confirmed",
    ),
    code: createCodeableConcept(
      condition.codeSystem,
      condition.code,
      condition.display,
    ),
    subject: createReference("Patient", condition.patientId),
  };

  // Add encounter
  if (condition.encounterId) {
    fhirCondition.encounter = createReference(
      "Encounter",
      condition.encounterId,
    );
  }

  // Add category
  if (condition.category) {
    const categoryMap: Record<string, { code: string; display: string }> = {
      "problem-list-item": {
        code: "problem-list-item",
        display: "Problem List Item",
      },
      "encounter-diagnosis": {
        code: "encounter-diagnosis",
        display: "Encounter Diagnosis",
      },
      "health-concern": { code: "health-concern", display: "Health Concern" },
    };

    const cat = categoryMap[condition.category] || {
      code: condition.category,
      display: condition.category,
    };

    fhirCondition.category = [
      createCodeableConcept(
        "http://terminology.hl7.org/CodeSystem/condition-category",
        cat.code,
        cat.display,
      ),
    ];
  }

  // Add severity
  if (condition.severity || condition.severityCode) {
    const severityMap: Record<string, { code: string; display: string }> = {
      mild: { code: "255604002", display: "Mild" },
      moderate: { code: "6736007", display: "Moderate" },
      severe: { code: "24484000", display: "Severe" },
    };

    const sev =
      condition.severityCode && severityMap[condition.severityCode]
        ? severityMap[condition.severityCode]
        : {
            code: condition.severityCode || "",
            display: condition.severity || "",
          };

    fhirCondition.severity = createCodeableConcept(
      "http://snomed.info/sct",
      sev.code,
      sev.display || condition.severity,
    );
  }

  // Add body site
  if (condition.bodySite || condition.bodySiteCode) {
    fhirCondition.bodySite = [
      createCodeableConcept(
        "http://snomed.info/sct",
        condition.bodySiteCode || "",
        condition.bodySite,
      ),
    ];
  }

  // Add onset
  if (condition.onsetDate) {
    fhirCondition.onsetDateTime = condition.onsetDate.toISOString();
  } else if (condition.onsetAge) {
    fhirCondition.onsetAge = {
      value: condition.onsetAge,
      unit: "years",
      system: "http://unitsofmeasure.org",
      code: "a",
    };
  }

  // Add abatement
  if (condition.abatementDate) {
    fhirCondition.abatementDateTime = condition.abatementDate.toISOString();
  } else if (condition.abatementAge) {
    // abatementAge would be added here
  }

  // Add recorded date
  if (condition.recordedDate) {
    fhirCondition.recordedDate = condition.recordedDate.toISOString();
  }

  // Add recorder
  if (condition.recorderId) {
    fhirCondition.recorder = createReference(
      "Practitioner",
      condition.recorderId,
      condition.recorderName,
    );
  }

  // Add asserter
  if (condition.asserterId) {
    // Asserter would be added as extension or separate field
  }

  // Add notes
  if (condition.notes) {
    fhirCondition.note = [{ text: condition.notes }];
  }

  return fhirCondition;
}

/**
 * Transform FHIR Condition resource to internal condition data
 */
export function conditionFromFHIR(
  fhirCondition: Condition,
): Partial<InternalCondition> {
  const clinicalStatusMap: Record<string, InternalCondition["clinicalStatus"]> =
    {
      active: "ACTIVE",
      recurrence: "RECURRENCE",
      relapse: "RELAPSE",
      inactive: "INACTIVE",
      remission: "REMISSION",
      resolved: "RESOLVED",
    };

  const verificationStatusMap: Record<
    string,
    InternalCondition["verificationStatus"]
  > = {
    unconfirmed: "UNCONFIRMED",
    provisional: "PROVISIONAL",
    differential: "DIFFERENTIAL",
    confirmed: "CONFIRMED",
    refuted: "REFUTED",
    "entered-in-error": "ENTERED_IN_ERROR",
  };

  const patientId = fhirCondition.subject.reference?.split("/")?.[1] || "";
  const encounterId = fhirCondition.encounter?.reference?.split("/")?.[1];
  const recorderId = fhirCondition.recorder?.reference?.split("/")?.[1];

  const clinicalStatusCode =
    fhirCondition.clinicalStatus?.coding?.[0]?.code || "active";
  const verificationStatusCode =
    fhirCondition.verificationStatus?.coding?.[0]?.code || "confirmed";

  const internalCondition: Partial<InternalCondition> = {
    id: fhirCondition.id,
    patientId,
    encounterId,
    code: fhirCondition.code?.coding?.[0]?.code || "",
    codeSystem: fhirCondition.code?.coding?.[0]?.system || "",
    display:
      fhirCondition.code?.text ||
      fhirCondition.code?.coding?.[0]?.display ||
      "",
    clinicalStatus: clinicalStatusMap[clinicalStatusCode] || "ACTIVE",
    verificationStatus:
      verificationStatusMap[verificationStatusCode] || "CONFIRMED",
    category: fhirCondition.category?.[0]?.coding?.[0]?.code,
    severity:
      fhirCondition.severity?.text ||
      fhirCondition.severity?.coding?.[0]?.display,
    severityCode: fhirCondition.severity?.coding?.[0]?.code,
    bodySite:
      fhirCondition.bodySite?.[0]?.text ||
      fhirCondition.bodySite?.[0]?.coding?.[0]?.display,
    bodySiteCode: fhirCondition.bodySite?.[0]?.coding?.[0]?.code,
    onsetDate: fhirCondition.onsetDateTime
      ? new Date(fhirCondition.onsetDateTime)
      : undefined,
    onsetAge: fhirCondition.onsetAge?.value,
    abatementDate: fhirCondition.abatementDateTime
      ? new Date(fhirCondition.abatementDateTime)
      : undefined,
    recordedDate: fhirCondition.recordedDate
      ? new Date(fhirCondition.recordedDate)
      : undefined,
    recorderId,
    recorderName: fhirCondition.recorder?.display,
    notes: fhirCondition.note?.[0]?.text,
    updatedAt: fhirCondition.meta?.lastUpdated
      ? new Date(fhirCondition.meta.lastUpdated)
      : undefined,
  };

  return internalCondition;
}

/**
 * Validate condition data for FHIR conversion
 */
export function validateCondition(condition: Partial<InternalCondition>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!condition.patientId) errors.push("Patient ID is required");
  if (!condition.code) errors.push("Code is required");
  if (!condition.codeSystem) errors.push("Code system is required");
  if (!condition.clinicalStatus) errors.push("Clinical status is required");
  if (!condition.verificationStatus)
    errors.push("Verification status is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}
