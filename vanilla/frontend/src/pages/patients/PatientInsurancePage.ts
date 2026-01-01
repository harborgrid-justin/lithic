/**
 * PatientInsurancePage - Manage patient insurance
 */

import { InsuranceCard } from "../../components/patients/InsuranceCard";
import PatientService from "../../services/PatientService";
import { Patient } from "../../types/Patient";

export class PatientInsurancePage {
  private patientId: string;
  private patient: Patient | null = null;
  private insuranceCard: InsuranceCard;

  constructor(patientId: string) {
    this.patientId = patientId;
    this.insuranceCard = new InsuranceCard("insuranceContainer", patientId);
    this.loadPatient();
  }

  /**
   * Load patient data
   */
  private async loadPatient(): Promise<void> {
    try {
      const response = await PatientService.getPatientById(this.patientId);

      if (response.success && response.data) {
        this.patient = response.data;
        this.initializePage();
        this.insuranceCard.setInsurance(this.patient.insurance);
      } else {
        throw new Error(response.error || "Patient not found");
      }
    } catch (error) {
      console.error("Failed to load patient:", error);
      alert("Failed to load patient. Please try again.");
      window.location.href = "/patients";
    }
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    if (!this.patient) return;

    document.body.innerHTML = `
      <div class="insurance-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to Patient</button>
            <h1>Insurance - ${this.patient.firstName} ${this.patient.lastName}</h1>
          </div>
        </header>

        <div class="page-content">
          <div id="insuranceContainer"></div>
        </div>
      </div>
    `;

    // Re-initialize insurance card with the new container
    this.insuranceCard = new InsuranceCard(
      "insuranceContainer",
      this.patientId,
    );
    this.insuranceCard.setInsurance(this.patient.insurance);

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = `/patients/${this.patientId}`;
      });
    }
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  const pathParts = window.location.pathname.split("/");
  const patientId = pathParts[2];

  if (patientId) {
    new PatientInsurancePage(patientId);
  }
});
