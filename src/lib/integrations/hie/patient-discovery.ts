/**
 * Patient Discovery Service
 * Cross-organization patient matching and discovery
 * Aggregates results from Carequality, CommonWell, and other HIEs
 */

import type {
  PatientDiscoveryRequest,
  PatientDiscoveryResponse,
  PatientMatch,
} from "@/types/integrations";
import { createCarequalityClient, type CarequalityConfig } from "./carequality";
import { createCommonWellClient, type CommonWellConfig } from "./commonwell";
import { db } from "@/lib/db";

export interface PatientDiscoveryConfig {
  carequality?: CarequalityConfig;
  commonwell?: CommonWellConfig;
  timeout?: number;
  minMatchScore?: number;
}

/**
 * Patient Discovery Service
 */
export class PatientDiscoveryService {
  private carequalityClient?: ReturnType<typeof createCarequalityClient>;
  private commonwellClient?: ReturnType<typeof createCommonWellClient>;

  constructor(private config: PatientDiscoveryConfig) {
    if (config.carequality) {
      this.carequalityClient = createCarequalityClient(config.carequality);
    }

    if (config.commonwell) {
      this.commonwellClient = createCommonWellClient(config.commonwell);
    }
  }

  /**
   * Search for patients across all HIEs
   */
  async searchPatient(request: PatientDiscoveryRequest): Promise<PatientDiscoveryResponse> {
    const results: PatientMatch[] = [];
    const errors: string[] = [];

    // Search in parallel
    const searches: Promise<PatientMatch[]>[] = [];

    if (this.carequalityClient) {
      searches.push(
        this.searchCarequality(request).catch((error) => {
          errors.push(`Carequality: ${error.message}`);
          return [];
        })
      );
    }

    if (this.commonwellClient) {
      searches.push(
        this.searchCommonWell(request).catch((error) => {
          errors.push(`CommonWell: ${error.message}`);
          return [];
        })
      );
    }

    // Wait for all searches to complete
    const searchResults = await Promise.all(searches);

    // Combine and deduplicate results
    for (const matches of searchResults) {
      results.push(...matches);
    }

    // Remove duplicates based on patient identifiers
    const uniqueMatches = this.deduplicateMatches(results);

    // Filter by minimum match score
    const minScore = this.config.minMatchScore || 0.5;
    const filteredMatches = uniqueMatches.filter((match) => match.matchScore >= minScore);

    // Sort by match score descending
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);

