/**
 * SMART on FHIR v2 App Registry
 * SMART app registration, manifest validation, and permission management
 */

import { z } from "zod";

/**
 * SMART App Registration
 */
export interface SMARTAppRegistration {
  id: string;
  clientId: string;
  clientSecret?: string;
  clientType: "public" | "confidential";
  applicationType: "web" | "native";
  clientName: string;
  logoUri?: string;
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  scope: string[];
  grantTypes: ("authorization_code" | "refresh_token" | "client_credentials")[];
  responseTypes: ("code" | "token" | "id_token")[];
  tokenEndpointAuthMethod?: "none" | "client_secret_basic" | "client_secret_post" | "private_key_jwt";

  // SMART-specific
  launchUri?: string;
  fhirVersions?: string[];

  // Metadata
  contacts?: string[];
  tosUri?: string;
  policyUri?: string;
  softwareId?: string;
  softwareVersion?: string;

  // Administrative
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "inactive" | "revoked";

  // Security
  jwksUri?: string;
  jwks?: {
    keys: Array<{
      kty: string;
      use?: string;
      key_ops?: string[];
      alg?: string;
      kid?: string;
      n?: string;
      e?: string;
    }>;
  };
}

/**
 * SMART App Manifest (for dynamic registration)
 */
export interface SMARTAppManifest {
  client_name: string;
  client_uri?: string;
  logo_uri?: string;
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  jwks_uri?: string;
  jwks?: {
    keys: Array<Record<string, unknown>>;
  };
  software_id?: string;
  software_version?: string;

  // SMART-specific
  fhir_versions?: string[];
  launch_url?: string;
}

/**
 * App Launch Configuration
 */
export interface AppLaunchConfig {
  appId: string;
  launchType: "ehr-launch" | "standalone-launch";
  launchUrl: string;
  scope: string[];
  requiresPatientContext: boolean;
  requiresEncounterContext: boolean;
  requiresUserContext: boolean;
}

/**
 * App Permission
 */
