import * as OTPAuth from "otpauth";
import { prisma } from "@/lib/db";
import { encrypt, decrypt, generateSecureString } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import QRCode from "qrcode";

/**
 * Enhanced TOTP (Time-based One-Time Password) MFA Implementation
 * Supports multiple devices, backup codes, and recovery options
 */

export interface TOTPSecret {
  secret: string;
  qrCode: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  uri: string;
}

export interface TOTPDevice {
  id: string;
  userId: string;
  name: string;
  secret: string;
  verified: boolean;
  lastUsed: Date | null;
  createdAt: Date;
}

export interface TOTPVerificationResult {
  valid: boolean;
  usedBackupCode: boolean;
  remainingBackupCodes?: number;
  deviceId?: string;
}

/**
 * Generate TOTP secret with QR code
 */
export async function generateTOTPSecret(
  userId: string,
  deviceName: string = "Default Device",
): Promise<TOTPSecret> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate TOTP secret
  const totp = new OTPAuth.TOTP({
    issuer: "Lithic Healthcare",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(generateBase32Secret()),
  });

  const secret = totp.secret.base32;
  const uri = totp.toString();

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  // Store encrypted backup codes
  const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

  // Create TOTP device record
  await prisma.mFADevice.create({
    data: {
      userId,
      type: "TOTP",
      name: deviceName,
      secret: encrypt(secret),
      backupCodes: encryptedBackupCodes,
      verified: false,
      enabled: false,
      metadata: {
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
      createdBy: userId,
      updatedBy: userId,
    },
  });

  await logAudit({
    userId,
    action: "MFA_DEVICE_CREATED",
    resource: "MFADevice",
    description: `TOTP device created: ${deviceName}`,
    metadata: { deviceName, type: "TOTP" },
    organizationId: user.organizationId,
  });

  return {
    secret,
    qrCode: uri,
    qrCodeDataUrl,
    backupCodes,
    uri,
  };
}

/**
 * Verify TOTP code and activate device
 */
export async function verifyAndActivateTOTP(
  userId: string,
  deviceId: string,
  code: string,
): Promise<boolean> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      id: deviceId,
      userId,
      type: "TOTP",
      deletedAt: null,
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!device) {
    throw new Error("TOTP device not found");
  }

  if (device.verified) {
    throw new Error("TOTP device already verified");
  }

  // Verify the code
  const isValid = await verifyTOTPCode(device.secret, code);

  if (!isValid) {
    await logAudit({
      userId,
      action: "MFA_VERIFICATION_FAILED",
      resource: "MFADevice",
      resourceId: deviceId,
      description: "Failed TOTP verification during activation",
      organizationId: device.user.organizationId,
    });

    return false;
  }

  // Activate device
  await prisma.mFADevice.update({
    where: { id: deviceId },
    data: {
      verified: true,
      enabled: true,
      verifiedAt: new Date(),
      lastUsedAt: new Date(),
    },
  });

  // Enable MFA for user if not already enabled
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaMethods: {
        push: "totp",
      },
    },
  });

  await logAudit({
    userId,
    action: "MFA_ENABLED",
    resource: "User",
    resourceId: userId,
    description: `TOTP MFA activated for device: ${device.name}`,
    metadata: { deviceId, deviceName: device.name },
    organizationId: device.user.organizationId,
  });

  return true;
}

/**
 * Verify TOTP code from any active device
 */
