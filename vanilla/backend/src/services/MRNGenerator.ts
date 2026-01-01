/**
 * MRN (Medical Record Number) Generator Service
 * Generates unique, HIPAA-compliant medical record numbers
 */

export class MRNGenerator {
  private prefix: string;
  private sequenceLength: number;
  private checkDigit: boolean;

  constructor(
    prefix: string = "MRN",
    sequenceLength: number = 8,
    checkDigit: boolean = true,
  ) {
    this.prefix = prefix;
    this.sequenceLength = sequenceLength;
    this.checkDigit = checkDigit;
  }

  /**
   * Generate a new MRN
   * Format: PREFIX-XXXXXXXX-C (where C is optional check digit)
   */
  public async generate(): Promise<string> {
    const sequence = this.generateSequence();
    const check = this.checkDigit ? this.calculateCheckDigit(sequence) : "";
    return `${this.prefix}-${sequence}${check ? "-" + check : ""}`;
  }

  /**
   * Validate an MRN
   */
  public validate(mrn: string): boolean {
    const pattern = this.checkDigit
      ? new RegExp(`^${this.prefix}-\\d{${this.sequenceLength}}-\\d$`)
      : new RegExp(`^${this.prefix}-\\d{${this.sequenceLength}}$`);

    if (!pattern.test(mrn)) {
      return false;
    }

    if (this.checkDigit) {
      const parts = mrn.split("-");
      const sequence = parts[1];
      const providedCheck = parts[2];
      const calculatedCheck = this.calculateCheckDigit(sequence);
      return providedCheck === calculatedCheck;
    }

    return true;
  }

  /**
   * Generate random sequence number
   */
  private generateSequence(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const combined = timestamp + random;

    // Take last N digits
    return combined.slice(-this.sequenceLength);
  }

  /**
   * Calculate Luhn check digit
   */
  private calculateCheckDigit(sequence: string): string {
    let sum = 0;
    let isEven = false;

    for (let i = sequence.length - 1; i >= 0; i--) {
      let digit = parseInt(sequence[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Extract sequence from MRN
   */
  public extractSequence(mrn: string): string | null {
    const parts = mrn.split("-");
    return parts[1] || null;
  }
}

const mrnGenerator = new MRNGenerator();
export default mrnGenerator;
