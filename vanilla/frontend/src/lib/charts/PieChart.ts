/**
 * PieChart - Pie/Donut chart implementation using Canvas API
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { ChartBase, ChartConfig } from "./ChartBase";

export interface PieChartConfig extends ChartConfig {
  innerRadius?: number; // 0 for pie, > 0 for donut
  showPercentages?: boolean;
  showValues?: boolean;
}

export class PieChart extends ChartBase {
  private slices: Array<{
    startAngle: number;
    endAngle: number;
    centerX: number;
    centerY: number;
    radius: number;
    seriesIndex: number;
    pointIndex: number;
  }> = [];

  protected config!: PieChartConfig;

  constructor(canvas: HTMLCanvasElement, config: PieChartConfig) {
    super(canvas, config);
    this.config = {
      innerRadius: 0,
      showPercentages: true,
      showValues: false,
      ...config,
    } as PieChartConfig;
  }

  protected drawChart(): void {
    this.slices = [];

    if (this.config.series.length === 0) return;

    // For pie chart, we typically use a single series
    const series = this.config.series[0];
    if (!series || series.data.length === 0) return;

    const { paddingLeft, paddingTop, chartWidth, chartHeight } =
      this.dimensions;

    // Calculate center and radius
    const centerX = paddingLeft + chartWidth / 2;
    const centerY = paddingTop + chartHeight / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;

    // Calculate total
    const total = series.data.reduce((sum, point) => sum + point.y, 0);

    let currentAngle = -Math.PI / 2; // Start from top

    series.data.forEach((point, index) => {
      const sliceAngle =
        (point.y / total) * 2 * Math.PI * this.animationProgress;
      const endAngle = currentAngle + sliceAngle;

      const color = this.colors[index % this.colors.length];

      // Highlight if hovered
      const isHovered = !!(
        this.hoveredPoint &&
        this.hoveredPoint.seriesIndex === 0 &&
        this.hoveredPoint.pointIndex === index
      );

      const drawRadius = isHovered ? radius + 10 : radius;

      // Draw slice
      this.drawSlice(
        centerX,
        centerY,
        drawRadius,
        currentAngle,
        endAngle,
        color,
        isHovered,
      );

      // Store slice for hit detection
      this.slices.push({
        startAngle: currentAngle,
        endAngle,
        centerX,
        centerY,
        radius: drawRadius,
        seriesIndex: 0,
        pointIndex: index,
      });

      // Draw label
      if (this.animationProgress >= 1) {
        this.drawSliceLabel(
          centerX,
          centerY,
          radius,
          currentAngle,
          endAngle,
          point,
          total,
        );
      }

      currentAngle = endAngle;
    });

    // Draw center hole for donut chart
    if (this.config.innerRadius && this.config.innerRadius > 0) {
      this.ctx.save();
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(
        centerX,
        centerY,
        this.config.innerRadius * radius,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawSlice(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string,
    isHighlighted: boolean,
  ): void {
    this.ctx.save();

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);

    if (this.config.innerRadius && this.config.innerRadius > 0) {
      // Donut chart
      const innerRadius = this.config.innerRadius * radius;
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    } else {
      // Pie chart
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Add shadow on hover
    if (isHighlighted) {
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 4;
    }

    this.ctx.restore();
  }

  private drawSliceLabel(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    point: any,
    total: number,
  ): void {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;

    const x = centerX + Math.cos(midAngle) * labelRadius;
    const y = centerY + Math.sin(midAngle) * labelRadius;

    this.ctx.save();
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 12px Arial, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    let label = "";

    if (this.config.showPercentages) {
      const percentage = ((point.y / total) * 100).toFixed(1);
      label = `${percentage}%`;
    }

    if (this.config.showValues) {
      label += label
        ? `\n${this.formatValue(point.y)}`
        : this.formatValue(point.y);
    }

    this.ctx.fillText(label, x, y);

    this.ctx.restore();

    // Draw label line and external label for small slices
    const percentage = (point.y / total) * 100;
    if (percentage < 10) {
      this.drawExternalLabel(
        centerX,
        centerY,
        radius,
        midAngle,
        point,
        percentage,
      );
    }
  }

  private drawExternalLabel(
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
    point: any,
    percentage: number,
  ): void {
    const lineStartRadius = radius + 5;
    const lineEndRadius = radius + 30;

    const x1 = centerX + Math.cos(angle) * lineStartRadius;
    const y1 = centerY + Math.sin(angle) * lineStartRadius;
    const x2 = centerX + Math.cos(angle) * lineEndRadius;
    const y2 = centerY + Math.sin(angle) * lineEndRadius;

    // Draw line
    this.ctx.save();
    this.ctx.strokeStyle = "#666";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    // Draw label
    this.ctx.fillStyle = "#333";
    this.ctx.font = "11px Arial, sans-serif";
    this.ctx.textAlign =
      angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? "right" : "left";
    this.ctx.textBaseline = "middle";

    let label = "";
    if (typeof point.x === "string") {
      label = point.x;
    }

    const labelText = `${label}: ${percentage.toFixed(1)}%`;
    this.ctx.fillText(labelText, x2, y2);

    this.ctx.restore();
  }

  protected getPointAtPosition(
    x: number,
    y: number,
  ): { seriesIndex: number; pointIndex: number } | null {
    for (const slice of this.slices) {
      const dx = x - slice.centerX;
      const dy = y - slice.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if within radius
      const innerRadius = this.config.innerRadius
        ? this.config.innerRadius * slice.radius
        : 0;

      if (distance >= innerRadius && distance <= slice.radius) {
        // Check if within angle
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) {
          angle += 2 * Math.PI;
        }

        let startAngle = slice.startAngle;
        let endAngle = slice.endAngle;

        if (startAngle < -Math.PI / 2) {
          startAngle += 2 * Math.PI;
        }
        if (endAngle < -Math.PI / 2) {
          endAngle += 2 * Math.PI;
        }

        if (angle >= startAngle && angle <= endAngle) {
          return {
            seriesIndex: slice.seriesIndex,
            pointIndex: slice.pointIndex,
          };
        }
      }
    }

    return null;
  }

  protected drawLegend(): void {
    if (!this.config.legend?.show) return;

    if (
      this.config.series.length === 0 ||
      this.config.series[0].data.length === 0
    ) {
      return;
    }

    const series = this.config.series[0];
    const legend = this.config.legend;
    const itemWidth = 150;
    const itemHeight = 20;
    const iconSize = 12;

    let x = this.dimensions.width - 160;
    let y = this.dimensions.paddingTop;

    this.ctx.save();
    this.ctx.font = "11px Arial, sans-serif";

    series.data.forEach((point, index) => {
      const color = this.colors[index % this.colors.length];
      const currentY = y + index * itemHeight;

      // Draw color box
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, currentY, iconSize, iconSize);

      // Draw label
      let label = "";
      if (typeof point.x === "string") {
        label = point.x;
      } else {
        label = `Item ${index + 1}`;
      }

      this.ctx.fillStyle = "#333";
      this.ctx.textAlign = "left";
      this.ctx.fillText(label, x + iconSize + 5, currentY + iconSize);
    });

    this.ctx.restore();
  }

  // Override to remove axes for pie chart
  protected drawAxes(): void {
    // Pie charts don't have axes
  }
}
