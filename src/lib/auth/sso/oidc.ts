import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { encrypt, decrypt, createHMAC, verifyHMAC } from "@/lib/encryption";

/**
 * OpenID Connect (OIDC) / OAuth 2.0 Implementation
 * Enterprise-grade SSO integration with security best practices
 */

export interface OIDCConfig {
  id: string;
  organizationId: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  endSessionEndpoint?: string;
  scopes: string[];
  responseType: "code" | "id_token" | "code id_token";
  responseMode?: "query" | "fragment" | "form_post";
  acrValues?: string;
  claimsMapping: Record<string, string>;
  pkceEnabled: boolean;
  enabled: boolean;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
}

export interface IDTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  [key: string]: any;
}

export interface UserInfo {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  [key: string]: any;
}

/**
 * Generate authorization URL with PKCE support
 */
export async function createAuthorizationUrl(
  config: OIDCConfig,
  redirectUri: string,
  state?: string,
  nonce?: string,
): Promise<{
  url: string;
  state: string;
  nonce: string;
  codeVerifier?: string;
}> {
  // Generate state if not provided
  const authState = state || crypto.randomBytes(32).toString("hex");
  const authNonce = nonce || crypto.randomBytes(32).toString("hex");

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: config.responseType,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    state: authState,
    nonce: authNonce,
  });

  // Add PKCE parameters if enabled
  let codeVerifier: string | undefined;
  if (config.pkceEnabled) {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
  }

  // Add response mode if specified
  if (config.responseMode) {
    params.append("response_mode", config.responseMode);
  }

  // Add ACR values if specified
  if (config.acrValues) {
    params.append("acr_values", config.acrValues);
  }

  const url = `${config.authorizationEndpoint}?${params.toString()}`;

  // Log authorization request
  await logAudit({
    action: "SSO_INITIATED",
    resource: "OIDC",
    description: `OIDC authorization request initiated for provider: ${config.providerName}`,
    metadata: {
      providerId: config.providerId,
      state: authState,
      pkceEnabled: config.pkceEnabled,
    },
    organizationId: config.organizationId,
  });

  return {
    url,
    state: authState,
    nonce: authNonce,
    codeVerifier,
  };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: OIDCConfig,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  // Add code verifier if PKCE is enabled
  if (config.pkceEnabled && codeVerifier) {
    params.append("code_verifier", codeVerifier);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    scope: data.scope,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  config: OIDCConfig,
  refreshToken: string,
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    scope: data.scope,
  };
}

/**
 * Validate and decode ID token
 */
export async function validateIdToken(
  config: OIDCConfig,
  idToken: string,
  nonce?: string,
): Promise<IDTokenClaims> {
  // Split JWT into parts
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  // Decode header and payload
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

  // Verify signature
  const isValid = await verifyJWTSignature(idToken, config.jwksUri, header.kid);
  if (!isValid) {
    throw new Error("ID token signature verification failed");
  }

  // Validate claims
  const now = Math.floor(Date.now() / 1000);

  // Check expiration
  if (payload.exp < now) {
    throw new Error("ID token has expired");
  }

  // Check issued at (allow 5 minutes clock skew)
  if (payload.iat > now + 300) {
    throw new Error("ID token issued in the future");
  }

  // Verify issuer
  if (payload.iss !== config.issuer) {
    throw new Error("ID token issuer mismatch");
  }

  // Verify audience
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(config.clientId)) {
    throw new Error("ID token audience mismatch");
  }

  // Verify nonce if provided
  if (nonce && payload.nonce !== nonce) {
    throw new Error("ID token nonce mismatch");
  }

  return payload as IDTokenClaims;
}

/**
 * Fetch user info from userinfo endpoint
 */
export async function fetchUserInfo(
  config: OIDCConfig,
  accessToken: string,
): Promise<UserInfo> {
  const response = await fetch(config.userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`UserInfo request failed: ${error}`);
  }

  return await response.json();
}

/**
 * Verify JWT signature using JWKS
 */
