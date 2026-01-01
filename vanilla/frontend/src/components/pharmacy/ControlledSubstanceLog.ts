/**
 * ControlledSubstanceLog.ts
 * DEA controlled substance logging component
 */

export class ControlledSubstanceLog {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="controlled-substance-log">
        <h3>Controlled Substance Log</h3>
        <p>DEA Schedule II-V controlled substance perpetual inventory log - Under Construction</p>
      </div>
    `;
  }
}
