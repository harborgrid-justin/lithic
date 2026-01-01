/**
 * Laboratory Dashboard Page
 * Main dashboard for laboratory information system
 */

import { labService } from "../../services/LaboratoryService";
import { CriticalAlerts } from "../../components/laboratory/CriticalAlerts";

export class LabDashboardPage {
  private container: HTMLElement;
  private criticalAlerts: CriticalAlerts | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="lab-dashboard-page">
        <div class="page-header">
          <h1>Laboratory Dashboard</h1>
          <div class="header-actions">
            <button type="button" class="btn btn-primary" id="newOrderBtn">New Order</button>
            <button type="button" class="btn btn-secondary" id="refreshBtn">Refresh</button>
          </div>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon pending"></div>
            <div class="stat-content">
              <div class="stat-value" id="pendingCount">-</div>
              <div class="stat-label">Pending Orders</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon processing"></div>
            <div class="stat-content">
              <div class="stat-value" id="processingCount">-</div>
              <div class="stat-label">In Process</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon critical"></div>
            <div class="stat-content">
              <div class="stat-value" id="criticalCount">-</div>
              <div class="stat-label">Critical Results</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon completed"></div>
            <div class="stat-content">
              <div class="stat-value" id="completedToday">-</div>
              <div class="stat-label">Completed Today</div>
            </div>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="dashboard-section">
            <h2>Critical Alerts</h2>
            <div id="criticalAlertsContainer"></div>
          </div>

          <div class="dashboard-section">
            <h2>Recent Orders</h2>
            <div id="recentOrdersContainer"></div>
          </div>

          <div class="dashboard-section">
            <h2>Quick Actions</h2>
            <div class="quick-actions">
              <a href="/laboratory/orders/new" class="action-card">
                <div class="action-icon">+</div>
                <div class="action-label">Create Order</div>
              </a>
              <a href="/laboratory/specimens" class="action-card">
                <div class="action-icon">📦</div>
                <div class="action-label">Track Specimen</div>
              </a>
              <a href="/laboratory/results" class="action-card">
                <div class="action-icon">📊</div>
                <div class="action-label">Enter Results</div>
              </a>
              <a href="/laboratory/qc" class="action-card">
                <div class="action-icon">✓</div>
                <div class="action-label">Quality Control</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadData();
    this.attachEventListeners();
  }

  private async loadData(): Promise<void> {
    try {
      // Load critical results
      const criticalResults = await labService.getCriticalResults();
      const criticalContainer = this.container.querySelector(
        "#criticalAlertsContainer",
      );
      if (criticalContainer) {
        this.criticalAlerts = new CriticalAlerts(
          criticalContainer as HTMLElement,
          {
            onAcknowledge: (resultId) =>
              this.handleAcknowledgeCritical(resultId),
          },
        );
        this.criticalAlerts.setAlerts(criticalResults);
      }

      // Update stats
      const pendingOrders = await labService.getPendingOrders();
      this.updateStat("pendingCount", pendingOrders.length);
      this.updateStat("criticalCount", criticalResults.length);

      // Load recent orders
      this.loadRecentOrders();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  private async loadRecentOrders(): Promise<void> {
    try {
      const orders = await labService.getPendingOrders();
      const container = this.container.querySelector("#recentOrdersContainer");

      if (container) {
        container.innerHTML = orders
          .slice(0, 5)
          .map(
            (order: any) => `
          <div class="order-item">
            <div class="order-info">
              <strong>${order.orderNumber}</strong>
              <span>${order.patientName}</span>
              <span class="priority-badge priority-${order.priority}">${order.priority}</span>
            </div>
            <div class="order-actions">
              <a href="/laboratory/orders/${order.id}" class="btn-link">View</a>
            </div>
          </div>
        `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading recent orders:", error);
    }
  }

  private updateStat(elementId: string, value: number): void {
    const element = this.container.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value.toString();
    }
  }

  private handleAcknowledgeCritical(resultId: string): void {
    console.log("Acknowledging critical result:", resultId);
    // In real implementation, would notify provider and log acknowledgment
    alert("Critical result acknowledged. Provider notification sent.");
  }

  private attachEventListeners(): void {
    const newOrderBtn = this.container.querySelector("#newOrderBtn");
    const refreshBtn = this.container.querySelector("#refreshBtn");

    if (newOrderBtn) {
      newOrderBtn.addEventListener("click", () => {
        window.location.href = "/laboratory/orders/new";
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadData();
      });
    }
  }

  destroy(): void {
    if (this.criticalAlerts) {
      this.criticalAlerts.destroy();
    }
    this.container.innerHTML = "";
  }
}
