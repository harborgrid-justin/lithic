/**
 * RefillManager.ts
 * Refill request management component
 */

export class RefillManager {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="refill-manager">
        <h3>Refill Manager</h3>
        <p>Manage refill requests with NCPDP messaging - Under Construction</p>
      </div>
    `;
  }
}
