/**
 * ClaimsListPage - Display and manage all claims
 */

import { BillingService } from '../../services/BillingService';

export class ClaimsListPage {
  private container: HTMLElement;
  private billingService: BillingService;
  private currentPage: number = 1;
  private pageSize: number = 20;
  private filters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.billingService = new BillingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="claims-list-page">
        <div class="page-header">
          <h1>Claims Management</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="newClaimBtn">
              <i class="icon-plus"></i> New Claim
            </button>
            <button class="btn btn-secondary" id="batchSubmitBtn">
              <i class="icon-send"></i> Batch Submit
            </button>
          </div>
        </div>

        <div class="filters-section">
          <div class="filter-row">
            <div class="filter-group">
              <label>Search</label>
              <input type="text" id="searchInput" placeholder="Claim #, Patient name..." />
            </div>

            <div class="filter-group">
              <label>Status</label>
              <select id="statusFilter">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready to Submit</option>
                <option value="submitted">Submitted</option>
                <option value="accepted">Accepted</option>
                <option value="paid">Paid</option>
                <option value="denied">Denied</option>
                <option value="appealed">Appealed</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Payer</label>
              <select id="payerFilter">
                <option value="">All Payers</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Provider</label>
              <select id="providerFilter">
                <option value="">All Providers</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Date Range</label>
              <div class="date-range">
                <input type="date" id="startDate" />
                <span>to</span>
                <input type="date" id="endDate" />
              </div>
            </div>

            <div class="filter-actions">
              <button class="btn btn-secondary" id="applyFiltersBtn">Apply</button>
              <button class="btn btn-text" id="clearFiltersBtn">Clear</button>
            </div>
          </div>
        </div>

        <div class="claims-summary" id="claimsSummary"></div>

