/**
 * PatientHistoryPage - View patient history and audit log
 */

import { PatientTimeline } from '../../components/patients/PatientTimeline';
import PatientService from '../../services/PatientService';
import { Patient } from '../../types/Patient';

export class PatientHistoryPage {
  private patientId: string;
  private patient: Patient | null = null;
  private timeline: PatientTimeline;

  constructor(patientId: string) {
    this.patientId = patientId;
    this.timeline = new PatientTimeline('timelineContainer', patientId);
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
        await this.timeline.load();
      } else {
        throw new Error(response.error || 'Patient not found');
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
      alert('Failed to load patient. Please try again.');
      window.location.href = '/patients';
    }
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    if (!this.patient) return;

    document.body.innerHTML = `
      <div class="history-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to Patient</button>
            <h1>History - ${this.patient.firstName} ${this.patient.lastName}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" id="refreshBtn">🔄 Refresh</button>
            <button class="btn-secondary" id="exportBtn">📤 Export History</button>
          </div>
        </header>

        <div class="page-content">
          <div class="history-info">
            <div class="info-card">
              <h3>Patient Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <label>MRN:</label>
                  <span>${this.patient.mrn}</span>
                </div>
                <div class="info-item">
                  <label>Created:</label>
                  <span>${new Date(this.patient.createdAt).toLocaleString()}</span>
                </div>
                <div class="info-item">
                  <label>Last Updated:</label>
                  <span>${new Date(this.patient.updatedAt).toLocaleString()}</span>
                </div>
                <div class="info-item">
                  <label>Created By:</label>
                  <span>${this.patient.createdBy}</span>
                </div>
                <div class="info-item">
                  <label>Last Updated By:</label>
                  <span>${this.patient.updatedBy}</span>
                </div>
                <div class="info-item">
                  <label>Status:</label>
                  <span class="status-badge status-${this.patient.status}">${this.patient.status}</span>
                </div>
              </div>

              ${this.patient.mergedInto ? `
                <div class="merge-notice">
                  <strong>⚠️ This patient record has been merged</strong>
                  <p>Merged into patient: ${this.patient.mergedInto}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="timeline-section">
            <div id="timelineContainer"></div>
          </div>
        </div>
      </div>
    `;

    // Re-initialize timeline with new container
    this.timeline = new PatientTimeline('timelineContainer', this.patientId);
    this.timeline.load();

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const backBtn = document.getElementById('backBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = `/patients/${this.patientId}`;
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.timeline.refresh();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportHistory();
      });
    }
  }

  /**
   * Export patient history
   */
  private async exportHistory(): Promise<void> {
    if (!this.patient) return;

    try {
      const response = await PatientService.getAuditLog(this.patientId);

      if (response.success && response.data) {
        const data = {
          patient: {
            mrn: this.patient.mrn,
            name: `${this.patient.firstName} ${this.patient.lastName}`,
            dob: this.patient.dateOfBirth,
          },
          exportDate: new Date().toISOString(),
          auditLog: response.data,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-history-${this.patient.mrn}-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        alert('History exported successfully');
      }
    } catch (error) {
      console.error('Failed to export history:', error);
      alert('Failed to export history. Please try again.');
    }
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  const pathParts = window.location.pathname.split('/');
  const patientId = pathParts[2];

  if (patientId) {
    new PatientHistoryPage(patientId);
  }
});
