import * as OTPAuth from "otpauth";
import { prisma } from "./db";
import { encrypt, decrypt, generateSecureString } from "./encryption";
import { logAudit } from "./audit";

/**
 * Generate TOTP secret for a user
 */
export async function generateMFASecret(userId: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate TOTP secret
  const totp = new OTPAuth.TOTP({
    issuer: "Lithic",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const secret = totp.secret.base32;

  // Generate QR code URL
  const qrCode = totp.toString();

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    generateSecureString(8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),
  );

  // Encrypt and store secret and backup codes
  const encryptedSecret = encrypt(secret);
  const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaSecret: encryptedSecret,
      mfaBackupCodes: encryptedBackupCodes,
    },
  });

  return {
    secret,
    qrCode,
    backupCodes,
  };
}

/**
 * Enable MFA for a user
 */
export async function enableMFA(
  userId: string,
  verificationCode: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaEnabled: true, organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.mfaEnabled) {
    throw new Error("MFA is already enabled");
  }

  if (!user.mfaSecret) {
    throw new Error("MFA secret not generated. Call generateMFASecret first.");
  }

  // Verify the code
  const isValid = await verifyTOTP(userId, verificationCode);

  if (!isValid) {
    throw new Error("Invalid verification code");
  }

  // Enable MFA
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });

  // Log MFA enabled
  await logAudit({
    userId,
    action: "MFA_ENABLED",
    resource: "User",
    resourceId: userId,
    description: "User enabled multi-factor authentication",
    organizationId: user.organizationId,
  });

  return true;
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(
  userId: string,
  verificationCode?: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.mfaEnabled) {
    throw new Error("MFA is not enabled");
  }

  // If verification code is provided, verify it
  if (verificationCode) {
    const isValid = await verifyTOTP(userId, verificationCode);
    if (!isValid) {
      throw new Error("Invalid verification code");
    }
  }

  // Disable MFA and clear secrets
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  });

  // Log MFA disabled
  await logAudit({
    userId,
    action: "MFA_DISABLED",
    resource: "User",
    resourceId: userId,
    description: "User disabled multi-factor authentication",
    organizationId: user.organizationId,
  });

  return true;
}

/**
 * Verify TOTP code
 */
export async function verifyTOTP(
  userId: string,
  code: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaBackupCodes: true },
  });

  if (!user || !user.mfaSecret) {
    return false;
  }

  try {
    // Decrypt secret
    const secret = decrypt(user.mfaSecret);

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    // Verify code with window of ±1 period (30 seconds)
    const delta = totp.validate({
      token: code,
      window: 1,
    });

    if (delta !== null) {
      return true;
    }

    // If TOTP fails, check backup codes
    return await verifyBackupCode(userId, code);
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Verify backup code
 */
async function verifyBackupCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaBackupCodes: true },
  });

  if (!user || !user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
    return false;
  }

  // Check each backup code
  for (let i = 0; i < user.mfaBackupCodes.length; i++) {
    const encryptedCode = user.mfaBackupCodes[i];
    try {
      const backupCode = decrypt(encryptedCode);

      if (backupCode === code.toUpperCase()) {
        // Remove used backup code
        const updatedBackupCodes = user.mfaBackupCodes.filter(
          (_, index) => index !== i,
        );

        await prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: updatedBackupCodes },
        });

        return true;
      }
    } catch {
      // Skip invalid encrypted codes
      continue;
    }
  }

  return false;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string,
  verificationCode: string,
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  if (!user || !user.mfaEnabled) {
    throw new Error("MFA is not enabled");
  }

  // Verify TOTP code
  const isValid = await verifyTOTP(userId, verificationCode);
  if (!isValid) {
    throw new Error("Invalid verification code");
  }

  // Generate new backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    generateSecureString(8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"),
  );

  // Encrypt backup codes
  const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

  await prisma.user.update({
    where: { id: userId },
    data: { mfaBackupCodes: encryptedBackupCodes },
  });

  return backupCodes;
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  return user?.mfaEnabled || false;
}

/**
 * Get MFA status for a user
 */
export async function getMFAStatus(userId: string): Promise<{
  enabled: boolean;
  backupCodesRemaining: number;
  hasSecret: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    enabled: user.mfaEnabled,
    backupCodesRemaining: user.mfaBackupCodes?.length || 0,
    hasSecret: !!user.mfaSecret,
  };
}

/**
 * Verify MFA setup (for testing purposes)
 */
export async function verifyMFASetup(
  userId: string,
  code: string,
): Promise<boolean> {
  return await verifyTOTP(userId, code);
}

/**
 * Force disable MFA (admin action)
 */
export async function forceDisableMFA(
  userId: string,
  adminId: string,
  reason: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Disable MFA
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  });

  // Log admin action
  await logAudit({
    userId: adminId,
    action: "MFA_DISABLED",
    resource: "User",
    resourceId: userId,
    description: `Admin force-disabled MFA for user: ${reason}`,
    metadata: { targetUserId: userId, reason },
    organizationId: user.organizationId,
  });

  return true;
}

/**
 * Check if MFA is required for organization
 */
export async function isMFARequired(organizationId: string): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });

  if (!organization) {
    return false;
  }

  const settings = organization.settings as any;
  return settings?.mfaRequired || false;
}

/**
 * Enforce MFA for organization
 */
export async function enforceMFA(
  organizationId: string,
  required: boolean,
): Promise<void> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const settings = (organization.settings as any) || {};
  settings.mfaRequired = required;

  await prisma.organization.update({
    where: { id: organizationId },
    data: { settings },
  });
}
