/**
 * PharmacyService.ts
 * Frontend service for pharmacy API calls
 */

const API_BASE_URL = '/api/pharmacy';

export interface Medication {
  id: string;
  ndcCode: string;
  name: string;
  genericName: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  deaSchedule?: '1' | '2' | '3' | '4' | '5';
  formularyStatus: 'preferred' | 'alternative' | 'non-formulary';
  unitPrice: number;
  packageSize: number;
  requiresPriorAuth: boolean;
  therapeuticClass: string;
  routeOfAdministration: string[];
  isControlled: boolean;
  createdAt: string;
  updatedAt: string;
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
  directions: string;
  quantity: number;
  daysSupply: number;
  refillsAuthorized: number;
  refillsRemaining: number;
  writtenDate: string;
  expirationDate: string;
  dispensedDate?: string;
  dispensedBy?: string;
  dispensedQuantity?: number;
  lotNumber?: string;
  status: 'pending' | 'verified' | 'filled' | 'partially_filled' | 'cancelled' | 'on_hold';
  priority: 'routine' | 'urgent' | 'stat';
  isControlled: boolean;
  requiresCounseling: boolean;
  diagnosis?: string;
  allergies?: string[];
  drugInteractionChecked: boolean;
  interactionAlerts?: string[];
  copay?: number;
  patientPay?: number;
  insurancePay?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  medicationId: string;
  medication?: Medication;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  location: string;
  reorderLevel: number;
  reorderQuantity: number;
  status: 'active' | 'expired' | 'recalled' | 'quarantine';
  cost: number;
  supplier: string;
  receivedDate: string;
  lastCountDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  prescription?: Prescription;
  dispensedDate: string;
  dispensedBy: string;
  dispensedByName?: string;
  quantity: number;
  lotNumber: string;
  deaForm?: string;
  witnessedBy?: string;
  patientSignature?: string;
  idVerified: boolean;
  idType?: string;
  idNumber?: string;
  labelPrinted: boolean;
  labelPrintedAt?: string;
  counselingOffered: boolean;
  counselingAccepted?: boolean;
  counseledBy?: string;
  createdAt: string;
}

export interface ControlledSubstanceLog {
  id: string;
  medicationId: string;
  medication?: Medication;
  action: 'receive' | 'dispense' | 'waste' | 'transfer' | 'inventory_adjustment';
  quantity: number;
  runningBalance: number;
  prescriptionId?: string;
  dispensingRecordId?: string;
  performedBy: string;
  performedByName?: string;
  witnessedBy?: string;
  witnessedByName?: string;
  lotNumber?: string;
  reason?: string;
  deaForm?: string;
  timestamp: string;
  createdAt: string;
}

