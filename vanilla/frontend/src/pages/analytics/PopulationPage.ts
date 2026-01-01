/**
 * Population Health Page - Population analytics and cohort management
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { KPICard } from "../../components/analytics/KPICard";
import { ChartWidget } from "../../components/analytics/ChartWidget";
import { DataTable } from "../../components/analytics/DataTable";
import { analyticsService } from "../../services/AnalyticsService";

export class PopulationPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    this.render();
    await this.loadPopulationMetrics();
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.style.padding = "24px";

    const title = document.createElement("h1");
    title.textContent = "Population Health";
    title.style.margin = "0 0 24px 0";
    this.container.appendChild(title);

    const kpiGrid = document.createElement("div");
    kpiGrid.id = "population-kpis";
    kpiGrid.style.cssText =
      "display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;";
    this.container.appendChild(kpiGrid);

    const chartContainer = document.createElement("div");
    chartContainer.id = "population-charts";
    chartContainer.style.cssText = "margin-bottom: 24px;";
    this.container.appendChild(chartContainer);

    const tableContainer = document.createElement("div");
    tableContainer.id = "population-table";
    this.container.appendChild(tableContainer);
  }

  private async loadPopulationMetrics(): Promise<void> {
    try {
      const response = await analyticsService.getPopulationHealthMetrics();
      const metrics = response.data || [];

      this.renderKPIs(metrics);
      this.renderCharts(metrics);
      this.renderTable(metrics);
    } catch (error) {
      console.error("Failed to load population metrics:", error);
    }
  }

  private renderKPIs(metrics: any[]): void {
    const kpiGrid = this.container.querySelector(
      "#population-kpis",
    ) as HTMLElement;
    if (!kpiGrid) return;

    kpiGrid.innerHTML = "";

    metrics.slice(0, 4).forEach((metric) => {
      const container = document.createElement("div");
      new KPICard(container, {
        title: metric.populationName,
        value: metric.populationSize,
        unit: "patients",
        trend: {
          value: Math.abs(metric.trend?.changePercent || 0),
          direction: metric.trend?.changePercent > 0 ? "up" : "down",
        },
        color: "#bd10e0",
      });
      kpiGrid.appendChild(container);
    });
  }

  private renderCharts(metrics: any[]): void {
    const chartContainer = this.container.querySelector(
      "#population-charts",
    ) as HTMLElement;
    if (!chartContainer) return;

    chartContainer.innerHTML = "";
    chartContainer.style.height = "400px";

    const metric = metrics[0];
    if (metric?.stratification?.byRiskLevel) {
      new ChartWidget(chartContainer, {
        id: "risk-distribution",
        type: "pie",
        title: "Risk Distribution",
        data: {
          series: [
            {
              name: "Risk Levels",
              data: Object.entries(metric.stratification.byRiskLevel).map(
                ([level, count]) => ({
                  x: level,
                  y: count as number,
                }),
              ),
            },
          ],
          axes: {
            x: { label: "", type: "category" },
            y: { label: "", type: "number" },
          },
        },
      });
    }
  }

  private renderTable(metrics: any[]): void {
    const tableContainer = this.container.querySelector(
      "#population-table",
    ) as HTMLElement;
    if (!tableContainer) return;

    const tableTitle = document.createElement("h2");
    tableTitle.textContent = "Population Cohorts";
    tableTitle.style.margin = "0 0 16px 0";
    tableContainer.appendChild(tableTitle);

    const table = document.createElement("div");
    new DataTable(table, {
      columns: [
        { key: "populationName", label: "Cohort Name" },
        { key: "populationSize", label: "Size" },
        { key: "metricType", label: "Primary Metric" },
        {
          key: "trend",
          label: "Trend",
          formatter: (v) => `${v.changePercent.toFixed(1)}%`,
        },
      ],
      data: metrics,
    });

    tableContainer.appendChild(table);
  }
}
