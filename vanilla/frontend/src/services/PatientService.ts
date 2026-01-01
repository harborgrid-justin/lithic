/**
 * Patient Service - Frontend API client
 */

import { Patient, PatientSearchParams, DuplicateMatch, ApiResponse, Insurance, Document } from '../types/Patient';

export class PatientService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all patients
   */
  public async getAllPatients(limit: number = 50, offset: number = 0): Promise<ApiResponse<Patient[]>> {
    const response = await fetch(
      `${this.baseUrl}/patients?limit=${limit}&offset=${offset}`
    );
    return response.json();
  }

  /**
   * Get patient by ID
   */
  public async getPatientById(id: string): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/${id}`);
    return response.json();
  }

  /**
   * Get patient by MRN
   */
  public async getPatientByMRN(mrn: string): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/mrn/${mrn}`);
    return response.json();
  }

  /**
   * Create new patient
   */
  public async createPatient(patientData: Partial<Patient>): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    return response.json();
  }

  /**
   * Update patient
   */
  public async updatePatient(id: string, updates: Partial<Patient>): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  /**
   * Delete patient
   */
  public async deletePatient(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/patients/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  /**
   * Search patients
   */
  public async searchPatients(params: PatientSearchParams): Promise<ApiResponse<Patient[]>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(
      `${this.baseUrl}/patients/search?${queryParams.toString()}`
    );
    return response.json();
  }

  /**
   * Find duplicate patients
   */
  public async findDuplicates(patientData: Partial<Patient>): Promise<ApiResponse<DuplicateMatch[]>> {
    const response = await fetch(`${this.baseUrl}/patients/search/duplicates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    return response.json();
  }

  /**
   * Merge patients
   */
  public async mergePatients(
    sourceMrn: string,
    targetMrn: string,
    reason: string
  ): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourceMrn, targetMrn, reason }),
    });
    return response.json();
  }

  /**
   * Add document to patient
   */
  public async addDocument(patientId: string, document: Partial<Document>): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/documents/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    return response.json();
  }

  /**
   * Update patient insurance
   */
  public async updateInsurance(patientId: string, insurance: Insurance): Promise<ApiResponse<Patient>> {
    const response = await fetch(`${this.baseUrl}/patients/insurance/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(insurance),
    });
    return response.json();
  }

  /**
   * Get patient audit log
   */
  public async getAuditLog(patientId: string): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${this.baseUrl}/patients/${patientId}/audit`);
    return response.json();
  }
}

const patientService = new PatientService();
export default patientService;
