import {
  Patient,
  PatientSearchParams,
  Insurance,
  PatientDocument,
  PatientHistory,
  DuplicatePatient,
  PatientMergeRequest,
  EmergencyContact,
} from "@/types/patient";
import { mrnGenerator } from "@/lib/mrn-generator";
import { duplicateDetector } from "@/lib/duplicate-detection";
import { auditLogger } from "@/lib/audit-logger";

export class PatientService {
  private baseUrl = "/api/patients";

  /**
   * Get all patients with pagination and filtering
   */
  async getPatients(params: PatientSearchParams = {}): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(this.baseUrl + "?" + queryParams.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }

    return response.json();
  }

  /**
   * Get a single patient by ID
   */
  async getPatient(id: string): Promise<Patient> {
    const response = await fetch(this.baseUrl + "/" + id);

    if (!response.ok) {
      throw new Error("Failed to fetch patient");
    }

    return response.json();
  }

  /**
   * Create a new patient
   */
  async createPatient(
    data: Omit<Patient, "id" | "mrn" | "createdAt" | "updatedAt">,
  ): Promise<Patient> {
    // Check for duplicates before creating
    const duplicates = await this.findDuplicates({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      ssn: data.ssn,
      phone: data.phone,
      email: data.email,
    });

    if (duplicates.length > 0) {
      throw new Error(
        "Potential duplicate patients found. Please review before creating.",
      );
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create patient");
    }

    return response.json();
  }

  /**
   * Update an existing patient
   */
  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
    const response = await fetch(this.baseUrl + "/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update patient");
    }

    return response.json();
  }

  /**
   * Delete a patient
   */
  async deletePatient(id: string): Promise<void> {
    const response = await fetch(this.baseUrl + "/" + id, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete patient");
    }
  }

  /**
   * Search patients with advanced criteria
   */
  async searchPatients(params: PatientSearchParams): Promise<Patient[]> {
    const response = await fetch(
      this.baseUrl + "/search?" + new URLSearchParams(params as any).toString(),
    );

    if (!response.ok) {
      throw new Error("Failed to search patients");
    }

    return response.json();
  }

  /**
   * Find duplicate patients
   */
  async findDuplicates(patient: Partial<Patient>): Promise<DuplicatePatient[]> {
    // In a real implementation, this would query the backend
    // For now, we'll use the local duplicate detector
    const allPatients = await this.getPatients({ limit: 1000 });
    return duplicateDetector.findDuplicates(patient, allPatients.patients);
  }

  /**
   * Merge two patient records
   */
  async mergePatients(request: PatientMergeRequest): Promise<Patient> {
    const response = await fetch(this.baseUrl + "/merge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to merge patients");
    }

    return response.json();
  }

  /**
   * Get patient insurance information
   */
  async getPatientInsurance(patientId: string): Promise<Insurance[]> {
    const response = await fetch(this.baseUrl + "/" + patientId + "/insurance");

    if (!response.ok) {
      throw new Error("Failed to fetch insurance information");
    }

    return response.json();
  }

  /**
   * Update patient insurance
   */
  async updatePatientInsurance(
    patientId: string,
    insurance: Insurance,
  ): Promise<Insurance> {
    const response = await fetch(
      this.baseUrl + "/" + patientId + "/insurance",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(insurance),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update insurance");
    }

    return response.json();
  }

  /**
   * Verify insurance eligibility
   */
  async verifyInsurance(patientId: string, insuranceId: string): Promise<any> {
    const response = await fetch(
      this.baseUrl + "/" + patientId + "/insurance/" + insuranceId + "/verify",
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to verify insurance");
    }

    return response.json();
  }

  /**
   * Get patient documents
   */
  async getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
    const response = await fetch(this.baseUrl + "/" + patientId + "/documents");

    if (!response.ok) {
      throw new Error("Failed to fetch documents");
    }

    return response.json();
  }

  /**
   * Upload patient document
   */
  async uploadDocument(
    patientId: string,
    file: File,
    metadata: Partial<PatientDocument>,
  ): Promise<PatientDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await fetch(
      this.baseUrl + "/" + patientId + "/documents",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Failed to upload document");
    }

    return response.json();
  }

  /**
   * Get patient history/audit log
   */
  async getPatientHistory(patientId: string): Promise<PatientHistory[]> {
    const response = await fetch(this.baseUrl + "/" + patientId + "/history");

    if (!response.ok) {
      throw new Error("Failed to fetch patient history");
    }

    return response.json();
  }

  /**
   * Generate a new MRN
   */
  generateMRN(): string {
    return mrnGenerator.generate();
  }

  /**
   * Validate MRN format
   */
  validateMRN(mrn: string): boolean {
    return mrnGenerator.validate(mrn);
  }
}

export const patientService = new PatientService();
