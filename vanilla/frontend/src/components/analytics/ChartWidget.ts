/**
 * ChartWidget - Reusable chart widget component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { LineChart } from "../../lib/charts/LineChart";
import { BarChart } from "../../lib/charts/BarChart";
import { PieChart } from "../../lib/charts/PieChart";
import { ChartBase, ChartConfig } from "../../lib/charts/ChartBase";

export interface ChartWidgetConfig {
  id: string;
  type: "line" | "bar" | "pie" | "area";
  title: string;
  data: ChartConfig;
  width?: string;
  height?: string;
  refreshInterval?: number;
}

export class ChartWidget {
  private container: HTMLElement;
  private config: ChartWidgetConfig;
  private chart: ChartBase | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private refreshTimer: number | null = null;

  constructor(container: HTMLElement, config: ChartWidgetConfig) {
    this.container = container;
    this.config = config;
    this.render();

    if (config.refreshInterval) {
      this.startAutoRefresh(config.refreshInterval);
    }
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "chart-widget";

    // Create widget structure
    const widget = document.createElement("div");
    widget.className = "widget-content";
    widget.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    `;

    // Title
    const title = document.createElement("h3");
    title.textContent = this.config.title;
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    `;

    // Canvas container
    const canvasContainer = document.createElement("div");
    canvasContainer.style.cssText = `
      flex: 1;
      position: relative;
      min-height: 0;
    `;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
    `;

    canvasContainer.appendChild(this.canvas);
    widget.appendChild(title);
    widget.appendChild(canvasContainer);
    this.container.appendChild(widget);

    // Initialize chart
    this.initializeChart();
  }

  private initializeChart(): void {
    if (!this.canvas) return;

    // Clean up existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Create appropriate chart type
    switch (this.config.type) {
      case "line":
      case "area":
        this.chart = new LineChart(this.canvas, this.config.data);
        break;
      case "bar":
        this.chart = new BarChart(this.canvas, this.config.data);
        break;
      case "pie":
        this.chart = new PieChart(this.canvas, this.config.data);
        break;
      default:
        console.error(`Unknown chart type: ${this.config.type}`);
        return;
    }

    this.chart.render();
  }

  private startAutoRefresh(interval: number): void {
    this.stopAutoRefresh();
    this.refreshTimer = window.setInterval(() => {
      this.refresh();
    }, interval * 1000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public updateData(data: ChartConfig): void {
    this.config.data = data;
    if (this.chart) {
      this.chart.updateData(data.series);
    }
  }

  public updateConfig(config: Partial<ChartWidgetConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
  }

  public refresh(): void {
    // In production, this would fetch new data from API
    console.log(`Refreshing chart: ${this.config.id}`);
  }

  public destroy(): void {
    this.stopAutoRefresh();
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
