/**
 * SMART on FHIR Authorization
 * Implementation of SMART App Launch Framework
 * Supports both EHR Launch and Standalone Launch
 */

import type { SMARTAuthContext, SMARTToken } from "@/types/integrations";
import { db } from "@/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 86400 * 30; // 30 days

/**
 * SMART Configuration Endpoint
 * Returns OAuth 2.0 and SMART capabilities
 */
export function getSmartConfiguration(baseUrl: string) {
  return {
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ["client_secret_basic", "private_key_jwt"],
    registration_endpoint: `${baseUrl}/oauth/register`,
    scopes_supported: [
      "openid",
      "fhirUser",
      "launch",
      "launch/patient",
      "launch/encounter",
      "patient/*.read",
      "patient/*.write",
      "patient/*.*",
      "user/*.read",
      "user/*.write",
      "user/*.*",
      "offline_access",
    ],
    response_types_supported: ["code", "token"],
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
    capabilities: [
      "launch-ehr",
      "launch-standalone",
      "client-public",
      "client-confidential-symmetric",
      "context-ehr-patient",
      "context-ehr-encounter",
      "context-standalone-patient",
      "context-standalone-encounter",
      "sso-openid-connect",
      "permission-offline",
      "permission-patient",
      "permission-user",
    ],
    code_challenge_methods_supported: ["S256"],
    introspection_endpoint: `${baseUrl}/oauth/introspect`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
  };
}

/**
 * Initiate SMART Launch (EHR Launch)
 * Called when app is launched from within an EHR
 */
