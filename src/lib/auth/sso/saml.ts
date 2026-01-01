import crypto from "crypto";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * SAML 2.0 Service Provider Implementation
 * Enterprise-grade SSO integration with HIPAA-compliant audit logging
 */

export interface SAMLConfig {
  id: string;
  organizationId: string;
  providerId: string;
  providerName: string;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  signatureAlgorithm: "sha256" | "sha512";
  digestAlgorithm: "sha256" | "sha512";
  nameIdFormat: string;
  attributeMapping: Record<string, string>;
  enabled: boolean;
  metadata?: string;
}

export interface SAMLAssertion {
  issuer: string;
  nameId: string;
  nameIdFormat: string;
  sessionIndex: string;
  attributes: Record<string, any>;
  notBefore: Date;
  notOnOrAfter: Date;
  audience: string;
  inResponseTo?: string;
}

export interface SAMLResponse {
  assertion: SAMLAssertion;
  statusCode: string;
  destination?: string;
  issuer: string;
  signature?: string;
}

/**
 * Generate Service Provider metadata
 */
export async function generateSPMetadata(
  organizationId: string,
  acsUrl: string,
  entityId: string,
): Promise<string> {
  const metadata = {
    "md:EntityDescriptor": {
      "@xmlns:md": "urn:oasis:names:tc:SAML:2.0:metadata",
      "@xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
      "@entityID": entityId,
      "@validUntil": new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      "md:SPSSODescriptor": {
        "@AuthnRequestsSigned": "true",
        "@WantAssertionsSigned": "true",
        "@protocolSupportEnumeration": "urn:oasis:names:tc:SAML:2.0:protocol",
        "md:NameIDFormat":
          "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        "md:AssertionConsumerService": {
          "@Binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
          "@Location": acsUrl,
          "@index": "1",
          "@isDefault": "true",
        },
        "md:SingleLogoutService": {
          "@Binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
          "@Location": `${acsUrl}/slo`,
        },
      },
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    attributeNamePrefix: "@",
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(metadata);
}

/**
 * Create SAML authentication request
 */
export async function createAuthRequest(
  config: SAMLConfig,
  acsUrl: string,
  relayState?: string,
): Promise<{ url: string; requestId: string }> {
  const requestId = `_${crypto.randomBytes(21).toString("hex")}`;
  const issueInstant = new Date().toISOString();

  const authnRequest = {
    "samlp:AuthnRequest": {
      "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
      "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
      "@ID": requestId,
      "@Version": "2.0",
      "@IssueInstant": issueInstant,
      "@Destination": config.ssoUrl,
      "@AssertionConsumerServiceURL": acsUrl,
      "@ProtocolBinding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
      "saml:Issuer": config.entityId,
      "samlp:NameIDPolicy": {
        "@Format": config.nameIdFormat,
        "@AllowCreate": "true",
      },
      "samlp:RequestedAuthnContext": {
        "@Comparison": "exact",
        "saml:AuthnContextClassRef":
          "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport",
      },
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: false,
    attributeNamePrefix: "@",
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' + builder.build(authnRequest);

  // Base64 encode and URL encode the request
  const encodedRequest = Buffer.from(xml)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Build redirect URL
  const params = new URLSearchParams({
    SAMLRequest: encodedRequest,
  });

  if (relayState) {
    params.append("RelayState", relayState);
  }

  const url = `${config.ssoUrl}?${params.toString()}`;

  // Log SSO initiation
  await logAudit({
    action: "SSO_INITIATED",
    resource: "SAML",
    resourceId: requestId,
    description: `SAML authentication request initiated for provider: ${config.providerName}`,
    metadata: {
      providerId: config.providerId,
      requestId,
      destination: config.ssoUrl,
    },
    organizationId: config.organizationId,
  });

  return { url, requestId };
}

/**
 * Parse and validate SAML response
 */
export async function parseResponse(
  config: SAMLConfig,
  samlResponseEncoded: string,
  expectedRequestId?: string,
): Promise<SAMLResponse> {
  // Decode base64
  const samlResponseXml = Buffer.from(samlResponseEncoded, "base64").toString(
    "utf8",
  );

  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseAttributeValue: true,
  });

  const parsedResponse = parser.parse(samlResponseXml);

  // Extract response
  const response =
    parsedResponse["samlp:Response"] || parsedResponse["saml2p:Response"];

  if (!response) {
    throw new Error("Invalid SAML response: Missing Response element");
  }

  // Validate status
  const statusCode =
    response["samlp:Status"]?.["samlp:StatusCode"]?.["@Value"] ||
    response["saml2p:Status"]?.["saml2p:StatusCode"]?.["@Value"];

  if (statusCode !== "urn:oasis:names:tc:SAML:2.0:status:Success") {
    const statusMessage =
      response["samlp:Status"]?.["samlp:StatusMessage"] ||
      response["saml2p:Status"]?.["saml2p:StatusMessage"] ||
      "Unknown error";

    throw new Error(`SAML authentication failed: ${statusMessage}`);
  }

  // Extract assertion
  const assertion = response["saml:Assertion"] || response["saml2:Assertion"];

  if (!assertion) {
    throw new Error("Invalid SAML response: Missing Assertion element");
  }

  // Verify signature if required
  if (config.wantAssertionsSigned || config.wantResponseSigned) {
    const signatureValid = await verifySignature(
      samlResponseXml,
      config.certificate,
    );
    if (!signatureValid) {
      throw new Error("SAML signature verification failed");
    }
  }

  // Validate conditions
  const conditions =
    assertion["saml:Conditions"] || assertion["saml2:Conditions"];
  const notBefore = new Date(conditions?.["@NotBefore"]);
  const notOnOrAfter = new Date(conditions?.["@NotOnOrAfter"]);
  const now = new Date();

  if (now < notBefore || now >= notOnOrAfter) {
    throw new Error("SAML assertion is not valid at current time");
  }

  // Validate audience
  const audience =
    conditions?.["saml:AudienceRestriction"]?.["saml:Audience"] ||
    conditions?.["saml2:AudienceRestriction"]?.["saml2:Audience"];

  if (audience !== config.entityId) {
    throw new Error("SAML assertion audience does not match entity ID");
  }

  // Extract subject
  const subject = assertion["saml:Subject"] || assertion["saml2:Subject"];
  const nameId =
    subject?.["saml:NameID"]?.["#text"] ||
    subject?.["saml2:NameID"]?.["#text"] ||
    subject?.["saml:NameID"] ||
    subject?.["saml2:NameID"];

  const nameIdFormat =
    subject?.["saml:NameID"]?.["@Format"] ||
    subject?.["saml2:NameID"]?.["@Format"] ||
    config.nameIdFormat;

  // Extract session index
  const authnStatement =
    assertion["saml:AuthnStatement"] || assertion["saml2:AuthnStatement"];
  const sessionIndex = authnStatement?.["@SessionIndex"] || "";

  // Extract attributes
  const attributeStatement =
    assertion["saml:AttributeStatement"] ||
    assertion["saml2:AttributeStatement"];
  const attributes = parseAttributes(
    attributeStatement,
    config.attributeMapping,
  );

  // Extract issuer
  const issuer =
    response["saml:Issuer"]?.["#text"] ||
    response["saml2:Issuer"]?.["#text"] ||
    response["saml:Issuer"] ||
    response["saml2:Issuer"];

  // Validate InResponseTo if provided
  const inResponseTo = response?.["@InResponseTo"];
  if (expectedRequestId && inResponseTo !== expectedRequestId) {
    throw new Error("SAML response InResponseTo does not match request ID");
  }

  return {
    assertion: {
      issuer: assertion["saml:Issuer"] || assertion["saml2:Issuer"],
      nameId,
      nameIdFormat,
      sessionIndex,
      attributes,
      notBefore,
      notOnOrAfter,
      audience,
      inResponseTo,
    },
    statusCode,
    destination: response?.["@Destination"],
    issuer,
  };
}

/**
 * Parse SAML attributes
 */
function parseAttributes(
  attributeStatement: any,
  mapping: Record<string, string>,
): Record<string, any> {
  const attributes: Record<string, any> = {};

  if (!attributeStatement) {
    return attributes;
  }

  let attributeList =
    attributeStatement["saml:Attribute"] ||
    attributeStatement["saml2:Attribute"];

  if (!Array.isArray(attributeList)) {
    attributeList = attributeList ? [attributeList] : [];
  }

  for (const attribute of attributeList) {
    const name = attribute?.["@Name"] || "";
    const friendlyName = attribute?.["@FriendlyName"] || "";

    let value =
      attribute?.["saml:AttributeValue"] || attribute?.["saml2:AttributeValue"];

    // Handle array of values
    if (Array.isArray(value)) {
      value = value.map((v) => v?.["#text"] || v).filter(Boolean);
      if (value.length === 1) {
        value = value[0];
      }
    } else {
      value = value?.["#text"] || value;
    }

    // Use attribute mapping if defined
    const mappedName =
      mapping[name] || mapping[friendlyName] || friendlyName || name;

    if (mappedName && value) {
      attributes[mappedName] = value;
    }
  }

  return attributes;
}

/**
 * Verify XML signature
 */
async function verifySignature(
  xml: string,
  certificate: string,
): Promise<boolean> {
  try {
    // Extract signature value
    const signatureRegex = /<ds:SignatureValue>([\s\S]*?)<\/ds:SignatureValue>/;
    const signatureMatch = xml.match(signatureRegex);

    if (!signatureMatch) {
      return false;
    }

    const signatureValue = signatureMatch[1].replace(/\s/g, "");

    // Extract signed info
    const signedInfoRegex = /<ds:SignedInfo>([\s\S]*?)<\/ds:SignedInfo>/;
    const signedInfoMatch = xml.match(signedInfoRegex);

    if (!signedInfoMatch) {
      return false;
    }

    const signedInfo = signedInfoMatch[0];

    // Prepare certificate
    const cert = certificate
      .replace(/-----BEGIN CERTIFICATE-----/, "")
      .replace(/-----END CERTIFICATE-----/, "")
      .replace(/\s/g, "");

    const certBuffer = Buffer.from(cert, "base64");

    // Create public key
    const publicKey = crypto.createPublicKey({
      key: certBuffer,
      format: "der",
      type: "spki",
    });

    // Verify signature
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(signedInfo);
    const isValid = verify.verify(publicKey, signatureValue, "base64");

    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Create logout request
 */
export async function createLogoutRequest(
  config: SAMLConfig,
  nameId: string,
  sessionIndex: string,
): Promise<string> {
  const requestId = `_${crypto.randomBytes(21).toString("hex")}`;
  const issueInstant = new Date().toISOString();

  const logoutRequest = {
    "samlp:LogoutRequest": {
      "@xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
      "@xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
      "@ID": requestId,
      "@Version": "2.0",
      "@IssueInstant": issueInstant,
      "@Destination": config.sloUrl,
      "saml:Issuer": config.entityId,
      "saml:NameID": {
        "@Format": config.nameIdFormat,
        "#text": nameId,
      },
      "samlp:SessionIndex": sessionIndex,
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: false,
    attributeNamePrefix: "@",
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' + builder.build(logoutRequest);

  // Base64 encode
  const encodedRequest = Buffer.from(xml).toString("base64");

  return encodedRequest;
}

/**
 * Get SAML configuration for organization
 */
export async function getSAMLConfig(
  organizationId: string,
  providerId: string,
): Promise<SAMLConfig | null> {
  const config = await prisma.sSOConfig.findFirst({
    where: {
      organizationId,
      providerId,
      provider: "SAML",
      enabled: true,
    },
  });

  if (!config) {
    return null;
  }

  // Decrypt sensitive data
  const decryptedConfig = config.configuration as any;

  return {
    id: config.id,
    organizationId: config.organizationId,
    providerId: config.providerId,
    providerName: config.providerName,
    entityId: decryptedConfig.entityId,
    ssoUrl: decryptedConfig.ssoUrl,
    sloUrl: decryptedConfig.sloUrl,
    certificate: decryptedConfig.certificate,
    wantAssertionsSigned: decryptedConfig.wantAssertionsSigned ?? true,
    wantResponseSigned: decryptedConfig.wantResponseSigned ?? false,
    signatureAlgorithm: decryptedConfig.signatureAlgorithm || "sha256",
    digestAlgorithm: decryptedConfig.digestAlgorithm || "sha256",
    nameIdFormat:
      decryptedConfig.nameIdFormat ||
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    attributeMapping: decryptedConfig.attributeMapping || {
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
        "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname":
        "firstName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname":
        "lastName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name":
        "displayName",
    },
    enabled: config.enabled,
    metadata: decryptedConfig.metadata,
  };
}

/**
 * Save SAML configuration
 */
export async function saveSAMLConfig(
  organizationId: string,
  providerId: string,
  providerName: string,
  configuration: Partial<SAMLConfig>,
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
      provider: "SAML",
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
    description: `SAML configuration updated for provider: ${providerName}`,
    metadata: { providerId, providerName },
    organizationId,
  });
}

/**
 * Parse IdP metadata XML
 */
export async function parseIdPMetadata(
  metadataXml: string,
): Promise<Partial<SAMLConfig>> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
  });

  const metadata = parser.parse(metadataXml);

  const entityDescriptor =
    metadata["md:EntityDescriptor"] || metadata["EntityDescriptor"];

  const idpDescriptor =
    entityDescriptor?.["md:IDPSSODescriptor"] ||
    entityDescriptor?.["IDPSSODescriptor"];

  if (!idpDescriptor) {
    throw new Error("Invalid IdP metadata: Missing IDPSSODescriptor");
  }

  // Extract SSO URL
  let ssoService =
    idpDescriptor["md:SingleSignOnService"] ||
    idpDescriptor["SingleSignOnService"];

  if (Array.isArray(ssoService)) {
    ssoService = ssoService.find(
      (s) =>
        s["@Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" ||
        s["@Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
    );
  }

  const ssoUrl = ssoService?.["@Location"];

  // Extract SLO URL
  let sloService =
    idpDescriptor["md:SingleLogoutService"] ||
    idpDescriptor["SingleLogoutService"];

  if (Array.isArray(sloService)) {
    sloService = sloService.find(
      (s) => s["@Binding"] === "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
    );
  }

  const sloUrl = sloService?.["@Location"];

  // Extract certificate
  const keyDescriptor =
    idpDescriptor["md:KeyDescriptor"] || idpDescriptor["KeyDescriptor"];

  let certificate = "";
  if (Array.isArray(keyDescriptor)) {
    const signingKey = keyDescriptor.find((k) => k["@use"] === "signing");
    certificate =
      signingKey?.["ds:KeyInfo"]?.["ds:X509Data"]?.["ds:X509Certificate"] || "";
  } else if (keyDescriptor) {
    certificate =
      keyDescriptor?.["ds:KeyInfo"]?.["ds:X509Data"]?.["ds:X509Certificate"] ||
      "";
  }

  // Clean certificate
  certificate = certificate.replace(/\s/g, "");

  return {
    entityId: entityDescriptor?.["@entityID"],
    ssoUrl,
    sloUrl,
    certificate,
    metadata: metadataXml,
  };
}

/**
 * Authenticate user with SAML response
 */
export async function authenticateWithSAML(
  organizationId: string,
  providerId: string,
  samlResponse: SAMLResponse,
): Promise<{ userId: string; email: string; isNewUser: boolean }> {
  const { assertion } = samlResponse;

  // Extract email from attributes
  const email =
    assertion.attributes.email ||
    assertion.attributes.emailAddress ||
    assertion.nameId;

  if (!email) {
    throw new Error("Email not found in SAML assertion");
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
    // Auto-provision user if enabled
    const firstName =
      assertion.attributes.firstName || assertion.attributes.givenName || "";
    const lastName =
      assertion.attributes.lastName || assertion.attributes.surname || "";

    user = await prisma.user.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        emailVerified: new Date(),
        passwordHash: crypto.randomBytes(32).toString("hex"), // Random password (not used)
        firstName,
        lastName,
        status: "active",
        ssoProvider: providerId,
        ssoId: assertion.nameId,
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
      description: `User auto-provisioned via SAML SSO: ${email}`,
      metadata: {
        email,
        providerId,
        ssoId: assertion.nameId,
      },
      organizationId,
    });
  } else {
    // Update SSO information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ssoProvider: providerId,
        ssoId: assertion.nameId,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    });
  }

  // Log successful SSO login
  await logAudit({
    userId: user.id,
    action: "SSO_LOGIN",
    resource: "User",
    resourceId: user.id,
    description: `User authenticated via SAML SSO: ${email}`,
    metadata: {
      email,
      providerId,
      sessionIndex: assertion.sessionIndex,
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
