/**
 * SAML 2.0 Single Sign-On Implementation
 * Enterprise identity federation via SAML
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { logAudit } from "../audit-logger";
import { SAMLConfig, SAMLAttributeMapping } from "@/types/security";

// ============================================================================
// SAML Service
// ============================================================================

export class SAMLService {
  /**
   * Initialize SAML authentication request
   */
  static async initiateLogin(
    organizationId: string,
    relayState?: string,
  ): Promise<{
    url: string;
    samlRequest: string;
  }> {
    const config = await this.getConfig(organizationId);

    if (!config.enabled) {
      throw new Error("SAML SSO is not enabled for this organization");
    }

    // Generate SAML request
    const requestId = this.generateID();
    const timestamp = new Date().toISOString();

    const samlRequest = this.buildAuthnRequest({
      id: requestId,
      timestamp,
      entityId: config.entityId,
      acsUrl: `${process.env.NEXT_PUBLIC_URL}/api/auth/saml/callback`,
      destination: config.ssoUrl,
    });

    // Encode request
    const encodedRequest = this.encodeRequest(samlRequest);

    // Build redirect URL
    const url = `${config.ssoUrl}?SAMLRequest=${encodedRequest}${relayState ? `&RelayState=${encodeURIComponent(relayState)}` : ""}`;

    // Store request for validation
    await prisma.samlRequest.create({
      data: {
        requestId,
        organizationId,
        request: samlRequest,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    await logAudit({
      userId: "SYSTEM",
      organizationId,
      action: "SAML_LOGIN_INITIATED",
      resource: "SAML",
      details: "SAML authentication request initiated",
      metadata: { requestId },
    });

    return { url, samlRequest: encodedRequest };
  }

  /**
   * Process SAML response
   */
  static async processResponse(
    samlResponse: string,
    relayState?: string,
  ): Promise<{
    success: boolean;
    user?: any;
    errors?: string[];
  }> {
    try {
      // Decode response
      const decodedResponse = this.decodeResponse(samlResponse);

      // Parse XML
      const response = this.parseResponse(decodedResponse);

      // Get organization config
      const config = await this.getConfigByEntityId(response.issuer);

      if (!config) {
        return {
          success: false,
          errors: ["Unknown SAML issuer"],
        };
      }

      // Validate response
      const validation = await this.validateResponse(response, config);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Extract user attributes
      const attributes = this.extractAttributes(
        response.attributes,
        config.attributeMapping,
      );

      // Find or create user
      const user = await this.provisionUser(
        attributes,
        config.organizationId,
      );

      await logAudit({
        userId: user.id,
        organizationId: config.organizationId,
        action: "SAML_LOGIN_SUCCESS",
        resource: "SAML",
        details: "SAML authentication successful",
        metadata: {
          issuer: response.issuer,
          attributes,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error("SAML response processing error:", error);

      await logAudit({
        userId: "SYSTEM",
        organizationId: "",
        action: "SAML_LOGIN_FAILED",
        resource: "SAML",
        details: "SAML authentication failed",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Build SAML authentication request
   */
  private static buildAuthnRequest(params: {
    id: string;
    timestamp: string;
    entityId: string;
    acsUrl: string;
    destination: string;
  }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${params.id}"
                    Version="2.0"
                    IssueInstant="${params.timestamp}"
                    Destination="${params.destination}"
                    AssertionConsumerServiceURL="${params.acsUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${params.entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
</samlp:AuthnRequest>`;
  }

  /**
   * Parse SAML response
   */
  private static parseResponse(xml: string): {
    id: string;
    issuer: string;
    inResponseTo?: string;
    status: string;
    attributes: Record<string, string>;
    nameId?: string;
    notBefore?: Date;
    notOnOrAfter?: Date;
    signature?: string;
  } {
    // This is a simplified parser. Production should use a proper XML library
    // like xml2js or xmldom with xpath

    const response: any = {
      attributes: {},
    };

    // Extract ID
    const idMatch = xml.match(/ID="([^"]+)"/);
    response.id = idMatch?.[1] || "";

    // Extract Issuer
    const issuerMatch = xml.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/);
    response.issuer = issuerMatch?.[1] || "";

    // Extract Status
    const statusMatch = xml.match(
      /<samlp:StatusCode[^>]+Value="([^"]+)"/,
    );
    response.status = statusMatch?.[1] || "";

    // Extract NameID
    const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
    response.nameId = nameIdMatch?.[1];

    // Extract attributes
    const attributeRegex =
      /<saml:Attribute[^>]+Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;
    let match;

    while ((match = attributeRegex.exec(xml)) !== null) {
      response.attributes[match[1]] = match[2];
    }

    return response;
  }

  /**
   * Validate SAML response
   */
  private static async validateResponse(
    response: any,
    config: SAMLConfig,
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check status
    if (
      response.status !==
      "urn:oasis:names:tc:SAML:2.0:status:Success"
    ) {
      errors.push(`SAML authentication failed with status: ${response.status}`);
    }

    // Verify issuer
    if (config.entityId && response.issuer !== config.entityId) {
      errors.push("SAML issuer mismatch");
    }

    // Verify signature if required
    if (config.wantAssertionsSigned || config.wantResponsesSigned) {
      const signatureValid = this.verifySignature(
        response,
        config.certificate,
      );
      if (!signatureValid) {
        errors.push("Invalid SAML signature");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify SAML signature
   */
  private static verifySignature(response: any, certificate: string): boolean {
    // Production implementation would use proper XML signature verification
    // This is a placeholder
    return true;
  }

  /**
   * Extract and map user attributes
   */
  private static extractAttributes(
    samlAttributes: Record<string, string>,
    mapping: SAMLAttributeMapping,
  ): {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string[];
    roles?: string[];
    department?: string;
  } {
    const attributes: any = {
      email: samlAttributes[mapping.email],
      firstName: samlAttributes[mapping.firstName],
      lastName: samlAttributes[mapping.lastName],
    };

    if (mapping.groups) {
      const groupsValue = samlAttributes[mapping.groups];
      attributes.groups = groupsValue
        ? groupsValue.split(",").map((g) => g.trim())
        : [];
    }

    if (mapping.roles) {
      const rolesValue = samlAttributes[mapping.roles];
      attributes.roles = rolesValue
        ? rolesValue.split(",").map((r) => r.trim())
        : [];
    }

    if (mapping.department) {
      attributes.department = samlAttributes[mapping.department];
    }

    return attributes;
  }

  /**
   * Provision or update user from SAML attributes
   */
  private static async provisionUser(
    attributes: any,
    organizationId: string,
  ): Promise<any> {
    // Find existing user
    let user = await prisma.user.findUnique({
      where: { email: attributes.email },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: attributes.firstName,
          lastName: attributes.lastName,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: attributes.email,
          firstName: attributes.firstName,
          lastName: attributes.lastName,
          organizationId,
          status: "ACTIVE",
          passwordHash: "", // SSO users don't need password
          mfaEnabled: false,
          createdBy: "SAML_PROVISIONING",
          updatedBy: "SAML_PROVISIONING",
        },
      });

      await logAudit({
        userId: user.id,
        organizationId,
        action: "USER_PROVISIONED",
        resource: "User",
        details: "User auto-provisioned via SAML",
        metadata: { attributes },
      });
    }

    return user;
  }

  /**
   * Get SAML configuration for organization
   */
  private static async getConfig(
    organizationId: string,
  ): Promise<SAMLConfig> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as any;
    return settings?.saml || this.getDefaultConfig();
  }

  /**
   * Get SAML configuration by entity ID
   */
  private static async getConfigByEntityId(
    entityId: string,
  ): Promise<(SAMLConfig & { organizationId: string }) | null> {
    // This would query all organizations and find matching entity ID
    // Simplified for now
    return null;
  }

  /**
   * Get default SAML configuration
   */
  private static getDefaultConfig(): SAMLConfig {
    return {
      enabled: false,
      entityId: "",
      ssoUrl: "",
      sloUrl: "",
      certificate: "",
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
      attributeMapping: {
        email: "email",
        firstName: "firstName",
        lastName: "lastName",
      },
      allowUnsolicitedResponse: false,
      wantAssertionsSigned: true,
      wantResponsesSigned: true,
    };
  }

  /**
   * Helper: Generate unique ID
   */
  private static generateID(): string {
    return `_${crypto.randomBytes(21).toString("hex")}`;
  }

  /**
   * Helper: Encode SAML request
   */
  private static encodeRequest(xml: string): string {
    // Deflate and base64 encode
    return Buffer.from(xml).toString("base64");
  }

  /**
   * Helper: Decode SAML response
   */
  private static decodeResponse(encoded: string): string {
    // Base64 decode
    return Buffer.from(encoded, "base64").toString("utf-8");
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function initiateSAMLLogin(
  organizationId: string,
  relayState?: string,
) {
  return SAMLService.initiateLogin(organizationId, relayState);
}

export async function processSAMLResponse(
  samlResponse: string,
  relayState?: string,
) {
  return SAMLService.processResponse(samlResponse, relayState);
}
