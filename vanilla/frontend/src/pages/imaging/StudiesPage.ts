import { ImagingService } from '../../services/ImagingService';
import { StudyList } from '../../components/imaging/StudyList';

export class StudiesPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private studyList: StudyList;
  private currentFilters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.studyList = new StudyList();
  }

  async render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'studies-page';
    wrapper.innerHTML = `
      <div class="page-header">
        <h1>DICOM Studies</h1>
        <div class="header-actions">
          <button class="btn btn-secondary" data-action="upload">Upload DICOM</button>
          <button class="btn btn-primary" data-action="refresh">Refresh</button>
        </div>
      </div>

      <div class="filters-section">
        <div class="filters-group">
          <div class="filter-item">
            <label>Patient ID</label>
            <input type="text" id="filter-patient-id" class="form-input" placeholder="Search by patient ID">
          </div>

          <div class="filter-item">
            <label>Accession Number</label>
            <input type="text" id="filter-accession" class="form-input" placeholder="Search by accession">
          </div>

          <div class="filter-item">
            <label>Modality</label>
            <select id="filter-modality" class="form-select">
              <option value="">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MRI">MRI</option>
              <option value="XRAY">X-Ray</option>
              <option value="US">Ultrasound</option>
              <option value="NM">Nuclear Medicine</option>
              <option value="PET">PET</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Reading Status</label>
            <select id="filter-status" class="form-select">
              <option value="">All Statuses</option>
              <option value="UNREAD">Unread</option>
              <option value="PRELIMINARY">Preliminary</option>
              <option value="FINAL">Final</option>
              <option value="AMENDED">Amended</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Study Date From</label>
            <input type="date" id="filter-start-date" class="form-input">
          </div>

          <div class="filter-item">
            <label>Study Date To</label>
            <input type="date" id="filter-end-date" class="form-input">
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" data-action="apply-filters">Search</button>
            <button class="btn btn-secondary" data-action="clear-filters">Clear</button>
          </div>
        </div>
      </div>

      <div class="studies-section">
        <div id="studies-container"></div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();
    await this.loadStudies();
  }

  private attachEventListeners() {
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    refreshBtn?.addEventListener('click', () => this.loadStudies());

    const uploadBtn = this.container.querySelector('[data-action="upload"]');
    uploadBtn?.addEventListener('click', () => this.showUploadDialog());

    const applyFiltersBtn = this.container.querySelector('[data-action="apply-filters"]');
    applyFiltersBtn?.addEventListener('click', () => this.applyFilters());

    const clearFiltersBtn = this.container.querySelector('[data-action="clear-filters"]');
    clearFiltersBtn?.addEventListener('click', () => this.clearFilters());
  }

  private async loadStudies() {
    try {
      const studiesContainer = document.getElementById('studies-container');
      if (!studiesContainer) return;

      const studies = await this.imagingService.getStudies(this.currentFilters);
      this.studyList.render(studiesContainer, studies);
    } catch (error) {
      console.error('Error loading studies:', error);
      this.showError('Failed to load studies');
    }
  }

  private applyFilters() {
    const patientId = (document.getElementById('filter-patient-id') as HTMLInputElement)?.value;
    const accession = (document.getElementById('filter-accession') as HTMLInputElement)?.value;
    const modality = (document.getElementById('filter-modality') as HTMLSelectElement)?.value;
    const status = (document.getElementById('filter-status') as HTMLSelectElement)?.value;
    const startDate = (document.getElementById('filter-start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('filter-end-date') as HTMLInputElement)?.value;

    this.currentFilters = {
      ...(patientId && { patientId }),
      ...(accession && { accessionNumber: accession }),
      ...(modality && { modality }),
      ...(status && { readingStatus: status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };

    this.loadStudies();
  }

  private clearFilters() {
    (document.getElementById('filter-patient-id') as HTMLInputElement).value = '';
    (document.getElementById('filter-accession') as HTMLInputElement).value = '';
    (document.getElementById('filter-modality') as HTMLSelectElement).value = '';
    (document.getElementById('filter-status') as HTMLSelectElement).value = '';
    (document.getElementById('filter-start-date') as HTMLInputElement).value = '';
    (document.getElementById('filter-end-date') as HTMLInputElement).value = '';

    this.currentFilters = {};
    this.loadStudies();
  }

  private showUploadDialog() {
    // TODO: Implement DICOM upload dialog
    alert('DICOM upload dialog will open here');
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
