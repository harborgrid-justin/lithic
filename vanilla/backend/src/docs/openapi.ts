/**
 * OpenAPI Schema Generator
 *
 * Generate OpenAPI 3.0 schemas programmatically
 */

import { OpenAPIV3 } from "openapi-types";

/**
 * Complete OpenAPI Specification
 */
export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Lithic Healthcare Platform API",
    version: "1.0.0",
    description: `
# Lithic Healthcare Platform API

Enterprise-grade healthcare platform with comprehensive EHR, billing, and interoperability features.

## Features

- **Patient Management**: Complete patient lifecycle management
- **Clinical Documentation**: Encounters, notes, orders, results
- **E-Prescribing**: Surescripts integration for electronic prescribing
- **Billing & Claims**: EDI 837/835 claims processing
- **Laboratory**: Order management and result reporting
- **Imaging**: PACS integration and DICOM support
- **Analytics**: Real-time reporting and dashboards
- **Interoperability**: FHIR R4 and HL7v2 support
- **Webhooks**: Real-time event notifications
- **Real-time**: WebSocket support for live updates

## Authentication

This API uses JWT Bearer tokens for authentication. Include your token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

## Rate Limiting

API requests are rate limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination with the following query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)

## Error Handling

All errors follow this format:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
\`\`\`

## HIPAA Compliance

This API is HIPAA compliant. All PHI is encrypted at rest and in transit.
    `,
    contact: {
      name: "Lithic Health API Support",
      email: "api-support@lithichealth.com",
      url: "https://lithichealth.com/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://staging-api.lithichealth.com",
      description: "Staging server",
    },
    {
      url: "https://api.lithichealth.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User authentication and authorization",
    },
    { name: "Patients", description: "Patient management and demographics" },
    {
      name: "Appointments",
      description: "Appointment scheduling and management",
    },
    { name: "Prescriptions", description: "Electronic prescribing (e-Rx)" },
    { name: "Clinical", description: "Clinical documentation and encounters" },
    { name: "Laboratory", description: "Lab orders and results" },
    { name: "Imaging", description: "Imaging orders and PACS integration" },
    { name: "Billing", description: "Billing, claims, and payments" },
    { name: "Analytics", description: "Reporting and analytics" },
    { name: "FHIR", description: "FHIR R4 interoperability" },
    { name: "HL7", description: "HL7v2 integration" },
    { name: "Webhooks", description: "Webhook subscriptions and events" },
  ],
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health check",
        description: "Check API health and status",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "healthy" },
                        timestamp: { type: "string", format: "date-time" },
                        uptime: { type: "number" },
                        version: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Bearer token authentication",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key authentication for service accounts",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Error message",
          },
          details: {
            type: "object",
            description: "Additional error details",
          },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Validation failed",
          },
          errors: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: {
                type: "string",
              },
            },
            example: {
              email: ["Email is required", "Email must be valid"],
              phone: ["Phone number is invalid"],
            },
          },
        },
      },
      Patient: {
        type: "object",
        required: ["mrn", "firstName", "lastName", "dateOfBirth", "gender"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Patient unique identifier",
          },
          mrn: {
            type: "string",
            description: "Medical Record Number",
            example: "MRN123456",
          },
          firstName: {
            type: "string",
            example: "John",
          },
          middleName: {
            type: "string",
            example: "Michael",
          },
          lastName: {
            type: "string",
            example: "Doe",
          },
          dateOfBirth: {
            type: "string",
            format: "date",
            example: "1980-01-15",
          },
          gender: {
            type: "string",
            enum: ["male", "female", "other", "unknown"],
            example: "male",
          },
          ssn: {
            type: "string",
            description: "Social Security Number (encrypted)",
            example: "***-**-1234",
          },
          email: {
            type: "string",
            format: "email",
            example: "john.doe@example.com",
          },
          phone: {
            type: "string",
            example: "+1-555-123-4567",
          },
          address: {
            $ref: "#/components/schemas/Address",
          },
          emergencyContact: {
            $ref: "#/components/schemas/EmergencyContact",
          },
          insurance: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Insurance",
            },
          },
          active: {
            type: "boolean",
            default: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      Address: {
        type: "object",
        properties: {
          street: { type: "string", example: "123 Main St" },
          city: { type: "string", example: "Springfield" },
          state: { type: "string", example: "IL" },
          zipCode: { type: "string", example: "62701" },
          country: { type: "string", example: "US", default: "US" },
        },
      },
      EmergencyContact: {
        type: "object",
        properties: {
          name: { type: "string", example: "Jane Doe" },
          relationship: { type: "string", example: "Spouse" },
          phone: { type: "string", example: "+1-555-987-6543" },
        },
      },
      Insurance: {
        type: "object",
        properties: {
          payerId: { type: "string" },
          payerName: { type: "string", example: "Blue Cross Blue Shield" },
          memberId: { type: "string", example: "ABC123456789" },
          groupNumber: { type: "string" },
          planName: { type: "string" },
          effectiveDate: { type: "string", format: "date" },
          terminationDate: { type: "string", format: "date" },
          isPrimary: { type: "boolean" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            minimum: 1,
            example: 1,
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            example: 20,
          },
          total: {
            type: "integer",
            example: 150,
          },
          totalPages: {
            type: "integer",
            example: 8,
          },
        },
      },
      WebhookSubscription: {
        type: "object",
        required: ["url", "events", "secret"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          url: {
            type: "string",
            format: "uri",
            description: "Webhook endpoint URL",
            example: "https://example.com/webhooks",
          },
          events: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "patient.created",
                "patient.updated",
                "appointment.created",
                "result.available",
                "prescription.created",
              ],
            },
            description: "Events to subscribe to",
          },
          secret: {
            type: "string",
            description: "Secret for signature verification",
            minLength: 32,
          },
          active: {
            type: "boolean",
            default: true,
          },
          headers: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description: "Custom headers to include in webhook requests",
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

/**
 * Export OpenAPI spec as JSON
 */
export function getOpenAPISpec(): OpenAPIV3.Document {
  return openApiSpec;
}

/**
 * Validate OpenAPI spec
 */
export function validateOpenAPISpec(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!openApiSpec.openapi) {
    errors.push("Missing openapi version");
  }

  if (!openApiSpec.info) {
    errors.push("Missing info object");
  }

  if (!openApiSpec.paths) {
    errors.push("Missing paths object");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
