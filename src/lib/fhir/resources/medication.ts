/**
 * FHIR MedicationRequest Resource Transformer
 * Transform between internal medication data and FHIR R4 MedicationRequest resource
 */

import type { MedicationRequest } from "../resources";
import { createReference, createCodeableConcept } from "../resources";

export interface InternalMedicationRequest {
  id: string;
  patientId: string;
  encounterId?: string | null;
  medication: string;
  medicationCode?: string | null;
  medicationCodeSystem?: string | null;
  dosage?: string | null;
  dosageAmount?: number | null;
  dosageUnit?: string | null;
  frequency?: string | null;
  route?: string | null;
  routeCode?: string | null;
  status:
    | "ACTIVE"
    | "ON_HOLD"
    | "CANCELLED"
    | "COMPLETED"
    | "ENTERED_IN_ERROR"
    | "STOPPED"
    | "DRAFT";
  intent:
    | "PROPOSAL"
    | "PLAN"
    | "ORDER"
    | "ORIGINAL_ORDER"
    | "REFLEX_ORDER"
    | "FILLER_ORDER"
    | "INSTANCE_ORDER";
  priority?: "ROUTINE" | "URGENT" | "ASAP" | "STAT" | null;
  prescriberId: string;
  prescriberName?: string | null;
  authoredOn: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  refills?: number | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  daysSupply?: number | null;
  substitutionAllowed?: boolean | null;
  reasonForPrescribing?: string | null;
  reasonCode?: string | null;
  instructions?: string | null;
  notes?: string | null;
  pharmacyId?: string | null;
  performerId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal medication request to FHIR MedicationRequest resource
 */
export function medicationRequestToFHIR(
  med: InternalMedicationRequest,
): MedicationRequest {
  const statusMap: Record<string, MedicationRequest["status"]> = {
    ACTIVE: "active",
    ON_HOLD: "on-hold",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    ENTERED_IN_ERROR: "entered-in-error",
    STOPPED: "stopped",
    DRAFT: "draft",
  };

  const intentMap: Record<string, MedicationRequest["intent"]> = {
    PROPOSAL: "proposal",
    PLAN: "plan",
    ORDER: "order",
    ORIGINAL_ORDER: "original-order",
    REFLEX_ORDER: "reflex-order",
    FILLER_ORDER: "filler-order",
    INSTANCE_ORDER: "instance-order",
  };

  const fhirMedRequest: MedicationRequest = {
    resourceType: "MedicationRequest",
    id: med.id,
    meta: {
      lastUpdated: med.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest",
      ],
    },
    status: statusMap[med.status] || "active",
    intent: intentMap[med.intent] || "order",
    subject: createReference("Patient", med.patientId),
    authoredOn: med.authoredOn.toISOString(),
    requester: createReference(
      "Practitioner",
      med.prescriberId,
      med.prescriberName,
    ),
  };

  // Add medication
  if (med.medicationCode && med.medicationCodeSystem) {
    fhirMedRequest.medicationCodeableConcept = createCodeableConcept(
      med.medicationCodeSystem,
      med.medicationCode,
      med.medication,
    );
  } else {
    fhirMedRequest.medicationCodeableConcept = { text: med.medication };
  }

  // Add encounter
  if (med.encounterId) {
    fhirMedRequest.encounter = createReference("Encounter", med.encounterId);
  }

  // Add performer (pharmacy/dispenser)
  if (med.performerId) {
    fhirMedRequest.performer = createReference("Practitioner", med.performerId);
  }

