/**
 * Clearinghouse Integration Client
 *
 * EDI 837/835 transaction processing for claims and remittance
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../utils/logger';

// Claim Status
export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'pending'
  | 'paid'
  | 'denied'
  | 'appealed';

// Claim Data
export interface Claim {
  claimId: string;
  patientId: string;
  providerId: string;
  payerId: string;
  serviceDate: string;
  billingDate: string;
  totalCharges: number;
  diagnosisCodes: string[];
  procedureCodes: Array<{
    code: string;
    modifiers?: string[];
    units: number;
    chargeAmount: number;
  }>;
  placeOfService: string;
  referringProvider?: string;
  priorAuthNumber?: string;
}

// Claim Response
export interface ClaimResponse {
  claimId: string;
  submissionId: string;
  status: ClaimStatus;
  clearinghouseId: string;
  submittedAt: string;
  acknowledgmentCode?: string;
  errors?: Array<{
    code: string;
    message: string;
    segment?: string;
  }>;
}

// Remittance Advice (835)
export interface RemittanceAdvice {
  remittanceId: string;
  payerId: string;
  payerName: string;
  paymentDate: string;
  paymentAmount: number;
  checkNumber?: string;
  claims: Array<{
    claimId: string;
    patientName: string;
    serviceDate: string;
    chargedAmount: number;
    allowedAmount: number;
    paidAmount: number;
    adjustments: Array<{
      groupCode: string;
      reasonCode: string;
      amount: number;
    }>;
  }>;
}

// Eligibility Request
export interface EligibilityRequest {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  memberId: string;
  payerId: string;
  serviceType?: string;
  serviceDate?: string;
}

// Eligibility Response
export interface EligibilityResponse {
  requestId: string;
  eligible: boolean;
  coverageStatus: 'active' | 'inactive' | 'unknown';
  planName?: string;
  groupNumber?: string;
  effectiveDate?: string;
  terminationDate?: string;
  copay?: number;
  deductible?: {
    individual: number;
    family: number;
    remaining: number;
  };
  outOfPocketMax?: {
    individual: number;
    family: number;
    remaining: number;
  };
  benefits?: Array<{
    serviceType: string;
    coverageLevel: string;
    copay?: number;
    coinsurance?: number;
  }>;
}

/**
 * Clearinghouse Client
 */
export class ClearinghouseClient {
  private client: AxiosInstance;
  private submitterId: string;
  private apiKey: string;