export async function verifyTOTPForUser(
  userId: string,
  code: string,
): Promise<TOTPVerificationResult> {
  // Get all active TOTP devices
  const devices = await prisma.mFADevice.findMany({
    where: {
      userId,
      type: "TOTP",
      verified: true,
      enabled: true,
      deletedAt: null,
    },
    orderBy: {
      lastUsedAt: "desc",
    },
  });

  if (devices.length === 0) {
    return { valid: false, usedBackupCode: false };
  }

  // Try to verify with each device
  for (const device of devices) {
    const isValid = await verifyTOTPCode(device.secret, code);

    if (isValid) {
      // Update last used timestamp
      await prisma.mFADevice.update({
        where: { id: device.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        valid: true,
        usedBackupCode: false,
        deviceId: device.id,
      };
    }
  }

  // If code verification failed, try backup codes
  return await verifyBackupCode(userId, code);
}

/**
 * Verify TOTP code against secret
 */
async function verifyTOTPCode(
  encryptedSecret: string,
  code: string,
): Promise<boolean> {
  try {
    const secret = decrypt(encryptedSecret);

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    // Verify with window of ±1 period (90 seconds total)
    const delta = totp.validate({
      token: code,
      window: 1,
    });

    return delta !== null;
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
): Promise<TOTPVerificationResult> {
  const devices = await prisma.mFADevice.findMany({
    where: {
      userId,
      type: "TOTP",
      verified: true,
      enabled: true,
      deletedAt: null,
    },
  });

  for (const device of devices) {
    const backupCodes = device.backupCodes as string[];

    if (!backupCodes || backupCodes.length === 0) {
      continue;
    }

    // Check each backup code
    for (let i = 0; i < backupCodes.length; i++) {
      try {
        const backupCode = decrypt(backupCodes[i]);

        if (backupCode === code.toUpperCase().replace(/\s/g, "")) {
          // Remove used backup code
          const updatedBackupCodes = backupCodes.filter(
            (_, index) => index !== i,
          );

          await prisma.mFADevice.update({
            where: { id: device.id },
            data: {
              backupCodes: updatedBackupCodes,
              lastUsedAt: new Date(),
            },
          });

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
          });

          await logAudit({
            userId,
            action: "MFA_BACKUP_CODE_USED",
            resource: "MFADevice",
            resourceId: device.id,
            description: "Backup code used for authentication",
            metadata: {
              deviceId: device.id,
              remainingCodes: updatedBackupCodes.length,
            },
            organizationId: user?.organizationId || "",
          });

          return {
            valid: true,
            usedBackupCode: true,
            remainingBackupCodes: updatedBackupCodes.length,
            deviceId: device.id,
          };
        }
      } catch {
        continue;
      }
    }
  }

  return { valid: false, usedBackupCode: false };
}

/**
 * Regenerate backup codes for a device
 */
export async function regenerateBackupCodes(
  userId: string,
  deviceId: string,
  verificationCode: string,
): Promise<string[]> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      id: deviceId,
      userId,
      type: "TOTP",
      verified: true,
      deletedAt: null,
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!device) {
    throw new Error("TOTP device not found");
  }

  // Verify TOTP code
  const isValid = await verifyTOTPCode(device.secret, verificationCode);
  if (!isValid) {
    throw new Error("Invalid verification code");
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes(10);
  const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

  await prisma.mFADevice.update({
    where: { id: deviceId },
    data: { backupCodes: encryptedBackupCodes },
  });

  await logAudit({
    userId,
    action: "MFA_BACKUP_CODES_REGENERATED",
    resource: "MFADevice",
    resourceId: deviceId,
    description: "Backup codes regenerated",
    metadata: { deviceId, deviceName: device.name },
    organizationId: device.user.organizationId,
  });

  return backupCodes;
}

/**
 * Get all TOTP devices for a user
 */
