export class DenialManager {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  render(denials: any[]): void {
    this.container.innerHTML = `
      <div class="denial-manager">
        <h3>Manage Denials</h3>
        <table>
          <thead><tr><th>Claim</th><th>Reason</th><th>Amount</th><th>Action</th></tr></thead>
          <tbody>
            ${denials
              .map(
                (d) => `
              <tr>
                <td>${d.claimNumber}</td>
                <td>${d.reason}</td>
                <td>$${d.amount}</td>
                <td><button class="btn btn-sm">Appeal</button></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }
}
