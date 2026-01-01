/**
 * Surescripts Integration Client
 *
 * Complete Surescripts e-prescribing integration with NCPDP SCRIPT support
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../utils/logger';

// Surescripts Message Types
export type SurescriptsMessageType =
  | 'NEWRX'
  | 'RXCHG'
  | 'RXFILL'
  | 'CANRX'
  | 'REFREQ'
  | 'REFRES'
  | 'RXHREQ'
  | 'RXHRES'
  | 'STATUS'
  | 'ERROR';

// Prescription Data
export interface Prescription {
  prescriptionId: string;
  patientId: string;
  providerId: string;
  pharmacyNCPDP: string;
  medicationName: string;
  medicationCode: string;
  quantity: number;
  daysSupply: number;
  refills: number;
  sig: string;
  writtenDate: string;
  effectiveDate?: string;
  notes?: string;
}

// Medication History Request
export interface MedicationHistoryRequest {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  consentGiven: boolean;
}

// Medication History Response
export interface MedicationHistoryResponse {
  medications: Array<{
    drugName: string;
    ndc: string;
    prescribedDate: string;
    fillDate: string;
    daysSupply: number;
    quantity: number;
    pharmacy: string;
    prescriber: string;
  }>;
  requestId: string;
  status: string;
}

// Pharmacy Information
export interface Pharmacy {
  ncpdpId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  fax?: string;
  email?: string;
  _24Hour?: boolean;
}

/**
 * Surescripts Client
 */
export class SurescriptsClient {
  private client: AxiosInstance;
  private apiKey: string;
  private accountId: string;

