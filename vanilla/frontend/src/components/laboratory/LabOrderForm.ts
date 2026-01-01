/**
 * Lab Order Form Component
 * Form for creating new laboratory orders
 */

export class LabOrderForm {
  private container: HTMLElement;
  private onSubmit?: (orderData: any) => void;
  private panels: any[] = [];

  constructor(container: HTMLElement, options: { onSubmit?: (orderData: any) => void } = {}) {
    this.container = container;
    this.onSubmit = options.onSubmit;
  }

  setPanels(panels: any[]): void {
    this.panels = panels;
    this.render();
  }

  private render(): void {
    const html = `
      <div class="lab-order-form">
        <form id="labOrderForm">
          <div class="form-section">
            <h3>Patient Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="patientId">Patient ID*</label>
                <input type="text" id="patientId" name="patientId" required>
              </div>
              <div class="form-group">
                <label for="patientName">Patient Name*</label>
                <input type="text" id="patientName" name="patientName" required>
              </div>
              <div class="form-group">
                <label for="patientMRN">MRN*</label>
                <input type="text" id="patientMRN" name="patientMRN" required>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Provider Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="orderingProviderId">Provider ID*</label>
                <input type="text" id="orderingProviderId" name="orderingProviderId" required>
              </div>
              <div class="form-group">
                <label for="orderingProviderName">Provider Name*</label>
                <input type="text" id="orderingProviderName" name="orderingProviderName" required>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Order Details</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="priority">Priority*</label>
                <select id="priority" name="priority" required>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                  <option value="asap">ASAP</option>
                </select>
              </div>
              <div class="form-group">
                <label for="orderDateTime">Order Date/Time*</label>
                <input type="datetime-local" id="orderDateTime" name="orderDateTime" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="panelSelect">Select Panel</label>
                <select id="panelSelect" name="panelSelect">
                  <option value="">-- Custom Order --</option>
                  ${this.panels.map(panel => `
                    <option value="${panel.id}">${panel.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="clinicalInfo">Clinical Information</label>
                <textarea id="clinicalInfo" name="clinicalInfo" rows="3"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="diagnosis">Diagnosis</label>
                <textarea id="diagnosis" name="diagnosis" rows="2"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    this.setDefaultDateTime();
  }

  private setDefaultDateTime(): void {
    const dateTimeInput = this.container.querySelector('#orderDateTime') as HTMLInputElement;
    if (dateTimeInput) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      dateTimeInput.value = localDateTime;
    }
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#labOrderForm') as HTMLFormElement;
    const cancelBtn = this.container.querySelector('#cancelBtn');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(form);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        form?.reset();
        this.setDefaultDateTime();
      });
    }
  }

  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const orderData: any = {
      patientId: formData.get('patientId'),
      patientName: formData.get('patientName'),
      patientMRN: formData.get('patientMRN'),
      orderingProviderId: formData.get('orderingProviderId'),
      orderingProviderName: formData.get('orderingProviderName'),
      priority: formData.get('priority'),
      orderDateTime: new Date(formData.get('orderDateTime') as string),
      clinicalInfo: formData.get('clinicalInfo') || undefined,
      diagnosis: formData.get('diagnosis') || undefined,
      tests: []
    };

    if (this.onSubmit) {
      this.onSubmit(orderData);
    }
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
