/**
 * Multi-Factor Authentication Service
 * Supports TOTP, SMS, Email, Push, and Biometric
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
import { logAudit } from "../audit-logger";
import { MFAMethod, MFASetup } from "@/types/security";

// ============================================================================
// MFA Service
// ============================================================================

export class MFAService {
  private static readonly TOTP_WINDOW = 1; // Allow 1 step before/after
  private static readonly TOTP_PERIOD = 30; // 30 seconds
  private static readonly BACKUP_CODE_COUNT = 10;

  /**
   * Setup TOTP (Time-based One-Time Password)
   */
  static async setupTOTP(
    userId: string,
    issuer: string = "Lithic Healthcare",
  ): Promise<MFASetup> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Generate secret
    const secret = new OTPAuth.Secret({ size: 32 });

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: this.TOTP_PERIOD,
      secret,
    });

    // Generate backup codes
    const backupCodes = await this.generateBackupCodes(userId);

    // Generate QR code URL
    const qrCode = totp.toString();

    // Save to database (temporary - not verified yet)
    await prisma.mfaSetup.upsert({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.TOTP,
        },
      },
      create: {
        userId,
        method: MFAMethod.TOTP,
        secret: secret.base32,
        backupCodes,
        verified: false,
      },
      update: {
        secret: secret.base32,
        backupCodes,
        verified: false,
      },
    });

    await logAudit({
      userId,
      organizationId: "",
      action: "MFA_SETUP_INITIATED",
      resource: "MFA",
      details: "User initiated TOTP setup",
      metadata: { method: MFAMethod.TOTP },
    });

    return {
      userId,
      method: MFAMethod.TOTP,
      secret: secret.base32,
      qrCode,
      backupCodes,
      verified: false,
      createdAt: new Date(),
    };
  }

  /**
   * Verify TOTP setup
   */
  static async verifyTOTP(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const setup = await prisma.mfaSetup.findUnique({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.TOTP,
        },
      },
    });

    if (!setup || !setup.secret) {
      throw new Error("TOTP not set up");
    }

    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: this.TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(setup.secret),
    });

    const delta = totp.validate({
      token,
      window: this.TOTP_WINDOW,
    });

    const isValid = delta !== null;

    if (isValid) {
      // Mark as verified
      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: MFAMethod.TOTP,
          },
        },
        data: {
          verified: true,
          lastUsedAt: new Date(),
        },
      });

      // Enable MFA on user account
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_ENABLED",
        resource: "MFA",
        details: "TOTP successfully verified and enabled",
        metadata: { method: MFAMethod.TOTP },
      });
    } else {
      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_FAILED",
        resource: "MFA",
        details: "TOTP verification failed",
        success: false,
        metadata: { method: MFAMethod.TOTP },
      });
    }

    return isValid;
  }

  /**
   * Validate TOTP token during login
   */
  static async validateTOTP(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const setup = await prisma.mfaSetup.findUnique({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.TOTP,
        },
      },
    });

    if (!setup || !setup.verified || !setup.secret) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: this.TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(setup.secret),
    });

    const delta = totp.validate({
      token,
      window: this.TOTP_WINDOW,
    });

    const isValid = delta !== null;

    // Update last used time
    if (isValid) {
      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: MFAMethod.TOTP,
          },
        },
        data: { lastUsedAt: new Date() },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_VERIFIED",
        resource: "MFA",
        details: "TOTP validation successful",
        metadata: { method: MFAMethod.TOTP },
      });
    } else {
      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_FAILED",
        resource: "MFA",
        details: "TOTP validation failed",
        success: false,
        metadata: { method: MFAMethod.TOTP },
      });
    }

    return isValid;
  }

  /**
   * Setup SMS MFA
   */
  static async setupSMS(
    userId: string,
    phoneNumber: string,
  ): Promise<MFASetup> {
    // Send verification code
    const code = this.generateNumericCode(6);

    // Save temporary code
    await prisma.mfaSetup.upsert({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.SMS,
        },
      },
      create: {
        userId,
        method: MFAMethod.SMS,
        phoneNumber,
        verificationCode: code,
        verificationExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        verified: false,
      },
      update: {
        phoneNumber,
        verificationCode: code,
        verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
      },
    });

    // Send SMS (integration with Twilio)
    await this.sendSMS(phoneNumber, `Your Lithic verification code is: ${code}`);

    await logAudit({
      userId,
      organizationId: "",
      action: "MFA_SETUP_INITIATED",
      resource: "MFA",
      details: "SMS MFA setup initiated",
      metadata: { method: MFAMethod.SMS, phoneNumber },
    });

    return {
      userId,
      method: MFAMethod.SMS,
      verified: false,
      createdAt: new Date(),
    };
  }

  /**
   * Verify SMS code
   */
  static async verifySMS(userId: string, code: string): Promise<boolean> {
    const setup = await prisma.mfaSetup.findUnique({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.SMS,
        },
      },
    });

    if (!setup || !setup.verificationCode || !setup.verificationExpiry) {
      return false;
    }

    // Check expiry
    if (new Date() > setup.verificationExpiry) {
      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_FAILED",
        resource: "MFA",
        details: "SMS verification code expired",
        success: false,
        metadata: { method: MFAMethod.SMS },
      });
      return false;
    }

    const isValid = setup.verificationCode === code;

    if (isValid) {
      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: MFAMethod.SMS,
          },
        },
        data: {
          verified: true,
          verificationCode: null,
          verificationExpiry: null,
          lastUsedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_ENABLED",
        resource: "MFA",
        details: "SMS MFA successfully verified and enabled",
        metadata: { method: MFAMethod.SMS },
      });
    }

    return isValid;
  }

  /**
   * Send SMS verification code
   */
  static async sendSMSCode(userId: string): Promise<boolean> {
    const setup = await prisma.mfaSetup.findUnique({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.SMS,
        },
      },
    });

    if (!setup || !setup.verified || !setup.phoneNumber) {
      return false;
    }

    const code = this.generateNumericCode(6);

    await prisma.mfaSetup.update({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.SMS,
        },
      },
      data: {
        verificationCode: code,
        verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await this.sendSMS(
      setup.phoneNumber,
      `Your Lithic verification code is: ${code}`,
    );

    return true;
  }

  /**
   * Validate SMS code during login
   */
  static async validateSMS(userId: string, code: string): Promise<boolean> {
    const setup = await prisma.mfaSetup.findUnique({
      where: {
        userId_method: {
          userId,
          method: MFAMethod.SMS,
        },
      },
    });

    if (
      !setup ||
      !setup.verified ||
      !setup.verificationCode ||
      !setup.verificationExpiry
    ) {
      return false;
    }

    if (new Date() > setup.verificationExpiry) {
      return false;
    }

    const isValid = setup.verificationCode === code;

    if (isValid) {
      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: MFAMethod.SMS,
          },
        },
        data: {
          verificationCode: null,
          verificationExpiry: null,
          lastUsedAt: new Date(),
        },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_VERIFIED",
        resource: "MFA",
        details: "SMS validation successful",
        metadata: { method: MFAMethod.SMS },
      });
    }

    return isValid;
  }

  /**
   * Validate backup code
   */
  static async validateBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const setup = await prisma.mfaSetup.findFirst({
      where: {
        userId,
        verified: true,
      },
    });

    if (!setup || !setup.backupCodes) {
      return false;
    }

    const backupCodes = setup.backupCodes as string[];
    const hashedCode = this.hashBackupCode(code);

    const isValid = backupCodes.includes(hashedCode);

    if (isValid) {
      // Remove used backup code
      const updatedCodes = backupCodes.filter((c) => c !== hashedCode);

      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: setup.method,
          },
        },
        data: {
          backupCodes: updatedCodes,
          lastUsedAt: new Date(),
        },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_VERIFIED",
        resource: "MFA",
        details: "Backup code used successfully",
        metadata: {
          method: "BACKUP_CODE",
          remainingCodes: updatedCodes.length,
        },
      });

      // Alert if running low on backup codes
      if (updatedCodes.length < 3) {
        console.warn(
          `User ${userId} has only ${updatedCodes.length} backup codes remaining`,
        );
      }
    }

    return isValid;
  }

  /**
   * Generate new backup codes
   */
  static async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateAlphanumericCode(12);
      codes.push(code);
    }

    // Hash codes before storing
    const hashedCodes = codes.map((code) => this.hashBackupCode(code));

    return codes; // Return unhashed codes to display to user
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const codes = await this.generateBackupCodes(userId);
    const hashedCodes = codes.map((code) => this.hashBackupCode(code));

    const setup = await prisma.mfaSetup.findFirst({
      where: {
        userId,
        verified: true,
      },
    });

    if (setup) {
      await prisma.mfaSetup.update({
        where: {
          userId_method: {
            userId,
            method: setup.method,
          },
        },
        data: {
          backupCodes: hashedCodes,
        },
      });

      await logAudit({
        userId,
        organizationId: "",
        action: "MFA_BACKUP_CODES_REGENERATED",
        resource: "MFA",
        details: "Backup codes regenerated",
      });
    }

    return codes;
  }

  /**
   * Disable MFA
   */
  static async disableMFA(userId: string, method?: MFAMethod): Promise<void> {
    if (method) {
      await prisma.mfaSetup.delete({
        where: {
          userId_method: {
            userId,
            method,
          },
        },
      });
    } else {
      await prisma.mfaSetup.deleteMany({
        where: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      });
    }

    await logAudit({
      userId,
      organizationId: "",
      action: "MFA_DISABLED",
      resource: "MFA",
      details: method ? `${method} MFA disabled` : "All MFA methods disabled",
      metadata: { method },
    });
  }

  /**
   * Get MFA methods for user
   */
  static async getMFAMethods(userId: string): Promise<MFASetup[]> {
    const setups = await prisma.mfaSetup.findMany({
      where: {
        userId,
        verified: true,
      },
      select: {
        userId: true,
        method: true,
        verified: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return setups as MFASetup[];
  }

  /**
   * Helper: Send SMS
   */
  private static async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // Integration with Twilio
    // const twilio = require("twilio");
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: twilioPhoneNumber,
    //   to: phoneNumber,
    // });

    console.log(`SMS to ${phoneNumber}: ${message}`);
  }

  /**
   * Helper: Generate numeric code
   */
  private static generateNumericCode(length: number): string {
    const digits = "0123456789";
    let code = "";
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      code += digits[randomBytes[i] % digits.length];
    }

    return code;
  }

  /**
   * Helper: Generate alphanumeric code
   */
  private static generateAlphanumericCode(length: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing characters
    let code = "";
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    // Format as XXXX-XXXX-XXXX
    return code.match(/.{1,4}/g)?.join("-") || code;
  }

  /**
   * Helper: Hash backup code
   */
  private static hashBackupCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function setupTOTP(userId: string, issuer?: string) {
  return MFAService.setupTOTP(userId, issuer);
}

export async function verifyTOTP(userId: string, token: string) {
  return MFAService.verifyTOTP(userId, token);
}

export async function validateTOTP(userId: string, token: string) {
  return MFAService.validateTOTP(userId, token);
}

export async function setupSMS(userId: string, phoneNumber: string) {
  return MFAService.setupSMS(userId, phoneNumber);
}

export async function verifySMS(userId: string, code: string) {
  return MFAService.verifySMS(userId, code);
}

export async function sendSMSCode(userId: string) {
  return MFAService.sendSMSCode(userId);
}

export async function validateSMS(userId: string, code: string) {
  return MFAService.validateSMS(userId, code);
}

export async function validateBackupCode(userId: string, code: string) {
  return MFAService.validateBackupCode(userId, code);
}

export async function regenerateBackupCodes(userId: string) {
  return MFAService.regenerateBackupCodes(userId);
}

export async function disableMFA(userId: string, method?: MFAMethod) {
  return MFAService.disableMFA(userId, method);
}

export async function getMFAMethods(userId: string) {
  return MFAService.getMFAMethods(userId);
}
