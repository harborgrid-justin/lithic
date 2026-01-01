/**
 * Insurance Eligibility Verification Client
 *
 * Real-time insurance eligibility and benefits verification
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { logger } from "../../utils/logger";

// Coverage Level
export type CoverageLevel =
  | "individual"
  | "family"
  | "employee"
  | "spouse"
  | "child";

// Service Type
export type ServiceType =
  | "medical"
  | "surgical"
  | "consultation"
  | "diagnostic_xray"
  | "diagnostic_lab"
  | "radiation_therapy"
  | "anesthesia"
  | "surgical_assistance"
  | "emergency_services"
  | "preventive_care"
  | "pharmacy"
  | "vision"
  | "dental"
  | "mental_health";

// Verification Request
export interface VerificationRequest {
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
    memberId: string;
    ssn?: string;
  };
  subscriber?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    memberId: string;
    relationship: string;
  };
  insurance: {
    payerId: string;
    payerName: string;
    groupNumber?: string;
    planNumber?: string;
  };
  provider: {
    npi: string;
    taxId: string;
    lastName: string;
    firstName?: string;
  };
  serviceType?: ServiceType;
  serviceDate?: string;
}

// Verification Result
export interface VerificationResult {
  verificationId: string;
  requestDate: string;
  responseDate: string;
  status: "active" | "inactive" | "pending" | "error";
  eligible: boolean;
  coverage: {
    active: boolean;
    effectiveDate?: string;
    terminationDate?: string;
    planName?: string;
    planType?: string;
    groupNumber?: string;
    coverageLevel?: CoverageLevel;
  };
  benefits?: {
    deductible?: {
      individual?: {
        total: number;
        used: number;
        remaining: number;
      };
      family?: {
        total: number;
        used: number;
        remaining: number;
      };
    };
    outOfPocketMax?: {
      individual?: {
        total: number;
        used: number;
        remaining: number;
      };
      family?: {
        total: number;
        used: number;
        remaining: number;
      };
    };
    copay?: Record<ServiceType, number>;
    coinsurance?: number;
  };
  limitations?: string[];
  notes?: string[];
  errors?: string[];
  raw?: any;
}

// Prior Authorization
export interface PriorAuthRequest {
  patientId: string;
  providerId: string;
  serviceType: string;
  procedureCode: string;
  diagnosis: string[];
  serviceDate: string;
  urgency: "routine" | "urgent" | "emergency";
  clinicalInfo?: string;
}

export interface PriorAuthResponse {
  authorizationId: string;
  status: "approved" | "denied" | "pending" | "more_info_needed";
  authNumber?: string;
  expirationDate?: string;
  approvedUnits?: number;
  denialReason?: string;
  requestedInfo?: string[];
}

/**
 * Eligibility Client
 */
export class EligibilityClient {
  private client: AxiosInstance;
  private providerId: string;
  private apiKey: string;

