export class DenialsPage {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="denials-page">
        <h1>Denials Management</h1>
        <div class="denials-stats">
          <div class="stat-card"><h3>Total Denials</h3><p>45</p></div>
          <div class="stat-card"><h3>Denial Rate</h3><p>8.2%</p></div>
          <div class="stat-card"><h3>Appealed</h3><p>12</p></div>
        </div>
        <table class="denials-table">
          <thead><tr><th>Claim #</th><th>Patient</th><th>Denial Reason</th><th>Amount</th><th>Action</th></tr></thead>
          <tbody id="denialsBody"></tbody>
        </table>
      </div>
    `;
  }
}
