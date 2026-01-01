/**
 * Export Service - Data export in multiple formats
 * Lithic Healthcare Platform
 */

import {
  ExportJob,
  ReportFormat,
  Dashboard,
  ChartDataSeries,
} from "../models/Analytics";

export class ExportService {
  private jobs: Map<string, ExportJob> = new Map();
  private readonly MAX_EXPORT_SIZE = 100000; // Max rows for CSV/Excel
  private readonly EXPORT_EXPIRY_HOURS = 24; // Download link validity

  // ==================== Export Management ====================

  async createExportJob(
    type: ExportJob["type"],
    sourceId: string,
    sourceName: string,
    format: ReportFormat,
    parameters: ExportJob["parameters"],
    userId: string,
  ): Promise<ExportJob> {
    const id = this.generateId("exp");

    const job: ExportJob = {
      id,
      type,
      sourceId,
      sourceName,
      format,
      parameters,
      status: "queued",
      progress: 0,
      requestedBy: userId,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);

    // Execute export asynchronously
    this.executeExport(id).catch((error) => {
      const failed = this.jobs.get(id);
      if (failed) {
        failed.status = "failed";
        failed.error = {
          message: error.message,
          code: "EXPORT_FAILED",
        };
        this.jobs.set(id, failed);
      }
    });

    return job;
  }

  async getExportJob(id: string): Promise<ExportJob | null> {
    return this.jobs.get(id) || null;
  }

