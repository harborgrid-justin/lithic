/**
 * Dashboards Page - List and manage all dashboards
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { analyticsService } from '../../services/AnalyticsService';

export class DashboardsPage {
  private container: HTMLElement;
  private dashboards: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadDashboards();
    this.render();
  }

  private async loadDashboards(): Promise<void> {
    try {
      const response = await analyticsService.getDashboards();
      this.dashboards = response.data || [];
    } catch (error) {
      console.error('Failed to load dashboards:', error);
      this.dashboards = [];
    }
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'dashboards-page';

    // Page header
    const header = this.createHeader();
    this.container.appendChild(header);

    // Dashboard grid
    const grid = this.createDashboardGrid();
    this.container.appendChild(grid);
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Analytics Dashboards';
    title.style.cssText = 'margin: 0; font-size: 28px;';

    const createBtn = document.createElement('button');
    createBtn.textContent = '+ Create Dashboard';
    createBtn.style.cssText = `
      padding: 12px 24px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    `;

    createBtn.addEventListener('click', () => this.handleCreate());

    header.appendChild(title);
    header.appendChild(createBtn);

    return header;
  }

  private createDashboardGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    `;

    if (this.dashboards.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No dashboards found. Create your first dashboard!';
      empty.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 60px; color: #999;';
      grid.appendChild(empty);
    } else {
      this.dashboards.forEach((dashboard) => {
        const card = this.createDashboardCard(dashboard);
        grid.appendChild(card);
      });
    }

    return grid;
  }

  private createDashboardCard(dashboard: any): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
    `;

    card.addEventListener('click', () => this.handleView(dashboard.id));

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    const title = document.createElement('h3');
    title.textContent = dashboard.name;
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 18px;';

    const category = document.createElement('div');
    category.textContent = dashboard.category;
    category.style.cssText = `
      display: inline-block;
      padding: 4px 12px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    `;

    const description = document.createElement('p');
    description.textContent = dashboard.description || 'No description';
    description.style.cssText = 'color: #666; font-size: 14px; margin: 0 0 16px 0;';

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size: 12px; color: #999;';
    meta.textContent = `${dashboard.widgets?.length || 0} widgets • Updated ${new Date(dashboard.updatedAt).toLocaleDateString()}`;

    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(description);
    card.appendChild(meta);

    return card;
  }

  private handleCreate(): void {
    window.location.hash = '#/analytics/dashboards/new';
  }

  private handleView(id: string): void {
    window.location.hash = `#/analytics/dashboards/${id}`;
  }
}
