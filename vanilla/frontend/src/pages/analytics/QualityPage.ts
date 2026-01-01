/**
 * Quality Page - Quality measures and HEDIS metrics
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { QualityMetrics } from '../../components/analytics/QualityMetrics';
import { FilterPanel } from '../../components/analytics/FilterPanel';
import { analyticsService } from '../../services/AnalyticsService';

export class QualityPage {
  private container: HTMLElement;
  private measures: any[] = [];
  private filters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    this.render();
    await this.loadMeasures();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = 'padding: 24px;';

    // Header
    const header = document.createElement('h1');
    header.textContent = 'Quality Measures';
    header.style.cssText = 'margin: 0 0 24px 0;';
    this.container.appendChild(header);

    // Layout
    const layout = document.createElement('div');
    layout.style.cssText = `
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
    `;

    // Filters
    const filterContainer = document.createElement('div');
    new FilterPanel(filterContainer, {
      filters: [
        {
          id: 'category',
          label: 'Category',
          type: 'select',
          options: [
            { label: 'Preventive Care', value: 'preventive' },
            { label: 'Chronic Disease', value: 'chronic_disease' },
            { label: 'Behavioral Health', value: 'behavioral_health' },
          ],
        },
        {
          id: 'status',
          label: 'Compliance Status',
          type: 'select',
          options: [
            { label: 'Compliant', value: 'compliant' },
            { label: 'At Risk', value: 'at_risk' },
            { label: 'Non-Compliant', value: 'non_compliant' },
          ],
        },
        {
          id: 'period',
          label: 'Measurement Period',
          type: 'daterange',
        },
      ],
      onApply: (filters) => {
        this.filters = filters;
        this.loadMeasures();
      },
      onReset: () => {
        this.filters = {};
        this.loadMeasures();
      },
    });

    layout.appendChild(filterContainer);

    // Measures
    const measuresContainer = document.createElement('div');
    measuresContainer.id = 'measures-container';
    layout.appendChild(measuresContainer);

    this.container.appendChild(layout);
  }

  private async loadMeasures(): Promise<void> {
    try {
      const response = await analyticsService.getQualityMeasures(this.filters);
      this.measures = response.data || [];

      const container = this.container.querySelector('#measures-container') as HTMLElement;
      if (container) {
        container.innerHTML = '';
        new QualityMetrics(container, this.measures);
      }
    } catch (error) {
      console.error('Failed to load quality measures:', error);
    }
  }
}
