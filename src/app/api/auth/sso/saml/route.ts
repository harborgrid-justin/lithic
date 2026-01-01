import { NextRequest, NextResponse } from "next/server";
import {
  getSAMLConfig,
  parseResponse,
  authenticateWithSAML,
  createAuthRequest,
} from "@/lib/auth/sso/saml";
import { createManagedSession } from "@/lib/auth/session-manager";
import { cookies } from "next/headers";

/**
 * SAML SSO Endpoints
 * POST /api/auth/sso/saml - Initiate SAML login or handle callback
 * GET /api/auth/sso/saml/metadata - Get SP metadata
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, SAMLResponse, RelayState, action } = body;

    // Handle SAML initiation
    if (action === "initiate") {
      return handleSAMLInitiation(provider, req);
    }

    // Handle SAML callback
    if (SAMLResponse) {
      return handleSAMLCallback(provider, SAMLResponse, RelayState, req);
    }

    return NextResponse.json(
      { error: "Invalid request", message: "Missing required parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("SAML SSO error:", error);
    return NextResponse.json(
      {
        error: "SSO failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const organizationId = searchParams.get("organizationId");

    if (action === "metadata" && organizationId) {
      return handleMetadataRequest(organizationId);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("SAML metadata error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate metadata",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Initiate SAML authentication
 */
async function handleSAMLInitiation(
  providerId: string,
  req: NextRequest,
): Promise<NextResponse> {
  // Get organization from request (could be from subdomain, header, etc.)
  const organizationId = req.headers.get("x-organization-id") || "default";

  const config = await getSAMLConfig(organizationId, providerId);

  if (!config) {
    return NextResponse.json(
      { error: "SSO provider not found or not enabled" },
      { status: 404 },
    );
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const acsUrl = `${origin}/sso/${providerId}`;

  const { url, requestId } = await createAuthRequest(config, acsUrl);

  // Store request ID in session for validation
  const cookieStore = cookies();
  cookieStore.set("saml_request_id", requestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  return NextResponse.json({ redirectUrl: url });
}

/**
 * Handle SAML callback
 */
async function handleSAMLCallback(
  providerId: string,
  samlResponse: string,
  relayState: string | null,
  req: NextRequest,
): Promise<NextResponse> {
  const organizationId = req.headers.get("x-organization-id") || "default";

  const config = await getSAMLConfig(organizationId, providerId);

  if (!config) {
    return NextResponse.json(
      { error: "SSO provider not found or not enabled" },
      { status: 404 },
    );
  }

  // Get stored request ID
  const cookieStore = cookies();
  const requestId = cookieStore.get("saml_request_id")?.value;

  // Parse and validate SAML response
  const response = await parseResponse(config, samlResponse, requestId);

  // Authenticate user
  const { userId, email, isNewUser } = await authenticateWithSAML(
    organizationId,
    providerId,
    response,
  );

  // Create session
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const { sessionId, accessToken, refreshToken } = await createManagedSession({
    userId,
    ipAddress,
    userAgent,
    loginMethod: "sso",
    ssoProvider: providerId,
  });

  // Set session cookies
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  // Clear SAML request ID
  cookieStore.delete("saml_request_id");

  return NextResponse.json({
    success: true,
    userId,
    email,
    isNewUser,
    redirectUrl: relayState || "/dashboard",
  });
}

/**
 * Handle metadata request
 */
async function handleMetadataRequest(
  organizationId: string,
): Promise<NextResponse> {
  const { generateSPMetadata } = await import("@/lib/auth/sso/saml");

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acsUrl = `${origin}/api/auth/sso/saml/acs`;
  const entityId = `${origin}/saml/metadata`;

  const metadata = await generateSPMetadata(organizationId, acsUrl, entityId);

  return new NextResponse(metadata, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": 'inline; filename="sp-metadata.xml"',
    },
  });
}
