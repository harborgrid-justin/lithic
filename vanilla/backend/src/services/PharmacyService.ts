/**
 * PharmacyService.ts
 * Core pharmacy management service for Lithic Enterprise Healthcare
 * Handles pharmacy operations, inventory, and controlled substances
 */

import { EventEmitter } from "events";

export interface Medication {
  id: string;
  ndcCode: string; // National Drug Code
  name: string;
  genericName: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  deaSchedule?: "1" | "2" | "3" | "4" | "5"; // Controlled substance schedule
  formularyStatus: "preferred" | "alternative" | "non-formulary";
  unitPrice: number;
  packageSize: number;
  requiresPriorAuth: boolean;
  therapeuticClass: string;
  routeOfAdministration: string[];
  isControlled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  medicationId: string;
  medication?: Medication;
  lotNumber: string;
  expirationDate: Date;
  quantity: number;
  location: string;
  reorderLevel: number;
  reorderQuantity: number;
  status: "active" | "expired" | "recalled" | "quarantine";
  cost: number;
  supplier: string;
  receivedDate: Date;
  lastCountDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  rxNumber: string;
  patientId: string;
  patientName?: string;
  prescriberId: string;
  prescriberName?: string;
  prescriberDEA?: string;
  prescriberNPI?: string;
  medicationId: string;
  medication?: Medication;

  // Prescription details
  directions: string;
  quantity: number;
  daysSupply: number;
  refillsAuthorized: number;
  refillsRemaining: number;
  writtenDate: Date;
  expirationDate: Date;

  // Dispensing info
  dispensedDate?: Date;
  dispensedBy?: string;
  dispensedQuantity?: number;
  lotNumber?: string;

  // E-prescribing (NCPDP)
  ncpdpMessageId?: string;
  ncpdpVersion?: string;
  eRxStatus?: "pending" | "accepted" | "rejected" | "changed" | "cancelled";
  eRxReceivedDate?: Date;

  // Status and flags
  status:
    | "pending"
    | "verified"
    | "filled"
    | "partially_filled"
    | "cancelled"
    | "on_hold";
  priority: "routine" | "urgent" | "stat";
  isControlled: boolean;
  requiresCounseling: boolean;

  // Clinical info
  diagnosis?: string;
  allergies?: string[];
  drugInteractionChecked: boolean;
  interactionAlerts?: string[];

  // Insurance
  insuranceInfo?: {
    payerId: string;
    groupNumber?: string;
    memberId?: string;
    binNumber?: string;
    pcnNumber?: string;
  };

  copay?: number;
  patientPay?: number;
  insurancePay?: number;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  prescription?: Prescription;
  dispensedDate: Date;
  dispensedBy: string;
  dispensedByName?: string;
  quantity: number;
  lotNumber: string;

  // Controlled substance tracking
  deaForm?: string;
  witnessedBy?: string;
  patientSignature?: string;
  idVerified: boolean;
  idType?: string;
  idNumber?: string;

  // Label info
  labelPrinted: boolean;
  labelPrintedAt?: Date;

  // Patient counseling
  counselingOffered: boolean;
  counselingAccepted?: boolean;
  counseledBy?: string;

  createdAt: Date;
}

export interface ControlledSubstanceLog {
  id: string;
  medicationId: string;
  medication?: Medication;
  action:
    | "receive"
    | "dispense"
    | "waste"
    | "transfer"
    | "inventory_adjustment";
  quantity: number;
  runningBalance: number;

  // Prescription reference (if applicable)
  prescriptionId?: string;
  dispensingRecordId?: string;

  // Personnel
  performedBy: string;
  performedByName?: string;
  witnessedBy?: string;
  witnessedByName?: string;

  // Details
  lotNumber?: string;
  reason?: string;
  deaForm?: string;

  timestamp: Date;
  createdAt: Date;
}

