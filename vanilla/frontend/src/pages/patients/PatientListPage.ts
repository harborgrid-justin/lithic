/**
 * PatientListPage - Main patient list view
 */

import { PatientList } from '../../components/patients/PatientList';
import { PatientSearch } from '../../components/patients/PatientSearch';
import PatientService from '../../services/PatientService';
import { Patient } from '../../types/Patient';

export class PatientListPage {
  private patientList: PatientList;
  private patientSearch: PatientSearch;
  private currentPage: number = 0;
  private pageSize: number = 50;

  constructor() {
    this.initializePage();
    this.patientSearch = new PatientSearch('searchContainer', (patients) => {
      this.patientList.setPatients(patients);
    });
    this.patientList = new PatientList('patientListContainer', (patient) => {
      this.navigateToPatient(patient);
    });
    this.loadPatients();
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    document.body.innerHTML = `
      <div class="patient-list-page">
        <header class="page-header">
          <h1>Patient Management</h1>
          <div class="header-actions">
            <button class="btn-primary" id="newPatientBtn">
              + New Patient
            </button>
          </div>
        </header>

        <div class="page-content">
          <aside class="sidebar">
            <div id="searchContainer"></div>

            <div class="stats-panel">
              <h3>Quick Stats</h3>
              <div class="stat-item">
                <span class="stat-label">Total Patients:</span>
                <span class="stat-value" id="totalPatients">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Active:</span>
                <span class="stat-value" id="activePatients">-</span>
              </div>
            </div>
          </aside>

          <main class="main-content">
            <div id="patientListContainer"></div>

            <div class="pagination" id="pagination">
              <button id="prevPage" class="btn-secondary">← Previous</button>
              <span id="pageInfo">Page 1</span>
              <button id="nextPage" class="btn-secondary">Next →</button>
            </div>
          </main>
        </div>
      </div>
    `;

    this.attachPageEventListeners();
  }

  /**
   * Attach page-level event listeners
   */
  private attachPageEventListeners(): void {
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
      newPatientBtn.addEventListener('click', () => {
        window.location.href = '/patients/new';
      });
    }

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.loadPatients();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentPage++;
        this.loadPatients();
      });
    }
  }

  /**
   * Load patients
   */
  private async loadPatients(): Promise<void> {
    try {
      const offset = this.currentPage * this.pageSize;
      const response = await PatientService.getAllPatients(this.pageSize, offset);

      if (response.success && response.data) {
        this.patientList.setPatients(response.data);
        this.updatePagination(response.pagination);
        this.updateStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
      alert('Failed to load patients. Please try again.');
    }
  }

  /**
   * Update pagination controls
   */
  private updatePagination(pagination?: any): void {
    if (!pagination) return;

    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextPage') as HTMLButtonElement;

    if (pageInfo) {
      pageInfo.textContent = `Page ${this.currentPage + 1}`;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentPage === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = !pagination.hasMore;
    }
  }

  /**
   * Update stats
   */
  private updateStats(patients: Patient[]): void {
    const totalEl = document.getElementById('totalPatients');
    const activeEl = document.getElementById('activePatients');

    if (totalEl) {
      totalEl.textContent = patients.length.toString();
    }

    if (activeEl) {
      const activeCount = patients.filter(p => p.status === 'active').length;
      activeEl.textContent = activeCount.toString();
    }
  }

  /**
   * Navigate to patient detail
   */
  private navigateToPatient(patient: Patient): void {
    window.location.href = `/patients/${patient.id}`;
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  new PatientListPage();
});