  // Add dosage instructions
  if (med.dosage || med.frequency || med.route || med.instructions) {
    const dosageInstruction: any = {
      text:
        med.instructions ||
        `${med.dosage || ""} ${med.frequency || ""} ${med.route || ""}`.trim(),
    };

    // Add route
    if (med.route) {
      dosageInstruction.route = med.routeCode
        ? createCodeableConcept(
            "http://snomed.info/sct",
            med.routeCode,
            med.route,
          )
        : { text: med.route };
    }

    // Add dose and rate
    if (med.dosageAmount && med.dosageUnit) {
      dosageInstruction.doseAndRate = [
        {
          type: createCodeableConcept(
            "http://terminology.hl7.org/CodeSystem/dose-rate-type",
            "ordered",
            "Ordered",
          ),
          doseQuantity: {
            value: med.dosageAmount,
            unit: med.dosageUnit,
            system: "http://unitsofmeasure.org",
            code: med.dosageUnit,
          },
        },
      ];
    }

    // Add timing (frequency)
    if (med.frequency) {
      // Convert frequency to FHIR timing
      const timingMap: Record<string, any> = {
        QD: { frequency: 1, period: 1, periodUnit: "d" },
        BID: { frequency: 2, period: 1, periodUnit: "d" },
        TID: { frequency: 3, period: 1, periodUnit: "d" },
        QID: { frequency: 4, period: 1, periodUnit: "d" },
        Q4H: { frequency: 1, period: 4, periodUnit: "h" },
        Q6H: { frequency: 1, period: 6, periodUnit: "h" },
        Q8H: { frequency: 1, period: 8, periodUnit: "h" },
        Q12H: { frequency: 1, period: 12, periodUnit: "h" },
      };

      const timing = timingMap[med.frequency.toUpperCase()];
      if (timing) {
        dosageInstruction.timing = {
          repeat: {
            frequency: timing.frequency,
            period: timing.period,
            periodUnit: timing.periodUnit,
          },
        };
      }
    }

    fhirMedRequest.dosageInstruction = [dosageInstruction];
  }

  // Add dispense request
  if (med.refills !== null || med.quantity || med.daysSupply) {
    fhirMedRequest.dispenseRequest = {
      numberOfRepeatsAllowed: med.refills,
      quantity:
        med.quantity && med.quantityUnit
          ? {
              value: med.quantity,
              unit: med.quantityUnit,
              system: "http://unitsofmeasure.org",
              code: med.quantityUnit,
            }
          : undefined,
      expectedSupplyDuration: med.daysSupply
        ? {
            value: med.daysSupply,
            unit: "days",
            system: "http://unitsofmeasure.org",
            code: "d",
          }
        : undefined,
    };

    // Add validity period
    if (med.startDate || med.endDate) {
      fhirMedRequest.dispenseRequest.validityPeriod = {
        start: med.startDate?.toISOString(),
        end: med.endDate?.toISOString(),
      };
    }
  }

  // Add reason for prescribing
  if (med.reasonForPrescribing || med.reasonCode) {
    fhirMedRequest.reasonCode = [
      med.reasonCode
        ? createCodeableConcept(
            "http://snomed.info/sct",
            med.reasonCode,
            med.reasonForPrescribing,
          )
        : { text: med.reasonForPrescribing },
    ];
  }

  return fhirMedRequest;
}

/**
 * Transform FHIR MedicationRequest resource to internal medication request data
 */
