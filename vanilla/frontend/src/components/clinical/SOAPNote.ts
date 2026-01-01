// SOAP Note Component - Vanilla TypeScript
export class SOAPNote {
  private container: HTMLElement;
  private data: any = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  };
  private onChange?: (data: any) => void;
  private readOnly: boolean = false;

  constructor(containerId: string, onChange?: (data: any) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onChange = onChange;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="soap-note">
        <div class="soap-section">
          <div class="soap-header">
            <h3>S - Subjective</h3>
            <span class="soap-subtitle">Patient's description of symptoms</span>
          </div>
          <textarea
            id="subjective"
            class="soap-textarea"
            rows="6"
            placeholder="Chief complaint, history of present illness, review of systems..."
            ${this.readOnly ? 'readonly' : ''}
          >${this.data.subjective}</textarea>
        </div>

        <div class="soap-section">
          <div class="soap-header">
            <h3>O - Objective</h3>
            <span class="soap-subtitle">Observable clinical findings</span>
          </div>
          <textarea
            id="objective"
            class="soap-textarea"
            rows="6"
            placeholder="Vital signs, physical examination, laboratory and imaging results..."
            ${this.readOnly ? 'readonly' : ''}
          >${this.data.objective}</textarea>
        </div>

        <div class="soap-section">
          <div class="soap-header">
            <h3>A - Assessment</h3>
            <span class="soap-subtitle">Clinical assessment and diagnoses</span>
          </div>
          <textarea
            id="assessment"
            class="soap-textarea"
            rows="6"
            placeholder="Primary and secondary diagnoses, clinical impressions, ICD-10 codes..."
            ${this.readOnly ? 'readonly' : ''}
          >${this.data.assessment}</textarea>
        </div>

        <div class="soap-section">
          <div class="soap-header">
            <h3>P - Plan</h3>
            <span class="soap-subtitle">Treatment plan and follow-up</span>
          </div>
          <textarea
            id="plan"
            class="soap-textarea"
            rows="6"
            placeholder="Treatment plan, medications, orders, follow-up instructions..."
            ${this.readOnly ? 'readonly' : ''}
          >${this.data.plan}</textarea>
        </div>
      </div>
    `;

    if (!this.readOnly) {
      this.attachEventListeners();
    }
  }

  private attachEventListeners(): void {
    const textareas = this.container.querySelectorAll('.soap-textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', () => {
        this.updateData();
      });
    });
  }

  private updateData(): void {
    this.data.subjective = (this.container.querySelector('#subjective') as HTMLTextAreaElement)?.value || '';
    this.data.objective = (this.container.querySelector('#objective') as HTMLTextAreaElement)?.value || '';
    this.data.assessment = (this.container.querySelector('#assessment') as HTMLTextAreaElement)?.value || '';
    this.data.plan = (this.container.querySelector('#plan') as HTMLTextAreaElement)?.value || '';

    if (this.onChange) {
      this.onChange(this.data);
    }
  }

  setData(data: any): void {
    this.data = { ...data };
    this.render();
  }

  getData(): any {
    return { ...this.data };
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
    this.render();
  }

  clear(): void {
    this.data = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };
    this.render();
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default SOAPNote;
