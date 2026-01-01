/**
 * MergePatients Component - Merge duplicate patient records
 */

import { Patient, DuplicateMatch } from "../../types/Patient";
import PatientService from "../../services/PatientService";

export class MergePatients {
  private container: HTMLElement;
  private sourcePatient: Patient | null = null;
  private targetPatient: Patient | null = null;
  private duplicates: DuplicateMatch[] = [];

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
  }

  /**
   * Set source patient and find duplicates
   */
  public async setSourcePatient(patient: Patient): Promise<void> {
    this.sourcePatient = patient;

    try {
      const response = await PatientService.findDuplicates(patient);
      if (response.success && response.data) {
        this.duplicates = response.data;
        this.render();
      }
    } catch (error) {
      console.error("Failed to find duplicates:", error);
      this.render();
    }
  }

  /**
   * Render the merge interface
   */
  private render(): void {
    if (!this.sourcePatient) {
      this.container.innerHTML =
        '<div class="no-patient">No patient selected</div>';
      return;
    }

    this.container.innerHTML = `
      <div class="merge-patients">
        <h2>Merge Patient Records</h2>

        <div class="merge-warning">
          <strong>Warning:</strong> Merging patient records is irreversible. Please review carefully before proceeding.
        </div>

        <div class="merge-layout">
          <div class="source-patient">
            <h3>Source Patient (Will be merged into target)</h3>
            ${this.renderPatientCard(this.sourcePatient, "source")}
          </div>

          <div class="merge-arrow">→</div>

          <div class="target-patient">
            <h3>Target Patient (Master record)</h3>
            ${
              this.targetPatient
                ? this.renderPatientCard(this.targetPatient, "target")
                : `
              <div class="select-target">
                <p>Select a target patient from duplicates below</p>
              </div>
            `
            }
          </div>
        </div>

        ${
          this.duplicates.length > 0
            ? `
          <div class="duplicates-section">
            <h3>Potential Duplicates</h3>
            <div class="duplicates-list">
              ${this.duplicates.map((dup) => this.renderDuplicateCard(dup)).join("")}
            </div>
          </div>
        `
            : `
          <div class="no-duplicates">
            No potential duplicates found. You can manually enter a target MRN below.
          </div>
        `
        }

        <div class="merge-form">
          <h3>Confirm Merge</h3>
          <form id="mergeForm">
            <div class="form-group">
              <label for="targetMrn">Target Patient MRN *</label>
              <input type="text" id="targetMrn" name="targetMrn" required
                value="${this.targetPatient?.mrn || ""}"
                ${this.targetPatient ? "readonly" : ""}>
            </div>

            <div class="form-group">
              <label for="reason">Reason for Merge *</label>
              <textarea id="reason" name="reason" required rows="3"
                placeholder="Explain why these records should be merged..."></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary btn-danger"
                ${!this.targetPatient ? "disabled" : ""}>
                Merge Patients
              </button>
              <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
            </div>

            <div class="form-message" id="formMessage"></div>
          </form>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render patient card
   */
  private renderPatientCard(
    patient: Patient,
    type: "source" | "target",
  ): string {
    const dob = new Date(patient.dateOfBirth).toLocaleDateString();

    return `
      <div class="patient-merge-card ${type}">
        <div class="patient-header">
          <h4>${patient.firstName} ${patient.lastName}</h4>
          <span class="mrn">MRN: ${patient.mrn}</span>
        </div>

        <div class="patient-details">
          <div class="detail">
            <strong>DOB:</strong> ${dob}
          </div>
          <div class="detail">
            <strong>Gender:</strong> ${patient.gender}
          </div>
          <div class="detail">
            <strong>Phone:</strong> ${patient.contact.phone}
          </div>
          ${
            patient.contact.email
              ? `
            <div class="detail">
              <strong>Email:</strong> ${patient.contact.email}
            </div>
          `
              : ""
          }
          <div class="detail">
            <strong>Address:</strong>
            ${patient.address.street}, ${patient.address.city}, ${patient.address.state}
          </div>
          ${
            patient.insurance.length > 0
              ? `
            <div class="detail">
              <strong>Insurance:</strong> ${patient.insurance.length} record(s)
            </div>
          `
              : ""
          }
          ${
            patient.documents && patient.documents.length > 0
              ? `
            <div class="detail">
              <strong>Documents:</strong> ${patient.documents.length} file(s)
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Render duplicate card
   */
  private renderDuplicateCard(duplicate: DuplicateMatch): string {
    const { patient, score, matchedFields } = duplicate;
    const dob = new Date(patient.dateOfBirth).toLocaleDateString();
    const scoreClass = score >= 80 ? "high" : score >= 60 ? "medium" : "low";

    return `
      <div class="duplicate-card">
        <div class="duplicate-score ${scoreClass}">
          ${score.toFixed(0)}% match
        </div>

        <div class="duplicate-info">
          <h4>${patient.firstName} ${patient.lastName}</h4>
          <p class="mrn">MRN: ${patient.mrn}</p>
          <p>DOB: ${dob} | Phone: ${patient.contact.phone}</p>

          ${
            matchedFields.length > 0
              ? `
            <div class="matched-fields">
              <strong>Matched:</strong> ${matchedFields.join(", ")}
            </div>
          `
              : ""
          }
        </div>

        <div class="duplicate-actions">
          <button class="btn-select" data-patient='${JSON.stringify(patient)}'>
            Select as Target
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const selectButtons = this.container.querySelectorAll(".btn-select");
    selectButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const patientData = target.getAttribute("data-patient");
        if (patientData) {
          this.targetPatient = JSON.parse(patientData);
          this.render();
        }
      });
    });

    const form = this.container.querySelector("#mergeForm") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleMerge();
      });
    }

    const cancelBtn = this.container.querySelector(
      "#cancelBtn",
    ) as HTMLButtonElement;
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        window.history.back();
      });
    }
  }

  /**
   * Handle merge submission
   */
  private async handleMerge(): Promise<void> {
    if (!this.sourcePatient) return;

    const form = this.container.querySelector("#mergeForm") as HTMLFormElement;
    const formData = new FormData(form);
    const messageEl = this.container.querySelector(
      "#formMessage",
    ) as HTMLElement;

    const targetMrn = formData.get("targetMrn") as string;
    const reason = formData.get("reason") as string;

    if (!targetMrn || !reason) {
      messageEl.className = "form-message error";
      messageEl.textContent = "Please fill in all required fields";
      return;
    }

    // Confirm before merging
    const confirmed = confirm(
      `Are you sure you want to merge patient ${this.sourcePatient.mrn} into ${targetMrn}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      messageEl.className = "form-message loading";
      messageEl.textContent = "Merging patients...";

      const response = await PatientService.mergePatients(
        this.sourcePatient.mrn,
        targetMrn,
        reason,
      );

      if (response.success) {
        messageEl.className = "form-message success";
        messageEl.textContent = "Patients merged successfully";

        // Redirect to target patient after 2 seconds
        setTimeout(() => {
          if (response.data) {
            window.location.href = `/patients/${response.data.id}`;
          }
        }, 2000);
      } else {
        throw new Error(response.error || "Merge failed");
      }
    } catch (error) {
      messageEl.className = "form-message error";
      messageEl.textContent =
        error instanceof Error ? error.message : "Merge failed";
    }
  }
}
