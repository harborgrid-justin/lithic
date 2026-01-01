// Laboratory Service - Business logic for laboratory operations
import {
  LabOrder,
  LabResult,
  LabPanel,
  LabTest,
  OrderStatus,
  ResultStatus,
  ResultFlag,
  CriticalAlert,
  LabStatistics,
  HL7Message,
} from '@/types/laboratory';
import { getReferenceRange, evaluateResult } from '@/lib/reference-ranges';
import { COMMON_LOINC_CODES } from '@/lib/loinc-codes';

export class LaboratoryService {
  private static baseUrl = '/api/laboratory';

  // Orders
  static async getOrders(filters?: {
    status?: OrderStatus;
    patientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<LabOrder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

    const response = await fetch(`${this.baseUrl}/orders?${params}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }

  static async getOrderById(id: string): Promise<LabOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  }

  static async createOrder(order: Omit<LabOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<LabOrder> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  }

  static async updateOrder(id: string, updates: Partial<LabOrder>): Promise<LabOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  }

  static async cancelOrder(id: string, reason: string): Promise<LabOrder> {
    return this.updateOrder(id, {
      status: 'CANCELLED',
      notes: reason,
    });
  }

  // Results
  static async getResults(filters?: {
    orderId?: string;
    patientId?: string;
    status?: ResultStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<LabResult[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

    const response = await fetch(`${this.baseUrl}/results?${params}`);
    if (!response.ok) throw new Error('Failed to fetch results');
    return response.json();
  }

  static async getResultById(id: string): Promise<LabResult> {
    const response = await fetch(`${this.baseUrl}/results/${id}`);
    if (!response.ok) throw new Error('Failed to fetch result');
    return response.json();
  }

  static async createResult(result: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<LabResult> {
    // Evaluate result against reference ranges
    const evaluatedResult = this.evaluateLabResult(result);

    const response = await fetch(`${this.baseUrl}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluatedResult),
    });
    if (!response.ok) throw new Error('Failed to create result');
    return response.json();
  }

  static async updateResult(id: string, updates: Partial<LabResult>): Promise<LabResult> {
    const response = await fetch(`${this.baseUrl}/results/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update result');
    return response.json();
  }

  static async verifyResult(id: string, verifiedBy: string): Promise<LabResult> {
    return this.updateResult(id, {
      status: 'FINAL',
      verifiedBy,
      verifiedAt: new Date(),
    });
  }

  static async releaseResult(id: string, releasedBy: string): Promise<LabResult> {
    return this.updateResult(id, {
      releasedBy,
      releasedAt: new Date(),
    });
  }

  // Panels
  static async getPanels(): Promise<LabPanel[]> {
    const response = await fetch(`${this.baseUrl}/panels`);
    if (!response.ok) throw new Error('Failed to fetch panels');
    return response.json();
  }

  static async createPanel(panel: Omit<LabPanel, 'id' | 'createdAt' | 'updatedAt'>): Promise<LabPanel> {
    const response = await fetch(`${this.baseUrl}/panels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(panel),
    });
    if (!response.ok) throw new Error('Failed to create panel');
    return response.json();
  }

  // Reference Ranges
  static async getReferenceRanges(loincCode?: string): Promise<any[]> {
    const params = loincCode ? `?loincCode=${loincCode}` : '';
    const response = await fetch(`${this.baseUrl}/reference${params}`);
    if (!response.ok) throw new Error('Failed to fetch reference ranges');
    return response.json();
  }

  // Helper Methods
  static evaluateLabResult(result: Partial<LabResult>): Partial<LabResult> {
    if (!result.value || typeof result.value !== 'number' || !result.loincCode) {
      return result;
    }

    const refRange = getReferenceRange(result.loincCode);
    if (!refRange) {
      return result;
    }

    const flag = evaluateResult(result.value, refRange);
    const isCritical = flag === 'CRITICAL_HIGH' || flag === 'CRITICAL_LOW';

    return {
      ...result,
      flag,
      isCritical,
      referenceRange: `${refRange.low || ''}-${refRange.high || ''} ${refRange.unit}`,
    };
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  static generateAccessionNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${day}-${random}`;
  }

  static generateHL7OrderMessage(order: LabOrder): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageId = `MSG${timestamp}`;

    const msh = `MSH|^~\\&|LIS|LITHIC|EMR|HOSPITAL|${timestamp}||ORM^O01|${messageId}|P|2.5`;
    const pid = `PID|1||${order.patientMRN}||${order.patientName}||${order.patientDOB}|${order.patientGender}`;
    const orc = `ORC|NW|${order.orderNumber}||||||${timestamp}`;
    const obr = order.tests.map((testCode, index) => {
      return `OBR|${index + 1}|${order.orderNumber}||${testCode}|||${timestamp}||||||||${order.orderingPhysician}`;
    }).join('\r\n');

    return `${msh}\r\n${pid}\r\n${orc}\r\n${obr}`;
  }

  static generateHL7ResultMessage(result: LabResult): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageId = `MSG${timestamp}`;

    const msh = `MSH|^~\\&|LIS|LITHIC|EMR|HOSPITAL|${timestamp}||ORU^R01|${messageId}|P|2.5`;
    const pid = `PID|1||${result.patientMRN}||${result.patientName}`;
    const obr = `OBR|1|${result.orderNumber}||${result.loincCode}|||${result.performedAt}`;
    const obx = `OBX|1|NM|${result.loincCode}^${result.testName}||${result.value}|${result.unit}|${result.referenceRange}|${result.flag}|||${result.status}|||${result.performedAt}`;

    return `${msh}\r\n${pid}\r\n${obr}\r\n${obx}`;
  }
}

export default LaboratoryService;
