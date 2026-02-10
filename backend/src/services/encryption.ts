import * as crypto from 'crypto';

/**
 * Encryption service for securing API keys and sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  private constructor() {
    // Get encryption key from environment or generate one
    const keyString = process.env.ENCRYPTION_KEY;

    if (!keyString) {
      console.warn('⚠️  ENCRYPTION_KEY not set in environment. Generating a temporary key.');
      console.warn('⚠️  Set ENCRYPTION_KEY in .env for persistent encryption across restarts.');

      // Generate a random key (will be different each restart if not set in env)
      this.encryptionKey = crypto.randomBytes(32);

      // Log the generated key so user can add it to .env (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log('📋 Generated ENCRYPTION_KEY (add this to your .env file):');
        console.log(`ENCRYPTION_KEY=${this.encryptionKey.toString('hex')}`);
      }
    } else {
      // Use key from environment
      this.encryptionKey = Buffer.from(keyString, 'hex');

      if (this.encryptionKey.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
      }
    }
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt a string value
   * @param plaintext - The text to encrypt
   * @returns Encrypted string in format: iv:authTag:ciphertext (all hex encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt the plaintext
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      // Return encrypted data in format: iv:authTag:ciphertext
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   * @param encrypted - The encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    if (!encrypted) {
      return '';
    }

    try {
      // Split the encrypted string into its components
      const parts = encrypted.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const ciphertext = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the ciphertext
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt an object's sensitive fields
   * @param obj - Object with sensitive fields
   * @param fields - Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  encryptObject<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const encrypted = { ...obj } as any;

    for (const field of fields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }

    return encrypted as T;
  }

  /**
   * Decrypt an object's sensitive fields
   * @param obj - Object with encrypted fields
   * @param fields - Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptObject<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const decrypted = { ...obj } as any;

    for (const field of fields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }

    return decrypted as T;
  }

  /**
   * Generate a secure random encryption key
   * Use this to generate a key for ENCRYPTION_KEY environment variable
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const encryptionService = EncryptionService.getInstance();
