/**
 * OpenAPI 3.0 Specification
 * Complete API documentation for Lithic Healthcare Platform
 */

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Lithic Healthcare API",
    version: "1.0.0",
    description:
      "Enterprise Healthcare SaaS Platform - Complete API Documentation",
    contact: {
      name: "Lithic Support",
      email: "support@lithic.health",
      url: "https://lithic.health",
    },
    license: {
      name: "Proprietary",
    },
  },
  servers: [
    {
      url: "https://api.lithic.health",
      description: "Production server",
    },
    {
      url: "https://api-staging.lithic.health",
      description: "Staging server",
    },
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Patients", description: "Patient management endpoints" },
    {
      name: "Appointments",
      description: "Scheduling and appointment management",
    },
    { name: "Clinical", description: "Clinical data and encounters" },
    { name: "Laboratory", description: "Lab orders and results" },
    { name: "Imaging", description: "Radiology and imaging services" },
    { name: "Pharmacy", description: "Prescription management" },
    { name: "Billing", description: "Claims and billing" },
    { name: "FHIR", description: "FHIR R4 API" },
    { name: "HL7", description: "HL7 v2 message handling" },
    { name: "Webhooks", description: "Webhook management" },
    { name: "Integrations", description: "External integrations" },
  ],
  paths: {
    "/api/fhir/{resourceType}": {
      get: {
        tags: ["FHIR"],
        summary: "Search FHIR resources",
        parameters: [
          {
            name: "resourceType",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "FHIR resource type (Patient, Observation, etc.)",
          },
          {
            name: "_count",
            in: "query",
            schema: { type: "integer", default: 50 },
            description: "Number of results per page",
          },
          {
            name: "_offset",
            in: "query",
            schema: { type: "integer", default: 0 },
            description: "Pagination offset",
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/fhir+json": {
                schema: { $ref: "#/components/schemas/Bundle" },
              },
            },
          },
        },
      },
      post: {
        tags: ["FHIR"],
        summary: "Create FHIR resource",
        parameters: [
          {
            name: "resourceType",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/fhir+json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "201": {
            description: "Resource created",
          },
        },
      },
    },
    "/api/fhir/{resourceType}/{id}": {
      get: {
        tags: ["FHIR"],
        summary: "Read FHIR resource by ID",
        parameters: [
          {
            name: "resourceType",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Resource found",
          },
          "404": {
            description: "Resource not found",
          },
        },
      },
      put: {
        tags: ["FHIR"],
        summary: "Update FHIR resource",
        parameters: [
          {
            name: "resourceType",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/fhir+json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": {
            description: "Resource updated",
          },
        },
      },
      delete: {
        tags: ["FHIR"],
        summary: "Delete FHIR resource",
        parameters: [
          {
            name: "resourceType",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "Resource deleted",
          },
        },
      },
    },
    "/api/hl7": {
      post: {
        tags: ["HL7"],
        summary: "Send HL7 v2 message",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  encoding: {
                    type: "string",
                    enum: ["plain", "base64"],
                    default: "plain",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Message processed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    acknowledgment: { type: "string" },
                    success: { type: "boolean" },
                    messageControlId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/webhooks": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhooks",
        responses: {
          "200": {
            description: "List of webhooks",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    webhooks: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Webhook" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Register webhook",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WebhookRegistration" },
            },
          },
        },
        responses: {
          "201": {
            description: "Webhook created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Webhook" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Bundle: {
        type: "object",
        properties: {
          resourceType: { type: "string", enum: ["Bundle"] },
          type: { type: "string" },
          total: { type: "integer" },
          entry: {
            type: "array",
            items: {
              type: "object",
              properties: {
                resource: { type: "object" },
                fullUrl: { type: "string" },
              },
            },
          },
        },
      },
      Webhook: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          secret: { type: "string" },
          active: { type: "boolean" },
        },
      },
      WebhookRegistration: {
        type: "object",
        required: ["url", "events"],
        properties: {
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          secret: { type: "string" },
          headers: { type: "object" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
  },
  security: [{ bearerAuth: [] }, { apiKey: [] }],
};