export function medicationRequestFromFHIR(
  fhirMedRequest: MedicationRequest,
): Partial<InternalMedicationRequest> {
  const statusMap: Record<
    MedicationRequest["status"],
    InternalMedicationRequest["status"]
  > = {
    active: "ACTIVE",
    "on-hold": "ON_HOLD",
    cancelled: "CANCELLED",
    completed: "COMPLETED",
    "entered-in-error": "ENTERED_IN_ERROR",
    stopped: "STOPPED",
    draft: "DRAFT",
    unknown: "ACTIVE",
  };

  const intentMap: Record<
    MedicationRequest["intent"],
    InternalMedicationRequest["intent"]
  > = {
    proposal: "PROPOSAL",
    plan: "PLAN",
    order: "ORDER",
    "original-order": "ORIGINAL_ORDER",
    "reflex-order": "REFLEX_ORDER",
    "filler-order": "FILLER_ORDER",
    "instance-order": "INSTANCE_ORDER",
    option: "ORDER",
  };

  const patientId = fhirMedRequest.subject.reference?.split("/")?.[1] || "";
  const encounterId = fhirMedRequest.encounter?.reference?.split("/")?.[1];
  const prescriberId =
    fhirMedRequest.requester?.reference?.split("/")?.[1] || "";
  const performerId = fhirMedRequest.performer?.reference?.split("/")?.[1];

  const medication =
    fhirMedRequest.medicationCodeableConcept?.text ||
    fhirMedRequest.medicationCodeableConcept?.coding?.[0]?.display ||
    "";

  const dosageInstruction = fhirMedRequest.dosageInstruction?.[0];
  const dispenseRequest = fhirMedRequest.dispenseRequest;

  const internalMed: Partial<InternalMedicationRequest> = {
    id: fhirMedRequest.id,
    patientId,
    encounterId,
    medication,
    medicationCode: fhirMedRequest.medicationCodeableConcept?.coding?.[0]?.code,
    medicationCodeSystem:
      fhirMedRequest.medicationCodeableConcept?.coding?.[0]?.system,
    status: statusMap[fhirMedRequest.status] || "ACTIVE",
    intent: intentMap[fhirMedRequest.intent] || "ORDER",
    prescriberId,
    prescriberName: fhirMedRequest.requester?.display,
    authoredOn: fhirMedRequest.authoredOn
      ? new Date(fhirMedRequest.authoredOn)
      : new Date(),
    performerId,
    dosage: dosageInstruction?.text,
    dosageAmount: dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.value,
    dosageUnit: dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.unit,
    route:
      dosageInstruction?.route?.text ||
      dosageInstruction?.route?.coding?.[0]?.display,
    routeCode: dosageInstruction?.route?.coding?.[0]?.code,
    instructions: dosageInstruction?.text,
    refills: dispenseRequest?.numberOfRepeatsAllowed,
    quantity: dispenseRequest?.quantity?.value,
    quantityUnit: dispenseRequest?.quantity?.unit,
    daysSupply: dispenseRequest?.expectedSupplyDuration?.value,
    startDate: dispenseRequest?.validityPeriod?.start
      ? new Date(dispenseRequest.validityPeriod.start)
      : undefined,
    endDate: dispenseRequest?.validityPeriod?.end
      ? new Date(dispenseRequest.validityPeriod.end)
      : undefined,
    reasonForPrescribing:
      fhirMedRequest.reasonCode?.[0]?.text ||
      fhirMedRequest.reasonCode?.[0]?.coding?.[0]?.display,
    reasonCode: fhirMedRequest.reasonCode?.[0]?.coding?.[0]?.code,
    updatedAt: fhirMedRequest.meta?.lastUpdated
      ? new Date(fhirMedRequest.meta.lastUpdated)
      : undefined,
  };

  // Extract frequency from timing
  if (dosageInstruction?.timing?.repeat) {
    const repeat = dosageInstruction.timing.repeat;
    if (repeat.frequency && repeat.period && repeat.periodUnit) {
      // Convert back to common frequency codes
      if (repeat.periodUnit === "d" && repeat.period === 1) {
        const freqMap: Record<number, string> = {
          1: "QD",
          2: "BID",
          3: "TID",
          4: "QID",
        };
        internalMed.frequency = freqMap[repeat.frequency];
      } else if (repeat.periodUnit === "h") {
        internalMed.frequency = `Q${repeat.period}H`;
      }
    }
  }

  return internalMed;
}

/**
 * Validate medication request data for FHIR conversion
 */
export function validateMedicationRequest(
  med: Partial<InternalMedicationRequest>,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!med.patientId) errors.push("Patient ID is required");
  if (!med.medication) errors.push("Medication is required");
  if (!med.status) errors.push("Status is required");
  if (!med.intent) errors.push("Intent is required");
  if (!med.prescriberId) errors.push("Prescriber ID is required");
  if (!med.authoredOn) errors.push("Authored date is required");

  // Validate dates
  if (med.startDate && med.endDate && med.startDate > med.endDate) {
    errors.push("Start date cannot be after end date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
