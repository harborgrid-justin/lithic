/**
 * Financial Analytics Page - Revenue, expenses, and financial metrics
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { KPICard } from "../../components/analytics/KPICard";
import { ChartWidget } from "../../components/analytics/ChartWidget";
import { DateRangePicker } from "../../components/analytics/DateRangePicker";
import { analyticsService } from "../../services/AnalyticsService";

export class FinancialPage {
  private container: HTMLElement;
  private dateRange = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    end: new Date(),
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    this.render();
    await this.loadFinancialMetrics();
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.style.padding = "24px";

    // Header with date picker
    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;";

    const title = document.createElement("h1");
    title.textContent = "Financial Analytics";
    title.style.margin = "0";

    const datePickerContainer = document.createElement("div");
    new DateRangePicker(datePickerContainer, {
      initialRange: this.dateRange,
      onChange: (range) => {
        this.dateRange = range;
        this.loadFinancialMetrics();
      },
    });

    header.appendChild(title);
    header.appendChild(datePickerContainer);
    this.container.appendChild(header);

    // KPI Grid
    const kpiGrid = document.createElement("div");
    kpiGrid.id = "financial-kpis";
    kpiGrid.style.cssText =
      "display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;";
    this.container.appendChild(kpiGrid);

    // Charts
    const chartGrid = document.createElement("div");
    chartGrid.id = "financial-charts";
    chartGrid.style.cssText =
      "display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;";
    this.container.appendChild(chartGrid);
  }

  private async loadFinancialMetrics(): Promise<void> {
    try {
      const response = await analyticsService.getFinancialMetrics(
        this.dateRange.start.toISOString(),
        this.dateRange.end.toISOString(),
      );

      const metrics = response.data || [];
      this.renderKPIs(metrics);
      this.renderCharts(metrics);
    } catch (error) {
      console.error("Failed to load financial metrics:", error);
    }
  }

  private renderKPIs(metrics: any[]): void {
    const kpiGrid = this.container.querySelector(
      "#financial-kpis",
    ) as HTMLElement;
    if (!kpiGrid) return;

    kpiGrid.innerHTML = "";

    metrics.slice(0, 4).forEach((metric) => {
      const container = document.createElement("div");
      new KPICard(container, {
        title: metric.metricType.replace(/_/g, " ").toUpperCase(),
        value: metric.current,
        unit: metric.metricType.includes("rate") ? "%" : "$",
        trend: {
          value: Math.abs(metric.variancePercent || 0),
          direction: metric.trend?.direction || "stable",
          isPositive: metric.trend?.isPositive,
        },
        target: metric.budget,
        color: "#4a90e2",
      });
      kpiGrid.appendChild(container);
    });
  }

  private renderCharts(metrics: any[]): void {
    const chartGrid = this.container.querySelector(
      "#financial-charts",
    ) as HTMLElement;
    if (!chartGrid) return;

    chartGrid.innerHTML = "";

    // Revenue chart
    const revenueContainer = document.createElement("div");
    revenueContainer.style.height = "400px";

    new ChartWidget(revenueContainer, {
      id: "revenue-chart",
      type: "line",
      title: "Revenue Trend",
      data: {
        series: [{ name: "Revenue", data: this.generateTrendData(30) }],
        axes: {
          x: { label: "Date", type: "date" },
          y: { label: "Amount ($)", type: "number" },
        },
      },
    });

    chartGrid.appendChild(revenueContainer);

    // Expense breakdown
    const expenseContainer = document.createElement("div");
    expenseContainer.style.height = "400px";

    new ChartWidget(expenseContainer, {
      id: "expense-chart",
      type: "pie",
      title: "Expense Breakdown",
      data: {
        series: [
          {
            name: "Expenses",
            data: [
              { x: "Staffing", y: 450000 },
              { x: "Supplies", y: 180000 },
              { x: "Equipment", y: 120000 },
              { x: "Facilities", y: 95000 },
              { x: "Other", y: 55000 },
            ],
          },
        ],
        axes: {
          x: { label: "", type: "category" },
          y: { label: "", type: "number" },
        },
      },
    });

    chartGrid.appendChild(expenseContainer);
  }

  private generateTrendData(days: number): any[] {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({ x: date, y: Math.floor(Math.random() * 50000) + 150000 });
    }

    return data;
  }
}
