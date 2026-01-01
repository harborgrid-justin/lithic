/**
 * Lab Report Component
 * Generate printable laboratory reports
 */

export class LabReport {
  private container: HTMLElement;
  private order: any;
  private results: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setData(order: any, results: any[]): void {
    this.order = order;
    this.results = results;
    this.render();
  }

  private render(): void {
    if (!this.order) {
      this.container.innerHTML = '<p>No order data available</p>';
      return;
    }

    const html = `
      <div class="lab-report">
        <div class="report-actions">
          <button type="button" class="btn btn-primary" id="printBtn">Print Report</button>
          <button type="button" class="btn btn-secondary" id="downloadBtn">Download PDF</button>
        </div>

        <div class="report-content" id="reportContent">
          <div class="report-header">
            <div class="facility-info">
              <h2>LITHIC HEALTHCARE LABORATORY</h2>
              <p>Laboratory Information System</p>
            </div>
            <div class="report-meta">
              <div><strong>Report Date:</strong> ${this.formatDateTime(new Date())}</div>
              <div><strong>Order #:</strong> ${this.order.orderNumber}</div>
            </div>
          </div>

          <div class="report-section">
            <h3>Patient Information</h3>
            <div class="info-grid">
              <div><strong>Name:</strong> ${this.order.patientName}</div>
              <div><strong>MRN:</strong> ${this.order.patientMRN}</div>
              <div><strong>Patient ID:</strong> ${this.order.patientId}</div>
            </div>
          </div>

          <div class="report-section">
            <h3>Order Information</h3>
            <div class="info-grid">
              <div><strong>Ordering Provider:</strong> ${this.order.orderingProviderName}</div>
              <div><strong>Order Date:</strong> ${this.formatDateTime(this.order.orderDateTime)}</div>
              <div><strong>Priority:</strong> ${this.order.priority.toUpperCase()}</div>
              <div><strong>Status:</strong> ${this.formatStatus(this.order.status)}</div>
            </div>
            ${this.order.clinicalInfo ? `
              <div class="clinical-info">
                <strong>Clinical Information:</strong>
                <p>${this.order.clinicalInfo}</p>
              </div>
            ` : ''}
            ${this.order.diagnosis ? `
              <div class="diagnosis">
                <strong>Diagnosis:</strong>
                <p>${this.order.diagnosis}</p>
              </div>
            ` : ''}
          </div>

          <div class="report-section">
            <h3>Laboratory Results</h3>
            ${this.results.length > 0 ? this.renderResultsTable() : '<p>No results available</p>'}
          </div>

          ${this.hasAbnormalResults() ? `
            <div class="report-section abnormal-section">
              <h3>Abnormal Results Summary</h3>
              ${this.renderAbnormalSummary()}
            </div>
          ` : ''}

          ${this.hasCriticalResults() ? `
            <div class="report-section critical-section">
              <h3>Critical Results</h3>
              <div class="critical-alert">
                <strong>IMMEDIATE ATTENTION REQUIRED</strong>
                ${this.renderCriticalResults()}
              </div>
            </div>
          ` : ''}

          <div class="report-footer">
            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div>Laboratory Director</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div>Date</div>
              </div>
            </div>
            <div class="disclaimer">
              <p><small>This report contains confidential patient information. Results should be interpreted by a qualified healthcare provider.</small></p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderResultsTable(): string {
    return `
      <table class="results-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Reference Range</th>
            <th>Flag</th>
            <th>Performed</th>
          </tr>
        </thead>
        <tbody>
          ${this.results.map(result => this.renderResultRow(result)).join('')}
        </tbody>
      </table>
    `;
  }

  private renderResultRow(result: any): string {
    const flagClass = result.abnormalFlag && result.abnormalFlag !== 'N' ? 'abnormal' : '';
    const criticalClass = result.critical ? 'critical' : '';

    return `
      <tr class="${flagClass} ${criticalClass}">
        <td><strong>${result.testName}</strong></td>
        <td class="result-value">${result.value}${result.critical ? ' <span class="critical-badge">!</span>' : ''}</td>
        <td>${result.unit || '-'}</td>
        <td>${this.formatReferenceRange(result.referenceRange)}</td>
        <td>${result.abnormalFlag && result.abnormalFlag !== 'N' ? result.abnormalFlag : '-'}</td>
        <td>${this.formatDateTime(result.performedDateTime)}</td>
      </tr>
    `;
  }

  private renderAbnormalSummary(): string {
    const abnormalResults = this.results.filter(r =>
      r.abnormalFlag && r.abnormalFlag !== 'N' && !r.critical
    );

    return `
      <ul class="abnormal-list">
        ${abnormalResults.map(result => `
          <li>
            <strong>${result.testName}:</strong>
            ${result.value} ${result.unit || ''} (${this.formatReferenceRange(result.referenceRange)})
            <span class="flag">${result.abnormalFlag}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  private renderCriticalResults(): string {
    const criticalResults = this.results.filter(r => r.critical);

    return `
      <ul class="critical-list">
        ${criticalResults.map(result => `
          <li>
            <strong>${result.testName}:</strong>
            ${result.value} ${result.unit || ''} (${this.formatReferenceRange(result.referenceRange)})
          </li>
        `).join('')}
      </ul>
    `;
  }

  private hasAbnormalResults(): boolean {
    return this.results.some(r => r.abnormalFlag && r.abnormalFlag !== 'N' && !r.critical);
  }

  private hasCriticalResults(): boolean {
    return this.results.some(r => r.critical);
  }

  private formatStatus(status: string): string {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatReferenceRange(range?: any): string {
    if (!range) return '-';
    if (range.text) return range.text;
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} - ${range.max}`;
    }
    if (range.max !== undefined) return `< ${range.max}`;
    if (range.min !== undefined) return `> ${range.min}`;
    return '-';
  }

  private attachEventListeners(): void {
    const printBtn = this.container.querySelector('#printBtn');
    const downloadBtn = this.container.querySelector('#downloadBtn');

    if (printBtn) {
      printBtn.addEventListener('click', () => this.print());
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.download());
    }
  }

  private print(): void {
    const reportContent = this.container.querySelector('#reportContent');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Lab Report - ${this.order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .report-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .facility-info h2 { margin: 0; }
            .report-section { margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .results-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .results-table th, .results-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .results-table th { background: #f5f5f5; }
            .abnormal { background: #fff3cd; }
            .critical { background: #f8d7da; font-weight: bold; }
            .critical-badge { color: red; font-weight: bold; }
            .report-footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            .signatures { display: flex; gap: 40px; margin: 20px 0; }
            .signature-line { border-bottom: 1px solid #000; width: 200px; margin-bottom: 5px; }
            @media print { .btn { display: none; } }
          </style>
        </head>
        <body>
          ${reportContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  }

  private download(): void {
    // In a real implementation, this would generate a PDF
    alert('PDF download functionality would be implemented here using a library like jsPDF');
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
