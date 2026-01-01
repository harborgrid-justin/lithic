/**
 * FHIR Resource Transformers
 * Transform between internal data models and FHIR R4 resources
 */

import type {
  Patient,
  Observation,
  Encounter,
  MedicationRequest,
  Condition,
  DiagnosticReport,
  Appointment,
  CodeableConcept,
  Reference,
  HumanName,
  Address,
  ContactPoint,
} from './resources';
import {
  createReference,
  createCodeableConcept,
  createIdentifier,
} from './resources';

// Internal types (these would come from your Prisma schema)
interface InternalPatient {
  id: string;
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  ssn?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  maritalStatus?: string;
  language?: string;
  active?: boolean;
}

interface InternalObservation {
  id: string;
  patientId: string;
  encounterId?: string;
  code: string;
  codeSystem: string;
  display: string;
  value: number | string | boolean;
  unit?: string;
  status: string;
  category?: string;
  effectiveDate: Date;
  performerId?: string;
  notes?: string;
}

interface InternalEncounter {
  id: string;
  patientId: string;
  type: string;
  status: string;
  class: string;
  startDate: Date;
  endDate?: Date;
  providerId?: string;
  locationId?: string;
  reasonForVisit?: string;
  chiefComplaint?: string;
}

interface InternalMedication {
  id: string;
  patientId: string;
  encounterId?: string;
  medication: string;
  medicationCode?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  status: string;
  prescriberId: string;
  startDate: Date;
  endDate?: Date;
  refills?: number;
}

/**
 * Transform internal patient to FHIR Patient
 */
export function patientToFHIR(patient: InternalPatient): Patient {
  const name: HumanName = {
    use: 'official',
    family: patient.lastName,
    given: [patient.firstName, patient.middleName].filter(Boolean) as string[],
  };

  const identifier = [
    createIdentifier(
      'http://hospital.example.org/mrn',
      patient.mrn,
      'official'
    ),
  ];

  if (patient.ssn) {
    identifier.push(
      createIdentifier(
        'http://hl7.org/fhir/sid/us-ssn',
        patient.ssn,
        'official'
      )
    );
  }

  const telecom: ContactPoint[] = [];
  if (patient.phone) {
    telecom.push({
      system: 'phone',
      value: patient.phone,
      use: 'mobile',
    });
  }
  if (patient.email) {
    telecom.push({
      system: 'email',
      value: patient.email,
    });
  }

  const address: Address[] = [];
  if (patient.address) {
    address.push({
      use: 'home',
      line: [patient.address],
      city: patient.city,
      state: patient.state,
      postalCode: patient.zipCode,
      country: 'US',
    });
  }

  const genderMap: Record<string, 'male' | 'female' | 'other' | 'unknown'> = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    UNKNOWN: 'unknown',
  };

  return {
    resourceType: 'Patient',
    id: patient.id,
    identifier,
    active: patient.active ?? true,
    name: [name],
    telecom: telecom.length > 0 ? telecom : undefined,
    gender: genderMap[patient.gender] || 'unknown',
    birthDate: patient.dateOfBirth.toISOString().split('T')[0],
    address: address.length > 0 ? address : undefined,
    maritalStatus: patient.maritalStatus
      ? createCodeableConcept(
          'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          patient.maritalStatus
        )
      : undefined,
    communication: patient.language
      ? [
          {
            language: createCodeableConcept(
              'urn:ietf:bcp:47',
              patient.language
            ),
            preferred: true,
          },
        ]
      : undefined,
  };
}

/**
 * Transform FHIR Patient to internal patient
 */
export function patientFromFHIR(fhirPatient: Patient): Partial<InternalPatient> {
  const name = fhirPatient.name?.[0];
  const mrnIdentifier = fhirPatient.identifier?.find(i =>
    i.system?.includes('mrn')
  );
  const ssnIdentifier = fhirPatient.identifier?.find(i =>
    i.system?.includes('ssn')
  );
  const phone = fhirPatient.telecom?.find(t => t.system === 'phone');
  const email = fhirPatient.telecom?.find(t => t.system === 'email');
  const address = fhirPatient.address?.[0];

  const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'> = {
    male: 'MALE',
    female: 'FEMALE',
    other: 'OTHER',
    unknown: 'UNKNOWN',
  };

  return {
    id: fhirPatient.id,
    mrn: mrnIdentifier?.value || '',
    firstName: name?.given?.[0] || '',
    middleName: name?.given?.[1],
    lastName: name?.family || '',
    dateOfBirth: fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : new Date(),
    gender: fhirPatient.gender ? genderMap[fhirPatient.gender] : 'UNKNOWN',
    ssn: ssnIdentifier?.value,
    email: email?.value,
    phone: phone?.value,
    address: address?.line?.[0],
    city: address?.city,
    state: address?.state,
    zipCode: address?.postalCode,
    maritalStatus: fhirPatient.maritalStatus?.coding?.[0]?.code,
    language: fhirPatient.communication?.[0]?.language.coding?.[0]?.code,
    active: fhirPatient.active,
  };
}

