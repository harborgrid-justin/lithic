/**
 * ClaimDetailPage - View and manage individual claim details
 */

import { BillingService } from '../../services/BillingService';

export class ClaimDetailPage {
  private container: HTMLElement;
  private billingService: BillingService;
  private claimId: string;

  constructor(container: HTMLElement, claimId: string) {
    this.container = container;
    this.billingService = new BillingService();
    this.claimId = claimId;
  }

  async render(): Promise<void> {
    try {
      const claim = await this.billingService.getClaimById(this.claimId);

      this.container.innerHTML = `
        <div class="claim-detail-page">
          <div class="page-header">
            <div>
              <h1>Claim ${claim.claimNumber}</h1>
              <span class="status-badge status-${claim.status}">${claim.status}</span>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" onclick="window.claimDetail.printClaim()">
                <i class="icon-print"></i> Print
              </button>
              ${claim.status === 'draft' ? `
                <button class="btn btn-primary" onclick="window.claimDetail.submitClaim()">
                  <i class="icon-send"></i> Submit Claim
                </button>
              ` : ''}
              ${claim.status === 'denied' ? `
                <button class="btn btn-primary" onclick="window.claimDetail.createAppeal()">
                  <i class="icon-appeal"></i> Create Appeal
                </button>
              ` : ''}
            </div>
          </div>

          <div class="claim-tabs">
            <button class="tab-btn active" data-tab="details">Details</button>
            <button class="tab-btn" data-tab="services">Services</button>
            <button class="tab-btn" data-tab="payments">Payments</button>
            <button class="tab-btn" data-tab="history">History</button>
          </div>

          <div class="tab-content active" id="details-tab">
            ${this.renderDetailsTab(claim)}
          </div>

          <div class="tab-content" id="services-tab">
            ${this.renderServicesTab(claim)}
          </div>

          <div class="tab-content" id="payments-tab">
            ${this.renderPaymentsTab(claim)}
          </div>

          <div class="tab-content" id="history-tab">
            <div id="historyContent">Loading...</div>
          </div>
        </div>
      `;

      this.attachEventListeners();
      this.loadHistory();
    } catch (error) {
      console.error('Error loading claim:', error);
      this.container.innerHTML = '<div class="alert alert-error">Failed to load claim</div>';
    }
  }

