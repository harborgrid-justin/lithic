/**
 * PrescriptionDetailPage.ts
 * Detailed view of a single prescription
 */

import pharmacyService, {
  type Prescription,
} from "../../services/PharmacyService";

export class PrescriptionDetailPage {
  private container: HTMLElement;
  private prescription: Prescription | null = null;
  private prescriptionId: string;

  constructor(containerId: string, prescriptionId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
    this.prescriptionId = prescriptionId;
  }

  async init(): Promise<void> {
    await this.loadPrescription();
    this.render();
    this.attachEventListeners();
  }

  private async loadPrescription(): Promise<void> {
    try {
      this.prescription = await pharmacyService.getPrescription(
        this.prescriptionId,
      );
    } catch (error) {
      console.error("Failed to load prescription:", error);
    }
  }

  private render(): void {
    if (!this.prescription) {
      this.container.innerHTML =
        '<div class="error">Prescription not found</div>';
      return;
    }

    const rx = this.prescription;

    this.container.innerHTML = `
      <div class="prescription-detail">
        <div class="detail-header">
          <div>
            <h1>Prescription ${rx.rxNumber}</h1>
            <div class="status-badge status-${rx.status}">
              ${rx.status.split("_").join(" ").toUpperCase()}
            </div>
          </div>
          <div class="header-actions">
            ${rx.status === "verified" ? '<button class="btn btn-primary" data-action="dispense">Dispense</button>' : ""}
            <button class="btn btn-secondary" data-action="print">Print</button>
          </div>
        </div>

        <div class="detail-grid">
          <section class="detail-card">
            <h2>Patient Information</h2>
            <dl>
              <dt>Name:</dt>
              <dd>${rx.patientName || rx.patientId}</dd>
              <dt>Patient ID:</dt>
              <dd>${rx.patientId}</dd>
            </dl>
          </section>

          <section class="detail-card">
            <h2>Prescriber Information</h2>
            <dl>
              <dt>Name:</dt>
              <dd>${rx.prescriberName || rx.prescriberId}</dd>
              <dt>NPI:</dt>
              <dd>${rx.prescriberNPI || "N/A"}</dd>
              ${rx.prescriberDEA ? `<dt>DEA:</dt><dd>${rx.prescriberDEA}</dd>` : ""}
            </dl>
          </section>

          <section class="detail-card medication-info">
            <h2>Medication</h2>
            <h3>${rx.medication?.name || rx.medicationId}</h3>
            <dl>
              <dt>NDC:</dt>
              <dd>${rx.medication?.ndcCode || "N/A"}</dd>
              <dt>Strength:</dt>
              <dd>${rx.medication?.strength || "N/A"}</dd>
              <dt>Dosage Form:</dt>
              <dd>${rx.medication?.dosageForm || "N/A"}</dd>
              ${rx.isControlled ? `<dt>DEA Schedule:</dt><dd class="controlled">Schedule ${rx.medication?.deaSchedule || "II"}</dd>` : ""}
            </dl>
          </section>

          <section class="detail-card">
            <h2>Directions & Quantity</h2>
            <dl>
              <dt>Directions (SIG):</dt>
              <dd class="directions">${rx.directions}</dd>
              <dt>Quantity:</dt>
              <dd>${rx.quantity}</dd>
              <dt>Days Supply:</dt>
              <dd>${rx.daysSupply} days</dd>
              <dt>Refills:</dt>
              <dd>${rx.refillsRemaining} of ${rx.refillsAuthorized}</dd>
            </dl>
          </section>

          <section class="detail-card">
            <h2>Dates</h2>
            <dl>
              <dt>Written:</dt>
              <dd>${new Date(rx.writtenDate).toLocaleString()}</dd>
              <dt>Expires:</dt>
              <dd>${new Date(rx.expirationDate).toLocaleString()}</dd>
              ${rx.dispensedDate ? `<dt>Dispensed:</dt><dd>${new Date(rx.dispensedDate).toLocaleString()}</dd>` : ""}
            </dl>
          </section>

          ${
            rx.notes
              ? `
            <section class="detail-card full-width">
              <h2>Notes</h2>
              <p>${rx.notes}</p>
            </section>
          `
              : ""
          }
        </div>
      </div>

      <style>
        .prescription-detail { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .detail-header h1 { font-size: 24px; margin: 0 0 8px 0; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .detail-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
        .detail-card h2 { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #333; }
        .detail-card dl { margin: 0; }
        .detail-card dt { font-weight: 600; margin-top: 12px; color: #666; font-size: 13px; }
        .detail-card dd { margin: 4px 0 0 0; color: #1a1a1a; }
        .directions { font-style: italic; background: #f8f9fa; padding: 8px; border-radius: 4px; }
        .controlled { color: #9c27b0; font-weight: 600; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-verified { background: #d1ecf1; color: #0c5460; }
        .status-filled { background: #d4edda; color: #155724; }
        .btn { padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .btn-primary { background: #0066cc; color: white; }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .full-width { grid-column: 1 / -1; }
      </style>
    `;
  }

  private attachEventListeners(): void {
    const dispenseBtn = this.container.querySelector(
      '[data-action="dispense"]',
    );
    if (dispenseBtn) {
      dispenseBtn.addEventListener("click", () => {
        window.location.hash = `#/pharmacy/dispensing?rx=${this.prescriptionId}`;
      });
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
