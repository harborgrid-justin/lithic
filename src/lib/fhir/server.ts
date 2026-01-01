/**
 * FHIR R4 Server Implementation
 * Enterprise-grade FHIR server with full capability statement and resource handlers
 */

import { z } from "zod";
import type { Bundle, CodeableConcept } from "./resources";

export interface CapabilityStatement {
  resourceType: "CapabilityStatement";
  status: "draft" | "active" | "retired" | "unknown";
  date: string;
  publisher?: string;
  kind: "instance" | "capability" | "requirements";
  software?: {
    name: string;
    version?: string;
    releaseDate?: string;
  };
  implementation?: {
    description: string;
    url?: string;
  };
  fhirVersion: string;
  format: string[];
  rest?: Array<{
    mode: "client" | "server";
    documentation?: string;
    security?: {
      cors?: boolean;
      service?: CodeableConcept[];
      description?: string;
    };
    resource?: Array<{
      type: string;
      profile?: string;
      documentation?: string;
      interaction?: Array<{
        code:
          | "read"
          | "vread"
          | "update"
          | "patch"
          | "delete"
          | "history-instance"
          | "history-type"
          | "create"
          | "search-type";
        documentation?: string;
      }>;
      versioning?: "no-version" | "versioned" | "versioned-update";
      readHistory?: boolean;
      updateCreate?: boolean;
      conditionalCreate?: boolean;
      conditionalRead?:
        | "not-supported"
        | "modified-since"
        | "not-match"
        | "full-support";
      conditionalUpdate?: boolean;
      conditionalDelete?: "not-supported" | "single" | "multiple";
      searchInclude?: string[];
      searchRevInclude?: string[];
      searchParam?: Array<{
        name: string;
        definition?: string;
        type:
          | "number"
          | "date"
          | "string"
          | "token"
          | "reference"
          | "composite"
          | "quantity"
          | "uri"
          | "special";
        documentation?: string;
      }>;
    }>;
    interaction?: Array<{
      code: "transaction" | "batch" | "search-system" | "history-system";
      documentation?: string;
    }>;
    operation?: Array<{
      name: string;
      definition: string;
      documentation?: string;
    }>;
  }>;
}

/**
 * FHIR Server Configuration
 */
export interface FHIRServerConfig {
  baseUrl: string;
  version: string;
  publisher: string;
  supportedResources: string[];
  enableCORS: boolean;
  enableSmartOnFHIR: boolean;
  enableBulkData: boolean;
}

/**
 * FHIR Search Parameters
 */
export interface SearchParameters {
  _count?: number;
  _offset?: number;
  _sort?: string;
  _include?: string[];
  _revinclude?: string[];
  _elements?: string[];
  _summary?: "true" | "text" | "data" | "count" | "false";
  _total?: "none" | "estimate" | "accurate";
  _format?: string;
  [key: string]: any;
}

/**
 * FHIR Server
 */
export class FHIRServer {
  private config: FHIRServerConfig;

  constructor(config: Partial<FHIRServerConfig> = {}) {
    this.config = {
      baseUrl:
        config.baseUrl ||
        process.env.NEXT_PUBLIC_FHIR_BASE_URL ||
        "http://localhost:3000/api/fhir",
      version: config.version || "0.2.0",
      publisher: config.publisher || "Lithic Healthcare Platform",
      supportedResources: config.supportedResources || [
        "Patient",
        "Practitioner",
        "Organization",
        "Location",
        "Encounter",
        "Observation",
        "Condition",
        "Procedure",
        "MedicationRequest",
        "MedicationAdministration",
        "AllergyIntolerance",
        "DiagnosticReport",
        "DocumentReference",
        "Appointment",
        "Schedule",
        "Slot",
        "ServiceRequest",
        "CarePlan",
        "Goal",
        "ClinicalImpression",
        "Immunization",
        "Binary",
      ],
      enableCORS: config.enableCORS ?? true,
      enableSmartOnFHIR: config.enableSmartOnFHIR ?? true,
      enableBulkData: config.enableBulkData ?? true,
    };
  }

