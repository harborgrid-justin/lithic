/**
 * Enterprise Password Policy Service
 * NIST and OWASP compliant password policies
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/encryption";
import { logAudit } from "../audit-logger";
import { PasswordPolicy, PasswordComplexity } from "@/types/security";

// ============================================================================
// Common Weak Passwords
// ============================================================================

const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "12345678",
  "12345",
  "1234567",
  "password1",
  "qwerty",
  "abc123",
  "111111",
  "123123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "iloveyou",
  "admin123",
  "welcome123",
];

// ============================================================================
// Password Policy Service
// ============================================================================

export class PasswordPolicyService {
  /**
   * Get organization password policy
   */
  static async getPolicy(organizationId: string): Promise<PasswordPolicy> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as any;
    const policy = settings?.passwordPolicy;

    // Return default policy if not configured
    return (
      policy || {
        minLength: 12,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 90,
        minAge: 1,
        complexity: PasswordComplexity.HIGH,
        prohibitedPasswords: COMMON_PASSWORDS,
      }
    );
  }

  /**
   * Validate password against policy
   */
  static async validatePassword(
    password: string,
    userId?: string,
    organizationId?: string,
  ): Promise<{
    valid: boolean;
    errors: string[];
    strength: {
      score: number;
      label: string;
      suggestions: string[];
    };
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Get policy
    const policy = organizationId
      ? await this.getPolicy(organizationId)
      : this.getDefaultPolicy();

    // Length checks
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    // Complexity checks
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
      suggestions.push("Add uppercase letters");
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
      suggestions.push("Add lowercase letters");
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
      suggestions.push("Add numbers");
    }

    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
      suggestions.push("Add special characters (!@#$%^&*)");
    }

    // Check against common passwords
    const lowerPassword = password.toLowerCase();
    if (policy.prohibitedPasswords.some((p) => lowerPassword.includes(p))) {
      errors.push("Password is too common or weak");
      suggestions.push("Use a more unique password");
    }

    // Check against user information (if available)
    if (userId) {
      const containsUserInfo = await this.containsUserInfo(userId, password);
      if (containsUserInfo) {
        errors.push("Password must not contain personal information");
        suggestions.push("Avoid using your name, email, or other personal info");
      }
    }

    // Check password history (if user provided)
    if (userId && policy.preventReuse > 0) {
      const isReused = await this.isPasswordReused(
        userId,
        password,
        policy.preventReuse,
      );
      if (isReused) {
        errors.push(
          `Password must not match your last ${policy.preventReuse} passwords`,
        );
      }
    }

    // Calculate strength
    const strength = this.calculatePasswordStrength(password);

    // Check minimum complexity
    const requiredStrength = this.getRequiredStrength(policy.complexity);
    if (strength.score < requiredStrength) {
      errors.push(`Password does not meet required complexity level`);
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: {
        ...strength,
        suggestions,
      },
    };
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    organizationId: string,
  ): Promise<{ success: boolean; errors: string[] }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        lastPasswordChange: true,
      },
    });

    if (!user) {
      return { success: false, errors: ["User not found"] };
    }

    // Verify current password
    const isValidCurrent = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isValidCurrent) {
      await logAudit({
        userId,
        organizationId,
        action: "PASSWORD_CHANGE_FAILED",
        resource: "User",
        details: "Current password verification failed",
        success: false,
      });
      return { success: false, errors: ["Current password is incorrect"] };
    }

    // Validate new password
    const validation = await this.validatePassword(
      newPassword,
      userId,
      organizationId,
    );
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Check minimum age
    const policy = await this.getPolicy(organizationId);
    const daysSinceLastChange =
      (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastChange < policy.minAge) {
      return {
        success: false,
        errors: [
          `Password can only be changed once every ${policy.minAge} day(s)`,
        ],
      };
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Save to password history
    await prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash: user.passwordHash,
        changedAt: user.lastPasswordChange,
      },
    });

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        lastPasswordChange: new Date(),
      },
    });

    await logAudit({
      userId,
      organizationId,
      action: "PASSWORD_CHANGED",
      resource: "User",
      details: "Password changed successfully",
    });

    return { success: true, errors: [] };
  }

  /**
   * Force password reset
   */
  static async forcePasswordReset(
    userId: string,
    reason: string,
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetRequired: true,
        passwordResetReason: reason,
      },
    });

    await logAudit({
      userId,
      organizationId: "",
      action: "PASSWORD_RESET_FORCED",
      resource: "User",
      details: `Password reset forced: ${reason}`,
      metadata: { reason },
    });
  }

  /**
   * Check if password expires soon
   */
  static async checkPasswordExpiration(
    userId: string,
    organizationId: string,
  ): Promise<{
    expired: boolean;
    expiresSoon: boolean;
    daysUntilExpiry?: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastPasswordChange: true },
    });

    if (!user) {
      return { expired: false, expiresSoon: false };
    }

    const policy = await this.getPolicy(organizationId);
    const daysSinceChange =
      (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24);

    const daysUntilExpiry = policy.maxAge - daysSinceChange;
    const expired = daysSinceChange >= policy.maxAge;
    const expiresSoon = daysUntilExpiry <= 14 && daysUntilExpiry > 0;

    if (expired) {
      await this.forcePasswordReset(userId, "Password expired");
    }

    return {
      expired,
      expiresSoon,
      daysUntilExpiry: Math.max(0, Math.floor(daysUntilExpiry)),
    };
  }

  /**
   * Calculate password strength
   */
  private static calculatePasswordStrength(password: string): {
    score: number;
    label: string;
  } {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Complexity score
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;

    // Variety score
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars, 10);

    // Entropy bonus
    const hasVariety =
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z0-9]/.test(password);
    if (hasVariety) score += 10;

    const label =
      score >= 80
        ? "Very Strong"
        : score >= 60
          ? "Strong"
          : score >= 40
            ? "Moderate"
            : score >= 20
              ? "Weak"
              : "Very Weak";

    return { score: Math.min(score, 100), label };
  }

  /**
   * Check if password contains user info
   */
  private static async containsUserInfo(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) return false;

    const lowerPassword = password.toLowerCase();
    const email = user.email.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();

    return (
      lowerPassword.includes(firstName) ||
      lowerPassword.includes(lastName) ||
      lowerPassword.includes(email.split("@")[0])
    );
  }

  /**
   * Check if password was recently used
   */
  private static async isPasswordReused(
    userId: string,
    password: string,
    preventReuse: number,
  ): Promise<boolean> {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { changedAt: "desc" },
      take: preventReuse,
    });

    for (const entry of history) {
      const matches = await verifyPassword(password, entry.passwordHash);
      if (matches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get required strength score for complexity level
   */
  private static getRequiredStrength(complexity: PasswordComplexity): number {
    switch (complexity) {
      case PasswordComplexity.VERY_HIGH:
        return 80;
      case PasswordComplexity.HIGH:
        return 60;
      case PasswordComplexity.MEDIUM:
        return 40;
      case PasswordComplexity.LOW:
        return 20;
      default:
        return 60;
    }
  }

  /**
   * Get default policy
   */
  private static getDefaultPolicy(): PasswordPolicy {
    return {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90,
      minAge: 1,
      complexity: PasswordComplexity.HIGH,
      prohibitedPasswords: COMMON_PASSWORDS,
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function validatePassword(
  password: string,
  userId?: string,
  organizationId?: string,
) {
  return PasswordPolicyService.validatePassword(
    password,
    userId,
    organizationId,
  );
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  organizationId: string,
) {
  return PasswordPolicyService.changePassword(
    userId,
    currentPassword,
    newPassword,
    organizationId,
  );
}

export async function forcePasswordReset(userId: string, reason: string) {
  return PasswordPolicyService.forcePasswordReset(userId, reason);
}

export async function checkPasswordExpiration(
  userId: string,
  organizationId: string,
) {
  return PasswordPolicyService.checkPasswordExpiration(userId, organizationId);
}

export async function getPasswordPolicy(organizationId: string) {
  return PasswordPolicyService.getPolicy(organizationId);
}