  constructor(config: {
    baseUrl?: string;
    submitterId: string;
    apiKey: string;
    timeout?: number;
  }) {
    this.submitterId = config.submitterId;
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || process.env.CLEARINGHOUSE_BASE_URL || 'https://api.clearinghouse.com/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Submitter-ID': this.submitterId,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Clearinghouse Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Clearinghouse Response', {
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        logger.error('Clearinghouse Error', {
          status: error.response?.status,
          message: error.message,
        });
        throw new ClearinghouseError(
          error.message,
          error.response?.status,
          error.response?.data
        );
      }
    );
  }

  /**
   * Submit claim (837 Professional)
   */
  async submitClaim(claim: Claim): Promise<ClaimResponse> {
    try {
      // Convert to EDI 837 format
      const edi837 = this.buildEDI837(claim);

      const response = await this.client.post('/claims/submit', {
        claim,
        edi: edi837,
      });

      logger.info('Claim submitted to clearinghouse', {
        claimId: claim.claimId,
        submissionId: response.data.submissionId,
      });

      return {
        claimId: claim.claimId,
        submissionId: response.data.submissionId,
        status: 'submitted',
        clearinghouseId: response.data.clearinghouseId,
        submittedAt: new Date().toISOString(),
        acknowledgmentCode: response.data.acknowledgmentCode,
      };
    } catch (error) {
      logger.error('Failed to submit claim', { claimId: claim.claimId, error });
      throw error;
    }
  }

  /**
   * Submit batch of claims
   */
  async submitBatchClaims(claims: Claim[]): Promise<ClaimResponse[]> {
    try {
      const responses = await Promise.all(
        claims.map((claim) => this.submitClaim(claim))
      );

      logger.info('Batch claims submitted', {
        count: claims.length,
        successful: responses.filter((r) => r.status === 'submitted').length,
      });

      return responses;
    } catch (error) {
      logger.error('Failed to submit batch claims', { error });
      throw error;
    }
  }

  /**
   * Check claim status
   */
  async getClaimStatus(claimId: string): Promise<ClaimResponse> {
    try {
      const response = await this.client.get(`/claims/${claimId}/status`);

      return response.data;
    } catch (error) {
      logger.error('Failed to get claim status', { claimId, error });
      throw error;
    }
  }

  /**
   * Get remittance advice (835)
   */
  async getRemittanceAdvice(remittanceId: string): Promise<RemittanceAdvice> {
    try {
      const response = await this.client.get(`/remittance/${remittanceId}`);

      logger.info('Remittance advice retrieved', { remittanceId });

      return response.data;
    } catch (error) {
      logger.error('Failed to get remittance advice', { remittanceId, error });
      throw error;
    }
  }

  /**
   * List remittance advices
   */
  async listRemittanceAdvices(params?: {
    startDate?: string;
    endDate?: string;
    payerId?: string;
    status?: string;
  }): Promise<RemittanceAdvice[]> {
    try {
      const response = await this.client.get('/remittance', { params });

      logger.info('Remittance advices listed', {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to list remittance advices', { error });
      throw error;
    }
  }

  /**
   * Check eligibility (270/271)
   */
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    try {
      const response = await this.client.post('/eligibility/check', request);

      logger.info('Eligibility checked', {
        patientId: request.patientId,
        eligible: response.data.eligible,
      });

      return {
        requestId: response.data.requestId || crypto.randomUUID(),
        eligible: response.data.eligible,
        coverageStatus: response.data.coverageStatus || 'unknown',
        ...response.data,
      };
    } catch (error) {
      logger.error('Failed to check eligibility', { patientId: request.patientId, error });
      throw error;
    }
  }

  /**
   * Verify insurance coverage
   */
  async verifyInsurance(patientId: string, payerId: string, memberId: string): Promise<{
    verified: boolean;
    active: boolean;
    planName?: string;
    groupNumber?: string;
  }> {
    try {
      const response = await this.client.post('/insurance/verify', {
        patientId,
        payerId,
        memberId,
      });

      logger.info('Insurance verified', {
        patientId,
        verified: response.data.verified,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to verify insurance', { patientId, error });
      throw error;
    }
  }

  /**
   * Get payer list
   */
  async getPayers(): Promise<Array<{
    payerId: string;
    payerName: string;
    type: string;
    active: boolean;
  }>> {
    try {
      const response = await this.client.get('/payers');

      return response.data;
    } catch (error) {
      logger.error('Failed to get payers', { error });
      throw error;
    }
  }

  /**
   * Search payer by name or ID
   */
  async searchPayers(query: string): Promise<Array<{
    payerId: string;
    payerName: string;
    type: string;
  }>> {
    try {
      const response = await this.client.get('/payers/search', {
        params: { q: query },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to search payers', { error });
      throw error;
    }
  }

  /**
   * Get submission summary
   */
  async getSubmissionSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSubmitted: number;
    accepted: number;
    rejected: number;
    pending: number;
    totalAmount: number;
  }> {
    try {
      const response = await this.client.get('/claims/summary', { params });

      return response.data;
    } catch (error) {
      logger.error('Failed to get submission summary', { error });
      throw error;
    }
  }

  /**
   * Build EDI 837 transaction (simplified)
   */
  private buildEDI837(claim: Claim): string {
    // This is a highly simplified example
    // Real EDI 837 is much more complex with ISA, GS, ST segments, etc.
    const segments = [
      `ISA*00*          *00*          *ZZ*${this.submitterId.padEnd(15)}*ZZ*${claim.payerId.padEnd(15)}*${this.formatEDIDate(new Date())}*${this.formatEDITime(new Date())}*^*00501*${this.generateControlNumber()}*0*P*:~`,
      `GS*HC*${this.submitterId}*${claim.payerId}*${this.formatEDIDate(new Date())}*${this.formatEDITime(new Date())}*${this.generateControlNumber()}*X*005010X222A1~`,
      `ST*837*${this.generateControlNumber()}*005010X222A1~`,
      `BHT*0019*00*${claim.claimId}*${this.formatEDIDate(new Date())}*${this.formatEDITime(new Date())}*CH~`,
      // ... many more segments for a real 837
      `SE*10*${this.generateControlNumber()}~`,
      `GE*1*${this.generateControlNumber()}~`,
      `IEA*1*${this.generateControlNumber()}~`,
    ];

    return segments.join('\n');
  }

  /**
   * Format date for EDI (YYYYMMDD)
   */
  private formatEDIDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format time for EDI (HHmm)
   */
  private formatEDITime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}${minutes}`;
  }

  /**
   * Generate EDI control number
   */
  private generateControlNumber(): string {
    return String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  }
}

/**
 * Clearinghouse Error
 */
export class ClearinghouseError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ClearinghouseError';
  }
}

/**
 * Create clearinghouse client from environment
 */
export const clearinghouseClient = new ClearinghouseClient({
  baseUrl: process.env.CLEARINGHOUSE_BASE_URL,
  submitterId: process.env.CLEARINGHOUSE_SUBMITTER_ID || '',
  apiKey: process.env.CLEARINGHOUSE_API_KEY || '',
  timeout: parseInt(process.env.CLEARINGHOUSE_TIMEOUT || '30000', 10),
});
