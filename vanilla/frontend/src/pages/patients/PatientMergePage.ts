/**
 * PatientMergePage - Merge patient records
 */

import { MergePatients } from "../../components/patients/MergePatients";
import PatientService from "../../services/PatientService";
import { Patient } from "../../types/Patient";

export class PatientMergePage {
  private patientId: string;
  private patient: Patient | null = null;
  private mergeComponent: MergePatients;

  constructor(patientId: string) {
    this.patientId = patientId;
    this.initializePage();
    this.mergeComponent = new MergePatients("mergeContainer");
    this.loadPatient();
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    document.body.innerHTML = `
      <div class="patient-merge-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to Patient</button>
            <h1>Merge Patient Records</h1>
          </div>
        </header>

        <div class="page-content">
          <div id="mergeContainer"></div>
        </div>
      </div>
    `;

    this.attachPageEventListeners();
  }

  /**
   * Attach page-level event listeners
   */
  private attachPageEventListeners(): void {
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = `/patients/${this.patientId}`;
      });
    }
  }

  /**
   * Load patient and initialize merge
   */
  private async loadPatient(): Promise<void> {
    try {
      const response = await PatientService.getPatientById(this.patientId);

      if (response.success && response.data) {
        this.patient = response.data;
        await this.mergeComponent.setSourcePatient(this.patient);
      } else {
        throw new Error(response.error || "Patient not found");
      }
    } catch (error) {
      console.error("Failed to load patient:", error);
      alert("Failed to load patient. Please try again.");
      window.location.href = "/patients";
    }
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  const pathParts = window.location.pathname.split("/");
  const patientId = pathParts[2];

  if (patientId) {
    new PatientMergePage(patientId);
  }
});
