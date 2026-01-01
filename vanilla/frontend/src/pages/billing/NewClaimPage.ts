/**
 * NewClaimPage - Create new claim form
 */

import { BillingService } from '../../services/BillingService';

export class NewClaimPage {
  private container: HTMLElement;
  private billingService: BillingService;
  private lineItems: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.billingService = new BillingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="new-claim-page">
        <div class="page-header">
          <h1>New Claim</h1>
        </div>

        <form id="claimForm" class="claim-form">
          <div class="form-section">
            <h3>Patient Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient *</label>
                <select id="patientSelect" required>
                  <option value="">Select Patient...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Subscriber/Member ID *</label>
                <input type="text" id="subscriberId" required />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Provider & Payer</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Rendering Provider *</label>
                <select id="providerSelect" required>
                  <option value="">Select Provider...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Insurance Payer *</label>
                <select id="payerSelect" required>
                  <option value="">Select Payer...</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Service Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Service Date *</label>
                <input type="date" id="serviceDate" required />
              </div>
              <div class="form-group">
                <label>Place of Service *</label>
                <select id="placeOfService" required>
                  <option value="11">Office</option>
                  <option value="21">Inpatient Hospital</option>
                  <option value="22">Outpatient Hospital</option>
                  <option value="23">Emergency Room</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Diagnosis Codes</h3>
            <div id="diagnosisContainer">
              <button type="button" class="btn btn-secondary" id="addDiagnosisBtn">
                <i class="icon-plus"></i> Add Diagnosis
              </button>
            </div>
          </div>

          <div class="form-section">
            <h3>Service Lines</h3>
            <div id="lineItemsContainer"></div>
            <button type="button" class="btn btn-secondary" id="addLineItemBtn">
              <i class="icon-plus"></i> Add Service Line
            </button>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
            <button type="button" class="btn btn-secondary" id="saveDraftBtn">Save Draft</button>
            <button type="submit" class="btn btn-primary">Create & Submit</button>
          </div>
        </form>
      </div>
    `;

    await this.loadFormOptions();
    this.attachEventListeners();
    this.addLineItem(); // Add initial line item
  }

  private async loadFormOptions(): Promise<void> {
    const [patients, providers, payers] = await Promise.all([
      this.billingService.getPatients(),
      this.billingService.getProviders(),
      this.billingService.getPayers()
    ]);

    const patientSelect = document.getElementById('patientSelect') as HTMLSelectElement;
    patients.forEach((p: any) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} (${p.dob})`;
      patientSelect?.appendChild(option);
    });

    const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement;
    providers.forEach((p: any) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      providerSelect?.appendChild(option);
    });

    const payerSelect = document.getElementById('payerSelect') as HTMLSelectElement;
    payers.forEach((p: any) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      payerSelect?.appendChild(option);
    });
  }

  private attachEventListeners(): void {
    const form = document.getElementById('claimForm') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(true);
    });

    document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
      this.handleSubmit(false);
    });

    document.getElementById('addLineItemBtn')?.addEventListener('click', () => {
      this.addLineItem();
    });

    document.getElementById('addDiagnosisBtn')?.addEventListener('click', () => {
      this.addDiagnosis();
    });
  }

  private addLineItem(): void {
    const container = document.getElementById('lineItemsContainer');
    const index = this.lineItems.length;

    const lineItemHtml = `
      <div class="line-item" data-index="${index}">
        <div class="line-item-header">
          <h4>Line ${index + 1}</h4>
          <button type="button" class="btn-icon" onclick="this.closest('.line-item').remove()">
            <i class="icon-trash"></i>
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>CPT Code</label>
            <input type="text" class="cpt-code" placeholder="99213" />
          </div>
          <div class="form-group">
            <label>Modifiers</label>
            <input type="text" class="modifiers" placeholder="25, 59" />
          </div>
          <div class="form-group">
            <label>Units</label>
            <input type="number" class="units" value="1" min="1" />
          </div>
          <div class="form-group">
            <label>Charge</label>
            <input type="number" class="charge" step="0.01" placeholder="150.00" />
          </div>
        </div>
      </div>
    `;

    container?.insertAdjacentHTML('beforeend', lineItemHtml);
    this.lineItems.push({});
  }

  private addDiagnosis(): void {
    const container = document.getElementById('diagnosisContainer');
    const diagnosisHtml = `
      <div class="diagnosis-item">
        <input type="text" placeholder="ICD-10 Code (e.g., I10)" class="diagnosis-code" />
        <button type="button" class="btn-icon" onclick="this.parentElement.remove()">
          <i class="icon-trash"></i>
        </button>
      </div>
    `;
    container?.insertAdjacentHTML('afterbegin', diagnosisHtml);
  }

  private async handleSubmit(submit: boolean): Promise<void> {
    const formData = this.getFormData();

    try {
      const claim = await this.billingService.createClaim(formData);

      if (submit) {
        await this.billingService.submitClaim(claim.id);
        alert('Claim created and submitted successfully');
      } else {
        alert('Claim saved as draft');
      }

      window.location.hash = `#/billing/claims/${claim.id}`;
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Failed to create claim');
    }
  }

  private getFormData(): any {
    return {
      patientId: (document.getElementById('patientSelect') as HTMLSelectElement).value,
      subscriberId: (document.getElementById('subscriberId') as HTMLInputElement).value,
      providerId: (document.getElementById('providerSelect') as HTMLSelectElement).value,
      payerId: (document.getElementById('payerSelect') as HTMLSelectElement).value,
      serviceDate: (document.getElementById('serviceDate') as HTMLInputElement).value,
      placeOfService: (document.getElementById('placeOfService') as HTMLSelectElement).value,
      diagnosisCodes: this.getDiagnosisCodes(),
      lineItems: this.getLineItems()
    };
  }

  private getDiagnosisCodes(): string[] {
    const inputs = document.querySelectorAll('.diagnosis-code') as NodeListOf<HTMLInputElement>;
    return Array.from(inputs).map(input => input.value).filter(v => v);
  }

  private getLineItems(): any[] {
    const lineItems: any[] = [];
    const containers = document.querySelectorAll('.line-item');

    containers.forEach(container => {
      lineItems.push({
        procedureCode: (container.querySelector('.cpt-code') as HTMLInputElement).value,
        modifiers: (container.querySelector('.modifiers') as HTMLInputElement).value.split(',').map(m => m.trim()),
        units: parseInt((container.querySelector('.units') as HTMLInputElement).value),
        charge: parseFloat((container.querySelector('.charge') as HTMLInputElement).value)
      });
    });

    return lineItems;
  }
}
