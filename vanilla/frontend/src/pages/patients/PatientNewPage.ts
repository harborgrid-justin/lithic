/**
 * PatientNewPage - Create new patient
 */

import { PatientForm } from '../../components/patients/PatientForm';
import { Patient, DuplicateMatch } from '../../types/Patient';
import PatientService from '../../services/PatientService';

export class PatientNewPage {
  private patientForm: PatientForm;
  private duplicateWarning: boolean = false;

  constructor() {
    this.initializePage();
    this.patientForm = new PatientForm(
      'formContainer',
      (patient) => this.handleSuccess(patient),
      () => this.handleCancel()
    );
    this.patientForm.render();
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    document.body.innerHTML = `
      <div class="patient-new-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to List</button>
            <h1>New Patient</h1>
          </div>
        </header>

        <div class="page-content">
          <div class="form-layout">
            <div id="duplicateWarning" class="duplicate-warning" style="display: none;">
              <h3>⚠️ Potential Duplicate Patients Found</h3>
              <p>Please review these similar patients before creating a new record:</p>
              <div id="duplicateList"></div>
              <div class="warning-actions">
                <button class="btn-secondary" id="reviewDuplicates">Review Duplicates</button>
                <button class="btn-primary" id="continueAnyway">Continue Anyway</button>
              </div>
            </div>

            <div id="formContainer"></div>
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
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = '/patients';
      });
    }
  }

  /**
   * Handle successful patient creation
   */
  private handleSuccess(patient: Patient): void {
    setTimeout(() => {
      window.location.href = `/patients/${patient.id}`;
    }, 1500);
  }

  /**
   * Handle form cancellation
   */
  private handleCancel(): void {
    window.location.href = '/patients';
  }

  /**
   * Show duplicate warning
   */
  private showDuplicateWarning(duplicates: DuplicateMatch[]): void {
    const warningEl = document.getElementById('duplicateWarning');
    const listEl = document.getElementById('duplicateList');

    if (!warningEl || !listEl) return;

    listEl.innerHTML = duplicates.map(dup => {
      const { patient, score, matchedFields } = dup;
      return `
        <div class="duplicate-item">
          <div class="duplicate-info">
            <strong>${patient.firstName} ${patient.lastName}</strong>
            <span class="mrn">MRN: ${patient.mrn}</span>
            <span class="score">${score.toFixed(0)}% match</span>
          </div>
          <div class="matched-fields">
            Matched: ${matchedFields.join(', ')}
          </div>
        </div>
      `;
    }).join('');

    warningEl.style.display = 'block';
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  new PatientNewPage();
});
