/**
 * TrendAnalysis - Trend visualization component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { LineChart } from "../../lib/charts/LineChart";
import { ChartConfig } from "../../lib/charts/ChartBase";

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
  timeSeries: Array<{ date: Date; value: number }>;
}

export class TrendAnalysis {
  private container: HTMLElement;
  private data: TrendData;
  private chart: LineChart | null = null;

  constructor(container: HTMLElement, data: TrendData) {
    this.container = container;
    this.data = data;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Header with metric name and trend
    const header = this.createHeader();
    wrapper.appendChild(header);

    // Chart
    const chartContainer = document.createElement("div");
    chartContainer.style.cssText = "height: 200px; margin-top: 16px;";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width: 100%; height: 100%;";
    chartContainer.appendChild(canvas);

    wrapper.appendChild(chartContainer);

    this.container.appendChild(wrapper);

    // Initialize chart
    this.initializeChart(canvas);
  }

  private createHeader(): HTMLElement {
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement("h3");
    title.textContent = this.data.metric;
    title.style.cssText = "margin: 0; font-size: 16px; font-weight: 600;";

    const trendIndicator = document.createElement("div");
    trendIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: ${this.getTrendColor()};
    `;

    const arrow = document.createElement("span");
    arrow.textContent =
      this.data.trend === "up" ? "▲" : this.data.trend === "down" ? "▼" : "■";

    const change = document.createElement("span");
    change.textContent = `${Math.abs(this.data.changePercent).toFixed(1)}%`;

    trendIndicator.appendChild(arrow);
    trendIndicator.appendChild(change);

    header.appendChild(title);
    header.appendChild(trendIndicator);

    return header;
  }

  private initializeChart(canvas: HTMLCanvasElement): void {
    const chartConfig: ChartConfig = {
      series: [
        {
          name: this.data.metric,
          data: this.data.timeSeries.map((point) => ({
            x: point.date,
            y: point.value,
          })),
          type: "area",
        },
      ],
      axes: {
        x: { label: "Date", type: "date" },
        y: { label: "Value", type: "number" },
      },
      legend: { show: false, position: "top" },
      padding: { top: 20, right: 20, bottom: 40, left: 50 },
    };

    this.chart = new LineChart(canvas, chartConfig);
    this.chart.render();
  }

  private getTrendColor(): string {
    return this.data.trend === "up"
      ? "#50c878"
      : this.data.trend === "down"
        ? "#e74c3c"
        : "#666";
  }

  public update(data: TrendData): void {
    this.data = data;
    this.render();
  }
}
