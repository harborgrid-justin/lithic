import {
  Encounter,
  CreateEncounterRequest,
  UpdateEncounterRequest,
  ClinicalDashboardStats,
  SignDocumentRequest,
  ESignature,
} from "../models/ClinicalTypes";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import ClinicalService from "./ClinicalService";

export class EncounterService {
  // In-memory storage (replace with database in production)
  private encounters: Map<string, Encounter> = new Map();

  async createEncounter(
    request: CreateEncounterRequest,
    userId: string,
  ): Promise<Encounter> {
    const encounter: Encounter = {
      id: uuidv4(),
      patientId: request.patientId,
      providerId: request.providerId,
      facilityId: request.facilityId,
      encounterType: request.encounterType,
      status: "scheduled",
      chiefComplaint: request.chiefComplaint,
      encounterDate: new Date(request.encounterDate),
      startTime: new Date(request.startTime),
      department: request.department,
      appointmentType: request.appointmentType,
      icd10Codes: [],
      cptCodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.encounters.set(encounter.id, encounter);
    return encounter;
  }

  async getEncounterById(encounterId: string): Promise<Encounter | null> {
    return this.encounters.get(encounterId) || null;
  }

  async getEncountersByPatient(patientId: string): Promise<Encounter[]> {
    return Array.from(this.encounters.values())
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => b.encounterDate.getTime() - a.encounterDate.getTime());
  }

  async getEncountersByProvider(
    providerId: string,
    status?: Encounter["status"],
  ): Promise<Encounter[]> {
    let encounters = Array.from(this.encounters.values()).filter(
      (e) => e.providerId === providerId,
    );

    if (status) {
      encounters = encounters.filter((e) => e.status === status);
    }

    return encounters.sort(
      (a, b) => b.encounterDate.getTime() - a.encounterDate.getTime(),
    );
  }

  async getEncountersByDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Encounter[]> {
    return Array.from(this.encounters.values())
      .filter(
        (e) =>
          e.providerId === providerId &&
          e.encounterDate >= startDate &&
          e.encounterDate <= endDate,
      )
      .sort((a, b) => b.encounterDate.getTime() - a.encounterDate.getTime());
  }

  async updateEncounter(
    encounterId: string,
    updates: UpdateEncounterRequest,
  ): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    const updatedEncounter: Encounter = {
      ...encounter,
      ...updates,
      endTime: updates.endTime ? new Date(updates.endTime) : encounter.endTime,
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async startEncounter(encounterId: string): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    const updatedEncounter: Encounter = {
      ...encounter,
      status: "in-progress",
      startTime: new Date(),
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async completeEncounter(encounterId: string): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    // Validate that encounter has required data
    if (!encounter.icd10Codes || encounter.icd10Codes.length === 0) {
      throw new Error("Encounter must have at least one diagnosis code");
    }

    const updatedEncounter: Encounter = {
      ...encounter,
      status: "completed",
      endTime: new Date(),
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async signEncounter(
    encounterId: string,
    signRequest: SignDocumentRequest,
  ): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter || encounter.status !== "completed") {
      throw new Error("Only completed encounters can be signed");
    }

    // Verify signature
    const isValid = await this.verifySignature(signRequest);
    if (!isValid) {
      throw new Error("Invalid signature credentials");
    }

    const signature = this.generateSignature(signRequest);

    const signedEncounter: Encounter = {
      ...encounter,
      signedAt: new Date(),
      signedBy: signRequest.userId,
      signature: signature.signature,
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, signedEncounter);
    return signedEncounter;
  }

  async cancelEncounter(
    encounterId: string,
    reason: string,
  ): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    if (encounter.status === "completed" || encounter.status === "cancelled") {
      throw new Error(
        "Cannot cancel completed or already cancelled encounters",
      );
    }

    const updatedEncounter: Encounter = {
      ...encounter,
      status: "cancelled",
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async addDiagnosisCodes(
    encounterId: string,
    icd10Codes: string[],
  ): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    const existingCodes = new Set(encounter.icd10Codes);
    icd10Codes.forEach((code) => existingCodes.add(code));

    const updatedEncounter: Encounter = {
      ...encounter,
      icd10Codes: Array.from(existingCodes),
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async addProcedureCodes(
    encounterId: string,
    cptCodes: string[],
  ): Promise<Encounter | null> {
    const encounter = this.encounters.get(encounterId);
    if (!encounter) return null;

    const existingCodes = new Set(encounter.cptCodes);
    cptCodes.forEach((code) => existingCodes.add(code));

    const updatedEncounter: Encounter = {
      ...encounter,
      cptCodes: Array.from(existingCodes),
      updatedAt: new Date(),
    };

    this.encounters.set(encounterId, updatedEncounter);
    return updatedEncounter;
  }

  async getDashboardStats(providerId: string): Promise<ClinicalDashboardStats> {
    const providerEncounters = await this.getEncountersByProvider(providerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEncounters = providerEncounters.filter(
      (e) => e.encounterDate >= today,
    );

    const inProgressEncounters = providerEncounters.filter(
      (e) => e.status === "in-progress",
    );

    // Count pending notes (encounters without signed notes)
    let pendingNotes = 0;
    for (const encounter of providerEncounters) {
      const notes = await ClinicalService.getNotesByEncounter(encounter.id);
      const hasSignedNote = notes.some((n) => n.status === "signed");
      if (!hasSignedNote && encounter.status === "completed") {
        pendingNotes++;
      }
    }

    // Count pending orders
    let pendingOrders = 0;
    for (const encounter of providerEncounters) {
      const orders = await ClinicalService.getOrdersByEncounter(encounter.id);
      pendingOrders += orders.filter((o) => o.status === "pending").length;
    }

    return {
      totalEncounters: todayEncounters.length,
      pendingNotes,
      unseenPatients: inProgressEncounters.length,
      criticalAlerts: 0, // Would be calculated from lab results, vitals, etc.
      pendingOrders,
      recentEncounters: providerEncounters.slice(0, 10),
    };
  }

  async getEncounterSummary(encounterId: string): Promise<any> {
    const encounter = await this.getEncounterById(encounterId);
    if (!encounter) return null;

    const [notes, vitals, orders, problems] = await Promise.all([
      ClinicalService.getNotesByEncounter(encounterId),
      ClinicalService.getVitalsByEncounter(encounterId),
      ClinicalService.getOrdersByEncounter(encounterId),
      ClinicalService.getProblemsByPatient(encounter.patientId, true),
    ]);

    return {
      encounter,
      notes,
      vitals,
      orders,
      activeProblems: problems,
    };
  }

  private async verifySignature(
    signRequest: SignDocumentRequest,
  ): Promise<boolean> {
    // In production, verify against user credentials in database
    if (signRequest.password) {
      return signRequest.password.length > 0;
    }
    if (signRequest.pin) {
      return signRequest.pin.length === 4;
    }
    return false;
  }

  private generateSignature(signRequest: SignDocumentRequest): ESignature {
    const signatureData =
      signRequest.signatureData ||
      this.generateDefaultSignature(signRequest.userId);

    return {
      userId: signRequest.userId,
      userName: signRequest.userId,
      timestamp: new Date(),
      ipAddress: signRequest.ipAddress,
      signature: signatureData,
      method: signRequest.password
        ? "password"
        : signRequest.pin
          ? "pin"
          : "token",
    };
  }

  private generateDefaultSignature(userId: string): string {
    const data = `${userId}-${new Date().toISOString()}`;
    return crypto.createHash("sha256").update(data).digest("base64");
  }
}

const encounterService = new EncounterService();
export default encounterService;
