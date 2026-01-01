/**
 * Laboratory Frontend Service
 * API client for laboratory operations
 */

export class LaboratoryService {
  private baseURL: string;

  constructor(baseURL = "/api/laboratory") {
    this.baseURL = baseURL;
  }

  // ==================== ORDERS ====================

  async createOrder(orderData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    return this.handleResponse(response);
  }

  async createOrderFromPanel(panelId: string, orderData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/panel/${panelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    return this.handleResponse(response);
  }

  async getOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/${orderId}`);
    return this.handleResponse(response);
  }

  async getOrdersByPatient(patientId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/patient/${patientId}`);
    return this.handleResponse(response);
  }

  async getPendingOrders(): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/pending`);
    return this.handleResponse(response);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    return this.handleResponse(response);
  }

  async cancelOrder(orderId: string, reason: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    return this.handleResponse(response);
  }

  async generateHL7Order(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/${orderId}/hl7`);
    return this.handleResponse(response);
  }

  // ==================== RESULTS ====================

  async addResult(resultData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData),
    });

    return this.handleResponse(response);
  }

  async verifyResult(resultId: string, verifiedBy: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/results/${resultId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verifiedBy }),
    });

    return this.handleResponse(response);
  }

  async getResultsForOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/results/order/${orderId}`);
    return this.handleResponse(response);
  }

  async getResultsForPatient(patientId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/results/patient/${patientId}`,
    );
    return this.handleResponse(response);
  }

  async getCriticalResults(): Promise<any> {
    const response = await fetch(`${this.baseURL}/results/critical`);
    return this.handleResponse(response);
  }

  async searchResults(criteria: any): Promise<any> {
    const params = new URLSearchParams(criteria);
    const response = await fetch(`${this.baseURL}/results/search?${params}`);
    return this.handleResponse(response);
  }

  async generateHL7Result(orderId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/results/order/${orderId}/hl7`,
    );
    return this.handleResponse(response);
  }

  // ==================== SPECIMENS ====================

  async createSpecimen(specimenData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/specimens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(specimenData),
    });

    return this.handleResponse(response);
  }

  async getSpecimen(specimenId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/specimens/${specimenId}`);
    return this.handleResponse(response);
  }

  async getSpecimenByBarcode(barcode: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/barcode/${barcode}`,
    );
    return this.handleResponse(response);
  }

  async getSpecimensForOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/specimens/order/${orderId}`);
    return this.handleResponse(response);
  }

  async receiveSpecimen(specimenId: string, receivedBy: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/${specimenId}/receive`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedBy }),
      },
    );

    return this.handleResponse(response);
  }

  async updateSpecimenStatus(
    specimenId: string,
    status: string,
    performedBy: string,
    notes?: string,
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/${specimenId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, performedBy, notes }),
      },
    );

    return this.handleResponse(response);
  }

  async rejectSpecimen(
    specimenId: string,
    reason: string,
    rejectedBy: string,
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/${specimenId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, rejectedBy }),
      },
    );

    return this.handleResponse(response);
  }

  async addQualityIssue(specimenId: string, issueData: any): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/${specimenId}/quality-issue`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData),
      },
    );

    return this.handleResponse(response);
  }

  async getTrackingHistory(specimenId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/specimens/${specimenId}/tracking`,
    );
    return this.handleResponse(response);
  }

  // ==================== PANELS ====================

  async getPanels(): Promise<any> {
    const response = await fetch(`${this.baseURL}/panels`);
    return this.handleResponse(response);
  }

  async getPanel(panelId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/panels/${panelId}`);
    return this.handleResponse(response);
  }

  async createPanel(panelData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/panels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(panelData),
    });

    return this.handleResponse(response);
  }

  // ==================== REFERENCE ====================

  async getLOINCCodes(): Promise<any> {
    const response = await fetch(`${this.baseURL}/reference/loinc`);
    return this.handleResponse(response);
  }

  async searchLOINCCodes(query: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/reference/loinc/search?query=${encodeURIComponent(query)}`,
    );
    return this.handleResponse(response);
  }

  async getLOINCCode(code: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/reference/loinc/${code}`);
    return this.handleResponse(response);
  }

  async getReferenceRanges(): Promise<any> {
    const response = await fetch(`${this.baseURL}/reference/reference-ranges`);
    return this.handleResponse(response);
  }

  async getReferenceRange(
    loincCode: string,
    age: number,
    gender: string,
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/reference/reference-ranges/${loincCode}?age=${age}&gender=${gender}`,
    );
    return this.handleResponse(response);
  }

  async getCommonPanels(): Promise<any> {
    const response = await fetch(`${this.baseURL}/reference/common-panels`);
    return this.handleResponse(response);
  }

  // ==================== QUALITY CONTROL ====================

  async recordQC(qcData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/reference/qc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qcData),
    });

    return this.handleResponse(response);
  }

  async getQCRecords(
    testCode?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any> {
    const params = new URLSearchParams();
    if (testCode) params.append("testCode", testCode);
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());
    if (dateTo) params.append("dateTo", dateTo.toISOString());

    const response = await fetch(`${this.baseURL}/reference/qc?${params}`);
    return this.handleResponse(response);
  }

  async getFailedQC(dateFrom?: Date): Promise<any> {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom.toISOString());

    const response = await fetch(
      `${this.baseURL}/reference/qc/failed?${params}`,
    );
    return this.handleResponse(response);
  }

  // ==================== HELPERS ====================

  private async handleResponse(response: Response): Promise<any> {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "An error occurred");
    }

    return data.data;
  }
}

export const labService = new LaboratoryService();
