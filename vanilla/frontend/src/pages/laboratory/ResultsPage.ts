/**
 * Results Page
 * View and search laboratory results
 */

import { labService } from '../../services/LaboratoryService';
import { ResultViewer } from '../../components/laboratory/ResultViewer';

export class ResultsPage {
  private container: HTMLElement;
  private resultViewer: ResultViewer | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="results-page">
        <div class="page-header">
          <h1>Laboratory Results</h1>
          <button type="button" class="btn btn-primary" id="enterResultBtn">Enter Result</button>
        </div>

        <div class="results-filters">
          <div class="filter-group">
            <label for="patientIdFilter">Patient ID</label>
            <input type="text" id="patientIdFilter" placeholder="Enter patient ID...">
          </div>

          <div class="filter-group">
            <label for="loincCodeFilter">LOINC Code</label>
            <input type="text" id="loincCodeFilter" placeholder="Enter LOINC code...">
          </div>

          <div class="filter-group">
            <label for="dateFromFilter">Date From</label>
            <input type="date" id="dateFromFilter">
          </div>

          <div class="filter-group">
            <label for="dateToFilter">Date To</label>
            <input type="date" id="dateToFilter">
          </div>

          <div class="filter-group">
            <label for="criticalFilter">Critical Only</label>
            <select id="criticalFilter">
              <option value="">All Results</option>
              <option value="true">Critical Only</option>
              <option value="false">Non-Critical</option>
            </select>
          </div>

          <button type="button" class="btn btn-primary" id="searchBtn">Search</button>
          <button type="button" class="btn btn-secondary" id="clearBtn">Clear</button>
        </div>

        <div id="resultsContainer"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private async searchResults(): Promise<void> {
    try {
      const patientId = (this.container.querySelector('#patientIdFilter') as HTMLInputElement)?.value;
      const loincCode = (this.container.querySelector('#loincCodeFilter') as HTMLInputElement)?.value;
      const dateFrom = (this.container.querySelector('#dateFromFilter') as HTMLInputElement)?.value;
      const dateTo = (this.container.querySelector('#dateToFilter') as HTMLInputElement)?.value;
      const critical = (this.container.querySelector('#criticalFilter') as HTMLSelectElement)?.value;

      const criteria: any = {};
      if (patientId) criteria.patientId = patientId;
      if (loincCode) criteria.loincCode = loincCode;
      if (dateFrom) criteria.dateFrom = new Date(dateFrom);
      if (dateTo) criteria.dateTo = new Date(dateTo);
      if (critical) criteria.critical = critical === 'true';

      const results = await labService.searchResults(criteria);

      const resultsContainer = this.container.querySelector('#resultsContainer');
      if (resultsContainer) {
        this.resultViewer = new ResultViewer(resultsContainer as HTMLElement);
        this.resultViewer.setResults(results);
      }
    } catch (error) {
      console.error('Error searching results:', error);
    }
  }

  private clearFilters(): void {
    (this.container.querySelector('#patientIdFilter') as HTMLInputElement).value = '';
    (this.container.querySelector('#loincCodeFilter') as HTMLInputElement).value = '';
    (this.container.querySelector('#dateFromFilter') as HTMLInputElement).value = '';
    (this.container.querySelector('#dateToFilter') as HTMLInputElement).value = '';
    (this.container.querySelector('#criticalFilter') as HTMLSelectElement).value = '';

    const resultsContainer = this.container.querySelector('#resultsContainer');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
  }

  private attachEventListeners(): void {
    const enterResultBtn = this.container.querySelector('#enterResultBtn');
    const searchBtn = this.container.querySelector('#searchBtn');
    const clearBtn = this.container.querySelector('#clearBtn');

    if (enterResultBtn) {
      enterResultBtn.addEventListener('click', () => {
        window.location.href = '/laboratory/results/entry';
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchResults());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  destroy(): void {
    if (this.resultViewer) {
      this.resultViewer.destroy();
    }
    this.container.innerHTML = '';
  }
}
