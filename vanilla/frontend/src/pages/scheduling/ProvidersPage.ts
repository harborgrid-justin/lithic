/**
 * Providers Management Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';

export class ProvidersPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="providers-page">
        <div class="page-header">
          <h1>Providers</h1>
          <button class="btn btn-primary" id="addProviderBtn">+ Add Provider</button>
        </div>

        <div class="providers-grid" id="providersGrid">
          <div class="loading">Loading providers...</div>
        </div>
      </div>
    `;

    await this.loadProviders();
  }

  private async loadProviders(): Promise<void> {
    try {
      const providers = await this.schedulingService.getProviders();
      this.renderProviders(providers);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  }

  private renderProviders(providers: any[]): void {
    const grid = document.getElementById('providersGrid')!;
    grid.innerHTML = providers.map(p => `
      <div class="provider-card" data-id="${p.id}">
        <div class="provider-avatar">${p.firstName.charAt(0)}${p.lastName.charAt(0)}</div>
        <h3>${p.fullName}</h3>
        <p class="specialty">${p.specialty}</p>
        <p class="status ${p.acceptingNewPatients ? 'accepting' : ''}">
          ${p.acceptingNewPatients ? 'Accepting New Patients' : 'Not Accepting Patients'}
        </p>
        <button class="btn btn-small" onclick="window.location.hash='/scheduling/providers/${p.id}'">View Schedule</button>
      </div>
    `).join('');
  }

  destroy(): void {}
}
