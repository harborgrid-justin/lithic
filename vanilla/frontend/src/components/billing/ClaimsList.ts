/**
 * ClaimsList Component - Reusable claims list component
 */

export class ClaimsList {
  private container: HTMLElement;
  private claims: any[] = [];
  private onClaimClick?: (claimId: string) => void;

  constructor(
    container: HTMLElement,
    options?: { onClaimClick?: (claimId: string) => void },
  ) {
    this.container = container;
    this.onClaimClick = options?.onClaimClick;
  }

  render(claims: any[]): void {
    this.claims = claims;

    this.container.innerHTML = `
      <div class="claims-list-component">
        <table class="claims-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Patient</th>
              <th>Service Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${claims
              .map(
                (claim) => `
              <tr class="claim-row" data-claim-id="${claim.id}">
                <td><a href="#/billing/claims/${claim.id}">${claim.claimNumber}</a></td>
                <td>${claim.patientName}</td>
                <td>${new Date(claim.serviceDate).toLocaleDateString()}</td>
                <td>$${claim.totalCharge.toLocaleString()}</td>
                <td><span class="status-badge status-${claim.status}">${claim.status}</span></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (this.onClaimClick) {
      const rows = this.container.querySelectorAll(".claim-row");
      rows.forEach((row) => {
        row.addEventListener("click", (e) => {
          const claimId = (row as HTMLElement).dataset.claimId;
          if (claimId && this.onClaimClick) {
            this.onClaimClick(claimId);
          }
        });
      });
    }
  }
}
