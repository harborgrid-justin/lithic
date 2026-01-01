/**
 * Trend Chart Component
 * Display trends of lab results over time
 */

export class TrendChart {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private data: any[] = [];
  private testName: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setData(data: any[], testName: string): void {
    this.data = data.sort((a, b) =>
      new Date(a.performedDateTime).getTime() - new Date(b.performedDateTime).getTime()
    );
    this.testName = testName;
    this.render();
  }

  private render(): void {
    if (this.data.length === 0) {
      this.container.innerHTML = '<p>No data available for trend analysis</p>';
      return;
    }

    const html = `
      <div class="trend-chart">
        <div class="chart-header">
          <h4>${this.testName} - Trend Analysis</h4>
          <div class="chart-info">
            <span>${this.data.length} results</span>
            <span>${this.formatDateRange()}</span>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="trendCanvas" width="800" height="400"></canvas>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background: #4CAF50;"></span>
            <span>Normal Range</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: #2196F3;"></span>
            <span>Result Value</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: #FFC107;"></span>
            <span>Abnormal</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: #F44336;"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.canvas = this.container.querySelector('#trendCanvas');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.drawChart();
    }
  }

  private drawChart(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate chart dimensions
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get data ranges
    const values = this.data.map(d => parseFloat(d.value));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Get reference range (using first result's range)
    const refRange = this.data[0]?.referenceRange;

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw reference range background
    if (refRange && refRange.min !== undefined && refRange.max !== undefined) {
      const minY = this.valueToY(refRange.max, minValue, maxValue, chartHeight, padding);
      const maxY = this.valueToY(refRange.min, minValue, maxValue, chartHeight, padding);

      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.fillRect(padding.left, minY, chartWidth, maxY - minY);

      // Draw reference range lines
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Max reference line
      ctx.beginPath();
      ctx.moveTo(padding.left, minY);
      ctx.lineTo(width - padding.right, minY);
      ctx.stroke();

      // Min reference line
      ctx.beginPath();
      ctx.moveTo(padding.left, maxY);
      ctx.lineTo(width - padding.right, maxY);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw data points and line
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.data.forEach((point, index) => {
      const x = padding.left + (index / (this.data.length - 1)) * chartWidth;
      const y = this.valueToY(parseFloat(point.value), minValue, maxValue, chartHeight, padding);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    this.data.forEach((point, index) => {
      const x = padding.left + (index / (this.data.length - 1)) * chartWidth;
      const y = this.valueToY(parseFloat(point.value), minValue, maxValue, chartHeight, padding);

      // Determine point color based on abnormal flag
      let pointColor = '#2196F3'; // Normal
      if (point.critical) {
        pointColor = '#F44336'; // Critical
      } else if (point.abnormalFlag && point.abnormalFlag !== 'N') {
        pointColor = '#FFC107'; // Abnormal
      }

      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';

    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
      const value = minValue + (valueRange * i / numYLabels);
      const y = height - padding.bottom - (chartHeight * i / numYLabels);
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    // Draw X-axis labels (dates)
    ctx.textAlign = 'center';
    const maxXLabels = Math.min(this.data.length, 6);
    const step = Math.floor(this.data.length / maxXLabels);

    this.data.forEach((point, index) => {
      if (index % step === 0 || index === this.data.length - 1) {
        const x = padding.left + (index / (this.data.length - 1)) * chartWidth;
        const date = new Date(point.performedDateTime);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        ctx.fillText(label, x, height - padding.bottom + 20);
      }
    });

    // Draw axis labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';

    // Y-axis label
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(this.data[0]?.unit || 'Value', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Date', width / 2, height - 10);
  }

  private valueToY(value: number, minValue: number, maxValue: number, chartHeight: number, padding: any): number {
    const valueRange = maxValue - minValue || 1;
    const normalizedValue = (value - minValue) / valueRange;
    return padding.top + chartHeight - (normalizedValue * chartHeight);
  }

  private formatDateRange(): string {
    if (this.data.length === 0) return '';

    const firstDate = new Date(this.data[0].performedDateTime);
    const lastDate = new Date(this.data[this.data.length - 1].performedDateTime);

    return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  destroy(): void {
    this.container.innerHTML = '';
    this.canvas = null;
    this.ctx = null;
  }
}
