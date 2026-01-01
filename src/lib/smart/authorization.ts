/**
 * SMART on FHIR v2 Authorization Server
 * OAuth 2.0 authorization server with PKCE support and scope management
 */

import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * SMART Scopes v2
 */
export enum SMARTScope {
  // Patient-level scopes
  PATIENT_READ_ALL = "patient/*.read",
  PATIENT_WRITE_ALL = "patient/*.write",
  PATIENT_READ = "patient/{resource}.read",
  PATIENT_WRITE = "patient/{resource}.write",

  // User-level scopes
  USER_READ_ALL = "user/*.read",
  USER_WRITE_ALL = "user/*.write",
  USER_READ = "user/{resource}.read",
  USER_WRITE = "user/{resource}.write",

  // System-level scopes (for backend services)
  SYSTEM_READ_ALL = "system/*.read",
  SYSTEM_WRITE_ALL = "system/*.write",
  SYSTEM_READ = "system/{resource}.read",
  SYSTEM_WRITE = "system/{resource}.write",

  // Special scopes
  OPENID = "openid",
  FHIR_USER = "fhirUser",
  LAUNCH = "launch",
  LAUNCH_PATIENT = "launch/patient",
  LAUNCH_ENCOUNTER = "launch/encounter",
  OFFLINE_ACCESS = "offline_access",
  ONLINE_ACCESS = "online_access",
  PROFILE = "profile",
}

/**
 * Scope patterns for SMART v2
 */
export const SCOPE_PATTERNS = {
  PATIENT: /^patient\/([A-Za-z]+|\*)\.(read|write|\*)$/,
  USER: /^user\/([A-Za-z]+|\*)\.(read|write|\*)$/,
  SYSTEM: /^system\/([A-Za-z]+|\*)\.(read|write|\*)$/,
};

/**
 * Authorization Code
 */
export interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string[];
  userId: string;
  patientId?: string;
  encounterId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  expiresAt: Date;
  used: boolean;
  launchContext?: Record<string, string>;
}

/**
 * Access Token Payload
 */
export interface AccessTokenPayload {
  sub: string; // User ID
  aud: string; // FHIR base URL
  iss: string; // Token issuer
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  scope: string; // Space-separated scopes
  patient?: string; // Patient ID
  encounter?: string; // Encounter ID
  fhirUser?: string; // FHIR user reference
  client_id: string;
  jti: string; // JWT ID
}

/**
 * Refresh Token
 */
export interface RefreshToken {
  token: string;
  clientId: string;
  userId: string;
  scope: string[];
  patientId?: string;
  encounterId?: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * OAuth 2.0 Error Codes
 */
export enum OAuth2ErrorCode {
  INVALID_REQUEST = "invalid_request",
  INVALID_CLIENT = "invalid_client",
  INVALID_GRANT = "invalid_grant",
  UNAUTHORIZED_CLIENT = "unauthorized_client",
  UNSUPPORTED_GRANT_TYPE = "unsupported_grant_type",
  INVALID_SCOPE = "invalid_scope",
  ACCESS_DENIED = "access_denied",
  SERVER_ERROR = "server_error",
}

/**
 * OAuth 2.0 Error Response
 */
export interface OAuth2Error {
  error: OAuth2ErrorCode;
  error_description?: string;
  error_uri?: string;
}

/**
 * Generate authorization code
 */
export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate access token
 */
export function generateAccessToken(
  payload: Omit<AccessTokenPayload, "exp" | "iat" | "jti">,
  secret: string,
  expiresIn: number = 3600 // 1 hour default
): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: AccessTokenPayload = {
    ...payload,
    exp: now + expiresIn,
    iat: now,
    jti: crypto.randomBytes(16).toString("hex"),
  };

  return jwt.sign(tokenPayload, secret, { algorithm: "HS256" });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string, secret: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    return decoded as AccessTokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Verify PKCE code challenge
 */
export function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: "S256" | "plain"
): boolean {
  if (method === "plain") {
    return codeVerifier === codeChallenge;
  }

  if (method === "S256") {
    const computed = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return computed === codeChallenge;
  }

  return false;
}

/**
 * Parse scope string into array
 */
export function parseScopes(scopeString: string): string[] {
  return scopeString
    .split(/\s+/)
    .filter((s) => s.length > 0)
    .map((s) => s.trim());
}

/**
 * Validate scope format
 */
export function validateScope(scope: string): boolean {
  // Check special scopes
  if (
    [
      "openid",
      "fhirUser",
      "launch",
      "launch/patient",
      "launch/encounter",
      "offline_access",
      "online_access",
      "profile",
    ].includes(scope)
  ) {
    return true;
  }

  // Check pattern-based scopes
  return (
    SCOPE_PATTERNS.PATIENT.test(scope) ||
    SCOPE_PATTERNS.USER.test(scope) ||
    SCOPE_PATTERNS.SYSTEM.test(scope)
  );
}

