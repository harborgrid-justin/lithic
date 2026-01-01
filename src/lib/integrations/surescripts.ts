/**
 * Surescripts Integration
 * E-Prescribing and medication history via Surescripts
 */

import { z } from "zod";
import crypto from "crypto";

const SurescriptsConfigSchema = z.object({
  baseUrl: z.string().url(),
  accountId: z.string(),
  siteId: z.string(),
  username: z.string(),
  password: z.string(),
  timeout: z.number().default(30000),
});

type SurescriptsConfig = z.infer<typeof SurescriptsConfigSchema>;

interface Medication {
  drugName: string;
  ndc?: string;
  rxcui?: string;
  strength?: string;
  dosageForm?: string;
  directions?: string;
  quantity?: number;
  refills?: number;
  daysSupply?: number;
  prescribedDate?: Date;
  lastFilledDate?: Date;
  pharmacy?: {
    ncpdpId: string;
    name: string;
    address: string;
    phone: string;
  };
}

interface Prescription {
  prescriptionNumber: string;
  drugName: string;
  ndc?: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  refills: number;
  directions: string;
  daysSupply: number;
  substitutionsAllowed: boolean;
  priorAuthorizationRequired: boolean;
  prescriber: {
    npi: string;
    name: string;
    deaNumber?: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "M" | "F";
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  pharmacy: {
    ncpdpId: string;
    name: string;
  };
}

export class SurescriptsClient {
  private config: SurescriptsConfig;

  constructor(config: Partial<SurescriptsConfig>) {
    this.config = SurescriptsConfigSchema.parse({
      baseUrl: process.env.SURESCRIPTS_URL,
      accountId: process.env.SURESCRIPTS_ACCOUNT_ID,
      siteId: process.env.SURESCRIPTS_SITE_ID,
      username: process.env.SURESCRIPTS_USERNAME,
      password: process.env.SURESCRIPTS_PASSWORD,
      ...config,
    });
  }

  /**
   * Get medication history for patient
   */
  async getMedicationHistory(params: {
    patientFirstName: string;
    patientLastName: string;
    dateOfBirth: Date;
    gender: "M" | "F";
    zipCode?: string;
  }): Promise<Medication[]> {
    const request = this.buildMedicationHistoryRequest(params);

    const response = await this.request(
      "POST",
      "/medicationhistory/v1",
      request,
    );

    return this.parseMedicationHistoryResponse(response);
  }

  /**
   * Send new prescription (NEWRX)
   */
  async sendPrescription(prescription: Prescription): Promise<{
    success: boolean;
    referenceNumber: string;
    errors?: string[];
  }> {
    const request = this.buildNewRxRequest(prescription);

    const response = await this.request(
      "POST",
      "/prescription/v1/newrx",
      request,
    );

    return this.parseNewRxResponse(response);
  }

  /**
   * Cancel prescription (CANRX)
   */
  async cancelPrescription(params: {
    prescriptionNumber: string;
    reason: string;
  }): Promise<{ success: boolean; errors?: string[] }> {
    const request = this.buildCancelRxRequest(params);

    const response = await this.request(
      "POST",
      "/prescription/v1/canrx",
      request,
    );

    return this.parseCancelRxResponse(response);
  }

  /**
   * Refill request (REFREQ)
   */
  async requestRefill(params: {
    prescriptionNumber: string;
    patientFirstName: string;
    patientLastName: string;
    dateOfBirth: Date;
    pharmacyNCPDP: string;
  }): Promise<{ success: boolean; errors?: string[] }> {
    const request = this.buildRefillRequest(params);

    const response = await this.request(
      "POST",
      "/prescription/v1/refreq",
      request,
    );

    return this.parseRefillResponse(response);
  }

  /**
   * Search pharmacies
   */
  async searchPharmacies(params: {
    zipCode?: string;
    city?: string;
    state?: string;
    name?: string;
    radius?: number; // miles
  }): Promise<
    Array<{
      ncpdpId: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      phone: string;
      fax?: string;
      hours?: string;
      services?: string[];
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params.zipCode) queryParams.append("zipCode", params.zipCode);
    if (params.city) queryParams.append("city", params.city);
    if (params.state) queryParams.append("state", params.state);
    if (params.name) queryParams.append("name", params.name);
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const response = await this.request(
      "GET",
      `/pharmacy/search?${queryParams.toString()}`,
    );

    return this.parsePharmacySearchResponse(response);
  }

  /**
   * Check drug formulary
   */
  async checkFormulary(params: {
    ndc?: string;
    rxcui?: string;
    insuranceBIN?: string;
    insurancePCN?: string;
  }): Promise<{
    covered: boolean;
    tier?: number;
    copay?: number;
    priorAuthRequired?: boolean;
    quantityLimit?: number;
    alternatives?: Array<{
      drugName: string;
      ndc: string;
      tier: number;
      copay: number;
    }>;
  }> {
    const request = this.buildFormularyRequest(params);

    const response = await this.request("POST", "/formulary/v1/check", request);

    return this.parseFormularyResponse(response);
  }

