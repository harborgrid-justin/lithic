export class ReportsPage {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="reports-page">
        <h1>Billing Reports</h1>
        <div class="report-categories">
          <button class="report-btn">Revenue Analysis</button>
          <button class="report-btn">A/R Aging</button>
          <button class="report-btn">Payer Performance</button>
          <button class="report-btn">Collection Rate</button>
          <button class="report-btn">Denial Analysis</button>
          <button class="report-btn">Provider Productivity</button>
        </div>
        <div id="reportContent"></div>
      </div>
    `;
  }
}