  private renderDetailsTab(claim: any): string {
    return `
      <div class="claim-details-grid">
        <div class="detail-section">
          <h3>Patient Information</h3>
          <div class="detail-row">
            <label>Name:</label>
            <span>${claim.patientName}</span>
          </div>
          <div class="detail-row">
            <label>DOB:</label>
            <span>${claim.patientDOB}</span>
          </div>
          <div class="detail-row">
            <label>Member ID:</label>
            <span>${claim.subscriberId}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Provider Information</h3>
          <div class="detail-row">
            <label>Provider:</label>
            <span>${claim.providerName}</span>
          </div>
          <div class="detail-row">
            <label>NPI:</label>
            <span>${claim.providerNPI}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Payer Information</h3>
          <div class="detail-row">
            <label>Payer:</label>
            <span>${claim.payerName}</span>
          </div>
          <div class="detail-row">
            <label>Filing Indicator:</label>
            <span>${claim.claimType}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Claim Dates</h3>
          <div class="detail-row">
            <label>Service Date:</label>
            <span>${claim.serviceDate}</span>
          </div>
          <div class="detail-row">
            <label>Submission Date:</label>
            <span>${claim.submissionDate || 'Not submitted'}</span>
          </div>
          ${claim.paymentDate ? `
            <div class="detail-row">
              <label>Payment Date:</label>
              <span>${claim.paymentDate}</span>
            </div>
          ` : ''}
        </div>

        <div class="detail-section full-width">
          <h3>Diagnosis Codes</h3>
          <div class="diagnosis-list">
            ${claim.diagnosisCodes.map((dx: any) => `
              <div class="diagnosis-item">
                <span class="dx-pointer">${dx.pointer}</span>
                <span class="dx-code">${dx.code}</span>
                <span class="dx-description">${dx.description}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="detail-section full-width">
          <h3>Claim Summary</h3>
          <table class="summary-table">
            <tr>
              <td>Total Charges:</td>
              <td class="currency">$${claim.totalCharge.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Allowed Amount:</td>
              <td class="currency">$${claim.totalAllowedAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Insurance Payment:</td>
              <td class="currency">$${claim.totalPaidAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Adjustments:</td>
              <td class="currency">$${claim.totalAdjustmentAmount.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td>Patient Responsibility:</td>
              <td class="currency">$${claim.totalPatientResponsibility.toLocaleString()}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  private renderServicesTab(claim: any): string {
    return `
      <table class="services-table">
        <thead>
          <tr>
            <th>Line</th>
            <th>Date</th>
            <th>Procedure Code</th>
            <th>Modifiers</th>
            <th>Diagnosis</th>
            <th>Units</th>
            <th>Charge</th>
            <th>Allowed</th>
            <th>Paid</th>
            <th>Adjustment</th>
            <th>Patient Resp.</th>
          </tr>
        </thead>
        <tbody>
          ${claim.lineItems.map((line: any) => `
            <tr>
              <td>${line.lineNumber}</td>
              <td>${line.serviceDate}</td>
              <td>${line.procedureCode}</td>
              <td>${line.modifiers.join(', ') || '-'}</td>
              <td>${line.diagnosisPointers.join(', ')}</td>
              <td>${line.units}</td>
              <td class="currency">$${line.charge.toLocaleString()}</td>
              <td class="currency">$${line.allowedAmount.toLocaleString()}</td>
              <td class="currency">$${line.paidAmount.toLocaleString()}</td>
              <td class="currency">$${line.adjustmentAmount.toLocaleString()}</td>
              <td class="currency">$${line.patientResponsibility.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${claim.adjustments && claim.adjustments.length > 0 ? `
        <div class="adjustments-section">
          <h3>Adjustments</h3>
          <table class="adjustments-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Group</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${claim.adjustments.map((adj: any) => `
                <tr>
                  <td>${adj.code}</td>
                  <td>${adj.groupCode}</td>
                  <td>${adj.description}</td>
                  <td class="currency">$${adj.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  }

  private renderPaymentsTab(claim: any): string {
    if (!claim.payments || claim.payments.length === 0) {
      return '<p class="no-data">No payments recorded</p>';
    }

    return `
      <table class="payments-table">
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Check/Reference #</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${claim.payments.map((payment: any) => `
            <tr>
              <td>${payment.paymentDate}</td>
              <td class="currency">$${payment.amount.toLocaleString()}</td>
              <td>${payment.method}</td>
              <td>${payment.checkNumber || '-'}</td>
              <td>
                <button class="btn-icon" onclick="window.claimDetail.viewPayment('${payment.id}')">
                  <i class="icon-eye"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private async loadHistory(): Promise<void> {
    try {
      const history = await this.billingService.getClaimHistory(this.claimId);
      const container = document.getElementById('historyContent');
      if (container) {
        container.innerHTML = `
          <div class="history-timeline">
            ${history.map((item: any) => `
              <div class="history-item">
                <div class="history-icon ${item.action}"></div>
                <div class="history-content">
                  <div class="history-action">${item.action}</div>
                  <div class="history-notes">${item.notes}</div>
                  <div class="history-meta">
                    ${item.performedBy} on ${new Date(item.performedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  private attachEventListeners(): void {
    const tabButtons = this.container.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).getAttribute('data-tab');
        this.switchTab(tab!);
      });
    });
  }

  private switchTab(tabName: string): void {
    // Remove active class from all tabs
    this.container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    this.container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    const tabBtn = this.container.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = this.container.querySelector(`#${tabName}-tab`);

    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
  }

  // Public methods
  public printClaim(): void {
    window.print();
  }

  public async submitClaim(): Promise<void> {
    if (confirm('Submit this claim?')) {
      try {
        await this.billingService.submitClaim(this.claimId);
        alert('Claim submitted successfully');
        window.location.reload();
      } catch (error) {
        alert('Failed to submit claim');
      }
    }
  }

  public createAppeal(): void {
    window.location.hash = `#/billing/claims/${this.claimId}/appeal`;
  }

  public viewPayment(paymentId: string): void {
    window.location.hash = `#/billing/payments/${paymentId}`;
  }
}

declare global {
  interface Window {
    claimDetail: ClaimDetailPage;
  }
}
