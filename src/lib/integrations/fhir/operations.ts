/**
 * FHIR R4 Operations
 * Implementation of FHIR operations ($everything, $validate, $match, etc.)
 */

import type {
  Resource,
  Patient,
  Bundle,
  OperationOutcome,
  Parameters,
  BundleEntry,
} from "@/types/fhir-resources";
import { db } from "@/lib/db";

// Parameters type (simplified for operations)
interface Parameters extends Resource {
  resourceType: "Parameters";
  parameter: ParameterComponent[];
}

interface ParameterComponent {
  name: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueUri?: string;
  valueCode?: string;
  valueDateTime?: string;
  resource?: Resource;
  part?: ParameterComponent[];
}

/**
 * Patient $everything Operation
 * Returns all resources related to a patient
 */
export async function patientEverything(
  patientId: string,
  params?: {
    start?: string;
    end?: string;
    _since?: string;
    _type?: string[];
    _count?: number;
  }
): Promise<Bundle> {
  try {
    // Fetch patient
    const patient = await db.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const entries: BundleEntry[] = [];

    // Add patient resource
    entries.push({
      fullUrl: `Patient/${patientId}`,
      resource: transformPatientToFHIR(patient),
      search: { mode: "match" },
    });

    // Fetch and add related resources
    const resourceTypes = params?._type || [
      "Observation",
      "Condition",
      "MedicationRequest",
      "Encounter",
      "Procedure",
      "AllergyIntolerance",
      "Immunization",
      "DiagnosticReport",
      "CarePlan",
    ];

    // Fetch Observations
    if (resourceTypes.includes("Observation")) {
      const observations = await db.observation.findMany({
        where: {
          patientId,
          ...(params?.start && { effectiveDateTime: { gte: new Date(params.start) } }),
          ...(params?.end && { effectiveDateTime: { lte: new Date(params.end) } }),
          ...(params?._since && { updatedAt: { gte: new Date(params._since) } }),
        },
        take: params?._count,
      });

      observations.forEach((obs) => {
        entries.push({
          fullUrl: `Observation/${obs.id}`,
          resource: transformObservationToFHIR(obs),
          search: { mode: "include" },
        });
      });
    }

    // Fetch Conditions
    if (resourceTypes.includes("Condition")) {
      const conditions = await db.condition.findMany({
        where: {
          patientId,
          ...(params?._since && { updatedAt: { gte: new Date(params._since) } }),
        },
        take: params?._count,
      });

      conditions.forEach((condition) => {
        entries.push({
          fullUrl: `Condition/${condition.id}`,
          resource: transformConditionToFHIR(condition),
          search: { mode: "include" },
        });
      });
    }

    // Fetch MedicationRequests
    if (resourceTypes.includes("MedicationRequest")) {
      const medications = await db.medication.findMany({
        where: {
          patientId,
          ...(params?._since && { updatedAt: { gte: new Date(params._since) } }),
        },
        take: params?._count,
      });

      medications.forEach((med) => {
        entries.push({
          fullUrl: `MedicationRequest/${med.id}`,
          resource: transformMedicationToFHIR(med),
          search: { mode: "include" },
        });
      });
    }

    // Fetch Encounters
    if (resourceTypes.includes("Encounter")) {
      const encounters = await db.encounter.findMany({
        where: {
          patientId,
          ...(params?.start && { startTime: { gte: new Date(params.start) } }),
          ...(params?.end && { endTime: { lte: new Date(params.end) } }),
          ...(params?._since && { updatedAt: { gte: new Date(params._since) } }),
        },
        take: params?._count,
      });

      encounters.forEach((encounter) => {
        entries.push({
          fullUrl: `Encounter/${encounter.id}`,
          resource: transformEncounterToFHIR(encounter),
          search: { mode: "include" },
        });
      });
    }

    return {
      resourceType: "Bundle",
      type: "searchset",
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };
  } catch (error) {
    throw new Error(`Error executing $everything operation: ${error}`);
  }
}

/**
 * Resource $validate Operation
 * Validates a FHIR resource against the specification
 */
export async function validateResource(
  resource: Resource,
  params?: {
    mode?: "create" | "update" | "delete";
    profile?: string;
  }
): Promise<OperationOutcome> {
  const issues: any[] = [];

  // Basic validation
  if (!resource.resourceType) {
    issues.push({
      severity: "error",
      code: "required",
      diagnostics: "Resource must have a resourceType",
      expression: ["resourceType"],
    });
  }

  // Resource-specific validation
  switch (resource.resourceType) {
    case "Patient":
      validatePatient(resource as Patient, issues);
      break;
    case "Observation":
      validateObservation(resource as any, issues);
      break;
    // Add more resource types as needed
  }

  // Profile validation if specified
  if (params?.profile) {
    // TODO: Implement profile-specific validation
  }

  return {
    resourceType: "OperationOutcome",
    issue: issues.length > 0 ? issues : [
      {
        severity: "information",
        code: "informational",
        diagnostics: "Validation successful",
      },
    ],
  };
}

