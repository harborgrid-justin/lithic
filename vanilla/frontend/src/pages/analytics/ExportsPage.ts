/**
 * Exports Page - Data export management
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { DataTable } from '../../components/analytics/DataTable';
import { ExportOptions } from '../../components/analytics/ExportOptions';
import { analyticsService } from '../../services/AnalyticsService';

export class ExportsPage {
  private container: HTMLElement;
  private exports: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadExports();
    this.render();
  }

  private async loadExports(): Promise<void> {
    try {
      const response = await analyticsService.getExportJobs();
      this.exports = response.data || [];
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.padding = '24px';

    const title = document.createElement('h1');
    title.textContent = 'Data Exports';
    title.style.margin = '0 0 24px 0';
    this.container.appendChild(title);

    // Export options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.marginBottom = '24px';

    new ExportOptions(optionsContainer, {
      availableFormats: [
        { value: 'pdf', label: 'PDF' },
        { value: 'excel', label: 'Excel' },
        { value: 'csv', label: 'CSV' },
        { value: 'json', label: 'JSON' },
      ],
      onExport: async (config) => {
        try {
          await analyticsService.createExport({
            type: 'dataset',
            sourceId: 'current',
            sourceName: 'Data Export',
            format: config.format,
            parameters: config,
          });
          alert('Export started');
          await this.loadExports();
          this.render();
        } catch (error) {
          console.error('Export failed:', error);
        }
      },
    });

    this.container.appendChild(optionsContainer);

    // Exports table
    const tableTitle = document.createElement('h2');
    tableTitle.textContent = 'Export History';
    tableTitle.style.margin = '0 0 16px 0';
    this.container.appendChild(tableTitle);

    const tableContainer = document.createElement('div');
    new DataTable(tableContainer, {
      columns: [
        { key: 'sourceName', label: 'Export Name' },
        { key: 'format', label: 'Format' },
        { key: 'status', label: 'Status' },
        {
          key: 'createdAt',
          label: 'Created',
          formatter: (v) => new Date(v).toLocaleString(),
        },
      ],
      data: this.exports,
    });

    this.container.appendChild(tableContainer);
  }
}