  /**
   * Make HTTP request to Surescripts API
   */
  private async request(
    method: string,
    path: string,
    body?: any,
  ): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    };

    // Add authentication
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;

    // Add Surescripts-specific headers
    headers["X-Surescripts-Account-Id"] = this.config.accountId;
    headers["X-Surescripts-Site-Id"] = this.config.siteId;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? this.toXML(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `Surescripts API error: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();
      return this.fromXML(text);
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Build medication history request (simplified)
   */
  private buildMedicationHistoryRequest(params: any): any {
    return {
      MedicationHistoryRequest: {
        Header: {
          To: "Surescripts",
          From: this.config.siteId,
          MessageID: crypto.randomUUID(),
          SentTime: new Date().toISOString(),
        },
        Body: {
          MedicationHistoryRequest: {
            Patient: {
              Identification: {
                FirstName: params.patientFirstName,
                LastName: params.patientLastName,
                DateOfBirth: params.dateOfBirth.toISOString().split("T")[0],
                Gender: params.gender,
                ZipCode: params.zipCode,
              },
            },
          },
        },
      },
    };
  }

  /**
   * Parse medication history response (simplified)
   */
  private parseMedicationHistoryResponse(response: any): Medication[] {
    const medications: Medication[] = [];

    // Parse XML response and extract medications
    // This is a simplified version - actual implementation would parse XML properly

    return medications;
  }

  /**
   * Build new prescription request (simplified)
   */
  private buildNewRxRequest(prescription: Prescription): any {
    return {
      Message: {
        Header: {
          To: prescription.pharmacy.ncpdpId,
          From: this.config.siteId,
          MessageID: crypto.randomUUID(),
          SentTime: new Date().toISOString(),
        },
        Body: {
          NewRx: {
            Prescriber: {
              Identification: {
                NPI: prescription.prescriber.npi,
                DEA: prescription.prescriber.deaNumber,
              },
              Name: prescription.prescriber.name,
            },
            Patient: {
              Identification: {
                FirstName: prescription.patient.firstName,
                LastName: prescription.patient.lastName,
                DateOfBirth: prescription.patient.dateOfBirth
                  .toISOString()
                  .split("T")[0],
                Gender: prescription.patient.gender,
              },
              Address: {
                AddressLine1: prescription.patient.address,
                City: prescription.patient.city,
                State: prescription.patient.state,
                ZipCode: prescription.patient.zipCode,
              },
            },
            Medication: {
              DrugDescription: prescription.drugName,
              DrugCoded: {
                ProductCode: prescription.ndc,
              },
              Strength: prescription.strength,
              DosageForm: prescription.dosageForm,
              Quantity: prescription.quantity,
              Refills: prescription.refills,
              Directions: prescription.directions,
              DaysSupply: prescription.daysSupply,
              Substitutions: prescription.substitutionsAllowed
                ? "Allowed"
                : "Not Allowed",
            },
          },
        },
      },
    };
  }

  /**
   * Parse new prescription response (simplified)
   */
  private parseNewRxResponse(response: any): any {
    return {
      success: true,
      referenceNumber: response.MessageID || crypto.randomUUID(),
    };
  }

  /**
   * Build cancel prescription request (simplified)
   */
  private buildCancelRxRequest(params: any): any {
    return {
      CancelRx: {
        PrescriptionNumber: params.prescriptionNumber,
        CancellationReason: params.reason,
      },
    };
  }

  /**
   * Parse cancel prescription response (simplified)
   */
  private parseCancelRxResponse(response: any): any {
    return { success: true };
  }

  /**
   * Build refill request (simplified)
   */
  private buildRefillRequest(params: any): any {
    return {
      RefillRequest: {
        PrescriptionNumber: params.prescriptionNumber,
        Patient: {
          FirstName: params.patientFirstName,
          LastName: params.patientLastName,
          DateOfBirth: params.dateOfBirth.toISOString().split("T")[0],
        },
      },
    };
  }

  /**
   * Parse refill response (simplified)
   */
  private parseRefillResponse(response: any): any {
    return { success: true };
  }

  /**
   * Parse pharmacy search response (simplified)
   */
  private parsePharmacySearchResponse(response: any): any[] {
    return [];
  }

  /**
   * Build formulary request (simplified)
   */
  private buildFormularyRequest(params: any): any {
    return {
      FormularyCheck: params,
    };
  }

  /**
   * Parse formulary response (simplified)
   */
  private parseFormularyResponse(response: any): any {
    return {
      covered: true,
      tier: 1,
      copay: 10,
      priorAuthRequired: false,
    };
  }

  /**
   * Convert object to XML (simplified - use a proper XML library in production)
   */
  private toXML(obj: any): string {
    return JSON.stringify(obj); // Placeholder - implement proper XML conversion
  }

  /**
   * Convert XML to object (simplified - use a proper XML library in production)
   */
  private fromXML(xml: string): any {
    try {
      return JSON.parse(xml);
    } catch {
      return {}; // Placeholder - implement proper XML parsing
    }
  }
}

/**
 * Default Surescripts client instance
 */
export const surescriptsClient = new SurescriptsClient({});
