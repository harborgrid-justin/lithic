/**
 * FHIR R4 Transformers
 *
 * Bidirectional transformers for converting between internal models
 * and FHIR R4 resources
 */

import {
  Patient as FHIRPatient,
  Observation as FHIRObservation,
  Condition as FHIRCondition,
  MedicationRequest as FHIRMedicationRequest,
  AllergyIntolerance as FHIRAllergyIntolerance,
  Encounter as FHIREncounter,
  DiagnosticReport as FHIRDiagnosticReport,
  Immunization as FHIRImmunization,
  HumanName,
  ContactPoint,
  Address,
  Identifier,
  CodeableConcept,
  Reference,
  Quantity,
} from './resources';

// Internal Patient Model (simplified)
export interface InternalPatient {
  id?: string;
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  ssn?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  active?: boolean;
}

// Internal Observation Model
export interface InternalObservation {
  id?: string;
  patientId: string;
  code: string;
  codeSystem: string;
  display: string;
  value: number | string;
  unit?: string;
  status: string;
  effectiveDate: string;
  category?: string;
  interpretation?: string;
  referenceRange?: {
    low?: number;
    high?: number;
  };
  note?: string;
}

// Internal Condition Model
export interface InternalCondition {
  id?: string;
  patientId: string;
  code: string;
  codeSystem: string;
  display: string;
  clinicalStatus: string;
  verificationStatus: string;
  severity?: string;
  onsetDate?: string;
  abatementDate?: string;
  note?: string;
}

// Internal Medication Request Model
export interface InternalMedicationRequest {
  id?: string;
  patientId: string;
  medicationCode: string;
  medicationName: string;
  status: string;
  intent: string;
  authoredOn: string;
  requesterId: string;
  dosageInstructions: string;
  quantityValue?: number;
  quantityUnit?: string;
  refills?: number;
  dispenseQuantity?: number;
  note?: string;
}

/**
 * Patient Transformers
 */
export class PatientTransformer {
  /**
   * Convert internal patient to FHIR Patient
   */
  static toFHIR(patient: InternalPatient): FHIRPatient {
    const name: HumanName[] = [
      {
        use: 'official',
        family: patient.lastName,
        given: patient.middleName
          ? [patient.firstName, patient.middleName]
          : [patient.firstName],
      },
    ];

    const telecom: ContactPoint[] = [];
    if (patient.email) {
      telecom.push({
        system: 'email',
        value: patient.email,
        use: 'home',
      });
    }
    if (patient.phone) {
      telecom.push({
        system: 'phone',
        value: patient.phone,
        use: 'home',
      });
    }

    const address: Address[] = patient.address
      ? [
          {
            use: 'home',
            line: [patient.address.street],
            city: patient.address.city,
            state: patient.address.state,
            postalCode: patient.address.zipCode,
            country: patient.address.country || 'US',
          },
        ]
      : [];

    const identifier: Identifier[] = [
      {
        use: 'usual',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number',
            },
          ],
        },
        system: 'urn:oid:2.16.840.1.113883.4.1',
        value: patient.mrn,
      },
    ];

    if (patient.ssn) {
      identifier.push({
        use: 'official',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'SS',
              display: 'Social Security Number',
            },
          ],
        },
        system: 'http://hl7.org/fhir/sid/us-ssn',
        value: patient.ssn,
      });
    }

    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patient.id,
      identifier,
      active: patient.active !== false,
      name,
      telecom: telecom.length > 0 ? telecom : undefined,
      gender: patient.gender,
      birthDate: patient.dateOfBirth,
      address: address.length > 0 ? address : undefined,
    };

    // Add emergency contact if available
    if (patient.emergencyContact) {
      fhirPatient.contact = [
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'C',
                  display: 'Emergency Contact',
                },
              ],
              text: patient.emergencyContact.relationship,
            },
          ],
          name: {
            text: patient.emergencyContact.name,
          },
          telecom: [
            {
              system: 'phone',
              value: patient.emergencyContact.phone,
            },
          ],
        },
      ];
    }

    return fhirPatient;
  }

  /**
   * Convert FHIR Patient to internal patient
   */
  static fromFHIR(fhirPatient: FHIRPatient): InternalPatient {
    const mrIdentifier = fhirPatient.identifier?.find(
      (id) =>
        id.type?.coding?.some((c) => c.code === 'MR') ||
        id.use === 'usual'
    );

    const ssn = fhirPatient.identifier?.find(
      (id) => id.type?.coding?.some((c) => c.code === 'SS')
    )?.value;

    const primaryName = fhirPatient.name?.[0];
    const email = fhirPatient.telecom?.find((t) => t.system === 'email')?.value;
    const phone = fhirPatient.telecom?.find((t) => t.system === 'phone')?.value;
    const primaryAddress = fhirPatient.address?.[0];

    const emergencyContact = fhirPatient.contact?.[0];

    return {
      id: fhirPatient.id,
      mrn: mrIdentifier?.value || '',
      firstName: primaryName?.given?.[0] || '',
      middleName: primaryName?.given?.[1],
      lastName: primaryName?.family || '',
      dateOfBirth: fhirPatient.birthDate || '',
      gender: fhirPatient.gender || 'unknown',
      ssn,
      email,
      phone,
      address: primaryAddress
        ? {
            street: primaryAddress.line?.[0] || '',
            city: primaryAddress.city || '',
            state: primaryAddress.state || '',
            zipCode: primaryAddress.postalCode || '',
            country: primaryAddress.country,
          }
        : undefined,
      emergencyContact: emergencyContact
        ? {
            name: emergencyContact.name?.text || '',
            relationship: emergencyContact.relationship?.[0]?.text || '',
            phone: emergencyContact.telecom?.[0]?.value || '',
          }
        : undefined,
      active: fhirPatient.active,
    };
  }
}

