/**
 * Analytics Dashboard Page - Main analytics overview
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { KPICard } from '../../components/analytics/KPICard';
import { ChartWidget } from '../../components/analytics/ChartWidget';
import { DateRangePicker } from '../../components/analytics/DateRangePicker';
import { analyticsService } from '../../services/AnalyticsService';

export class AnalyticsDashboardPage {
  private container: HTMLElement;
  private dateRange = {
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    this.render();
    await this.loadData();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = 'padding: 24px;';

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Analytics Dashboard';
    title.style.margin = '0';

    header.appendChild(title);

    // Date picker
    const datePickerContainer = document.createElement('div');
    new DateRangePicker(datePickerContainer, {
      initialRange: this.dateRange,
      onChange: (range) => {
        this.dateRange = range;
        this.loadData();
      },
    });

    header.appendChild(datePickerContainer);
    this.container.appendChild(header);

    // KPI Cards
    const kpiGrid = document.createElement('div');
    kpiGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    `;
    kpiGrid.id = 'kpi-grid';

    this.container.appendChild(kpiGrid);

    // Charts
    const chartGrid = document.createElement('div');
    chartGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    `;
    chartGrid.id = 'chart-grid';

    this.container.appendChild(chartGrid);
  }

  private async loadData(): Promise<void> {
    try {
      // Load KPIs
      await this.loadKPIs();

      // Load charts
      await this.loadCharts();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  private async loadKPIs(): Promise<void> {
    const kpiGrid = this.container.querySelector('#kpi-grid') as HTMLElement;
    if (!kpiGrid) return;

    kpiGrid.innerHTML = '';

    const kpis = [
      {
        title: 'Total Patient Volume',
        value: 12453,
        unit: 'patients',
        trend: { value: 5.3, direction: 'up' as const, isPositive: true },
        color: '#4a90e2',
        icon: '👥',
      },
      {
        title: 'Average Wait Time',
        value: 18,
        unit: 'min',
        trend: { value: 12.1, direction: 'down' as const, isPositive: true },
        color: '#50c878',
        icon: '⏱️',
      },
      {
        title: 'Patient Satisfaction',
        value: '4.6',
        unit: '/ 5.0',
        trend: { value: 2.8, direction: 'up' as const, isPositive: true },
        color: '#f5a623',
        icon: '⭐',
      },
      {
        title: 'Quality Measure Compliance',
        value: 87,
        unit: '%',
        trend: { value: 3.2, direction: 'up' as const, isPositive: true },
        target: 90,
        color: '#bd10e0',
        icon: '✓',
      },
    ];

    kpis.forEach((kpi) => {
      const container = document.createElement('div');
      new KPICard(container, kpi);
      kpiGrid.appendChild(container);
    });
  }

  private async loadCharts(): Promise<void> {
    const chartGrid = this.container.querySelector('#chart-grid') as HTMLElement;
    if (!chartGrid) return;

    chartGrid.innerHTML = '';

    // Patient volume trend
    const volumeContainer = document.createElement('div');
    volumeContainer.style.height = '400px';

    new ChartWidget(volumeContainer, {
      id: 'patient-volume',
      type: 'line',
      title: 'Patient Volume Trend',
      data: {
        series: [
          {
            name: 'Patient Visits',
            data: this.generateSampleData(30),
            type: 'area',
          },
        ],
        axes: {
          x: { label: 'Date', type: 'date' },
          y: { label: 'Patients', type: 'number' },
        },
      },
    });

    chartGrid.appendChild(volumeContainer);

    // Department performance
    const deptContainer = document.createElement('div');
    deptContainer.style.height = '400px';

    new ChartWidget(deptContainer, {
      id: 'dept-performance',
      type: 'bar',
      title: 'Department Performance',
      data: {
        series: [
          {
            name: 'Wait Time (min)',
            data: [
              { x: 'Emergency', y: 25 },
              { x: 'Outpatient', y: 12 },
              { x: 'Surgery', y: 8 },
              { x: 'Radiology', y: 15 },
              { x: 'Lab', y: 10 },
            ],
          },
        ],
        axes: {
          x: { label: 'Department', type: 'category' },
          y: { label: 'Wait Time (min)', type: 'number' },
        },
      },
    });

    chartGrid.appendChild(deptContainer);
  }

  private generateSampleData(days: number): any[] {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      data.push({
        x: date,
        y: Math.floor(Math.random() * 100) + 300,
      });
    }

    return data;
  }
}
