/**
 * Patient Access API - Token Introspection
 * OAuth 2.0 token introspection and revocation endpoints
 */

import { z } from "zod";
import jwt from "jsonwebtoken";
import type { AccessTokenPayload } from "@/lib/smart/authorization";

/**
 * Token Introspection Request
 */
export interface IntrospectionRequest {
  token: string;
  token_type_hint?: "access_token" | "refresh_token";
  client_id?: string;
  client_secret?: string;
}

/**
 * Token Introspection Response
 */
export interface IntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
  patient?: string;
  fhirUser?: string;
}

/**
 * Token Revocation Request
 */
export interface RevocationRequest {
  token: string;
  token_type_hint?: "access_token" | "refresh_token";
  client_id?: string;
  client_secret?: string;
}

/**
 * Revoked Token Storage (replace with database in production)
 */
class RevokedTokenStore {
  private revokedTokens = new Set<string>();

  revoke(tokenId: string): void {
    this.revokedTokens.add(tokenId);
  }

  isRevoked(tokenId: string): boolean {
    return this.revokedTokens.has(tokenId);
  }

  cleanup(expirationDate: Date): void {
    // In production, clean up expired revoked tokens from database
    // For now, this is a no-op with in-memory storage
  }
}

const revokedTokenStore = new RevokedTokenStore();

/**
 * Introspect access token
 */
export function introspectToken(
  token: string,
  secret: string
): IntrospectionResponse {
  try {
    // Verify and decode token
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as AccessTokenPayload;

    // Check if token is revoked
    if (decoded.jti && revokedTokenStore.isRevoked(decoded.jti)) {
      return { active: false };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return { active: false };
    }

    // Return active token info
    return {
      active: true,
      scope: decoded.scope,
      client_id: decoded.client_id,
      token_type: "Bearer",
      exp: decoded.exp,
      iat: decoded.iat,
      sub: decoded.sub,
      aud: decoded.aud,
      iss: decoded.iss,
      jti: decoded.jti,
      patient: decoded.patient,
      fhirUser: decoded.fhirUser,
    };
  } catch (error) {
    console.error("Token introspection error:", error);
    return { active: false };
  }
}

/**
 * Revoke token
 */
export function revokeToken(token: string, secret: string): boolean {
  try {
    // Decode token without verification (to get JTI even if expired)
    const decoded = jwt.decode(token) as AccessTokenPayload | null;

    if (!decoded || !decoded.jti) {
      return false;
    }

    // Add to revoked tokens
    revokedTokenStore.revoke(decoded.jti);

    return true;
  } catch (error) {
    console.error("Token revocation error:", error);
    return false;
  }
}

/**
 * Check if token is revoked
 */
export function isTokenRevoked(tokenId: string): boolean {
  return revokedTokenStore.isRevoked(tokenId);
}

/**
 * Validate introspection request
 */
export function validateIntrospectionRequest(
  request: unknown
): IntrospectionRequest | null {
  try {
    return IntrospectionRequestSchema.parse(request);
  } catch (error) {
    console.error("Introspection request validation error:", error);
    return null;
  }
}

/**
 * Validate revocation request
 */
export function validateRevocationRequest(
  request: unknown
): RevocationRequest | null {
  try {
    return RevocationRequestSchema.parse(request);
  } catch (error) {
    console.error("Revocation request validation error:", error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Validate client credentials for introspection/revocation
 */
export function validateClientCredentials(
  clientId: string,
  clientSecret: string,
  storedClientSecret: string
): boolean {
  // In production, use constant-time comparison
  return clientSecret === storedClientSecret;
}

/**
 * Get token metadata
 */
export function getTokenMetadata(
  token: string,
  secret: string
): {
  isValid: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  expiresIn?: number;
  payload?: AccessTokenPayload;
} {
  try {
    const decoded = jwt.decode(token) as AccessTokenPayload | null;

    if (!decoded) {
      return {
        isValid: false,
        isExpired: false,
        isRevoked: false,
      };
    }

    // Check if revoked
    const isRevoked = decoded.jti ? revokedTokenStore.isRevoked(decoded.jti) : false;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp ? decoded.exp < now : false;

    // Verify signature
    try {
      jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch {
      return {
        isValid: false,
        isExpired,
        isRevoked,
        payload: decoded,
      };
    }

    return {
      isValid: !isRevoked && !isExpired,
      isExpired,
      isRevoked,
      expiresIn: decoded.exp ? Math.max(0, decoded.exp - now) : undefined,
      payload: decoded,
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: false,
      isRevoked: false,
    };
  }
}

/**
 * Batch introspect tokens
 */
export function introspectTokens(
  tokens: string[],
  secret: string
): Map<string, IntrospectionResponse> {
  const results = new Map<string, IntrospectionResponse>();

  for (const token of tokens) {
    results.set(token, introspectToken(token, secret));
  }

  return results;
}

/**
 * Batch revoke tokens
 */
export function revokeTokens(tokens: string[], secret: string): Map<string, boolean> {
  const results = new Map<string, boolean>();

  for (const token of tokens) {
    results.set(token, revokeToken(token, secret));
  }

  return results;
}

/**
 * Cleanup expired revoked tokens
 */
export function cleanupRevokedTokens(): void {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - 30); // Clean up tokens older than 30 days
  revokedTokenStore.cleanup(expirationDate);
}

/**
 * Validation schemas
 */
export const IntrospectionRequestSchema = z.object({
  token: z.string(),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});

export const RevocationRequestSchema = z.object({
  token: z.string(),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});

export const IntrospectionResponseSchema = z.object({
  active: z.boolean(),
  scope: z.string().optional(),
  client_id: z.string().optional(),
  username: z.string().optional(),
  token_type: z.string().optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
  nbf: z.number().optional(),
  sub: z.string().optional(),
  aud: z.string().optional(),
  iss: z.string().optional(),
  jti: z.string().optional(),
  patient: z.string().optional(),
  fhirUser: z.string().optional(),
});
