/**
 * QualityMetrics - Quality measures display component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface QualityMeasure {
  id: string;
  code: string;
  name: string;
  rate: number;
  target: number;
  benchmark?: number;
  status: 'compliant' | 'non_compliant' | 'at_risk';
  numerator: number;
  denominator: number;
}

export class QualityMetrics {
  private container: HTMLElement;
  private measures: QualityMeasure[];

  constructor(container: HTMLElement, measures: QualityMeasure[]) {
    this.container = container;
    this.measures = measures;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    `;

    this.measures.forEach((measure) => {
      const card = this.createMeasureCard(measure);
      grid.appendChild(card);
    });

    this.container.appendChild(grid);
  }

  private createMeasureCard(measure: QualityMeasure): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid ${this.getStatusColor(measure.status)};
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 12px;';

    const code = document.createElement('div');
    code.textContent = measure.code;
    code.style.cssText = 'font-size: 12px; color: #666; font-weight: 600;';

    const name = document.createElement('div');
    name.textContent = measure.name;
    name.style.cssText = 'font-size: 14px; font-weight: 600; margin-top: 4px;';

    header.appendChild(code);
    header.appendChild(name);

    // Rate
    const rate = document.createElement('div');
    rate.textContent = `${measure.rate.toFixed(1)}%`;
    rate.style.cssText = 'font-size: 32px; font-weight: 700; margin: 12px 0;';

    // Progress bar
    const progressBar = this.createProgressBar(measure);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = 'font-size: 12px; color: #666; margin-top: 12px;';
    footer.innerHTML = `
      Target: ${measure.target}% | ${measure.numerator}/${measure.denominator} patients
    `;

    card.appendChild(header);
    card.appendChild(rate);
    card.appendChild(progressBar);
    card.appendChild(footer);

    return card;
  }

  private createProgressBar(measure: QualityMeasure): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
      height: 100%;
      width: ${measure.rate}%;
      background: ${this.getStatusColor(measure.status)};
      transition: width 0.3s;
    `;

    container.appendChild(bar);
    return container;
  }

  private getStatusColor(status: string): string {
    const colors = {
      compliant: '#50c878',
      at_risk: '#f5a623',
      non_compliant: '#e74c3c',
    };
    return colors[status as keyof typeof colors] || '#666';
  }

  public update(measures: QualityMeasure[]): void {
    this.measures = measures;
    this.render();
  }
}