/**
 * Validate all scopes
 */
export function validateScopes(scopes: string[]): boolean {
  return scopes.every((scope) => validateScope(scope));
}

/**
 * Check if scope grants access to resource
 */
export function scopeGrantsAccess(
  scopes: string[],
  resourceType: string,
  operation: "read" | "write",
  context: "patient" | "user" | "system"
): boolean {
  // Check for wildcard scopes
  if (scopes.includes(`${context}/*.${operation}`)) {
    return true;
  }
  if (scopes.includes(`${context}/*.*`)) {
    return true;
  }

  // Check for specific resource scope
  if (scopes.includes(`${context}/${resourceType}.${operation}`)) {
    return true;
  }
  if (scopes.includes(`${context}/${resourceType}.*`)) {
    return true;
  }

  return false;
}

/**
 * Extract patient context from scopes
 */
export function requiresPatientContext(scopes: string[]): boolean {
  return scopes.some((scope) => SCOPE_PATTERNS.PATIENT.test(scope));
}

/**
 * Extract user context from scopes
 */
export function requiresUserContext(scopes: string[]): boolean {
  return scopes.some((scope) => SCOPE_PATTERNS.USER.test(scope));
}

/**
 * Check if offline access is requested
 */
export function requestsOfflineAccess(scopes: string[]): boolean {
  return scopes.includes("offline_access");
}

/**
 * Filter scopes based on user permissions
 */
export function filterScopesByPermissions(
  requestedScopes: string[],
  allowedScopes: string[]
): string[] {
  return requestedScopes.filter((scope) => {
    // Special scopes are always allowed if in allowedScopes
    if (allowedScopes.includes(scope)) {
      return true;
    }

    // Check for wildcard matches
    for (const allowed of allowedScopes) {
      if (allowed.endsWith("/*.*") && scope.startsWith(allowed.replace("/*.*", "/"))) {
        return true;
      }
      if (allowed.endsWith("/*.read") && scope.endsWith(".read")) {
        const prefix = allowed.replace("/*.read", "/");
        if (scope.startsWith(prefix)) {
          return true;
        }
      }
      if (allowed.endsWith("/*.write") && scope.endsWith(".write")) {
        const prefix = allowed.replace("/*.write", "/");
        if (scope.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Generate OAuth 2.0 error response
 */
export function createOAuthError(
  error: OAuth2ErrorCode,
  description?: string
): OAuth2Error {
  return {
    error,
    error_description: description,
  };
}

/**
 * Scope validation schema
 */
export const ScopeSchema = z
  .string()
  .refine((scope) => validateScope(scope), {
    message: "Invalid SMART scope format",
  });

export const ScopeArraySchema = z.array(ScopeSchema);

/**
 * Authorization request validation schema
 */
export const AuthorizationRequestSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string(),
  redirect_uri: z.string().url(),
  scope: z.string(),
  state: z.string(),
  aud: z.string(),
  launch: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(["S256", "plain"]).optional(),
});

/**
 * Token request validation schema
 */
export const TokenRequestSchema = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().optional(),
  refresh_token: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  client_id: z.string(),
  code_verifier: z.string().optional(),
  client_secret: z.string().optional(),
});

/**
 * Helper to validate authorization request
 */
export function validateAuthorizationRequest(request: unknown): boolean {
  try {
    AuthorizationRequestSchema.parse(request);
    return true;
  } catch (error) {
    console.error("Authorization request validation error:", error);
    return false;
  }
}

/**
 * Helper to validate token request
 */
export function validateTokenRequest(request: unknown): boolean {
  try {
    TokenRequestSchema.parse(request);
    return true;
  } catch (error) {
    console.error("Token request validation error:", error);
    return false;
  }
}

/**
 * Create authorization response URL
 */
export function createAuthorizationResponseURL(
  redirectUri: string,
  code: string,
  state?: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}

/**
 * Create error response URL
 */
export function createErrorResponseURL(
  redirectUri: string,
  error: OAuth2ErrorCode,
  description?: string,
  state?: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  if (description) {
    url.searchParams.set("error_description", description);
  }
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}

/**
 * Extract resource type from scope
 */
export function extractResourceTypeFromScope(scope: string): string | null {
  const match =
    scope.match(SCOPE_PATTERNS.PATIENT) ||
    scope.match(SCOPE_PATTERNS.USER) ||
    scope.match(SCOPE_PATTERNS.SYSTEM);

  if (match && match[1] !== "*") {
    return match[1];
  }

  return null;
}

/**
 * Get scope context (patient, user, or system)
 */
export function getScopeContext(scope: string): "patient" | "user" | "system" | null {
  if (SCOPE_PATTERNS.PATIENT.test(scope)) return "patient";
  if (SCOPE_PATTERNS.USER.test(scope)) return "user";
  if (SCOPE_PATTERNS.SYSTEM.test(scope)) return "system";
  return null;
}
