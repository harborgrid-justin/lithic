/**
 * Patient Access API Endpoint
 * Provides patient-scoped access to FHIR resources with consent-based filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  extractBearerToken,
  introspectToken,
  getTokenMetadata,
} from "@/lib/patient-access/token-introspection";
import {
  checkConsentAccess,
  filterResourcesByConsent,
  ConsentAction,
  type PatientConsent,
} from "@/lib/patient-access/consent-manager";

/**
 * Patient Access Request Parameters
 */
const PatientAccessRequestSchema = z.object({
  resourceType: z.string(),
  patientId: z.string().optional(),
  _count: z.string().optional(),
  _since: z.string().datetime().optional(),
  _include: z.string().optional(),
  _revinclude: z.string().optional(),
});

/**
 * GET /api/patient-access - Patient access to FHIR resources
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract and validate access token
    const authHeader = request.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "security",
              diagnostics: "Missing or invalid authorization token",
            },
          ],
        },
        { status: 401 }
      );
    }

    // Introspect token
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const tokenInfo = introspectToken(token, secret);

    if (!tokenInfo.active) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "security",
              diagnostics: "Invalid or expired access token",
            },
          ],
        },
        { status: 401 }
      );
    }

    // Verify patient scope
    if (!tokenInfo.patient) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "security",
              diagnostics: "Token does not have patient context",
            },
          ],
        },
        { status: 403 }
      );
    }

    // Parse request parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const validatedParams = PatientAccessRequestSchema.parse(params);

    // Verify patient access
    if (
      validatedParams.patientId &&
      validatedParams.patientId !== tokenInfo.patient
    ) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "security",
              diagnostics: "Access denied to requested patient resources",
            },
          ],
        },
        { status: 403 }
      );
    }

    const patientId = validatedParams.patientId || tokenInfo.patient;

    // Check scope for resource type
    const hasReadScope = hasResourceReadScope(
      tokenInfo.scope || "",
      validatedParams.resourceType
    );

    if (!hasReadScope) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "security",
              diagnostics: `Insufficient scope to read ${validatedParams.resourceType} resources`,
            },
          ],
        },
        { status: 403 }
      );
    }

    // Fetch patient consent (mock implementation)
    const consent = await fetchPatientConsent(patientId);

    // Check consent for resource access
    if (consent) {
      const consentDecision = checkConsentAccess(consent, {
        resourceType: validatedParams.resourceType,
        action: ConsentAction.ACCESS,
      });

      if (!consentDecision.allowed) {
        return NextResponse.json(
          {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "security",
                diagnostics: `Patient consent does not allow access to ${validatedParams.resourceType} resources`,
              },
            ],
          },
          { status: 403 }
        );
      }
    }

    // Fetch resources (mock implementation)
    const resources = await fetchPatientResources(
      patientId,
      validatedParams.resourceType,
      {
        count: validatedParams._count ? parseInt(validatedParams._count) : 100,
        since: validatedParams._since
          ? new Date(validatedParams._since)
          : undefined,
      }
    );

    // Filter resources by consent
    const filteredResources = consent
      ? filterResourcesByConsent(resources, consent, {
          action: ConsentAction.ACCESS,
        })
      : resources;

    // Return bundle
    return NextResponse.json(
      {
        resourceType: "Bundle",
        type: "searchset",
        total: filteredResources.length,
        entry: filteredResources.map((resource) => ({
          fullUrl: `${url.origin}/api/fhir/${resource.resourceType}/${(resource as { id?: string }).id}`,
          resource,
        })),
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/fhir+json",
        },
      }
    );
  } catch (error) {
    console.error("Patient access error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Check if scope grants read access to resource type
 */
function hasResourceReadScope(scopeString: string, resourceType: string): boolean {
  const scopes = scopeString.split(/\s+/);

  // Check for specific resource scope
  if (scopes.includes(`patient/${resourceType}.read`)) {
    return true;
  }

  // Check for wildcard scope
  if (scopes.includes("patient/*.read") || scopes.includes("patient/*.*")) {
    return true;
  }

  return false;
}

/**
 * Fetch patient consent (mock implementation)
 */
async function fetchPatientConsent(
  patientId: string
): Promise<PatientConsent | null> {
  // In production, fetch from database
  // For now, return null (no consent restrictions)
  return null;
}

/**
 * Fetch patient resources (mock implementation)
 */
async function fetchPatientResources(
  patientId: string,
  resourceType: string,
  options: {
    count?: number;
    since?: Date;
  }
): Promise<Array<{ resourceType: string; id?: string }>> {
  // In production, fetch from database
  // For now, return empty array
  console.log(`Fetching ${resourceType} resources for patient ${patientId}`, options);
  return [];
}

/**
 * POST /api/patient-access/introspect - Token introspection endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.formData();
    const token = body.get("token") as string;

    if (!token) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing token parameter",
        },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const introspection = introspectToken(token, secret);

    return NextResponse.json(introspection, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Introspection error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/patient-access - CORS preflight
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
