import crypto from "crypto";
import { Twilio } from "twilio";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";

/**
 * SMS MFA Implementation with Twilio Integration
 * Includes rate limiting, verification code management, and fraud prevention
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Rate limiting constants
const MAX_SMS_PER_HOUR = 5;
const MAX_SMS_PER_DAY = 10;
const CODE_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 6;
const MAX_VERIFICATION_ATTEMPTS = 3;

let twilioClient: Twilio | null = null;

/**
 * Get Twilio client instance
 */
function getTwilioClient(): Twilio {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }

  if (!twilioClient) {
    twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return twilioClient;
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Add +1 for US numbers if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("+")) {
    return phone;
  }

  return `+${cleaned}`;
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  try {
    const formatted = formatPhoneNumber(phone);
    return e164Regex.test(formatted);
  } catch {
    return false;
  }
}

/**
 * Generate verification code
 */
function generateVerificationCode(): string {
  const buffer = crypto.randomBytes(CODE_LENGTH);
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += (buffer[i] % 10).toString();
  }

  return code;
}

/**
 * Check rate limits for SMS sending
 */
async function checkRateLimit(userId: string, phone: string): Promise<void> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count SMS sent in last hour
  const hourlyCount = await prisma.mFAVerification.count({
    where: {
      userId,
      phoneNumber: phone,
      type: "SMS",
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (hourlyCount >= MAX_SMS_PER_HOUR) {
    throw new Error(
      `Rate limit exceeded. Maximum ${MAX_SMS_PER_HOUR} SMS messages per hour.`,
    );
  }

  // Count SMS sent in last day
  const dailyCount = await prisma.mFAVerification.count({
    where: {
      userId,
      phoneNumber: phone,
      type: "SMS",
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  if (dailyCount >= MAX_SMS_PER_DAY) {
    throw new Error(
      `Daily rate limit exceeded. Maximum ${MAX_SMS_PER_DAY} SMS messages per day.`,
    );
  }
}

/**
 * Send SMS verification code
 */
export async function sendSMSCode(
  userId: string,
  phoneNumber: string,
  purpose: "enrollment" | "verification" | "password_reset" = "verification",
): Promise<{ verificationId: string; expiresAt: Date }> {
  // Validate phone number
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error("Invalid phone number format");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Check rate limits
  await checkRateLimit(userId, formattedPhone);

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Store verification code
  const verification = await prisma.mFAVerification.create({
    data: {
      userId,
      type: "SMS",
      phoneNumber: formattedPhone,
      code: encrypt(code),
      expiresAt,
      attempts: 0,
      verified: false,
      purpose,
      metadata: {
        sentAt: new Date().toISOString(),
      },
      createdBy: userId,
      updatedBy: userId,
    },
  });

  // Send SMS via Twilio
  try {
    const client = getTwilioClient();

    const message = await client.messages.create({
      body: `Your Lithic Healthcare verification code is: ${code}. Valid for ${CODE_EXPIRY_MINUTES} minutes. Do not share this code.`,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    // Update verification with message SID
    await prisma.mFAVerification.update({
      where: { id: verification.id },
      data: {
        metadata: {
          sentAt: new Date().toISOString(),
          messageSid: message.sid,
          status: message.status,
        },
      },
    });

    await logAudit({
      userId,
      action: "MFA_SMS_SENT",
      resource: "MFAVerification",
      resourceId: verification.id,
      description: `SMS verification code sent to ${maskPhoneNumber(formattedPhone)}`,
      metadata: {
        phoneNumber: maskPhoneNumber(formattedPhone),
        purpose,
        expiresAt: expiresAt.toISOString(),
      },
      organizationId: user.organizationId,
    });
  } catch (error) {
    // Delete verification record if SMS failed
    await prisma.mFAVerification.delete({
      where: { id: verification.id },
    });

    await logAudit({
      userId,
      action: "MFA_SMS_FAILED",
      resource: "MFAVerification",
      description: `Failed to send SMS verification code`,
      metadata: {
        phoneNumber: maskPhoneNumber(formattedPhone),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      organizationId: user.organizationId,
    });

    throw new Error("Failed to send SMS verification code");
  }

  return {
    verificationId: verification.id,
    expiresAt,
  };
}

/**
 * Verify SMS code
 */
export async function verifySMSCode(
  userId: string,
  verificationId: string,
  code: string,
): Promise<boolean> {
  const verification = await prisma.mFAVerification.findFirst({
    where: {
      id: verificationId,
      userId,
      type: "SMS",
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!verification) {
    throw new Error("Verification not found");
  }

  // Check if already verified
  if (verification.verified) {
    throw new Error("Code already used");
  }

  // Check expiration
  if (new Date() > verification.expiresAt) {
    await logAudit({
      userId,
      action: "MFA_VERIFICATION_FAILED",
      resource: "MFAVerification",
      resourceId: verificationId,
      description: "SMS verification code expired",
      metadata: {
        phoneNumber: maskPhoneNumber(verification.phoneNumber),
      },
      organizationId: verification.user.organizationId,
    });

    throw new Error("Verification code expired");
  }

  // Check attempts
  if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await logAudit({
      userId,
      action: "MFA_VERIFICATION_FAILED",
      resource: "MFAVerification",
      resourceId: verificationId,
      description: "Maximum verification attempts exceeded",
      metadata: {
        phoneNumber: maskPhoneNumber(verification.phoneNumber),
        attempts: verification.attempts,
      },
      organizationId: verification.user.organizationId,
    });

    throw new Error("Maximum verification attempts exceeded");
  }

  // Increment attempts
  await prisma.mFAVerification.update({
    where: { id: verificationId },
    data: {
      attempts: verification.attempts + 1,
    },
  });

  // Verify code
  const storedCode = decrypt(verification.code);

  if (storedCode !== code) {
    await logAudit({
      userId,
      action: "MFA_VERIFICATION_FAILED",
      resource: "MFAVerification",
      resourceId: verificationId,
      description: "Invalid SMS verification code",
      metadata: {
        phoneNumber: maskPhoneNumber(verification.phoneNumber),
        attempts: verification.attempts + 1,
      },
      organizationId: verification.user.organizationId,
    });

    return false;
  }

  // Mark as verified
  await prisma.mFAVerification.update({
    where: { id: verificationId },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    userId,
    action: "MFA_VERIFIED",
    resource: "MFAVerification",
    resourceId: verificationId,
    description: "SMS verification successful",
    metadata: {
      phoneNumber: maskPhoneNumber(verification.phoneNumber),
    },
    organizationId: verification.user.organizationId,
  });

  return true;
}

/**
 * Enable SMS MFA for user
 */
export async function enableSMSMFA(
  userId: string,
  phoneNumber: string,
  verificationId: string,
): Promise<void> {
  // Verify that the code was verified
  const verification = await prisma.mFAVerification.findFirst({
    where: {
      id: verificationId,
      userId,
      type: "SMS",
      verified: true,
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!verification) {
    throw new Error("Phone number not verified");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Create or update MFA device
  await prisma.mFADevice.upsert({
    where: {
      userId_type_phoneNumber: {
        userId,
        type: "SMS",
        phoneNumber: formattedPhone,
      },
    },
    create: {
      userId,
      type: "SMS",
      name: `SMS - ${maskPhoneNumber(formattedPhone)}`,
      phoneNumber: formattedPhone,
      verified: true,
      verifiedAt: new Date(),
      enabled: true,
      metadata: {
        verificationId,
      },
      createdBy: userId,
      updatedBy: userId,
    },
    update: {
      verified: true,
      verifiedAt: new Date(),
      enabled: true,
      deletedAt: null,
    },
  });

  // Enable MFA for user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaMethods: true },
  });

  const mfaMethods = (user?.mfaMethods as string[]) || [];
  if (!mfaMethods.includes("sms")) {
    mfaMethods.push("sms");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaMethods,
      phone: formattedPhone,
    },
  });

  await logAudit({
    userId,
    action: "MFA_ENABLED",
    resource: "User",
    resourceId: userId,
    description: `SMS MFA enabled for ${maskPhoneNumber(formattedPhone)}`,
    metadata: {
      phoneNumber: maskPhoneNumber(formattedPhone),
    },
    organizationId: verification.user.organizationId,
  });
}

/**
 * Disable SMS MFA for user
 */
export async function disableSMSMFA(
  userId: string,
  phoneNumber: string,
  verificationCode?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, mfaMethods: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  // If verification code provided, verify it first
  if (verificationCode) {
    const { verificationId } = await sendSMSCode(
      userId,
      formattedPhone,
      "verification",
    );
    const isValid = await verifySMSCode(
      userId,
      verificationId,
      verificationCode,
    );

    if (!isValid) {
      throw new Error("Invalid verification code");
    }
  }

  // Disable SMS device
  await prisma.mFADevice.updateMany({
    where: {
      userId,
      type: "SMS",
      phoneNumber: formattedPhone,
    },
    data: {
      enabled: false,
      deletedAt: new Date(),
    },
  });

  // Update user MFA methods
  const mfaMethods = ((user.mfaMethods as string[]) || []).filter(
    (m) => m !== "sms",
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaMethods,
      mfaEnabled: mfaMethods.length > 0,
    },
  });

  await logAudit({
    userId,
    action: "MFA_DISABLED",
    resource: "User",
    resourceId: userId,
    description: `SMS MFA disabled for ${maskPhoneNumber(formattedPhone)}`,
    metadata: {
      phoneNumber: maskPhoneNumber(formattedPhone),
    },
    organizationId: user.organizationId,
  });
}

/**
 * Get SMS MFA status for user
 */
export async function getSMSMFAStatus(userId: string): Promise<{
  enabled: boolean;
  phoneNumber?: string;
  maskedPhoneNumber?: string;
}> {
  const device = await prisma.mFADevice.findFirst({
    where: {
      userId,
      type: "SMS",
      verified: true,
      enabled: true,
      deletedAt: null,
    },
  });

  if (!device || !device.phoneNumber) {
    return { enabled: false };
  }

  return {
    enabled: true,
    phoneNumber: device.phoneNumber,
    maskedPhoneNumber: maskPhoneNumber(device.phoneNumber),
  };
}

/**
 * Resend SMS code
 */
export async function resendSMSCode(
  userId: string,
  verificationId: string,
): Promise<{ verificationId: string; expiresAt: Date }> {
  const oldVerification = await prisma.mFAVerification.findFirst({
    where: {
      id: verificationId,
      userId,
      type: "SMS",
    },
  });

  if (!oldVerification) {
    throw new Error("Verification not found");
  }

  // Send new code to same phone number
  return await sendSMSCode(
    userId,
    oldVerification.phoneNumber,
    oldVerification.purpose as any,
  );
}

/**
 * Cleanup expired verifications
 */
export async function cleanupExpiredVerifications(): Promise<number> {
  const result = await prisma.mFAVerification.deleteMany({
    where: {
      type: "SMS",
      expiresAt: {
        lt: new Date(),
      },
      verified: false,
    },
  });

  return result.count;
}

/**
 * Helper: Mask phone number for display/logging
 */
function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    // +1 XXX XXX 1234
    return `+${cleaned[0]} *** *** ${cleaned.slice(-4)}`;
  } else if (cleaned.length === 10) {
    // XXX XXX 1234
    return `*** *** ${cleaned.slice(-4)}`;
  }

  // Default: show last 4 digits
  return `*** ${phone.slice(-4)}`;
}

/**
 * Send SMS for emergency access
 */
export async function sendEmergencyAccessCode(
  userId: string,
  phoneNumber: string,
  adminId: string,
  reason: string,
): Promise<{ code: string; expiresAt: Date }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, firstName: true, lastName: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store emergency access code
  await prisma.emergencyAccess.create({
    data: {
      userId,
      requestedBy: adminId,
      accessCode: encrypt(code),
      phoneNumber: formattedPhone,
      expiresAt,
      reason,
      status: "PENDING",
      createdBy: adminId,
      updatedBy: adminId,
    },
  });

  // Send SMS
  try {
    const client = getTwilioClient();

    await client.messages.create({
      body: `EMERGENCY ACCESS: Your Lithic Healthcare emergency access code is: ${code}. Valid for 15 minutes. Requested by administrator for: ${reason}`,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    await logAudit({
      userId: adminId,
      action: "EMERGENCY_ACCESS_REQUESTED",
      resource: "EmergencyAccess",
      resourceId: userId,
      description: `Emergency access code sent to ${maskPhoneNumber(formattedPhone)}`,
      metadata: {
        targetUserId: userId,
        phoneNumber: maskPhoneNumber(formattedPhone),
        reason,
      },
      organizationId: user.organizationId,
    });
  } catch (error) {
    throw new Error("Failed to send emergency access code");
  }

  return { code, expiresAt };
}

/**
 * Get SMS delivery status from Twilio
 */
export async function getSMSDeliveryStatus(messageSid: string): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const client = getTwilioClient();
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error) {
    return {
      status: "unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
