export class ARAgingReport {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  render(data: any): void {
    this.container.innerHTML = `
      <div class="ar-aging-report">
        <h3>A/R Aging Report</h3>
        <table>
          <thead><tr><th>Age</th><th>Count</th><th>Amount</th><th>%</th></tr></thead>
          <tbody>
            <tr><td>0-30</td><td>${data.current?.count || 0}</td><td>$${data.current?.amount || 0}</td><td>${data.current?.percentage || 0}%</td></tr>
            <tr><td>31-60</td><td>${data.thirty?.count || 0}</td><td>$${data.thirty?.amount || 0}</td><td>${data.thirty?.percentage || 0}%</td></tr>
            <tr><td>61-90</td><td>${data.sixty?.count || 0}</td><td>$${data.sixty?.amount || 0}</td><td>${data.sixty?.percentage || 0}%</td></tr>
            <tr><td>90+</td><td>${data.ninety?.count || 0}</td><td>$${data.ninety?.amount || 0}</td><td>${data.ninety?.percentage || 0}%</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
}
