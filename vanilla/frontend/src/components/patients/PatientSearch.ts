/**
 * PatientSearch Component - Advanced patient search
 */

import { PatientSearchParams, Patient } from '../../types/Patient';
import PatientService from '../../services/PatientService';

export class PatientSearch {
  private container: HTMLElement;
  private onResults?: (patients: Patient[]) => void;

  constructor(containerId: string, onResults?: (patients: Patient[]) => void) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    this.onResults = onResults;
    this.render();
  }

  /**
   * Render the search form
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="patient-search">
        <form id="searchForm" class="search-form">
          <div class="search-header">
            <h3>Search Patients</h3>
            <button type="button" class="toggle-advanced" id="toggleAdvanced">
              Advanced Search
            </button>
          </div>

          <div class="quick-search">
            <input
              type="text"
              id="quickSearch"
              name="query"
              placeholder="Search by name, MRN, phone, or email..."
              class="search-input"
            >
            <button type="submit" class="btn-primary">Search</button>
            <button type="button" class="btn-secondary" id="clearBtn">Clear</button>
          </div>

          <div class="advanced-search" id="advancedSearch" style="display: none;">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName">
              </div>

              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName">
              </div>

              <div class="form-group">
                <label for="mrn">MRN</label>
                <input type="text" id="mrn" name="mrn">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="dateOfBirth">Date of Birth</label>
                <input type="date" id="dateOfBirth" name="dateOfBirth">
              </div>

              <div class="form-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" name="phone">
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" name="status">
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deceased">Deceased</option>
                  <option value="merged">Merged</option>
                </select>
              </div>
            </div>
          </div>

          <div class="search-message" id="searchMessage"></div>
        </form>

        <div class="search-results" id="searchResults"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const form = this.container.querySelector('#searchForm') as HTMLFormElement;
    const toggleBtn = this.container.querySelector('#toggleAdvanced') as HTMLButtonElement;
    const clearBtn = this.container.querySelector('#clearBtn') as HTMLButtonElement;
    const advancedSearch = this.container.querySelector('#advancedSearch') as HTMLElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSearch();
    });

    toggleBtn.addEventListener('click', () => {
      const isHidden = advancedSearch.style.display === 'none';
      advancedSearch.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? 'Simple Search' : 'Advanced Search';
    });

    clearBtn.addEventListener('click', () => {
      form.reset();
      this.clearResults();
    });
  }

  /**
   * Handle search submission
   */
  private async handleSearch(): Promise<void> {
    const form = this.container.querySelector('#searchForm') as HTMLFormElement;
    const formData = new FormData(form);
    const messageEl = this.container.querySelector('#searchMessage') as HTMLElement;

    const params: PatientSearchParams = {
      query: formData.get('query') as string || undefined,
      firstName: formData.get('firstName') as string || undefined,
      lastName: formData.get('lastName') as string || undefined,
      mrn: formData.get('mrn') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      email: formData.get('email') as string || undefined,
      status: formData.get('status') as Patient['status'] || undefined,
    };

    if (formData.get('dateOfBirth')) {
      params.dateOfBirth = formData.get('dateOfBirth') as string;
    }

    try {
      messageEl.className = 'search-message loading';
      messageEl.textContent = 'Searching...';

      const response = await PatientService.searchPatients(params);

      if (response.success && response.data) {
        messageEl.className = 'search-message success';
        messageEl.textContent = `Found ${response.count || 0} patient(s)`;

        if (this.onResults) {
          this.onResults(response.data);
        }

        this.displayResults(response.data);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (error) {
      messageEl.className = 'search-message error';
      messageEl.textContent = error instanceof Error ? error.message : 'Search failed';
    }
  }

  /**
   * Display search results
   */
  private displayResults(patients: Patient[]): void {
    const resultsEl = this.container.querySelector('#searchResults') as HTMLElement;

    if (patients.length === 0) {
      resultsEl.innerHTML = '<div class="no-results">No patients found</div>';
      return;
    }

    resultsEl.innerHTML = `
      <div class="results-count">${patients.length} patient(s) found</div>
      <table class="results-table">
        <thead>
          <tr>
            <th>MRN</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${patients.map(patient => `
            <tr>
              <td>${patient.mrn}</td>
              <td>${patient.firstName} ${patient.lastName}</td>
              <td>${new Date(patient.dateOfBirth).toLocaleDateString()}</td>
              <td>${patient.contact.phone}</td>
              <td><span class="status-badge status-${patient.status}">${patient.status}</span></td>
              <td>
                <button class="btn-view" onclick="window.location.href='/patients/${patient.id}'">
                  View
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Clear search results
   */
  private clearResults(): void {
    const resultsEl = this.container.querySelector('#searchResults') as HTMLElement;
    const messageEl = this.container.querySelector('#searchMessage') as HTMLElement;

    resultsEl.innerHTML = '';
    messageEl.textContent = '';
  }
}