  /**
   * Generate FHIR Capability Statement (metadata endpoint)
   */
  getCapabilityStatement(): CapabilityStatement {
    const resources = this.config.supportedResources.map((resourceType) => ({
      type: resourceType,
      profile: `http://hl7.org/fhir/StructureDefinition/${resourceType}`,
      interaction: [
        { code: "read" as const, documentation: `Read ${resourceType} by ID` },
        {
          code: "vread" as const,
          documentation: `Read specific version of ${resourceType}`,
        },
        { code: "update" as const, documentation: `Update ${resourceType}` },
        { code: "delete" as const, documentation: `Delete ${resourceType}` },
        {
          code: "create" as const,
          documentation: `Create new ${resourceType}`,
        },
        {
          code: "search-type" as const,
          documentation: `Search ${resourceType}`,
        },
        {
          code: "history-instance" as const,
          documentation: `History for ${resourceType} instance`,
        },
        {
          code: "history-type" as const,
          documentation: `History for ${resourceType} type`,
        },
      ],
      versioning: "versioned" as const,
      readHistory: true,
      updateCreate: false,
      conditionalCreate: true,
      conditionalRead: "full-support" as const,
      conditionalUpdate: true,
      conditionalDelete: "single" as const,
      searchInclude: ["*"],
      searchRevInclude: ["*"],
      searchParam: this.getSearchParams(resourceType),
    }));

    const operations: Array<{
      name: string;
      definition: string;
      documentation?: string;
    }> = [
      {
        name: "validate",
        definition: "http://hl7.org/fhir/OperationDefinition/Resource-validate",
        documentation: "Validate a resource",
      },
    ];

    if (this.config.enableBulkData) {
      operations.push(
        {
          name: "export",
          definition:
            "http://hl7.org/fhir/uv/bulkdata/OperationDefinition/export",
          documentation: "Bulk data export",
        },
        {
          name: "patient-export",
          definition:
            "http://hl7.org/fhir/uv/bulkdata/OperationDefinition/patient-export",
          documentation: "Patient-level bulk data export",
        },
        {
          name: "group-export",
          definition:
            "http://hl7.org/fhir/uv/bulkdata/OperationDefinition/group-export",
          documentation: "Group-level bulk data export",
        },
      );
    }

    const securityServices: CodeableConcept[] = [];
    if (this.config.enableSmartOnFHIR) {
      securityServices.push({
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/restful-security-service",
            code: "SMART-on-FHIR",
            display: "SMART on FHIR",
          },
        ],
        text: "OAuth2 using SMART-on-FHIR profile",
      });
    }

    return {
      resourceType: "CapabilityStatement",
      status: "active",
      date: new Date().toISOString(),
      publisher: this.config.publisher,
      kind: "instance",
      software: {
        name: "Lithic Healthcare Platform",
        version: this.config.version,
        releaseDate: new Date().toISOString().split("T")[0],
      },
      implementation: {
        description:
          "Lithic FHIR R4 Server - Enterprise Healthcare Interoperability Platform",
        url: this.config.baseUrl,
      },
      fhirVersion: "4.0.1",
      format: [
        "application/fhir+json",
        "application/fhir+xml",
        "application/json",
        "json",
        "xml",
      ],
      rest: [
        {
          mode: "server",
          documentation: "Main FHIR endpoint for Lithic Healthcare Platform",
          security: {
            cors: this.config.enableCORS,
            service: securityServices,
            description: this.config.enableSmartOnFHIR
              ? "Uses OAuth2 with SMART-on-FHIR scopes for authorization. Supports patient, user, and system scopes."
              : "Uses bearer token authentication",
          },
          resource: resources,
          interaction: [
            {
              code: "transaction",
              documentation:
                "Perform a set of operations as a single atomic transaction",
            },
            {
              code: "batch",
              documentation: "Perform a set of independent operations",
            },
            {
              code: "search-system",
              documentation: "Search across all resource types",
            },
            {
              code: "history-system",
              documentation: "Retrieve change history for all resources",
            },
          ],
          operation: operations,
        },
      ],
    };
  }

  /**
   * Get search parameters for a resource type
   */
  private getSearchParams(resourceType: string): Array<{
    name: string;
    definition?: string;
    type:
      | "number"
      | "date"
      | "string"
      | "token"
      | "reference"
      | "composite"
      | "quantity"
      | "uri"
      | "special";
    documentation?: string;
  }> {
    const commonParams = [
      {
        name: "_id",
        type: "token" as const,
        documentation: "Logical id of the resource",
      },
      {
        name: "_lastUpdated",
        type: "date" as const,
        documentation: "When the resource was last updated",
      },
    ];

    const resourceSpecificParams: Record<string, Array<any>> = {
      Patient: [
        {
          name: "identifier",
          type: "token" as const,
          documentation: "A patient identifier (e.g., MRN)",
        },
        {
          name: "family",
          type: "string" as const,
          documentation: "Family name",
        },
        { name: "given", type: "string" as const, documentation: "Given name" },
        {
          name: "name",
          type: "string" as const,
          documentation: "Any part of the name",
        },
        {
          name: "birthdate",
          type: "date" as const,
          documentation: "Date of birth",
        },
        { name: "gender", type: "token" as const, documentation: "Gender" },
        {
          name: "email",
          type: "token" as const,
          documentation: "Email address",
        },
        {
          name: "phone",
          type: "token" as const,
          documentation: "Phone number",
        },
        { name: "address", type: "string" as const, documentation: "Address" },
        {
          name: "address-city",
          type: "string" as const,
          documentation: "City",
        },
        {
          name: "address-state",
          type: "string" as const,
          documentation: "State",
        },
        {
          name: "address-postalcode",
          type: "string" as const,
          documentation: "Postal code",
        },
      ],
      Observation: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Subject of observation",
        },
        {
          name: "code",
          type: "token" as const,
          documentation: "Code of the observation",
        },
        {
          name: "category",
          type: "token" as const,
          documentation: "Category of observation",
        },
        {
          name: "date",
          type: "date" as const,
          documentation: "Date/time of observation",
        },
        {
          name: "status",
          type: "token" as const,
          documentation: "Status of observation",
        },
        {
          name: "value-quantity",
          type: "quantity" as const,
          documentation: "Numeric value",
        },
        {
          name: "performer",
          type: "reference" as const,
          documentation: "Who performed observation",
        },
        {
          name: "encounter",
          type: "reference" as const,
          documentation: "Related encounter",
        },
      ],
      Encounter: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Patient of encounter",
        },
        {
          name: "date",
          type: "date" as const,
          documentation: "Date of encounter",
        },
        {
          name: "status",
          type: "token" as const,
          documentation: "Status of encounter",
        },
        {
          name: "class",
          type: "token" as const,
          documentation: "Classification of encounter",
        },
        {
          name: "type",
          type: "token" as const,
          documentation: "Type of encounter",
        },
        {
          name: "practitioner",
          type: "reference" as const,
          documentation: "Practitioner in encounter",
        },
        {
          name: "location",
          type: "reference" as const,
          documentation: "Location of encounter",
        },
      ],
      MedicationRequest: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Patient of medication request",
        },
        {
          name: "medication",
          type: "token" as const,
          documentation: "Medication code",
        },
        {
          name: "status",
          type: "token" as const,
          documentation: "Status of medication request",
        },
        {
          name: "intent",
          type: "token" as const,
          documentation: "Intent of medication request",
        },
        {
          name: "authoredon",
          type: "date" as const,
          documentation: "When request was authored",
        },
        {
          name: "requester",
          type: "reference" as const,
          documentation: "Who requested medication",
        },
        {
          name: "encounter",
          type: "reference" as const,
          documentation: "Related encounter",
        },
      ],
      Condition: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Patient with condition",
        },
        {
          name: "code",
          type: "token" as const,
          documentation: "Condition code",
        },
        {
          name: "clinical-status",
          type: "token" as const,
          documentation: "Clinical status",
        },
        {
          name: "verification-status",
          type: "token" as const,
          documentation: "Verification status",
        },
        {
          name: "onset-date",
          type: "date" as const,
          documentation: "Onset date",
        },
        {
          name: "category",
          type: "token" as const,
          documentation: "Category of condition",
        },
        {
          name: "severity",
          type: "token" as const,
          documentation: "Severity of condition",
        },
      ],
      Procedure: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Patient of procedure",
        },
        {
          name: "code",
          type: "token" as const,
          documentation: "Procedure code",
        },
        {
          name: "date",
          type: "date" as const,
          documentation: "Date of procedure",
        },
        {
          name: "status",
          type: "token" as const,
          documentation: "Status of procedure",
        },
        {
          name: "performer",
          type: "reference" as const,
          documentation: "Who performed procedure",
        },
        {
          name: "encounter",
          type: "reference" as const,
          documentation: "Related encounter",
        },
      ],
      Appointment: [
        {
          name: "patient",
          type: "reference" as const,
          documentation: "Patient in appointment",
        },
        {
          name: "practitioner",
          type: "reference" as const,
          documentation: "Practitioner in appointment",
        },
        {
          name: "date",
          type: "date" as const,
          documentation: "Date of appointment",
        },
        {
          name: "status",
          type: "token" as const,
          documentation: "Status of appointment",
        },
        {
          name: "service-type",
          type: "token" as const,
          documentation: "Service type",
        },
        {
          name: "location",
          type: "reference" as const,
          documentation: "Location of appointment",
        },
      ],
    };

    return [...commonParams, ...(resourceSpecificParams[resourceType] || [])];
  }

  /**
   * Parse search parameters from query string
   */
  parseSearchParams(
    searchParams: Record<string, string | string[]>,
  ): SearchParameters {
    const parsed: SearchParameters = {};

    for (const [key, value] of Object.entries(searchParams)) {
      // Handle array values
      if (Array.isArray(value)) {
        parsed[key] = value;
      } else {
        // Handle special parameters
        if (key === "_count") {
          parsed._count = parseInt(value, 10);
        } else if (key === "_offset") {
          parsed._offset = parseInt(value, 10);
        } else if (key === "_include" || key === "_revinclude") {
          parsed[key] = value.split(",");
        } else {
          parsed[key] = value;
        }
      }
    }

    return parsed;
  }

  /**
   * Validate FHIR resource
   */
  validateResource(resource: any): {
    valid: boolean;
    issues: Array<{
      severity: "error" | "warning" | "information";
      code: string;
      diagnostics: string;
      expression?: string[];
    }>;
  } {
    const issues: any[] = [];

    // Check required fields
    if (!resource.resourceType) {
      issues.push({
        severity: "error",
        code: "required",
        diagnostics: "resourceType is required",
        expression: ["resourceType"],
      });
    }

    // Validate resource type
    if (
      resource.resourceType &&
      !this.config.supportedResources.includes(resource.resourceType)
    ) {
      issues.push({
        severity: "error",
        code: "not-supported",
        diagnostics: `Resource type ${resource.resourceType} is not supported`,
        expression: ["resourceType"],
      });
    }

    // Add resource-specific validation
    if (resource.resourceType === "Patient") {
      if (!resource.name || resource.name.length === 0) {
        issues.push({
          severity: "warning",
          code: "required",
          diagnostics: "Patient should have at least one name",
          expression: ["Patient.name"],
        });
      }
    }

    return {
      valid: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    };
  }

  /**
   * Create OperationOutcome resource
   */
  createOperationOutcome(
    severity: "fatal" | "error" | "warning" | "information",
    code: string,
    diagnostics: string,
  ): any {
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity,
          code,
          diagnostics,
        },
      ],
    };
  }

  /**
   * Get SMART-on-FHIR configuration
   */
  getSmartConfiguration(): any {
    if (!this.config.enableSmartOnFHIR) {
      return null;
    }

    return {
      authorization_endpoint: `${this.config.baseUrl}/oauth/authorize`,
      token_endpoint: `${this.config.baseUrl}/oauth/token`,
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "client_secret_post",
      ],
      grant_types_supported: ["authorization_code", "client_credentials"],
      registration_endpoint: `${this.config.baseUrl}/oauth/register`,
      scopes_supported: [
        "openid",
        "fhirUser",
        "launch",
        "launch/patient",
        "patient/*.read",
        "patient/*.write",
        "user/*.read",
        "user/*.write",
        "offline_access",
      ],
      response_types_supported: ["code"],
      capabilities: [
        "launch-ehr",
        "launch-standalone",
        "client-public",
        "client-confidential-symmetric",
        "context-ehr-patient",
        "context-ehr-encounter",
        "context-standalone-patient",
        "context-standalone-encounter",
        "permission-offline",
        "permission-patient",
        "permission-user",
      ],
      code_challenge_methods_supported: ["S256"],
    };
  }
}

/**
 * Default FHIR server instance
 */
export const fhirServer = new FHIRServer();

/**
 * Create a custom FHIR server instance
 */
export function createFHIRServer(
  config: Partial<FHIRServerConfig>,
): FHIRServer {
  return new FHIRServer(config);
}
