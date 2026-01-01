/**
 * SMART on FHIR v2 App Launcher
 * Handles EHR launch and standalone launch scenarios
 */

import { z } from "zod";
import crypto from "crypto";

/**
 * SMART Launch Types
 */
export enum LaunchType {
  EHR_LAUNCH = "ehr-launch",
  STANDALONE_LAUNCH = "standalone-launch",
  BACKEND_SERVICE = "backend-service",
}

/**
 * SMART Launch Parameters
 */
export interface LaunchParameters {
  iss: string; // FHIR server URL
  launch: string; // Launch context token
  aud?: string; // FHIR server URL (alternate)
  state?: string; // Client state
}

/**
 * Launch Context
 */
export interface LaunchContext {
  patient?: string; // Patient ID
  encounter?: string; // Encounter ID
  user?: string; // Practitioner/user ID
  need_patient_banner?: boolean;
  intent?: string;
  smart_style_url?: string;
  resource?: string; // Resource being viewed/edited
  location?: string; // Location ID
  organization?: string; // Organization ID
}

/**
 * SMART App Configuration
 */
export interface SMARTAppConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  launchType: LaunchType;
  state?: string;
  aud?: string;
  pkce?: {
    codeChallenge: string;
    codeChallengeMethod: "S256" | "plain";
    codeVerifier: string;
  };
}

/**
 * Authorization Request Parameters
 */
export interface AuthorizationRequest {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  aud: string;
  launch?: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
}

/**
 * Token Request Parameters
 */
export interface TokenRequest {
  grant_type: "authorization_code" | "refresh_token";
  code?: string;
  refresh_token?: string;
  redirect_uri?: string;
  client_id: string;
  code_verifier?: string;
}

/**
 * Token Response
 */
export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
  refresh_token?: string;
  patient?: string;
  encounter?: string;
  user?: string;
  id_token?: string;
  need_patient_banner?: boolean;
  smart_style_url?: string;
}

/**
 * SMART Capability Statement
 */
export interface SMARTCapabilities {
  authorize_endpoint: string;
  token_endpoint: string;
  token_endpoint_auth_methods_supported?: string[];
  registration_endpoint?: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported?: string[];
  code_challenge_methods_supported?: string[];
  capabilities: string[];
}

/**
 * Standard SMART Capabilities
 */
export const SMART_CAPABILITIES = {
  // Launch Modes
  LAUNCH_EHR: "launch-ehr",
  LAUNCH_STANDALONE: "launch-standalone",

  // Authorization
  AUTHORIZE_POST: "authorize-post",

  // Client Types
  CLIENT_PUBLIC: "client-public",
  CLIENT_CONFIDENTIAL_SYMMETRIC: "client-confidential-symmetric",
  CLIENT_CONFIDENTIAL_ASYMMETRIC: "client-confidential-asymmetric",

  // Single Sign-on
  SSO_OPENID_CONNECT: "sso-openid-connect",

  // Launch Context
  CONTEXT_BANNER: "context-banner",
  CONTEXT_STYLE: "context-style",
  CONTEXT_EHR_PATIENT: "context-ehr-patient",
  CONTEXT_EHR_ENCOUNTER: "context-ehr-encounter",
  CONTEXT_STANDALONE_PATIENT: "context-standalone-patient",
  CONTEXT_STANDALONE_ENCOUNTER: "context-standalone-encounter",

  // Permissions
  PERMISSION_PATIENT: "permission-patient",
  PERMISSION_USER: "permission-user",
  PERMISSION_OFFLINE: "permission-offline",
  PERMISSION_ONLINE: "permission-online",
  PERMISSION_V1: "permission-v1",
  PERMISSION_V2: "permission-v2",
};

