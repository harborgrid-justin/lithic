/**
 * Operational Analytics Page - Patient flow, utilization, efficiency
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { KPICard } from '../../components/analytics/KPICard';
import { ChartWidget } from '../../components/analytics/ChartWidget';
import { analyticsService } from '../../services/AnalyticsService';

export class OperationalPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    this.render();
    await this.loadOperationalMetrics();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.padding = '24px';

    const title = document.createElement('h1');
    title.textContent = 'Operational Analytics';
    title.style.margin = '0 0 24px 0';
    this.container.appendChild(title);

    const kpiGrid = document.createElement('div');
    kpiGrid.id = 'operational-kpis';
    kpiGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;';
    this.container.appendChild(kpiGrid);

    const chartGrid = document.createElement('div');
    chartGrid.id = 'operational-charts';
    chartGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;';
    this.container.appendChild(chartGrid);
  }

  private async loadOperationalMetrics(): Promise<void> {
    try {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - 30));

      const response = await analyticsService.getOperationalMetrics(
        start.toISOString(),
        new Date().toISOString()
      );

      this.renderKPIs(response.data || []);
      this.renderCharts();
    } catch (error) {
      console.error('Failed to load operational metrics:', error);
    }
  }

  private renderKPIs(metrics: any[]): void {
    const kpiGrid = this.container.querySelector('#operational-kpis') as HTMLElement;
    if (!kpiGrid) return;

    kpiGrid.innerHTML = '';

    metrics.slice(0, 4).forEach((metric) => {
      const container = document.createElement('div');
      new KPICard(container, {
        title: metric.metricType.replace(/_/g, ' ').toUpperCase(),
        value: metric.value,
        unit: metric.unit,
        target: metric.target,
        color: '#50c878',
      });
      kpiGrid.appendChild(container);
    });
  }

  private renderCharts(): void {
    const chartGrid = this.container.querySelector('#operational-charts') as HTMLElement;
    if (!chartGrid) return;

    chartGrid.innerHTML = '';

    const volumeContainer = document.createElement('div');
    volumeContainer.style.height = '400px';

    new ChartWidget(volumeContainer, {
      id: 'patient-flow',
      type: 'line',
      title: 'Patient Flow by Hour',
      data: {
        series: [{ name: 'Patients', data: this.generateHourlyData() }],
        axes: { x: { label: 'Hour', type: 'category' }, y: { label: 'Patients', type: 'number' } },
      },
    });

    chartGrid.appendChild(volumeContainer);

    const utilizationContainer = document.createElement('div');
    utilizationContainer.style.height = '400px';

    new ChartWidget(utilizationContainer, {
      id: 'utilization',
      type: 'bar',
      title: 'Resource Utilization',
      data: {
        series: [{
          name: 'Utilization %',
          data: [
            { x: 'OR', y: 85 },
            { x: 'Beds', y: 92 },
            { x: 'Equipment', y: 78 },
            { x: 'Staff', y: 88 },
          ],
        }],
        axes: { x: { label: 'Resource', type: 'category' }, y: { label: 'Utilization %', type: 'number' } },
      },
    });

    chartGrid.appendChild(utilizationContainer);
  }

  private generateHourlyData(): any[] {
    return Array.from({ length: 24 }, (_, i) => ({
      x: `${i}:00`,
      y: Math.floor(Math.random() * 50) + 10,
    }));
  }
}