async function verifyJWTSignature(
  token: string,
  jwksUri: string,
  kid?: string,
): Promise<boolean> {
  try {
    // Fetch JWKS
    const response = await fetch(jwksUri);
    if (!response.ok) {
      throw new Error("Failed to fetch JWKS");
    }

    const jwks = await response.json();
    const keys = jwks.keys;

    if (!keys || keys.length === 0) {
      throw new Error("No keys found in JWKS");
    }

    // Find matching key
    let key = kid ? keys.find((k: any) => k.kid === kid) : keys[0];

    if (!key) {
      throw new Error("Matching key not found in JWKS");
    }

    // Extract token parts
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const signedData = `${headerB64}.${payloadB64}`;

    // Convert JWK to PEM
    const publicKey = await jwkToPem(key);

    // Verify signature
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(signedData);

    const signature = Buffer.from(signatureB64, "base64url");
    const isValid = verify.verify(publicKey, signature);

    return isValid;
  } catch (error) {
    console.error("JWT signature verification error:", error);
    return false;
  }
}

/**
 * Convert JWK to PEM format
 */
async function jwkToPem(jwk: any): Promise<string> {
  if (jwk.kty !== "RSA") {
    throw new Error("Only RSA keys are supported");
  }

  const n = Buffer.from(jwk.n, "base64url");
  const e = Buffer.from(jwk.e, "base64url");

  // Create public key
  const publicKey = crypto.createPublicKey({
    key: {
      kty: "RSA",
      n: n.toString("base64url"),
      e: e.toString("base64url"),
    },
    format: "jwk",
  });

  // Export as PEM
  return publicKey.export({ type: "spki", format: "pem" }) as string;
}

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate PKCE code challenge
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Create logout URL
 */
export function createLogoutUrl(
  config: OIDCConfig,
  idToken: string,
  postLogoutRedirectUri?: string,
): string {
  if (!config.endSessionEndpoint) {
    throw new Error("End session endpoint not configured");
  }

  const params = new URLSearchParams({
    id_token_hint: idToken,
  });

  if (postLogoutRedirectUri) {
    params.append("post_logout_redirect_uri", postLogoutRedirectUri);
  }

  return `${config.endSessionEndpoint}?${params.toString()}`;
}

/**
 * Get OIDC configuration for organization
 */
export async function getOIDCConfig(
  organizationId: string,
  providerId: string,
): Promise<OIDCConfig | null> {
  const config = await prisma.sSOConfig.findFirst({
    where: {
      organizationId,
      providerId,
      provider: "OIDC",
      enabled: true,
    },
  });

  if (!config) {
    return null;
  }

  const decryptedConfig = config.configuration as any;

  return {
    id: config.id,
    organizationId: config.organizationId,
    providerId: config.providerId,
    providerName: config.providerName,
    clientId: decryptedConfig.clientId,
    clientSecret: decryptedConfig.clientSecret,
    issuer: decryptedConfig.issuer,
    authorizationEndpoint: decryptedConfig.authorizationEndpoint,
    tokenEndpoint: decryptedConfig.tokenEndpoint,
    userinfoEndpoint: decryptedConfig.userinfoEndpoint,
    jwksUri: decryptedConfig.jwksUri,
    endSessionEndpoint: decryptedConfig.endSessionEndpoint,
    scopes: decryptedConfig.scopes || ["openid", "email", "profile"],
    responseType: decryptedConfig.responseType || "code",
    responseMode: decryptedConfig.responseMode,
    acrValues: decryptedConfig.acrValues,
    claimsMapping: decryptedConfig.claimsMapping || {
      email: "email",
      given_name: "firstName",
      family_name: "lastName",
      name: "displayName",
      picture: "avatar",
    },
    pkceEnabled: decryptedConfig.pkceEnabled ?? true,
    enabled: config.enabled,
  };
}

/**
 * Save OIDC configuration
 */
export async function saveOIDCConfig(
  organizationId: string,
  providerId: string,
  providerName: string,
  configuration: Partial<OIDCConfig>,
): Promise<void> {
  await prisma.sSOConfig.upsert({
    where: {
      organizationId_providerId: {
        organizationId,
        providerId,
      },
    },
    create: {
      organizationId,
      providerId,
      providerName,
      provider: "OIDC",
      configuration: configuration as any,
      enabled: true,
      createdBy: "system",
      updatedBy: "system",
    },
    update: {
      providerName,
      configuration: configuration as any,
      updatedBy: "system",
      updatedAt: new Date(),
    },
  });

  await logAudit({
    action: "SSO_CONFIG_UPDATED",
    resource: "SSOConfig",
    resourceId: providerId,
    description: `OIDC configuration updated for provider: ${providerName}`,
    metadata: { providerId, providerName },
    organizationId,
  });
}

