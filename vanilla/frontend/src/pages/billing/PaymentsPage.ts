export class PaymentsPage {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="payments-page">
        <h1>Payment Posting</h1>
        <div class="filters">
          <input type="text" placeholder="Search payments..." />
          <select><option>All Types</option><option>Insurance</option><option>Patient</option></select>
        </div>
        <table class="payments-table">
          <thead><tr><th>Date</th><th>Patient</th><th>Claim</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
          <tbody id="paymentsBody"></tbody>
        </table>
      </div>
    `;
  }
}