export interface FormularyEntry {
  id: string;
  medicationId: string;
  medication?: Medication;
  tier: 1 | 2 | 3 | 4 | 5;
  status: "preferred" | "alternative" | "non-formulary" | "restricted";
  requiresPriorAuth: boolean;
  priorAuthCriteria?: string;
  quantityLimits?: {
    maxQuantity: number;
    period: "day" | "week" | "month" | "year";
  };
  stepTherapyRequired: boolean;
  stepTherapyAlternatives?: string[];
  notes?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PharmacyService extends EventEmitter {
  private medications: Map<string, Medication> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();
  private prescriptions: Map<string, Prescription> = new Map();
  private dispensingRecords: Map<string, DispensingRecord> = new Map();
  private controlledSubstanceLogs: Map<string, ControlledSubstanceLog> =
    new Map();
  private formulary: Map<string, FormularyEntry> = new Map();

  constructor() {
    super();
    this.initializeSampleData();
  }

  // Medication Management
  async getMedication(id: string): Promise<Medication | null> {
    return this.medications.get(id) || null;
  }

  async getMedicationByNDC(ndcCode: string): Promise<Medication | null> {
    return (
      Array.from(this.medications.values()).find(
        (m) => m.ndcCode === ndcCode,
      ) || null
    );
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.medications.values()).filter(
      (med) =>
        med.name.toLowerCase().includes(searchTerm) ||
        med.genericName.toLowerCase().includes(searchTerm) ||
        med.brandName?.toLowerCase().includes(searchTerm) ||
        med.ndcCode.includes(searchTerm),
    );
  }

  async getAllMedications(filters?: {
    isControlled?: boolean;
    deaSchedule?: string;
    formularyStatus?: string;
    therapeuticClass?: string;
  }): Promise<Medication[]> {
    let meds = Array.from(this.medications.values());

    if (filters) {
      if (filters.isControlled !== undefined) {
        meds = meds.filter((m) => m.isControlled === filters.isControlled);
      }
      if (filters.deaSchedule) {
        meds = meds.filter((m) => m.deaSchedule === filters.deaSchedule);
      }
      if (filters.formularyStatus) {
        meds = meds.filter(
          (m) => m.formularyStatus === filters.formularyStatus,
        );
      }
      if (filters.therapeuticClass) {
        meds = meds.filter(
          (m) => m.therapeuticClass === filters.therapeuticClass,
        );
      }
    }

    return meds;
  }

