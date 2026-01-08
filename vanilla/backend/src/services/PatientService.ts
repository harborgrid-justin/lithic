/**
 * Patient Service - Core business logic for patient management
 * HIPAA-compliant patient data operations
 */

import {
  Patient,
  PatientSearchParams,
  PatientMergeRequest,
  DuplicateMatch,
  AuditLog,
  Document,
  Insurance,
} from "../models/Patient";
import MRNGenerator from "./MRNGenerator";
import DuplicateDetector from "./DuplicateDetector";

export class PatientService {
  // In-memory storage (replace with database in production)
  private patients: Map<string, Patient> = new Map();
  private mrnIndex: Map<string, string> = new Map(); // mrn -> id
  private auditLogs: Map<string, AuditLog[]> = new Map();

  constructor() {
    // Initialize with some mock data for development
    this.initializeMockData();
  }

  /**
   * Create a new patient
   */
  public async createPatient(
    patientData: Omit<Patient, "id" | "mrn" | "createdAt" | "updatedAt">,
    userId: string,
  ): Promise<Patient> {
    // Check for duplicates
    const duplicates = await this.findDuplicates(patientData);

    if (duplicates.length > 0 && duplicates[0].score >= 90) {
      throw new Error(
        `Potential duplicate patient found: ${duplicates[0].patient.firstName} ${duplicates[0].patient.lastName} (MRN: ${duplicates[0].patient.mrn})`,
      );
    }

    // Generate MRN
    const mrn = await MRNGenerator.generate();

    // Create patient
    const patient: Patient = {
      ...patientData,
      id: this.generateId(),
      mrn,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
      documents: [],
      auditLog: [],
    };

    // Store patient
    this.patients.set(patient.id, patient);
    this.mrnIndex.set(patient.mrn, patient.id);

    // Create audit log
    await this.createAuditLog({
      patientId: patient.id,
      action: "created",
      performedBy: userId,
      performedAt: new Date(),
    });

    return patient;
  }

  /**
   * Get patient by ID
   */
  public async getPatientById(
    id: string,
    userId: string,
  ): Promise<Patient | null> {
    const patient = this.patients.get(id);

    if (patient) {
      await this.createAuditLog({
        patientId: id,
        action: "viewed",
        performedBy: userId,
        performedAt: new Date(),
      });
    }

    return patient || null;
  }

  /**
   * Get patient by MRN
   */
  public async getPatientByMRN(
    mrn: string,
    userId: string,
  ): Promise<Patient | null> {
    const id = this.mrnIndex.get(mrn);
    if (!id) return null;

    return this.getPatientById(id, userId);
  }

