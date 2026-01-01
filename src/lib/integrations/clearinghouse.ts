/**
 * Claims Clearinghouse Integration
 * Submit and track insurance claims via clearinghouse (e.g., Change Healthcare, Availity)
 */

import { z } from "zod";

const ClearinghouseConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
  submitterId: z.string(),
  timeout: z.number().default(60000),
});

type ClearinghouseConfig = z.infer<typeof ClearinghouseConfigSchema>;

export interface Claim {
  claimId: string;
  patientInfo: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "M" | "F";
  };
  subscriberInfo?: {
    memberId: string;
    firstName: string;
    lastName: string;
    relationship: "Self" | "Spouse" | "Child" | "Other";
  };
  providerInfo: {
    npi: string;
    taxId: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  payerInfo: {
    payerId: string;
    name: string;
  };
  claimInfo: {
    claimType: "Professional" | "Institutional";
    serviceDate: Date;
    diagnosisCodes: string[];
    serviceLin: Array<{
      procedureCode: string;
      modifier?: string[];
      units: number;
      chargeAmount: number;
      placeOfService: string;
      diagnosisPointers?: number[];
    }>;
    totalCharges: number;
  };
}

export interface ClaimStatus {
  claimId: string;
  status: "Submitted" | "Accepted" | "Rejected" | "Paid" | "Denied" | "Pending";
  submittedDate?: Date;
  paidAmount?: number;
  allowedAmount?: number;
  denialReason?: string;
  remittanceDate?: Date;
  checkNumber?: string;
  adjustments?: Array<{
    group: string;
    code: string;
    amount: number;
    description: string;
  }>;
}

export class ClearinghouseClient {
  private config: ClearinghouseConfig;

  constructor(config: Partial<ClearinghouseConfig>) {
    this.config = ClearinghouseConfigSchema.parse({
      baseUrl: process.env.CLEARINGHOUSE_URL,
      apiKey: process.env.CLEARINGHOUSE_API_KEY,
      submitterId: process.env.CLEARINGHOUSE_SUBMITTER_ID,
      ...config,
    });
  }

  /**
   * Submit claim (837 Professional/Institutional)
   */
  async submitClaim(claim: Claim): Promise<{
    success: boolean;
    submissionId: string;
    errors?: string[];
  }> {
    const edi837 = this.buildEDI837(claim);

    const response = await this.request("POST", "/claims/submit", {
      submitterId: this.config.submitterId,
      format: "837",
      content: edi837,
    });

    return {
      success: response.accepted,
      submissionId: response.submissionId,
      errors: response.errors,
    };
  }

  /**
   * Check claim status (276/277)
   */
  async getClaimStatus(claimId: string): Promise<ClaimStatus> {
    const response = await this.request("GET", `/claims/${claimId}/status`);

    return this.parseClaimStatus(response);
  }

  /**
   * Get remittance advice (835 ERA)
   */
  async getRemittance(params: {
    payerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      remittanceId: string;
      payerId: string;
      payerName: string;
      checkNumber: string;
      checkDate: Date;
      totalPaid: number;
      claims: Array<{
        claimId: string;
        patientName: string;
        serviceDate: Date;
        chargedAmount: number;
        allowedAmount: number;
        paidAmount: number;
        adjustments: Array<{
          code: string;
          amount: number;
          description: string;
        }>;
      }>;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params.payerId) queryParams.append("payerId", params.payerId);
    if (params.startDate)
      queryParams.append("startDate", params.startDate.toISOString());
    if (params.endDate)
      queryParams.append("endDate", params.endDate.toISOString());

    const response = await this.request(
      "GET",
      `/remittance?${queryParams.toString()}`,
    );

    return this.parseRemittance(response);
  }

  /**
   * Batch claim submission
   */
  async submitBatch(claims: Claim[]): Promise<{
    batchId: string;
    totalClaims: number;
    accepted: number;
    rejected: number;
    errors: Array<{
      claimId: string;
      error: string;
    }>;
  }> {
    const batch = claims.map((claim) => this.buildEDI837(claim));

    const response = await this.request("POST", "/claims/batch", {
      submitterId: this.config.submitterId,
      claims: batch,
    });

    return {
      batchId: response.batchId,
      totalClaims: claims.length,
      accepted: response.accepted || 0,
      rejected: response.rejected || 0,
      errors: response.errors || [],
    };
  }

  /**
   * Void/correct claim
   */
  async voidClaim(
    claimId: string,
    reason: string,
  ): Promise<{ success: boolean }> {
    const response = await this.request("POST", `/claims/${claimId}/void`, {
      reason,
    });

    return { success: response.success };
  }

  /**
   * Build EDI 837 format (simplified)
   */
  private buildEDI837(claim: Claim): string {
    // This is a simplified version - actual EDI 837 is complex
    const segments: string[] = [];

    // ISA - Interchange Control Header
    segments.push(
      "ISA*00*          *00*          *ZZ*SUBMITTER      *ZZ*RECEIVER       *" +
        new Date().toISOString().replace(/[-:]/g, "").substring(0, 12) +
        "*:*^*00501*000000001*0*P*:~",
    );

    // GS - Functional Group Header
    segments.push(
      "GS*HC*SUBMITTER*RECEIVER*" +
        new Date().toISOString().substring(0, 10).replace(/-/g, "") +
        "*" +
        new Date().toISOString().substring(11, 16).replace(":", "") +
        "*1*X*005010X222A1~",
    );

    // ST - Transaction Set Header
    segments.push("ST*837*0001*005010X222A1~");

    // BHT - Beginning of Hierarchical Transaction
    segments.push(
      "BHT*0019*00*" +
        claim.claimId +
        "*" +
        new Date().toISOString().substring(0, 10).replace(/-/g, "") +
        "*" +
        new Date().toISOString().substring(11, 16).replace(":", "") +
        "*CH~",
    );

    // Add more segments for complete 837...
    // NM1, N3, N4, REF, PER for submitter, receiver, provider, patient
    // CLM, DTP, HI for claim information
    // LX, SV1 for service lines

    // SE - Transaction Set Trailer
    segments.push("SE*" + (segments.length + 1) + "*0001~");

    // GE - Functional Group Trailer
    segments.push("GE*1*1~");

    // IEA - Interchange Control Trailer
    segments.push("IEA*1*000000001~");

    return segments.join("\n");
  }

  /**
   * Parse claim status response
   */
  private parseClaimStatus(response: any): ClaimStatus {
    return {
      claimId: response.claimId,
      status: response.status || "Pending",
      submittedDate: response.submittedDate
        ? new Date(response.submittedDate)
        : undefined,
      paidAmount: response.paidAmount,
      allowedAmount: response.allowedAmount,
      denialReason: response.denialReason,
      remittanceDate: response.remittanceDate
        ? new Date(response.remittanceDate)
        : undefined,
      checkNumber: response.checkNumber,
      adjustments: response.adjustments || [],
    };
  }

  /**
   * Parse remittance response
   */
  private parseRemittance(response: any): any[] {
    return response.remittances || [];
  }

  /**
   * Make HTTP request
   */
  private async request(
    method: string,
    path: string,
    body?: any,
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Clearinghouse API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

export const clearinghouseClient = new ClearinghouseClient({});
