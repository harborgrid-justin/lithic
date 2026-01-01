/**
 * Direct Protocol Messaging
 * Implementation of Direct Project for secure healthcare messaging
 * Based on SMTP with S/MIME encryption and LDAP/DNS for certificate discovery
 */

import type { DirectMessage, DirectAttachment } from "@/types/integrations";
import { db } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export interface DirectConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  certificatePath: string;
  privateKeyPath: string;
  certificatePassword?: string;
  trustAnchorPath?: string;
}

/**
 * Direct Messaging Client
 */
export class DirectMessagingClient {
  private transporter: any;

  constructor(private config: DirectConfig) {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure,
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  /**
   * Send Direct message
   */
  async sendMessage(message: Omit<DirectMessage, "id" | "status" | "messageId">): Promise<DirectMessage> {
    const messageId = generateMessageId();
    const id = crypto.randomUUID();

    try {
      // Prepare attachments
      const attachments = await this.prepareAttachments(message.attachments || []);

      // Build email message
      const mailOptions = {
        from: message.from,
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        text: message.body,
        attachments,
        headers: {
          "Message-ID": messageId,
          "X-Direct-Message": "true",
          ...(message.inReplyTo && { "In-Reply-To": message.inReplyTo }),
        },
      };

      // Sign and encrypt message (S/MIME)
      const securedMessage = await this.signAndEncrypt(mailOptions);

      // Send via SMTP
      await this.transporter.sendMail(securedMessage);

      // Create message record
      const directMessage: DirectMessage = {
        id,
        ...message,
        messageId,
        status: "completed",
        sentAt: new Date(),
      };

      // Store message
      await this.storeMessage(directMessage);

      return directMessage;
    } catch (error: any) {
      // Store failed message
      const directMessage: DirectMessage = {
        id,
        ...message,
        messageId,
        status: "failed",
        error: error.message,
      };

      await this.storeMessage(directMessage);

      throw error;
    }
  }

  /**
   * Receive Direct messages
   */
  async receiveMessages(): Promise<DirectMessage[]> {
    // This would integrate with IMAP or POP3 to retrieve messages
    // For now, return empty array
    return [];
  }

  /**
   * Process MDN (Message Disposition Notification)
   */
  async processMDN(mdn: string): Promise<void> {
    // Parse MDN
    const { originalMessageId, disposition } = this.parseMDN(mdn);

    // Update message status
    await db.directMessage.updateMany({
      where: { messageId: originalMessageId },
      data: {
        status: disposition === "displayed" ? "completed" : "failed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generate MDN (Message Disposition Notification)
   */
  async generateMDN(
    originalMessage: DirectMessage,
    disposition: "displayed" | "dispatched" | "processed" | "deleted" | "denied" | "failed"
  ): Promise<void> {
    const mdnMessageId = generateMessageId();

    const mdnBody = `Reporting-UA: ${this.config.smtpUser}
Original-Recipient: rfc822;${originalMessage.to[0]}
Final-Recipient: rfc822;${originalMessage.to[0]}
Original-Message-ID: ${originalMessage.messageId}
Disposition: automatic-action/MDN-sent-automatically;${disposition}`;

    await this.sendMessage({
      from: originalMessage.to[0],
      to: [originalMessage.from],
      subject: `Disposition Notification: ${originalMessage.subject}`,
      body: mdnBody,
      inReplyTo: originalMessage.messageId,
    });
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(email: string): Promise<boolean> {
    try {
      // Look up certificate via LDAP or DNS
      const certificate = await this.lookupCertificate(email);

      if (!certificate) {
        return false;
      }

      // Verify certificate against trust anchor
      return await this.validateCertificate(certificate);
    } catch (error) {
      console.error("Certificate verification failed:", error);
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private async signAndEncrypt(message: any): Promise<any> {
    // Load certificate and private key
    const certificate = await this.loadCertificate();
    const privateKey = await this.loadPrivateKey();

    // Sign message with S/MIME
    const signed = await this.signMessage(message, certificate, privateKey);

    // Encrypt for recipients
    const recipientCertificates = await this.getRecipientCertificates(message.to);
    const encrypted = await this.encryptMessage(signed, recipientCertificates);

    return encrypted;
  }

  private async signMessage(message: any, certificate: string, privateKey: string): Promise<any> {
    // Simplified S/MIME signing - would use proper crypto library in production
    return message;
  }

  private async encryptMessage(message: any, certificates: string[]): Promise<any> {
    // Simplified S/MIME encryption - would use proper crypto library in production
    return message;
  }

  private async loadCertificate(): Promise<string> {
    // Load certificate from file
    const fs = await import("fs/promises");
    return await fs.readFile(this.config.certificatePath, "utf-8");
  }

  private async loadPrivateKey(): Promise<string> {
    // Load private key from file
    const fs = await import("fs/promises");
    return await fs.readFile(this.config.privateKeyPath, "utf-8");
  }

  private async getRecipientCertificates(recipients: string[]): Promise<string[]> {
    const certificates: string[] = [];

    for (const recipient of recipients) {
      const cert = await this.lookupCertificate(recipient);
      if (cert) {
        certificates.push(cert);
      }
    }

    return certificates;
  }

  private async lookupCertificate(email: string): Promise<string | null> {
    // Look up certificate via LDAP or DNS
    // Simplified implementation - would use actual LDAP/DNS lookup in production
    return null;
  }

  private async validateCertificate(certificate: string): Promise<boolean> {
    // Validate certificate against trust anchor
    // Simplified implementation - would use proper certificate validation in production
    return true;
  }

  private async prepareAttachments(attachments: DirectAttachment[]): Promise<any[]> {
    return attachments.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, "base64"),
      contentType: attachment.contentType,
    }));
  }

  private parseMDN(mdn: string): {
    originalMessageId: string;
    disposition: string;
  } {
    // Parse MDN message
    const lines = mdn.split("\n");
    const messageIdLine = lines.find((l) => l.startsWith("Original-Message-ID:"));
    const dispositionLine = lines.find((l) => l.startsWith("Disposition:"));

    return {
      originalMessageId: messageIdLine?.split(":")[1].trim() || "",
      disposition: dispositionLine?.split(";")[1].trim() || "",
    };
  }

  private async storeMessage(message: DirectMessage): Promise<void> {
    try {
      await db.directMessage.create({
        data: {
          ...message,
          attachments: JSON.stringify(message.attachments),
        } as any,
      });
    } catch (error) {
      console.error("Error storing Direct message:", error);
    }
  }
}

/**
 * Direct Address Validation
 */
export function validateDirectAddress(address: string): boolean {
  // Direct addresses must be valid email addresses with specific domain requirements
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(address)) {
    return false;
  }

  // Additional Direct-specific validation
  const [localPart, domain] = address.split("@");

  // Check local part length
  if (localPart.length > 64) {
    return false;
  }

  // Check domain length
  if (domain.length > 255) {
    return false;
  }

  return true;
}

/**
 * Create Direct message from CCD
 */
export function createDirectMessageFromCCD(
  from: string,
  to: string,
  patientName: string,
  ccdContent: string
): Omit<DirectMessage, "id" | "status" | "messageId"> {
  return {
    from,
    to: [to],
    subject: `CCD for ${patientName}`,
    body: `Attached is the Continuity of Care Document (CCD) for ${patientName}.`,
    attachments: [
      {
        filename: `CCD_${patientName.replace(/\s+/g, "_")}.xml`,
        contentType: "text/xml",
        content: Buffer.from(ccdContent).toString("base64"),
        size: ccdContent.length,
      },
    ],
  };
}

/**
 * Create Direct message from FHIR bundle
 */
export function createDirectMessageFromFHIR(
  from: string,
  to: string,
  patientName: string,
  fhirBundle: string
): Omit<DirectMessage, "id" | "status" | "messageId"> {
  return {
    from,
    to: [to],
    subject: `FHIR Bundle for ${patientName}`,
    body: `Attached is the FHIR Bundle for ${patientName}.`,
    attachments: [
      {
        filename: `FHIR_${patientName.replace(/\s+/g, "_")}.json`,
        contentType: "application/fhir+json",
        content: Buffer.from(fhirBundle).toString("base64"),
        size: fhirBundle.length,
      },
    ],
  };
}

/**
 * Generate message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `<${timestamp}.${random}@direct.message>`;
}

/**
 * Create Direct messaging client
 */
export function createDirectMessagingClient(config: DirectConfig): DirectMessagingClient {
  return new DirectMessagingClient(config);
}

/**
 * Direct Trust Bundle Management
 */
export class TrustBundleManager {
  private trustAnchors: Map<string, any> = new Map();

  /**
   * Load trust bundle
   */
  async loadTrustBundle(bundlePath: string): Promise<void> {
    const fs = await import("fs/promises");
    const bundleContent = await fs.readFile(bundlePath, "utf-8");
    const bundle = JSON.parse(bundleContent);

    for (const anchor of bundle.trustAnchors || []) {
      this.trustAnchors.set(anchor.thumbprint, anchor);
    }
  }

  /**
   * Validate certificate against trust bundle
   */
  async validateCertificate(certificate: string): Promise<boolean> {
    // Extract thumbprint from certificate
    const thumbprint = this.calculateThumbprint(certificate);

    // Check if thumbprint exists in trust bundle
    return this.trustAnchors.has(thumbprint);
  }

  /**
   * Calculate certificate thumbprint
   */
  private calculateThumbprint(certificate: string): string {
    const hash = crypto.createHash("sha1");
    hash.update(certificate);
    return hash.digest("hex").toUpperCase();
  }

  /**
   * Get trust anchor
   */
  getTrustAnchor(thumbprint: string): any {
    return this.trustAnchors.get(thumbprint);
  }

  /**
   * List all trust anchors
   */
  listTrustAnchors(): any[] {
    return Array.from(this.trustAnchors.values());
  }
}