  /**
   * Update patient
   */
  public async updatePatient(
    id: string,
    updates: Partial<Patient>,
    userId: string,
  ): Promise<Patient> {
    const patient = this.patients.get(id);

    if (!patient) {
      throw new Error(`Patient not found: ${id}`);
    }

    // Track changes for audit
    const changes: Record<string, any> = {};
    for (const key in updates) {
      if (updates[key as keyof Patient] !== patient[key as keyof Patient]) {
        changes[key] = {
          from: patient[key as keyof Patient],
          to: updates[key as keyof Patient],
        };
      }
    }

    // Update patient
    const updatedPatient: Patient = {
      ...patient,
      ...updates,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.patients.set(id, updatedPatient);

    // Create audit log
    await this.createAuditLog({
      patientId: id,
      action: "updated",
      performedBy: userId,
      performedAt: new Date(),
      changes,
    });

    return updatedPatient;
  }

  /**
   * Delete patient (soft delete)
   */
  public async deletePatient(id: string, userId: string): Promise<void> {
    const patient = this.patients.get(id);

    if (!patient) {
      throw new Error(`Patient not found: ${id}`);
    }

    // Soft delete by setting status to inactive
    await this.updatePatient(id, { status: "inactive" }, userId);

    // Create audit log
    await this.createAuditLog({
      patientId: id,
      action: "deleted",
      performedBy: userId,
      performedAt: new Date(),
    });
  }

  /**
   * Search patients
   */
  public async searchPatients(params: PatientSearchParams): Promise<Patient[]> {
    let results = Array.from(this.patients.values());

    // Filter by status
    if (params.status) {
      results = results.filter((p) => p.status === params.status);
    }

    // Filter by MRN
    if (params.mrn) {
      results = results.filter((p) =>
        p.mrn.toLowerCase().includes(params.mrn!.toLowerCase()),
      );
    }

    // Filter by name
    if (params.firstName) {
      results = results.filter((p) =>
        p.firstName.toLowerCase().includes(params.firstName!.toLowerCase()),
      );
    }

    if (params.lastName) {
      results = results.filter((p) =>
        p.lastName.toLowerCase().includes(params.lastName!.toLowerCase()),
      );
    }

    // Filter by DOB
    if (params.dateOfBirth) {
      const searchDob = new Date(params.dateOfBirth)
        .toISOString()
        .split("T")[0] || "";
      results = results.filter((p) => {
        const patientDob = new Date(p.dateOfBirth).toISOString().split("T")[0] || "";
        return patientDob === searchDob;
      });
    }

    // Filter by phone
    if (params.phone) {
      const normalizedPhone = params.phone.replace(/\D/g, "");
      results = results.filter((p) =>
        p.contact.phone.replace(/\D/g, "").includes(normalizedPhone),
      );
    }

    // Filter by email
    if (params.email) {
      results = results.filter((p) =>
        p.contact.email?.toLowerCase().includes(params.email!.toLowerCase()),
      );
    }

    // General query search
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query) ||
          p.lastName.toLowerCase().includes(query) ||
          p.mrn.toLowerCase().includes(query) ||
          p.contact.phone.includes(query) ||
          p.contact.email?.toLowerCase().includes(query),
      );
    }

    // Pagination
    const offset = params.offset || 0;
    const limit = params.limit || 50;

    return results.slice(offset, offset + limit);
  }

  /**
   * Find duplicate patients
   */
  public async findDuplicates(
    patientData: Partial<Patient>,
  ): Promise<DuplicateMatch[]> {
    const existingPatients = Array.from(this.patients.values()).filter(
      (p) => p.status === "active",
    );

    return DuplicateDetector.findDuplicates(patientData, existingPatients);
  }

  /**
   * Merge two patient records
   */
  public async mergePatients(request: PatientMergeRequest): Promise<Patient> {
    const source = await this.getPatientByMRN(
      request.sourceMrn,
      request.performedBy,
    );
    const target = await this.getPatientByMRN(
      request.targetMrn,
      request.performedBy,
    );

    if (!source || !target) {
      throw new Error("Source or target patient not found");
    }

    // Merge insurance records
    const mergedInsurance = [...target.insurance, ...source.insurance];

    // Merge documents
    const mergedDocuments = [
      ...(target.documents || []),
      ...(source.documents || []),
    ];

    // Update target patient
    const updatedTarget = await this.updatePatient(
      target.id,
      {
        insurance: mergedInsurance,
        documents: mergedDocuments,
      },
      request.performedBy,
    );

    // Mark source as merged
    await this.updatePatient(
      source.id,
      {
        status: "merged",
        mergedInto: target.id,
      },
      request.performedBy,
    );

    // Create audit logs
    await this.createAuditLog({
      patientId: source.id,
      action: "merged",
      performedBy: request.performedBy,
      performedAt: new Date(),
      changes: { mergedInto: target.mrn, reason: request.reason },
    });

    await this.createAuditLog({
      patientId: target.id,
      action: "merged",
      performedBy: request.performedBy,
      performedAt: new Date(),
      changes: { mergedFrom: source.mrn, reason: request.reason },
    });

    return updatedTarget;
  }

  /**
   * Add document to patient
   */
  public async addDocument(
    patientId: string,
    document: Omit<Document, "id" | "patientId" | "uploadedAt">,
    userId: string,
  ): Promise<Patient> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const newDocument: Document = {
      ...document,
      id: this.generateId(),
      patientId,
      uploadedAt: new Date(),
    };

    const documents = [...(patient.documents || []), newDocument];

    return this.updatePatient(patientId, { documents }, userId);
  }

  /**
   * Add or update insurance
   */
  public async updateInsurance(
    patientId: string,
    insurance: Insurance,
    userId: string,
  ): Promise<Patient> {
    const patient = this.patients.get(patientId);

    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    let insuranceList = [...patient.insurance];

    // If insurance has an ID, update existing; otherwise, add new
    const existingIndex = insuranceList.findIndex(
      (ins) => ins.id === insurance.id,
    );

    if (existingIndex >= 0) {
      insuranceList[existingIndex] = insurance;
    } else {
      insuranceList.push(insurance);
    }

    // If this is primary, set others to non-primary
    if (insurance.isPrimary) {
      insuranceList = insuranceList.map((ins) => ({
        ...ins,
        isPrimary: ins.id === insurance.id,
      }));
    }

    return this.updatePatient(patientId, { insurance: insuranceList }, userId);
  }

  /**
   * Get patient audit log
   */
  public async getAuditLog(patientId: string): Promise<AuditLog[]> {
    return this.auditLogs.get(patientId) || [];
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(log: Omit<AuditLog, "id">): Promise<void> {
    const auditLog: AuditLog = {
      ...log,
      id: this.generateId(),
    };

    const logs = this.auditLogs.get(log.patientId) || [];
    logs.push(auditLog);
    this.auditLogs.set(log.patientId, logs);

    // Also add to patient's audit log
    const patient = this.patients.get(log.patientId);
    if (patient) {
      patient.auditLog = logs;
    }
  }

  /**
   * Get all patients (for admin)
   */
  public async getAllPatients(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Patient[]> {
    const patients = Array.from(this.patients.values());
    return patients.slice(offset, offset + limit);
  }

  /**
   * Get patient count
   */
  public async getPatientCount(): Promise<number> {
    return this.patients.size;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize mock data for development
   */
  private initializeMockData(): void {
    // This would be removed in production
    const mockPatients: Omit<
      Patient,
      "id" | "mrn" | "createdAt" | "updatedAt"
    >[] = [
      {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: new Date("1980-05-15"),
        gender: "male",
        address: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        contact: {
          phone: "555-123-4567",
          email: "john.doe@email.com",
        },
        insurance: [],
        status: "active",
        createdBy: "system",
        updatedBy: "system",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: new Date("1992-08-22"),
        gender: "female",
        address: {
          street: "456 Oak Ave",
          city: "Springfield",
          state: "IL",
          zipCode: "62702",
          country: "USA",
        },
        contact: {
          phone: "555-987-6543",
          email: "jane.smith@email.com",
        },
        insurance: [],
        status: "active",
        bloodType: "O+",
        allergies: ["Penicillin"],
        createdBy: "system",
        updatedBy: "system",
      },
    ];

    // Create mock patients (async operation)
    setTimeout(() => {
      mockPatients.forEach((patientData) => {
        this.createPatient(patientData, "system").catch(console.error);
      });
    }, 0);
  }
}

const patientService = new PatientService();
export default patientService;
