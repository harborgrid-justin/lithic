export class ImagingService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";
    this.token = this.getAuthToken();
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboardStats(): Promise<any> {
    return await this.request("/imaging/dashboard/stats");
  }

  async getRecentStudies(limit: number = 10): Promise<any[]> {
    return await this.request(`/imaging/studies/recent?limit=${limit}`);
  }

  async getCriticalReports(): Promise<any[]> {
    return await this.request(
      "/imaging/reports?criticalOnly=true&status=FINAL",
    );
  }

  // ============================================
  // ORDERS
  // ============================================

  async getOrders(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/imaging/orders?${queryParams}`);
  }

  async getOrder(orderId: string): Promise<any> {
    return await this.request(`/imaging/orders/${orderId}`);
  }

  async createOrder(orderData: any): Promise<any> {
    return await this.request("/imaging/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(orderId: string, updates: any): Promise<any> {
    return await this.request(`/imaging/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`/imaging/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  async scheduleOrder(
    orderId: string,
    scheduledDateTime: string,
    modalityId: string,
  ): Promise<any> {
    return await this.request(`/imaging/orders/${orderId}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledDateTime, modalityId }),
    });
  }

  async startOrder(orderId: string): Promise<any> {
    return await this.request(`/imaging/orders/${orderId}/start`, {
      method: "POST",
    });
  }

  async completeOrder(orderId: string): Promise<any> {
    return await this.request(`/imaging/orders/${orderId}/complete`, {
      method: "POST",
    });
  }

  async getOrderHistory(orderId: string): Promise<any[]> {
    return await this.request(`/imaging/orders/${orderId}/history`);
  }

  // ============================================
  // STUDIES
  // ============================================

  async getStudies(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/imaging/studies?${queryParams}`);
  }

  async getStudy(studyInstanceUID: string): Promise<any> {
    return await this.request(`/imaging/studies/${studyInstanceUID}`);
  }

  async getStudySeries(studyInstanceUID: string): Promise<any[]> {
    return await this.request(`/imaging/studies/${studyInstanceUID}/series`);
  }

  async getSeriesInstances(
    studyInstanceUID: string,
    seriesInstanceUID: string,
  ): Promise<any[]> {
    return await this.request(
      `/imaging/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances`,
    );
  }

  async getStudyMetadata(studyInstanceUID: string): Promise<any> {
    return await this.request(`/imaging/studies/${studyInstanceUID}/metadata`);
  }

  async compareStudies(
    currentStudyUID: string,
    compareStudyUIDs: string[],
  ): Promise<any> {
    return await this.request(`/imaging/studies/${currentStudyUID}/compare`, {
      method: "POST",
      body: JSON.stringify({ compareStudyUIDs }),
    });
  }

  async getPriorStudies(
    studyInstanceUID: string,
    limit: number = 5,
  ): Promise<any[]> {
    return await this.request(
      `/imaging/studies/${studyInstanceUID}/priors?limit=${limit}`,
    );
  }

  async createStudyShareLink(
    studyInstanceUID: string,
    expiresIn: number = 7 * 24 * 60 * 60,
  ): Promise<any> {
    return await this.request(`/imaging/studies/${studyInstanceUID}/share`, {
      method: "POST",
      body: JSON.stringify({ expiresIn }),
    });
  }

  // ============================================
  // REPORTS
  // ============================================

  async getReports(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/imaging/reports?${queryParams}`);
  }

  async getReport(reportId: string): Promise<any> {
    return await this.request(`/imaging/reports/${reportId}`);
  }

  async getStudyReport(studyInstanceUID: string): Promise<any> {
    return await this.request(`/imaging/reports/study/${studyInstanceUID}`);
  }

  async createReport(reportData: any): Promise<any> {
    return await this.request("/imaging/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(reportId: string, updates: any): Promise<any> {
    return await this.request(`/imaging/reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async signReport(reportId: string, signature: string): Promise<any> {
    return await this.request(`/imaging/reports/${reportId}/sign`, {
      method: "POST",
      body: JSON.stringify({ signature }),
    });
  }

  async addReportAddendum(
    reportId: string,
    addendumText: string,
    reason: string,
  ): Promise<any> {
    return await this.request(`/imaging/reports/${reportId}/addendum`, {
      method: "POST",
      body: JSON.stringify({ addendumText, reason }),
    });
  }

  async getReportHistory(reportId: string): Promise<any[]> {
    return await this.request(`/imaging/reports/${reportId}/history`);
  }

  async downloadReportPDF(reportId: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/imaging/reports/${reportId}/pdf`,
      {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to download PDF");
    }

    return await response.blob();
  }

  async notifyCriticalResult(
    reportId: string,
    notifyTo?: string,
    notificationMethod?: string,
  ): Promise<void> {
    await this.request(`/imaging/reports/${reportId}/notify`, {
      method: "POST",
      body: JSON.stringify({ notifyTo, notificationMethod }),
    });
  }

  async getReportTemplates(modality?: string): Promise<any[]> {
    const query = modality ? `?modality=${modality}` : "";
    return await this.request(`/imaging/reports/templates/list${query}`);
  }

  async saveVoiceDictation(
    reportId: string,
    transcription: string,
    audioUrl?: string,
  ): Promise<any> {
    return await this.request(`/imaging/reports/${reportId}/voice-dictation`, {
      method: "POST",
      body: JSON.stringify({ transcription, audioUrl }),
    });
  }

  // ============================================
  // DICOM WEB
  // ============================================

  async retrieveStudy(studyInstanceUID: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/imaging/dicom/studies/${studyInstanceUID}`,
      {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve study");
    }

    return await response.blob();
  }

  async retrieveInstance(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/imaging/dicom/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`,
      {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve instance");
    }

    return await response.blob();
  }

  async retrieveRenderedInstance(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
    options: {
      windowCenter?: number;
      windowWidth?: number;
      quality?: number;
    } = {},
  ): Promise<Blob> {
    const params = new URLSearchParams({
      ...(options.windowCenter && {
        windowCenter: options.windowCenter.toString(),
      }),
      ...(options.windowWidth && {
        windowWidth: options.windowWidth.toString(),
      }),
      ...(options.quality && { quality: options.quality.toString() }),
    });

    const response = await fetch(
      `${this.baseUrl}/imaging/dicom/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/rendered?${params}`,
      {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve rendered instance");
    }

    return await response.blob();
  }

  async uploadDicomFiles(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${this.baseUrl}/imaging/dicom/studies`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload DICOM files");
    }

    return await response.json();
  }

  async verifyDicomFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/imaging/dicom/verify`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to verify DICOM file");
    }

    return await response.json();
  }

  // ============================================
  // WORKLIST
  // ============================================

  async getWorklist(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(`/imaging/worklist?${queryParams}`);
  }

  async getWorklistItem(itemId: string): Promise<any> {
    return await this.request(`/imaging/worklist/${itemId}`);
  }

  async createWorklistItem(itemData: any): Promise<any> {
    return await this.request("/imaging/worklist", {
      method: "POST",
      body: JSON.stringify(itemData),
    });
  }

  async updateWorklistItem(itemId: string, updates: any): Promise<any> {
    return await this.request(`/imaging/worklist/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async startWorklistItem(itemId: string): Promise<any> {
    return await this.request(`/imaging/worklist/${itemId}/start`, {
      method: "POST",
    });
  }

  async completeWorklistItem(
    itemId: string,
    completionNotes?: string,
  ): Promise<any> {
    return await this.request(`/imaging/worklist/${itemId}/complete`, {
      method: "POST",
      body: JSON.stringify({ completionNotes }),
    });
  }

  async cancelWorklistItem(itemId: string, reason: string): Promise<any> {
    return await this.request(`/imaging/worklist/${itemId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getTodayWorklist(modality?: string): Promise<any> {
    const query = modality ? `?modality=${modality}` : "";
    return await this.request(`/imaging/worklist/date/today${query}`);
  }

  async getWorklistStats(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return await this.request(
      `/imaging/worklist/analytics/stats?${queryParams}`,
    );
  }

  async bulkScheduleOrders(
    orderIds: string[],
    schedulingRules: any,
  ): Promise<any> {
    return await this.request("/imaging/worklist/bulk-schedule", {
      method: "POST",
      body: JSON.stringify({ orderIds, schedulingRules }),
    });
  }

  // ============================================
  // MODALITIES
  // ============================================

  async getModalities(): Promise<any[]> {
    // Mock implementation - in production, create separate modalities endpoint
    return [
      {
        id: "1",
        name: "CT Scanner 1",
        type: "CT",
        status: "ONLINE",
        aeTitle: "CT01",
        stationName: "CT-01",
        location: "Radiology - Room 101",
        ipAddress: "192.168.1.101",
        port: 11112,
        todayExams: 15,
        queuedExams: 3,
        avgDuration: "25 min",
      },
      {
        id: "2",
        name: "MRI Scanner 1",
        type: "MRI",
        status: "BUSY",
        aeTitle: "MRI01",
        stationName: "MRI-01",
        location: "Radiology - Room 201",
        ipAddress: "192.168.1.201",
        port: 11112,
        todayExams: 8,
        queuedExams: 5,
        avgDuration: "45 min",
      },
      {
        id: "3",
        name: "X-Ray Room 1",
        type: "XRAY",
        status: "ONLINE",
        aeTitle: "XR01",
        stationName: "XRAY-01",
        location: "Radiology - Room 301",
        ipAddress: "192.168.1.301",
        port: 11112,
        todayExams: 32,
        queuedExams: 1,
        avgDuration: "10 min",
      },
      {
        id: "4",
        name: "Ultrasound 1",
        type: "US",
        status: "ONLINE",
        aeTitle: "US01",
        stationName: "US-01",
        location: "Radiology - Room 401",
        ipAddress: "192.168.1.401",
        port: 11112,
        todayExams: 12,
        queuedExams: 2,
        avgDuration: "20 min",
      },
    ];
  }

  async testModalityConnection(modalityId: string): Promise<any> {
    // Mock implementation
    return {
      success: true,
      message: "Connection successful",
      echoTime: 45,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }
}