/**
 * Transform internal observation to FHIR Observation
 */
export function observationToFHIR(obs: InternalObservation): Observation {
  const statusMap: Record<string, Observation['status']> = {
    FINAL: 'final',
    PRELIMINARY: 'preliminary',
    AMENDED: 'amended',
    CORRECTED: 'corrected',
    CANCELLED: 'cancelled',
  };

  const observation: Observation = {
    resourceType: 'Observation',
    id: obs.id,
    status: statusMap[obs.status] || 'final',
    code: createCodeableConcept(obs.codeSystem, obs.code, obs.display),
    subject: createReference('Patient', obs.patientId),
    effectiveDateTime: obs.effectiveDate.toISOString(),
  };

  if (obs.category) {
    observation.category = [
      createCodeableConcept(
        'http://terminology.hl7.org/CodeSystem/observation-category',
        obs.category
      ),
    ];
  }

  if (obs.encounterId) {
    observation.encounter = createReference('Encounter', obs.encounterId);
  }

  if (obs.performerId) {
    observation.performer = [createReference('Practitioner', obs.performerId)];
  }

  // Handle different value types
  if (typeof obs.value === 'number') {
    observation.valueQuantity = {
      value: obs.value,
      unit: obs.unit,
      system: 'http://unitsofmeasure.org',
      code: obs.unit,
    };
  } else if (typeof obs.value === 'boolean') {
    observation.valueBoolean = obs.value;
  } else {
    observation.valueString = String(obs.value);
  }

  if (obs.notes) {
    observation.note = [{ text: obs.notes }];
  }

  return observation;
}

/**
 * Transform FHIR Observation to internal observation
 */
export function observationFromFHIR(fhirObs: Observation): Partial<InternalObservation> {
  const patientId = fhirObs.subject?.reference?.split('/')?.[1] || '';
  const encounterId = fhirObs.encounter?.reference?.split('/')?.[1];
  const performerId = fhirObs.performer?.[0]?.reference?.split('/')?.[1];

  let value: number | string | boolean = '';
  if (fhirObs.valueQuantity) {
    value = fhirObs.valueQuantity.value || 0;
  } else if (fhirObs.valueBoolean !== undefined) {
    value = fhirObs.valueBoolean;
  } else if (fhirObs.valueString) {
    value = fhirObs.valueString;
  } else if (fhirObs.valueCodeableConcept) {
    value = fhirObs.valueCodeableConcept.text || '';
  }

  return {
    id: fhirObs.id,
    patientId,
    encounterId,
    code: fhirObs.code.coding?.[0]?.code || '',
    codeSystem: fhirObs.code.coding?.[0]?.system || '',
    display: fhirObs.code.text || fhirObs.code.coding?.[0]?.display || '',
    value,
    unit: fhirObs.valueQuantity?.unit,
    status: fhirObs.status.toUpperCase(),
    category: fhirObs.category?.[0]?.coding?.[0]?.code,
    effectiveDate: fhirObs.effectiveDateTime
      ? new Date(fhirObs.effectiveDateTime)
      : new Date(),
    performerId,
    notes: fhirObs.note?.[0]?.text,
  };
}

/**
 * Transform internal encounter to FHIR Encounter
 */
export function encounterToFHIR(encounter: InternalEncounter): Encounter {
  const statusMap: Record<string, Encounter['status']> = {
    PLANNED: 'planned',
    ARRIVED: 'arrived',
    IN_PROGRESS: 'in-progress',
    FINISHED: 'finished',
    CANCELLED: 'cancelled',
  };

  const fhirEncounter: Encounter = {
    resourceType: 'Encounter',
    id: encounter.id,
    status: statusMap[encounter.status] || 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: encounter.class,
    },
    subject: createReference('Patient', encounter.patientId),
    period: {
      start: encounter.startDate.toISOString(),
      end: encounter.endDate?.toISOString(),
    },
  };

  if (encounter.type) {
    fhirEncounter.type = [
      createCodeableConcept(
        'http://snomed.info/sct',
        encounter.type
      ),
    ];
  }

  if (encounter.providerId) {
    fhirEncounter.participant = [
      {
        individual: createReference('Practitioner', encounter.providerId),
      },
    ];
  }

  if (encounter.locationId) {
    fhirEncounter.location = [
      {
        location: createReference('Location', encounter.locationId),
      },
    ];
  }

  if (encounter.reasonForVisit) {
    fhirEncounter.reasonCode = [
      {
        text: encounter.reasonForVisit,
      },
    ];
  }

  return fhirEncounter;
}

/**
 * Transform internal medication to FHIR MedicationRequest
 */
