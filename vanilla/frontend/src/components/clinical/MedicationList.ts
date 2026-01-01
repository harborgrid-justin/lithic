// Medication List Component - Vanilla TypeScript
export class MedicationList {
  private container: HTMLElement;
  private medications: any[] = [];
  private onUpdate?: (medicationId: string, status: string) => void;

  constructor(
    containerId: string,
    onUpdate?: (medicationId: string, status: string) => void,
  ) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onUpdate = onUpdate;
  }

  setMedications(medications: any[]): void {
    this.medications = medications;
    this.render();
  }

  private render(): void {
    if (this.medications.length === 0) {
      this.container.innerHTML =
        '<div class="empty-state">No medications</div>';
      return;
    }

    const medicationsHTML = this.medications
      .map((med) => this.renderMedication(med))
      .join("");

    this.container.innerHTML = `
      <div class="medication-list">
        ${medicationsHTML}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderMedication(med: any): string {
    const startDate = new Date(med.startDate).toLocaleDateString();
    const statusClass = `status-${med.status}`;

    return `
      <div class="medication-item ${statusClass}" data-medication-id="${med.id}">
        <div class="medication-header">
          <div class="medication-name">
            <strong>${med.medicationName}</strong>
            ${med.genericName ? `<span class="generic-name">(${med.genericName})</span>` : ""}
          </div>
          <span class="medication-status ${statusClass}">${med.status}</span>
        </div>

        <div class="medication-details">
          <div class="medication-dosage">
            <strong>Dosage:</strong> ${med.dosage}
          </div>
          <div class="medication-route">
            <strong>Route:</strong> ${med.route}
          </div>
          <div class="medication-frequency">
            <strong>Frequency:</strong> ${med.frequency}
          </div>
          <div class="medication-dates">
            <strong>Start:</strong> ${startDate}
            ${med.endDate ? ` | <strong>End:</strong> ${new Date(med.endDate).toLocaleDateString()}` : ""}
          </div>
          ${
            med.indication
              ? `
            <div class="medication-indication">
              <strong>Indication:</strong> ${med.indication}
            </div>
          `
              : ""
          }
          ${
            med.instructions
              ? `
            <div class="medication-instructions">
              <strong>Instructions:</strong> ${med.instructions}
            </div>
          `
              : ""
          }
          ${
            med.refills !== undefined
              ? `
            <div class="medication-refills">
              <strong>Refills:</strong> ${med.refills}
            </div>
          `
              : ""
          }
          ${
            med.prescribedBy
              ? `
            <div class="medication-provider">
              <strong>Prescribed by:</strong> ${med.prescribedBy}
            </div>
          `
              : ""
          }
        </div>

        ${
          med.status === "active"
            ? `
          <div class="medication-actions">
            <button class="btn btn-sm discontinue-btn" data-medication-id="${med.id}">
              Discontinue
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private attachEventListeners(): void {
    const discontinueButtons =
      this.container.querySelectorAll(".discontinue-btn");
    discontinueButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const medicationId = (e.target as HTMLElement).getAttribute(
          "data-medication-id",
        );
        if (medicationId && this.onUpdate) {
          this.onUpdate(medicationId, "discontinued");
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}

export default MedicationList;
