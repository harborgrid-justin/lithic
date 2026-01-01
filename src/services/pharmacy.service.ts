/**
 * Pharmacy Service
 * Core service for pharmacy operations, drug information, and inventory management
 */

export interface Drug {
  id: string;
  ndc: string; // National Drug Code (11-digit)
  name: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  deaSchedule?: 'I' | 'II' | 'III' | 'IV' | 'V'; // Controlled substance schedule
  rxcui?: string; // RxNorm Concept Unique Identifier
  packageSize: string;
  unitOfMeasure: string;
  category: string;
  therapeutic_class: string;
}

export interface InventoryItem {
  id: string;
  drugId: string;
  drug: Drug;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  location: string;
  reorderLevel: number;
  reorderQuantity: number;
  costPerUnit: number;
  wholesaler: string;
  lastRestocked: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired' | 'recalled';
}

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffects: string;
  management: string;
  documentation: string;
  source: string;
}

export interface FormularyEntry {
  id: string;
  drugId: string;
  drug: Drug;
  tier: number;
  status: 'preferred' | 'non-preferred' | 'restricted' | 'not-covered';
  priorAuthRequired: boolean;
  quantityLimit?: number;
  stepTherapyRequired: boolean;
  alternatives?: string[];
  restrictions?: string;
  effectiveDate: string;
  endDate?: string;
}

export interface ControlledSubstanceLog {
  id: string;
  transactionType: 'receive' | 'dispense' | 'waste' | 'transfer' | 'inventory-count';
  drugId: string;
  drug: Drug;
  ndc: string;
  quantity: number;
  lotNumber: string;
  prescriptionId?: string;
  patientId?: string;
  dispensedBy?: string;
  verifiedBy?: string;
  witnessedBy?: string;
  timestamp: string;
  reason?: string;
  notes?: string;
}

class PharmacyService {
  private apiBase = '/api/pharmacy';

  /**
   * Drug Database Operations
   */
  async searchDrugs(query: string, filters?: {
    dosageForm?: string;
    strength?: string;
    controlled?: boolean;
  }): Promise<Drug[]> {
    const params = new URLSearchParams({ q: query });
    if (filters?.dosageForm) params.append('dosageForm', filters.dosageForm);
    if (filters?.strength) params.append('strength', filters.strength);
    if (filters?.controlled !== undefined) params.append('controlled', String(filters.controlled));

    const response = await fetch(`${this.apiBase}/drugs/search?${params}`);
    if (!response.ok) throw new Error('Failed to search drugs');
    return response.json();
  }

  async getDrugByNDC(ndc: string): Promise<Drug> {
    const response = await fetch(`${this.apiBase}/drugs/ndc/${ndc}`);
    if (!response.ok) throw new Error('Drug not found');
    return response.json();
  }

  async getDrugInfo(drugId: string): Promise<Drug & {
    indications?: string;
    contraindications?: string;
    warnings?: string;
    adverseReactions?: string;
    dosageAndAdministration?: string;
  }> {
    const response = await fetch(`${this.apiBase}/drugs/${drugId}`);
    if (!response.ok) throw new Error('Failed to get drug information');
    return response.json();
  }

  /**
   * Inventory Management
   */
  async getInventory(filters?: {
    status?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.lowStock) params.append('lowStock', 'true');
    if (filters?.expiringSoon) params.append('expiringSoon', 'true');

    const response = await fetch(`${this.apiBase}/inventory?${params}`);
    if (!response.ok) throw new Error('Failed to get inventory');
    return response.json();
  }

