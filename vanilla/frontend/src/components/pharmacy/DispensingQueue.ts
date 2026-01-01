/**
 * DispensingQueue.ts
 * Queue component for prescriptions ready to dispense
 */

export class DispensingQueue {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="dispensing-queue">
        <h3>Dispensing Queue</h3>
        <p>Queue of verified prescriptions ready for dispensing - Under Construction</p>
      </div>
    `;
  }
}
