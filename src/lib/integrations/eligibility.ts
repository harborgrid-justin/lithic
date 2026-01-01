/**
 * Insurance Eligibility Verification
 * Real-time eligibility checks (270/271 transactions)
 */

import { z } from 'zod';

const EligibilityConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
  timeout: z.number().default(15000),
});

type EligibilityConfig = z.infer<typeof EligibilityConfigSchema>;

export interface EligibilityRequest {
  patient: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender?: 'M' | 'F';
  };
  subscriber?: {
    memberId: string;
    firstName: string;
    lastName: string;
    relationship: 'Self' | 'Spouse' | 'Child' | 'Other';
  };
  provider: {
    npi: string;
    taxId?: string;
  };
  payer: {
    payerId: string;
    name?: string;
  };
  serviceType?: string[];
  serviceDate?: Date;
}

export interface EligibilityResponse {
  eligible: boolean;
  status: 'Active' | 'Inactive' | 'Terminated';
  effectiveDate?: Date;
  terminationDate?: Date;
  planInfo: {
    planName?: string;
    planType?: string;
    groupNumber?: string;
  };
  coverages: Array<{
    serviceType: string;
    serviceTypeName: string;
    status: 'Active' | 'Inactive';
    deductible?: {
      individual: {
        total: number;
        remaining: number;
      };
      family?: {
        total: number;
        remaining: number;
      };
    };
    outOfPocketMax?: {
      individual: {
        total: number;
        remaining: number;
      };
      family?: {
        total: number;
        remaining: number;
      };
    };
    copay?: {
      amount: number;
      percentage?: number;
    };
    coinsurance?: number; // percentage
    limitations?: string[];
  }>;
  additionalInfo?: {
    priorAuthRequired?: boolean;
    referralRequired?: boolean;
    pcpName?: string;
    pcpPhone?: string;
  };
  errors?: string[];
}

export class EligibilityClient {
  private config: EligibilityConfig;

  constructor(config: Partial<EligibilityConfig>) {
    this.config = EligibilityConfigSchema.parse({
      baseUrl: process.env.ELIGIBILITY_API_URL,
      apiKey: process.env.ELIGIBILITY_API_KEY,
      ...config,
    });
  }

  /**
   * Check eligibility (270/271 transaction)
   */
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    const edi270 = this.buildEDI270(request);

    const response = await this.request('POST', '/eligibility/check', {
      transaction: edi270,
    });

    return this.parseEDI271(response);
  }

  /**
   * Batch eligibility check
   */
  async checkBatch(requests: EligibilityRequest[]): Promise<Array<{
    request: EligibilityRequest;
    response?: EligibilityResponse;
    error?: string;
  }>> {
    const batch = requests.map(req => this.buildEDI270(req));

    const response = await this.request('POST', '/eligibility/batch', {
      transactions: batch,
    });

    return response.results.map((result: any, index: number) => ({
      request: requests[index]!,
      response: result.success ? this.parseEDI271(result.data) : undefined,
      error: result.error,
    }));
  }

  /**
   * Get coverage summary
   */
  async getCoverageSummary(params: {
    memberId: string;
    payerId: string;
    serviceDate?: Date;
  }): Promise<{
    member: {
      id: string;
      name: string;
      dob: Date;
    };
    coverage: {
      active: boolean;
      planName: string;
      effectiveDate: Date;
      terminationDate?: Date;
    };
    deductibles: {
      individual: { total: number; met: number; remaining: number };
      family?: { total: number; met: number; remaining: number };
    };
    outOfPocketMax: {
      individual: { total: number; met: number; remaining: number };
      family?: { total: number; met: number; remaining: number };
    };
  }> {
    const response = await this.request('GET', `/eligibility/summary`, {
      memberId: params.memberId,
      payerId: params.payerId,
      serviceDate: params.serviceDate?.toISOString(),
    });

    return response;
  }

  /**
   * Build EDI 270 transaction (simplified)
   */
  private buildEDI270(request: EligibilityRequest): string {
    const segments: string[] = [];

    // ISA - Interchange Control Header
    segments.push('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *' +
      new Date().toISOString().replace(/[-:]/g, '').substring(0, 12) + '*:*^*00501*000000001*0*P*:~');

    // GS - Functional Group Header
    segments.push('GS*HS*SENDER*RECEIVER*' +
      new Date().toISOString().substring(0, 10).replace(/-/g, '') + '*' +
      new Date().toISOString().substring(11, 16).replace(':', '') + '*1*X*005010X279A1~');

    // ST - Transaction Set Header
    segments.push('ST*270*0001*005010X279A1~');

    // BHT - Beginning of Hierarchical Transaction
    segments.push('BHT*0022*13*' + Date.now() + '*' +
      new Date().toISOString().substring(0, 10).replace(/-/g, '') + '*' +
      new Date().toISOString().substring(11, 16).replace(':', '') + '~');

    // HL - Information Source Level
    segments.push('HL*1**20*1~');

    // NM1 - Information Source Name (Payer)
    segments.push('NM1*PR*2*' + request.payer.name + '*****PI*' + request.payer.payerId + '~');

    // HL - Information Receiver Level
    segments.push('HL*2*1*21*1~');

    // NM1 - Information Receiver Name (Provider)
    segments.push('NM1*1P*2*' + request.provider.npi + '*****XX*' + request.provider.npi + '~');

    // HL - Subscriber Level
    segments.push('HL*3*2*22*0~');

    // TRN - Subscriber Trace Number
    segments.push('TRN*1*' + Date.now() + '~');

    // NM1 - Subscriber Name
    const sub = request.subscriber || request.patient;
    segments.push('NM1*IL*1*' + sub.lastName + '*' + sub.firstName + '****MI*' + sub.memberId + '~');

    // DMG - Subscriber Demographics
    segments.push('DMG*D8*' + request.patient.dateOfBirth.toISOString().substring(0, 10).replace(/-/g, '') +
      (request.patient.gender ? '*' + request.patient.gender : '') + '~');

    // DTP - Service Date
    if (request.serviceDate) {
      segments.push('DTP*291*D8*' + request.serviceDate.toISOString().substring(0, 10).replace(/-/g, '') + '~');
    }

    // EQ - Eligibility or Benefit Inquiry
    if (request.serviceType && request.serviceType.length > 0) {
      request.serviceType.forEach(st => {
        segments.push('EQ*' + st + '~');
      });
    } else {
      segments.push('EQ*30~'); // Default: Health Benefit Plan Coverage
    }

    // SE - Transaction Set Trailer
    segments.push('SE*' + (segments.length + 1) + '*0001~');

    // GE - Functional Group Trailer
    segments.push('GE*1*1~');

    // IEA - Interchange Control Trailer
    segments.push('IEA*1*000000001~');

    return segments.join('\n');
  }

  /**
   * Parse EDI 271 response (simplified)
   */
  private parseEDI271(response: any): EligibilityResponse {
    // This is a simplified parser - actual EDI 271 parsing is complex
    return {
      eligible: response.eligible ?? true,
      status: response.status || 'Active',
      effectiveDate: response.effectiveDate ? new Date(response.effectiveDate) : undefined,
      terminationDate: response.terminationDate ? new Date(response.terminationDate) : undefined,
      planInfo: {
        planName: response.planName,
        planType: response.planType,
        groupNumber: response.groupNumber,
      },
      coverages: response.coverages || [],
      additionalInfo: response.additionalInfo,
      errors: response.errors,
    };
  }

  /**
   * Make HTTP request
   */
  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
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
        throw new Error(`Eligibility API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
}

export const eligibilityClient = new EligibilityClient({});
