/**
 * ClaimDetail Component - Display claim details
 */

export class ClaimDetail {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(claim: any): void {
    this.container.innerHTML = `
      <div class="claim-detail-component">
        <h2>Claim ${claim.claimNumber}</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Patient:</label>
            <span>${claim.patientName}</span>
          </div>
          <div class="detail-item">
            <label>Service Date:</label>
            <span>${new Date(claim.serviceDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-item">
            <label>Total Charge:</label>
            <span>$${claim.totalCharge.toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-badge status-${claim.status}">${claim.status}</span>
          </div>
        </div>
        <div class="line-items">
          <h3>Service Lines</h3>
          <table>
            <thead><tr><th>Code</th><th>Description</th><th>Charge</th></tr></thead>
            <tbody>
              ${(claim.lineItems || []).map((item: any) => `
                <tr>
                  <td>${item.procedureCode}</td>
                  <td>${item.description || '-'}</td>
                  <td>$${item.charge.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