  async updateInventory(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await fetch(`${this.apiBase}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    return response.json();
  }

  async recordInventoryReceipt(data: {
    drugId: string;
    lotNumber: string;
    expirationDate: string;
    quantity: number;
    location: string;
    costPerUnit: number;
    wholesaler: string;
  }): Promise<InventoryItem> {
    const response = await fetch(`${this.apiBase}/inventory/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to record inventory receipt');
    return response.json();
  }

  async performInventoryCount(items: Array<{
    inventoryId: string;
    countedQuantity: number;
    countedBy: string;
  }>): Promise<void> {
    const response = await fetch(`${this.apiBase}/inventory/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error('Failed to perform inventory count');
  }

  /**
   * Drug Interaction Checking
   */
  async checkInteractions(drugIds: string[]): Promise<DrugInteraction[]> {
    const response = await fetch(`${this.apiBase}/interactions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugIds }),
    });
    if (!response.ok) throw new Error('Failed to check drug interactions');
    return response.json();
  }

  async checkInteractionByNDC(ndcCodes: string[]): Promise<DrugInteraction[]> {
    const response = await fetch(`${this.apiBase}/interactions/check-ndc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ndcCodes }),
    });
    if (!response.ok) throw new Error('Failed to check drug interactions');
    return response.json();
  }

  /**
   * Formulary Management
   */
  async searchFormulary(query: string, filters?: {
    tier?: number;
    status?: string;
    priorAuthRequired?: boolean;
  }): Promise<FormularyEntry[]> {
    const params = new URLSearchParams({ q: query });
    if (filters?.tier) params.append('tier', String(filters.tier));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priorAuthRequired !== undefined) {
      params.append('priorAuth', String(filters.priorAuthRequired));
    }

    const response = await fetch(`${this.apiBase}/formulary/search?${params}`);
    if (!response.ok) throw new Error('Failed to search formulary');
    return response.json();
  }

  async getFormularyEntry(drugId: string): Promise<FormularyEntry | null> {
    const response = await fetch(`${this.apiBase}/formulary/${drugId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to get formulary entry');
    return response.json();
  }

  async getFormularyAlternatives(drugId: string): Promise<FormularyEntry[]> {
    const response = await fetch(`${this.apiBase}/formulary/${drugId}/alternatives`);
    if (!response.ok) throw new Error('Failed to get formulary alternatives');
    return response.json();
  }

  /**
   * Controlled Substance Management
   */
  async getControlledSubstanceLog(filters?: {
    startDate?: string;
    endDate?: string;
    drugId?: string;
    transactionType?: string;
  }): Promise<ControlledSubstanceLog[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.drugId) params.append('drugId', filters.drugId);
    if (filters?.transactionType) params.append('transactionType', filters.transactionType);

    const response = await fetch(`${this.apiBase}/controlled/log?${params}`);
    if (!response.ok) throw new Error('Failed to get controlled substance log');
    return response.json();
  }

  async recordControlledSubstanceTransaction(
    data: Omit<ControlledSubstanceLog, 'id' | 'timestamp'>
  ): Promise<ControlledSubstanceLog> {
    const response = await fetch(`${this.apiBase}/controlled/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to record controlled substance transaction');
    return response.json();
  }

  async getControlledSubstanceBalance(drugId: string, lotNumber?: string): Promise<{
    drugId: string;
    drug: Drug;
    lotNumber?: string;
    balance: number;
    lastUpdated: string;
  }> {
    const params = new URLSearchParams();
    if (lotNumber) params.append('lotNumber', lotNumber);

    const response = await fetch(`${this.apiBase}/controlled/${drugId}/balance?${params}`);
    if (!response.ok) throw new Error('Failed to get controlled substance balance');
    return response.json();
  }

  /**
   * NDC Validation and Formatting
   */
  validateNDC(ndc: string): boolean {
    // Remove hyphens for validation
    const cleaned = ndc.replace(/-/g, '');

    // NDC must be 10 or 11 digits
    if (!/^\d{10,11}$/.test(cleaned)) {
      return false;
    }

    return true;
  }

  formatNDC(ndc: string, format: '5-4-2' | '5-3-2' | '4-4-2' = '5-4-2'): string {
    const cleaned = ndc.replace(/-/g, '');

    if (cleaned.length === 10) {
      // Pad to 11 digits based on format
      if (format === '5-4-2') {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
      } else if (format === '5-3-2') {
        return `${cleaned.slice(0, 5)}-0${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
      } else {
        return `0${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
      }
    }

    if (cleaned.length === 11) {
      if (format === '5-4-2') {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
      } else if (format === '5-3-2') {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
      } else {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
      }
    }

    return ndc;
  }

  /**
   * Days Supply Calculation
   */
  calculateDaysSupply(
    quantity: number,
    sig: string,
    dosageForm: string
  ): number {
    // Parse sig for dosing frequency
    // This is a simplified calculation - production would use more sophisticated parsing
    const qtyPerDay = this.parseQuantityPerDay(sig, dosageForm);
    if (qtyPerDay === 0) return 30; // Default to 30 days if unable to parse

    return Math.floor(quantity / qtyPerDay);
  }

  private parseQuantityPerDay(sig: string, dosageForm: string): number {
    const sigLower = sig.toLowerCase();

    // Common patterns
    if (sigLower.includes('once daily') || sigLower.includes('qd')) return 1;
    if (sigLower.includes('twice daily') || sigLower.includes('bid')) return 2;
    if (sigLower.includes('three times daily') || sigLower.includes('tid')) return 3;
    if (sigLower.includes('four times daily') || sigLower.includes('qid')) return 4;
    if (sigLower.includes('every 12 hours') || sigLower.includes('q12h')) return 2;
    if (sigLower.includes('every 8 hours') || sigLower.includes('q8h')) return 3;
    if (sigLower.includes('every 6 hours') || sigLower.includes('q6h')) return 4;

    // Try to extract numeric value
    const match = sigLower.match(/(\d+)\s*(tablet|capsule|pill|tab|cap)/);
    if (match) {
      const qty = parseInt(match[1]);
      if (sigLower.includes('daily')) return qty;
      if (sigLower.includes('twice')) return qty * 2;
      if (sigLower.includes('three times')) return qty * 3;
    }

    return 1; // Default
  }
}

export const pharmacyService = new PharmacyService();
export default pharmacyService;
