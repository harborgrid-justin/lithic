/**
 * Dashboard Detail Page - View and interact with a specific dashboard
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { DashboardGrid, GridItem } from '../../components/analytics/DashboardGrid';
import { ChartWidget } from '../../components/analytics/ChartWidget';
import { KPICard } from '../../components/analytics/KPICard';
import { analyticsService } from '../../services/AnalyticsService';

export class DashboardDetailPage {
  private container: HTMLElement;
  private dashboardId: string;
  private dashboard: any = null;

  constructor(container: HTMLElement, dashboardId: string) {
    this.container = container;
    this.dashboardId = dashboardId;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadDashboard();
    this.render();
  }

  private async loadDashboard(): Promise<void> {
    try {
      const response = await analyticsService.getDashboard(this.dashboardId);
      this.dashboard = response.data;
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }

  private render(): void {
    if (!this.dashboard) {
      this.container.innerHTML = '<div style="padding: 40px; text-align: center;">Dashboard not found</div>';
      return;
    }

    this.container.innerHTML = '';
    this.container.style.padding = '24px';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 24px;';

    const title = document.createElement('h1');
    title.textContent = this.dashboard.name;
    title.style.margin = '0 0 8px 0';

    const description = document.createElement('p');
    description.textContent = this.dashboard.description || '';
    description.style.cssText = 'margin: 0; color: #666;';

    header.appendChild(title);
    header.appendChild(description);
    this.container.appendChild(header);

    // Dashboard grid
    const gridContainer = document.createElement('div');
    gridContainer.style.minHeight = '600px';

    const items: GridItem[] = (this.dashboard.widgets || []).map((widget: any, index: number) => ({
      id: widget.id,
      x: widget.layout?.x || (index % 3),
      y: widget.layout?.y || Math.floor(index / 3),
      w: widget.layout?.w || 1,
      h: widget.layout?.h || 1,
      content: this.createWidgetContent(widget),
    }));

    new DashboardGrid(gridContainer, {
      columns: 4,
      rowHeight: 200,
      gap: 16,
      items,
      isDraggable: true,
      isResizable: true,
      onLayoutChange: (items) => this.handleLayoutChange(items),
    });

    this.container.appendChild(gridContainer);
  }

  private createWidgetContent(widget: any): HTMLElement {
    const container = document.createElement('div');

    if (widget.type === 'kpi') {
      new KPICard(container, {
        title: widget.title,
        value: Math.floor(Math.random() * 1000),
        unit: 'units',
        trend: { value: 5.2, direction: 'up', isPositive: true },
      });
    } else {
      new ChartWidget(container, {
        id: widget.id,
        type: widget.type || 'line',
        title: widget.title,
        data: {
          series: [{ name: 'Data', data: [{ x: '1', y: 10 }, { x: '2', y: 20 }] }],
          axes: { x: { label: 'X', type: 'category' }, y: { label: 'Y', type: 'number' } },
        },
      });
    }

    return container;
  }

  private async handleLayoutChange(items: GridItem[]): Promise<void> {
    console.log('Layout changed:', items);
    // In production, save layout to backend
  }
}
