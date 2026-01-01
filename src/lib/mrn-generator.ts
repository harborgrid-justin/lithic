import { customAlphabet } from 'nanoid';

// Custom alphabet without ambiguous characters (0, O, I, l, 1)
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

export interface MRNGeneratorConfig {
  prefix?: string;
  facilityCode?: string;
  includeChecksum?: boolean;
}

export class MRNGenerator {
  private prefix: string;
  private facilityCode: string;
  private includeChecksum: boolean;

  constructor(config: MRNGeneratorConfig = {}) {
    this.prefix = config.prefix || 'MRN';
    this.facilityCode = config.facilityCode || '001';
    this.includeChecksum = config.includeChecksum ?? true;
  }

  /**
   * Generate a unique Medical Record Number
   * Format: PREFIX-FACILITY-RANDOM-CHECKSUM
   * Example: MRN-001-A3K7H9PQR2-X
   */
  generate(): string {
    const randomPart = nanoid();
    const baseMRN = `${this.prefix}-${this.facilityCode}-${randomPart}`;
    
    if (this.includeChecksum) {
      const checksum = this.calculateChecksum(baseMRN);
      return `${baseMRN}-${checksum}`;
    }
    
    return baseMRN;
  }

  /**
   * Validate an MRN format and checksum
   */
  validate(mrn: string): boolean {
    const parts = mrn.split('-');
    
    // Check format
    if (parts.length < 3) return false;
    if (parts[0] !== this.prefix) return false;
    
    // Check checksum if included
    if (this.includeChecksum && parts.length === 4) {
      const baseMRN = parts.slice(0, 3).join('-');
      const providedChecksum = parts[3];
      const calculatedChecksum = this.calculateChecksum(baseMRN);
      return providedChecksum === calculatedChecksum;
    }
    
    return true;
  }

  /**
   * Calculate checksum using Luhn algorithm variant
   */
  private calculateChecksum(mrn: string): string {
    const chars = mrn.replace(/[^A-Z0-9]/g, '');
    let sum = 0;
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const value = char.charCodeAt(0);
      sum += value * (i + 1);
    }
    
    const checksumValue = sum % 36;
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[checksumValue];
  }
}

// Default instance
export const mrnGenerator = new MRNGenerator();