  async createMedication(
    data: Omit<Medication, "id" | "createdAt" | "updatedAt">,
  ): Promise<Medication> {
    const medication: Medication = {
      ...data,
      id: this.generateId("MED"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.medications.set(medication.id, medication);
    this.emit("medication:created", medication);

    return medication;
  }

  async updateMedication(
    id: string,
    updates: Partial<Medication>,
  ): Promise<Medication | null> {
    const medication = this.medications.get(id);
    if (!medication) return null;

    const updated = { ...medication, ...updates, updatedAt: new Date() };
    this.medications.set(id, updated);
    this.emit("medication:updated", updated);

    return updated;
  }

  // Inventory Management
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    return this.inventory.get(id) || null;
  }

  async getInventoryByMedication(
    medicationId: string,
  ): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values()).filter(
      (item) => item.medicationId === medicationId && item.status === "active",
    );
  }

  async getAllInventory(filters?: {
    status?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }): Promise<InventoryItem[]> {
    let items = Array.from(this.inventory.values());

    if (filters) {
      if (filters.status) {
        items = items.filter((i) => i.status === filters.status);
      }
      if (filters.lowStock) {
        items = items.filter((i) => i.quantity <= i.reorderLevel);
      }
      if (filters.expiringSoon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        items = items.filter((i) => i.expirationDate <= thirtyDaysFromNow);
      }
    }

    return items;
  }

  async createInventoryItem(
    data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<InventoryItem> {
    const item: InventoryItem = {
      ...data,
      id: this.generateId("INV"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inventory.set(item.id, item);
    this.emit("inventory:created", item);

    return item;
  }

  async updateInventoryQuantity(
    id: string,
    quantityChange: number,
    reason: string,
  ): Promise<InventoryItem | null> {
    const item = this.inventory.get(id);
    if (!item) return null;

    const updated = {
      ...item,
      quantity: item.quantity + quantityChange,
      updatedAt: new Date(),
    };

    this.inventory.set(id, updated);
    this.emit("inventory:updated", { item: updated, quantityChange, reason });

    // Check if controlled substance
    if (item.medication?.isControlled) {
      await this.logControlledSubstanceAction({
        medicationId: item.medicationId,
        action: "inventory_adjustment",
        quantity: Math.abs(quantityChange),
        runningBalance: updated.quantity,
        performedBy: "system",
        lotNumber: item.lotNumber,
        reason,
        timestamp: new Date(),
      });
    }

    return updated;
  }

  // Prescription Management
  async getPrescription(id: string): Promise<Prescription | null> {
    return this.prescriptions.get(id) || null;
  }

  async getPrescriptionByRxNumber(
    rxNumber: string,
  ): Promise<Prescription | null> {
    return (
      Array.from(this.prescriptions.values()).find(
        (p) => p.rxNumber === rxNumber,
      ) || null
    );
  }

  async getPrescriptionsByPatient(
    patientId: string,
    filters?: {
      status?: string;
      active?: boolean;
    },
  ): Promise<Prescription[]> {
    let rxs = Array.from(this.prescriptions.values()).filter(
      (p) => p.patientId === patientId,
    );

    if (filters) {
      if (filters.status) {
        rxs = rxs.filter((p) => p.status === filters.status);
      }
      if (filters.active) {
        const now = new Date();
        rxs = rxs.filter(
          (p) =>
            p.status === "filled" &&
            p.refillsRemaining > 0 &&
            p.expirationDate > now,
        );
      }
    }

    return rxs;
  }

  async getAllPrescriptions(filters?: {
    status?: string;
    priority?: string;
    isControlled?: boolean;
  }): Promise<Prescription[]> {
    let rxs = Array.from(this.prescriptions.values());

    if (filters) {
      if (filters.status) {
        rxs = rxs.filter((p) => p.status === filters.status);
      }
      if (filters.priority) {
        rxs = rxs.filter((p) => p.priority === filters.priority);
      }
      if (filters.isControlled !== undefined) {
        rxs = rxs.filter((p) => p.isControlled === filters.isControlled);
      }
    }

    return rxs;
  }

  async createPrescription(
    data: Omit<Prescription, "id" | "rxNumber" | "createdAt" | "updatedAt">,
  ): Promise<Prescription> {
    const prescription: Prescription = {
      ...data,
      id: this.generateId("RX"),
      rxNumber: this.generateRxNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.prescriptions.set(prescription.id, prescription);
    this.emit("prescription:created", prescription);

    return prescription;
  }

  async updatePrescriptionStatus(
    id: string,
    status: Prescription["status"],
    notes?: string,
  ): Promise<Prescription | null> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return null;

    const updated = {
      ...prescription,
      status,
      notes: notes || prescription.notes,
      updatedAt: new Date(),
    };

    this.prescriptions.set(id, updated);
    this.emit("prescription:status_changed", {
      prescription: updated,
      oldStatus: prescription.status,
    });

    return updated;
  }

  // Dispensing
  async dispensePrescription(data: {
    prescriptionId: string;
    dispensedBy: string;
    quantity: number;
    lotNumber: string;
    counselingOffered: boolean;
    counselingAccepted?: boolean;
    idVerified?: boolean;
    idType?: string;
    idNumber?: string;
    witnessedBy?: string;
  }): Promise<DispensingRecord | null> {
    const prescription = this.prescriptions.get(data.prescriptionId);
    if (!prescription) return null;

    if (prescription.status !== "verified") {
      throw new Error("Prescription must be verified before dispensing");
    }

    // Create dispensing record
    const record: DispensingRecord = {
      id: this.generateId("DISP"),
      prescriptionId: data.prescriptionId,
      dispensedDate: new Date(),
      dispensedBy: data.dispensedBy,
      quantity: data.quantity,
      lotNumber: data.lotNumber,
      labelPrinted: false,
      counselingOffered: data.counselingOffered,
      counselingAccepted: data.counselingAccepted,
      idVerified: data.idVerified || false,
      idType: data.idType,
      idNumber: data.idNumber,
      witnessedBy: data.witnessedBy,
      createdAt: new Date(),
    };

    this.dispensingRecords.set(record.id, record);

    // Update prescription
    const isPartialFill = data.quantity < prescription.quantity;
    await this.updatePrescriptionStatus(
      data.prescriptionId,
      isPartialFill ? "partially_filled" : "filled",
    );

    const updatedRx = {
      ...prescription,
      dispensedDate: new Date(),
      dispensedBy: data.dispensedBy,
      dispensedQuantity: data.quantity,
      lotNumber: data.lotNumber,
      status: (isPartialFill
        ? "partially_filled"
        : "filled") as Prescription["status"],
      updatedAt: new Date(),
    };
    this.prescriptions.set(prescription.id, updatedRx);

    // Update inventory
    const inventoryItems = await this.getInventoryByMedication(
      prescription.medicationId,
    );
    const inventoryItem = inventoryItems.find(
      (i) => i.lotNumber === data.lotNumber,
    );
    if (inventoryItem) {
      await this.updateInventoryQuantity(
        inventoryItem.id,
        -data.quantity,
        `Dispensed for RX ${prescription.rxNumber}`,
      );
    }

    // Log controlled substance if applicable
    if (prescription.isControlled) {
      await this.logControlledSubstanceAction({
        medicationId: prescription.medicationId,
        action: "dispense",
        quantity: data.quantity,
        runningBalance: inventoryItem
          ? inventoryItem.quantity - data.quantity
          : 0,
        prescriptionId: prescription.id,
        dispensingRecordId: record.id,
        performedBy: data.dispensedBy,
        witnessedBy: data.witnessedBy,
        lotNumber: data.lotNumber,
        timestamp: new Date(),
      });
    }

    this.emit("prescription:dispensed", { record, prescription: updatedRx });

    return record;
  }

  // Controlled Substance Logging
  async logControlledSubstanceAction(
    data: Omit<ControlledSubstanceLog, "id" | "createdAt">,
  ): Promise<ControlledSubstanceLog> {
    const log: ControlledSubstanceLog = {
      ...data,
      id: this.generateId("CSL"),
      createdAt: new Date(),
    };

    this.controlledSubstanceLogs.set(log.id, log);
    this.emit("controlled_substance:logged", log);

    return log;
  }

  async getControlledSubstanceLogs(filters?: {
    medicationId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ControlledSubstanceLog[]> {
    let logs = Array.from(this.controlledSubstanceLogs.values());

    if (filters) {
      if (filters.medicationId) {
        logs = logs.filter((l) => l.medicationId === filters.medicationId);
      }
      if (filters.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter((l) => l.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter((l) => l.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Formulary Management
  async getFormularyEntry(
    medicationId: string,
  ): Promise<FormularyEntry | null> {
    return (
      Array.from(this.formulary.values()).find(
        (f) => f.medicationId === medicationId,
      ) || null
    );
  }

  async getAllFormulary(filters?: {
    tier?: number;
    status?: string;
  }): Promise<FormularyEntry[]> {
    let entries = Array.from(this.formulary.values());

    if (filters) {
      if (filters.tier) {
        entries = entries.filter((e) => e.tier === filters.tier);
      }
      if (filters.status) {
        entries = entries.filter((e) => e.status === filters.status);
      }
    }

    return entries;
  }

  async createFormularyEntry(
    data: Omit<FormularyEntry, "id" | "createdAt" | "updatedAt">,
  ): Promise<FormularyEntry> {
    const entry: FormularyEntry = {
      ...data,
      id: this.generateId("FORM"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.formulary.set(entry.id, entry);
    this.emit("formulary:created", entry);

    return entry;
  }

  // Utility methods
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRxNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `RX${timestamp}${random}`;
  }

  // Sample data initialization
  private initializeSampleData(): void {
    // Sample medications
    const medications: Omit<Medication, "id" | "createdAt" | "updatedAt">[] = [
      {
        ndcCode: "00002-3227-01",
        name: "Prozac 20mg Capsules",
        genericName: "Fluoxetine Hydrochloride",
        brandName: "Prozac",
        dosageForm: "Capsule",
        strength: "20mg",
        manufacturer: "Eli Lilly",
        formularyStatus: "preferred",
        unitPrice: 2.5,
        packageSize: 30,
        requiresPriorAuth: false,
        therapeuticClass: "SSRI Antidepressant",
        routeOfAdministration: ["Oral"],
        isControlled: false,
      },
      {
        ndcCode: "59762-5020-1",
        name: "Oxycodone 5mg Tablets",
        genericName: "Oxycodone Hydrochloride",
        dosageForm: "Tablet",
        strength: "5mg",
        manufacturer: "Greenstone",
        deaSchedule: "2",
        formularyStatus: "alternative",
        unitPrice: 0.85,
        packageSize: 100,
        requiresPriorAuth: true,
        therapeuticClass: "Opioid Analgesic",
        routeOfAdministration: ["Oral"],
        isControlled: true,
      },
      {
        ndcCode: "00071-0156-23",
        name: "Lipitor 40mg Tablets",
        genericName: "Atorvastatin Calcium",
        brandName: "Lipitor",
        dosageForm: "Tablet",
        strength: "40mg",
        manufacturer: "Pfizer",
        formularyStatus: "preferred",
        unitPrice: 1.2,
        packageSize: 90,
        requiresPriorAuth: false,
        therapeuticClass: "Statin",
        routeOfAdministration: ["Oral"],
        isControlled: false,
      },
    ];

    medications.forEach((med) => {
      const medication: Medication = {
        ...med,
        id: this.generateId("MED"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.medications.set(medication.id, medication);
    });
  }
}

const pharmacyService = new PharmacyService();
export default pharmacyService;
