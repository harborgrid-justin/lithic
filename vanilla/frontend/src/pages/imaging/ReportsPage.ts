import { ImagingService } from '../../services/ImagingService';

export class ReportsPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private currentFilters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
  }

  async render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'reports-page';
    wrapper.innerHTML = `
      <div class="page-header">
        <h1>Radiology Reports</h1>
        <button class="btn btn-primary" data-action="new-report">New Report</button>
      </div>

      <div class="filters-section">
        <div class="filters-group">
          <div class="filter-item">
            <label>Status</label>
            <select id="filter-status" class="form-select">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PRELIMINARY">Preliminary</option>
              <option value="FINAL">Final</option>
              <option value="AMENDED">Amended</option>
              <option value="CORRECTED">Corrected</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Report Type</label>
            <select id="filter-type" class="form-select">
              <option value="">All Types</option>
              <option value="PRELIMINARY">Preliminary</option>
              <option value="FINAL">Final</option>
              <option value="ADDENDUM">Addendum</option>
              <option value="CORRECTION">Correction</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Critical Only</label>
            <input type="checkbox" id="filter-critical" class="form-checkbox">
          </div>

          <div class="filter-item">
            <label>Start Date</label>
            <input type="date" id="filter-start-date" class="form-input">
          </div>

          <div class="filter-item">
            <label>End Date</label>
            <input type="date" id="filter-end-date" class="form-input">
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" data-action="apply-filters">Apply</button>
            <button class="btn btn-secondary" data-action="clear-filters">Clear</button>
          </div>
        </div>
      </div>

      <div class="reports-section">
        <div id="reports-container">
          <div class="loading">Loading reports...</div>
        </div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();
    await this.loadReports();
  }

  private attachEventListeners() {
    const newReportBtn = this.container.querySelector('[data-action="new-report"]');
    newReportBtn?.addEventListener('click', () => {
      window.location.href = '#/imaging/reports/new';
    });

    const applyFiltersBtn = this.container.querySelector('[data-action="apply-filters"]');
    applyFiltersBtn?.addEventListener('click', () => this.applyFilters());

    const clearFiltersBtn = this.container.querySelector('[data-action="clear-filters"]');
    clearFiltersBtn?.addEventListener('click', () => this.clearFilters());
  }

  private async loadReports() {
    try {
      const reports = await this.imagingService.getReports(this.currentFilters);
      this.renderReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      this.showError('Failed to load reports');
    }
  }

  private renderReports(reports: any) {
    const container = document.getElementById('reports-container');
    if (!container) return;

    if (!reports.data || reports.data.length === 0) {
      container.innerHTML = '<div class="empty-state">No reports found</div>';
      return;
    }

    container.innerHTML = `
      <div class="reports-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Study</th>
              <th>Radiologist</th>
              <th>Type</th>
              <th>Status</th>
              <th>Critical</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${reports.data.map((report: any) => this.createReportRow(report)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.attachReportActions();
  }

  private createReportRow(report: any): string {
    return `
      <tr data-report-id="${report.id}">
        <td>${this.formatDate(report.createdAt)}</td>
        <td>${report.patientName || 'N/A'}</td>
        <td>${report.studyDescription || report.modality || 'N/A'}</td>
        <td>${report.radiologistName}</td>
        <td><span class="badge badge-info">${report.reportType}</span></td>
        <td><span class="badge badge-${this.getStatusColor(report.status)}">${report.status}</span></td>
        <td>${report.criticalResult ? '<span class="badge badge-danger">Yes</span>' : 'No'}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="view" data-report-id="${report.id}">View</button>
          ${report.status === 'DRAFT' ? `
            <button class="btn btn-sm btn-secondary" data-action="edit" data-report-id="${report.id}">Edit</button>
          ` : ''}
          ${report.status === 'FINAL' ? `
            <button class="btn btn-sm btn-secondary" data-action="download" data-report-id="${report.id}">PDF</button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  private attachReportActions() {
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const reportId = target.dataset.reportId;

      if (!reportId) return;

      if (action === 'view') {
        window.location.href = `#/imaging/reports/${reportId}`;
      } else if (action === 'edit') {
        window.location.href = `#/imaging/reports/${reportId}/edit`;
      } else if (action === 'download') {
        await this.downloadReport(reportId);
      }
    });
  }

  private async downloadReport(reportId: string) {
    try {
      const pdf = await this.imagingService.downloadReportPDF(reportId);
      // Create download link
      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      this.showError('Failed to download report');
    }
  }

  private applyFilters() {
    const status = (document.getElementById('filter-status') as HTMLSelectElement)?.value;
    const type = (document.getElementById('filter-type') as HTMLSelectElement)?.value;
    const critical = (document.getElementById('filter-critical') as HTMLInputElement)?.checked;
    const startDate = (document.getElementById('filter-start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('filter-end-date') as HTMLInputElement)?.value;

    this.currentFilters = {
      ...(status && { status }),
      ...(type && { reportType: type }),
      ...(critical && { criticalOnly: 'true' }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };

    this.loadReports();
  }

  private clearFilters() {
    (document.getElementById('filter-status') as HTMLSelectElement).value = '';
    (document.getElementById('filter-type') as HTMLSelectElement).value = '';
    (document.getElementById('filter-critical') as HTMLInputElement).checked = false;
    (document.getElementById('filter-start-date') as HTMLInputElement).value = '';
    (document.getElementById('filter-end-date') as HTMLInputElement).value = '';

    this.currentFilters = {};
    this.loadReports();
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'DRAFT': 'secondary',
      'PRELIMINARY': 'info',
      'FINAL': 'success',
      'AMENDED': 'warning',
      'CORRECTED': 'warning',
    };
    return colors[status] || 'secondary';
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
