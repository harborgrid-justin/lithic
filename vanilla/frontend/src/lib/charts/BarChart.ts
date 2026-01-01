/**
 * BarChart - Bar chart implementation using Canvas API
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { ChartBase, ChartConfig } from './ChartBase';

export class BarChart extends ChartBase {
  private bars: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    seriesIndex: number;
    pointIndex: number;
  }> = [];

  constructor(canvas: HTMLCanvasElement, config: ChartConfig) {
    super(canvas, config);
  }

  protected drawChart(): void {
    const { min, max } = this.getMinMaxValues();
    this.bars = [];

    if (this.config.series.length === 0) return;

    const numSeries = this.config.series.length;
    const numPoints = this.config.series[0].data.length;

    if (numPoints === 0) return;

    const { paddingLeft, paddingTop, chartWidth, chartHeight } = this.dimensions;

    // Calculate bar dimensions
    const groupWidth = chartWidth / numPoints;
    const barWidth = groupWidth / (numSeries + 1);
    const barSpacing = barWidth * 0.2;

    this.config.series.forEach((series, seriesIndex) => {
      const color = series.color || this.colors[seriesIndex % this.colors.length];

      series.data.forEach((point, pointIndex) => {
        const groupX = paddingLeft + pointIndex * groupWidth;
        const barX = groupX + seriesIndex * (barWidth + barSpacing) + barSpacing;

        const barHeight = ((point.y - min) / (max - min)) * chartHeight * this.animationProgress;
        const barY = paddingTop + chartHeight - barHeight;

        // Highlight if hovered
        const isHovered =
          this.hoveredPoint &&
          this.hoveredPoint.seriesIndex === seriesIndex &&
          this.hoveredPoint.pointIndex === pointIndex;

        this.ctx.fillStyle = isHovered ? this.lightenColor(color, 20) : color;

        // Draw bar
        this.ctx.fillRect(barX, barY, barWidth - barSpacing, barHeight);

        // Draw border on hover
        if (isHovered) {
          this.ctx.strokeStyle = this.darkenColor(color, 20);
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(barX, barY, barWidth - barSpacing, barHeight);
        }

        // Store bar for hit detection
        this.bars.push({
          x: barX,
          y: barY,
          width: barWidth - barSpacing,
          height: barHeight,
          seriesIndex,
          pointIndex,
        });
      });
    });

    // Draw grid lines
    if (this.config.axes.y.gridLines !== false) {
      this.drawGridLines(min, max);
    }

    // Draw labels
    this.drawXAxisLabels();
    this.drawYAxisLabels(min, max);
  }

  private drawGridLines(min: number, max: number): void {
    const { paddingLeft, paddingTop, chartWidth, chartHeight } = this.dimensions;
    const steps = 5;

    this.ctx.save();
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const y = paddingTop + chartHeight - ((value - min) / (max - min)) * chartHeight;

      this.ctx.beginPath();
      this.ctx.moveTo(paddingLeft, y);
      this.ctx.lineTo(paddingLeft + chartWidth, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawXAxisLabels(): void {
    const { paddingLeft, paddingTop, chartWidth, chartHeight } = this.dimensions;

    if (this.config.series.length === 0 || this.config.series[0].data.length === 0) {
      return;
    }

    const data = this.config.series[0].data;
    const numPoints = data.length;
    const groupWidth = chartWidth / numPoints;

    this.ctx.save();
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.textAlign = 'center';

    data.forEach((point, index) => {
      const x = paddingLeft + index * groupWidth + groupWidth / 2;
      const y = paddingTop + chartHeight + 15;

      let label = '';
      if (typeof point.x === 'string') {
        label = point.x;
      } else if (point.x instanceof Date) {
        label = point.x.toLocaleDateString();
      } else {
        label = point.x.toString();
      }

      // Truncate long labels
      if (label.length > 12) {
        label = label.substring(0, 10) + '...';
      }

      this.ctx.fillText(label, x, y);
    });

    this.ctx.restore();
  }

  private drawYAxisLabels(min: number, max: number): void {
    const { paddingLeft, paddingTop, chartHeight } = this.dimensions;
    const steps = 5;

    this.ctx.save();
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const y = paddingTop + chartHeight - ((value - min) / (max - min)) * chartHeight;

      this.ctx.fillText(this.formatValue(value), paddingLeft - 10, y);
    }

    this.ctx.restore();
  }

  protected getPointAtPosition(x: number, y: number): { seriesIndex: number; pointIndex: number } | null {
    for (const bar of this.bars) {
      if (
        x >= bar.x &&
        x <= bar.x + bar.width &&
        y >= bar.y &&
        y <= bar.y + bar.height
      ) {
        return { seriesIndex: bar.seriesIndex, pointIndex: bar.pointIndex };
      }
    }

    return null;
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  private darkenColor(color: string, percent: number): string {
    return this.lightenColor(color, -percent);
  }
}
