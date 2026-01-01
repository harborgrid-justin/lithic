/**
 * FHIR R4 Search Implementation
 * Comprehensive FHIR search parameter handling
 */

import type { FHIRSearchParams, Bundle, BundleEntry, Resource } from "@/types/fhir-resources";
import { db } from "@/lib/db";

export interface SearchContext {
  resourceType: string;
  params: FHIRSearchParams;
  baseUrl: string;
}

export interface SearchResult {
  resources: Resource[];
  total: number;
  links: {
    self: string;
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
}

/**
 * Execute FHIR search
 */
export async function executeSearch(context: SearchContext): Promise<Bundle> {
  const { resourceType, params, baseUrl } = context;

  // Parse search parameters
  const query = parseSearchParams(resourceType, params);

  // Execute database query
  const searchResult = await performSearch(resourceType, query, params);

  // Build FHIR Bundle response
  return buildSearchBundle(searchResult, context);
}

/**
 * Parse FHIR search parameters into database query
 */
function parseSearchParams(resourceType: string, params: FHIRSearchParams): any {
  const query: any = {};

  // Common parameters
  if (params._id) {
    query.id = params._id;
  }

  if (params._lastUpdated) {
    query.updatedAt = parseDateParam(params._lastUpdated);
  }

  // Resource-specific parameters
  switch (resourceType) {
    case "Patient":
      parsePatientParams(params, query);
      break;
    case "Observation":
      parseObservationParams(params, query);
      break;
    case "Condition":
      parseConditionParams(params, query);
      break;
    case "MedicationRequest":
      parseMedicationRequestParams(params, query);
      break;
    case "Encounter":
      parseEncounterParams(params, query);
      break;
    default:
      // Generic parsing
      break;
  }

  return query;
}

/**
 * Parse Patient search parameters
 */
function parsePatientParams(params: FHIRSearchParams, query: any): void {
  if (params.identifier) {
    const [system, value] = params.identifier.split("|");
    if (value) {
      query.mrn = value;
    } else {
      query.mrn = system;
    }
  }

  if (params.name) {
    query.OR = [
      { firstName: { contains: params.name, mode: "insensitive" } },
      { lastName: { contains: params.name, mode: "insensitive" } },
    ];
  }

  if (params.family) {
    query.lastName = { contains: params.family, mode: "insensitive" };
  }

  if (params.given) {
    query.firstName = { contains: params.given, mode: "insensitive" };
  }

  if (params.birthdate) {
    query.dateOfBirth = parseDateParam(params.birthdate);
  }

  if (params.gender) {
    query.gender = params.gender;
  }

  if (params.email) {
    query.email = params.email;
  }

  if (params.phone) {
    query.phone = { contains: params.phone };
  }

  if (params.address) {
    query.address = { contains: params.address, mode: "insensitive" };
  }

  if (params["address-city"]) {
    query.city = { contains: params["address-city"], mode: "insensitive" };
  }

  if (params["address-state"]) {
    query.state = params["address-state"];
  }

  if (params["address-postalcode"]) {
    query.postalCode = params["address-postalcode"];
  }
}

/**
 * Parse Observation search parameters
 */
function parseObservationParams(params: FHIRSearchParams, query: any): void {
  if (params.patient) {
    query.patientId = params.patient.replace("Patient/", "");
  }

  if (params.subject) {
    query.patientId = params.subject.replace("Patient/", "");
  }

  if (params.code) {
    const codes = parseTokenParam(params.code);
    if (codes.length === 1) {
      query.code = codes[0].code;
    } else {
      query.code = { in: codes.map((c) => c.code) };
    }
  }

  if (params.category) {
    query.category = parseTokenParam(params.category)[0]?.code;
  }

  if (params.status) {
    query.status = params.status;
  }

  if (params.date) {
    query.effectiveDateTime = parseDateParam(params.date);
  }

  if (params["value-quantity"]) {
    const [comparator, value, system, code] = params["value-quantity"].split("|");
    query.valueQuantity = parseQuantityParam(comparator, parseFloat(value));
  }

  if (params.encounter) {
    query.encounterId = params.encounter.replace("Encounter/", "");
  }
}

/**
 * Parse Condition search parameters
 */
function parseConditionParams(params: FHIRSearchParams, query: any): void {
  if (params.patient) {
    query.patientId = params.patient.replace("Patient/", "");
  }

  if (params.subject) {
    query.patientId = params.subject.replace("Patient/", "");
  }

  if (params.code) {
    const codes = parseTokenParam(params.code);
    if (codes.length === 1) {
      query.code = codes[0].code;
    } else {
      query.code = { in: codes.map((c) => c.code) };
    }
  }

  if (params["clinical-status"]) {
    query.clinicalStatus = params["clinical-status"];
  }

  if (params.category) {
    query.category = parseTokenParam(params.category)[0]?.code;
  }

  if (params["onset-date"]) {
    query.onsetDateTime = parseDateParam(params["onset-date"]);
  }

  if (params.severity) {
    query.severity = parseTokenParam(params.severity)[0]?.code;
  }
}

/**
 * Parse MedicationRequest search parameters
 */
function parseMedicationRequestParams(params: FHIRSearchParams, query: any): void {
  if (params.patient) {
    query.patientId = params.patient.replace("Patient/", "");
  }

  if (params.subject) {
    query.patientId = params.subject.replace("Patient/", "");
  }

  if (params.status) {
    query.status = params.status;
  }

  if (params.intent) {
    query.intent = params.intent;
  }

  if (params.medication) {
    const codes = parseTokenParam(params.medication);
    if (codes.length === 1) {
      query.medicationCode = codes[0].code;
    } else {
      query.medicationCode = { in: codes.map((c) => c.code) };
    }
  }

  if (params.authoredon) {
    query.authoredOn = parseDateParam(params.authoredon);
  }

  if (params.encounter) {
    query.encounterId = params.encounter.replace("Encounter/", "");
  }
}

/**
 * Parse Encounter search parameters
 */
function parseEncounterParams(params: FHIRSearchParams, query: any): void {
  if (params.patient) {
    query.patientId = params.patient.replace("Patient/", "");
  }

  if (params.subject) {
    query.patientId = params.subject.replace("Patient/", "");
  }

  if (params.status) {
    query.status = params.status;
  }

  if (params.class) {
    query.class = parseTokenParam(params.class)[0]?.code;
  }

  if (params.type) {
    query.type = parseTokenParam(params.type)[0]?.code;
  }

  if (params.date) {
    query.period = parseDateParam(params.date);
  }

  if (params.identifier) {
    const [system, value] = params.identifier.split("|");
    if (value) {
      query.identifier = value;
    } else {
      query.identifier = system;
    }
  }
}

/**
 * Parse date parameter (supports prefixes: eq, ne, lt, le, gt, ge, sa, eb, ap)
 */
function parseDateParam(dateParam: string): any {
  const prefixMatch = dateParam.match(/^(eq|ne|lt|le|gt|ge|sa|eb|ap)(.+)$/);

  if (prefixMatch) {
    const [, prefix, date] = prefixMatch;
    const dateValue = new Date(date);

    switch (prefix) {
      case "eq":
        return dateValue;
      case "ne":
        return { not: dateValue };
      case "lt":
        return { lt: dateValue };
      case "le":
        return { lte: dateValue };
      case "gt":
        return { gt: dateValue };
      case "ge":
        return { gte: dateValue };
      case "sa": // starts after
        return { gt: dateValue };
      case "eb": // ends before
        return { lt: dateValue };
      case "ap": // approximately (±1 day)
        const dayBefore = new Date(dateValue);
        dayBefore.setDate(dateValue.getDate() - 1);
        const dayAfter = new Date(dateValue);
        dayAfter.setDate(dateValue.getDate() + 1);
        return { gte: dayBefore, lte: dayAfter };
      default:
        return dateValue;
    }
  }

  return new Date(dateParam);
}

/**
 * Parse token parameter (system|code format)
 */
function parseTokenParam(tokenParam: string | string[]): Array<{ system?: string; code: string }> {
  const tokens = Array.isArray(tokenParam) ? tokenParam : [tokenParam];

  return tokens.map((token) => {
    const [system, code] = token.split("|");
    if (code) {
      return { system, code };
    }
    return { code: system };
  });
}

/**
 * Parse quantity parameter
 */
function parseQuantityParam(comparator: string, value: number): any {
  switch (comparator) {
    case "eq":
      return value;
    case "ne":
      return { not: value };
    case "lt":
      return { lt: value };
    case "le":
      return { lte: value };
    case "gt":
      return { gt: value };
    case "ge":
      return { gte: value };
    default:
      return value;
  }
}

/**
 * Perform database search
 */
async function performSearch(
  resourceType: string,
  query: any,
  params: FHIRSearchParams
): Promise<SearchResult> {
  const count = params._count || 50;
  const offset = params._offset || 0;

  let resources: any[] = [];
  let total = 0;

  switch (resourceType) {
    case "Patient":
      [resources, total] = await Promise.all([
        db.patient.findMany({
          where: query,
          skip: offset,
          take: count,
          orderBy: parseSort(params._sort, "Patient"),
        }),
        db.patient.count({ where: query }),
      ]);
      break;

    case "Observation":
      [resources, total] = await Promise.all([
        db.observation.findMany({
          where: query,
          skip: offset,
          take: count,
          orderBy: parseSort(params._sort, "Observation"),
        }),
        db.observation.count({ where: query }),
      ]);
      break;

    case "Condition":
      [resources, total] = await Promise.all([
        db.condition.findMany({
          where: query,
          skip: offset,
          take: count,
          orderBy: parseSort(params._sort, "Condition"),
        }),
        db.condition.count({ where: query }),
      ]);
      break;

    case "MedicationRequest":
      [resources, total] = await Promise.all([
        db.medication.findMany({
          where: query,
          skip: offset,
          take: count,
          orderBy: parseSort(params._sort, "MedicationRequest"),
        }),
        db.medication.count({ where: query }),
      ]);
      break;

    case "Encounter":
      [resources, total] = await Promise.all([
        db.encounter.findMany({
          where: query,
          skip: offset,
          take: count,
          orderBy: parseSort(params._sort, "Encounter"),
        }),
        db.encounter.count({ where: query }),
      ]);
      break;

    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }

  return {
    resources,
    total,
    links: {
      self: "", // Will be set in buildSearchBundle
    },
  };
}

/**
 * Parse sort parameter
 */
function parseSort(sortParam: string | undefined, resourceType: string): any {
  if (!sortParam) {
    return { updatedAt: "desc" };
  }

  const direction = sortParam.startsWith("-") ? "desc" : "asc";
  const field = sortParam.replace(/^-/, "");

  // Map FHIR search parameters to database fields
  const fieldMap: Record<string, Record<string, string>> = {
    Patient: {
      name: "lastName",
      birthdate: "dateOfBirth",
      _lastUpdated: "updatedAt",
    },
    Observation: {
      date: "effectiveDateTime",
      _lastUpdated: "updatedAt",
    },
    Condition: {
      "onset-date": "onsetDateTime",
      _lastUpdated: "updatedAt",
    },
    MedicationRequest: {
      authoredon: "authoredOn",
      _lastUpdated: "updatedAt",
    },
    Encounter: {
      date: "startTime",
      _lastUpdated: "updatedAt",
    },
  };

  const dbField = fieldMap[resourceType]?.[field] || field;

  return { [dbField]: direction };
}

/**
 * Build FHIR Bundle from search results
 */
function buildSearchBundle(result: SearchResult, context: SearchContext): Bundle {
  const { resourceType, params, baseUrl } = context;
  const count = params._count || 50;
  const offset = params._offset || 0;

  const entries: BundleEntry[] = result.resources.map((resource) => {
    const fhirResource = transformToFHIR(resourceType, resource);

    return {
      fullUrl: `${baseUrl}/${resourceType}/${resource.id}`,
      resource: fhirResource,
      search: { mode: "match" },
    };
  });

  // Build links
  const queryString = new URLSearchParams(params as any).toString();
  const links: any = {
    self: `${baseUrl}/${resourceType}?${queryString}`,
  };

  if (offset > 0) {
    const prevOffset = Math.max(0, offset - count);
    links.previous = `${baseUrl}/${resourceType}?${queryString}&_offset=${prevOffset}`;
  }

  if (offset + count < result.total) {
    const nextOffset = offset + count;
    links.next = `${baseUrl}/${resourceType}?${queryString}&_offset=${nextOffset}`;
  }

  links.first = `${baseUrl}/${resourceType}?${queryString}&_offset=0`;

  const lastOffset = Math.floor(result.total / count) * count;
  links.last = `${baseUrl}/${resourceType}?${queryString}&_offset=${lastOffset}`;

  return {
    resourceType: "Bundle",
    type: "searchset",
    timestamp: new Date().toISOString(),
    total: result.total,
    link: Object.entries(links).map(([relation, url]) => ({
      relation,
      url: url as string,
    })),
    entry: entries,
  };
}

/**
 * Transform database resource to FHIR
 */
function transformToFHIR(resourceType: string, resource: any): Resource {
  // This would use the full transformers from the FHIR server
  // For now, simplified implementation
  switch (resourceType) {
    case "Patient":
      return {
        resourceType: "Patient",
        id: resource.id,
        identifier: resource.mrn ? [{ system: "MRN", value: resource.mrn }] : [],
        name: [
          {
            family: resource.lastName,
            given: [resource.firstName],
          },
        ],
        gender: resource.gender,
        birthDate: resource.dateOfBirth?.toISOString().split("T")[0],
      };

    case "Observation":
      return {
        resourceType: "Observation",
        id: resource.id,
        status: resource.status || "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: resource.code,
              display: resource.display,
            },
          ],
        },
        subject: { reference: `Patient/${resource.patientId}` },
        effectiveDateTime: resource.effectiveDateTime?.toISOString(),
      };

    default:
      return {
        resourceType: resourceType as any,
        id: resource.id,
      };
  }
}

/**
 * Chain search parameters
 */
export function parseChainedSearch(param: string, value: string): any {
  const chainParts = param.split(".");

  if (chainParts.length === 1) {
    return { [param]: value };
  }

  // Example: Observation?subject.name=Smith
  // This would search for Observations where the subject (Patient) has name "Smith"
  const [reference, ...chain] = chainParts;

  return {
    [reference]: {
      [chain.join(".")]: value,
    },
  };
}

/**
 * Reverse chain search (_has parameter)
 */
export function parseReverseChain(hasParam: string): any {
  // Example: Patient?_has:Observation:subject:code=1234-5
  // Find Patients that have Observations with code 1234-5
  const [resourceType, reference, ...params] = hasParam.split(":");

  return {
    _has: {
      resourceType,
      reference,
      params: params.join(":"),
    },
  };
}
