/**
 * FHIR Observation Resource Transformer
 * Transform between internal observation data and FHIR R4 Observation resource
 */

import type { Observation } from "../resources";
import { createReference, createCodeableConcept } from "../resources";

export interface InternalObservation {
  id: string;
  patientId: string;
  encounterId?: string | null;
  code: string;
  codeSystem: string;
  display: string;
  category?: string | null;
  value: number | string | boolean;
  valueType: "QUANTITY" | "STRING" | "BOOLEAN" | "CODEABLE_CONCEPT" | "RANGE";
  unit?: string | null;
  unitSystem?: string | null;
  unitCode?: string | null;
  status:
    | "REGISTERED"
    | "PRELIMINARY"
    | "FINAL"
    | "AMENDED"
    | "CORRECTED"
    | "CANCELLED"
    | "ENTERED_IN_ERROR";
  effectiveDate: Date;
  effectiveEndDate?: Date | null;
  issuedDate?: Date | null;
  performerId?: string | null;
  performerName?: string | null;
  notes?: string | null;
  interpretation?: string | null;
  interpretationCode?: string | null;
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  referenceRangeText?: string | null;
  method?: string | null;
  bodySite?: string | null;
  deviceId?: string | null;
  components?: Array<{
    code: string;
    codeSystem: string;
    display: string;
    value: number | string;
    unit?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal observation to FHIR Observation resource
 */
export function observationToFHIR(obs: InternalObservation): Observation {
  const statusMap: Record<string, Observation["status"]> = {
    REGISTERED: "registered",
    PRELIMINARY: "preliminary",
    FINAL: "final",
    AMENDED: "amended",
    CORRECTED: "corrected",
    CANCELLED: "cancelled",
    ENTERED_IN_ERROR: "entered-in-error",
  };

  const fhirObservation: Observation = {
    resourceType: "Observation",
    id: obs.id,
    meta: {
      lastUpdated: obs.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab",
      ],
    },
    status: statusMap[obs.status] || "final",
    code: createCodeableConcept(obs.codeSystem, obs.code, obs.display),
    subject: createReference("Patient", obs.patientId),
    effectiveDateTime: obs.effectiveDate.toISOString(),
  };

  // Add category
  if (obs.category) {
    const categoryMap: Record<string, { code: string; display: string }> = {
      "vital-signs": { code: "vital-signs", display: "Vital Signs" },
      laboratory: { code: "laboratory", display: "Laboratory" },
      imaging: { code: "imaging", display: "Imaging" },
      procedure: { code: "procedure", display: "Procedure" },
      survey: { code: "survey", display: "Survey" },
      exam: { code: "exam", display: "Exam" },
      therapy: { code: "therapy", display: "Therapy" },
      activity: { code: "activity", display: "Activity" },
    };

    const cat = categoryMap[obs.category] || {
      code: obs.category,
      display: obs.category,
    };
    fhirObservation.category = [
      createCodeableConcept(
        "http://terminology.hl7.org/CodeSystem/observation-category",
        cat.code,
        cat.display,
      ),
    ];
  }

  // Add encounter
  if (obs.encounterId) {
    fhirObservation.encounter = createReference("Encounter", obs.encounterId);
  }

  // Add issued date
  if (obs.issuedDate) {
    fhirObservation.issued = obs.issuedDate.toISOString();
  }

  // Add performer
  if (obs.performerId) {
    fhirObservation.performer = [
      createReference("Practitioner", obs.performerId, obs.performerName),
    ];
  }

  // Add value based on type
  switch (obs.valueType) {
    case "QUANTITY":
      if (typeof obs.value === "number") {
        fhirObservation.valueQuantity = {
          value: obs.value,
          unit: obs.unit,
          system: obs.unitSystem || "http://unitsofmeasure.org",
          code: obs.unitCode || obs.unit,
        };
      }
      break;

    case "STRING":
      fhirObservation.valueString = String(obs.value);
      break;

    case "BOOLEAN":
      fhirObservation.valueBoolean = Boolean(obs.value);
      break;

    case "CODEABLE_CONCEPT":
      fhirObservation.valueCodeableConcept = {
        text: String(obs.value),
      };
      break;

    case "RANGE":
      // Range values would be handled differently
      fhirObservation.valueString = String(obs.value);
      break;
  }

  // Add interpretation
  if (obs.interpretation || obs.interpretationCode) {
    const interpretationMap: Record<string, { code: string; display: string }> =
      {
        L: { code: "L", display: "Low" },
        H: { code: "H", display: "High" },
        LL: { code: "LL", display: "Critical low" },
        HH: { code: "HH", display: "Critical high" },
        N: { code: "N", display: "Normal" },
        A: { code: "A", display: "Abnormal" },
      };

    const code = obs.interpretationCode || obs.interpretation || "N";
    const interp = interpretationMap[code] || { code, display: code };

    fhirObservation.interpretation = [
      createCodeableConcept(
        "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
        interp.code,
        interp.display,
      ),
    ];
  }

  // Add reference range
  if (
    obs.referenceRangeLow !== null ||
    obs.referenceRangeHigh !== null ||
    obs.referenceRangeText
  ) {
    fhirObservation.referenceRange = [
      {
        low:
          obs.referenceRangeLow !== null
            ? {
                value: obs.referenceRangeLow,
                unit: obs.unit,
                system: obs.unitSystem || "http://unitsofmeasure.org",
                code: obs.unitCode || obs.unit,
              }
            : undefined,
        high:
          obs.referenceRangeHigh !== null
            ? {
                value: obs.referenceRangeHigh,
                unit: obs.unit,
                system: obs.unitSystem || "http://unitsofmeasure.org",
                code: obs.unitCode || obs.unit,
              }
            : undefined,
        text: obs.referenceRangeText,
      },
    ];
  }

  // Add notes
  if (obs.notes) {
    fhirObservation.note = [{ text: obs.notes }];
  }

  // Add components for multi-component observations (e.g., blood pressure)
  if (obs.components && obs.components.length > 0) {
    fhirObservation.component = obs.components.map((comp) => ({
      code: createCodeableConcept(comp.codeSystem, comp.code, comp.display),
      valueQuantity:
        typeof comp.value === "number"
          ? {
              value: comp.value,
              unit: comp.unit,
              system: "http://unitsofmeasure.org",
              code: comp.unit,
            }
          : undefined,
      valueString: typeof comp.value === "string" ? comp.value : undefined,
    }));
  }

  return fhirObservation;
}

/**
 * Transform FHIR Observation resource to internal observation data
 */
export function observationFromFHIR(
  fhirObs: Observation,
): Partial<InternalObservation> {
  const statusMap: Record<
    Observation["status"],
    InternalObservation["status"]
  > = {
    registered: "REGISTERED",
    preliminary: "PRELIMINARY",
    final: "FINAL",
    amended: "AMENDED",
    corrected: "CORRECTED",
    cancelled: "CANCELLED",
    "entered-in-error": "ENTERED_IN_ERROR",
    unknown: "FINAL",
  };

  const patientId = fhirObs.subject?.reference?.split("/")?.[1] || "";
  const encounterId = fhirObs.encounter?.reference?.split("/")?.[1];
  const performerId = fhirObs.performer?.[0]?.reference?.split("/")?.[1];

  let value: number | string | boolean = "";
  let valueType: InternalObservation["valueType"] = "STRING";

  if (fhirObs.valueQuantity) {
    value = fhirObs.valueQuantity.value || 0;
    valueType = "QUANTITY";
  } else if (fhirObs.valueBoolean !== undefined) {
    value = fhirObs.valueBoolean;
    valueType = "BOOLEAN";
  } else if (fhirObs.valueString) {
    value = fhirObs.valueString;
    valueType = "STRING";
  } else if (fhirObs.valueCodeableConcept) {
    value =
      fhirObs.valueCodeableConcept.text ||
      fhirObs.valueCodeableConcept.coding?.[0]?.display ||
      "";
    valueType = "CODEABLE_CONCEPT";
  }

  const refRange = fhirObs.referenceRange?.[0];

  const internalObs: Partial<InternalObservation> = {
    id: fhirObs.id,
    patientId,
    encounterId,
    code: fhirObs.code.coding?.[0]?.code || "",
    codeSystem: fhirObs.code.coding?.[0]?.system || "",
    display: fhirObs.code.text || fhirObs.code.coding?.[0]?.display || "",
    category: fhirObs.category?.[0]?.coding?.[0]?.code,
    value,
    valueType,
    unit: fhirObs.valueQuantity?.unit,
    unitSystem: fhirObs.valueQuantity?.system,
    unitCode: fhirObs.valueQuantity?.code,
    status: statusMap[fhirObs.status] || "FINAL",
    effectiveDate: fhirObs.effectiveDateTime
      ? new Date(fhirObs.effectiveDateTime)
      : new Date(),
    issuedDate: fhirObs.issued ? new Date(fhirObs.issued) : undefined,
    performerId,
    performerName: fhirObs.performer?.[0]?.display,
    notes: fhirObs.note?.[0]?.text,
    interpretation: fhirObs.interpretation?.[0]?.coding?.[0]?.display,
    interpretationCode: fhirObs.interpretation?.[0]?.coding?.[0]?.code,
    referenceRangeLow: refRange?.low?.value,
    referenceRangeHigh: refRange?.high?.value,
    referenceRangeText: refRange?.text,
    updatedAt: fhirObs.meta?.lastUpdated
      ? new Date(fhirObs.meta.lastUpdated)
      : undefined,
  };

  // Extract components
  if (fhirObs.component && fhirObs.component.length > 0) {
    internalObs.components = fhirObs.component.map((comp) => ({
      code: comp.code.coding?.[0]?.code || "",
      codeSystem: comp.code.coding?.[0]?.system || "",
      display: comp.code.text || comp.code.coding?.[0]?.display || "",
      value: comp.valueQuantity?.value || comp.valueString || "",
      unit: comp.valueQuantity?.unit,
    }));
  }

  return internalObs;
}

/**
 * Validate observation data for FHIR conversion
 */
export function validateObservation(obs: Partial<InternalObservation>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!obs.patientId) errors.push("Patient ID is required");
  if (!obs.code) errors.push("Code is required");
  if (!obs.codeSystem) errors.push("Code system is required");
  if (!obs.status) errors.push("Status is required");
  if (!obs.effectiveDate) errors.push("Effective date is required");
  if (obs.value === undefined || obs.value === null)
    errors.push("Value is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create vital signs observation
 */
export function createVitalSignObservation(params: {
  patientId: string;
  encounterId?: string;
  code: string;
  display: string;
  value: number;
  unit: string;
  effectiveDate: Date;
  performerId?: string;
}): Partial<InternalObservation> {
  return {
    patientId: params.patientId,
    encounterId: params.encounterId,
    code: params.code,
    codeSystem: "http://loinc.org",
    display: params.display,
    category: "vital-signs",
    value: params.value,
    valueType: "QUANTITY",
    unit: params.unit,
    unitSystem: "http://unitsofmeasure.org",
    status: "FINAL",
    effectiveDate: params.effectiveDate,
    performerId: params.performerId,
  };
}

/**
 * Create lab result observation
 */
export function createLabObservation(params: {
  patientId: string;
  encounterId?: string;
  code: string;
  display: string;
  value: number | string;
  unit?: string;
  effectiveDate: Date;
  performerId?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  interpretation?: string;
}): Partial<InternalObservation> {
  return {
    patientId: params.patientId,
    encounterId: params.encounterId,
    code: params.code,
    codeSystem: "http://loinc.org",
    display: params.display,
    category: "laboratory",
    value: params.value,
    valueType: typeof params.value === "number" ? "QUANTITY" : "STRING",
    unit: params.unit,
    unitSystem: params.unit ? "http://unitsofmeasure.org" : undefined,
    status: "FINAL",
    effectiveDate: params.effectiveDate,
    performerId: params.performerId,
    referenceRangeLow: params.referenceRangeLow,
    referenceRangeHigh: params.referenceRangeHigh,
    interpretationCode: params.interpretation,
  };
}
