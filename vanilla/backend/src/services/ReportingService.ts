/**
 * Reporting Service - Report generation and scheduling
 * Lithic Healthcare Platform
 */

import {
  ReportConfig,
  ReportInstance,
  ScheduledReport,
  ReportStatus,
  ReportType,
  ReportFormat,
  ReportSection,
} from "../models/Analytics";
import { AnalyticsService } from "./AnalyticsService";

export class ReportingService {
  private reports: Map<string, ReportConfig> = new Map();
  private instances: Map<string, ReportInstance> = new Map();
  private scheduled: Map<string, ScheduledReport> = new Map();
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
    this.initializeDefaultReports();
  }

  // ==================== Report Configuration ====================

  async getReports(filters?: {
    type?: ReportType;
    createdBy?: string;
  }): Promise<ReportConfig[]> {
    let reports = Array.from(this.reports.values());

    if (filters?.type) {
      reports = reports.filter((r) => r.type === filters.type);
    }

    if (filters?.createdBy) {
      reports = reports.filter((r) => r.createdBy === filters.createdBy);
    }

    return reports.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async getReport(id: string): Promise<ReportConfig | null> {
    return this.reports.get(id) || null;
  }

  async createReport(
    data: Omit<ReportConfig, "id" | "createdAt" | "updatedAt">,
    userId: string,
  ): Promise<ReportConfig> {
    const id = this.generateId("rpt");
    const now = new Date();

    const report: ReportConfig = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    this.reports.set(id, report);
    return report;
  }

  async updateReport(
    id: string,
    updates: Partial<ReportConfig>,
    userId: string,
  ): Promise<ReportConfig> {
    const report = this.reports.get(id);

    if (!report) {
      throw new Error("Report not found");
    }

    const updated: ReportConfig = {
      ...report,
      ...updates,
      id,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.reports.set(id, updated);
    return updated;
  }

  async deleteReport(id: string): Promise<void> {
    // Also delete associated scheduled reports
    const scheduledReports = Array.from(this.scheduled.values()).filter(
      (s) => s.reportConfigId === id,
    );

    scheduledReports.forEach((s) => this.scheduled.delete(s.id));

    this.reports.delete(id);
  }

  // ==================== Report Generation ====================

  async generateReport(
    reportId: string,
    userId: string,
    parameters?: Record<string, any>,
  ): Promise<ReportInstance> {
    const config = this.reports.get(reportId);

    if (!config) {
      throw new Error("Report configuration not found");
    }

    const instanceId = this.generateId("inst");
    const now = new Date();

    // Create instance
    const instance: ReportInstance = {
      id: instanceId,
      configId: reportId,
      name: config.name,
      status: "running",
      startedAt: now,
      generatedBy: userId,
      parameters: parameters || {},
      version: "1.0",
      createdAt: now,
    };

    this.instances.set(instanceId, instance);

    // Generate asynchronously
    this.executeReportGeneration(instanceId, config).catch((error) => {
      const failed = this.instances.get(instanceId);
      if (failed) {
        failed.status = "failed";
        failed.completedAt = new Date();
        failed.error = {
          message: error.message,
          code: "GENERATION_FAILED",
        };
        this.instances.set(instanceId, failed);
      }
    });

    return instance;
  }

  private async executeReportGeneration(
    instanceId: string,
    config: ReportConfig,
  ): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    try {
      // Simulate report generation
      const startTime = Date.now();

      // Fetch data for each metric
      const metricsData = await this.fetchReportData(config);

      // Generate sections
      const sectionsData = await this.generateSections(
        config.sections,
        metricsData,
      );

      // Format output
      const outputFile = await this.formatReport(config, sectionsData);

      const duration = Date.now() - startTime;

      // Update instance
      instance.status = "completed";
      instance.completedAt = new Date();
      instance.duration = duration;
      instance.fileUrl = outputFile.url;
      instance.fileSize = outputFile.size;
      instance.recordCount = outputFile.recordCount;

      this.instances.set(instanceId, instance);
    } catch (error: any) {
      throw error;
    }
  }

  private async fetchReportData(
    config: ReportConfig,
  ): Promise<Map<string, any>> {
    const data = new Map<string, any>();

    // Fetch each metric
    for (const metricId of config.metrics) {
      const metric = await this.analyticsService.getMetric(metricId);
      if (metric) {
        // In production, fetch actual data
        data.set(metricId, {
          metric,
          value: Math.random() * 100,
          trend: Math.random() > 0.5 ? "up" : "down",
        });
      }
    }

    return data;
  }

  private async generateSections(
    sections: ReportSection[],
    metricsData: Map<string, any>,
  ): Promise<Map<string, any>> {
    const sectionsData = new Map<string, any>();

    for (const section of sections) {
      const sectionData: any = {
        ...section,
        generatedAt: new Date(),
      };

      if (section.type === "metrics_grid" && section.content?.metrics) {
        sectionData.values = section.content.metrics.map((metricId) => {
          return metricsData.get(metricId);
        });
      }

      if (section.type === "chart" && section.content?.chartConfig) {
        // Generate chart data
        sectionData.chartData = await this.analyticsService.getWidgetData(
          section.content.chartConfig,
        );
      }

      if (section.type === "table" && section.content?.columns) {
        // Generate table data
        sectionData.tableData = this.generateSampleTableData(
          section.content.columns,
        );
      }

      sectionsData.set(section.id, sectionData);
    }

    return sectionsData;
  }

  private generateSampleTableData(columns: string[]): any[] {
    // Generate sample data for demonstration
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        row[col] = `Value ${i + 1}`;
      });
      rows.push(row);
    }
    return rows;
  }

  private async formatReport(
    config: ReportConfig,
    sectionsData: Map<string, any>,
  ): Promise<{ url: string; size: number; recordCount: number }> {
    // In production, this would generate actual files (PDF, Excel, etc.)
    // For now, return simulated file info

    const formats: Record<ReportFormat, number> = {
      pdf: 1024 * 500, // ~500KB
      excel: 1024 * 300, // ~300KB
      csv: 1024 * 50, // ~50KB
      json: 1024 * 100, // ~100KB
      html: 1024 * 200, // ~200KB
    };

    const fileSize = formats[config.format] || 1024 * 100;
    const recordCount = sectionsData.size * 10;

    return {
      url: `/api/reports/download/${this.generateId("file")}`,
      size: fileSize,
      recordCount,
    };
  }

  // ==================== Report Instances ====================

  async getReportInstances(
    reportId?: string,
    userId?: string,
  ): Promise<ReportInstance[]> {
    let instances = Array.from(this.instances.values());

    if (reportId) {
      instances = instances.filter((i) => i.configId === reportId);
    }

    if (userId) {
      instances = instances.filter((i) => i.generatedBy === userId);
    }

    return instances.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getReportInstance(id: string): Promise<ReportInstance | null> {
    return this.instances.get(id) || null;
  }

  async deleteReportInstance(id: string): Promise<void> {
    // In production, also delete the generated file
    this.instances.delete(id);
  }

  // ==================== Scheduled Reports ====================

  async getScheduledReports(reportId?: string): Promise<ScheduledReport[]> {
    let scheduled = Array.from(this.scheduled.values());

    if (reportId) {
      scheduled = scheduled.filter((s) => s.reportConfigId === reportId);
    }

    return scheduled;
  }

  async getScheduledReport(id: string): Promise<ScheduledReport | null> {
    return this.scheduled.get(id) || null;
  }

  async createScheduledReport(
    data: Omit<ScheduledReport, "id" | "createdAt" | "updatedAt" | "runs">,
    userId: string,
  ): Promise<ScheduledReport> {
    const id = this.generateId("sched");
    const now = new Date();

    const scheduled: ScheduledReport = {
      ...data,
      id,
      runs: [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    this.scheduled.set(id, scheduled);
    return scheduled;
  }

  async updateScheduledReport(
    id: string,
    updates: Partial<ScheduledReport>,
  ): Promise<ScheduledReport> {
    const scheduled = this.scheduled.get(id);

    if (!scheduled) {
      throw new Error("Scheduled report not found");
    }

    const updated: ScheduledReport = {
      ...scheduled,
      ...updates,
      id,
      updatedAt: new Date(),
    };

    this.scheduled.set(id, updated);
    return updated;
  }

  async deleteScheduledReport(id: string): Promise<void> {
    this.scheduled.delete(id);
  }

  async toggleScheduledReport(
    id: string,
    isActive: boolean,
  ): Promise<ScheduledReport> {
    return this.updateScheduledReport(id, { isActive });
  }

  async executeScheduledReport(id: string): Promise<ReportInstance> {
    const scheduled = this.scheduled.get(id);

    if (!scheduled) {
      throw new Error("Scheduled report not found");
    }

    if (!scheduled.isActive) {
      throw new Error("Scheduled report is inactive");
    }

    // Generate the report
    const instance = await this.generateReport(
      scheduled.reportConfigId,
      "system",
      {
        scheduled: true,
        scheduleId: id,
      },
    );

    // Update schedule
    scheduled.lastRun = new Date();
    scheduled.nextRun = this.calculateNextRun(scheduled.schedule);
    scheduled.runs.push({
      instanceId: instance.id,
      timestamp: new Date(),
      status: instance.status,
    });

    this.scheduled.set(id, scheduled);

    return instance;
  }

  private calculateNextRun(schedule: ScheduledReport["schedule"]): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(":").map(Number);

    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case "daily":
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case "weekly":
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = next.getDay();
          const targetDay = schedule.dayOfWeek;
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;

          if (daysUntilTarget === 0 && next <= now) {
            next.setDate(next.getDate() + 7);
          } else {
            next.setDate(next.getDate() + daysUntilTarget);
          }
        }
        break;

      case "monthly":
        if (schedule.dayOfMonth) {
          next.setDate(schedule.dayOfMonth);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
        }
        break;

      case "quarterly":
        const currentQuarter = Math.floor(next.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        next.setMonth(nextQuarterMonth);
        next.setDate(1);
        break;

      case "yearly":
        next.setMonth(0, 1);
        if (next <= now) {
          next.setFullYear(next.getFullYear() + 1);
        }
        break;
    }

    return next;
  }

  // ==================== Report Builder Helper Methods ====================

  async validateReportConfig(
    config: Partial<ReportConfig>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.name) {
      errors.push("Report name is required");
    }

    if (!config.type) {
      errors.push("Report type is required");
    }

    if (!config.metrics || config.metrics.length === 0) {
      errors.push("At least one metric is required");
    }

    if (!config.format) {
      errors.push("Report format is required");
    }

    if (config.sections && config.sections.length > 0) {
      config.sections.forEach((section, index) => {
        if (!section.title) {
          errors.push(`Section ${index + 1} is missing a title`);
        }
        if (!section.type) {
          errors.push(`Section ${index + 1} is missing a type`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getReportTemplates(): Promise<Partial<ReportConfig>[]> {
    return [
      {
        name: "Monthly Quality Dashboard",
        type: "quality_measures",
        format: "pdf",
        sections: [
          {
            id: "summary",
            title: "Executive Summary",
            order: 1,
            type: "text",
          },
          {
            id: "measures",
            title: "Quality Measures",
            order: 2,
            type: "metrics_grid",
          },
          {
            id: "trends",
            title: "Trends",
            order: 3,
            type: "chart",
          },
        ],
      },
      {
        name: "Financial Performance Report",
        type: "financial_summary",
        format: "excel",
        sections: [
          {
            id: "revenue",
            title: "Revenue Analysis",
            order: 1,
            type: "chart",
          },
          {
            id: "details",
            title: "Detailed Breakdown",
            order: 2,
            type: "table",
          },
        ],
      },
    ];
  }

  // ==================== Utility Methods ====================

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultReports(): void {
    const monthlyQuality: ReportConfig = {
      id: "rpt_monthly_quality",
      name: "Monthly Quality Measures Report",
      description: "Comprehensive quality metrics and HEDIS measures",
      type: "quality_measures",
      metrics: ["metric_patient_sat"],
      filters: {
        dateRange: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date(),
        },
      },
      sections: [
        {
          id: "sec_summary",
          title: "Executive Summary",
          order: 1,
          type: "summary",
        },
        {
          id: "sec_measures",
          title: "Quality Measures",
          order: 2,
          type: "metrics_grid",
          content: {
            metrics: ["metric_patient_sat"],
          },
        },
      ],
      format: "pdf",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      updatedBy: "system",
    };

    this.reports.set(monthlyQuality.id, monthlyQuality);
  }
}
