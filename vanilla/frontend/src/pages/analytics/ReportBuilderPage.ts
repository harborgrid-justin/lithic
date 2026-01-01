/**
 * Report Builder Page - Create and configure reports
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { ReportBuilder } from "../../components/analytics/ReportBuilder";
import { analyticsService } from "../../services/AnalyticsService";

export class ReportBuilderPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.style.padding = "24px";

    const title = document.createElement("h1");
    title.textContent = "Report Builder";
    title.style.margin = "0 0 24px 0";
    this.container.appendChild(title);

    const builderContainer = document.createElement("div");
    new ReportBuilder(builderContainer, async (config) => {
      try {
        const response = await analyticsService.createReport(config);
        alert("Report created successfully");
        window.location.hash = `#/analytics/reports/${response.data.id}`;
      } catch (error) {
        console.error("Failed to create report:", error);
        alert("Failed to create report");
      }
    });

    this.container.appendChild(builderContainer);
  }
}
