/**
 * Immunization Registry Integration Client
 *
 * State immunization information system (IIS) integration using HL7v2
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { logger } from "../../utils/logger";
import { HL7Builder } from "../hl7/builder";
import { HL7Parser } from "../hl7/parser";

// Immunization Record
export interface ImmunizationRecord {
  immunizationId: string;
  patientId: string;
  vaccineCode: string; // CVX code
  vaccineName: string;
  manufacturerCode?: string; // MVX code
  lotNumber?: string;
  expirationDate?: string;
  administeredDate: string;
  administeredBy: {
    npi?: string;
    name: string;
  };
  route?: string;
  site?: string;
  doseAmount?: number;
  doseUnit?: string;
  seriesStatus?: "complete" | "incomplete" | "not_applicable";
  refusalReason?: string;
  notes?: string;
}

// Query Parameters
export interface ImmunizationQuery {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mothersFirstName?: string;
  mothersLastName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Query Response
export interface ImmunizationQueryResponse {
  queryId: string;
  patientId: string;
  immunizations: Array<{
    vaccineCode: string;
    vaccineName: string;
    manufacturer?: string;
    lotNumber?: string;
    administeredDate: string;
    providingOrganization?: string;
    historicalRecord?: boolean;
  }>;
  evaluations?: Array<{
    vaccineGroup: string;
    seriesStatus: "complete" | "incomplete" | "not_started";
    nextDueDate?: string;
    nextVaccine?: string;
  }>;
  recommendations?: Array<{
    vaccineCode: string;
    vaccineName: string;
    forecastStatus: "due" | "overdue" | "not_due" | "complete";
    dueDate?: string;
    earliestDate?: string;
    latestDate?: string;
  }>;
}

// Forecast Request
export interface ForecastRequest {
  patientId: string;
  dateOfBirth: string;
  gender: string;
  immunizationHistory: Array<{
    vaccineCode: string;
    administeredDate: string;
  }>;
  assessmentDate?: string;
}

// Forecast Response
export interface ForecastResponse {
  forecastId: string;
  assessmentDate: string;
  recommendations: Array<{
    vaccineCode: string;
    vaccineName: string;
    vaccineGroup: string;
    forecastStatus:
      | "due"
      | "overdue"
      | "not_due"
      | "complete"
      | "contraindicated";
    dueDate?: string;
    earliestDate?: string;
    latestDate?: string;
    seriesStatus: "complete" | "incomplete" | "not_started";
    doseNumber?: number;
    totalDoses?: number;
    reason?: string;
  }>;
}

/**
 * Immunization Registry Client
 */
export class ImmunizationRegistryClient {
  private client: AxiosInstance;
  private facilityId: string;
  private apiKey: string;
  private registryUrl: string;

