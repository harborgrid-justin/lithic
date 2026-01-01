/**
 * Analytics Service - API client for analytics endpoints
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

const API_BASE = "/api/analytics";

export class AnalyticsAPIService {
  // ==================== Dashboards ====================

  async getDashboards(category?: string): Promise<any> {
    const url = category
      ? `${API_BASE}/dashboards?category=${category}`
      : `${API_BASE}/dashboards`;
    const response = await fetch(url);
    return response.json();
  }

  async getDashboard(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/dashboards/${id}`);
    return response.json();
  }

  async createDashboard(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/dashboards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateDashboard(id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/dashboards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteDashboard(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/dashboards/${id}`, {
      method: "DELETE",
    });
    return response.json();
  }

  async getWidgetData(config: any): Promise<any> {
    const response = await fetch(`${API_BASE}/dashboards/widget-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return response.json();
  }

  // ==================== Metrics ====================

  async getMetrics(category?: string): Promise<any> {
    const url = category
      ? `${API_BASE}/metrics?category=${category}`
      : `${API_BASE}/metrics`;
    const response = await fetch(url);
    return response.json();
  }

  async getMetric(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/metrics/${id}`);
    return response.json();
  }

  async calculateMetric(id: string, params?: any): Promise<any> {
    const response = await fetch(`${API_BASE}/metrics/${id}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    });
    return response.json();
  }

  async getQualityMeasures(filters?: any): Promise<any> {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `${API_BASE}/metrics/quality/measures?${params}`,
    );
    return response.json();
  }

  async getFinancialMetrics(startDate: string, endDate: string): Promise<any> {
    const response = await fetch(
      `${API_BASE}/metrics/financial?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.json();
  }

  async getOperationalMetrics(
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const response = await fetch(
      `${API_BASE}/metrics/operational?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.json();
  }

  async getPopulationHealthMetrics(populationId?: string): Promise<any> {
    const url = populationId
      ? `${API_BASE}/metrics/population-health?populationId=${populationId}`
      : `${API_BASE}/metrics/population-health`;
    const response = await fetch(url);
    return response.json();
  }

  // ==================== Reports ====================

  async getReports(filters?: any): Promise<any> {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/reports?${params}`);
    return response.json();
  }

  async getReport(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/${id}`);
    return response.json();
  }

  async createReport(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateReport(id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteReport(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: "DELETE",
    });
    return response.json();
  }

  async generateReport(id: string, params?: any): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    });
    return response.json();
  }

  async getReportInstances(reportId?: string): Promise<any> {
    const url = reportId
      ? `${API_BASE}/reports/instances/all?reportId=${reportId}`
      : `${API_BASE}/reports/instances/all`;
    const response = await fetch(url);
    return response.json();
  }

  async getReportTemplates(): Promise<any> {
    const response = await fetch(`${API_BASE}/reports/templates`);
    return response.json();
  }

  // ==================== Scheduled Reports ====================

  async getScheduledReports(reportId?: string): Promise<any> {
    const url = reportId
      ? `${API_BASE}/scheduled?reportId=${reportId}`
      : `${API_BASE}/scheduled`;
    const response = await fetch(url);
    return response.json();
  }

  async createScheduledReport(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/scheduled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateScheduledReport(id: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/scheduled/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteScheduledReport(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/scheduled/${id}`, {
      method: "DELETE",
    });
    return response.json();
  }

  async toggleScheduledReport(id: string, isActive: boolean): Promise<any> {
    const response = await fetch(`${API_BASE}/scheduled/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    return response.json();
  }

  // ==================== Exports ====================

  async createExport(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getExportJobs(): Promise<any> {
    const response = await fetch(`${API_BASE}/exports`);
    return response.json();
  }

  async getExportJob(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/exports/${id}`);
    return response.json();
  }

  async cancelExport(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/exports/${id}/cancel`, {
      method: "POST",
    });
    return response.json();
  }

  async getExportStatistics(): Promise<any> {
    const response = await fetch(`${API_BASE}/exports/statistics`);
    return response.json();
  }

  // ==================== Audit ====================

  async getAuditLog(filters?: any): Promise<any> {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/scheduled/audit?${params}`);
    return response.json();
  }
}

export const analyticsService = new AnalyticsAPIService();
