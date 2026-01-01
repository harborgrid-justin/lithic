/**
 * MedicationLabel.ts
 * Prescription label generation component
 */

export class MedicationLabel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="medication-label">
        <h3>Medication Label</h3>
        <p>Generate and print prescription labels with barcode - Under Construction</p>
      </div>
    `;
  }
}