        <div class="table-container">
          <table class="claims-table" id="claimsTable">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAll" /></th>
                <th>Claim #</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Payer</th>
                <th>Service Date</th>
                <th>Charge</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="claimsTableBody">
              <tr>
                <td colspan="11" class="loading">
                  <div class="spinner"></div>
                  Loading claims...
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="paginationContainer"></div>
      </div>
    `;

    await this.loadClaims();
    await this.loadFilterOptions();
    this.attachEventListeners();
  }

  private async loadClaims(): Promise<void> {
    try {
      const response = await this.billingService.getClaims({
        page: this.currentPage,
        limit: this.pageSize,
        ...this.filters
      });

      this.renderClaims(response.data);
      this.renderSummary(response.summary);
      this.renderPagination(response.pagination);
    } catch (error) {
      console.error('Error loading claims:', error);
      this.showError('Failed to load claims');
    }
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const [payers, providers] = await Promise.all([
        this.billingService.getPayers(),
        this.billingService.getProviders()
      ]);

      const payerFilter = document.getElementById('payerFilter') as HTMLSelectElement;
      if (payerFilter) {
        payers.forEach((payer: any) => {
          const option = document.createElement('option');
          option.value = payer.id;
          option.textContent = payer.name;
          payerFilter.appendChild(option);
        });
      }

      const providerFilter = document.getElementById('providerFilter') as HTMLSelectElement;
      if (providerFilter) {
        providers.forEach((provider: any) => {
          const option = document.createElement('option');
          option.value = provider.id;
          option.textContent = provider.name;
          providerFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  private renderClaims(claims: any[]): void {
    const tbody = document.getElementById('claimsTableBody');
    if (!tbody) return;

    if (claims.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="no-data">
            No claims found. Try adjusting your filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = claims.map(claim => `
      <tr data-claim-id="${claim.id}">
        <td>
          <input type="checkbox" class="claim-checkbox" value="${claim.id}" />
        </td>
        <td>
          <a href="#/billing/claims/${claim.id}" class="claim-link">
            ${claim.claimNumber}
          </a>
        </td>
        <td>${claim.patientName}</td>
        <td>${claim.providerName}</td>
        <td>${claim.payerName}</td>
        <td>${this.formatDate(claim.serviceDate)}</td>
        <td class="currency">$${claim.totalCharge.toLocaleString()}</td>
        <td class="currency">$${claim.paidAmount.toLocaleString()}</td>
        <td class="currency">$${(claim.totalCharge - claim.paidAmount).toLocaleString()}</td>
        <td>
          <span class="status-badge status-${claim.status}">${this.formatStatus(claim.status)}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.claimsList.viewClaim('${claim.id}')" title="View">
              <i class="icon-eye"></i>
            </button>
            ${this.renderActionButtons(claim)}
          </div>
        </td>
      </tr>
    `).join('');
  }

  private renderActionButtons(claim: any): string {
    let buttons = '';

    if (claim.status === 'draft' || claim.status === 'ready') {
      buttons += `
        <button class="btn-icon" onclick="window.claimsList.editClaim('${claim.id}')" title="Edit">
          <i class="icon-edit"></i>
        </button>
        <button class="btn-icon" onclick="window.claimsList.submitClaim('${claim.id}')" title="Submit">
          <i class="icon-send"></i>
        </button>
      `;
    }

    if (claim.status === 'denied') {
      buttons += `
        <button class="btn-icon" onclick="window.claimsList.createAppeal('${claim.id}')" title="Appeal">
          <i class="icon-appeal"></i>
        </button>
      `;
    }

    if (claim.status === 'paid') {
      buttons += `
        <button class="btn-icon" onclick="window.claimsList.printClaim('${claim.id}')" title="Print">
          <i class="icon-print"></i>
        </button>
      `;
    }

    return buttons;
  }

  private renderSummary(summary: any): void {
    const container = document.getElementById('claimsSummary');
    if (!container) return;

    container.innerHTML = `
      <div class="summary-stats">
        <div class="summary-stat">
          <span class="summary-label">Total Claims:</span>
          <span class="summary-value">${summary.total}</span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Total Charges:</span>
          <span class="summary-value">$${summary.totalCharges.toLocaleString()}</span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Total Paid:</span>
          <span class="summary-value">$${summary.totalPaid.toLocaleString()}</span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Outstanding:</span>
          <span class="summary-value">$${summary.totalOutstanding.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  private renderPagination(pagination: any): void {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    // Previous button
    pages.push(`
      <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''}
        onclick="window.claimsList.goToPage(${currentPage - 1})">
        Previous
      </button>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(`
          <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
            onclick="window.claimsList.goToPage(${i})">
            ${i}
          </button>
        `);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages.push('<span class="pagination-ellipsis">...</span>');
      }
    }

    // Next button
    pages.push(`
      <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}
        onclick="window.claimsList.goToPage(${currentPage + 1})">
        Next
      </button>
    `);

    container.innerHTML = `
      <div class="pagination-info">
        Showing ${((currentPage - 1) * this.pageSize) + 1} -
        ${Math.min(currentPage * this.pageSize, pagination.total)} of ${pagination.total}
      </div>
      <div class="pagination-buttons">
        ${pages.join('')}
      </div>
    `;
  }

  private attachEventListeners(): void {
    // New claim button
    const newClaimBtn = document.getElementById('newClaimBtn');
    if (newClaimBtn) {
      newClaimBtn.addEventListener('click', () => {
        window.location.hash = '#/billing/claims/new';
      });
    }

    // Batch submit button
    const batchSubmitBtn = document.getElementById('batchSubmitBtn');
    if (batchSubmitBtn) {
      batchSubmitBtn.addEventListener('click', () => {
        this.handleBatchSubmit();
      });
    }

    // Apply filters
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Search input
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      let searchTimeout: NodeJS.Timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.applyFilters();
        }, 500);
      });
    }

    // Select all checkbox
    const selectAll = document.getElementById('selectAll') as HTMLInputElement;
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.claim-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(cb => {
          cb.checked = (e.target as HTMLInputElement).checked;
        });
      });
    }
  }

  private applyFilters(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;
    const payerFilter = document.getElementById('payerFilter') as HTMLSelectElement;
    const providerFilter = document.getElementById('providerFilter') as HTMLSelectElement;
    const startDate = document.getElementById('startDate') as HTMLInputElement;
    const endDate = document.getElementById('endDate') as HTMLInputElement;

    this.filters = {
      search: searchInput?.value || '',
      status: statusFilter?.value || '',
      payerId: payerFilter?.value || '',
      providerId: providerFilter?.value || '',
      startDate: startDate?.value || '',
      endDate: endDate?.value || ''
    };

    this.currentPage = 1;
    this.loadClaims();
  }

  private clearFilters(): void {
    (document.getElementById('searchInput') as HTMLInputElement).value = '';
    (document.getElementById('statusFilter') as HTMLSelectElement).value = '';
    (document.getElementById('payerFilter') as HTMLSelectElement).value = '';
    (document.getElementById('providerFilter') as HTMLSelectElement).value = '';
    (document.getElementById('startDate') as HTMLInputElement).value = '';
    (document.getElementById('endDate') as HTMLInputElement).value = '';

    this.filters = {};
    this.currentPage = 1;
    this.loadClaims();
  }

  private async handleBatchSubmit(): Promise<void> {
    const selectedClaims = this.getSelectedClaims();

    if (selectedClaims.length === 0) {
      alert('Please select claims to submit');
      return;
    }

    if (confirm(`Submit ${selectedClaims.length} claim(s)?`)) {
      try {
        const result = await this.billingService.submitBatchClaims({
          claimIds: selectedClaims,
          submissionMethod: 'electronic'
        });

        alert(`Successfully submitted ${result.totalSubmitted} claims`);
        this.loadClaims();
      } catch (error) {
        console.error('Error submitting batch claims:', error);
        alert('Failed to submit claims');
      }
    }
  }

  private getSelectedClaims(): string[] {
    const checkboxes = document.querySelectorAll('.claim-checkbox:checked') as NodeListOf<HTMLInputElement>;
    return Array.from(checkboxes).map(cb => cb.value);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  private formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private showError(message: string): void {
    const container = this.container.querySelector('.claims-list-page');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.textContent = message;
      container.insertBefore(errorDiv, container.firstChild);
    }
  }

  // Public methods for global access
  public goToPage(page: number): void {
    this.currentPage = page;
    this.loadClaims();
  }

  public viewClaim(claimId: string): void {
    window.location.hash = `#/billing/claims/${claimId}`;
  }

  public editClaim(claimId: string): void {
    window.location.hash = `#/billing/claims/${claimId}/edit`;
  }

  public async submitClaim(claimId: string): Promise<void> {
    if (confirm('Submit this claim?')) {
      try {
        await this.billingService.submitClaim(claimId);
        alert('Claim submitted successfully');
        this.loadClaims();
      } catch (error) {
        console.error('Error submitting claim:', error);
        alert('Failed to submit claim');
      }
    }
  }

  public createAppeal(claimId: string): void {
    window.location.hash = `#/billing/claims/${claimId}/appeal`;
  }

  public printClaim(claimId: string): void {
    window.open(`/api/billing/claims/${claimId}/print`, '_blank');
  }
}

// Make instance globally available
declare global {
  interface Window {
    claimsList: ClaimsListPage;
  }
}