export interface AppPermission {
  appId: string;
  userId?: string;
  patientId?: string;
  organizationId?: string;
  grantedScopes: string[];
  deniedScopes?: string[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  status: "active" | "revoked";
}

/**
 * App Usage Analytics
 */
export interface AppUsage {
  appId: string;
  userId?: string;
  patientId?: string;
  launchCount: number;
  lastLaunchedAt?: Date;
  totalTokensIssued: number;
  totalApiCalls: number;
  lastApiCallAt?: Date;
  errorCount: number;
  lastErrorAt?: Date;
}

/**
 * Generate client ID
 */
export function generateClientId(): string {
  const crypto = require("crypto");
  return `app_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Generate client secret
 */
export function generateClientSecret(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Validate redirect URI
 */
export function validateRedirectUri(uri: string, appType: "web" | "native"): boolean {
  try {
    const url = new URL(uri);

    if (appType === "web") {
      // Web apps must use https (except localhost for development)
      if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        return false;
      }
    } else {
      // Native apps can use custom schemes
      if (url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        return false;
      }
    }

    // No fragments allowed in redirect URIs
    if (url.hash) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate app manifest
 */
export function validateAppManifest(manifest: SMARTAppManifest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!manifest.client_name || manifest.client_name.trim().length === 0) {
    errors.push("client_name is required");
  }

  if (!manifest.redirect_uris || manifest.redirect_uris.length === 0) {
    errors.push("At least one redirect_uri is required");
  } else {
    manifest.redirect_uris.forEach((uri, index) => {
      try {
        new URL(uri);
      } catch {
        errors.push(`redirect_uris[${index}] is not a valid URL`);
      }
    });
  }

  if (manifest.grant_types) {
    const validGrantTypes = ["authorization_code", "refresh_token", "client_credentials"];
    manifest.grant_types.forEach((type) => {
      if (!validGrantTypes.includes(type)) {
        errors.push(`Invalid grant_type: ${type}`);
      }
    });
  }

  if (manifest.response_types) {
    const validResponseTypes = ["code", "token", "id_token"];
    manifest.response_types.forEach((type) => {
      if (!validResponseTypes.includes(type)) {
        errors.push(`Invalid response_type: ${type}`);
      }
    });
  }

  if (manifest.fhir_versions) {
    const validFhirVersions = ["4.0.1", "4.0.0", "3.0.2", "3.0.1", "1.0.2"];
    manifest.fhir_versions.forEach((version) => {
      if (!validFhirVersions.includes(version)) {
        errors.push(`Unsupported FHIR version: ${version}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create app registration from manifest
 */
export function createAppRegistration(
  manifest: SMARTAppManifest,
  createdBy: string,
  clientType: "public" | "confidential" = "public",
  applicationType: "web" | "native" = "web"
): SMARTAppRegistration {
  const clientId = generateClientId();
  const clientSecret = clientType === "confidential" ? generateClientSecret() : undefined;

  return {
    id: clientId,
    clientId,
    clientSecret,
    clientType,
    applicationType,
    clientName: manifest.client_name,
    logoUri: manifest.logo_uri,
    redirectUris: manifest.redirect_uris,
    postLogoutRedirectUris: manifest.redirect_uris, // Default to same as redirect URIs
    scope: manifest.scope ? manifest.scope.split(/\s+/) : [],
    grantTypes: (manifest.grant_types as ("authorization_code" | "refresh_token" | "client_credentials")[]) || ["authorization_code"],
    responseTypes: (manifest.response_types as ("code" | "token" | "id_token")[]) || ["code"],
    tokenEndpointAuthMethod: manifest.token_endpoint_auth_method as "none" | "client_secret_basic" | "client_secret_post" | "private_key_jwt" || (clientType === "public" ? "none" : "client_secret_post"),
    launchUri: manifest.launch_url,
    fhirVersions: manifest.fhir_versions,
    contacts: manifest.contacts,
    tosUri: manifest.tos_uri,
    policyUri: manifest.policy_uri,
    softwareId: manifest.software_id,
    softwareVersion: manifest.software_version,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "active",
    jwksUri: manifest.jwks_uri,
    jwks: manifest.jwks as SMARTAppRegistration["jwks"],
  };
}

/**
 * Update app registration
 */
export function updateAppRegistration(
  existing: SMARTAppRegistration,
  updates: Partial<SMARTAppManifest>
): SMARTAppRegistration {
  return {
    ...existing,
    clientName: updates.client_name || existing.clientName,
    logoUri: updates.logo_uri !== undefined ? updates.logo_uri : existing.logoUri,
    redirectUris: updates.redirect_uris || existing.redirectUris,
    scope: updates.scope ? updates.scope.split(/\s+/) : existing.scope,
    contacts: updates.contacts !== undefined ? updates.contacts : existing.contacts,
    tosUri: updates.tos_uri !== undefined ? updates.tos_uri : existing.tosUri,
    policyUri: updates.policy_uri !== undefined ? updates.policy_uri : existing.policyUri,
    softwareVersion: updates.software_version !== undefined ? updates.software_version : existing.softwareVersion,
    updatedAt: new Date(),
  };
}

/**
 * Check if app is authorized for scope
 */
export function isAppAuthorizedForScope(
  app: SMARTAppRegistration,
  requestedScope: string
): boolean {
  return app.scope.includes(requestedScope) || app.scope.includes("*");
}

/**
 * Check if redirect URI is registered
 */
export function isRedirectUriRegistered(
  app: SMARTAppRegistration,
  redirectUri: string
): boolean {
  return app.redirectUris.includes(redirectUri);
}

/**
 * Grant app permission
 */
export function grantAppPermission(
  appId: string,
  grantedBy: string,
  scopes: string[],
  options?: {
    userId?: string;
    patientId?: string;
    organizationId?: string;
    expiresIn?: number; // seconds
  }
): AppPermission {
  const now = new Date();
  const expiresAt = options?.expiresIn
    ? new Date(now.getTime() + options.expiresIn * 1000)
    : undefined;

  return {
    appId,
    userId: options?.userId,
    patientId: options?.patientId,
    organizationId: options?.organizationId,
    grantedScopes: scopes,
    grantedAt: now,
    grantedBy,
    expiresAt,
    status: "active",
  };
}

/**
 * Revoke app permission
 */
export function revokeAppPermission(permission: AppPermission): AppPermission {
  return {
    ...permission,
    status: "revoked",
  };
}

/**
 * Check if permission is valid
 */
export function isPermissionValid(permission: AppPermission): boolean {
  if (permission.status !== "active") {
    return false;
  }

  if (permission.expiresAt && permission.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Track app usage
 */
export function trackAppLaunch(appId: string, userId?: string, patientId?: string): Partial<AppUsage> {
  return {
    appId,
    userId,
    patientId,
    launchCount: 1,
    lastLaunchedAt: new Date(),
  };
}

/**
 * Validation schemas
 */
export const SMARTAppManifestSchema = z.object({
  client_name: z.string().min(1),
  client_uri: z.string().url().optional(),
  logo_uri: z.string().url().optional(),
  redirect_uris: z.array(z.string().url()).min(1),
  token_endpoint_auth_method: z.string().optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  scope: z.string().optional(),
  contacts: z.array(z.string().email()).optional(),
  tos_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  jwks_uri: z.string().url().optional(),
  jwks: z.object({ keys: z.array(z.record(z.unknown())) }).optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
  fhir_versions: z.array(z.string()).optional(),
  launch_url: z.string().url().optional(),
});

export const SMARTAppRegistrationSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  clientType: z.enum(["public", "confidential"]),
  applicationType: z.enum(["web", "native"]),
  clientName: z.string(),
  logoUri: z.string().url().optional(),
  redirectUris: z.array(z.string().url()),
  scope: z.array(z.string()),
  grantTypes: z.array(z.enum(["authorization_code", "refresh_token", "client_credentials"])),
  responseTypes: z.array(z.enum(["code", "token", "id_token"])),
  status: z.enum(["active", "inactive", "revoked"]),
});

/**
 * Helper to validate manifest
 */
export function isValidManifest(manifest: unknown): boolean {
  try {
    SMARTAppManifestSchema.parse(manifest);
    return true;
  } catch (error) {
    console.error("Manifest validation error:", error);
    return false;
  }
}

/**
 * Helper to validate registration
 */
export function isValidRegistration(registration: unknown): boolean {
  try {
    SMARTAppRegistrationSchema.parse(registration);
    return true;
  } catch (error) {
    console.error("Registration validation error:", error);
    return false;
  }
}

/**
 * Get app display info
 */
export function getAppDisplayInfo(app: SMARTAppRegistration): {
  name: string;
  logo?: string;
  description?: string;
} {
  return {
    name: app.clientName,
    logo: app.logoUri,
    description: `${app.clientType} ${app.applicationType} application`,
  };
}

/**
 * Get app security info
 */
export function getAppSecurityInfo(app: SMARTAppRegistration): {
  requiresPKCE: boolean;
  requiresClientAuth: boolean;
  supportedAuthMethods: string[];
} {
  return {
    requiresPKCE: app.clientType === "public",
    requiresClientAuth: app.clientType === "confidential",
    supportedAuthMethods: [app.tokenEndpointAuthMethod || "none"],
  };
}
