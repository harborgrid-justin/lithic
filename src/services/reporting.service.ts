/**
 * Reporting Service
 * Handles report generation, scheduling, and export functionality
 */

import { AnalyticsQuery, FilterConfig } from "./analytics.service";

export interface Report {
  id: string;
  name: string;
  description?: string;
  type:
    | "quality"
    | "financial"
    | "operational"
    | "population"
    | "custom"
    | "regulatory";
  category?: string;
  query: AnalyticsQuery;
  template?: ReportTemplate;
  schedule?: ReportSchedule;
  recipients?: string[];
  format: "pdf" | "excel" | "csv" | "html";
  status: "draft" | "active" | "archived";
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  header?: {
    logo?: string;
    title?: string;
    subtitle?: string;
  };
  footer?: {
    pageNumbers?: boolean;
    disclaimer?: string;
  };
  styling?: {
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
  };
}

export interface ReportSection {
  id: string;
  type: "header" | "text" | "chart" | "table" | "kpi" | "image" | "pageBreak";
  title?: string;
  content?: string;
  config?: any;
  order: number;
}

export interface ReportSchedule {
  frequency:
    | "once"
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  monthOfYear?: number; // 1-12 for yearly
  timezone?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportOptions {
  format: "pdf" | "excel" | "csv" | "html";
  orientation?: "portrait" | "landscape";
  pageSize?: "letter" | "legal" | "a4" | "tabloid";
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeRawData?: boolean;
  compression?: boolean;
  password?: string;
  watermark?: string;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  executedBy?: string;
}

class ReportingService {
  private baseUrl = "/api/analytics";

  /**
   * Get all reports
   */
  async getReports(filters?: {
    type?: string;
    status?: string;
    search?: string;
  }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);

    const response = await fetch(`${this.baseUrl}/reports?${params}`);
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  }

