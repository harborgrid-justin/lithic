/**
 * Appointment Templates Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';

export class TemplatesPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="templates-page">
        <div class="page-header">
          <h1>Appointment Templates</h1>
          <button class="btn btn-primary" id="createTemplateBtn">+ Create Template</button>
        </div>

        <div class="templates-grid" id="templatesGrid">
          <div class="loading">Loading templates...</div>
        </div>
      </div>
    `;

    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templates = await this.schedulingService.getRecurringTemplates();
      this.renderTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  private renderTemplates(templates: any[]): void {
    const grid = document.getElementById('templatesGrid')!;
    grid.innerHTML = templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <div class="template-details">
          <span>Type: ${t.appointmentType}</span>
          <span>Duration: ${t.duration} min</span>
          <span>Pattern: ${t.recurrencePattern.frequency}</span>
        </div>
        <button class="btn btn-small">Use Template</button>
      </div>
    `).join('');
  }

  destroy(): void {}
}
