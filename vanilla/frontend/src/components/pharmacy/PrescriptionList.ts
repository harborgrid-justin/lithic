/**
 * PrescriptionList.ts
 * Reusable prescription list component
 */

import type { Prescription } from "../../services/PharmacyService";

export class PrescriptionList {
  private container: HTMLElement;
  private prescriptions: Prescription[];
  private onSelect?: (prescription: Prescription) => void;

  constructor(
    container: HTMLElement,
    prescriptions: Prescription[],
    onSelect?: (prescription: Prescription) => void,
  ) {
    this.container = container;
    this.prescriptions = prescriptions;
    this.onSelect = onSelect;
  }

  render(): void {
    if (this.prescriptions.length === 0) {
      this.container.innerHTML =
        '<div class="empty-state">No prescriptions found</div>';
      return;
    }

    this.container.innerHTML = `
      <div class="prescription-list">
        ${this.prescriptions
          .map(
            (rx) => `
          <div class="prescription-item" data-id="${rx.id}">
            <div class="rx-header">
              <span class="rx-number">${rx.rxNumber}</span>
              <span class="status-badge status-${rx.status}">${rx.status}</span>
            </div>
            <div class="rx-patient">${rx.patientName || rx.patientId}</div>
            <div class="rx-medication">${rx.medication?.name || rx.medicationId}</div>
            <div class="rx-meta">
              <span>Qty: ${rx.quantity}</span>
              <span>${new Date(rx.writtenDate).toLocaleDateString()}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <style>
        .prescription-list { display: flex; flex-direction: column; gap: 12px; }
        .prescription-item { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; cursor: pointer; }
        .prescription-item:hover { border-color: #0066cc; box-shadow: 0 2px 8px rgba(0,102,204,0.1); }
        .rx-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .rx-number { font-weight: 600; color: #0066cc; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status-verified { background: #d1ecf1; color: #0c5460; }
        .rx-medication { font-weight: 500; margin: 4px 0; }
        .rx-meta { display: flex; gap: 16px; font-size: 12px; color: #666; }
      </style>
    `;

    if (this.onSelect) {
      this.container.querySelectorAll(".prescription-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = (item as HTMLElement).dataset.id;
          const rx = this.prescriptions.find((p) => p.id === id);
          if (rx && this.onSelect) this.onSelect(rx);
        });
      });
    }
  }
}
