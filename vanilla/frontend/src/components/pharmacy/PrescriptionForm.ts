/**
 * PrescriptionForm.ts
 * Form component for creating/editing prescriptions
 */

export class PrescriptionForm {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <form class="prescription-form">
        <h3>Prescription Form</h3>
        <p>Comprehensive prescription form with drug search, interaction checking - Under Construction</p>
      </form>
    `;
  }
}
