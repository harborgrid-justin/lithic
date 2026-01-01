// Claims Service - Handles all claims-related business logic

import {
  Claim,
  ClaimStatus,
  Denial,
  EligibilityResponse,
  ERA,
  EDI837Data,
  EDI835Data,
  Insurance,
  CPTCode,
  ICDCode,
} from "@/types/billing";
import { generateClaimNumber } from "@/lib/billing-utils";

class ClaimsService {
  private apiBase = "/api/billing";

  // Claim Operations
  async getClaims(): Promise<Claim[]> {
    const response = await fetch(`${this.apiBase}/claims`);
    if (!response.ok) throw new Error("Failed to fetch claims");
    return response.json();
  }

  async getClaimById(id: string): Promise<Claim> {
    const response = await fetch(`${this.apiBase}/claims/${id}`);
    if (!response.ok) throw new Error("Failed to fetch claim");
    return response.json();
  }

  async createClaim(data: Partial<Claim>): Promise<Claim> {
    const claimData = {
      ...data,
      claimNumber: generateClaimNumber(),
      status: "draft" as ClaimStatus,
    };

    const response = await fetch(`${this.apiBase}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claimData),
    });
    if (!response.ok) throw new Error("Failed to create claim");
    return response.json();
  }

  async updateClaim(id: string, data: Partial<Claim>): Promise<Claim> {
    const response = await fetch(`${this.apiBase}/claims/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update claim");
    return response.json();
  }

  async deleteClaim(id: string): Promise<void> {
    const response = await fetch(`${this.apiBase}/claims/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete claim");
  }

  async submitClaim(id: string): Promise<Claim> {
    const response = await fetch(`${this.apiBase}/claims/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId: id }),
    });
    if (!response.ok) throw new Error("Failed to submit claim");
    return response.json();
  }

  async resubmitClaim(id: string): Promise<Claim> {
    return this.submitClaim(id);
  }

  // EDI Operations
  async generateEDI837(claimId: string): Promise<EDI837Data> {
    const response = await fetch(`${this.apiBase}/claims/${claimId}/edi837`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to generate EDI 837");
    return response.json();
  }

  async processEDI835(eraData: string): Promise<EDI835Data> {
    const response = await fetch(`${this.apiBase}/era`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eraData }),
    });
    if (!response.ok) throw new Error("Failed to process EDI 835");
    return response.json();
  }

  async postERA(eraId: string): Promise<void> {
    const response = await fetch(`${this.apiBase}/era/${eraId}/post`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to post ERA");
  }

  // Eligibility Verification
  async checkEligibility(
    patientId: string,
    insuranceId: string,
  ): Promise<EligibilityResponse> {
    const response = await fetch(`${this.apiBase}/eligibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, insuranceId }),
    });
    if (!response.ok) throw new Error("Failed to check eligibility");
    return response.json();
  }

  // Denial Management
  async getDenials(): Promise<Denial[]> {
    const response = await fetch(`${this.apiBase}/denials`);
    if (!response.ok) throw new Error("Failed to fetch denials");
    return response.json();
  }

  async getDenialById(id: string): Promise<Denial> {
    const response = await fetch(`${this.apiBase}/denials/${id}`);
    if (!response.ok) throw new Error("Failed to fetch denial");
    return response.json();
  }

  async createDenial(data: Partial<Denial>): Promise<Denial> {
    const response = await fetch(`${this.apiBase}/denials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create denial");
    return response.json();
  }

  async updateDenial(id: string, data: Partial<Denial>): Promise<Denial> {
    const response = await fetch(`${this.apiBase}/denials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update denial");
    return response.json();
  }

  async appealDenial(id: string, appealNotes: string): Promise<Denial> {
    return this.updateDenial(id, {
      status: "appealed",
      appealDate: new Date().toISOString(),
      appealNotes,
    });
  }

  // Coding Operations
  async searchCPTCodes(query: string): Promise<CPTCode[]> {
    const response = await fetch(
      `${this.apiBase}/coding/cpt?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error("Failed to search CPT codes");
    return response.json();
  }

  async searchICDCodes(query: string): Promise<ICDCode[]> {
    const response = await fetch(
      `${this.apiBase}/coding/icd?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error("Failed to search ICD codes");
    return response.json();
  }

  async getCPTCodeByCode(code: string): Promise<CPTCode> {
    const response = await fetch(`${this.apiBase}/coding/cpt/${code}`);
    if (!response.ok) throw new Error("Failed to fetch CPT code");
    return response.json();
  }

  async getICDCodeByCode(code: string): Promise<ICDCode> {
    const response = await fetch(`${this.apiBase}/coding/icd/${code}`);
    if (!response.ok) throw new Error("Failed to fetch ICD code");
    return response.json();
  }

  // Utility Functions
  calculateClaimTotal(claim: Claim): number {
    return claim.codes.reduce((sum, code) => sum + code.totalPrice, 0);
  }

  getClaimBalance(claim: Claim): number {
    const total = this.calculateClaimTotal(claim);
    const paid = claim.paidAmount || 0;
    return total - paid;
  }

  isClaimDenied(claim: Claim): boolean {
    return claim.status === "denied";
  }

  isClaimPaid(claim: Claim): boolean {
    return claim.status === "paid";
  }

  getClaimAge(claim: Claim): number {
    const dos = new Date(claim.dateOfService);
    const today = new Date();
    return Math.floor(
      (today.getTime() - dos.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  filterClaimsByStatus(claims: Claim[], status: ClaimStatus): Claim[] {
    return claims.filter((claim) => claim.status === status);
  }

  filterClaimsByDateRange(
    claims: Claim[],
    startDate: string,
    endDate: string,
  ): Claim[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return claims.filter((claim) => {
      const dos = new Date(claim.dateOfService);
      return dos >= start && dos <= end;
    });
  }

  calculateTotalCharges(claims: Claim[]): number {
    return claims.reduce(
      (sum, claim) => sum + this.calculateClaimTotal(claim),
      0,
    );
  }

  calculateTotalPayments(claims: Claim[]): number {
    return claims.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0);
  }

  getDenialRate(claims: Claim[]): number {
    if (claims.length === 0) return 0;
    const deniedClaims = claims.filter((c) => c.status === "denied").length;
    return Math.round((deniedClaims / claims.length) * 100);
  }
}

export const claimsService = new ClaimsService();
export default claimsService;