    return {
      matches: filteredMatches,
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };
  }

  /**
   * Match patient locally
   */
  async matchLocalPatient(request: PatientDiscoveryRequest): Promise<PatientMatch | null> {
    const { demographics } = request;

    // Build search criteria
    const searchCriteria: any = {};

    if (demographics.firstName) {
      searchCriteria.firstName = { contains: demographics.firstName, mode: "insensitive" };
    }

    if (demographics.lastName) {
      searchCriteria.lastName = { contains: demographics.lastName, mode: "insensitive" };
    }

    if (demographics.dateOfBirth) {
      searchCriteria.dateOfBirth = new Date(demographics.dateOfBirth);
    }

    if (demographics.gender) {
      searchCriteria.gender = demographics.gender;
    }

    if (demographics.ssn) {
      searchCriteria.ssn = demographics.ssn;
    }

    // Search local database
    const patients = await db.patient.findMany({
      where: searchCriteria,
      take: 10,
    });

    if (patients.length === 0) {
      return null;
    }

    // Calculate match scores
    const matches = patients.map((patient) => ({
      patientId: patient.id,
      organizationId: "local",
      organizationName: "Local System",
      matchScore: this.calculateMatchScore(demographics, patient),
      demographics: patient,
      identifiers: patient.mrn ? [{ system: "MRN", value: patient.mrn }] : [],
    }));

    // Return best match
    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches[0];
  }

  /**
   * Link patients across organizations
   */
  async linkPatients(
    localPatientId: string,
    externalPatientId: string,
    organizationId: string
  ): Promise<void> {
    await db.patientLink.create({
      data: {
        localPatientId,
        externalPatientId,
        organizationId,
        linkType: "seealso",
        createdAt: new Date(),
      },
    });
  }

  /**
   * Get linked patients
   */
  async getLinkedPatients(localPatientId: string): Promise<Array<{
    externalPatientId: string;
    organizationId: string;
    linkType: string;
  }>> {
    const links = await db.patientLink.findMany({
      where: { localPatientId },
    });

    return links.map((link) => ({
      externalPatientId: link.externalPatientId,
      organizationId: link.organizationId,
      linkType: link.linkType,
    }));
  }

  /**
   * Private helper methods
   */

  private async searchCarequality(request: PatientDiscoveryRequest): Promise<PatientMatch[]> {
    if (!this.carequalityClient) {
      return [];
    }

    const response = await this.carequalityClient.patientDiscovery(request);
    return response.matches;
  }

  private async searchCommonWell(request: PatientDiscoveryRequest): Promise<PatientMatch[]> {
    if (!this.commonwellClient) {
      return [];
    }

    const response = await this.commonwellClient.personSearch(request);
    return response.matches;
  }

  private deduplicateMatches(matches: PatientMatch[]): PatientMatch[] {
    const seen = new Map<string, PatientMatch>();

    for (const match of matches) {
      const key = `${match.organizationId}:${match.patientId}`;

      if (!seen.has(key) || seen.get(key)!.matchScore < match.matchScore) {
        seen.set(key, match);
      }
    }

    return Array.from(seen.values());
  }

  private calculateMatchScore(demographics: any, patient: any): number {
    let score = 0;
    let totalWeight = 0;

    // Name matching (weight: 30%)
    if (demographics.firstName && patient.firstName) {
      const weight = 0.3;
      totalWeight += weight;

      const first1 = demographics.firstName.toLowerCase();
      const first2 = patient.firstName.toLowerCase();

      if (first1 === first2) {
        score += weight;
      } else if (first1.includes(first2) || first2.includes(first1)) {
        score += weight * 0.7;
      }
    }

    if (demographics.lastName && patient.lastName) {
      const weight = 0.3;
      totalWeight += weight;

      const last1 = demographics.lastName.toLowerCase();
      const last2 = patient.lastName.toLowerCase();

      if (last1 === last2) {
        score += weight;
      } else if (last1.includes(last2) || last2.includes(last1)) {
        score += weight * 0.7;
      }
    }

    // Date of birth matching (weight: 25%)
    if (demographics.dateOfBirth && patient.dateOfBirth) {
      const weight = 0.25;
      totalWeight += weight;

      const dob1 = new Date(demographics.dateOfBirth);
      const dob2 = new Date(patient.dateOfBirth);

      if (dob1.getTime() === dob2.getTime()) {
        score += weight;
      }
    }

    // Gender matching (weight: 10%)
    if (demographics.gender && patient.gender) {
      const weight = 0.1;
      totalWeight += weight;

      if (demographics.gender === patient.gender) {
        score += weight;
      }
    }

    // SSN matching (weight: 35%)
    if (demographics.ssn && patient.ssn) {
      const weight = 0.35;
      totalWeight += weight;

      if (demographics.ssn === patient.ssn) {
        score += weight;
      } else {
        // Last 4 digits match
        const ssn1Last4 = demographics.ssn.slice(-4);
        const ssn2Last4 = patient.ssn.slice(-4);

        if (ssn1Last4 === ssn2Last4) {
          score += weight * 0.5;
        }
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }
}

/**
 * Patient Matching Algorithm Types
 */
export type MatchingAlgorithm = "deterministic" | "probabilistic" | "hybrid";

/**
 * Advanced Patient Matcher
 */
export class PatientMatcher {
  constructor(private algorithm: MatchingAlgorithm = "hybrid") {}

  /**
   * Match patients using configured algorithm
   */
  async match(
    sourcePatient: any,
    candidatePatients: any[]
  ): Promise<Array<{ patient: any; score: number; confidence: string }>> {
    const results = [];

    for (const candidate of candidatePatients) {
      const score = await this.calculateScore(sourcePatient, candidate);
      const confidence = this.determineConfidence(score);

      results.push({
        patient: candidate,
        score,
        confidence,
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Calculate match score
   */
  private async calculateScore(patient1: any, patient2: any): Promise<number> {
    switch (this.algorithm) {
      case "deterministic":
        return this.deterministicMatch(patient1, patient2);
      case "probabilistic":
        return this.probabilisticMatch(patient1, patient2);
      case "hybrid":
        return this.hybridMatch(patient1, patient2);
      default:
        return 0;
    }
  }

  /**
   * Deterministic matching
   */
  private deterministicMatch(patient1: any, patient2: any): number {
    // Exact matches only
    const exactMatches = [];

    if (patient1.ssn === patient2.ssn && patient1.ssn) {
      exactMatches.push("ssn");
    }

    if (
      patient1.firstName === patient2.firstName &&
      patient1.lastName === patient2.lastName &&
      patient1.dateOfBirth === patient2.dateOfBirth
    ) {
      exactMatches.push("demographics");
    }

    return exactMatches.length > 0 ? 1.0 : 0.0;
  }

  /**
   * Probabilistic matching (Fellegi-Sunter model)
   */
  private probabilisticMatch(patient1: any, patient2: any): number {
    // Simplified probabilistic matching
    // In production, would use proper m and u probabilities
    let score = 0;

    // Calculate field-level match probabilities
    score += this.fieldProbability("firstName", patient1.firstName, patient2.firstName);
    score += this.fieldProbability("lastName", patient1.lastName, patient2.lastName);
    score += this.fieldProbability("dateOfBirth", patient1.dateOfBirth, patient2.dateOfBirth);
    score += this.fieldProbability("gender", patient1.gender, patient2.gender);
    score += this.fieldProbability("ssn", patient1.ssn, patient2.ssn);

    return Math.min(score / 5, 1.0);
  }

  /**
   * Hybrid matching
   */
  private hybridMatch(patient1: any, patient2: any): number {
    // Start with deterministic
    const deterministic = this.deterministicMatch(patient1, patient2);

    if (deterministic === 1.0) {
      return 1.0;
    }

    // Fall back to probabilistic
    return this.probabilisticMatch(patient1, patient2);
  }

  /**
   * Calculate field-level probability
   */
  private fieldProbability(field: string, value1: any, value2: any): number {
    if (!value1 || !value2) {
      return 0;
    }

    if (value1 === value2) {
      return 1.0;
    }

    // Calculate similarity for strings
    if (typeof value1 === "string" && typeof value2 === "string") {
      return this.stringSimilarity(value1, value2);
    }

    return 0;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const len1 = s1.length;
    const len2 = s2.length;

    const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);

    return maxLen > 0 ? 1 - distance / maxLen : 0;
  }

  /**
   * Determine confidence level
   */
  private determineConfidence(score: number): string {
    if (score >= 0.9) return "high";
    if (score >= 0.7) return "medium";
    if (score >= 0.5) return "low";
    return "none";
  }
}

/**
 * Create patient discovery service
 */
export function createPatientDiscoveryService(
  config: PatientDiscoveryConfig
): PatientDiscoveryService {
  return new PatientDiscoveryService(config);
}
