/**
 * Reports Page - Report management and generation
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { DataTable } from "../../components/analytics/DataTable";
import { analyticsService } from "../../services/AnalyticsService";

export class ReportsPage {
  private container: HTMLElement;
  private reports: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadReports();
    this.render();
  }

  private async loadReports(): Promise<void> {
    try {
      const response = await analyticsService.getReports();
      this.reports = response.data || [];
    } catch (error) {
      console.error("Failed to load reports:", error);
      this.reports = [];
    }
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.style.cssText = "padding: 24px;";

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    const title = document.createElement("h1");
    title.textContent = "Reports";
    title.style.margin = "0";

    const createBtn = document.createElement("button");
    createBtn.textContent = "+ Create Report";
    createBtn.style.cssText = `
      padding: 12px 24px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    `;

    createBtn.addEventListener("click", () => {
      window.location.hash = "#/analytics/reports/builder";
    });

    header.appendChild(title);
    header.appendChild(createBtn);
    this.container.appendChild(header);

    // Table
    const tableContainer = document.createElement("div");
    new DataTable(tableContainer, {
      columns: [
        { key: "name", label: "Report Name", sortable: true },
        { key: "type", label: "Type", sortable: true },
        { key: "format", label: "Format", sortable: true },
        {
          key: "updatedAt",
          label: "Last Modified",
          sortable: true,
          formatter: (value) => new Date(value).toLocaleString(),
        },
        {
          key: "actions",
          label: "Actions",
          formatter: () => "⚙️",
        },
      ],
      data: this.reports,
      pageSize: 15,
      onRowClick: (row) => {
        window.location.hash = `#/analytics/reports/${row.id}`;
      },
    });

    this.container.appendChild(tableContainer);
  }
}