  constructor(config: {
    baseUrl?: string;
    facilityId: string;
    apiKey: string;
    state?: string;
    timeout?: number;
  }) {
    this.facilityId = config.facilityId;
    this.apiKey = config.apiKey;
    this.registryUrl =
      config.baseUrl ||
      process.env.IIS_BASE_URL ||
      "https://iis.state.gov/api/v1";

    this.client = axios.create({
      baseURL: this.registryUrl,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
        "X-Facility-ID": this.facilityId,
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
        logger.debug("IIS Request", {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug("IIS Response", {
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        logger.error("IIS Error", {
          status: error.response?.status,
          message: error.message,
        });
        throw new ImmunizationRegistryError(
          error.message,
          error.response?.status,
          error.response?.data,
        );
      },
    );
  }

  /**
   * Submit immunization record
   */
  async submitImmunization(
    record: ImmunizationRecord,
  ): Promise<{ submissionId: string; status: string }> {
    try {
      // Build HL7 VXU^V04 message
      const hl7Message = this.buildVXUMessage(record);

      const response = await this.client.post("/immunizations/submit", {
        hl7: hl7Message,
        data: record,
      });

      logger.info("Immunization submitted to registry", {
        immunizationId: record.immunizationId,
        patientId: record.patientId,
        vaccineCode: record.vaccineCode,
      });

      return {
        submissionId: response.data.submissionId || crypto.randomUUID(),
        status: response.data.status || "submitted",
      };
    } catch (error) {
      logger.error("Failed to submit immunization", {
        immunizationId: record.immunizationId,
        error,
      });
      throw error;
    }
  }

  /**
   * Query patient immunization history
   */
  async queryImmunizations(
    query: ImmunizationQuery,
  ): Promise<ImmunizationQueryResponse> {
    try {
      // Build HL7 QBP^Q11 message
      const hl7Query = this.buildQueryMessage(query);

      const response = await this.client.post("/immunizations/query", {
        hl7: hl7Query,
        data: query,
      });

      logger.info("Immunization history queried", {
        patientId: query.patientId,
        recordsFound: response.data.immunizations?.length || 0,
      });

      return {
        queryId: response.data.queryId || crypto.randomUUID(),
        patientId: query.patientId,
        immunizations: response.data.immunizations || [],
        evaluations: response.data.evaluations,
        recommendations: response.data.recommendations,
      };
    } catch (error) {
      logger.error("Failed to query immunizations", {
        patientId: query.patientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get immunization forecast
   */
  async getForecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      const response = await this.client.post(
        "/immunizations/forecast",
        request,
      );

      logger.info("Immunization forecast generated", {
        patientId: request.patientId,
        recommendationsCount: response.data.recommendations?.length || 0,
      });

      return {
        forecastId: response.data.forecastId || crypto.randomUUID(),
        assessmentDate: request.assessmentDate || new Date().toISOString(),
        recommendations: response.data.recommendations || [],
      };
    } catch (error) {
      logger.error("Failed to get immunization forecast", {
        patientId: request.patientId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update immunization record
   */
  async updateImmunization(
    immunizationId: string,
    updates: Partial<ImmunizationRecord>,
  ): Promise<{ submissionId: string; status: string }> {
    try {
      const response = await this.client.patch(
        `/immunizations/${immunizationId}`,
        updates,
      );

      logger.info("Immunization record updated", {
        immunizationId,
      });

      return {
        submissionId: response.data.submissionId || crypto.randomUUID(),
        status: response.data.status || "updated",
      };
    } catch (error) {
      logger.error("Failed to update immunization", { immunizationId, error });
      throw error;
    }
  }

  /**
   * Delete/void immunization record
   */
  async voidImmunization(
    immunizationId: string,
    reason: string,
  ): Promise<{ status: string }> {
    try {
      const response = await this.client.delete(
        `/immunizations/${immunizationId}`,
        {
          data: { reason },
        },
      );

      logger.info("Immunization record voided", {
        immunizationId,
        reason,
      });

      return {
        status: response.data.status || "voided",
      };
    } catch (error) {
      logger.error("Failed to void immunization", { immunizationId, error });
      throw error;
    }
  }

  /**
   * Get vaccine information
   */
  async getVaccineInfo(cvxCode: string): Promise<{
    cvxCode: string;
    vaccineName: string;
    vaccineGroup: string;
    status: string;
    notes?: string;
  }> {
    try {
      const response = await this.client.get(`/vaccines/${cvxCode}`);

      return response.data;
    } catch (error) {
      logger.error("Failed to get vaccine info", { cvxCode, error });
      throw error;
    }
  }

  /**
   * Search vaccines
   */
  async searchVaccines(query: string): Promise<
    Array<{
      cvxCode: string;
      vaccineName: string;
      vaccineGroup: string;
    }>
  > {
    try {
      const response = await this.client.get("/vaccines/search", {
        params: { q: query },
      });

      return response.data.vaccines || [];
    } catch (error) {
      logger.error("Failed to search vaccines", { error });
      throw error;
    }
  }

  /**
   * Get all active vaccines
   */
  async getActiveVaccines(): Promise<
    Array<{
      cvxCode: string;
      vaccineName: string;
      vaccineGroup: string;
    }>
  > {
    try {
      const response = await this.client.get("/vaccines/active");

      return response.data.vaccines || [];
    } catch (error) {
      logger.error("Failed to get active vaccines", { error });
      throw error;
    }
  }

  /**
   * Validate immunization record
   */
  async validateRecord(record: ImmunizationRecord): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const response = await this.client.post(
        "/immunizations/validate",
        record,
      );

      return {
        valid: response.data.valid || false,
        errors: response.data.errors,
        warnings: response.data.warnings,
      };
    } catch (error) {
      logger.error("Failed to validate immunization record", { error });
      throw error;
    }
  }

  /**
   * Build VXU^V04 HL7 message (Update Immunization Record)
   */
  private buildVXUMessage(record: ImmunizationRecord): string {
    const builder = new HL7Builder();
    const messageControlId = `VXU${Date.now()}`;

    builder.addMSH("VXU", "V04", messageControlId);

    // PID segment would be added here with patient demographics
    // RXA segment for administration
    // OBX segments for observations

    return builder.build();
  }

  /**
   * Build QBP^Q11 HL7 message (Query Immunization History)
   */
  private buildQueryMessage(query: ImmunizationQuery): string {
    const builder = new HL7Builder();
    const messageControlId = `QBP${Date.now()}`;

    builder.addMSH("QBP", "Q11", messageControlId);

    // QPD segment for query parameters
    // RCP segment for response control parameters

    return builder.build();
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSubmissions: number;
    successful: number;
    failed: number;
    pending: number;
  }> {
    try {
      const response = await this.client.get("/immunizations/stats", {
        params,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to get submission stats", { error });
      throw error;
    }
  }
}

/**
 * Immunization Registry Error
 */
export class ImmunizationRegistryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ImmunizationRegistryError";
  }
}

/**
 * Create immunization registry client from environment
 */
export const immunizationRegistryClient = new ImmunizationRegistryClient({
  baseUrl: process.env.IIS_BASE_URL,
  facilityId: process.env.IIS_FACILITY_ID || "",
  apiKey: process.env.IIS_API_KEY || "",
  state: process.env.IIS_STATE,
  timeout: parseInt(process.env.IIS_TIMEOUT || "30000", 10),
});
