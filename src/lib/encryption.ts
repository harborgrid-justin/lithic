import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment variable
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET must be set');
  }
  return key;
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    getMasterKey(),
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypt sensitive data (PHI, passwords, etc.)
 */
export function encrypt(plaintext: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption key
    const key = deriveKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex'),
    ]);

    // Return base64 encoded result
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string): string {
  try {
    // Decode base64
    const buffer = Buffer.from(ciphertext, 'base64');

    // Extract components
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.slice(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive decryption key
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object (converts to JSON first)
 */
export function encryptObject(obj: any): string {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypt an object (parses JSON after decryption)
 */
export function decryptObject<T = any>(ciphertext: string): T {
  const json = decrypt(ciphertext);
  return JSON.parse(json);
}

/**
 * Hash a password using bcrypt-compatible format
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureString(
  length: number = 32,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  const randomBytes = crypto.randomBytes(length);
  const result = new Array(length);

  for (let i = 0; i < length; i++) {
    result[i] = charset[randomBytes[i] % charset.length];
  }

  return result.join('');
}

/**
 * Hash data using SHA-256
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature
 */
export function createHMAC(data: string, secret?: string): string {
  const key = secret || getMasterKey();
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(
  data: string,
  signature: string,
  secret?: string
): boolean {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Mask sensitive data for display (e.g., SSN, credit card)
 */
export function maskData(
  data: string,
  visibleChars: number = 4,
  maskChar: string = '*'
): string {
  if (!data || data.length <= visibleChars) {
    return data;
  }

  const masked = maskChar.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);

  return masked + visible;
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  const visibleChars = Math.min(3, username.length);
  const maskedUsername =
    username.slice(0, visibleChars) +
    '*'.repeat(Math.max(0, username.length - visibleChars));

  return `${maskedUsername}@${domain}`;
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(***) ***-${cleaned.slice(-4)}`;
  } else if (cleaned.length === 11) {
    return `+* (***) ***-${cleaned.slice(-4)}`;
  }

  // Default masking
  return maskData(phone);
}

/**
 * Redact PHI from text for logging
 */
export function redactPHI(text: string): string {
  let redacted = text;

  // Redact SSN (XXX-XX-XXXX)
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');

  // Redact email addresses
  redacted = redacted.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '***@***'
  );

  // Redact phone numbers
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '***-***-****');

  // Redact credit card numbers
  redacted = redacted.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');

  return redacted;
}

/**
 * Encrypt PHI data with additional metadata
 */
export interface EncryptedPHI {
  encrypted: string;
  timestamp: number;
  version: string;
}

export function encryptPHI(data: any): EncryptedPHI {
  return {
    encrypted: encryptObject(data),
    timestamp: Date.now(),
    version: '1.0',
  };
}

/**
 * Decrypt PHI data
 */
export function decryptPHI<T = any>(encryptedPHI: EncryptedPHI): T {
  return decryptObject<T>(encryptedPHI.encrypted);
}

/**
 * Generate encryption key rotation
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