/**
 * Observation Transformers
 */
export class ObservationTransformer {
  /**
   * Convert internal observation to FHIR Observation
   */
  static toFHIR(obs: InternalObservation): FHIRObservation {
    const code: CodeableConcept = {
      coding: [
        {
          system: obs.codeSystem,
          code: obs.code,
          display: obs.display,
        },
      ],
      text: obs.display,
    };

    const fhirObs: FHIRObservation = {
      resourceType: 'Observation',
      id: obs.id,
      status: obs.status as any,
      code,
      subject: {
        reference: `Patient/${obs.patientId}`,
      },
      effectiveDateTime: obs.effectiveDate,
    };

    // Add value based on type
    if (typeof obs.value === 'number') {
      fhirObs.valueQuantity = {
        value: obs.value,
        unit: obs.unit,
        system: 'http://unitsofmeasure.org',
        code: obs.unit,
      };
    } else {
      fhirObs.valueString = obs.value;
    }

    // Add category if provided
    if (obs.category) {
      fhirObs.category = [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: obs.category,
            },
          ],
        },
      ];
    }

    // Add interpretation
    if (obs.interpretation) {
      fhirObs.interpretation = [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: obs.interpretation,
            },
          ],
        },
      ];
    }

    // Add reference range
    if (obs.referenceRange) {
      fhirObs.referenceRange = [
        {
          low: obs.referenceRange.low
            ? { value: obs.referenceRange.low, unit: obs.unit }
            : undefined,
          high: obs.referenceRange.high
            ? { value: obs.referenceRange.high, unit: obs.unit }
            : undefined,
        },
      ];
    }

    // Add note
    if (obs.note) {
      fhirObs.note = [{ text: obs.note }];
    }

    return fhirObs;
  }

  /**
   * Convert FHIR Observation to internal observation
   */
  static fromFHIR(fhirObs: FHIRObservation): InternalObservation {
    const coding = fhirObs.code.coding?.[0];
    const patientRef = fhirObs.subject?.reference?.split('/')[1] || '';

    let value: number | string = '';
    let unit: string | undefined;

    if (fhirObs.valueQuantity) {
      value = fhirObs.valueQuantity.value || 0;
      unit = fhirObs.valueQuantity.unit;
    } else if (fhirObs.valueString) {
      value = fhirObs.valueString;
    } else if (fhirObs.valueCodeableConcept) {
      value = fhirObs.valueCodeableConcept.text || fhirObs.valueCodeableConcept.coding?.[0]?.display || '';
    }

    return {
      id: fhirObs.id,
      patientId: patientRef,
      code: coding?.code || '',
      codeSystem: coding?.system || '',
      display: coding?.display || fhirObs.code.text || '',
      value,
      unit,
      status: fhirObs.status,
      effectiveDate: fhirObs.effectiveDateTime || '',
      category: fhirObs.category?.[0]?.coding?.[0]?.code,
      interpretation: fhirObs.interpretation?.[0]?.coding?.[0]?.code,
      referenceRange: fhirObs.referenceRange?.[0]
        ? {
            low: fhirObs.referenceRange[0].low?.value,
            high: fhirObs.referenceRange[0].high?.value,
          }
        : undefined,
      note: fhirObs.note?.[0]?.text,
    };
  }
}

/**
 * Condition Transformers
 */