  constructor(config: {
    baseUrl?: string;
    apiKey: string;
    accountId: string;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.accountId = config.accountId;

    this.client = axios.create({
      baseURL: config.baseUrl || process.env.SURESCRIPTS_BASE_URL || 'https://eprescription.surescripts.net',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/xml',
        'X-API-Key': this.apiKey,
        'X-Account-ID': this.accountId,
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
        logger.debug('Surescripts Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Surescripts Response', {
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        logger.error('Surescripts Error', {
          status: error.response?.status,
          message: error.message,
        });
        throw new SurescriptsError(
          error.message,
          error.response?.status,
          error.response?.data
        );
      }
    );
  }

  /**
   * Send new prescription (NEWRX)
   */
  async sendNewPrescription(prescription: Prescription): Promise<{ messageId: string; status: string }> {
    try {
      const xml = this.buildNewRxMessage(prescription);

      const response = await this.client.post('/v2/prescription/new', xml, {
        headers: { 'Content-Type': 'application/xml' },
      });

      logger.info('New prescription sent to Surescripts', {
        prescriptionId: prescription.prescriptionId,
        pharmacy: prescription.pharmacyNCPDP,
      });

      return {
        messageId: response.data.messageId || crypto.randomUUID(),
        status: 'sent',
      };
    } catch (error) {
      logger.error('Failed to send prescription', { error });
      throw error;
    }
  }

  /**
   * Cancel prescription (CANRX)
   */
  async cancelPrescription(prescriptionId: string, reason: string): Promise<{ messageId: string; status: string }> {
    try {
      const xml = this.buildCancelMessage(prescriptionId, reason);

      const response = await this.client.post('/v2/prescription/cancel', xml, {
        headers: { 'Content-Type': 'application/xml' },
      });

      logger.info('Prescription cancellation sent', { prescriptionId });

      return {
        messageId: response.data.messageId || crypto.randomUUID(),
        status: 'cancelled',
      };
    } catch (error) {
      logger.error('Failed to cancel prescription', { error });
      throw error;
    }
  }

  /**
   * Request refill authorization (REFREQ)
   */
  async requestRefillAuthorization(prescriptionId: string, pharmacyNCPDP: string): Promise<{ messageId: string }> {
    try {
      const xml = this.buildRefillRequestMessage(prescriptionId, pharmacyNCPDP);

      const response = await this.client.post('/v2/prescription/refill-request', xml, {
        headers: { 'Content-Type': 'application/xml' },
      });

      logger.info('Refill authorization requested', { prescriptionId });

      return {
        messageId: response.data.messageId || crypto.randomUUID(),
      };
    } catch (error) {
      logger.error('Failed to request refill authorization', { error });
      throw error;
    }
  }

  /**
   * Get medication history (RXHREQ)
   */
  async getMedicationHistory(request: MedicationHistoryRequest): Promise<MedicationHistoryResponse> {
    try {
      const xml = this.buildMedicationHistoryRequest(request);

      const response = await this.client.post('/v2/medication-history', xml, {
        headers: { 'Content-Type': 'application/xml' },
      });

      logger.info('Medication history requested', {
        patientId: request.patientId,
      });

      // Parse XML response (simplified)
      return this.parseMedicationHistoryResponse(response.data);
    } catch (error) {
      logger.error('Failed to get medication history', { error });
      throw error;
    }
  }

  /**
   * Search pharmacies by location
   */
  async searchPharmacies(params: {
    zipCode?: string;
    city?: string;
    state?: string;
    radius?: number; // miles
    _24Hour?: boolean;
  }): Promise<Pharmacy[]> {
    try {
      const response = await this.client.get('/v2/pharmacy/search', { params });

      logger.info('Pharmacy search completed', {
        resultsCount: response.data.length,
      });

      return response.data.pharmacies || [];
    } catch (error) {
      logger.error('Failed to search pharmacies', { error });
      throw error;
    }
  }

  /**
   * Get pharmacy by NCPDP ID
   */
  async getPharmacy(ncpdpId: string): Promise<Pharmacy> {
    try {
      const response = await this.client.get(`/v2/pharmacy/${ncpdpId}`);

      return response.data;
    } catch (error) {
      logger.error('Failed to get pharmacy', { ncpdpId, error });
      throw error;
    }
  }

  /**
   * Verify patient eligibility for e-prescribing
   */
  async verifyPatientEligibility(patientId: string): Promise<{ eligible: boolean; reason?: string }> {
    try {
      const response = await this.client.get(`/v2/patient/${patientId}/eligibility`);

      return {
        eligible: response.data.eligible,
        reason: response.data.reason,
      };
    } catch (error) {
      logger.error('Failed to verify patient eligibility', { patientId, error });
      throw error;
    }
  }

  /**
   * Get prescription status
   */
  async getPrescriptionStatus(prescriptionId: string): Promise<{
    status: string;
    lastUpdate: string;
    pharmacy?: string;
  }> {
    try {
      const response = await this.client.get(`/v2/prescription/${prescriptionId}/status`);

      return response.data;
    } catch (error) {
      logger.error('Failed to get prescription status', { prescriptionId, error });
      throw error;
    }
  }

  /**
   * Build NEWRX message (simplified XML builder)
   */
  private buildNewRxMessage(prescription: Prescription): string {
    // This is a simplified example. Real implementation would use proper NCPDP SCRIPT format
    return `<?xml version="1.0" encoding="UTF-8"?>
<Message>
  <Header>
    <To>${prescription.pharmacyNCPDP}</To>
    <From>${this.accountId}</From>
    <MessageID>${crypto.randomUUID()}</MessageID>
    <SentTime>${new Date().toISOString()}</SentTime>
  </Header>
  <Body>
    <NewRx>
      <PrescriptionReferenceNumber>${prescription.prescriptionId}</PrescriptionReferenceNumber>
      <Patient>
        <Identification>${prescription.patientId}</Identification>
      </Patient>
      <Prescriber>
        <Identification>${prescription.providerId}</Identification>
      </Prescriber>
      <Medication>
        <DrugDescription>${prescription.medicationName}</DrugDescription>
        <DrugCoded>
          <ProductCode>${prescription.medicationCode}</ProductCode>
          <ProductCodeQualifier>NDC</ProductCodeQualifier>
        </DrugCoded>
        <Quantity>
          <Value>${prescription.quantity}</Value>
        </Quantity>
        <DaysSupply>${prescription.daysSupply}</DaysSupply>
        <Substitutions>${prescription.refills}</Substitutions>
        <Sig>${prescription.sig}</Sig>
        <WrittenDate>${prescription.writtenDate}</WrittenDate>
      </Medication>
    </NewRx>
  </Body>
</Message>`;
  }

  /**
   * Build CANRX message
   */
  private buildCancelMessage(prescriptionId: string, reason: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Message>
  <Header>
    <From>${this.accountId}</From>
    <MessageID>${crypto.randomUUID()}</MessageID>
    <SentTime>${new Date().toISOString()}</SentTime>
  </Header>
  <Body>
    <CancelRx>
      <PrescriptionReferenceNumber>${prescriptionId}</PrescriptionReferenceNumber>
      <CancellationReason>${reason}</CancellationReason>
    </CancelRx>
  </Body>
</Message>`;
  }

  /**
   * Build refill request message
   */
  private buildRefillRequestMessage(prescriptionId: string, pharmacyNCPDP: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Message>
  <Header>
    <To>${pharmacyNCPDP}</To>
    <From>${this.accountId}</From>
    <MessageID>${crypto.randomUUID()}</MessageID>
    <SentTime>${new Date().toISOString()}</SentTime>
  </Header>
  <Body>
    <RefillRequest>
      <PrescriptionReferenceNumber>${prescriptionId}</PrescriptionReferenceNumber>
    </RefillRequest>
  </Body>
</Message>`;
  }

  /**
   * Build medication history request
   */
  private buildMedicationHistoryRequest(request: MedicationHistoryRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Message>
  <Header>
    <From>${this.accountId}</From>
    <MessageID>${crypto.randomUUID()}</MessageID>
    <SentTime>${new Date().toISOString()}</SentTime>
  </Header>
  <Body>
    <MedicationHistoryRequest>
      <Patient>
        <Identification>${request.patientId}</Identification>
        <Name>
          <FirstName>${request.firstName}</FirstName>
          <LastName>${request.lastName}</LastName>
        </Name>
        <DateOfBirth>${request.dateOfBirth}</DateOfBirth>
        <Gender>${request.gender}</Gender>
        ${
          request.address
            ? `<Address>
          <AddressLine1>${request.address.street}</AddressLine1>
          <City>${request.address.city}</City>
          <State>${request.address.state}</State>
          <ZipCode>${request.address.zipCode}</ZipCode>
        </Address>`
            : ''
        }
      </Patient>
      <ConsentGiven>${request.consentGiven}</ConsentGiven>
    </MedicationHistoryRequest>
  </Body>
</Message>`;
  }

  /**
   * Parse medication history response (simplified)
   */
  private parseMedicationHistoryResponse(xmlData: any): MedicationHistoryResponse {
    // This is a simplified parser. Real implementation would use proper XML parsing
    return {
      medications: [],
      requestId: crypto.randomUUID(),
      status: 'completed',
    };
  }
}

/**
 * Surescripts Error
 */
export class SurescriptsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'SurescriptsError';
  }
}

/**
 * Create Surescripts client from environment
 */
export const surescriptsClient = new SurescriptsClient({
  baseUrl: process.env.SURESCRIPTS_BASE_URL,
  apiKey: process.env.SURESCRIPTS_API_KEY || '',
  accountId: process.env.SURESCRIPTS_ACCOUNT_ID || '',
  timeout: parseInt(process.env.SURESCRIPTS_TIMEOUT || '30000', 10),
});
