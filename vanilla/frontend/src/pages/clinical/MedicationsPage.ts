// Medications Page - Vanilla TypeScript
import ClinicalService from '../../services/ClinicalService';
import MedicationList from '../../components/clinical/MedicationList';

export class MedicationsPage {
  private container: HTMLElement;
  private patientId: string;
  private medicationList: MedicationList | null = null;

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.patientId = patientId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadMedications();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="medications-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Medications</h1>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-medication-btn">Prescribe Medication</button>
          </div>
        </header>

        <div class="filter-section">
          <label>
            <input type="checkbox" id="active-only-checkbox" checked>
            Show active medications only
          </label>
        </div>

        <div id="medication-list-container"></div>

        <div id="add-medication-modal" class="modal" style="display:none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Prescribe Medication</h2>
              <button class="close-btn" id="close-modal-btn">&times;</button>
            </div>
            <div class="modal-body">
              <form id="add-medication-form">
                <div class="form-group">
                  <label for="medication-name">Medication Name *</label>
                  <input type="text" id="medication-name" required placeholder="e.g., Lisinopril">
                </div>

                <div class="form-group">
                  <label for="generic-name">Generic Name</label>
                  <input type="text" id="generic-name" placeholder="e.g., lisinopril">
                </div>

                <div class="form-group">
                  <label for="dosage">Dosage *</label>
                  <input type="text" id="dosage" required placeholder="e.g., 10 mg">
                </div>

                <div class="form-group">
                  <label for="route">Route *</label>
                  <select id="route" required>
                    <option value="">Select route...</option>
                    <option value="oral">Oral</option>
                    <option value="IV">Intravenous (IV)</option>
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="subcutaneous">Subcutaneous</option>
                    <option value="topical">Topical</option>
                    <option value="inhalation">Inhalation</option>
                    <option value="rectal">Rectal</option>
                    <option value="ophthalmic">Ophthalmic</option>
                    <option value="otic">Otic</option>
                    <option value="transdermal">Transdermal</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="frequency">Frequency *</label>
                  <select id="frequency" required>
                    <option value="">Select frequency...</option>
                    <option value="once daily">Once Daily</option>
                    <option value="twice daily">Twice Daily</option>
                    <option value="three times daily">Three Times Daily</option>
                    <option value="four times daily">Four Times Daily</option>
                    <option value="every 4 hours">Every 4 Hours</option>
                    <option value="every 6 hours">Every 6 Hours</option>
                    <option value="every 8 hours">Every 8 Hours</option>
                    <option value="every 12 hours">Every 12 Hours</option>
                    <option value="as needed">As Needed (PRN)</option>
                    <option value="weekly">Weekly</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="text" id="frequency-other" placeholder="Specify frequency" style="margin-top: 10px; display:none;">
                </div>

                <div class="form-group">
                  <label for="start-date">Start Date *</label>
                  <input type="date" id="start-date" required>
                </div>

                <div class="form-group">
                  <label for="end-date">End Date</label>
                  <input type="date" id="end-date">
                </div>

                <div class="form-group">
                  <label for="indication">Indication</label>
                  <input type="text" id="indication" placeholder="Reason for prescription">
                </div>

                <div class="form-group">
                  <label for="refills">Refills</label>
                  <input type="number" id="refills" min="0" max="12" value="0">
                </div>

                <div class="form-group">
                  <label for="quantity">Quantity</label>
                  <input type="number" id="quantity" min="1" placeholder="e.g., 30">
                </div>

                <div class="form-group">
                  <label for="instructions">Instructions</label>
                  <textarea id="instructions" rows="3" placeholder="e.g., Take with food, avoid alcohol"></textarea>
                </div>

