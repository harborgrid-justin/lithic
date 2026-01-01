/**
 * Duplicate Patient Detection Service
 * Uses fuzzy matching algorithms to detect potential duplicate patient records
 */

import { Patient, DuplicateMatch } from "../models/Patient";

export class DuplicateDetector {
  private readonly EXACT_MATCH_SCORE = 100;
  private readonly HIGH_THRESHOLD = 80;
  private readonly MEDIUM_THRESHOLD = 60;

  /**
   * Find potential duplicate patients
   */
  public async findDuplicates(
    patient: Partial<Patient>,
    existingPatients: Patient[],
  ): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    for (const existing of existingPatients) {
      const score = this.calculateMatchScore(patient, existing);
      const matchedFields = this.getMatchedFields(patient, existing);

      if (score >= this.MEDIUM_THRESHOLD) {
        matches.push({
          patient: existing,
          score,
          matchedFields,
        });
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate overall match score between two patients
   */
  private calculateMatchScore(
    patient1: Partial<Patient>,
    patient2: Patient,
  ): number {
    let totalScore = 0;
    let weights = 0;

    // SSN match (highest weight)
    if (patient1.ssn && patient2.ssn) {
      weights += 40;
      if (patient1.ssn === patient2.ssn) {
        totalScore += 40;
      }
    }

    // Name and DOB combination (high weight)
    const nameDobWeight = 30;
    weights += nameDobWeight;
    totalScore +=
      (this.scoreNameAndDob(patient1, patient2) * nameDobWeight) / 100;

    // Phone number (medium weight)
    if (patient1.contact?.phone && patient2.contact?.phone) {
      weights += 15;
      if (
        this.normalizePhone(patient1.contact.phone) ===
        this.normalizePhone(patient2.contact.phone)
      ) {
        totalScore += 15;
      }
    }

    // Email (low-medium weight)
    if (patient1.contact?.email && patient2.contact?.email) {
      weights += 10;
      if (
        patient1.contact.email.toLowerCase() ===
        patient2.contact.email.toLowerCase()
      ) {
        totalScore += 10;
      }
    }

    // Address (low weight)
    if (patient1.address && patient2.address) {
      weights += 5;
      totalScore +=
        (this.scoreAddress(patient1.address, patient2.address) * 5) / 100;
    }

    // Normalize to 100-point scale
    return weights > 0 ? (totalScore / weights) * 100 : 0;
  }

  /**
   * Score name and date of birth similarity
   */
  private scoreNameAndDob(
    patient1: Partial<Patient>,
    patient2: Patient,
  ): number {
    let score = 0;
    let checks = 0;

    // First name
    if (patient1.firstName && patient2.firstName) {
      checks++;
      const similarity = this.calculateStringSimilarity(
        patient1.firstName.toLowerCase(),
        patient2.firstName.toLowerCase(),
      );
      score += similarity;
    }

    // Last name
    if (patient1.lastName && patient2.lastName) {
      checks++;
      const similarity = this.calculateStringSimilarity(
        patient1.lastName.toLowerCase(),
        patient2.lastName.toLowerCase(),
      );
      score += similarity;
    }

    // Date of birth
    if (patient1.dateOfBirth && patient2.dateOfBirth) {
      checks++;
      const dob1 = new Date(patient1.dateOfBirth).toISOString().split("T")[0];
      const dob2 = new Date(patient2.dateOfBirth).toISOString().split("T")[0];
      if (dob1 === dob2) {
        score += 100;
      }
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Score address similarity
   */
  private scoreAddress(address1: any, address2: any): number {
    let matches = 0;
    let total = 0;

    const fields = ["street", "city", "state", "zipCode"];
    for (const field of fields) {
      if (address1[field] && address2[field]) {
        total++;
        if (address1[field].toLowerCase() === address2[field].toLowerCase()) {
          matches++;
        }
      }
    }

    return total > 0 ? (matches / total) * 100 : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 100;

    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.max(0, similarity);
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get list of matched fields
   */
  private getMatchedFields(
    patient1: Partial<Patient>,
    patient2: Patient,
  ): string[] {
    const matched: string[] = [];

    if (patient1.ssn && patient2.ssn && patient1.ssn === patient2.ssn) {
      matched.push("SSN");
    }

    if (
      patient1.firstName &&
      patient2.firstName &&
      patient1.firstName.toLowerCase() === patient2.firstName.toLowerCase()
    ) {
      matched.push("First Name");
    }

    if (
      patient1.lastName &&
      patient2.lastName &&
      patient1.lastName.toLowerCase() === patient2.lastName.toLowerCase()
    ) {
      matched.push("Last Name");
    }

    if (patient1.dateOfBirth && patient2.dateOfBirth) {
      const dob1 = new Date(patient1.dateOfBirth).toISOString().split("T")[0];
      const dob2 = new Date(patient2.dateOfBirth).toISOString().split("T")[0];
      if (dob1 === dob2) {
        matched.push("Date of Birth");
      }
    }

    if (
      patient1.contact?.phone &&
      patient2.contact?.phone &&
      this.normalizePhone(patient1.contact.phone) ===
        this.normalizePhone(patient2.contact.phone)
    ) {
      matched.push("Phone");
    }

    if (
      patient1.contact?.email &&
      patient2.contact?.email &&
      patient1.contact.email.toLowerCase() ===
        patient2.contact.email.toLowerCase()
    ) {
      matched.push("Email");
    }

    return matched;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  /**
   * Classify match severity
   */
  public classifyMatch(score: number): "high" | "medium" | "low" {
    if (score >= this.HIGH_THRESHOLD) return "high";
    if (score >= this.MEDIUM_THRESHOLD) return "medium";
    return "low";
  }
}

const duplicateDetector = new DuplicateDetector();
export default duplicateDetector;
