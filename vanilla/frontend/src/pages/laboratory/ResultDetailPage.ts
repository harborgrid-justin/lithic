/**
 * Result Detail Page
 * View detailed result and trend analysis
 */

import { labService } from '../../services/LaboratoryService';
import { TrendChart } from '../../components/laboratory/TrendChart';
import { LabReport } from '../../components/laboratory/LabReport';

export class ResultDetailPage {
  private container: HTMLElement;
  private resultId: string;
  private trendChart: TrendChart | null = null;
  private labReport: LabReport | null = null;

  constructor(container: HTMLElement, resultId: string) {
    this.container = container;
    this.resultId = resultId;
  }

  async render(): Promise<void> {
    const html = `
      <div class="result-detail-page">
        <div class="page-header">
          <button type="button" class="btn-back" id="backBtn">← Back</button>
          <h1>Result Details</h1>
          <div class="header-actions">
            <button type="button" class="btn btn-secondary" id="verifyBtn">Verify Result</button>
            <button type="button" class="btn btn-secondary" id="printBtn">Print</button>
          </div>
        </div>

        <div id="resultContent">Loading...</div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadResult();
    this.attachEventListeners();
  }

  private async loadResult(): Promise<void> {
    try {
      // In real implementation, would have endpoint to get single result
      // For now, we'll simulate with search
      const results = await labService.searchResults({});
      const result = results.find((r: any) => r.id === this.resultId);

      if (!result) {
        throw new Error('Result not found');
      }

      const order = await labService.getOrder(result.orderId);

      // Get historical results for trend
      const historicalResults = await labService.searchResults({
        patientId: order.patientId,
        loincCode: result.loincCode
      });

      const resultContent = this.container.querySelector('#resultContent');
      if (resultContent) {
        resultContent.innerHTML = this.renderResultContent(result, order);
        this.initializeComponents(result, historicalResults);
      }
    } catch (error) {
      console.error('Error loading result:', error);
      const resultContent = this.container.querySelector('#resultContent');
      if (resultContent) {
        resultContent.innerHTML = '<p class="error">Error loading result details</p>';
      }
    }
  }

  private renderResultContent(result: any, order: any): string {
    return `
      <div class="result-details">
        <div class="detail-section">
          <h2>Test Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Test Name:</span>
              <span class="value">${result.testName}</span>
            </div>
            <div class="detail-item">
              <span class="label">LOINC Code:</span>
              <span class="value">${result.loincCode}</span>
            </div>
            <div class="detail-item">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status-badge status-${result.status}">${result.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section ${result.critical ? 'critical-result-section' : ''}">
          <h2>Result Value ${result.critical ? '<span class="critical-badge">CRITICAL</span>' : ''}</h2>
          <div class="result-display">
            <div class="result-value-large">${result.value} ${result.unit || ''}</div>
            ${result.abnormalFlag && result.abnormalFlag !== 'N' ? `
              <div class="abnormal-flag">${result.abnormalFlag}</div>
            ` : ''}
          </div>
          <div class="reference-info">
            <strong>Reference Range:</strong> ${this.formatReferenceRange(result.referenceRange)}
          </div>
        </div>

        <div class="detail-section">
          <h2>Patient Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Name:</span>
              <span class="value">${order.patientName}</span>
            </div>
            <div class="detail-item">
              <span class="label">MRN:</span>
              <span class="value">${order.patientMRN}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2>Timing Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Performed:</span>
              <span class="value">${this.formatDateTime(result.performedDateTime)}</span>
            </div>
            <div class="detail-item">
              <span class="label">Performed By:</span>
              <span class="value">${result.performedBy || '-'}</span>
            </div>
            ${result.verifiedDateTime ? `
              <div class="detail-item">
                <span class="label">Verified:</span>
                <span class="value">${this.formatDateTime(result.verifiedDateTime)}</span>
              </div>
              <div class="detail-item">
                <span class="label">Verified By:</span>
                <span class="value">${result.verifiedBy || '-'}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${result.instrument || result.method ? `
          <div class="detail-section">
            <h2>Technical Information</h2>
            <div class="detail-grid">
              ${result.instrument ? `
                <div class="detail-item">
                  <span class="label">Instrument:</span>
                  <span class="value">${result.instrument}</span>
                </div>
              ` : ''}
              ${result.method ? `
                <div class="detail-item">
                  <span class="label">Method:</span>
                  <span class="value">${result.method}</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${result.comments ? `
          <div class="detail-section">
            <h2>Comments</h2>
            <p>${result.comments}</p>
          </div>
        ` : ''}

        <div class="detail-section">
          <h2>Trend Analysis</h2>
          <div id="trendChartContainer"></div>
        </div>
      </div>
    `;
  }

  private initializeComponents(result: any, historicalResults: any[]): void {
    const trendContainer = this.container.querySelector('#trendChartContainer');
    if (trendContainer && historicalResults.length > 0) {
      this.trendChart = new TrendChart(trendContainer as HTMLElement);
      this.trendChart.setData(historicalResults, result.testName);
    }
  }

  private formatReferenceRange(range?: any): string {
    if (!range) return 'N/A';
    if (range.text) return range.text;
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} - ${range.max}`;
    }
    if (range.max !== undefined) return `< ${range.max}`;
    if (range.min !== undefined) return `> ${range.min}`;
    return 'N/A';
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

  private attachEventListeners(): void {
    const backBtn = this.container.querySelector('#backBtn');
    const verifyBtn = this.container.querySelector('#verifyBtn');
    const printBtn = this.container.querySelector('#printBtn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => this.handleVerify());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  private async handleVerify(): Promise<void> {
    const verifiedBy = prompt('Enter your name to verify this result:');
    if (!verifiedBy) return;

    try {
      await labService.verifyResult(this.resultId, verifiedBy);
      alert('Result verified successfully');
      this.loadResult();
    } catch (error) {
      console.error('Error verifying result:', error);
      alert('Error verifying result');
    }
  }

  destroy(): void {
    if (this.trendChart) {
      this.trendChart.destroy();
    }
    if (this.labReport) {
      this.labReport.destroy();
    }
    this.container.innerHTML = '';
  }
}
