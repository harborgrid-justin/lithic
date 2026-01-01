import crypto from "crypto";
import bcrypt from "bcryptjs";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-in-production";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data (HIPAA compliant)
 */
export const encrypt = (text: string): string => {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (text: string): string => {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encryptedText = parts.join(":");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate secure random token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate secure random string for session IDs
 */
export const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

/**
 * Hash data using SHA-256
 */
export const hashData = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Mask sensitive data for logging (HIPAA)
 */
export const maskSensitiveData = (
  data: string,
  visibleChars: number = 4,
): string => {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }

  const masked = "*".repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);

  return `${masked}${visible}`;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (
  password: string,
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const cryptoUtils = {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword,
  generateToken,
  generateSessionId,
  hashData,
  maskSensitiveData,
  validatePasswordStrength,
};

export default cryptoUtils;
