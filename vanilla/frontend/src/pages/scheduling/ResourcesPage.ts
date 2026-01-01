/**
 * Resources Management Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from "../../services/SchedulingService";

export class ResourcesPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="resources-page">
        <div class="page-header">
          <h1>Resources</h1>
          <button class="btn btn-primary" id="addResourceBtn">+ Add Resource</button>
        </div>

        <div class="resources-list" id="resourcesList">
          <div class="loading">Loading resources...</div>
        </div>
      </div>
    `;

    await this.loadResources();
  }

  private async loadResources(): Promise<void> {
    try {
      const resources = await this.schedulingService.getResources();
      this.renderResources(resources);
    } catch (error) {
      console.error("Error loading resources:", error);
    }
  }

  private renderResources(resources: any[]): void {
    const list = document.getElementById("resourcesList")!;
    list.innerHTML = resources
      .map(
        (r) => `
      <div class="resource-item status-${r.status}" data-id="${r.id}">
        <div class="resource-info">
          <h3>${r.name}</h3>
          <p>${r.type} - ${r.facilityName}</p>
        </div>
        <div class="resource-status">${r.status}</div>
        <button class="btn btn-small">Manage</button>
      </div>
    `,
      )
      .join("");
  }

  destroy(): void {}
}
