/**
 * FHIR Patient Resource Transformer
 * Transform between internal patient data and FHIR R4 Patient resource
 */

import type {
  Patient,
  HumanName,
  Address,
  ContactPoint,
  Identifier,
} from "../resources";
import {
  createReference,
  createCodeableConcept,
  createIdentifier,
} from "../resources";

export interface InternalPatient {
  id: string;
  mrn: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  prefix?: string | null;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  ssn?: string | null;
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  homePhone?: string | null;
  workPhone?: string | null;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  maritalStatus?: string | null;
  race?: string | null;
  ethnicity?: string | null;
  language?: string | null;
  preferredLanguage?: string | null;
  active: boolean;
  deceased?: boolean | null;
  deceasedDate?: Date | null;
  multipleBirth?: boolean | null;
  birthOrder?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  primaryProviderId?: string | null;
  organizationId?: string | null;
  photoUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Transform internal patient to FHIR Patient resource
 */
export function patientToFHIR(patient: InternalPatient): Patient {
  // Build name
  const name: HumanName = {
    use: "official",
    family: patient.lastName,
    given: [patient.firstName, patient.middleName].filter(Boolean) as string[],
  };

  if (patient.prefix) {
    name.prefix = [patient.prefix];
  }

  if (patient.suffix) {
    name.suffix = [patient.suffix];
  }

  // Build identifiers
  const identifier: Identifier[] = [
    createIdentifier(
      "http://hospital.lithic.health/mrn",
      patient.mrn,
      "official",
    ),
  ];

  if (patient.ssn) {
    identifier.push(
      createIdentifier(
        "http://hl7.org/fhir/sid/us-ssn",
        patient.ssn,
        "official",
      ),
    );
  }

  // Build telecom
  const telecom: ContactPoint[] = [];

  if (patient.mobilePhone) {
    telecom.push({
      system: "phone",
      value: patient.mobilePhone,
      use: "mobile",
      rank: 1,
    });
  }

  if (patient.homePhone) {
    telecom.push({
      system: "phone",
      value: patient.homePhone,
      use: "home",
      rank: 2,
    });
  }

  if (patient.workPhone) {
    telecom.push({
      system: "phone",
      value: patient.workPhone,
      use: "work",
      rank: 3,
    });
  }

  if (patient.phone && !patient.mobilePhone && !patient.homePhone) {
    telecom.push({
      system: "phone",
      value: patient.phone,
      use: "home",
    });
  }

  if (patient.email) {
    telecom.push({
      system: "email",
      value: patient.email,
    });
  }

  // Build address
  const address: Address[] = [];
  if (patient.address) {
    const addr: Address = {
      use: "home",
      type: "physical",
      line: [patient.address, patient.address2].filter(Boolean) as string[],
    };

    if (patient.city) addr.city = patient.city;
    if (patient.state) addr.state = patient.state;
    if (patient.zipCode) addr.postalCode = patient.zipCode;
    addr.country = patient.country || "US";

    address.push(addr);
  }

  // Gender mapping
  const genderMap: Record<string, "male" | "female" | "other" | "unknown"> = {
    MALE: "male",
    FEMALE: "female",
    OTHER: "other",
    UNKNOWN: "unknown",
  };

  // Build patient resource
  const fhirPatient: Patient = {
    resourceType: "Patient",
    id: patient.id,
    meta: {
      lastUpdated: patient.updatedAt?.toISOString() || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
      ],
    },
    identifier,
    active: patient.active,
    name: [name],
    gender: genderMap[patient.gender] || "unknown",
    birthDate: patient.dateOfBirth.toISOString().split("T")[0] || "",
  };

  // Add optional fields
  if (telecom.length > 0) {
    fhirPatient.telecom = telecom;
  }

  if (address.length > 0) {
    fhirPatient.address = address;
  }

  if (patient.maritalStatus) {
    fhirPatient.maritalStatus = createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
      patient.maritalStatus,
    );
  }

  if (patient.deceased) {
    if (patient.deceasedDate) {
      fhirPatient.deceasedDateTime = patient.deceasedDate.toISOString();
    } else {
      fhirPatient.deceasedBoolean = true;
    }
  }

  if (patient.multipleBirth !== null && patient.multipleBirth !== undefined) {
    if (patient.birthOrder) {
      fhirPatient.multipleBirthInteger = patient.birthOrder;
    } else {
      fhirPatient.multipleBirthBoolean = patient.multipleBirth;
    }
  }

  if (patient.photoUrl) {
    fhirPatient.photo = [
      {
        url: patient.photoUrl,
        contentType: "image/jpeg",
      },
    ];
  }

  if (patient.preferredLanguage || patient.language) {
    fhirPatient.communication = [
      {
        language: createCodeableConcept(
          "urn:ietf:bcp:47",
          patient.preferredLanguage || patient.language || "en",
        ),
        preferred: true,
      },
    ];
  }

  if (patient.emergencyContactName) {
    fhirPatient.contact = [
      {
        relationship: patient.emergencyContactRelationship
          ? [
              createCodeableConcept(
                "http://terminology.hl7.org/CodeSystem/v2-0131",
                patient.emergencyContactRelationship,
              ),
            ]
          : undefined,
        name: {
          text: patient.emergencyContactName,
        },
        telecom: patient.emergencyContactPhone
          ? [
              {
                system: "phone",
                value: patient.emergencyContactPhone,
              },
            ]
          : undefined,
      },
    ];
  }

  if (patient.primaryProviderId) {
    fhirPatient.generalPractitioner = [
      createReference("Practitioner", patient.primaryProviderId),
    ];
  }

  if (patient.organizationId) {
    fhirPatient.managingOrganization = createReference(
      "Organization",
      patient.organizationId,
    );
  }

  // Add US Core extensions
  if (patient.race) {
    // US Core race extension would go here
  }

  if (patient.ethnicity) {
    // US Core ethnicity extension would go here
  }

  return fhirPatient;
}

