/**
 * NewPrescriptionPage.ts
 * Form to create a new prescription
 */

export class NewPrescriptionPage {
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }

  init(): void {
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="new-prescription-page">
        <h1>New Prescription</h1>
        <p>New prescription form - Under Construction</p>
        <p>Features: Drug search, interaction checking, formulary verification, controlled substance validation</p>
      </div>
      <style>
        .new-prescription-page { padding: 20px; max-width: 1200px; margin: 0 auto; }
      </style>
    `;
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
