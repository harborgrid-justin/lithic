/**
 * Immunization Registry Integration
 * Submit and query immunization records via state/national registries (IIS/IZ)
 */

import { z } from "zod";

const ImmunizationRegistryConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
  facilityId: z.string(),
  hl7Enabled: z.boolean().default(true),
  timeout: z.number().default(30000),
});

type ImmunizationRegistryConfig = z.infer<
  typeof ImmunizationRegistryConfigSchema
>;

export interface ImmunizationRecord {
  patient: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: "M" | "F";
    ssn?: string;
    mothersName?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  immunization: {
    vaccineCode: string; // CVX code
    vaccineGroup?: string; // Vaccine group
    administeredDate: Date;
    manufacturer?: string; // MVX code
    lotNumber?: string;
    expirationDate?: Date;
    route: string;
    site: string;
    doseNumber?: number;
    seriesComplete?: boolean;
    amount?: number;
    amountUnit?: string;
  };
  administrator: {
    npi?: string;
    name: string;
    organization: string;
  };
  facility: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  refusalInfo?: {
    refused: boolean;
    reason?: string;
    date?: Date;
  };
  adverseReaction?: {
    occurred: boolean;
    description?: string;
    severity?: "Mild" | "Moderate" | "Severe";
  };
}

export interface ImmunizationHistory {
  patient: {
    id: string;
    name: string;
    dateOfBirth: Date;
  };
  immunizations: Array<{
    vaccineCode: string;
    vaccineName: string;
    administeredDate: Date;
    provider: string;
    lotNumber?: string;
    doseNumber?: number;
    manufacturer?: string;
  }>;
  forecasts: Array<{
    vaccineGroup: string;
    vaccineName: string;
    dueDate: Date;
    overdueDate?: Date;
    status: "Due" | "Overdue" | "Complete" | "Not Recommended";
    earliestDate?: Date;
  }>;
}

export class ImmunizationRegistryClient {
  private config: ImmunizationRegistryConfig;

  constructor(config: Partial<ImmunizationRegistryConfig>) {
    this.config = ImmunizationRegistryConfigSchema.parse({
      baseUrl: process.env.IIS_URL,
      apiKey: process.env.IIS_API_KEY,
      facilityId: process.env.IIS_FACILITY_ID,
      ...config,
    });
  }

  /**
   * Submit immunization record (VXU message)
   */
  async submitImmunization(record: ImmunizationRecord): Promise<{
    success: boolean;
    messageId: string;
    errors?: string[];
  }> {
    if (this.config.hl7Enabled) {
      const vxuMessage = this.buildVXUMessage(record);

      const response = await this.request("POST", "/immunization/submit", {
        format: "HL7",
        message: vxuMessage,
      });

      return {
        success: response.acknowledgment === "AA",
        messageId: response.messageId,
        errors: response.errors,
      };
    } else {
      // REST API submission
      const response = await this.request("POST", "/immunization", record);

      return {
        success: response.success,
        messageId: response.id,
        errors: response.errors,
      };
    }
  }

