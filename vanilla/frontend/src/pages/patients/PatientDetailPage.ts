/**
 * PatientDetailPage - Patient detail view
 */

import { PatientCard } from "../../components/patients/PatientCard";
import { PatientTimeline } from "../../components/patients/PatientTimeline";
import PatientService from "../../services/PatientService";
import { Patient } from "../../types/Patient";

export class PatientDetailPage {
  private patientId: string;
  private patient: Patient | null = null;
  private patientCard: PatientCard;
  private patientTimeline: PatientTimeline;

  constructor(patientId: string) {
    this.patientId = patientId;
    this.initializePage();
    this.patientCard = new PatientCard("patientCardContainer");
    this.patientTimeline = new PatientTimeline("timelineContainer", patientId);
    this.loadPatient();
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    document.body.innerHTML = `
      <div class="patient-detail-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to List</button>
            <h1 id="patientName">Patient Details</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" id="editBtn">Edit</button>
            <button class="btn-secondary" id="mergeBtn">Merge</button>
            <button class="btn-secondary" id="deleteBtn">Delete</button>
          </div>
        </header>

        <div class="page-content">
          <div class="detail-layout">
            <div class="main-column">
              <div id="patientCardContainer"></div>

              <div class="tabs">
                <button class="tab-button active" data-tab="demographics">Demographics</button>
                <button class="tab-button" data-tab="insurance">Insurance</button>
                <button class="tab-button" data-tab="documents">Documents</button>
                <button class="tab-button" data-tab="history">History</button>
              </div>

              <div class="tab-content">
                <div id="tabPanel"></div>
              </div>
            </div>

            <aside class="sidebar">
              <div id="timelineContainer"></div>
            </aside>
          </div>
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
    const editBtn = document.getElementById("editBtn");
    const mergeBtn = document.getElementById("mergeBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "/patients";
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        window.location.href = `/patients/${this.patientId}/edit`;
      });
    }

    if (mergeBtn) {
      mergeBtn.addEventListener("click", () => {
        window.location.href = `/patients/${this.patientId}/merge`;
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        await this.handleDelete();
      });
    }

    // Tab buttons
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const tab = target.getAttribute("data-tab");
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  /**
   * Load patient data
   */
  private async loadPatient(): Promise<void> {
    try {
      const response = await PatientService.getPatientById(this.patientId);

      if (response.success && response.data) {
        this.patient = response.data;
        this.patientCard.setPatient(this.patient);
        this.patientTimeline.load();

        // Update page title
        const nameEl = document.getElementById("patientName");
        if (nameEl) {
          nameEl.textContent = `${this.patient.firstName} ${this.patient.lastName}`;
        }

        // Load default tab
        this.switchTab("demographics");
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
   * Switch active tab
   */
  private switchTab(tab: string): void {
    // Update active tab button
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.classList.remove("active");
      if (button.getAttribute("data-tab") === tab) {
        button.classList.add("active");
      }
    });

    // Load tab content
    const tabPanel = document.getElementById("tabPanel");
    if (!tabPanel) return;

    switch (tab) {
      case "demographics":
        window.location.href = `/patients/${this.patientId}/demographics`;
        break;
      case "insurance":
        window.location.href = `/patients/${this.patientId}/insurance`;
        break;
      case "documents":
        window.location.href = `/patients/${this.patientId}/documents`;
        break;
      case "history":
        window.location.href = `/patients/${this.patientId}/history`;
        break;
    }
  }

  /**
   * Handle patient deletion
   */
  private async handleDelete(): Promise<void> {
    if (!this.patient) return;

    const confirmed = confirm(
      `Are you sure you want to delete patient ${this.patient.firstName} ${this.patient.lastName}? This will mark the patient as inactive.`,
    );

    if (!confirmed) return;

    try {
      const response = await PatientService.deletePatient(this.patientId);

      if (response.success) {
        alert("Patient deleted successfully");
        window.location.href = "/patients";
      } else {
        throw new Error(response.error || "Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
      alert("Failed to delete patient. Please try again.");
    }
  }
}

// Initialize page (get patient ID from URL)
document.addEventListener("DOMContentLoaded", () => {
  const pathParts = window.location.pathname.split("/");
  const patientId = pathParts[2];

  if (patientId) {
    new PatientDetailPage(patientId);
  }
});
