import { Patient, DuplicatePatient } from '@/types/patient';

export interface MatchCriteria {
  exactSSN?: number;
  exactMRN?: number;
  nameAndDOB?: number;
  phoneAndDOB?: number;
  emailAndName?: number;
}

const DEFAULT_MATCH_CRITERIA: MatchCriteria = {
  exactSSN: 100,
  exactMRN: 100,
  nameAndDOB: 85,
  phoneAndDOB: 75,
  emailAndName: 60,
};

export class DuplicateDetector {
  private matchCriteria: MatchCriteria;
  private threshold: number;

  constructor(threshold: number = 75, matchCriteria?: MatchCriteria) {
    this.threshold = threshold;
    this.matchCriteria = matchCriteria || DEFAULT_MATCH_CRITERIA;
  }

  /**
   * Find potential duplicate patients
   */
  findDuplicates(patient: Partial<Patient>, existingPatients: Patient[]): DuplicatePatient[] {
    const duplicates: DuplicatePatient[] = [];

    for (const existing of existingPatients) {
      // Skip if comparing to itself
      if (patient.id && patient.id === existing.id) continue;

      const matchResult = this.calculateMatch(patient, existing);
      
      if (matchResult.score >= this.threshold) {
        duplicates.push({
          patient: existing,
          matchScore: matchResult.score,
          matchReasons: matchResult.reasons,
        });
      }
    }

    // Sort by match score descending
    return duplicates.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate match score between two patients
   */
  private calculateMatch(
    patient1: Partial<Patient>,
    patient2: Patient
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Exact SSN match (highest priority)
    if (patient1.ssn && patient2.ssn && this.normalizeSSN(patient1.ssn) === this.normalizeSSN(patient2.ssn)) {
      score = Math.max(score, this.matchCriteria.exactSSN || 0);
      reasons.push('Exact SSN match');
    }

    // Exact MRN match
    if (patient1.mrn && patient2.mrn && patient1.mrn === patient2.mrn) {
      score = Math.max(score, this.matchCriteria.exactMRN || 0);
      reasons.push('Exact MRN match');
    }

    // Name and DOB match
    if (this.namesMatch(patient1, patient2) && patient1.dateOfBirth === patient2.dateOfBirth) {
      score = Math.max(score, this.matchCriteria.nameAndDOB || 0);
      reasons.push('Name and date of birth match');
    }

    // Phone and DOB match
    if (patient1.phone && patient2.phone && 
        this.normalizePhone(patient1.phone) === this.normalizePhone(patient2.phone) &&
        patient1.dateOfBirth === patient2.dateOfBirth) {
      score = Math.max(score, this.matchCriteria.phoneAndDOB || 0);
      reasons.push('Phone and date of birth match');
    }

    // Email and name match
    if (patient1.email && patient2.email && 
        patient1.email.toLowerCase() === patient2.email.toLowerCase() &&
        this.namesMatch(patient1, patient2)) {
      score = Math.max(score, this.matchCriteria.emailAndName || 0);
      reasons.push('Email and name match');
    }

    return { score, reasons };
  }

  private namesMatch(patient1: Partial<Patient>, patient2: Patient): boolean {
    const name1 = this.normalizeName(patient1.firstName, patient1.lastName);
    const name2 = this.normalizeName(patient2.firstName, patient2.lastName);
    return name1 === name2;
  }

  private normalizeName(firstName?: string, lastName?: string): string {
    const fn = (firstName || '').toLowerCase().trim();
    const ln = (lastName || '').toLowerCase().trim();
    return fn + '|' + ln;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeSSN(ssn: string): string {
    return ssn.replace(/\D/g, '');
  }
}

export const duplicateDetector = new DuplicateDetector();