/**
 * Patient $match Operation
 * Finds patient matches based on demographics
 */
export async function patientMatch(parameters: Parameters): Promise<Bundle> {
  const resourceParam = parameters.parameter.find((p) => p.name === "resource");
  const onlyCertainMatchesParam = parameters.parameter.find(
    (p) => p.name === "onlyCertainMatches"
  );
  const countParam = parameters.parameter.find((p) => p.name === "count");

  if (!resourceParam?.resource) {
    throw new Error("Missing required 'resource' parameter");
  }

  const patient = resourceParam.resource as Patient;
  const onlyCertainMatches = onlyCertainMatchesParam?.valueBoolean ?? false;
  const count = countParam?.valueInteger ?? 10;

  // Build search criteria
  const searchCriteria: any = {};

  if (patient.name?.[0]) {
    const name = patient.name[0];
    if (name.family) {
      searchCriteria.lastName = { contains: name.family, mode: "insensitive" };
    }
    if (name.given?.[0]) {
      searchCriteria.firstName = { contains: name.given[0], mode: "insensitive" };
    }
  }

  if (patient.birthDate) {
    searchCriteria.dateOfBirth = new Date(patient.birthDate);
  }

  if (patient.gender) {
    searchCriteria.gender = patient.gender;
  }

  // Search for matches
  const matches = await db.patient.findMany({
    where: searchCriteria,
    take: count,
  });

  // Calculate match scores
  const entries: BundleEntry[] = matches.map((match) => {
    const score = calculateMatchScore(patient, match);

    if (onlyCertainMatches && score < 0.8) {
      return null;
    }

    return {
      fullUrl: `Patient/${match.id}`,
      resource: transformPatientToFHIR(match),
      search: {
        mode: "match",
        score,
      },
    };
  }).filter((e): e is BundleEntry => e !== null);

  return {
    resourceType: "Bundle",
    type: "searchset",
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}

/**
 * Observation $stats Operation
 * Statistical analysis of observations
 */
export async function observationStats(
  params: {
    subject?: string;
    code?: string;
    start?: string;
    end?: string;
  }
): Promise<Parameters> {
  const observations = await db.observation.findMany({
    where: {
      ...(params.subject && { patientId: params.subject.replace("Patient/", "") }),
      ...(params.code && { code: params.code }),
      ...(params.start && { effectiveDateTime: { gte: new Date(params.start) } }),
      ...(params.end && { effectiveDateTime: { lte: new Date(params.end) } }),
    },
  });

  // Calculate statistics
  const values = observations
    .map((obs) => obs.valueQuantity)
    .filter((v): v is number => typeof v === "number");

  const stats = {
    count: values.length,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    mean: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    median: calculateMedian(values),
    stdDev: calculateStdDev(values),
  };

  return {
    resourceType: "Parameters",
    parameter: [
      { name: "count", valueInteger: stats.count },
      { name: "min", valueDecimal: stats.min },
      { name: "max", valueDecimal: stats.max },
      { name: "mean", valueDecimal: stats.mean },
      { name: "median", valueDecimal: stats.median },
      { name: "stdDev", valueDecimal: stats.stdDev },
    ],
  };
}

/**
 * Coverage $eligibility Operation
 * Check insurance eligibility
 */
export async function coverageEligibility(
  coverage: string,
  params?: {
    service?: string;
    provider?: string;
  }
): Promise<Parameters> {
  // This would integrate with actual eligibility checking service
  // For now, return a mock response
  return {
    resourceType: "Parameters",
    parameter: [
      { name: "eligible", valueBoolean: true },
      { name: "coverage", valueString: coverage },
      { name: "copay", valueDecimal: 25.0 },
      { name: "deductible", valueDecimal: 500.0 },
      { name: "deductibleRemaining", valueDecimal: 350.0 },
    ],
  };
}

// Helper Functions

function validatePatient(patient: Patient, issues: any[]): void {
  if (!patient.name || patient.name.length === 0) {
    issues.push({
      severity: "error",
      code: "required",
      diagnostics: "Patient must have at least one name",
      expression: ["Patient.name"],
    });
  }

  if (patient.gender && !["male", "female", "other", "unknown"].includes(patient.gender)) {
    issues.push({
      severity: "error",
      code: "code-invalid",
      diagnostics: "Invalid gender code",
      expression: ["Patient.gender"],
    });
  }

  if (patient.birthDate) {
    const birthDate = new Date(patient.birthDate);
    if (isNaN(birthDate.getTime())) {
      issues.push({
        severity: "error",
        code: "invalid",
        diagnostics: "Invalid birth date format",
        expression: ["Patient.birthDate"],
      });
    }
  }
}

function validateObservation(observation: any, issues: any[]): void {
  if (!observation.status) {
    issues.push({
      severity: "error",
      code: "required",
      diagnostics: "Observation must have a status",
      expression: ["Observation.status"],
    });
  }

  if (!observation.code) {
    issues.push({
      severity: "error",
      code: "required",
      diagnostics: "Observation must have a code",
      expression: ["Observation.code"],
    });
  }
}

function calculateMatchScore(searchPatient: Patient, candidatePatient: any): number {
  let score = 0;
  let totalWeight = 0;

  // Name matching (weight: 30%)
  if (searchPatient.name?.[0] && candidatePatient.lastName) {
    const weight = 0.3;
    totalWeight += weight;

    const searchFamily = searchPatient.name[0].family?.toLowerCase() || "";
    const candidateFamily = candidatePatient.lastName.toLowerCase();

    if (searchFamily === candidateFamily) {
      score += weight;
    } else if (candidateFamily.includes(searchFamily) || searchFamily.includes(candidateFamily)) {
      score += weight * 0.7;
    }

    // Given name
    const searchGiven = searchPatient.name[0].given?.[0]?.toLowerCase() || "";
    const candidateGiven = candidatePatient.firstName.toLowerCase();

    if (searchGiven === candidateGiven) {
      score += weight;
    } else if (candidateGiven.includes(searchGiven) || searchGiven.includes(candidateGiven)) {
      score += weight * 0.7;
    }
  }

  // Birth date matching (weight: 40%)
  if (searchPatient.birthDate && candidatePatient.dateOfBirth) {
    const weight = 0.4;
    totalWeight += weight;

    if (searchPatient.birthDate === candidatePatient.dateOfBirth.toISOString().split("T")[0]) {
      score += weight;
    }
  }

  // Gender matching (weight: 10%)
  if (searchPatient.gender && candidatePatient.gender) {
    const weight = 0.1;
    totalWeight += weight;

    if (searchPatient.gender === candidatePatient.gender) {
      score += weight;
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

  return Math.sqrt(variance);
}

// Transform functions (simplified - would use full transformers in production)
function transformPatientToFHIR(patient: any): Patient {
  return {
    resourceType: "Patient",
    id: patient.id,
    identifier: patient.mrn ? [{ system: "MRN", value: patient.mrn }] : [],
    name: [
      {
        family: patient.lastName,
        given: [patient.firstName],
        ...(patient.middleName && { given: [patient.firstName, patient.middleName] }),
      },
    ],
    gender: patient.gender as any,
    birthDate: patient.dateOfBirth?.toISOString().split("T")[0],
    telecom: patient.phone ? [{ system: "phone", value: patient.phone }] : [],
    address: patient.address ? [{ text: patient.address }] : [],
  };
}

function transformObservationToFHIR(observation: any): any {
  return {
    resourceType: "Observation",
    id: observation.id,
    status: observation.status || "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: observation.code,
          display: observation.display,
        },
      ],
    },
    subject: { reference: `Patient/${observation.patientId}` },
    effectiveDateTime: observation.effectiveDateTime?.toISOString(),
    valueQuantity: observation.valueQuantity
      ? {
          value: observation.valueQuantity,
          unit: observation.unit,
        }
      : undefined,
  };
}

function transformConditionToFHIR(condition: any): any {
  return {
    resourceType: "Condition",
    id: condition.id,
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: condition.clinicalStatus || "active",
        },
      ],
    },
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: condition.code,
          display: condition.display,
        },
      ],
    },
    subject: { reference: `Patient/${condition.patientId}` },
    onsetDateTime: condition.onsetDateTime?.toISOString(),
  };
}

function transformMedicationToFHIR(medication: any): any {
  return {
    resourceType: "MedicationRequest",
    id: medication.id,
    status: medication.status || "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: [
        {
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          code: medication.code,
          display: medication.name,
        },
      ],
    },
    subject: { reference: `Patient/${medication.patientId}` },
    authoredOn: medication.prescribedDate?.toISOString(),
  };
}

function transformEncounterToFHIR(encounter: any): any {
  return {
    resourceType: "Encounter",
    id: encounter.id,
    status: encounter.status || "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: encounter.encounterType || "AMB",
    },
    subject: { reference: `Patient/${encounter.patientId}` },
    period: {
      start: encounter.startTime?.toISOString(),
      end: encounter.endTime?.toISOString(),
    },
  };
}
