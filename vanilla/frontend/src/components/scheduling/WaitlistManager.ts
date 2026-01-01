/**
 * Waitlist Manager Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from "../../services/SchedulingService";

export class WaitlistManager {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    const waitlist = await this.schedulingService.getWaitlist();

    this.container.innerHTML = `
      <div class="waitlist-manager">
        <div class="waitlist-filters">
          <select id="priorityFilter">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select id="statusFilter">
            <option value="active">Active</option>
            <option value="notified">Notified</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <div class="waitlist-entries">
          ${this.renderWaitlistEntries(waitlist)}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderWaitlistEntries(entries: any[]): string {
    return entries
      .map(
        (entry) => `
      <div class="waitlist-entry priority-${entry.priority}" data-id="${entry.id}">
        <div class="entry-header">
          <span class="priority-badge">${entry.priority}</span>
          <span class="patient-name">${entry.patientName}</span>
        </div>
        <div class="entry-details">
          <div>${entry.appointmentType}</div>
          <div>${entry.reason}</div>
          <div class="added-date">Added: ${new Date(entry.addedAt).toLocaleDateString()}</div>
        </div>
        <div class="entry-actions">
          <button class="btn-small" data-action="find-slots" data-id="${entry.id}">Find Slots</button>
          <button class="btn-small" data-action="notify" data-id="${entry.id}">Notify</button>
          <button class="btn-small" data-action="remove" data-id="${entry.id}">Remove</button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  private attachEventListeners(): void {
    this.container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        const id = (e.currentTarget as HTMLElement).dataset.id;
        await this.handleAction(action!, id!);
      });
    });
  }

  private async handleAction(action: string, id: string): Promise<void> {
    switch (action) {
      case "find-slots":
        // Open find slots modal
        break;
      case "notify":
        await this.schedulingService.notifyWaitlistEntry(id);
        break;
      case "remove":
        await this.schedulingService.removeFromWaitlist(id);
        await this.render();
        break;
    }
  }

  destroy(): void {}
}
