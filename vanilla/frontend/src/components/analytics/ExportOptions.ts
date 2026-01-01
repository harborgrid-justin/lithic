/**
 * ExportOptions - Export configuration component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts?: boolean;
  includeRawData?: boolean;
  columns?: string[];
}

export interface ExportOptionsConfig {
  availableFormats: Array<{ value: string; label: string }>;
  onExport: (config: ExportConfig) => void;
}

export class ExportOptions {
  private container: HTMLElement;
  private config: ExportOptionsConfig;
  private exportConfig: ExportConfig = { format: 'pdf' };

  constructor(container: HTMLElement, config: ExportOptionsConfig) {
    this.container = container;
    this.config = config;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Export Options';
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 16px; font-weight: 600;';
    panel.appendChild(title);

    // Format selection
    const formatGroup = this.createFormatSelection();
    panel.appendChild(formatGroup);

    // Options
    const optionsGroup = this.createOptions();
    panel.appendChild(optionsGroup);

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
    `;

    exportBtn.addEventListener('click', () => this.config.onExport(this.exportConfig));
    panel.appendChild(exportBtn);

    this.container.appendChild(panel);
  }

  private createFormatSelection(): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';

    const label = document.createElement('label');
    label.textContent = 'Format';
    label.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500;';

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    `;

    this.config.availableFormats.forEach((format) => {
      const option = document.createElement('option');
      option.value = format.value;
      option.textContent = format.label;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.exportConfig.format = (e.target as HTMLSelectElement).value as any;
    });

    group.appendChild(label);
    group.appendChild(select);
    return group;
  }

  private createOptions(): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';

    const options = [
      { key: 'includeCharts', label: 'Include Charts' },
      { key: 'includeRawData', label: 'Include Raw Data' },
    ];

    options.forEach((opt) => {
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.marginRight = '8px';

      checkbox.addEventListener('change', (e) => {
        (this.exportConfig as any)[opt.key] = (e.target as HTMLInputElement).checked;
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(opt.label));
      group.appendChild(label);
    });

    return group;
  }
}
