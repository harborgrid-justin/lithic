/**
 * Report Detail Page - View report configuration and instances
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { DataTable } from "../../components/analytics/DataTable";
import { analyticsService } from "../../services/AnalyticsService";

export class ReportDetailPage {
  private container: HTMLElement;
  private reportId: string;
  private report: any = null;
  private instances: any[] = [];

  constructor(container: HTMLElement, reportId: string) {
    this.container = container;
    this.reportId = reportId;
    this.init();
  }

  private async init(): Promise<void> {
    await Promise.all([this.loadReport(), this.loadInstances()]);
    this.render();
  }

  private async loadReport(): Promise<void> {
    try {
      const response = await analyticsService.getReport(this.reportId);
      this.report = response.data;
    } catch (error) {
      console.error("Failed to load report:", error);
    }
  }

  private async loadInstances(): Promise<void> {
    try {
      const response = await analyticsService.getReportInstances(this.reportId);
      this.instances = response.data || [];
    } catch (error) {
      console.error("Failed to load instances:", error);
    }
  }

  private render(): void {
    if (!this.report) {
      this.container.innerHTML =
        '<div style="padding: 40px; text-align: center;">Report not found</div>';
      return;
    }

    this.container.innerHTML = "";
    this.container.style.padding = "24px";

    // Header
    const header = document.createElement("div");
    header.style.cssText = "margin-bottom: 24px;";

    const title = document.createElement("h1");
    title.textContent = this.report.name;
    title.style.margin = "0 0 16px 0";

    const generateBtn = document.createElement("button");
    generateBtn.textContent = "Generate Report";
    generateBtn.style.cssText = `
      padding: 12px 24px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    `;

    generateBtn.addEventListener("click", () => this.handleGenerate());

    header.appendChild(title);
    header.appendChild(generateBtn);
    this.container.appendChild(header);

    // Report details
    const details = document.createElement("div");
    details.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    details.innerHTML = `
      <p><strong>Type:</strong> ${this.report.type}</p>
      <p><strong>Format:</strong> ${this.report.format}</p>
      <p><strong>Metrics:</strong> ${this.report.metrics?.length || 0}</p>
    `;

    this.container.appendChild(details);

    // Instances table
    const instancesTitle = document.createElement("h2");
    instancesTitle.textContent = "Generated Instances";
    instancesTitle.style.margin = "0 0 16px 0";
    this.container.appendChild(instancesTitle);

    const tableContainer = document.createElement("div");
    new DataTable(tableContainer, {
      columns: [
        { key: "id", label: "Instance ID" },
        { key: "status", label: "Status" },
        {
          key: "createdAt",
          label: "Generated At",
          formatter: (v) => new Date(v).toLocaleString(),
        },
      ],
      data: this.instances,
    });

    this.container.appendChild(tableContainer);
  }

  private async handleGenerate(): Promise<void> {
    try {
      await analyticsService.generateReport(this.reportId);
      alert("Report generation started");
      await this.loadInstances();
      this.render();
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report");
    }
  }
}
