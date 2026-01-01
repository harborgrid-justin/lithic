// Specimen Service - Business logic for specimen tracking
import { Specimen, SpecimenStatus, SpecimenType } from "@/types/laboratory";

export class SpecimenService {
  private static baseUrl = "/api/laboratory/specimens";

  static async getSpecimens(filters?: {
    status?: SpecimenStatus;
    patientId?: string;
    orderId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Specimen[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.patientId) params.append("patientId", filters.patientId);
    if (filters?.orderId) params.append("orderId", filters.orderId);
    if (filters?.dateFrom)
      params.append("dateFrom", filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append("dateTo", filters.dateTo.toISOString());

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) throw new Error("Failed to fetch specimens");
    return response.json();
  }

  static async getSpecimenById(id: string): Promise<Specimen> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error("Failed to fetch specimen");
    return response.json();
  }

  static async getSpecimenByBarcode(barcode: string): Promise<Specimen> {
    const response = await fetch(`${this.baseUrl}/barcode/${barcode}`);
    if (!response.ok) throw new Error("Failed to fetch specimen");
    return response.json();
  }

  static async createSpecimen(
    specimen: Omit<Specimen, "id" | "createdAt" | "updatedAt">,
  ): Promise<Specimen> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(specimen),
    });
    if (!response.ok) throw new Error("Failed to create specimen");
    return response.json();
  }

  static async updateSpecimen(
    id: string,
    updates: Partial<Specimen>,
  ): Promise<Specimen> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update specimen");
    return response.json();
  }

  static async receiveSpecimen(
    id: string,
    receivedBy: string,
  ): Promise<Specimen> {
    return this.updateSpecimen(id, {
      status: "RECEIVED",
      receivedAt: new Date(),
    });
  }

  static async rejectSpecimen(id: string, reason: string): Promise<Specimen> {
    return this.updateSpecimen(id, {
      status: "REJECTED",
      rejectionReason: reason,
    });
  }

  static async updateStatus(
    id: string,
    status: SpecimenStatus,
  ): Promise<Specimen> {
    return this.updateSpecimen(id, { status });
  }

  static generateAccessionNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${year}${month}${day}-${random}`;
  }

  static generateBarcode(): string {
    // Generate a Code 128 compatible barcode
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `SP${timestamp}${random}`;
  }

  static validateSpecimen(specimen: Partial<Specimen>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!specimen.type) {
      errors.push("Specimen type is required");
    }

    if (!specimen.patientId) {
      errors.push("Patient ID is required");
    }

    if (!specimen.collectedAt) {
      errors.push("Collection date/time is required");
    }

    if (specimen.volume && specimen.volume <= 0) {
      errors.push("Volume must be greater than 0");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static getSpecimenAgeInHours(specimen: Specimen): number {
    const now = new Date();
    const collected = new Date(specimen.collectedAt);
    return Math.floor((now.getTime() - collected.getTime()) / (1000 * 60 * 60));
  }

  static isSpecimenExpired(
    specimen: Specimen,
    maxAgeHours: number = 24,
  ): boolean {
    return this.getSpecimenAgeInHours(specimen) > maxAgeHours;
  }

  static getRecommendedContainer(specimenType: SpecimenType): string {
    const containerMap: Record<SpecimenType, string> = {
      BLOOD: "Lavender top (EDTA) tube",
      SERUM: "Red top (no additive) or Gold top (SST) tube",
      PLASMA: "Light blue top (Citrate) or Green top (Heparin) tube",
      URINE: "Sterile urine container",
      CSF: "Sterile CSF tube",
      TISSUE: "Formalin container",
      SWAB: "Transport media tube",
      SALIVA: "Saliva collection tube",
      OTHER: "Appropriate sterile container",
    };

    return containerMap[specimenType] || "Sterile container";
  }
}

export default SpecimenService;
