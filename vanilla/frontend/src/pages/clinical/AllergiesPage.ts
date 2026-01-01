// Allergies Page - Vanilla TypeScript
import ClinicalService from '../../services/ClinicalService';
import AllergyList from '../../components/clinical/AllergyList';

export class AllergiesPage {
  private container: HTMLElement;
  private patientId: string;
  private allergyList: AllergyList | null = null;

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.patientId = patientId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadAllergies();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="allergies-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Allergies</h1>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-allergy-btn">Add Allergy</button>
          </div>
        </header>

        <div class="allergy-alert">
          <strong>⚠️ Warning:</strong> Always verify allergies before prescribing medications
        </div>

        <div id="allergy-list-container"></div>

        <div id="add-allergy-modal" class="modal" style="display:none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Add Allergy</h2>
              <button class="close-btn" id="close-modal-btn">&times;</button>
            </div>
            <div class="modal-body">
              <form id="add-allergy-form">
                <div class="form-group">
                  <label for="allergen">Allergen *</label>
                  <input type="text" id="allergen" required placeholder="e.g., Penicillin">
                </div>

                <div class="form-group">
                  <label for="allergen-type">Allergen Type *</label>
                  <select id="allergen-type" required>
                    <option value="">Select type...</option>
                    <option value="medication">Medication</option>
                    <option value="food">Food</option>
                    <option value="environmental">Environmental</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="severity">Severity *</label>
                  <select id="severity" required>
                    <option value="">Select severity...</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="life-threatening">Life-Threatening</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Reactions *</label>
                  <div class="reaction-checkboxes">
                    <label><input type="checkbox" name="reaction" value="rash"> Rash</label>
                    <label><input type="checkbox" name="reaction" value="hives"> Hives</label>
                    <label><input type="checkbox" name="reaction" value="itching"> Itching</label>
                    <label><input type="checkbox" name="reaction" value="swelling"> Swelling</label>
                    <label><input type="checkbox" name="reaction" value="shortness of breath"> Shortness of Breath</label>
                    <label><input type="checkbox" name="reaction" value="anaphylaxis"> Anaphylaxis</label>
                    <label><input type="checkbox" name="reaction" value="nausea"> Nausea</label>
                    <label><input type="checkbox" name="reaction" value="other"> Other</label>
                  </div>
                  <input type="text" id="other-reaction" placeholder="Specify other reaction" style="margin-top: 10px;">
                </div>

                <div class="form-group">
                  <label for="onset-date">Onset Date</label>
                  <input type="date" id="onset-date">
                </div>

                <div class="form-group">
                  <label for="notes">Notes</label>
                  <textarea id="notes" rows="3" placeholder="Additional information about the allergy"></textarea>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Add Allergy</button>
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

  private async loadAllergies(): Promise<void> {
    try {
      const allergies = await ClinicalService.getAllergiesByPatient(this.patientId, true);

      this.allergyList = new AllergyList('allergy-list-container');
      this.allergyList.setAllergies(allergies);
    } catch (error) {
      console.error('Error loading allergies:', error);
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      window.history.back();
    });

    const addAllergyBtn = document.getElementById('add-allergy-btn');
    addAllergyBtn?.addEventListener('click', () => {
      this.showModal();
    });

    const closeModalBtn = document.getElementById('close-modal-btn');
    closeModalBtn?.addEventListener('click', () => {
      this.hideModal();
    });

    const addAllergyForm = document.getElementById('add-allergy-form') as HTMLFormElement;
    addAllergyForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addAllergy(addAllergyForm);
    });

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      this.hideModal();
    });
  }

  private showModal(): void {
    const modal = document.getElementById('add-allergy-modal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  private hideModal(): void {
    const modal = document.getElementById('add-allergy-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private async addAllergy(form: HTMLFormElement): Promise<void> {
    try {
      const reactions: string[] = [];
      const reactionCheckboxes = form.querySelectorAll('input[name="reaction"]:checked');
      reactionCheckboxes.forEach((checkbox: any) => {
        reactions.push(checkbox.value);
      });

      const otherReaction = (document.getElementById('other-reaction') as HTMLInputElement)?.value;
      if (otherReaction && reactions.includes('other')) {
        reactions[reactions.indexOf('other')] = otherReaction;
      }

      if (reactions.length === 0) {
        alert('Please select at least one reaction');
        return;
      }

      const data = {
        patientId: this.patientId,
        allergen: (document.getElementById('allergen') as HTMLInputElement)?.value,
        allergenType: (document.getElementById('allergen-type') as HTMLSelectElement)?.value,
        severity: (document.getElementById('severity') as HTMLSelectElement)?.value,
        reaction: reactions,
        onsetDate: (document.getElementById('onset-date') as HTMLInputElement)?.value || undefined,
        notes: (document.getElementById('notes') as HTMLTextAreaElement)?.value || undefined,
      };

      await ClinicalService.createAllergy(data);
      alert('Allergy added successfully');
      this.hideModal();
      form.reset();
      await this.loadAllergies();
    } catch (error) {
      console.error('Error adding allergy:', error);
      alert('Failed to add allergy');
    }
  }

  destroy(): void {
    this.allergyList?.destroy();
    this.container.innerHTML = '';
  }
}

export default AllergiesPage;