/**
 * Transform FHIR Patient resource to internal patient data
 */
export function patientFromFHIR(
  fhirPatient: Patient,
): Partial<InternalPatient> {
  const name = fhirPatient.name?.[0];
  const mrnIdentifier = fhirPatient.identifier?.find(
    (i) => i.system?.includes("mrn") || i.use === "official",
  );
  const ssnIdentifier = fhirPatient.identifier?.find((i) =>
    i.system?.includes("ssn"),
  );

  const phones = fhirPatient.telecom?.filter((t) => t.system === "phone") || [];
  const mobilePhone = phones.find((p) => p.use === "mobile")?.value;
  const homePhone = phones.find((p) => p.use === "home")?.value;
  const workPhone = phones.find((p) => p.use === "work")?.value;
  const phone = phones[0]?.value;

  const email = fhirPatient.telecom?.find((t) => t.system === "email");
  const address = fhirPatient.address?.[0];
  const emergencyContact = fhirPatient.contact?.[0];

  const genderMap: Record<string, "MALE" | "FEMALE" | "OTHER" | "UNKNOWN"> = {
    male: "MALE",
    female: "FEMALE",
    other: "OTHER",
    unknown: "UNKNOWN",
  };

  const internalPatient: Partial<InternalPatient> = {
    id: fhirPatient.id,
    mrn: mrnIdentifier?.value || "",
    firstName: name?.given?.[0] || "",
    middleName: name?.given?.[1],
    lastName: name?.family || "",
    prefix: name?.prefix?.[0],
    suffix: name?.suffix?.[0],
    dateOfBirth: fhirPatient.birthDate
      ? new Date(fhirPatient.birthDate)
      : new Date(),
    gender: fhirPatient.gender ? genderMap[fhirPatient.gender] : "UNKNOWN",
    ssn: ssnIdentifier?.value,
    email: email?.value,
    phone,
    mobilePhone,
    homePhone,
    workPhone,
    address: address?.line?.[0],
    address2: address?.line?.[1],
    city: address?.city,
    state: address?.state,
    zipCode: address?.postalCode,
    country: address?.country,
    maritalStatus: fhirPatient.maritalStatus?.coding?.[0]?.code,
    language: fhirPatient.communication?.[0]?.language.coding?.[0]?.code,
    preferredLanguage: fhirPatient.communication?.find((c) => c.preferred)
      ?.language.coding?.[0]?.code,
    active: fhirPatient.active ?? true,
    deceased: fhirPatient.deceasedBoolean || !!fhirPatient.deceasedDateTime,
    deceasedDate: fhirPatient.deceasedDateTime
      ? new Date(fhirPatient.deceasedDateTime)
      : undefined,
    multipleBirth: fhirPatient.multipleBirthBoolean,
    birthOrder: fhirPatient.multipleBirthInteger,
    emergencyContactName: emergencyContact?.name?.text,
    emergencyContactPhone: emergencyContact?.telecom?.find(
      (t) => t.system === "phone",
    )?.value,
    emergencyContactRelationship:
      emergencyContact?.relationship?.[0]?.coding?.[0]?.code,
    primaryProviderId:
      fhirPatient.generalPractitioner?.[0]?.reference?.split("/")?.[1],
    organizationId:
      fhirPatient.managingOrganization?.reference?.split("/")?.[1],
    photoUrl: fhirPatient.photo?.[0]?.url,
    updatedAt: fhirPatient.meta?.lastUpdated
      ? new Date(fhirPatient.meta.lastUpdated)
      : undefined,
  };

  return internalPatient;
}

/**
 * Validate patient data for FHIR conversion
 */
export function validatePatient(patient: Partial<InternalPatient>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!patient.firstName) errors.push("First name is required");
  if (!patient.lastName) errors.push("Last name is required");
  if (!patient.dateOfBirth) errors.push("Date of birth is required");
  if (!patient.gender) errors.push("Gender is required");
  if (!patient.mrn) errors.push("MRN is required");

  // Validate date of birth is in the past
  if (patient.dateOfBirth && patient.dateOfBirth > new Date()) {
    errors.push("Date of birth cannot be in the future");
  }

  // Validate email format if provided
  if (patient.email && !patient.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
