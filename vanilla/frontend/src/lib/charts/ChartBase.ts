/**
 * ChartBase - Base class for all chart implementations using Canvas API
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export interface ChartAxisConfig {
  label: string;
  type: 'category' | 'number' | 'date';
  format?: string;
  min?: number;
  max?: number;
  gridLines?: boolean;
}

export interface ChartLegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface ChartTooltipConfig {
  enabled: boolean;
  format?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface ChartConfig {
  title?: string;
  subtitle?: string;
  series: ChartSeries[];
  axes: {
    x: ChartAxisConfig;
    y: ChartAxisConfig;
  };
  legend?: ChartLegendConfig;
  tooltip?: ChartTooltipConfig;
  colors?: string[];
  responsive?: boolean;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  animation?: {
    enabled: boolean;
    duration: number;
  };
}

export interface ChartDimensions {
  width: number;
  height: number;
  chartWidth: number;
  chartHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export abstract class ChartBase {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected config: ChartConfig;
  protected dimensions: ChartDimensions;
  protected colors: string[];
  protected hoveredPoint: { seriesIndex: number; pointIndex: number } | null = null;
  protected animationFrame: number | null = null;
  protected animationProgress: number = 0;

  // Default color palette
  protected static DEFAULT_COLORS = [
    '#4a90e2', // Blue
    '#50c878', // Emerald
    '#f5a623', // Orange
    '#bd10e0', // Purple
    '#e74c3c', // Red
    '#16a085', // Teal
    '#f39c12', // Yellow
    '#8e44ad', // Violet
    '#27ae60', // Green
    '#e67e22', // Carrot
  ];

  constructor(canvas: HTMLCanvasElement, config: ChartConfig) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = context;
    this.config = this.mergeDefaultConfig(config);
    this.colors = config.colors || ChartBase.DEFAULT_COLORS;

    this.dimensions = this.calculateDimensions();
    this.setupEventListeners();

    // Enable high DPI rendering
    this.setupHighDPI();
  }

  protected mergeDefaultConfig(config: ChartConfig): ChartConfig {
    return {
      ...config,
      legend: {
        show: true,
        position: 'top',
        ...config.legend,
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#333',
        textColor: '#fff',
        ...config.tooltip,
      },
      padding: {
        top: 60,
        right: 40,
        bottom: 60,
        left: 70,
        ...config.padding,
      },
      animation: {
        enabled: true,
        duration: 750,
        ...config.animation,
      },
      responsive: config.responsive !== false,
    };
  }

  protected setupHighDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.scale(dpr, dpr);
  }

  protected calculateDimensions(): ChartDimensions {
    const rect = this.canvas.getBoundingClientRect();
    const padding = this.config.padding!;

    return {
      width: rect.width,
      height: rect.height,
      chartWidth: rect.width - padding.left - padding.right,
      chartHeight: rect.height - padding.top - padding.bottom,
      paddingTop: padding.top,
      paddingRight: padding.right,
      paddingBottom: padding.bottom,
      paddingLeft: padding.left,
    };
  }

  protected setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    if (this.config.responsive) {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  protected handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const point = this.getPointAtPosition(x, y);

    if (point) {
      this.hoveredPoint = point;
      this.canvas.style.cursor = 'pointer';
      this.render();
    } else if (this.hoveredPoint) {
      this.hoveredPoint = null;
      this.canvas.style.cursor = 'default';
      this.render();
    }
  }

  protected handleMouseLeave(): void {
    if (this.hoveredPoint) {
      this.hoveredPoint = null;
      this.canvas.style.cursor = 'default';
      this.render();
    }
  }

  protected handleResize(): void {
    this.setupHighDPI();
    this.dimensions = this.calculateDimensions();
    this.render();
  }

  protected abstract getPointAtPosition(x: number, y: number): { seriesIndex: number; pointIndex: number } | null;

  public render(): void {
    if (this.config.animation?.enabled && this.animationProgress < 1) {
      this.animate();
    } else {
      this.draw();
    }
  }

  protected animate(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = Date.now();
    const duration = this.config.animation!.duration;

    const step = () => {
      const elapsed = Date.now() - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);

      this.draw();

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    step();
  }

  protected draw(): void {
    this.clear();
    this.drawTitle();
    this.drawLegend();
    this.drawAxes();
    this.drawChart();
    this.drawTooltip();
  }

  protected clear(): void {
    this.ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
  }

  protected drawTitle(): void {
    if (!this.config.title) return;

    this.ctx.save();
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.config.title, this.dimensions.width / 2, 20);

    if (this.config.subtitle) {
      this.ctx.font = '12px Arial, sans-serif';
      this.ctx.fillStyle = '#666';
      this.ctx.fillText(this.config.subtitle, this.dimensions.width / 2, 38);
    }

    this.ctx.restore();
  }

  protected drawLegend(): void {
    if (!this.config.legend?.show) return;

    const legend = this.config.legend;
    const itemWidth = 120;
    const itemHeight = 20;
    const iconSize = 12;

    let x = 0;
    let y = 0;

    if (legend.position === 'top') {
      x = this.dimensions.width / 2 - (this.config.series.length * itemWidth) / 2;
      y = this.config.subtitle ? 50 : 32;
    }

    this.ctx.save();
    this.ctx.font = '12px Arial, sans-serif';

    this.config.series.forEach((series, i) => {
      const color = series.color || this.colors[i % this.colors.length];
      const currentX = x + i * itemWidth;

      // Draw color box
      this.ctx.fillStyle = color;
      this.ctx.fillRect(currentX, y, iconSize, iconSize);

      // Draw label
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(series.name, currentX + iconSize + 5, y + iconSize);
    });

    this.ctx.restore();
  }

  protected drawAxes(): void {
    const { paddingLeft, paddingTop, chartWidth, chartHeight } = this.dimensions;

    this.ctx.save();
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;

    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(paddingLeft, paddingTop);
    this.ctx.lineTo(paddingLeft, paddingTop + chartHeight);
    this.ctx.stroke();

    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(paddingLeft, paddingTop + chartHeight);
    this.ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);
    this.ctx.stroke();

    // Axis labels
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px Arial, sans-serif';

    // Y-axis label
    this.ctx.save();
    this.ctx.translate(15, paddingTop + chartHeight / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.config.axes.y.label, 0, 0);
    this.ctx.restore();

    // X-axis label
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.config.axes.x.label,
      paddingLeft + chartWidth / 2,
      paddingTop + chartHeight + 45
    );

    this.ctx.restore();
  }

  protected abstract drawChart(): void;

  protected drawTooltip(): void {
    if (!this.config.tooltip?.enabled || !this.hoveredPoint) return;

    const series = this.config.series[this.hoveredPoint.seriesIndex];
    const point = series.data[this.hoveredPoint.pointIndex];

    const text = `${series.name}: ${this.formatValue(point.y)}`;
    const padding = 8;

    this.ctx.save();
    this.ctx.font = '12px Arial, sans-serif';

    const metrics = this.ctx.measureText(text);
    const width = metrics.width + padding * 2;
    const height = 24;

    // Position tooltip near cursor (would need actual mouse position in real implementation)
    const x = this.dimensions.width / 2;
    const y = 20;

    // Draw background
    this.ctx.fillStyle = this.config.tooltip!.backgroundColor || '#333';
    this.ctx.fillRect(x, y, width, height);

    // Draw text
    this.ctx.fillStyle = this.config.tooltip!.textColor || '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + padding, y + height / 2);

    this.ctx.restore();
  }

  protected formatValue(value: number): string {
    return value.toLocaleString();
  }

  protected getMinMaxValues(): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    this.config.series.forEach((series) => {
      series.data.forEach((point) => {
        min = Math.min(min, point.y);
        max = Math.max(max, point.y);
      });
    });

    // Add some padding
    const padding = (max - min) * 0.1;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding),
    };
  }

  protected scaleY(value: number, min: number, max: number): number {
    const { paddingTop, chartHeight } = this.dimensions;
    const ratio = (value - min) / (max - min);
    return paddingTop + chartHeight - ratio * chartHeight;
  }

  protected scaleX(index: number, total: number): number {
    const { paddingLeft, chartWidth } = this.dimensions;
    return paddingLeft + (index / (total - 1)) * chartWidth;
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('resize', this.handleResize);
  }

  public updateConfig(config: Partial<ChartConfig>): void {
    this.config = this.mergeDefaultConfig({ ...this.config, ...config });
    this.animationProgress = 0;
    this.render();
  }

  public updateData(series: ChartSeries[]): void {
    this.config.series = series;
    this.animationProgress = 0;
    this.render();
  }
}
