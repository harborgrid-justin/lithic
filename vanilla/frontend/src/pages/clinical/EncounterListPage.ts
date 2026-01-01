// Encounter List Page - Vanilla TypeScript
import ClinicalService from '../../services/ClinicalService';
import EncounterList from '../../components/clinical/EncounterList';

export class EncounterListPage {
  private container: HTMLElement;
  private patientId: string;
  private encounterList: EncounterList | null = null;

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.patientId = patientId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadEncounters();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="encounter-list-page">
        <header class="page-header">
          <h1>Patient Encounters</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="new-encounter-btn">New Encounter</button>
          </div>
        </header>

        <div class="filters">
          <div class="filter-group">
            <label for="status-filter">Status:</label>
            <select id="status-filter">
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="type-filter">Type:</label>
            <select id="type-filter">
              <option value="">All Types</option>
              <option value="inpatient">Inpatient</option>
              <option value="outpatient">Outpatient</option>
              <option value="emergency">Emergency</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </div>
        </div>

        <div id="encounter-list-container" class="encounters-container"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  private async loadEncounters(): Promise<void> {
    try {
      const encounters = await ClinicalService.getEncountersByPatient(this.patientId);
      this.displayEncounters(encounters);
    } catch (error) {
      console.error('Error loading encounters:', error);
      this.showError('Failed to load encounters');
    }
  }

  private displayEncounters(encounters: any[]): void {
    this.encounterList = new EncounterList('encounter-list-container', (encounterId) => {
      this.navigateToEncounter(encounterId);
    });

    this.encounterList.setEncounters(encounters);
  }

  private attachEventListeners(): void {
    const newEncounterBtn = document.getElementById('new-encounter-btn');
    newEncounterBtn?.addEventListener('click', () => {
      this.navigateToNewEncounter();
    });

    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    statusFilter?.addEventListener('change', () => {
      this.applyFilters();
    });

    const typeFilter = document.getElementById('type-filter') as HTMLSelectElement;
    typeFilter?.addEventListener('change', () => {
      this.applyFilters();
    });
  }

  private async applyFilters(): Promise<void> {
    // Reload encounters with filters
    await this.loadEncounters();
  }

  private navigateToEncounter(encounterId: string): void {
    window.location.href = `/clinical/encounters/${encounterId}`;
  }

  private navigateToNewEncounter(): void {
    window.location.href = '/clinical/encounters/new';
  }

  private showError(message: string): void {
    const container = document.getElementById('encounter-list-container');
    if (container) {
      container.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  destroy(): void {
    this.encounterList?.destroy();
    this.container.innerHTML = '';
  }
}

export default EncounterListPage;