  constructor(config: {
    baseUrl?: string;
    providerId: string;
    apiKey: string;
    timeout?: number;
  }) {
    this.providerId = config.providerId;
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL:
        config.baseUrl ||
        process.env.ELIGIBILITY_BASE_URL ||
        "https://api.eligibility.com/v1",
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
        "X-Provider-ID": this.providerId,
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
        logger.debug("Eligibility Request", {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug("Eligibility Response", {
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        logger.error("Eligibility Error", {
          status: error.response?.status,
          message: error.message,
        });
        throw new EligibilityError(
          error.message,
          error.response?.status,
          error.response?.data,
        );
      },
    );
  }

  /**
   * Verify insurance eligibility
   */
  async verifyEligibility(
    request: VerificationRequest,
  ): Promise<VerificationResult> {
    try {
      const response = await this.client.post("/verify", request);

      const result: VerificationResult = {
        verificationId: response.data.verificationId || crypto.randomUUID(),
        requestDate: new Date().toISOString(),
        responseDate: response.data.responseDate || new Date().toISOString(),
        status: response.data.status || "active",
        eligible: response.data.eligible || false,
        coverage: response.data.coverage || {},
        benefits: response.data.benefits,
        limitations: response.data.limitations,
        notes: response.data.notes,
        errors: response.data.errors,
        raw: response.data,
      };

      logger.info("Eligibility verified", {
        verificationId: result.verificationId,
        patientId: request.patientId,
        eligible: result.eligible,
      });

      return result;
    } catch (error) {
      logger.error("Failed to verify eligibility", {
        patientId: request.patientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get verification history for patient
   */
  async getVerificationHistory(
    patientId: string,
    limit: number = 10,
  ): Promise<VerificationResult[]> {
    try {
      const response = await this.client.get(`/verify/history/${patientId}`, {
        params: { limit },
      });

      return response.data.verifications || [];
    } catch (error) {
      logger.error("Failed to get verification history", { patientId, error });
      throw error;
    }
  }

  /**
   * Get specific verification by ID
   */
  async getVerification(verificationId: string): Promise<VerificationResult> {
    try {
      const response = await this.client.get(`/verify/${verificationId}`);

      return response.data;
    } catch (error) {
      logger.error("Failed to get verification", { verificationId, error });
      throw error;
    }
  }

  /**
   * Request prior authorization
   */
  async requestPriorAuth(
    request: PriorAuthRequest,
  ): Promise<PriorAuthResponse> {
    try {
      const response = await this.client.post("/prior-auth", request);

      logger.info("Prior authorization requested", {
        authorizationId: response.data.authorizationId,
        patientId: request.patientId,
        status: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to request prior authorization", {
        patientId: request.patientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Check prior authorization status
   */
  async getPriorAuthStatus(
    authorizationId: string,
  ): Promise<PriorAuthResponse> {
    try {
      const response = await this.client.get(`/prior-auth/${authorizationId}`);

      return response.data;
    } catch (error) {
      logger.error("Failed to get prior auth status", {
        authorizationId,
        error,
      });
      throw error;
    }
  }

  /**
   * Batch verify eligibility
   */
  async batchVerify(
    requests: VerificationRequest[],
  ): Promise<VerificationResult[]> {
    try {
      const response = await this.client.post("/verify/batch", { requests });

      logger.info("Batch eligibility verification completed", {
        count: requests.length,
        successful: response.data.results?.length || 0,
      });

      return response.data.results || [];
    } catch (error) {
      logger.error("Failed to batch verify eligibility", { error });
      throw error;
    }
  }

  /**
   * Get supported payers
   */
  async getSupportedPayers(): Promise<
    Array<{
      payerId: string;
      payerName: string;
      type: string;
      states: string[];
      realTime: boolean;
    }>
  > {
    try {
      const response = await this.client.get("/payers");

      return response.data.payers || [];
    } catch (error) {
      logger.error("Failed to get supported payers", { error });
      throw error;
    }
  }

  /**
   * Search payer by name
   */
  async searchPayer(name: string): Promise<
    Array<{
      payerId: string;
      payerName: string;
      type: string;
    }>
  > {
    try {
      const response = await this.client.get("/payers/search", {
        params: { name },
      });

      return response.data.payers || [];
    } catch (error) {
      logger.error("Failed to search payers", { error });
      throw error;
    }
  }

  /**
   * Get coverage summary
   */
  async getCoverageSummary(
    patientId: string,
    memberId: string,
    payerId: string,
  ): Promise<{
    active: boolean;
    planName?: string;
    effectiveDate?: string;
    terminationDate?: string;
    deductibleRemaining?: number;
    outOfPocketRemaining?: number;
  }> {
    try {
      const response = await this.client.get("/coverage/summary", {
        params: { patientId, memberId, payerId },
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to get coverage summary", { patientId, error });
      throw error;
    }
  }

  /**
   * Validate insurance card information
   */
  async validateInsuranceCard(cardData: {
    memberId: string;
    groupNumber?: string;
    payerId: string;
    cardholderName: string;
  }): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    try {
      const response = await this.client.post("/validate-card", cardData);

      return {
        valid: response.data.valid || false,
        errors: response.data.errors,
      };
    } catch (error) {
      logger.error("Failed to validate insurance card", { error });
      throw error;
    }
  }
}

/**
 * Eligibility Error
 */
export class EligibilityError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "EligibilityError";
  }
}

/**
 * Create eligibility client from environment
 */
export const eligibilityClient = new EligibilityClient({
  baseUrl: process.env.ELIGIBILITY_BASE_URL,
  providerId: process.env.ELIGIBILITY_PROVIDER_ID || "",
  apiKey: process.env.ELIGIBILITY_API_KEY || "",
  timeout: parseInt(process.env.ELIGIBILITY_TIMEOUT || "30000", 10),
});
