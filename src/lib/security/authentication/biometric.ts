/**
 * Biometric Authentication Service
 * Supports fingerprint, face, iris, and voice authentication
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";
import { logAudit } from "../audit-logger";
import { BiometricType, BiometricData } from "@/types/security";

// ============================================================================
// Biometric Service
// ============================================================================

export class BiometricService {
  /**
   * Enroll biometric template
   */
  static async enrollBiometric(params: {
    userId: string;
    deviceId: string;
    type: BiometricType;
    template: string; // Biometric template data
    quality: number; // Quality score 0-100
  }): Promise<BiometricData> {
    // Encrypt the biometric template
    const encryptedTemplate = encrypt(params.template);

    const biometric = await prisma.biometricData.create({
      data: {
        userId: params.userId,
        deviceId: params.deviceId,
        type: params.type,
        template: encryptedTemplate,
        quality: params.quality,
        verified: false,
        enrolledAt: new Date(),
      },
    });

    await logAudit({
      userId: params.userId,
      organizationId: "",
      action: "BIOMETRIC_ENROLLED",
      resource: "Biometric",
      details: `${params.type} biometric enrolled`,
      metadata: {
        type: params.type,
        deviceId: params.deviceId,
        quality: params.quality,
      },
    });

    return biometric as BiometricData;
  }

  /**
   * Verify biometric template (during enrollment)
   */
  static async verifyEnrollment(
    biometricId: string,
    template: string,
  ): Promise<boolean> {
    const biometric = await prisma.biometricData.findUnique({
      where: { id: biometricId },
    });

    if (!biometric) {
      return false;
    }

    // Decrypt stored template
    const storedTemplate = decrypt(biometric.template);

    // Compare templates (would use specialized biometric matching algorithm)
    const matchScore = this.compareTemplates(storedTemplate, template);

    const isValid = matchScore >= 0.85; // 85% match threshold

    if (isValid) {
      await prisma.biometricData.update({
        where: { id: biometricId },
        data: { verified: true },
      });

      await logAudit({
        userId: biometric.userId,
        organizationId: "",
        action: "BIOMETRIC_VERIFIED",
        resource: "Biometric",
        details: "Biometric enrollment verified",
        metadata: {
          type: biometric.type,
          matchScore,
        },
      });
    }

    return isValid;
  }

  /**
   * Authenticate using biometric
   */
  static async authenticate(params: {
    userId: string;
    deviceId: string;
    type: BiometricType;
    template: string;
  }): Promise<{
    success: boolean;
    matchScore?: number;
    biometricId?: string;
  }> {
    const biometrics = await prisma.biometricData.findMany({
      where: {
        userId: params.userId,
        deviceId: params.deviceId,
        type: params.type,
        verified: true,
      },
    });

    if (biometrics.length === 0) {
      await logAudit({
        userId: params.userId,
        organizationId: "",
        action: "BIOMETRIC_AUTH_FAILED",
        resource: "Biometric",
        details: "No verified biometric found",
        success: false,
        metadata: { type: params.type },
      });
      return { success: false };
    }

    // Try to match against all enrolled biometrics
    for (const biometric of biometrics) {
      const storedTemplate = decrypt(biometric.template);
      const matchScore = this.compareTemplates(storedTemplate, params.template);

      if (matchScore >= 0.85) {
        // Update last used timestamp
        await prisma.biometricData.update({
          where: { id: biometric.id },
          data: { lastUsedAt: new Date() },
        });

        await logAudit({
          userId: params.userId,
          organizationId: "",
          action: "BIOMETRIC_AUTH_SUCCESS",
          resource: "Biometric",
          details: `${params.type} authentication successful`,
          metadata: {
            type: params.type,
            deviceId: params.deviceId,
            matchScore,
          },
        });

        return {
          success: true,
          matchScore,
          biometricId: biometric.id,
        };
      }
    }

    await logAudit({
      userId: params.userId,
      organizationId: "",
      action: "BIOMETRIC_AUTH_FAILED",
      resource: "Biometric",
      details: "Biometric template did not match",
      success: false,
      metadata: { type: params.type },
    });

    return { success: false };
  }

  /**
   * Revoke biometric
   */
  static async revokeBiometric(
    biometricId: string,
    revokedBy: string,
  ): Promise<void> {
    const biometric = await prisma.biometricData.delete({
      where: { id: biometricId },
    });

    await logAudit({
      userId: biometric.userId,
      organizationId: "",
      action: "BIOMETRIC_REVOKED",
      resource: "Biometric",
      details: "Biometric authentication revoked",
      metadata: {
        type: biometric.type,
        revokedBy,
      },
    });
  }

  /**
   * Get user biometrics
   */
  static async getUserBiometrics(userId: string): Promise<BiometricData[]> {
    const biometrics = await prisma.biometricData.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        quality: true,
        enrolledAt: true,
        lastUsedAt: true,
        deviceId: true,
        verified: true,
      },
    });

    return biometrics as unknown as BiometricData[];
  }

  /**
   * Compare biometric templates
   * This is a simplified version - production would use specialized algorithms
   */
  private static compareTemplates(
    template1: string,
    template2: string,
  ): number {
    // In production, this would use:
    // - Fingerprint: Minutiae matching algorithms
    // - Face: Deep learning-based face recognition
    // - Iris: Daugman's algorithm
    // - Voice: Speaker verification algorithms

    // Simplified comparison using Hamming distance
    if (template1.length !== template2.length) {
      return 0;
    }

    let matches = 0;
    for (let i = 0; i < template1.length; i++) {
      if (template1[i] === template2[i]) {
        matches++;
      }
    }

    return matches / template1.length;
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(params: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    plugins?: string[];
  }): string {
    const data = JSON.stringify(params);
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function enrollBiometric(params: {
  userId: string;
  deviceId: string;
  type: BiometricType;
  template: string;
  quality: number;
}) {
  return BiometricService.enrollBiometric(params);
}

export async function verifyBiometricEnrollment(
  biometricId: string,
  template: string,
) {
  return BiometricService.verifyEnrollment(biometricId, template);
}

export async function authenticateWithBiometric(params: {
  userId: string;
  deviceId: string;
  type: BiometricType;
  template: string;
}) {
  return BiometricService.authenticate(params);
}

export async function revokeBiometric(biometricId: string, revokedBy: string) {
  return BiometricService.revokeBiometric(biometricId, revokedBy);
}

export async function getUserBiometrics(userId: string) {
  return BiometricService.getUserBiometrics(userId);
}

export function generateDeviceFingerprint(params: {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  plugins?: string[];
}) {
  return BiometricService.generateDeviceFingerprint(params);
}
