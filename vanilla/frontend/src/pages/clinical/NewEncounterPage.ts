// New Encounter Page - Vanilla TypeScript
import ClinicalService from '../../services/ClinicalService';
import EncounterForm from '../../components/clinical/EncounterForm';

export class NewEncounterPage {
  private container: HTMLElement;
  private encounterForm: EncounterForm | null = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
  }

  async init(): Promise<void> {
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="new-encounter-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>New Encounter</h1>
          </div>
        </header>

        <div class="page-content">
          <div id="encounter-form-container"></div>
        </div>
      </div>
    `;

    this.encounterForm = new EncounterForm('encounter-form-container', async (data) => {
      await this.createEncounter(data);
    });

    this.attachEventListeners();
  }

  private async createEncounter(data: any): Promise<void> {
    try {
      const encounter = await ClinicalService.createEncounter(data);
      alert('Encounter created successfully');
      window.location.href = `/clinical/encounters/${encounter.id}`;
    } catch (error) {
      console.error('Error creating encounter:', error);
      alert('Failed to create encounter');
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      window.history.back();
    });
  }

  destroy(): void {
    this.encounterForm?.destroy();
    this.container.innerHTML = '';
  }
}

export default NewEncounterPage;
