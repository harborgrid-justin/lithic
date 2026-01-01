import adminService from '../../services/AdminService';

/**
 * AuditLog Component
 * Displays and filters audit logs
 */
export class AuditLog {
  private container: HTMLElement;
  private logs: any[] = [];
  private filters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="audit-log">
        <div class="audit-log__header">
          <h3>Audit Logs</h3>
          <button id="export-logs-btn" class="btn btn--secondary">
            Export Logs
          </button>
        </div>

        <div class="audit-log__filters">
          <select id="filter-action" class="input">
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="PHI_ACCESSED">PHI Accessed</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
          </select>

          <select id="filter-severity" class="input">
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input type="checkbox" id="filter-phi" />
          <label for="filter-phi">PHI Access Only</label>

          <input type="date" id="filter-start-date" class="input" />
          <input type="date" id="filter-end-date" class="input" />

          <button id="apply-filters-btn" class="btn btn--primary">
            Apply Filters
          </button>
        </div>

        <div id="logs-table" class="audit-log__table">
          <div class="loading">Loading audit logs...</div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadLogs();
  }

  private attachEventListeners(): void {
    const applyBtn = document.getElementById('apply-filters-btn');
    const exportBtn = document.getElementById('export-logs-btn');

    applyBtn?.addEventListener('click', () => this.applyFilters());
    exportBtn?.addEventListener('click', () => this.exportLogs());
  }

  private applyFilters(): void {
    const action = (document.getElementById('filter-action') as HTMLSelectElement)?.value;
    const severity = (document.getElementById('filter-severity') as HTMLSelectElement)?.value;
    const phiOnly = (document.getElementById('filter-phi') as HTMLInputElement)?.checked;
    const startDate = (document.getElementById('filter-start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('filter-end-date') as HTMLInputElement)?.value;

    this.filters = {
      action: action || undefined,
      severity: severity || undefined,
      phiAccessed: phiOnly || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    this.loadLogs();
  }

  private async loadLogs(): Promise<void> {
    try {
      const response = await adminService.getAuditLogs({
        ...this.filters,
        limit: 100,
      });

      this.logs = response.logs;
      this.renderTable();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderTable(): void {
    const tableContainer = document.getElementById('logs-table');
    if (!tableContainer) return;

    if (this.logs.length === 0) {
      tableContainer.innerHTML = '<div class="empty-state">No audit logs found</div>';
      return;
    }

    const tableHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Status</th>
            <th>Severity</th>
            <th>PHI</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          ${this.logs.map((log) => this.renderLogRow(log)).join('')}
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = tableHTML;
  }

  private renderLogRow(log: any): string {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const severityMap: Record<string, string> = {
      low: 'info',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    const severity = (log.severity || 'low') as string;
    const severityClass = severityMap[severity];

    return `
      <tr class="audit-log-row ${log.status === 'failure' ? 'audit-log-row--failed' : ''}">
        <td>${timestamp}</td>
        <td>${log.userEmail || log.userId}</td>
        <td>${log.action}</td>
        <td>${log.resourceType}${log.resourceId ? `:${log.resourceId}` : ''}</td>
        <td>
          <span class="badge badge--${log.status === 'success' ? 'success' : 'danger'}">
            ${log.status}
          </span>
        </td>
        <td>
          <span class="badge badge--${severityClass}">
            ${log.severity || 'low'}
          </span>
        </td>
        <td>
          ${log.phiAccessed ? '<span class="badge badge--warning">Yes</span>' : 'No'}
        </td>
        <td>${log.ipAddress || 'N/A'}</td>
      </tr>
    `;
  }

  private async exportLogs(): Promise<void> {
    try {
      const startDate = (document.getElementById('filter-start-date') as HTMLInputElement)?.value;
      const endDate = (document.getElementById('filter-end-date') as HTMLInputElement)?.value;

      if (!startDate || !endDate) {
        alert('Please select start and end dates for export');
        return;
      }

      const blob = await adminService.exportAuditLogs(startDate, endDate, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    }
  }

  private showError(message: string): void {
    const tableContainer = document.getElementById('logs-table');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="error-state">
          <p>Error: ${message}</p>
        </div>
      `;
    }
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
