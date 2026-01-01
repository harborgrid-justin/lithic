/**
 * BillingService - Frontend service for billing API calls
 */

export class BillingService {
  private baseUrl: string = '/api/billing';

  // ==================== CLAIMS ====================

  async getClaims(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/claims?${queryString}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getClaimById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/${id}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createClaim(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async updateClaim(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async submitClaim(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/${id}/submit`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async submitBatchClaims(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/batch/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getClaimHistory(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/${id}/history`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createAppeal(claimId: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/claims/${claimId}/appeal`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // ==================== PAYMENTS ====================

  async getPayments(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/payments?${queryString}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getPaymentById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/payments/${id}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createPayment(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async postPayment(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/payments/post`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // ==================== INVOICES ====================

  async getInvoices(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/invoices?${queryString}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getInvoiceById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async createInvoice(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async generateInvoice(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/invoices/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async sendInvoice(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // ==================== ELIGIBILITY ====================

  async checkEligibility(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/eligibility/check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async verifyBenefits(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/eligibility/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getEligibilityHistory(patientId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/eligibility/patient/${patientId}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async estimatePatientResponsibility(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/eligibility/estimate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // ==================== CODING ====================

  async searchCPTCodes(query: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/cpt/search?query=${encodeURIComponent(query)}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getCPTCodeDetails(code: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/cpt/${code}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async searchICDCodes(query: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/icd/search?query=${encodeURIComponent(query)}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getICDCodeDetails(code: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/icd/${code}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async validateCodeCombination(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/validate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async suggestCodes(data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/suggest`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getCPTModifiers(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/coding/modifiers`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getFeeSchedule(params: any): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/coding/fee-schedule?${queryString}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ==================== ERA ====================

  async uploadERA(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('eraFile', file);

    const response = await fetch(`${this.baseUrl}/era/upload`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: formData
    });
    return this.handleResponse(response);
  }

  async getERAs(params: any = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/era?${queryString}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async getERAById(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/era/${id}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async processERA(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/era/${id}/process`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  async autoPostERA(id: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/era/${id}/auto-post`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<any> {
    // Mock data for dashboard
    return {
      totalCharges: 125000,
      chargesChange: 12.5,
      paymentsReceived: 95000,
      paymentsChange: 8.3,
      arOutstanding: 30000,
      arChange: -5.2,
      collectionRate: 76,
      collectionRateChange: 3.1,
      claimsSubmitted: 450,
      claimsPending: 85,
      denialRate: 8.2,
      denialRateChange: -1.5,
      avgDaysToPayment: 18,
      netCollection: 85,
      netCollectionChange: 2.3,
      revenueTrend: [
        { month: 'Jan', amount: 95000 },
        { month: 'Feb', amount: 102000 },
        { month: 'Mar', amount: 98000 },
        { month: 'Apr', amount: 110000 },
        { month: 'May', amount: 115000 },
        { month: 'Jun', amount: 125000 }
      ],
      claimsByStatus: {
        draft: 25,
        ready: 40,
        submitted: 85,
        accepted: 120,
        paid: 310,
        denied: 45,
        appealed: 15
      },
      arAging: {
        current: { count: 150, amount: 15000, percentage: 50 },
        thirty: { count: 80, amount: 8000, percentage: 27 },
        sixty: { count: 40, amount: 4000, percentage: 13 },
        ninety: { count: 30, amount: 3000, percentage: 10 },
        total: { count: 300, amount: 30000 }
      },
      topPayers: [
        { name: 'Blue Cross Blue Shield', claimCount: 120, amount: 45000, avgDays: 15 },
        { name: 'Aetna', claimCount: 95, amount: 32000, avgDays: 18 },
        { name: 'UnitedHealthcare', claimCount: 85, amount: 28000, avgDays: 20 }
      ]
    };
  }

  async getRecentActivity(): Promise<any> {
    return [
      {
        id: '1',
        type: 'payment',
        title: 'Payment Received',
        description: 'ERA processed - $5,000 from Blue Cross',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: '2',
        type: 'claim',
        title: 'Claim Submitted',
        description: 'Batch of 25 claims submitted electronically',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: '3',
        type: 'denial',
        title: 'Denial Alert',
        description: 'Claim CLM-2025-345 denied - missing information',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      }
    ];
  }

  async getDenials(): Promise<any> {
    return [
      {
        id: 'DEN001',
        claimNumber: 'CLM-2025-345',
        amount: 450.00,
        reason: 'Claim lacks information - missing diagnosis pointer',
        severity: 'high'
      },
      {
        id: 'DEN002',
        claimNumber: 'CLM-2025-389',
        amount: 275.00,
        reason: 'Duplicate claim submission',
        severity: 'medium'
      }
    ];
  }

  // ==================== HELPER DATA ====================

  async getPatients(): Promise<any> {
    return [
      { id: 'PAT001', name: 'John Doe', dob: '1980-05-15' },
      { id: 'PAT002', name: 'Jane Smith', dob: '1975-08-22' }
    ];
  }

  async getProviders(): Promise<any> {
    return [
      { id: 'PROV001', name: 'Dr. Sarah Smith', npi: '1234567890' },
      { id: 'PROV002', name: 'Dr. Michael Johnson', npi: '0987654321' }
    ];
  }

  async getPayers(): Promise<any> {
    return [
      { id: 'PAY001', name: 'Blue Cross Blue Shield' },
      { id: 'PAY002', name: 'Aetna' },
      { id: 'PAY003', name: 'UnitedHealthcare' },
      { id: 'PAY004', name: 'Medicare' },
      { id: 'PAY005', name: 'Medicaid' }
    ];
  }

  // ==================== UTILITY METHODS ====================

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeader()
    };
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }
}
