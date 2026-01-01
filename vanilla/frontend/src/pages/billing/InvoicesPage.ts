export class InvoicesPage {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="invoices-page">
        <h1>Patient Invoices</h1>
        <button class="btn btn-primary">Generate Invoices</button>
        <table class="invoices-table">
          <thead><tr><th>Invoice #</th><th>Patient</th><th>Date</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody id="invoicesBody"></tbody>
        </table>
      </div>
    `;
  }
}
