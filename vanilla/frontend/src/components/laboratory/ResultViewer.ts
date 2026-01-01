/**
 * Result Viewer Component
 * Displays laboratory test results
 */

export class ResultViewer {
  private container: HTMLElement;
  private results: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setResults(results: any[]): void {
    this.results = results;
    this.render();
  }

  private render(): void {
    if (this.results.length === 0) {
      this.container.innerHTML = '<p class="no-results">No results available</p>';
      return;
    }

    const html = `
      <div class="result-viewer">
        <table class="result-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Reference Range</th>
              <th>Flag</th>
              <th>Status</th>
              <th>Performed</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            ${this.results.map(result => this.renderResultRow(result)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = html;
  }

  private renderResultRow(result: any): string {
    const flagClass = this.getFlagClass(result.abnormalFlag);
    const criticalClass = result.critical ? 'critical-result' : '';

    return `
      <tr class="result-row ${criticalClass}">
        <td>
          <strong>${result.testName}</strong>
          ${result.critical ? '<span class="critical-badge">CRITICAL</span>' : ''}
        </td>
        <td class="result-value ${flagClass}">${result.value}</td>
        <td>${result.unit || '-'}</td>
        <td>${this.formatReferenceRange(result.referenceRange)}</td>
        <td>
          ${result.abnormalFlag && result.abnormalFlag !== 'N'
            ? `<span class="flag-badge ${flagClass}">${result.abnormalFlag}</span>`
            : '-'}
        </td>
        <td>
          <span class="status-badge status-${result.status}">${result.status}</span>
        </td>
        <td>${this.formatDateTime(result.performedDateTime)}</td>
        <td>
          ${result.verifiedDateTime
            ? `${this.formatDateTime(result.verifiedDateTime)}<br><small>${result.verifiedBy}</small>`
            : '-'}
        </td>
      </tr>
    `;
  }

  private getFlagClass(flag?: string): string {
    const classes: Record<string, string> = {
      L: 'flag-low',
      H: 'flag-high',
      LL: 'flag-critical-low',
      HH: 'flag-critical-high',
      A: 'flag-abnormal',
      N: ''
    };
    return flag ? classes[flag] || '' : '';
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

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