  async getExportJobs(userId: string): Promise<ExportJob[]> {
    return Array.from(this.jobs.values())
      .filter((job) => job.requestedBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async cancelExportJob(id: string): Promise<void> {
    const job = this.jobs.get(id);

    if (!job) {
      throw new Error("Export job not found");
    }

    if (job.status === "completed" || job.status === "failed") {
      throw new Error("Cannot cancel completed or failed job");
    }

    job.status = "failed";
    job.error = {
      message: "Export cancelled by user",
      code: "CANCELLED",
    };

    this.jobs.set(id, job);
  }

  async deleteExportJob(id: string): Promise<void> {
    // In production, also delete the generated file
    this.jobs.delete(id);
  }

  // ==================== Export Execution ====================

  private async executeExport(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = "processing";
      job.startedAt = new Date();
      this.jobs.set(jobId, job);

      let fileInfo: { url: string; size: number; recordCount: number };

      switch (job.type) {
        case "dashboard":
          fileInfo = await this.exportDashboard(job);
          break;
        case "report":
          fileInfo = await this.exportReport(job);
          break;
        case "dataset":
          fileInfo = await this.exportDataset(job);
          break;
        default:
          throw new Error(`Unsupported export type: ${job.type}`);
      }

      // Update job
      job.status = "completed";
      job.completedAt = new Date();
      job.fileUrl = fileInfo.url;
      job.fileSize = fileInfo.size;
      job.recordCount = fileInfo.recordCount;
      job.progress = 100;

      // Set expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.EXPORT_EXPIRY_HOURS);
      job.expiresAt = expiresAt;

      this.jobs.set(jobId, job);
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== Export Type Handlers ====================

  private async exportDashboard(
    job: ExportJob,
  ): Promise<{ url: string; size: number; recordCount: number }> {
    // Simulate dashboard export
    await this.updateProgress(job.id, 25);

    // In production, fetch dashboard data
    const dashboardData = {
      name: job.sourceName,
      widgets: [],
      exportedAt: new Date(),
    };

    await this.updateProgress(job.id, 50);

    // Format based on export format
    let fileData: any;
    switch (job.format) {
      case "pdf":
        fileData = await this.generatePDF(dashboardData);
        break;
      case "excel":
        fileData = await this.generateExcel(dashboardData);
        break;
      case "json":
        fileData = await this.generateJSON(dashboardData);
        break;
      default:
        throw new Error(
          `Unsupported format for dashboard export: ${job.format}`,
        );
    }

    await this.updateProgress(job.id, 100);

    return {
      url: `/api/exports/download/${job.id}`,
      size: fileData.size,
      recordCount: dashboardData.widgets.length,
    };
  }

  private async exportReport(
    job: ExportJob,
  ): Promise<{ url: string; size: number; recordCount: number }> {
    // Simulate report export
    await this.updateProgress(job.id, 20);

    const reportData = {
      name: job.sourceName,
      sections: [],
      parameters: job.parameters,
      exportedAt: new Date(),
    };

    await this.updateProgress(job.id, 60);

    let fileData: any;
    switch (job.format) {
      case "pdf":
        fileData = await this.generatePDF(reportData);
        break;
      case "excel":
        fileData = await this.generateExcel(reportData);
        break;
      case "csv":
        fileData = await this.generateCSV(reportData);
        break;
      case "json":
        fileData = await this.generateJSON(reportData);
        break;
      default:
        throw new Error(`Unsupported format for report export: ${job.format}`);
    }

    await this.updateProgress(job.id, 100);

    return {
      url: `/api/exports/download/${job.id}`,
      size: fileData.size,
      recordCount: reportData.sections.length,
    };
  }

  private async exportDataset(
    job: ExportJob,
  ): Promise<{ url: string; size: number; recordCount: number }> {
    await this.updateProgress(job.id, 10);

    // Simulate fetching large dataset
    const data = await this.fetchDataset(job.sourceId, job.parameters);

    // Check size limits
    if (data.length > this.MAX_EXPORT_SIZE) {
      throw new Error(
        `Dataset too large. Maximum ${this.MAX_EXPORT_SIZE} rows allowed.`,
      );
    }

    await this.updateProgress(job.id, 50);

    let fileData: any;
    switch (job.format) {
      case "csv":
        fileData = await this.generateCSV({
          data,
          columns: job.parameters.columns,
        });
        break;
      case "excel":
        fileData = await this.generateExcel({
          data,
          columns: job.parameters.columns,
        });
        break;
      case "json":
        fileData = await this.generateJSON({ data });
        break;
      default:
        throw new Error(`Unsupported format for dataset export: ${job.format}`);
    }

    await this.updateProgress(job.id, 100);

    return {
      url: `/api/exports/download/${job.id}`,
      size: fileData.size,
      recordCount: data.length,
    };
  }

  // ==================== Format Generators ====================

  private async generatePDF(
    data: any,
  ): Promise<{ size: number; content: string }> {
    // In production, use a PDF library like PDFKit or Puppeteer
    // For now, return simulated PDF metadata

    await this.simulateProcessing(500);

    return {
      size: Math.floor(Math.random() * 1024 * 1024) + 100000, // 100KB - 1MB
      content: "PDF_BINARY_DATA",
    };
  }

  private async generateExcel(
    data: any,
  ): Promise<{ size: number; content: string }> {
    // In production, use a library like ExcelJS
    // For now, return simulated Excel metadata

    await this.simulateProcessing(300);

    const rows = Array.isArray(data.data) ? data.data.length : 100;

    return {
      size: rows * 100, // Approximate size
      content: "EXCEL_BINARY_DATA",
    };
  }

  private async generateCSV(
    data: any,
  ): Promise<{ size: number; content: string }> {
    await this.simulateProcessing(200);

    let csv = "";

    if (data.columns && data.data) {
      // Header
      csv += data.columns.join(",") + "\n";

      // Rows
      data.data.forEach((row: any) => {
        const values = data.columns.map((col: string) => {
          const value = row[col] || "";
          // Escape commas and quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(",") + "\n";
      });
    }

    return {
      size: Buffer.byteLength(csv, "utf8"),
      content: csv,
    };
  }

  private async generateJSON(
    data: any,
  ): Promise<{ size: number; content: string }> {
    await this.simulateProcessing(100);

    const json = JSON.stringify(data, null, 2);

    return {
      size: Buffer.byteLength(json, "utf8"),
      content: json,
    };
  }

  private async generateHTML(
    data: any,
  ): Promise<{ size: number; content: string }> {
    await this.simulateProcessing(150);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || "Export"}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4a90e2; color: white; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${data.name || "Export"}</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <div id="content">
    ${JSON.stringify(data, null, 2)}
  </div>
</body>
</html>
`;

    return {
      size: Buffer.byteLength(html, "utf8"),
      content: html,
    };
  }

  // ==================== Helper Methods ====================

  private async fetchDataset(
    sourceId: string,
    parameters: any,
  ): Promise<any[]> {
    // Simulate fetching data from database
    await this.simulateProcessing(1000);

    const rowCount = Math.floor(Math.random() * 1000) + 100;
    const data = [];

    for (let i = 0; i < rowCount; i++) {
      data.push({
        id: i + 1,
        timestamp: new Date(),
        value: Math.random() * 100,
        category: ["A", "B", "C"][Math.floor(Math.random() * 3)],
      });
    }

    return data;
  }

  private async updateProgress(jobId: string, progress: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      this.jobs.set(jobId, job);
    }

    // Simulate some processing time
    await this.simulateProcessing(100);
  }

  private simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Bulk Export ====================

  async bulkExport(
    items: { type: ExportJob["type"]; sourceId: string; sourceName: string }[],
    format: ReportFormat,
    parameters: ExportJob["parameters"],
    userId: string,
  ): Promise<ExportJob[]> {
    const jobs: ExportJob[] = [];

    for (const item of items) {
      const job = await this.createExportJob(
        item.type,
        item.sourceId,
        item.sourceName,
        format,
        parameters,
        userId,
      );
      jobs.push(job);
    }

    return jobs;
  }

  // ==================== Format Conversion ====================

  async convertFormat(
    sourceJobId: string,
    targetFormat: ReportFormat,
    userId: string,
  ): Promise<ExportJob> {
    const sourceJob = this.jobs.get(sourceJobId);

    if (!sourceJob) {
      throw new Error("Source export job not found");
    }

    if (sourceJob.status !== "completed") {
      throw new Error("Source export must be completed");
    }

    // Create new export job with different format
    return this.createExportJob(
      sourceJob.type,
      sourceJob.sourceId,
      sourceJob.sourceName,
      targetFormat,
      sourceJob.parameters,
      userId,
    );
  }

  // ==================== Cleanup ====================

  async cleanupExpiredExports(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.expiresAt && job.expiresAt < now) {
        this.jobs.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ==================== Export Statistics ====================

  async getExportStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byFormat: Record<string, number>;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    let jobs = Array.from(this.jobs.values());

    if (userId) {
      jobs = jobs.filter((j) => j.requestedBy === userId);
    }

    const stats = {
      total: jobs.length,
      byStatus: {} as Record<string, number>,
      byFormat: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      totalSize: 0,
    };

    jobs.forEach((job) => {
      // Count by status
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;

      // Count by format
      stats.byFormat[job.format] = (stats.byFormat[job.format] || 0) + 1;

      // Count by type
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;

      // Sum file sizes
      if (job.fileSize) {
        stats.totalSize += job.fileSize;
      }
    });

    return stats;
  }
}
