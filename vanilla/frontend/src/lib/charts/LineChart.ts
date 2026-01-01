/**
 * LineChart - Line chart implementation using Canvas API
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { ChartBase, ChartConfig } from './ChartBase';

export class LineChart extends ChartBase {
  private points: Array<{ x: number; y: number; seriesIndex: number; pointIndex: number }> = [];

  constructor(canvas: HTMLCanvasElement, config: ChartConfig) {
    super(canvas, config);
  }

  protected drawChart(): void {
    const { min, max } = this.getMinMaxValues();
    this.points = [];

    this.config.series.forEach((series, seriesIndex) => {
      const color = series.color || this.colors[seriesIndex % this.colors.length];
      const data = series.data;

      if (data.length === 0) return;

      this.ctx.save();

      // Draw area fill if specified
      if (series.type === 'area') {
        this.drawAreaFill(data, min, max, color);
      }

      // Draw line
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();

      data.forEach((point, pointIndex) => {
        const x = this.scaleX(pointIndex, data.length);
        const y = this.scaleY(point.y * this.animationProgress, min, max);

        if (pointIndex === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }

        // Store point for hit detection
        this.points.push({ x, y, seriesIndex, pointIndex });
      });

      this.ctx.stroke();

      // Draw points
      data.forEach((point, pointIndex) => {
        const x = this.scaleX(pointIndex, data.length);
        const y = this.scaleY(point.y * this.animationProgress, min, max);

        // Highlight if hovered
        const isHovered =
          this.hoveredPoint &&
          this.hoveredPoint.seriesIndex === seriesIndex &&
          this.hoveredPoint.pointIndex === pointIndex;

        this.ctx.fillStyle = isHovered ? '#fff' : color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = isHovered ? 3 : 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      });

      this.ctx.restore();
    });

    // Draw grid lines
    if (this.config.axes.y.gridLines !== false) {
      this.drawGridLines(min, max);
    }

    // Draw x-axis labels
    this.drawXAxisLabels();

    // Draw y-axis labels
    this.drawYAxisLabels(min, max);
  }

  private drawAreaFill(data: any[], min: number, max: number, color: string): void {
    const { paddingLeft, paddingTop, chartHeight } = this.dimensions;

    this.ctx.save();
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.moveTo(paddingLeft, paddingTop + chartHeight);

    data.forEach((point, index) => {
      const x = this.scaleX(index, data.length);
      const y = this.scaleY(point.y * this.animationProgress, min, max);
      this.ctx.lineTo(x, y);
    });

    const lastX = this.scaleX(data.length - 1, data.length);
    this.ctx.lineTo(lastX, paddingTop + chartHeight);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawGridLines(min: number, max: number): void {
    const { paddingLeft, paddingTop, chartWidth, chartHeight } = this.dimensions;
    const steps = 5;

    this.ctx.save();
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const y = this.scaleY(value, min, max);

      this.ctx.beginPath();
      this.ctx.moveTo(paddingLeft, y);
      this.ctx.lineTo(paddingLeft + chartWidth, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawXAxisLabels(): void {
    const { paddingLeft, paddingTop, chartHeight } = this.dimensions;

    // Get the first series for x-axis labels
    if (this.config.series.length === 0 || this.config.series[0].data.length === 0) {
      return;
    }

    const data = this.config.series[0].data;
    const maxLabels = Math.min(10, data.length);
    const step = Math.ceil(data.length / maxLabels);

    this.ctx.save();
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.textAlign = 'center';

    data.forEach((point, index) => {
      if (index % step !== 0 && index !== data.length - 1) return;

      const x = this.scaleX(index, data.length);
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
    const { paddingLeft } = this.dimensions;
    const steps = 5;

    this.ctx.save();
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const value = min + ((max - min) / steps) * i;
      const y = this.scaleY(value, min, max);

      this.ctx.fillText(this.formatValue(value), paddingLeft - 10, y);
    }

    this.ctx.restore();
  }

  protected getPointAtPosition(x: number, y: number): { seriesIndex: number; pointIndex: number } | null {
    const threshold = 10; // pixels

    for (const point of this.points) {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      if (distance <= threshold) {
        return { seriesIndex: point.seriesIndex, pointIndex: point.pointIndex };
      }
    }

    return null;
  }
}