export interface FormularyEntry {
  id: string;
  medicationId: string;
  medication?: Medication;
  tier: 1 | 2 | 3 | 4 | 5;
  status: 'preferred' | 'alternative' | 'non-formulary' | 'restricted';
  requiresPriorAuth: boolean;
  priorAuthCriteria?: string;
  quantityLimits?: {
    maxQuantity: number;
    period: 'day' | 'week' | 'month' | 'year';
  };
  stepTherapyRequired: boolean;
  stepTherapyAlternatives?: string[];
  notes?: string;
  effectiveDate: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteractionCheckResult {
  safe: boolean;
  interactions: any[];
  allergyAlerts: any[];
  diseaseContraindications: any[];
  foodInteractions: any[];
  clinicalWarnings: any[];
  requiresPrescriberNotification: boolean;
}

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  requestedDate: string;
  requestedBy: 'patient' | 'prescriber' | 'pharmacy';
  status: 'pending' | 'approved' | 'denied' | 'prescriber_review';
  denialReason?: string;
  processedDate?: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class PharmacyService {
  // Medications
  async getMedications(filters?: {
    isControlled?: boolean;
    deaSchedule?: string;
    formularyStatus?: string;
    therapeuticClass?: string;
  }): Promise<Medication[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/medications?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async getMedication(id: string): Promise<Medication | null> {
    const response = await fetch(`${API_BASE_URL}/medications/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const response = await fetch(`${API_BASE_URL}/medications/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.data || [];
  }

  async createMedication(medication: Partial<Medication>): Promise<Medication> {
    const response = await fetch(`${API_BASE_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medication),
    });
    const data = await response.json();
    return data.data;
  }

  // Inventory
  async getInventory(filters?: {
    status?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/inventory?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  }

  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return data.data;
  }

  async updateInventoryQuantity(id: string, quantityChange: number, reason: string): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/quantity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantityChange, reason }),
    });
    const data = await response.json();
    return data.data;
  }

  // Prescriptions
  async getPrescriptions(filters?: {
    status?: string;
    priority?: string;
    isControlled?: boolean;
    patientId?: string;
  }): Promise<Prescription[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/prescriptions?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async getPrescription(id: string): Promise<Prescription | null> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  }

  async createPrescription(prescription: Partial<Prescription>): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescription),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create prescription');
    }
    return data.data;
  }

  async updatePrescriptionStatus(id: string, status: Prescription['status'], notes?: string): Promise<Prescription> {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    const data = await response.json();
    return data.data;
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
  }): Promise<DispensingRecord> {
    const response = await fetch(`${API_BASE_URL}/dispense/${data.prescriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to dispense prescription');
    }
    return result.data;
  }

  async getDispensingQueue(): Promise<Prescription[]> {
    const response = await fetch(`${API_BASE_URL}/dispense/queue`);
    const data = await response.json();
    return data.data || [];
  }

  // Controlled Substances
  async getControlledSubstanceLogs(filters?: {
    medicationId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ControlledSubstanceLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/controlled-substances/logs?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async logControlledSubstance(log: Partial<ControlledSubstanceLog>): Promise<ControlledSubstanceLog> {
    const response = await fetch(`${API_BASE_URL}/controlled-substances/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    const data = await response.json();
    return data.data;
  }

  // Formulary
  async getFormulary(filters?: {
    tier?: number;
    status?: string;
  }): Promise<FormularyEntry[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/formulary?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async getFormularyEntry(medicationId: string): Promise<FormularyEntry | null> {
    const response = await fetch(`${API_BASE_URL}/formulary/medication/${medicationId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  }

  async createFormularyEntry(entry: Partial<FormularyEntry>): Promise<FormularyEntry> {
    const response = await fetch(`${API_BASE_URL}/formulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const data = await response.json();
    return data.data;
  }

  // Drug Interactions
  async checkDrugInteractions(data: {
    medicationId: string;
    currentMedications?: any[];
    patientData?: any;
  }): Promise<InteractionCheckResult> {
    const response = await fetch(`${API_BASE_URL}/interactions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.data;
  }

  // Refills
  async getRefillRequests(filters?: {
    patientId?: string;
    status?: string;
  }): Promise<RefillRequest[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/refills?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async createRefillRequest(prescriptionId: string, requestedBy: RefillRequest['requestedBy']): Promise<RefillRequest> {
    const response = await fetch(`${API_BASE_URL}/refills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId, requestedBy }),
    });
    const data = await response.json();
    return data.data;
  }

  async approveRefillRequest(id: string, processedBy: string): Promise<RefillRequest> {
    const response = await fetch(`${API_BASE_URL}/refills/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processedBy }),
    });
    const data = await response.json();
    return data.data;
  }

  async denyRefillRequest(id: string, reason: string, processedBy: string): Promise<RefillRequest> {
    const response = await fetch(`${API_BASE_URL}/refills/${id}/deny`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, processedBy }),
    });
    const data = await response.json();
    return data.data;
  }

  // E-Prescribing
  async getEPrescriptions(filters?: {
    status?: string;
    messageType?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/eprescribe?${params}`);
    const data = await response.json();
    return data.data || [];
  }

  async acceptEPrescription(id: string, processedBy: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/eprescribe/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processedBy }),
    });
    const data = await response.json();
    return data.data;
  }

  async rejectEPrescription(id: string, reason: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/eprescribe/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    return data.data;
  }
}

const pharmacyService = new PharmacyService();
export default pharmacyService;
