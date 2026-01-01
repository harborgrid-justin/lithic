import crypto from "crypto";

/**
 * EncryptionService - HIPAA-compliant PHI encryption service
 * Implements AES-256-GCM encryption for Protected Health Information
 */
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 64;
  private masterKey: Buffer;

  constructor() {
    // In production, load from secure key management system (AWS KMS, Azure Key Vault, etc.)
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key) {
      throw new Error("ENCRYPTION_MASTER_KEY environment variable is required");
    }
    this.masterKey = Buffer.from(key, "hex");

    if (this.masterKey.length !== this.keyLength) {
      throw new Error("Master key must be 256 bits (32 bytes)");
    }
  }

  /**
   * Encrypt PHI data with AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param associatedData - Additional authenticated data (AAD)
   * @returns Encrypted data with IV and auth tag
   */
  encrypt(plaintext: string, associatedData?: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

      if (associatedData) {
        cipher.setAAD(Buffer.from(associatedData, "utf8"));
      }

      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext
      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt PHI data
   * @param ciphertext - Encrypted data in format iv:authTag:ciphertext
   * @param associatedData - Additional authenticated data (AAD)
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string, associatedData?: string): string {
    try {
      const parts = ciphertext.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid ciphertext format");
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const encrypted = Buffer.from(encryptedHex, "hex");

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      if (associatedData) {
        decipher.setAAD(Buffer.from(associatedData, "utf8"));
      }

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data (passwords, tokens, etc.)
   * Uses PBKDF2 with SHA-512
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.saltLength);
    const iterations = 100000;
    const keyLen = 64;
    const digest = "sha512";

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLen,
        digest,
        (err, derivedKey) => {
          if (err) reject(err);
          // Format: iterations:salt:hash
          resolve(
            `${iterations}:${salt.toString("hex")}:${derivedKey.toString("hex")}`,
          );
        },
      );
    });
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const parts = hash.split(":");
      if (parts.length !== 3) return false;

      const iterations = parseInt(parts[0], 10);
      const salt = Buffer.from(parts[1], "hex");
      const originalHash = parts[2];
      const keyLen = 64;
      const digest = "sha512";

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          password,
          salt,
          iterations,
          keyLen,
          digest,
          (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString("hex") === originalHash);
          },
        );
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate cryptographically secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Hash data with SHA-256 (for non-password data)
   */
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate encryption key for data encryption keys (DEK)
   */
  generateDEK(): string {
    return crypto.randomBytes(this.keyLength).toString("hex");
  }

  /**
   * Encrypt data encryption key with master key (envelope encryption)
   */
  encryptDEK(dek: string): string {
    return this.encrypt(dek);
  }

  /**
   * Decrypt data encryption key
   */
  decryptDEK(encryptedDEK: string): string {
    return this.decrypt(encryptedDEK);
  }
}

const encryptionService = new EncryptionService();
export default encryptionService;