/**
 * Discover OIDC configuration from issuer
 */
export async function discoverOIDCConfiguration(
  issuer: string,
): Promise<Partial<OIDCConfig>> {
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error("Failed to discover OIDC configuration");
  }

  const config = await response.json();

  return {
    issuer: config.issuer,
    authorizationEndpoint: config.authorization_endpoint,
    tokenEndpoint: config.token_endpoint,
    userinfoEndpoint: config.userinfo_endpoint,
    jwksUri: config.jwks_uri,
    endSessionEndpoint: config.end_session_endpoint,
    scopes: config.scopes_supported || ["openid", "email", "profile"],
    responseType: "code",
  };
}

/**
 * Authenticate user with OIDC
 */
export async function authenticateWithOIDC(
  organizationId: string,
  providerId: string,
  tokens: TokenResponse,
  userInfo?: UserInfo,
): Promise<{ userId: string; email: string; isNewUser: boolean }> {
  // Decode ID token to get claims
  const config = await getOIDCConfig(organizationId, providerId);
  if (!config) {
    throw new Error("OIDC configuration not found");
  }

  let claims: IDTokenClaims | UserInfo;

  if (tokens.idToken) {
    claims = await validateIdToken(config, tokens.idToken);
  } else if (userInfo) {
    claims = userInfo;
  } else {
    throw new Error("No ID token or user info available");
  }

  // Map claims to user attributes
  const email = claims.email || claims[config.claimsMapping.email];
  if (!email) {
    throw new Error("Email not found in OIDC claims");
  }

  // Check if user exists
  let user = await prisma.user.findFirst({
    where: {
      organizationId,
      email: email.toLowerCase(),
    },
  });

  let isNewUser = false;

  if (!user) {
    // Auto-provision user
    const firstName =
      claims.givenName ||
      claims.given_name ||
      claims[config.claimsMapping.given_name] ||
      "";
    const lastName =
      claims.familyName ||
      claims.family_name ||
      claims[config.claimsMapping.family_name] ||
      "";
    const name =
      claims.name ||
      claims[config.claimsMapping.name] ||
      `${firstName} ${lastName}`;
    const picture = claims.picture || claims[config.claimsMapping.picture];

    user = await prisma.user.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        emailVerified:
          claims.emailVerified || claims.email_verified ? new Date() : null,
        passwordHash: crypto.randomBytes(32).toString("hex"), // Random password (not used)
        firstName,
        lastName,
        status: "active",
        ssoProvider: providerId,
        ssoId: claims.sub,
        avatar: picture,
        createdBy: "sso",
        updatedBy: "sso",
      },
    });

    isNewUser = true;

    await logAudit({
      userId: user.id,
      action: "USER_CREATED",
      resource: "User",
      resourceId: user.id,
      description: `User auto-provisioned via OIDC SSO: ${email}`,
      metadata: {
        email,
        providerId,
        sub: claims.sub,
      },
      organizationId,
    });
  } else {
    // Update SSO information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ssoProvider: providerId,
        ssoId: claims.sub,
        emailVerified:
          claims.emailVerified || claims.email_verified
            ? new Date()
            : user.emailVerified,
        lastLoginAt: new Date(),
      },
    });
  }

  // Store tokens securely
  if (tokens.refreshToken) {
    await prisma.sSOToken.create({
      data: {
        userId: user.id,
        providerId,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        idToken: tokens.idToken ? encrypt(tokens.idToken) : null,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
        tokenType: tokens.tokenType,
      },
    });
  }

  // Log successful SSO login
  await logAudit({
    userId: user.id,
    action: "SSO_LOGIN",
    resource: "User",
    resourceId: user.id,
    description: `User authenticated via OIDC SSO: ${email}`,
    metadata: {
      email,
      providerId,
      sub: claims.sub,
      isNewUser,
    },
    organizationId,
  });

  return {
    userId: user.id,
    email: user.email,
    isNewUser,
  };
}

/**
 * Revoke OIDC tokens
 */
export async function revokeOIDCTokens(
  config: OIDCConfig,
  token: string,
  tokenTypeHint?: "access_token" | "refresh_token",
): Promise<void> {
  if (!config.endSessionEndpoint) {
    return; // Provider doesn't support token revocation
  }

  const params = new URLSearchParams({
    token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  if (tokenTypeHint) {
    params.append("token_type_hint", tokenTypeHint);
  }

  await fetch(`${config.issuer}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}