  /**
   * Get specific report by ID
   */
  async getReport(id: string): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`);
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  }

  /**
   * Create new report
   */
  async createReport(
    report: Omit<
      Report,
      "id" | "createdAt" | "updatedAt" | "lastRun" | "nextRun"
    >,
  ): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error("Failed to create report");
    return response.json();
  }

  /**
   * Update report
   */
  async updateReport(id: string, updates: Partial<Report>): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update report");
    return response.json();
  }

  /**
   * Delete report
   */
  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete report");
  }

  /**
   * Execute report immediately
   */
  async executeReport(
    id: string,
    filters?: FilterConfig,
    exportOptions?: ExportOptions,
  ): Promise<ReportExecution> {
    const response = await fetch(`${this.baseUrl}/reports/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters, exportOptions }),
    });
    if (!response.ok) throw new Error("Failed to execute report");
    return response.json();
  }

  /**
   * Get report execution history
   */
  async getReportExecutions(
    reportId: string,
    limit = 10,
  ): Promise<ReportExecution[]> {
    const response = await fetch(
      `${this.baseUrl}/reports/${reportId}/executions?limit=${limit}`,
    );
    if (!response.ok) throw new Error("Failed to fetch report executions");
    return response.json();
  }

  /**
   * Download report file
   */
  async downloadReport(executionId: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/reports/executions/${executionId}/download`,
    );
    if (!response.ok) throw new Error("Failed to download report");
    return response.blob();
  }

  /**
   * Schedule report
   */
  async scheduleReport(
    reportId: string,
    schedule: ReportSchedule,
    recipients: string[],
  ): Promise<Report> {
    return this.updateReport(reportId, { schedule, recipients });
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<Report[]> {
    const response = await fetch(`${this.baseUrl}/scheduled`);
    if (!response.ok) throw new Error("Failed to fetch scheduled reports");
    return response.json();
  }

  /**
   * Pause scheduled report
   */
  async pauseScheduledReport(reportId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/scheduled/${reportId}/pause`,
      {
        method: "POST",
      },
    );
    if (!response.ok) throw new Error("Failed to pause scheduled report");
  }

  /**
   * Resume scheduled report
   */
  async resumeScheduledReport(reportId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/scheduled/${reportId}/resume`,
      {
        method: "POST",
      },
    );
    if (!response.ok) throw new Error("Failed to resume scheduled report");
  }

  /**
   * Export data with custom options
   */
  async exportData(
    query: AnalyticsQuery,
    options: ExportOptions,
  ): Promise<{ executionId: string; fileUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, options }),
    });
    if (!response.ok) throw new Error("Failed to export data");
    return response.json();
  }

  /**
   * Get export status
   */
  async getExportStatus(executionId: string): Promise<ReportExecution> {
    const response = await fetch(`${this.baseUrl}/exports/${executionId}`);
    if (!response.ok) throw new Error("Failed to get export status");
    return response.json();
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(category?: string): Promise<ReportTemplate[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);

    const response = await fetch(`${this.baseUrl}/reports/templates?${params}`);
    if (!response.ok) throw new Error("Failed to fetch report templates");
    return response.json();
  }

  /**
   * Create custom report template
   */
  async createReportTemplate(
    template: Omit<ReportTemplate, "id">,
  ): Promise<ReportTemplate> {
    const response = await fetch(`${this.baseUrl}/reports/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    if (!response.ok) throw new Error("Failed to create report template");
    return response.json();
  }

  /**
   * Get predefined regulatory reports
   */
  async getRegulatoryReports(): Promise<Report[]> {
    const regulatoryReports: Partial<Report>[] = [
      {
        name: "CMS Quality Measures Report",
        type: "regulatory",
        category: "cms",
        description:
          "Comprehensive CMS quality measures including core measures, HCAHPS, and HACs",
        format: "pdf",
        status: "active",
      },
      {
        name: "Joint Commission Core Measures",
        type: "regulatory",
        category: "joint_commission",
        description: "Joint Commission accreditation core measure report",
        format: "excel",
        status: "active",
      },
      {
        name: "HEDIS Measures Report",
        type: "regulatory",
        category: "hedis",
        description:
          "Healthcare Effectiveness Data and Information Set measures",
        format: "pdf",
        status: "active",
      },
      {
        name: "Medicare Star Ratings",
        type: "regulatory",
        category: "cms",
        description: "Medicare Star Ratings quality measures",
        format: "excel",
        status: "active",
      },
      {
        name: "Value-Based Purchasing Report",
        type: "regulatory",
        category: "cms",
        description: "Hospital Value-Based Purchasing program metrics",
        format: "pdf",
        status: "active",
      },
    ];

    // In a real implementation, this would fetch from the API
    return regulatoryReports as Report[];
  }

  /**
   * Validate report configuration
   */
  validateReport(report: Partial<Report>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!report.name || report.name.trim() === "") {
      errors.push("Report name is required");
    }

    if (!report.type) {
      errors.push("Report type is required");
    }

    if (
      !report.query ||
      !report.query.metrics ||
      report.query.metrics.length === 0
    ) {
      errors.push("At least one metric is required");
    }

    if (!report.format) {
      errors.push("Export format is required");
    }

    if (report.schedule) {
      if (!report.schedule.frequency) {
        errors.push("Schedule frequency is required");
      }
      if (!report.schedule.time) {
        errors.push("Schedule time is required");
      }
      if (
        report.schedule.frequency === "weekly" &&
        report.schedule.dayOfWeek === undefined
      ) {
        errors.push("Day of week is required for weekly schedule");
      }
      if (
        report.schedule.frequency === "monthly" &&
        report.schedule.dayOfMonth === undefined
      ) {
        errors.push("Day of month is required for monthly schedule");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clone existing report
   */
  async cloneReport(reportId: string, newName?: string): Promise<Report> {
    const originalReport = await this.getReport(reportId);

    const clonedReport = {
      ...originalReport,
      name: newName || `${originalReport.name} (Copy)`,
      status: "draft" as const,
      schedule: undefined,
      lastRun: undefined,
      nextRun: undefined,
    };

    // Remove fields that shouldn't be copied
    const { id, createdAt, updatedAt, ...reportData } = clonedReport;

    return this.createReport(reportData);
  }

  /**
   * Share report with users
   */
  async shareReport(
    reportId: string,
    userIds: string[],
    permissions: "view" | "edit" = "view",
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, permissions }),
    });
    if (!response.ok) throw new Error("Failed to share report");
  }

  /**
   * Generate report preview
   */
  async previewReport(
    report: Partial<Report>,
    filters?: FilterConfig,
  ): Promise<{ html: string; data: any[] }> {
    const response = await fetch(`${this.baseUrl}/reports/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report, filters }),
    });
    if (!response.ok) throw new Error("Failed to generate report preview");
    return response.json();
  }

  /**
   * Get report metrics (usage statistics)
   */
  async getReportMetrics(reportId: string): Promise<{
    executionCount: number;
    averageExecutionTime: number;
    lastExecutionDate: string;
    totalDownloads: number;
    errorRate: number;
  }> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/metrics`);
    if (!response.ok) throw new Error("Failed to fetch report metrics");
    return response.json();
  }

  /**
   * Bulk export multiple reports
   */
  async bulkExport(
    reportIds: string[],
    options: ExportOptions,
  ): Promise<{ executionId: string }> {
    const response = await fetch(`${this.baseUrl}/exports/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportIds, options }),
    });
    if (!response.ok) throw new Error("Failed to start bulk export");
    return response.json();
  }

  /**
   * Calculate next run time for scheduled report
   */
  calculateNextRun(
    schedule: ReportSchedule,
    fromDate: Date = new Date(),
  ): Date {
    const nextRun = new Date(fromDate);
    const [hours, minutes] = schedule.time.split(":").map(Number);

    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case "once":
        return nextRun;

      case "daily":
        if (nextRun <= fromDate) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case "weekly":
        const targetDay = schedule.dayOfWeek ?? 0;
        const currentDay = nextRun.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0 || (daysToAdd === 0 && nextRun <= fromDate)) {
          daysToAdd += 7;
        }
        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;

      case "biweekly":
        const targetDayBiweekly = schedule.dayOfWeek ?? 0;
        const currentDayBiweekly = nextRun.getDay();
        let daysToAddBiweekly = targetDayBiweekly - currentDayBiweekly;
        if (
          daysToAddBiweekly <= 0 ||
          (daysToAddBiweekly === 0 && nextRun <= fromDate)
        ) {
          daysToAddBiweekly += 14;
        }
        nextRun.setDate(nextRun.getDate() + daysToAddBiweekly);
        break;

      case "monthly":
        const targetDate = schedule.dayOfMonth ?? 1;
        nextRun.setDate(targetDate);
        if (nextRun <= fromDate) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case "quarterly":
        const currentMonth = nextRun.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        nextRun.setMonth(quarterStartMonth);
        nextRun.setDate(schedule.dayOfMonth ?? 1);
        if (nextRun <= fromDate) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;

      case "yearly":
        const targetMonth = (schedule.monthOfYear ?? 1) - 1;
        nextRun.setMonth(targetMonth);
        nextRun.setDate(schedule.dayOfMonth ?? 1);
        if (nextRun <= fromDate) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
    }

    return nextRun;
  }
}

export const reportingService = new ReportingService();