                <div class="form-group">
                  <label for="pharmacy">Pharmacy</label>
                  <input type="text" id="pharmacy" placeholder="Preferred pharmacy">
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Prescribe</button>
                  <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private async loadMedications(): Promise<void> {
    try {
      const activeOnly = (document.getElementById('active-only-checkbox') as HTMLInputElement)?.checked ?? true;
      const medications = await ClinicalService.getMedicationsByPatient(this.patientId, activeOnly);

      this.medicationList = new MedicationList('medication-list-container', async (medicationId, status) => {
        await this.updateMedicationStatus(medicationId, status);
      });

      this.medicationList.setMedications(medications);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  }

  private async updateMedicationStatus(medicationId: string, status: string): Promise<void> {
    try {
      await ClinicalService.updateMedication(medicationId, { status });
      await this.loadMedications();
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Failed to update medication');
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      window.history.back();
    });

    const addMedicationBtn = document.getElementById('add-medication-btn');
    addMedicationBtn?.addEventListener('click', () => {
      this.showModal();
    });

    const closeModalBtn = document.getElementById('close-modal-btn');
    closeModalBtn?.addEventListener('click', () => {
      this.hideModal();
    });

    const activeOnlyCheckbox = document.getElementById('active-only-checkbox');
    activeOnlyCheckbox?.addEventListener('change', async () => {
      await this.loadMedications();
    });

    const frequencySelect = document.getElementById('frequency') as HTMLSelectElement;
    frequencySelect?.addEventListener('change', (e) => {
      const otherInput = document.getElementById('frequency-other') as HTMLInputElement;
      if ((e.target as HTMLSelectElement).value === 'other') {
        otherInput.style.display = 'block';
      } else {
        otherInput.style.display = 'none';
      }
    });

    const addMedicationForm = document.getElementById('add-medication-form') as HTMLFormElement;
    addMedicationForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addMedication(addMedicationForm);
    });

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      this.hideModal();
    });
  }

  private showModal(): void {
    const modal = document.getElementById('add-medication-modal');
    if (modal) {
      modal.style.display = 'block';
      // Set default start date to today
      const startDateInput = document.getElementById('start-date') as HTMLInputElement;
      if (startDateInput) {
        startDateInput.value = new Date().toISOString().split('T')[0];
      }
    }
  }

  private hideModal(): void {
    const modal = document.getElementById('add-medication-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private async addMedication(form: HTMLFormElement): Promise<void> {
    try {
      let frequency = (document.getElementById('frequency') as HTMLSelectElement)?.value;
      if (frequency === 'other') {
        frequency = (document.getElementById('frequency-other') as HTMLInputElement)?.value;
      }

      const data = {
        patientId: this.patientId,
        medicationName: (document.getElementById('medication-name') as HTMLInputElement)?.value,
        genericName: (document.getElementById('generic-name') as HTMLInputElement)?.value || undefined,
        dosage: (document.getElementById('dosage') as HTMLInputElement)?.value,
        route: (document.getElementById('route') as HTMLSelectElement)?.value,
        frequency,
        startDate: (document.getElementById('start-date') as HTMLInputElement)?.value,
        endDate: (document.getElementById('end-date') as HTMLInputElement)?.value || undefined,
        indication: (document.getElementById('indication') as HTMLInputElement)?.value || undefined,
        refills: parseInt((document.getElementById('refills') as HTMLInputElement)?.value) || 0,
        quantity: parseInt((document.getElementById('quantity') as HTMLInputElement)?.value) || undefined,
        instructions: (document.getElementById('instructions') as HTMLTextAreaElement)?.value || undefined,
        pharmacy: (document.getElementById('pharmacy') as HTMLInputElement)?.value || undefined,
      };

      await ClinicalService.createMedication(data);
      alert('Medication prescribed successfully');
      this.hideModal();
      form.reset();
      await this.loadMedications();
    } catch (error) {
      console.error('Error prescribing medication:', error);
      alert('Failed to prescribe medication');
    }
  }

  destroy(): void {
    this.medicationList?.destroy();
    this.container.innerHTML = '';
  }
}

export default MedicationsPage;