/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE(): {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
} {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

/**
 * Generate random state parameter
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/**
 * Build authorization URL for EHR launch
 */
export function buildEHRLaunchURL(
  authorizeEndpoint: string,
  config: SMARTAppConfig,
  launchToken: string
): string {
  const params: AuthorizationRequest = {
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(" "),
    state: config.state || generateState(),
    aud: config.aud || "",
    launch: launchToken,
  };

  if (config.pkce) {
    params.code_challenge = config.pkce.codeChallenge;
    params.code_challenge_method = config.pkce.codeChallengeMethod;
  }

  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  return `${authorizeEndpoint}?${queryString}`;
}

/**
 * Build authorization URL for standalone launch
 */
export function buildStandaloneLaunchURL(
  authorizeEndpoint: string,
  config: SMARTAppConfig
): string {
  const params: Partial<AuthorizationRequest> = {
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(" "),
    state: config.state || generateState(),
    aud: config.aud || "",
  };

  if (config.pkce) {
    params.code_challenge = config.pkce.codeChallenge;
    params.code_challenge_method = config.pkce.codeChallengeMethod;
  }

  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  return `${authorizeEndpoint}?${queryString}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  tokenEndpoint: string,
  code: string,
  config: SMARTAppConfig
): Promise<TokenResponse> {
  const params: TokenRequest = {
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
  };

  if (config.pkce) {
    params.code_verifier = config.pkce.codeVerifier;
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params as Record<string, string>),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  tokenEndpoint: string,
  refreshToken: string,
  clientId: string
): Promise<TokenResponse> {
  const params: TokenRequest = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  };

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params as Record<string, string>),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse launch parameters from URL
 */
export function parseLaunchParameters(url: string): LaunchParameters | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    const iss = params.get("iss");
    const launch = params.get("launch");

    if (!iss || !launch) {
      return null;
    }

    return {
      iss,
      launch,
      aud: params.get("aud") || undefined,
      state: params.get("state") || undefined,
    };
  } catch (error) {
    console.error("Error parsing launch parameters:", error);
    return null;
  }
}

/**
 * Parse authorization callback
 */
export function parseAuthorizationCallback(url: string): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
} {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    return {
      code: params.get("code") || undefined,
      state: params.get("state") || undefined,
      error: params.get("error") || undefined,
      error_description: params.get("error_description") || undefined,
    };
  } catch (error) {
    console.error("Error parsing authorization callback:", error);
    return {};
  }
}

/**
 * Get SMART configuration from conformance statement
 */
export async function getSMARTConfiguration(
  fhirBaseURL: string
): Promise<SMARTCapabilities | null> {
  try {
    const response = await fetch(`${fhirBaseURL}/metadata`);
    if (!response.ok) {
      throw new Error("Failed to fetch conformance statement");
    }

    const metadata = await response.json();
    const security = metadata.rest?.[0]?.security;

    if (!security) {
      return null;
    }

    const smartExtension = security.extension?.find(
      (ext: { url: string }) =>
        ext.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
    );

    if (!smartExtension) {
      return null;
    }

    const authorizeExt = smartExtension.extension?.find(
      (ext: { url: string }) => ext.url === "authorize"
    );
    const tokenExt = smartExtension.extension?.find(
      (ext: { url: string }) => ext.url === "token"
    );

    return {
      authorize_endpoint: authorizeExt?.valueUri || "",
      token_endpoint: tokenExt?.valueUri || "",
      scopes_supported: security.service?.[0]?.coding?.map((c: { code: string }) => c.code) || [],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      capabilities: security.service?.[0]?.coding?.map((c: { code: string }) => c.code) || [],
    };
  } catch (error) {
    console.error("Error fetching SMART configuration:", error);
    return null;
  }
}

/**
 * Validation schemas
 */
export const LaunchParametersSchema = z.object({
  iss: z.string().url(),
  launch: z.string(),
  aud: z.string().url().optional(),
  state: z.string().optional(),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
  scope: z.string(),
  refresh_token: z.string().optional(),
  patient: z.string().optional(),
  encounter: z.string().optional(),
  user: z.string().optional(),
  id_token: z.string().optional(),
  need_patient_banner: z.boolean().optional(),
  smart_style_url: z.string().optional(),
});

/**
 * Helper to validate launch parameters
 */
export function validateLaunchParameters(params: unknown): boolean {
  try {
    LaunchParametersSchema.parse(params);
    return true;
  } catch (error) {
    console.error("Launch parameters validation error:", error);
    return false;
  }
}

/**
 * Helper to validate token response
 */
export function validateTokenResponse(response: unknown): boolean {
  try {
    TokenResponseSchema.parse(response);
    return true;
  } catch (error) {
    console.error("Token response validation error:", error);
    return false;
  }
}
