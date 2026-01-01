/**
 * Laboratory Service
 * Manages laboratory orders, results, and panels
 */

import {
  getLOINCCode,
  COMMON_PANELS,
} from "../../../shared/constants/loinc-codes";
import {
  getReferenceRange,
  getAbnormalityFlag,
  isCritical,
} from "../../../shared/constants/reference-ranges";

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  orderingProviderId: string;
  orderingProviderName: string;
  orderDateTime: Date;
  priority: "routine" | "urgent" | "stat" | "asap";
  status:
    | "pending"
    | "collected"
    | "received"
    | "processing"
    | "completed"
    | "cancelled"
    | "on-hold";
  tests: LabTest[];
  clinicalInfo?: string;
  diagnosis?: string;
  specimenIds?: string[];
  collectionDateTime?: Date;
  receivedDateTime?: Date;
  completedDateTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabTest {
  id: string;
  loincCode: string;
  testName: string;
  testCode: string;
  category: string;
  specimenType: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "routine" | "urgent" | "stat";
  orderedDateTime: Date;
  collectedDateTime?: Date;
  resultedDateTime?: Date;
  performingLab?: string;
  results?: LabResult[];
}

export interface LabResult {
  id: string;
  orderId: string;
  testId: string;
  loincCode: string;
  testName: string;
  value: string | number;
  valueType: "numeric" | "text" | "coded";
  unit?: string;
  referenceRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  abnormalFlag?: "L" | "H" | "LL" | "HH" | "N" | "A";
  critical: boolean;
  status: "preliminary" | "final" | "corrected" | "cancelled";
  performedDateTime: Date;
  verifiedDateTime?: Date;
  verifiedBy?: string;
  performedBy?: string;
  instrument?: string;
  method?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabPanel {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  tests: string[]; // LOINC codes
  specimenTypes: string[];
  turnaroundTime?: number; // in hours
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityControl {
  id: string;
  testCode: string;
  testName: string;
  controlLevel: "low" | "normal" | "high";
  lotNumber: string;
  expirationDate: Date;
  expectedValue: number;
  measuredValue: number;
  unit: string;
  acceptableRange: {
    min: number;
    max: number;
  };
  passed: boolean;
  performedDateTime: Date;
  performedBy: string;
  instrument?: string;
  comments?: string;
}

export class LaboratoryService {
  private orders: Map<string, LabOrder> = new Map();
  private results: Map<string, LabResult> = new Map();
  private panels: Map<string, LabPanel> = new Map();
  private qcRecords: Map<string, QualityControl> = new Map();

  constructor() {
    this.initializeCommonPanels();
  }

  /**
   * Initialize common lab panels
   */
  private initializeCommonPanels(): void {
    Object.entries(COMMON_PANELS).forEach(([key, panel]) => {
      const labPanel: LabPanel = {
        id: `PANEL-${key}`,
        code: panel.code,
        name: panel.name,
        description: panel.name,
        category: "chemistry",
        tests: panel.tests,
        specimenTypes: ["blood-serum", "blood-plasma"],
        turnaroundTime: 4,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.panels.set(labPanel.id, labPanel);
    });
  }

  /**
   * Create new lab order
   */
  async createOrder(
    orderData: Omit<
      LabOrder,
      "id" | "orderNumber" | "status" | "createdAt" | "updatedAt"
    >,
  ): Promise<LabOrder> {
    const id = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const orderNumber = `LAB${Date.now()}`;

    const order: LabOrder = {
      ...orderData,
      id,
      orderNumber,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(id, order);

    return order;
  }

  /**
   * Create order from panel
   */
  async createOrderFromPanel(
    panelId: string,
    orderData: Partial<LabOrder>,
  ): Promise<LabOrder> {
    const panel = this.panels.get(panelId);
    if (!panel) {
      throw new Error("Panel not found");
    }

    const tests: LabTest[] = panel.tests.map((loincCode, index) => {
      const loincData = getLOINCCode(loincCode);

      return {
        id: `TEST-${Date.now()}-${index}`,
        loincCode,
        testName:
          loincData?.commonName || loincData?.displayName || "Unknown Test",
        testCode: loincCode,
        category: loincData?.category || "unknown",
        specimenType: panel.specimenTypes[0] || "blood-serum",
        status: "pending",
        priority: orderData.priority || "routine",
        orderedDateTime: new Date(),
      };
    });

    return this.createOrder({
      patientId: orderData.patientId || "",
      patientName: orderData.patientName || "",
      patientMRN: orderData.patientMRN || "",
      orderingProviderId: orderData.orderingProviderId || "",
      orderingProviderName: orderData.orderingProviderName || "",
      orderDateTime: orderData.orderDateTime || new Date(),
      priority: orderData.priority || "routine",
      tests,
      clinicalInfo: orderData.clinicalInfo,
      diagnosis: orderData.diagnosis,
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: LabOrder["status"],
  ): Promise<LabOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    order.status = status;
    order.updatedAt = new Date();

    if (status === "completed") {
      order.completedDateTime = new Date();
    }

    this.orders.set(orderId, order);

    return order;
  }

  /**
   * Add result to order
   */
  async addResult(
    resultData: Omit<LabResult, "id" | "createdAt" | "updatedAt">,
  ): Promise<LabResult> {
    const id = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Get patient info to determine abnormal flags
    const order = this.orders.get(resultData.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate reference range and abnormal flag for numeric values
    let referenceRange = resultData.referenceRange;
    let abnormalFlag = resultData.abnormalFlag;
    let critical = resultData.critical;

    if (
      resultData.valueType === "numeric" &&
      typeof resultData.value === "number"
    ) {
      // For demo purposes, use default age/gender
      const refRange = getReferenceRange(resultData.loincCode, 35, "male");

      if (refRange) {
        referenceRange = {
          min: refRange.minValue,
          max: refRange.maxValue,
          text: `${refRange.minValue || ""}-${refRange.maxValue || ""} ${refRange.unit}`,
        };

        abnormalFlag = getAbnormalityFlag(
          resultData.loincCode,
          resultData.value,
          35,
          "male",
        );
        critical = isCritical(
          resultData.loincCode,
          resultData.value,
          35,
          "male",
        );
      }
    }

    const result: LabResult = {
      ...resultData,
      id,
      referenceRange,
      abnormalFlag,
      critical,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.results.set(id, result);

    // Update test status
    const test = order.tests.find((t) => t.id === resultData.testId);
    if (test) {
      test.status = "completed";
      test.resultedDateTime = new Date();
      test.results = test.results || [];
      test.results.push(result);
    }

    // Check if all tests are completed
    const allCompleted = order.tests.every((t) => t.status === "completed");
    if (allCompleted) {
      await this.updateOrderStatus(order.id, "completed");
    }

    this.orders.set(order.id, order);

    return result;
  }

  /**
   * Verify result
   */
  async verifyResult(resultId: string, verifiedBy: string): Promise<LabResult> {
    const result = this.results.get(resultId);
    if (!result) {
      throw new Error("Result not found");
    }

    result.status = "final";
    result.verifiedDateTime = new Date();
    result.verifiedBy = verifiedBy;
    result.updatedAt = new Date();

    this.results.set(resultId, result);

    return result;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<LabOrder | undefined> {
    return this.orders.get(orderId);
  }

  /**
   * Get orders by patient
   */
  async getOrdersByPatient(patientId: string): Promise<LabOrder[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.patientId === patientId)
      .sort((a, b) => b.orderDateTime.getTime() - a.orderDateTime.getTime());
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: LabOrder["status"]): Promise<LabOrder[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.status === status)
      .sort((a, b) => b.orderDateTime.getTime() - a.orderDateTime.getTime());
  }

  /**
   * Get pending orders
   */
  async getPendingOrders(): Promise<LabOrder[]> {
    return Array.from(this.orders.values())
      .filter(
        (order) => order.status !== "completed" && order.status !== "cancelled",
      )
      .sort((a, b) => {
        // STAT orders first
        if (a.priority === "stat" && b.priority !== "stat") return -1;
        if (b.priority === "stat" && a.priority !== "stat") return 1;

        // Then by order date
        return a.orderDateTime.getTime() - b.orderDateTime.getTime();
      });
  }

  /**
   * Get critical results
   */
  async getCriticalResults(): Promise<LabResult[]> {
    return Array.from(this.results.values())
      .filter((result) => result.critical)
      .sort(
        (a, b) => b.performedDateTime.getTime() - a.performedDateTime.getTime(),
      );
  }

  /**
   * Get results for order
   */
  async getResultsForOrder(orderId: string): Promise<LabResult[]> {
    return Array.from(this.results.values())
      .filter((result) => result.orderId === orderId)
      .sort(
        (a, b) => a.performedDateTime.getTime() - b.performedDateTime.getTime(),
      );
  }

  /**
   * Get results for patient
   */
  async getResultsForPatient(patientId: string): Promise<LabResult[]> {
    const patientOrders = await this.getOrdersByPatient(patientId);
    const orderIds = patientOrders.map((o) => o.id);

    return Array.from(this.results.values())
      .filter((result) => orderIds.includes(result.orderId))
      .sort(
        (a, b) => b.performedDateTime.getTime() - a.performedDateTime.getTime(),
      );
  }

  /**
   * Search results
   */
  async searchResults(criteria: {
    patientId?: string;
    loincCode?: string;
    dateFrom?: Date;
    dateTo?: Date;
    critical?: boolean;
  }): Promise<LabResult[]> {
    let results = Array.from(this.results.values());

    if (criteria.patientId) {
      const patientOrders = await this.getOrdersByPatient(criteria.patientId);
      const orderIds = patientOrders.map((o) => o.id);
      results = results.filter((r) => orderIds.includes(r.orderId));
    }

    if (criteria.loincCode) {
      results = results.filter((r) => r.loincCode === criteria.loincCode);
    }

    if (criteria.dateFrom) {
      results = results.filter(
        (r) => r.performedDateTime >= criteria.dateFrom!,
      );
    }

    if (criteria.dateTo) {
      results = results.filter((r) => r.performedDateTime <= criteria.dateTo!);
    }

    if (criteria.critical !== undefined) {
      results = results.filter((r) => r.critical === criteria.critical);
    }

    return results.sort(
      (a, b) => b.performedDateTime.getTime() - a.performedDateTime.getTime(),
    );
  }

  /**
   * Create lab panel
   */
  async createPanel(
    panelData: Omit<LabPanel, "id" | "createdAt" | "updatedAt">,
  ): Promise<LabPanel> {
    const id = `PANEL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const panel: LabPanel = {
      ...panelData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.panels.set(id, panel);

    return panel;
  }

  /**
   * Get all panels
   */
  async getPanels(): Promise<LabPanel[]> {
    return Array.from(this.panels.values())
      .filter((panel) => panel.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get panel by ID
   */
  async getPanel(panelId: string): Promise<LabPanel | undefined> {
    return this.panels.get(panelId);
  }

  /**
   * Record quality control
   */
  async recordQC(
    qcData: Omit<QualityControl, "id" | "passed">,
  ): Promise<QualityControl> {
    const id = `QC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const passed =
      qcData.measuredValue >= qcData.acceptableRange.min &&
      qcData.measuredValue <= qcData.acceptableRange.max;

    const qc: QualityControl = {
      ...qcData,
      id,
      passed,
    };

    this.qcRecords.set(id, qc);

    return qc;
  }

  /**
   * Get QC records
   */
  async getQCRecords(
    testCode?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<QualityControl[]> {
    let records = Array.from(this.qcRecords.values());

    if (testCode) {
      records = records.filter((qc) => qc.testCode === testCode);
    }

    if (dateFrom) {
      records = records.filter((qc) => qc.performedDateTime >= dateFrom);
    }

    if (dateTo) {
      records = records.filter((qc) => qc.performedDateTime <= dateTo);
    }

    return records.sort(
      (a, b) => b.performedDateTime.getTime() - a.performedDateTime.getTime(),
    );
  }

  /**
   * Get failed QC records
   */
  async getFailedQC(dateFrom?: Date): Promise<QualityControl[]> {
    let records = Array.from(this.qcRecords.values()).filter(
      (qc) => !qc.passed,
    );

    if (dateFrom) {
      records = records.filter((qc) => qc.performedDateTime >= dateFrom);
    }

    return records.sort(
      (a, b) => b.performedDateTime.getTime() - a.performedDateTime.getTime(),
    );
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string): Promise<LabOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    order.status = "cancelled";
    order.notes = (order.notes || "") + `\nCancelled: ${reason}`;
    order.updatedAt = new Date();

    // Cancel all tests
    order.tests.forEach((test) => {
      test.status = "cancelled";
    });

    this.orders.set(orderId, order);

    return order;
  }
}
