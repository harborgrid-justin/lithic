// Clinical Dashboard Page - Vanilla TypeScript
import ClinicalService from "../../services/ClinicalService";
import EncounterList from "../../components/clinical/EncounterList";

export class ClinicalDashboardPage {
  private container: HTMLElement;
  private providerId: string;
  private encounterList: EncounterList | null = null;

  constructor(containerId: string, providerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.providerId = providerId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadDashboardData();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="clinical-dashboard">
        <header class="dashboard-header">
          <h1>Clinical Dashboard</h1>
          <div class="dashboard-actions">
            <button class="btn btn-primary" id="new-encounter-btn">New Encounter</button>
          </div>
        </header>

        <div class="dashboard-stats" id="dashboard-stats">
          <div class="stat-card loading">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="dashboard-section">
            <h2>Today's Encounters</h2>
            <div id="encounter-list-container"></div>
          </div>

          <div class="dashboard-sidebar">
            <div class="dashboard-section">
              <h3>Quick Actions</h3>
              <div class="quick-actions">
                <button class="action-btn" id="pending-notes-btn">
                  Pending Notes
                  <span class="badge" id="pending-notes-count">0</span>
                </button>
                <button class="action-btn" id="pending-orders-btn">
                  Pending Orders
                  <span class="badge" id="pending-orders-count">0</span>
                </button>
                <button class="action-btn" id="critical-alerts-btn">
                  Critical Alerts
                  <span class="badge critical" id="critical-alerts-count">0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const stats = await ClinicalService.getDashboardStats(this.providerId);

      this.updateStats(stats);
      this.displayEncounters(stats.recentEncounters);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  private updateStats(stats: any): void {
    const statsContainer = document.getElementById("dashboard-stats");
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.totalEncounters}</div>
        <div class="stat-label">Today's Encounters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.pendingNotes}</div>
        <div class="stat-label">Pending Notes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.unseenPatients}</div>
        <div class="stat-label">Unseen Patients</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-value">${stats.criticalAlerts}</div>
        <div class="stat-label">Critical Alerts</div>
      </div>
    `;

    // Update badge counts
    this.updateBadge("pending-notes-count", stats.pendingNotes);
    this.updateBadge("pending-orders-count", stats.pendingOrders);
    this.updateBadge("critical-alerts-count", stats.criticalAlerts);
  }

  private updateBadge(elementId: string, count: number): void {
    const badge = document.getElementById(elementId);
    if (badge) {
      badge.textContent = count.toString();
      badge.style.display = count > 0 ? "inline-block" : "none";
    }
  }

  private displayEncounters(encounters: any[]): void {
    this.encounterList = new EncounterList(
      "encounter-list-container",
      (encounterId) => {
        this.navigateToEncounter(encounterId);
      },
    );

    this.encounterList.setEncounters(encounters);
  }

  private attachEventListeners(): void {
    const newEncounterBtn = document.getElementById("new-encounter-btn");
    newEncounterBtn?.addEventListener("click", () => {
      this.navigateToNewEncounter();
    });

    const pendingNotesBtn = document.getElementById("pending-notes-btn");
    pendingNotesBtn?.addEventListener("click", () => {
      // Navigate to pending notes view
      console.log("Navigate to pending notes");
    });

    const pendingOrdersBtn = document.getElementById("pending-orders-btn");
    pendingOrdersBtn?.addEventListener("click", () => {
      // Navigate to pending orders view
      console.log("Navigate to pending orders");
    });
  }

  private navigateToEncounter(encounterId: string): void {
    window.location.href = `/clinical/encounters/${encounterId}`;
  }

  private navigateToNewEncounter(): void {
    window.location.href = "/clinical/encounters/new";
  }

  private showError(message: string): void {
    const statsContainer = document.getElementById("dashboard-stats");
    if (statsContainer) {
      statsContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  destroy(): void {
    this.encounterList?.destroy();
    this.container.innerHTML = "";
  }
}

export default ClinicalDashboardPage;
