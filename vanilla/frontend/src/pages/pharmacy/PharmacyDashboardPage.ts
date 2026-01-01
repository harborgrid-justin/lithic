/**
 * PharmacyDashboardPage.ts
 * Main dashboard for pharmacy management
 */

import pharmacyService from "../../services/PharmacyService";

export class PharmacyDashboardPage {
  private container: HTMLElement;
  private stats: {
    pendingPrescriptions: number;
    lowStockItems: number;
    expiringMedications: number;
    refillRequests: number;
    controlledSubstances: number;
  } = {
    pendingPrescriptions: 0,
    lowStockItems: 0,
    expiringMedications: 0,
    refillRequests: 0,
    controlledSubstances: 0,
  };

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }

  async init(): Promise<void> {
    await this.loadStats();
    this.render();
    this.attachEventListeners();
  }

  private async loadStats(): Promise<void> {
    try {
      const [prescriptions, inventory, refills] = await Promise.all([
        pharmacyService.getPrescriptions({ status: "pending" }),
        pharmacyService.getInventory({ lowStock: true }),
        pharmacyService.getRefillRequests({ status: "pending" }),
      ]);

      this.stats.pendingPrescriptions = prescriptions.length;
      this.stats.lowStockItems = inventory.length;
      this.stats.refillRequests = refills.length;

      // Get expiring medications
      const allInventory = await pharmacyService.getInventory({
        expiringSoon: true,
      });
      this.stats.expiringMedications = allInventory.length;

      // Get controlled substances count
      const controlledMeds = await pharmacyService.getMedications({
        isControlled: true,
      });
      this.stats.controlledSubstances = controlledMeds.length;
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="pharmacy-dashboard">
        <header class="dashboard-header">
          <h1>Pharmacy Management</h1>
          <div class="header-actions">
            <button class="btn btn-primary" data-action="new-prescription">
              New Prescription
            </button>
            <button class="btn btn-secondary" data-action="eprescribe">
              E-Prescribe Queue
            </button>
          </div>
        </header>

        <div class="dashboard-stats">
          <div class="stat-card pending-rx">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-value">${this.stats.pendingPrescriptions}</div>
              <div class="stat-label">Pending Prescriptions</div>
            </div>
            <a href="#/pharmacy/prescriptions?status=pending" class="stat-link">View All →</a>
          </div>

          <div class="stat-card low-stock">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value">${this.stats.lowStockItems}</div>
              <div class="stat-label">Low Stock Items</div>
            </div>
            <a href="#/pharmacy/inventory?lowStock=true" class="stat-link">View All →</a>
          </div>

          <div class="stat-card expiring">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-value">${this.stats.expiringMedications}</div>
              <div class="stat-label">Expiring Soon</div>
            </div>
            <a href="#/pharmacy/inventory?expiringSoon=true" class="stat-link">View All →</a>
          </div>

          <div class="stat-card refills">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <div class="stat-value">${this.stats.refillRequests}</div>
              <div class="stat-label">Refill Requests</div>
            </div>
            <a href="#/pharmacy/refills?status=pending" class="stat-link">View All →</a>
          </div>

          <div class="stat-card controlled">
            <div class="stat-icon">🔒</div>
            <div class="stat-content">
              <div class="stat-value">${this.stats.controlledSubstances}</div>
              <div class="stat-label">Controlled Substances</div>
            </div>
            <a href="#/pharmacy/controlled" class="stat-link">View Logs →</a>
          </div>
        </div>

        <div class="dashboard-sections">
          <section class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="action-grid">
              <a href="#/pharmacy/prescriptions" class="action-card">
                <div class="action-icon">📝</div>
                <div class="action-title">Prescriptions</div>
                <div class="action-desc">Manage all prescriptions</div>
              </a>

              <a href="#/pharmacy/dispensing" class="action-card">
                <div class="action-icon">💊</div>
                <div class="action-title">Dispensing</div>
                <div class="action-desc">Dispense medications</div>
              </a>

              <a href="#/pharmacy/inventory" class="action-card">
                <div class="action-icon">📦</div>
                <div class="action-title">Inventory</div>
                <div class="action-desc">Track medication stock</div>
              </a>

              <a href="#/pharmacy/formulary" class="action-card">
                <div class="action-icon">📚</div>
                <div class="action-title">Formulary</div>
                <div class="action-desc">Drug formulary search</div>
              </a>

              <a href="#/pharmacy/interactions" class="action-card">
                <div class="action-icon">⚡</div>
                <div class="action-title">Interactions</div>
                <div class="action-desc">Check drug interactions</div>
              </a>

              <a href="#/pharmacy/refills" class="action-card">
                <div class="action-icon">🔄</div>
                <div class="action-title">Refills</div>
                <div class="action-desc">Process refill requests</div>
              </a>
            </div>
          </section>

          <section class="recent-activity">
            <h2>Recent Activity</h2>
            <div id="recent-activity-list" class="activity-list">
              <div class="loading">Loading recent activity...</div>
            </div>
          </section>
        </div>
      </div>

      <style>
        .pharmacy-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #0066cc;
          color: white;
        }

        .btn-primary:hover {
          background: #0052a3;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-card.pending-rx { border-left: 4px solid #0066cc; }
        .stat-card.low-stock { border-left: 4px solid #ff9800; }
        .stat-card.expiring { border-left: 4px solid #f44336; }
        .stat-card.refills { border-left: 4px solid #4caf50; }
        .stat-card.controlled { border-left: 4px solid #9c27b0; }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        .stat-link {
          font-size: 14px;
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
        }

        .stat-link:hover {
          text-decoration: underline;
        }

        .dashboard-sections {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .quick-actions, .recent-activity {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 24px;
        }

        .quick-actions h2, .recent-activity h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
          color: #1a1a1a;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 15px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .action-card:hover {
          border-color: #0066cc;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
        }

        .action-icon {
          font-size: 36px;
          margin-bottom: 10px;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #1a1a1a;
        }

        .action-desc {
          font-size: 12px;
          color: #666;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        @media (max-width: 968px) {
          .dashboard-sections {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }

  private attachEventListeners(): void {
    const newRxBtn = this.container.querySelector(
      '[data-action="new-prescription"]',
    );
    if (newRxBtn) {
      newRxBtn.addEventListener("click", () => {
        window.location.hash = "#/pharmacy/prescriptions/new";
      });
    }

    const eprescribeBtn = this.container.querySelector(
      '[data-action="eprescribe"]',
    );
    if (eprescribeBtn) {
      eprescribeBtn.addEventListener("click", () => {
        window.location.hash = "#/pharmacy/eprescribe";
      });
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
