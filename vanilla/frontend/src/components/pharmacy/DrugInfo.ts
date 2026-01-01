/**
 * DrugInfo.ts
 * Drug information display component
 */

import type { Medication } from '../../services/PharmacyService';

export class DrugInfo {
  private container: HTMLElement;
  private medication: Medication | null = null;

  constructor(container: HTMLElement, medication?: Medication) {
    this.container = container;
    this.medication = medication || null;
  }

  render(): void {
    if (!this.medication) {
      this.container.innerHTML = '<div>No medication selected</div>';
      return;
    }

    const med = this.medication;

    this.container.innerHTML = `
      <div class="drug-info">
        <h3>${med.name}</h3>
        <dl>
          <dt>Generic Name:</dt>
          <dd>${med.genericName}</dd>
          <dt>NDC Code:</dt>
          <dd>${med.ndcCode}</dd>
          <dt>Strength:</dt>
          <dd>${med.strength}</dd>
          <dt>Dosage Form:</dt>
          <dd>${med.dosageForm}</dd>
          <dt>Manufacturer:</dt>
          <dd>${med.manufacturer}</dd>
          <dt>Therapeutic Class:</dt>
          <dd>${med.therapeuticClass}</dd>
          ${med.isControlled ? `
            <dt>DEA Schedule:</dt>
            <dd class="controlled">Schedule ${med.deaSchedule}</dd>
          ` : ''}
          <dt>Formulary Status:</dt>
          <dd>${med.formularyStatus}</dd>
          <dt>Unit Price:</dt>
          <dd>$${med.unitPrice.toFixed(2)}</dd>
        </dl>
      </div>
      <style>
        .drug-info { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
        .drug-info h3 { margin: 0 0 16px 0; color: #0066cc; }
        .drug-info dl { margin: 0; }
        .drug-info dt { font-weight: 600; color: #666; font-size: 13px; margin-top: 12px; }
        .drug-info dd { margin: 4px 0 0 0; color: #1a1a1a; }
        .controlled { color: #9c27b0; font-weight: 600; }
      </style>
    `;
  }

  setMedication(medication: Medication): void {
    this.medication = medication;
    this.render();
  }
}
