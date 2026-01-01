export class ReportEditor {
  private container: HTMLElement | null = null;
  private reportData: any = {};
  private onSave?: (data: any) => Promise<void>;

  constructor() {}

  async render(container: HTMLElement, reportData?: any, onSave?: (data: any) => Promise<void>) {
    this.container = container;
    this.reportData = reportData || {};
    this.onSave = onSave;

    container.innerHTML = `
      <div class="report-editor">
        <form id="report-form">
          <div class="form-section">
            <h3>Report Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="report-type">Report Type</label>
                <select id="report-type" name="reportType" class="form-select" required>
                  <option value="PRELIMINARY">Preliminary</option>
                  <option value="FINAL">Final</option>
                  <option value="ADDENDUM">Addendum</option>
                  <option value="CORRECTION">Correction</option>
                </select>
              </div>

              <div class="form-group">
                <label for="critical-result">Critical Result</label>
                <input type="checkbox" id="critical-result" name="criticalResult">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Clinical History</h3>
            <div class="form-group">
              <textarea id="clinical-history" name="clinicalHistory" class="form-textarea" rows="3">${this.reportData.clinicalHistory || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Technique</h3>
            <div class="form-group">
              <textarea id="technique" name="technique" class="form-textarea" rows="3">${this.reportData.technique || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Comparison</h3>
            <div class="form-group">
              <textarea id="comparison" name="comparison" class="form-textarea" rows="2">${this.reportData.comparison || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Findings *</h3>
            <div class="form-group">
              <div class="editor-toolbar">
                <button type="button" class="btn btn-sm" data-action="voice-dictation">🎤 Voice Dictation</button>
                <button type="button" class="btn btn-sm" data-action="insert-template">📋 Template</button>
                <button type="button" class="btn btn-sm" data-action="insert-measurement">📏 Insert Measurement</button>
              </div>
              <textarea id="findings" name="findings" class="form-textarea editor-main" rows="10" required>${this.reportData.findings || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Impression *</h3>
            <div class="form-group">
              <textarea id="impression" name="impression" class="form-textarea" rows="5" required>${this.reportData.impression || ''}</textarea>
            </div>
          </div>

          <div class="form-section">
            <h3>Recommendation</h3>
            <div class="form-group">
              <textarea id="recommendation" name="recommendation" class="form-textarea" rows="3">${this.reportData.recommendation || ''}</textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" data-action="save-draft">Save Draft</button>
            <button type="button" class="btn btn-primary" data-action="sign">Sign and Finalize</button>
          </div>
        </form>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    if (!this.container) return;

    const form = this.container.querySelector('#report-form') as HTMLFormElement;

    // Voice dictation
    const voiceBtn = this.container.querySelector('[data-action="voice-dictation"]');
    voiceBtn?.addEventListener('click', () => this.startVoiceDictation());

    // Template insertion
    const templateBtn = this.container.querySelector('[data-action="insert-template"]');
    templateBtn?.addEventListener('click', () => this.insertTemplate());

    // Measurement insertion
    const measurementBtn = this.container.querySelector('[data-action="insert-measurement"]');
    measurementBtn?.addEventListener('click', () => this.insertMeasurement());

    // Save draft
    const saveDraftBtn = this.container.querySelector('[data-action="save-draft"]');
    saveDraftBtn?.addEventListener('click', async () => {
      const data = this.getFormData(form);
      data.status = 'DRAFT';
      await this.saveReport(data);
    });

    // Sign and finalize
    const signBtn = this.container.querySelector('[data-action="sign"]');
    signBtn?.addEventListener('click', async () => {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = this.getFormData(form);
      data.status = 'FINAL';
      await this.signReport(data);
    });
  }

  private getFormData(form: HTMLFormElement): any {
    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      if (key === 'criticalResult') {
        data[key] = formData.get(key) === 'on';
      } else {
        data[key] = value;
      }
    });

    return data;
  }

  private async saveReport(data: any) {
    if (this.onSave) {
      await this.onSave(data);
      alert('Report saved as draft');
    }
  }

  private async signReport(data: any) {
    if (!confirm('Sign and finalize this report? This action cannot be undone.')) {
      return;
    }

    if (this.onSave) {
      await this.onSave(data);
      alert('Report signed and finalized');
    }
  }

  private startVoiceDictation() {
    // TODO: Implement Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const findingsTextarea = this.container?.querySelector('#findings') as HTMLTextAreaElement;
        if (findingsTextarea) {
          findingsTextarea.value += transcript + ' ';
        }
      };

      recognition.start();
      alert('Voice dictation started. Speak into your microphone.');
    } else {
      alert('Voice recognition not supported in this browser');
    }
  }

  private insertTemplate() {
    // TODO: Show template selection dialog
    const template = `
TECHNIQUE:
[Describe imaging technique]

FINDINGS:
[Describe findings]

IMPRESSION:
[Provide impression]
    `.trim();

    const findingsTextarea = this.container?.querySelector('#findings') as HTMLTextAreaElement;
    if (findingsTextarea && !findingsTextarea.value) {
      findingsTextarea.value = template;
    }
  }

  private insertMeasurement() {
    // TODO: Get measurements from viewer
    const measurement = '[Measurement: 12.5 mm]';

    const findingsTextarea = this.container?.querySelector('#findings') as HTMLTextAreaElement;
    if (findingsTextarea) {
      const cursorPos = findingsTextarea.selectionStart;
      const textBefore = findingsTextarea.value.substring(0, cursorPos);
      const textAfter = findingsTextarea.value.substring(cursorPos);
      findingsTextarea.value = textBefore + measurement + textAfter;
    }
  }
}
