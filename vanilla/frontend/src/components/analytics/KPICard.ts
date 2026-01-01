/**
 * KPICard - Key Performance Indicator card component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface KPICardConfig {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  target?: number;
  icon?: string;
  color?: string;
}

export class KPICard {
  private container: HTMLElement;
  private config: KPICardConfig;

  constructor(container: HTMLElement, config: KPICardConfig) {
    this.container = container;
    this.config = config;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'kpi-card';

    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid ${this.config.color || '#4a90e2'};
      height: 100%;
      display: flex;
      flex-direction: column;
    `;

    // Header with title and icon
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    `;

    const title = document.createElement('div');
    title.textContent = this.config.title;
    title.style.cssText = `
      font-size: 14px;
      color: #666;
      font-weight: 500;
    `;

    if (this.config.icon) {
      const icon = document.createElement('div');
      icon.innerHTML = this.config.icon;
      icon.style.cssText = `
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${this.config.color || '#4a90e2'}15;
        border-radius: 6px;
        color: ${this.config.color || '#4a90e2'};
      `;
      header.appendChild(icon);
    }

    header.insertBefore(title, header.firstChild);

    // Value
    const valueContainer = document.createElement('div');
    valueContainer.style.cssText = `
      margin-bottom: 8px;
    `;

    const value = document.createElement('div');
    value.style.cssText = `
      font-size: 32px;
      font-weight: 700;
      color: #333;
      display: inline;
    `;

    value.textContent = typeof this.config.value === 'number'
      ? this.config.value.toLocaleString()
      : this.config.value;

    if (this.config.unit) {
      const unit = document.createElement('span');
      unit.textContent = ` ${this.config.unit}`;
      unit.style.cssText = `
        font-size: 18px;
        font-weight: 400;
        color: #666;
      `;
      value.appendChild(unit);
    }

    valueContainer.appendChild(value);

    // Footer with trend and target
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    `;

    // Trend
    if (this.config.trend) {
      const trend = this.createTrendIndicator(this.config.trend);
      footer.appendChild(trend);
    }

    // Target
    if (this.config.target !== undefined) {
      const target = document.createElement('div');
      target.textContent = `Target: ${this.config.target}${this.config.unit || ''}`;
      target.style.cssText = `
        font-size: 12px;
        color: #999;
      `;
      footer.appendChild(target);
    }

    card.appendChild(header);
    card.appendChild(valueContainer);
    if (footer.children.length > 0) {
      card.appendChild(footer);
    }

    this.container.appendChild(card);
  }

  private createTrendIndicator(trend: NonNullable<KPICardConfig['trend']>): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    `;

    const arrow = document.createElement('span');
    arrow.style.cssText = `
      font-size: 16px;
    `;

    let color = '#666';
    if (trend.direction === 'up') {
      arrow.textContent = '▲';
      color = trend.isPositive !== false ? '#50c878' : '#e74c3c';
    } else if (trend.direction === 'down') {
      arrow.textContent = '▼';
      color = trend.isPositive === true ? '#50c878' : '#e74c3c';
    } else {
      arrow.textContent = '■';
      color = '#666';
    }

    arrow.style.color = color;

    const value = document.createElement('span');
    value.textContent = `${Math.abs(trend.value).toFixed(1)}%`;
    value.style.color = color;

    container.appendChild(arrow);
    container.appendChild(value);

    return container;
  }

  public updateValue(value: number | string): void {
    this.config.value = value;
    this.render();
  }

  public updateTrend(trend: KPICardConfig['trend']): void {
    this.config.trend = trend;
    this.render();
  }

  public updateConfig(config: Partial<KPICardConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
  }
}
