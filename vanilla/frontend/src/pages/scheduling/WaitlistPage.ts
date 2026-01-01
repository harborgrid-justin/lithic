/**
 * Waitlist Management Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';
import { WaitlistManager } from '../../components/scheduling/WaitlistManager';

export class WaitlistPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;
  private waitlistManager: WaitlistManager | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="waitlist-page">
        <div class="page-header">
          <h1>Waitlist Management</h1>
          <button class="btn btn-primary" id="addToWaitlistBtn">+ Add to Waitlist</button>
        </div>

        <div id="waitlistContainer"></div>
      </div>
    `;

    const container = document.getElementById('waitlistContainer')!;
    this.waitlistManager = new WaitlistManager(container);
    await this.waitlistManager.render();
  }

  destroy(): void {
    this.waitlistManager?.destroy();
  }
}