export async function initiateSMARTLaunch(params: {
  iss: string; // FHIR server base URL
  launch: string; // Launch context token
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  aud: string; // FHIR server URL
}): Promise<string> {
  // Validate client
  const client = await validateClient(params.clientId, params.redirectUri);

  if (!client) {
    throw new Error("Invalid client or redirect URI");
  }

  // Validate launch context
  const launchContext = await validateLaunchContext(params.launch);

  if (!launchContext) {
    throw new Error("Invalid launch context");
  }

  // Build authorization URL
  const authUrl = new URL(`${params.iss}/oauth/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", params.clientId);
  authUrl.searchParams.set("redirect_uri", params.redirectUri);
  authUrl.searchParams.set("scope", params.scope);
  authUrl.searchParams.set("state", params.state || generateState());
  authUrl.searchParams.set("aud", params.aud);
  authUrl.searchParams.set("launch", params.launch);

  return authUrl.toString();
}

/**
 * Initiate Standalone Launch
 * Called when app is launched outside an EHR
 */
export async function initiateStandaloneLaunch(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  aud: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}): Promise<string> {
  // Validate client
  const client = await validateClient(params.clientId, params.redirectUri);

  if (!client) {
    throw new Error("Invalid client or redirect URI");
  }

  // Build authorization URL
  const authUrl = new URL("/oauth/authorize", params.aud);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", params.clientId);
  authUrl.searchParams.set("redirect_uri", params.redirectUri);
  authUrl.searchParams.set("scope", params.scope);
  authUrl.searchParams.set("state", params.state || generateState());
  authUrl.searchParams.set("aud", params.aud);

  // PKCE support
  if (params.codeChallenge) {
    authUrl.searchParams.set("code_challenge", params.codeChallenge);
    authUrl.searchParams.set("code_challenge_method", params.codeChallengeMethod || "S256");
  }

  return authUrl.toString();
}

/**
 * Handle authorization callback
 * Generates authorization code
 */
export async function handleAuthorizationCallback(params: {
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  launchContext?: any;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): Promise<string> {
  // Generate authorization code
  const code = generateAuthorizationCode();

  // Store authorization code with context
  await storeAuthorizationCode({
    code,
    clientId: params.clientId,
    userId: params.userId,
    redirectUri: params.redirectUri,
    scope: params.scope,
    expiresAt: new Date(Date.now() + 600000), // 10 minutes
    launchContext: params.launchContext,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
  });

  // Build redirect URL
  const redirectUrl = new URL(params.redirectUri);
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", params.state);

  return redirectUrl.toString();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(params: {
  code: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<SMARTToken> {
  // Retrieve and validate authorization code
  const authCode = await getAuthorizationCode(params.code);

  if (!authCode) {
    throw new Error("Invalid authorization code");
  }

  if (authCode.expiresAt < new Date()) {
    throw new Error("Authorization code expired");
  }

  if (authCode.clientId !== params.clientId) {
    throw new Error("Client ID mismatch");
  }

  if (authCode.redirectUri !== params.redirectUri) {
    throw new Error("Redirect URI mismatch");
  }

  // Validate client secret for confidential clients
  if (authCode.requiresSecret) {
    const valid = await validateClientSecret(params.clientId, params.clientSecret);
    if (!valid) {
      throw new Error("Invalid client secret");
    }
  }

  // Validate PKCE code verifier
  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      throw new Error("Code verifier required");
    }

    const valid = validateCodeVerifier(
      params.codeVerifier,
      authCode.codeChallenge,
      authCode.codeChallengeMethod || "S256"
    );

    if (!valid) {
      throw new Error("Invalid code verifier");
    }
  }

  // Generate access token
  const accessToken = generateAccessToken({
    userId: authCode.userId,
    clientId: authCode.clientId,
    scope: authCode.scope,
    launchContext: authCode.launchContext,
  });

  // Generate refresh token if offline_access scope
  let refreshToken: string | undefined;
  if (authCode.scope.includes("offline_access")) {
    refreshToken = generateRefreshToken({
      userId: authCode.userId,
      clientId: authCode.clientId,
      scope: authCode.scope,
    });

    // Store refresh token
    await storeRefreshToken({
      token: refreshToken,
      userId: authCode.userId,
      clientId: authCode.clientId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
    });
  }

  // Generate ID token if openid scope
  let idToken: string | undefined;
  if (authCode.scope.includes("openid")) {
    idToken = await generateIdToken(authCode.userId, authCode.clientId);
  }

  // Delete authorization code (one-time use)
  await deleteAuthorizationCode(params.code);

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: TOKEN_EXPIRY,
    scope: authCode.scope,
    refreshToken,
    patient: authCode.launchContext?.patientId,
    encounter: authCode.launchContext?.encounterId,
    practitioner: authCode.launchContext?.practitionerId,
    idToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
}): Promise<SMARTToken> {
  // Validate refresh token
  const storedToken = await getRefreshToken(params.refreshToken);

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token expired");
  }

  if (storedToken.clientId !== params.clientId) {
    throw new Error("Client ID mismatch");
  }

  // Validate client secret for confidential clients
  if (storedToken.requiresSecret) {
    const valid = await validateClientSecret(params.clientId, params.clientSecret);
    if (!valid) {
      throw new Error("Invalid client secret");
    }
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: storedToken.userId,
    clientId: storedToken.clientId,
    scope: params.scope || storedToken.scope,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: TOKEN_EXPIRY,
    scope: params.scope || storedToken.scope,
  };
}

/**
 * Validate access token
 */
export async function validateAccessToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  clientId?: string;
  scope?: string;
  launchContext?: any;
}> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return {
      valid: true,
      userId: decoded.sub,
      clientId: decoded.client_id,
      scope: decoded.scope,
      launchContext: decoded.launch_context,
    };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Introspect token (OAuth 2.0 Token Introspection)
 */
export async function introspectToken(token: string): Promise<any> {
  const validation = await validateAccessToken(token);

  if (!validation.valid) {
    return { active: false };
  }

  return {
    active: true,
    scope: validation.scope,
    client_id: validation.clientId,
    username: validation.userId,
    token_type: "Bearer",
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
    iat: Math.floor(Date.now() / 1000),
    patient: validation.launchContext?.patientId,
    encounter: validation.launchContext?.encounterId,
  };
}

/**
 * Revoke token
 */
export async function revokeToken(token: string, tokenTypeHint?: "access_token" | "refresh_token"): Promise<void> {
  if (tokenTypeHint === "refresh_token") {
    await deleteRefreshToken(token);
  } else {
    // Access tokens are JWT-based and can't be revoked directly
    // Would need to implement token blacklist
    console.log("Access token revocation requested");
  }
}

// Helper Functions

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAccessToken(payload: {
  userId: string;
  clientId: string;
  scope: string;
  launchContext?: any;
}): string {
  return jwt.sign(
    {
      sub: payload.userId,
      client_id: payload.clientId,
      scope: payload.scope,
      launch_context: payload.launchContext,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
    },
    JWT_SECRET
  );
}

function generateRefreshToken(payload: { userId: string; clientId: string; scope: string }): string {
  return jwt.sign(
    {
      sub: payload.userId,
      client_id: payload.clientId,
      scope: payload.scope,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
    },
    JWT_SECRET
  );
}

async function generateIdToken(userId: string, clientId: string): Promise<string> {
  // Fetch user profile
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return jwt.sign(
    {
      sub: userId,
      aud: clientId,
      iss: process.env.FHIR_BASE_URL || "http://localhost:3000/fhir",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      fhirUser: `Practitioner/${userId}`,
    },
    JWT_SECRET
  );
}

function validateCodeVerifier(
  verifier: string,
  challenge: string,
  method: "S256" | "plain"
): boolean {
  if (method === "plain") {
    return verifier === challenge;
  }

  // S256
  const hash = crypto.createHash("sha256").update(verifier).digest();
  const computed = base64UrlEncode(hash);

  return computed === challenge;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Database operations (simplified - would use actual DB)

const authCodes = new Map<string, any>();
const refreshTokens = new Map<string, any>();
const launchContexts = new Map<string, any>();

async function validateClient(clientId: string, redirectUri: string): Promise<boolean> {
  // Would validate against registered clients in database
  return true;
}

async function validateClientSecret(clientId: string, clientSecret?: string): Promise<boolean> {
  // Would validate against stored client secret
  return true;
}

async function validateLaunchContext(launch: string): Promise<any> {
  return launchContexts.get(launch);
}

async function storeAuthorizationCode(data: any): Promise<void> {
  authCodes.set(data.code, data);
}

async function getAuthorizationCode(code: string): Promise<any> {
  return authCodes.get(code);
}

async function deleteAuthorizationCode(code: string): Promise<void> {
  authCodes.delete(code);
}

async function storeRefreshToken(data: any): Promise<void> {
  refreshTokens.set(data.token, data);
}

async function getRefreshToken(token: string): Promise<any> {
  return refreshTokens.get(token);
}

async function deleteRefreshToken(token: string): Promise<void> {
  refreshTokens.delete(token);
}

/**
 * Create launch context (EHR Launch)
 */
export async function createLaunchContext(context: {
  patientId?: string;
  encounterId?: string;
  practitionerId?: string;
}): Promise<string> {
  const launch = crypto.randomBytes(32).toString("hex");
  launchContexts.set(launch, {
    ...context,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 600000), // 10 minutes
  });

  return launch;
}

/**
 * Scope utilities
 */
export function parseScope(scope: string): {
  resourceScopes: Array<{ resourceType: string; permission: string }>;
  contextScopes: string[];
  specialScopes: string[];
} {
  const scopes = scope.split(" ");
  const resourceScopes: Array<{ resourceType: string; permission: string }> = [];
  const contextScopes: string[] = [];
  const specialScopes: string[] = [];

  for (const s of scopes) {
    if (s.startsWith("patient/") || s.startsWith("user/")) {
      const [context, rest] = s.split("/");
      const [resourceType, permission] = rest.split(".");
      resourceScopes.push({ resourceType, permission });
    } else if (s.startsWith("launch")) {
      contextScopes.push(s);
    } else {
      specialScopes.push(s);
    }
  }

  return { resourceScopes, contextScopes, specialScopes };
}

export function canAccessResource(
  scope: string,
  resourceType: string,
  permission: "read" | "write"
): boolean {
  const { resourceScopes } = parseScope(scope);

  return resourceScopes.some(
    (s) =>
      (s.resourceType === resourceType || s.resourceType === "*") &&
      (s.permission === permission || s.permission === "*")
  );
}
