// Notes Page - Vanilla TypeScript
import ClinicalService from '../../services/ClinicalService';
import SOAPNote from '../../components/clinical/SOAPNote';
import NoteEditor from '../../components/clinical/NoteEditor';

export class NotesPage {
  private container: HTMLElement;
  private encounterId: string;
  private patientId: string;
  private soapNote: SOAPNote | null = null;
  private noteEditor: NoteEditor | null = null;
  private selectedTemplate: string = '';

  constructor(containerId: string, encounterId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.encounterId = encounterId;
    this.patientId = patientId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadTemplates();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="notes-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Clinical Note</h1>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" id="save-draft-btn">Save Draft</button>
            <button class="btn btn-primary" id="sign-note-btn">Sign Note</button>
          </div>
        </header>

        <div class="note-form">
          <div class="form-group">
            <label for="note-type">Note Type</label>
            <select id="note-type" class="form-control">
              <option value="progress">Progress Note</option>
              <option value="soap">SOAP Note</option>
              <option value="admission">Admission Note</option>
              <option value="discharge">Discharge Summary</option>
              <option value="consult">Consultation Note</option>
              <option value="procedure">Procedure Note</option>
            </select>
          </div>

          <div class="form-group">
            <label for="template-select">Template (Optional)</label>
            <select id="template-select" class="form-control">
              <option value="">No Template</option>
            </select>
          </div>

          <div id="note-editor-container"></div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.initializeEditor();
  }

  private initializeEditor(): void {
    const noteType = (document.getElementById('note-type') as HTMLSelectElement)?.value;

    if (noteType === 'soap') {
      this.soapNote = new SOAPNote('note-editor-container');
    } else {
      this.noteEditor = new NoteEditor('note-editor-container');
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templates = await ClinicalService.getTemplates('note');
      const templateSelect = document.getElementById('template-select') as HTMLSelectElement;

      if (templateSelect) {
        templates.forEach((template: any) => {
          const option = document.createElement('option');
          option.value = template.id;
          option.textContent = template.name;
          templateSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      window.history.back();
    });

    const noteTypeSelect = document.getElementById('note-type') as HTMLSelectElement;
    noteTypeSelect?.addEventListener('change', () => {
      this.initializeEditor();
    });

    const templateSelect = document.getElementById('template-select') as HTMLSelectElement;
    templateSelect?.addEventListener('change', (e) => {
      this.selectedTemplate = (e.target as HTMLSelectElement).value;
      // Load template content if needed
    });

    const saveDraftBtn = document.getElementById('save-draft-btn');
    saveDraftBtn?.addEventListener('click', async () => {
      await this.saveNote(false);
    });

    const signNoteBtn = document.getElementById('sign-note-btn');
    signNoteBtn?.addEventListener('click', async () => {
      await this.saveNote(true);
    });
  }

  private async saveNote(shouldSign: boolean): Promise<void> {
    try {
      const noteType = (document.getElementById('note-type') as HTMLSelectElement)?.value;
      let noteData: any = {
        encounterId: this.encounterId,
        patientId: this.patientId,
        providerId: 'current-provider',
        noteType,
        template: this.selectedTemplate || undefined,
      };

      if (noteType === 'soap' && this.soapNote) {
        const soapData = this.soapNote.getData();
        noteData = {
          ...noteData,
          ...soapData,
          content: `S: ${soapData.subjective}\n\nO: ${soapData.objective}\n\nA: ${soapData.assessment}\n\nP: ${soapData.plan}`,
        };
      } else if (this.noteEditor) {
        noteData.content = this.noteEditor.getContent();
      }

      const note = await ClinicalService.createNote(noteData);

      if (shouldSign) {
        const password = prompt('Enter password to sign note:');
        if (password) {
          await ClinicalService.signNote(note.id, {
            userId: 'current-provider',
            password,
          });
          alert('Note signed successfully');
        }
      } else {
        alert('Note saved as draft');
      }

      window.history.back();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  }

  destroy(): void {
    this.soapNote?.destroy();
    this.noteEditor?.destroy();
    this.container.innerHTML = '';
  }
}

export default NotesPage;
