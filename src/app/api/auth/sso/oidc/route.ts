import { NextRequest, NextResponse } from "next/server";
import {
  getOIDCConfig,
  createAuthorizationUrl,
  exchangeCodeForTokens,
  validateIdToken,
  fetchUserInfo,
  authenticateWithOIDC,
} from "@/lib/auth/sso/oidc";
import { createManagedSession } from "@/lib/auth/session-manager";
import { cookies } from "next/headers";

/**
 * OIDC/OAuth 2.0 SSO Endpoints
 * POST /api/auth/sso/oidc - Initiate OIDC login or handle callback
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, code, state, action } = body;

    // Handle OIDC initiation
    if (action === "initiate") {
      return handleOIDCInitiation(provider, req);
    }

    // Handle OIDC callback
    if (code && state) {
      return handleOIDCCallback(provider, code, state, req);
    }

    return NextResponse.json(
      { error: "Invalid request", message: "Missing required parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("OIDC SSO error:", error);
    return NextResponse.json(
      {
        error: "SSO failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Initiate OIDC authentication
 */
async function handleOIDCInitiation(
  providerId: string,
  req: NextRequest,
): Promise<NextResponse> {
  const organizationId = req.headers.get("x-organization-id") || "default";

  const config = await getOIDCConfig(organizationId, providerId);

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
  const redirectUri = `${origin}/sso/${providerId}`;

  const { url, state, nonce, codeVerifier } = await createAuthorizationUrl(
    config,
    redirectUri,
  );

  // Store state, nonce, and code verifier in cookies
  const cookieStore = cookies();

  cookieStore.set("oidc_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  cookieStore.set("oidc_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  if (codeVerifier) {
    cookieStore.set("oidc_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });
  }

  return NextResponse.json({ redirectUrl: url });
}

/**
 * Handle OIDC callback
 */
async function handleOIDCCallback(
  providerId: string,
  code: string,
  state: string,
  req: NextRequest,
): Promise<NextResponse> {
  const organizationId = req.headers.get("x-organization-id") || "default";
  const cookieStore = cookies();

  // Validate state
  const storedState = cookieStore.get("oidc_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 400 },
    );
  }

  const config = await getOIDCConfig(organizationId, providerId);

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
  const redirectUri = `${origin}/sso/${providerId}`;

  // Get code verifier if PKCE is enabled
  const codeVerifier = config.pkceEnabled
    ? cookieStore.get("oidc_code_verifier")?.value
    : undefined;

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(
    config,
    code,
    redirectUri,
    codeVerifier,
  );

  // Validate ID token if present
  const nonce = cookieStore.get("oidc_nonce")?.value;
  if (tokens.idToken) {
    await validateIdToken(config, tokens.idToken, nonce);
  }

  // Fetch user info if needed
  let userInfo;
  if (!tokens.idToken && tokens.accessToken) {
    userInfo = await fetchUserInfo(config, tokens.accessToken);
  }

  // Authenticate user
  const { userId, email, isNewUser } = await authenticateWithOIDC(
    organizationId,
    providerId,
    tokens,
    userInfo,
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

  // Clear OIDC session data
  cookieStore.delete("oidc_state");
  cookieStore.delete("oidc_nonce");
  cookieStore.delete("oidc_code_verifier");

  return NextResponse.json({
    success: true,
    userId,
    email,
    isNewUser,
    redirectUrl: "/dashboard",
  });
}