export async function getTOTPDevices(userId: string): Promise<TOTPDevice[]> {
  const devices = await prisma.mFADevice.findMany({
    where: {
      userId,
      type: "TOTP",
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return devices.map((device) => ({
    id: device.id,
    userId: device.userId,
    name: device.name,
    secret: device.secret,
    verified: device.verified,
    lastUsed: device.lastUsedAt,
    createdAt: device.createdAt,
  }));
}

/**
 * Remove TOTP device
 */
export async function removeTOTPDevice(
  userId: string,
  deviceId: string,
  verificationCode?: string,
): Promise<void> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      id: deviceId,
      userId,
      type: "TOTP",
      deletedAt: null,
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!device) {
    throw new Error("TOTP device not found");
  }

  // Verify code if device is verified
  if (device.verified && verificationCode) {
    const isValid = await verifyTOTPCode(device.secret, verificationCode);
    if (!isValid) {
      throw new Error("Invalid verification code");
    }
  }

  // Soft delete the device
  await prisma.mFADevice.update({
    where: { id: deviceId },
    data: {
      deletedAt: new Date(),
      enabled: false,
    },
  });

  // Check if user has any other active MFA devices
  const remainingDevices = await prisma.mFADevice.count({
    where: {
      userId,
      verified: true,
      enabled: true,
      deletedAt: null,
    },
  });

  // Disable MFA if no devices remain
  if (remainingDevices === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaMethods: [],
      },
    });
  }

  await logAudit({
    userId,
    action: "MFA_DEVICE_REMOVED",
    resource: "MFADevice",
    resourceId: deviceId,
    description: `TOTP device removed: ${device.name}`,
    metadata: { deviceId, deviceName: device.name, remainingDevices },
    organizationId: device.user.organizationId,
  });
}

/**
 * Rename TOTP device
 */
export async function renameTOTPDevice(
  userId: string,
  deviceId: string,
  newName: string,
): Promise<void> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      id: deviceId,
      userId,
      type: "TOTP",
      deletedAt: null,
    },
  });

  if (!device) {
    throw new Error("TOTP device not found");
  }

  await prisma.mFADevice.update({
    where: { id: deviceId },
    data: { name: newName },
  });
}

/**
 * Get TOTP status for user
 */
export async function getTOTPStatus(userId: string): Promise<{
  enabled: boolean;
  deviceCount: number;
  devices: Array<{
    id: string;
    name: string;
    verified: boolean;
    lastUsed: Date | null;
  }>;
}> {
  const devices = await prisma.mFADevice.findMany({
    where: {
      userId,
      type: "TOTP",
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      verified: true,
      lastUsedAt: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  return {
    enabled: user?.mfaEnabled || false,
    deviceCount: devices.filter((d) => d.verified).length,
    devices: devices.map((d) => ({
      id: d.id,
      name: d.name,
      verified: d.verified,
      lastUsed: d.lastUsedAt,
    })),
  };
}

/**
 * Helper: Generate base32 secret
 */
function generateBase32Secret(): string {
  const buffer = crypto.randomBytes(20);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let i = 0; i < buffer.length; i++) {
    secret += base32Chars[buffer[i] % 32];
  }

  return secret;
}

/**
 * Helper: Generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateSecureString(
      8,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    );
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Get backup codes count for device
 */
export async function getBackupCodesCount(
  userId: string,
  deviceId: string,
): Promise<number> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      id: deviceId,
      userId,
      type: "TOTP",
      deletedAt: null,
    },
    select: {
      backupCodes: true,
    },
  });

  if (!device) {
    return 0;
  }

  const backupCodes = device.backupCodes as string[];
  return backupCodes?.length || 0;
}

/**
 * Force disable all TOTP devices (admin/emergency action)
 */
export async function forceDisableTOTP(
  userId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Disable all TOTP devices
  await prisma.mFADevice.updateMany({
    where: {
      userId,
      type: "TOTP",
    },
    data: {
      enabled: false,
      deletedAt: new Date(),
    },
  });

  // Disable MFA for user
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaMethods: [],
    },
  });

  await logAudit({
    userId: adminId,
    action: "MFA_FORCE_DISABLED",
    resource: "User",
    resourceId: userId,
    description: `Admin force-disabled TOTP MFA: ${reason}`,
    metadata: { targetUserId: userId, reason, disabledBy: adminId },
    organizationId: user.organizationId,
  });
}

import crypto from "crypto";