export class ConditionTransformer {
  /**
   * Convert internal condition to FHIR Condition
   */
  static toFHIR(condition: InternalCondition): FHIRCondition {
    return {
      resourceType: 'Condition',
      id: condition.id,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: condition.clinicalStatus,
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: condition.verificationStatus,
          },
        ],
      },
      code: {
        coding: [
          {
            system: condition.codeSystem,
            code: condition.code,
            display: condition.display,
          },
        ],
        text: condition.display,
      },
      subject: {
        reference: `Patient/${condition.patientId}`,
      },
      onsetDateTime: condition.onsetDate,
      abatementDateTime: condition.abatementDate,
      severity: condition.severity
        ? {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: condition.severity,
              },
            ],
          }
        : undefined,
      note: condition.note ? [{ text: condition.note }] : undefined,
    };
  }

  /**
   * Convert FHIR Condition to internal condition
   */
  static fromFHIR(fhirCondition: FHIRCondition): InternalCondition {
    const coding = fhirCondition.code?.coding?.[0];
    const patientRef = fhirCondition.subject?.reference?.split('/')[1] || '';

    return {
      id: fhirCondition.id,
      patientId: patientRef,
      code: coding?.code || '',
      codeSystem: coding?.system || '',
      display: coding?.display || fhirCondition.code?.text || '',
      clinicalStatus: fhirCondition.clinicalStatus?.coding?.[0]?.code || '',
      verificationStatus: fhirCondition.verificationStatus?.coding?.[0]?.code || '',
      severity: fhirCondition.severity?.coding?.[0]?.code,
      onsetDate: fhirCondition.onsetDateTime,
      abatementDate: fhirCondition.abatementDateTime,
      note: fhirCondition.note?.[0]?.text,
    };
  }
}

/**
 * MedicationRequest Transformers
 */
export class MedicationRequestTransformer {
  /**
   * Convert internal medication request to FHIR MedicationRequest
   */
  static toFHIR(medReq: InternalMedicationRequest): FHIRMedicationRequest {
    return {
      resourceType: 'MedicationRequest',
      id: medReq.id,
      status: medReq.status as any,
      intent: medReq.intent as any,
      medicationCodeableConcept: {
        coding: [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: medReq.medicationCode,
            display: medReq.medicationName,
          },
        ],
        text: medReq.medicationName,
      },
      subject: {
        reference: `Patient/${medReq.patientId}`,
      },
      authoredOn: medReq.authoredOn,
      requester: {
        reference: `Practitioner/${medReq.requesterId}`,
      },
      dosageInstruction: [
        {
          text: medReq.dosageInstructions,
        },
      ],
      dispenseRequest: medReq.dispenseQuantity
        ? {
            numberOfRepeatsAllowed: medReq.refills,
            quantity: {
              value: medReq.dispenseQuantity,
              unit: medReq.quantityUnit,
            },
          }
        : undefined,
      note: medReq.note ? [{ text: medReq.note }] : undefined,
    };
  }

  /**
   * Convert FHIR MedicationRequest to internal medication request
   */
  static fromFHIR(fhirMedReq: FHIRMedicationRequest): InternalMedicationRequest {
    const medication = fhirMedReq.medicationCodeableConcept;
    const coding = medication?.coding?.[0];
    const patientRef = fhirMedReq.subject?.reference?.split('/')[1] || '';
    const requesterRef = fhirMedReq.requester?.reference?.split('/')[1] || '';

    return {
      id: fhirMedReq.id,
      patientId: patientRef,
      medicationCode: coding?.code || '',
      medicationName: coding?.display || medication?.text || '',
      status: fhirMedReq.status,
      intent: fhirMedReq.intent,
      authoredOn: fhirMedReq.authoredOn || '',
      requesterId: requesterRef,
      dosageInstructions: fhirMedReq.dosageInstruction?.[0]?.text || '',
      quantityValue: fhirMedReq.dispenseRequest?.quantity?.value,
      quantityUnit: fhirMedReq.dispenseRequest?.quantity?.unit,
      refills: fhirMedReq.dispenseRequest?.numberOfRepeatsAllowed,
      dispenseQuantity: fhirMedReq.dispenseRequest?.quantity?.value,
      note: fhirMedReq.note?.[0]?.text,
    };
  }
}

/**
 * Helper function to create a FHIR Reference
 */
export function createReference(resourceType: string, id: string, display?: string): Reference {
  return {
    reference: `${resourceType}/${id}`,
    type: resourceType,
    display,
  };
}

/**
 * Helper function to create a CodeableConcept
 */
export function createCodeableConcept(
  system: string,
  code: string,
  display?: string,
  text?: string
): CodeableConcept {
  return {
    coding: [
      {
        system,
        code,
        display: display || text,
      },
    ],
    text: text || display,
  };
}

/**
 * Helper function to create a Quantity
 */
export function createQuantity(
  value: number,
  unit: string,
  system: string = 'http://unitsofmeasure.org',
  code?: string
): Quantity {
  return {
    value,
    unit,
    system,
    code: code || unit,
  };
}
