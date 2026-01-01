export class RevenueChart {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  render(data: any[]): void {
    const maxValue = Math.max(...data.map((d) => d.amount));
    this.container.innerHTML = `
      <div class="revenue-chart">
        <h3>Revenue Trend</h3>
        <div class="chart">
          ${data
            .map(
              (item) => `
            <div class="bar" style="height: ${(item.amount / maxValue) * 200}px">
              <span class="label">${item.month}</span>
              <span class="value">$${(item.amount / 1000).toFixed(1)}K</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }
}