export function medicationToFHIR(med: InternalMedication): MedicationRequest {
  const statusMap: Record<string, MedicationRequest['status']> = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    STOPPED: 'stopped',
    DRAFT: 'draft',
  };

  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    id: med.id,
    status: statusMap[med.status] || 'active',
    intent: 'order',
    medicationCodeableConcept: med.medicationCode
      ? createCodeableConcept(
          'http://www.nlm.nih.gov/research/umls/rxnorm',
          med.medicationCode,
          med.medication
        )
      : { text: med.medication },
    subject: createReference('Patient', med.patientId),
    authoredOn: med.startDate.toISOString(),
    requester: createReference('Practitioner', med.prescriberId),
  };

  if (med.encounterId) {
    medicationRequest.encounter = createReference('Encounter', med.encounterId);
  }

  if (med.dosage || med.frequency || med.route) {
    medicationRequest.dosageInstruction = [
      {
        text: `${med.dosage || ''} ${med.frequency || ''} ${med.route || ''}`.trim(),
        route: med.route
          ? createCodeableConcept(
              'http://snomed.info/sct',
              med.route
            )
          : undefined,
      },
    ];
  }

  if (med.refills) {
    medicationRequest.dispenseRequest = {
      numberOfRepeatsAllowed: med.refills,
    };
  }

  return medicationRequest;
}

/**
 * Create FHIR Condition from diagnosis
 */
export function createCondition(params: {
  id?: string;
  patientId: string;
  encounterId?: string;
  code: string;
  codeSystem: string;
  display: string;
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
  verificationStatus: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted' | 'entered-in-error';
  severity?: string;
  onsetDate?: Date;
  notes?: string;
}): Condition {
  return {
    resourceType: 'Condition',
    id: params.id,
    clinicalStatus: createCodeableConcept(
      'http://terminology.hl7.org/CodeSystem/condition-clinical',
      params.clinicalStatus
    ),
    verificationStatus: createCodeableConcept(
      'http://terminology.hl7.org/CodeSystem/condition-ver-status',
      params.verificationStatus
    ),
    code: createCodeableConcept(params.codeSystem, params.code, params.display),
    subject: createReference('Patient', params.patientId),
    encounter: params.encounterId
      ? createReference('Encounter', params.encounterId)
      : undefined,
    onsetDateTime: params.onsetDate?.toISOString(),
    severity: params.severity
      ? createCodeableConcept(
          'http://snomed.info/sct',
          params.severity
        )
      : undefined,
    note: params.notes ? [{ text: params.notes }] : undefined,
  };
}

/**
 * Create FHIR DiagnosticReport
 */
export function createDiagnosticReport(params: {
  id?: string;
  patientId: string;
  encounterId?: string;
  code: string;
  codeSystem: string;
  display: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended';
  category?: string;
  effectiveDate: Date;
  issuedDate: Date;
  performerId?: string;
  observationIds?: string[];
  conclusion?: string;
}): DiagnosticReport {
  return {
    resourceType: 'DiagnosticReport',
    id: params.id,
    status: params.status,
    category: params.category
      ? [
          createCodeableConcept(
            'http://terminology.hl7.org/CodeSystem/v2-0074',
            params.category
          ),
        ]
      : undefined,
    code: createCodeableConcept(params.codeSystem, params.code, params.display),
    subject: createReference('Patient', params.patientId),
    encounter: params.encounterId
      ? createReference('Encounter', params.encounterId)
      : undefined,
    effectiveDateTime: params.effectiveDate.toISOString(),
    issued: params.issuedDate.toISOString(),
    performer: params.performerId
      ? [createReference('Practitioner', params.performerId)]
      : undefined,
    result: params.observationIds?.map(id => createReference('Observation', id)),
    conclusion: params.conclusion,
  };
}

/**
 * Create FHIR Appointment
 */
export function createAppointment(params: {
  id?: string;
  patientId: string;
  practitionerId: string;
  locationId?: string;
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  appointmentType?: string;
  serviceType?: string;
  startTime: Date;
  endTime: Date;
  duration?: number;
  description?: string;
  comment?: string;
}): Appointment {
  return {
    resourceType: 'Appointment',
    id: params.id,
    status: params.status,
    appointmentType: params.appointmentType
      ? createCodeableConcept(
          'http://terminology.hl7.org/CodeSystem/v2-0276',
          params.appointmentType
        )
      : undefined,
    serviceType: params.serviceType
      ? [createCodeableConcept('http://snomed.info/sct', params.serviceType)]
      : undefined,
    description: params.description,
    start: params.startTime.toISOString(),
    end: params.endTime.toISOString(),
    minutesDuration: params.duration,
    comment: params.comment,
    participant: [
      {
        actor: createReference('Patient', params.patientId),
        status: 'accepted',
      },
      {
        actor: createReference('Practitioner', params.practitionerId),
        status: 'accepted',
      },
      ...(params.locationId
        ? [
            {
              actor: createReference('Location', params.locationId),
              status: 'accepted' as const,
            },
          ]
        : []),
    ],
  };
}

/**
 * Bulk transform patients to FHIR
 */
export function bulkPatientToFHIR(patients: InternalPatient[]): Patient[] {
  return patients.map(patientToFHIR);
}

/**
 * Bulk transform observations to FHIR
 */
export function bulkObservationToFHIR(observations: InternalObservation[]): Observation[] {
  return observations.map(observationToFHIR);
}