  /**
   * Query patient immunization history (QBP/RSP message)
   */
  async getImmunizationHistory(params: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender?: "M" | "F";
    mothersName?: string;
  }): Promise<ImmunizationHistory> {
    if (this.config.hl7Enabled) {
      const qbpMessage = this.buildQBPMessage(params);

      const response = await this.request("POST", "/immunization/query", {
        format: "HL7",
        message: qbpMessage,
      });

      return this.parseRSPMessage(response.message);
    } else {
      // REST API query
      const queryParams = new URLSearchParams({
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: params.dateOfBirth.toISOString().split("T")[0],
        ...(params.gender && { gender: params.gender }),
      });

      const response = await this.request(
        "GET",
        `/immunization/history?${queryParams}`,
      );

      return response;
    }
  }

  /**
   * Get immunization forecast
   */
  async getForecast(params: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "M" | "F";
    evaluationDate?: Date;
  }): Promise<
    Array<{
      vaccineGroup: string;
      recommendedVaccine: string;
      dueDate: Date;
      overdueDate?: Date;
      status: "Due" | "Overdue" | "Complete";
      dose: number;
    }>
  > {
    const queryParams = new URLSearchParams({
      firstName: params.firstName,
      lastName: params.lastName,
      dateOfBirth: params.dateOfBirth.toISOString().split("T")[0],
      gender: params.gender,
      evaluationDate: (params.evaluationDate || new Date())
        .toISOString()
        .split("T")[0],
    });

    const response = await this.request(
      "GET",
      `/immunization/forecast?${queryParams}`,
    );

    return response.forecasts || [];
  }

  /**
   * Submit adverse reaction report (VAERS)
   */
  async reportAdverseReaction(params: {
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: "M" | "F";
    };
    vaccine: {
      code: string;
      name: string;
      manufacturer: string;
      lotNumber: string;
      administeredDate: Date;
    };
    reaction: {
      description: string;
      onsetDate: Date;
      severity: "Mild" | "Moderate" | "Severe" | "Life-threatening" | "Death";
      hospitalized: boolean;
      disability: boolean;
      recovered: boolean;
    };
    reporter: {
      name: string;
      phone: string;
      email?: string;
    };
  }): Promise<{ success: boolean; reportId: string }> {
    const response = await this.request(
      "POST",
      "/adverse-reaction/report",
      params,
    );

    return {
      success: response.success,
      reportId: response.reportId,
    };
  }

  /**
   * Build VXU (Vaccine Update) HL7 message
   */
  private buildVXUMessage(record: ImmunizationRecord): string {
    const segments: string[] = [];
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .substring(0, 14);

    // MSH - Message Header
    segments.push(
      `MSH|^~\\&|${this.config.facilityId}|FACILITY|IIS|STATE|${timestamp}||VXU^V04^VXU_V04|${Date.now()}|P|2.5.1|||NE|NE|||||Z22^CDCPHINVS`,
    );

    // PID - Patient Identification
    segments.push(
      `PID|1||^^^MPI^MR||${record.patient.lastName}^${record.patient.firstName}^${record.patient.middleName || ""}||${this.formatHL7Date(record.patient.dateOfBirth)}|${record.patient.gender}|||${record.patient.address?.street || ""}^^${record.patient.address?.city || ""}^${record.patient.address?.state || ""}^${record.patient.address?.zipCode || ""}|||||||${record.patient.ssn || ""}`,
    );

    // NK1 - Next of Kin (Mother's Name)
    if (record.patient.mothersName) {
      segments.push(`NK1|1|${record.patient.mothersName}^|MTH^Mother^HL70063`);
    }

    // ORC - Common Order
    segments.push(
      `ORC|RE||${Date.now()}|||||||${record.administrator.npi || ""}^${record.administrator.name}^^^^^^^NPI`,
    );

    // RXA - Pharmacy/Treatment Administration
    const rxaFields = [
      "RXA",
      "0",
      "1",
      this.formatHL7DateTime(record.immunization.administeredDate),
      this.formatHL7DateTime(record.immunization.administeredDate),
      `${record.immunization.vaccineCode}^${record.immunization.vaccineCode}^CVX`,
      record.immunization.amount || "",
      record.immunization.amountUnit || "mL",
      "",
      "",
      `${record.administrator.npi || ""}^${record.administrator.name}`,
      record.facility.name,
      "",
      record.immunization.lotNumber || "",
      record.immunization.expirationDate
        ? this.formatHL7Date(record.immunization.expirationDate)
        : "",
      record.immunization.manufacturer || "",
      record.refusalInfo?.refused ? "RE^Refused^NIP002" : "",
      "",
      "",
      "",
      record.immunization.seriesComplete ? "CP" : "",
    ];
    segments.push(rxaFields.join("|"));

    // RXR - Pharmacy/Treatment Route
    segments.push(
      `RXR|${record.immunization.route}^${record.immunization.route}^NCIT||${record.immunization.site}^${record.immunization.site}^HL70163`,
    );

    // OBX - Observation (Dose Number)
    if (record.immunization.doseNumber) {
      segments.push(
        `OBX|1|NM|30973-2^Dose number in series^LN||${record.immunization.doseNumber}||||||F`,
      );
    }

    // OBX - Adverse Reaction
    if (record.adverseReaction?.occurred) {
      segments.push(
        `OBX|2|CE|31044-1^Reaction^LN||${record.adverseReaction.description}||||||F`,
      );
    }

    return segments.join("\r");
  }

  /**
   * Build QBP (Query by Parameter) HL7 message
   */
  private buildQBPMessage(params: any): string {
    const segments: string[] = [];
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .substring(0, 14);

    // MSH - Message Header
    segments.push(
      `MSH|^~\\&|${this.config.facilityId}|FACILITY|IIS|STATE|${timestamp}||QBP^Q11^QBP_Q11|${Date.now()}|P|2.5.1|||NE|NE|||||Z34^CDCPHINVS`,
    );

    // QPD - Query Parameter Definition
    segments.push(
      `QPD|Z34^Request Immunization History^CDCPHINVS|${Date.now()}|${params.lastName}^${params.firstName}^${params.middleName || ""}^^^^L||${this.formatHL7Date(params.dateOfBirth)}|${params.gender || ""}|${params.mothersName || ""}^^^^^M`,
    );

    // RCP - Response Control Parameter
    segments.push("RCP|I|1|||||||");

    return segments.join("\r");
  }

  /**
   * Parse RSP (Response) HL7 message
   */
  private parseRSPMessage(message: string): ImmunizationHistory {
    // Simplified parser - actual implementation would parse HL7 segments properly
    return {
      patient: {
        id: "",
        name: "",
        dateOfBirth: new Date(),
      },
      immunizations: [],
      forecasts: [],
    };
  }

  /**
   * Format date for HL7 (YYYYMMDD)
   */
  private formatHL7Date(date: Date): string {
    return date.toISOString().substring(0, 10).replace(/-/g, "");
  }

  /**
   * Format datetime for HL7 (YYYYMMDDHHmmss)
   */
  private formatHL7DateTime(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").substring(0, 14);
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
      "X-Facility-ID": this.config.facilityId,
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
        throw new Error(`Immunization Registry API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

export const immunizationRegistryClient = new ImmunizationRegistryClient({});
