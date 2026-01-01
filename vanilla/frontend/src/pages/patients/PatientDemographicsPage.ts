/**
 * PatientDemographicsPage - View/edit patient demographics
 */

import PatientService from "../../services/PatientService";
import { Patient } from "../../types/Patient";

export class PatientDemographicsPage {
  private patientId: string;
  private patient: Patient | null = null;
  private editMode: boolean = false;

  constructor(patientId: string) {
    this.patientId = patientId;
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
      <div class="demographics-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to Patient</button>
            <h1>Demographics - ${this.patient.firstName} ${this.patient.lastName}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-primary" id="editBtn">Edit Demographics</button>
          </div>
        </header>

        <div class="page-content">
          <div id="demographicsContent"></div>
        </div>
      </div>
    `;

    this.render();
    this.attachEventListeners();
  }

  /**
   * Render demographics content
   */
  private render(): void {
    if (!this.patient) return;

    const contentEl = document.getElementById("demographicsContent");
    if (!contentEl) return;

    if (!this.editMode) {
      this.renderView(contentEl);
    } else {
      this.renderEdit(contentEl);
    }
  }

  /**
   * Render view mode
   */
  private renderView(container: HTMLElement): void {
    if (!this.patient) return;

    const dob = new Date(this.patient.dateOfBirth).toLocaleDateString();

    container.innerHTML = `
      <div class="demographics-view">
        <section class="demo-section">
          <h2>Basic Information</h2>
          <div class="demo-grid">
            <div class="demo-field">
              <label>MRN:</label>
              <span>${this.patient.mrn}</span>
            </div>
            <div class="demo-field">
              <label>First Name:</label>
              <span>${this.patient.firstName}</span>
            </div>
            <div class="demo-field">
              <label>Middle Name:</label>
              <span>${this.patient.middleName || "N/A"}</span>
            </div>
            <div class="demo-field">
              <label>Last Name:</label>
              <span>${this.patient.lastName}</span>
            </div>
            <div class="demo-field">
              <label>Date of Birth:</label>
              <span>${dob}</span>
            </div>
            <div class="demo-field">
              <label>Gender:</label>
              <span>${this.patient.gender}</span>
            </div>
            <div class="demo-field">
              <label>Blood Type:</label>
              <span>${this.patient.bloodType || "N/A"}</span>
            </div>
            <div class="demo-field">
              <label>Marital Status:</label>
              <span>${this.patient.maritalStatus || "N/A"}</span>
            </div>
          </div>
        </section>

        <section class="demo-section">
          <h2>Contact Information</h2>
          <div class="demo-grid">
            <div class="demo-field">
              <label>Phone:</label>
              <span>${this.patient.contact.phone}</span>
            </div>
            <div class="demo-field">
              <label>Email:</label>
              <span>${this.patient.contact.email || "N/A"}</span>
            </div>
            <div class="demo-field full-width">
              <label>Address:</label>
              <span>
                ${this.patient.address.street}<br>
                ${this.patient.address.city}, ${this.patient.address.state} ${this.patient.address.zipCode}<br>
                ${this.patient.address.country}
              </span>
            </div>
          </div>
        </section>

        ${
          this.patient.contact.emergencyContact
            ? `
          <section class="demo-section">
            <h2>Emergency Contact</h2>
            <div class="demo-grid">
              <div class="demo-field">
                <label>Name:</label>
                <span>${this.patient.contact.emergencyContact.name}</span>
              </div>
              <div class="demo-field">
                <label>Relationship:</label>
                <span>${this.patient.contact.emergencyContact.relationship}</span>
              </div>
              <div class="demo-field">
                <label>Phone:</label>
                <span>${this.patient.contact.emergencyContact.phone}</span>
              </div>
            </div>
          </section>
        `
            : ""
        }

        <section class="demo-section">
          <h2>Additional Information</h2>
          <div class="demo-grid">
            <div class="demo-field">
              <label>Preferred Language:</label>
              <span>${this.patient.preferredLanguage || "N/A"}</span>
            </div>
            <div class="demo-field">
              <label>Race:</label>
              <span>${this.patient.race || "N/A"}</span>
            </div>
            <div class="demo-field">
              <label>Ethnicity:</label>
              <span>${this.patient.ethnicity || "N/A"}</span>
            </div>
            <div class="demo-field">
              <label>Status:</label>
              <span class="status-badge status-${this.patient.status}">${this.patient.status}</span>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  /**
   * Render edit mode
   */
  private renderEdit(container: HTMLElement): void {
    container.innerHTML = `
      <div class="demographics-edit">
        <p>Edit mode would include a form similar to PatientForm component.</p>
        <p>For now, use the main Edit button to edit the full patient record.</p>
        <button class="btn-secondary" id="cancelEditBtn">Cancel</button>
      </div>
    `;

    const cancelBtn = container.querySelector("#cancelEditBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.editMode = false;
        this.render();
      });
    }
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

    const editBtn = document.getElementById("editBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        window.location.href = `/patients/${this.patientId}/edit`;
      });
    }
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  const pathParts = window.location.pathname.split("/");
  const patientId = pathParts[2];

  if (patientId) {
    new PatientDemographicsPage(patientId);
  }
});
