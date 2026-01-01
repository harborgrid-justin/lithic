/**
 * BillingDashboardPage - Main billing dashboard with KPIs and charts
 */

import { BillingService } from '../../services/BillingService';

export class BillingDashboardPage {
  private container: HTMLElement;
  private billingService: BillingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.billingService = new BillingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="billing-dashboard">
        <div class="page-header">
          <h1>Billing & Revenue Cycle Dashboard</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="newClaimBtn">
              <i class="icon-plus"></i> New Claim
            </button>
            <button class="btn btn-secondary" id="uploadERABtn">
              <i class="icon-upload"></i> Upload ERA
            </button>
          </div>
        </div>

        <div class="dashboard-stats" id="statsContainer">
          <div class="stat-card loading">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card">
            <h3>Revenue Trend</h3>
            <canvas id="revenueChart"></canvas>
          </div>

          <div class="dashboard-card">
            <h3>Claims by Status</h3>
            <canvas id="claimsStatusChart"></canvas>
          </div>

          <div class="dashboard-card">
            <h3>A/R Aging</h3>
            <div id="arAgingContainer"></div>
          </div>

          <div class="dashboard-card">
            <h3>Top Payers</h3>
            <div id="topPayersContainer"></div>
          </div>
        </div>

        <div class="dashboard-section">
          <h2>Recent Activity</h2>
          <div id="recentActivityContainer"></div>
        </div>

        <div class="dashboard-section">
          <h2>Denials & Alerts</h2>
          <div id="denialsContainer"></div>
        </div>
      </div>
    `;

    await this.loadDashboardData();
    this.attachEventListeners();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      // Load stats
      const stats = await this.billingService.getDashboardStats();
      this.renderStats(stats);

      // Load charts
      await this.renderCharts(stats);

      // Load recent activity
      const activity = await this.billingService.getRecentActivity();
      this.renderRecentActivity(activity);

      // Load denials
      const denials = await this.billingService.getDenials();
      this.renderDenials(denials);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  private renderStats(stats: any): void {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Charges (MTD)</div>
        <div class="stat-value">$${stats.totalCharges.toLocaleString()}</div>
        <div class="stat-change positive">+${stats.chargesChange}%</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Payments Received</div>
        <div class="stat-value">$${stats.paymentsReceived.toLocaleString()}</div>
        <div class="stat-change positive">+${stats.paymentsChange}%</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">A/R Outstanding</div>
        <div class="stat-value">$${stats.arOutstanding.toLocaleString()}</div>
        <div class="stat-change ${stats.arChange < 0 ? 'positive' : 'negative'}">
          ${stats.arChange > 0 ? '+' : ''}${stats.arChange}%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Collection Rate</div>
        <div class="stat-value">${stats.collectionRate}%</div>
        <div class="stat-change ${stats.collectionRateChange > 0 ? 'positive' : 'negative'}">
          ${stats.collectionRateChange > 0 ? '+' : ''}${stats.collectionRateChange}%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Claims Submitted</div>
        <div class="stat-value">${stats.claimsSubmitted}</div>
        <div class="stat-subtext">${stats.claimsPending} pending</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Denial Rate</div>
        <div class="stat-value">${stats.denialRate}%</div>
        <div class="stat-change ${stats.denialRateChange < 0 ? 'positive' : 'negative'}">
          ${stats.denialRateChange > 0 ? '+' : ''}${stats.denialRateChange}%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Avg Days to Payment</div>
        <div class="stat-value">${stats.avgDaysToPayment}</div>
        <div class="stat-subtext">days</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Net Collection %</div>
        <div class="stat-value">${stats.netCollection}%</div>
        <div class="stat-change positive">+${stats.netCollectionChange}%</div>
      </div>
    `;
  }

  private async renderCharts(stats: any): Promise<void> {
    // Revenue trend chart
    this.renderRevenueChart(stats.revenueTrend);

    // Claims status chart
    this.renderClaimsStatusChart(stats.claimsByStatus);

    // A/R Aging
    this.renderARAgingReport(stats.arAging);

    // Top payers
    this.renderTopPayers(stats.topPayers);
  }

  private renderRevenueChart(data: any[]): void {
    const container = document.getElementById('revenueChart');
    if (!container) return;

    // In production, use Chart.js or similar library
    // For now, render simple HTML chart
    const maxValue = Math.max(...data.map(d => d.amount));

    container.parentElement!.innerHTML = `
      <h3>Revenue Trend (Last 12 Months)</h3>
      <div class="simple-chart">
        ${data.map(item => `
          <div class="chart-bar">
            <div class="bar-label">${item.month}</div>
            <div class="bar-container">
              <div class="bar" style="height: ${(item.amount / maxValue) * 100}%">
                <span class="bar-value">$${(item.amount / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderClaimsStatusChart(data: any): void {
    const container = document.getElementById('claimsStatusChart');
    if (!container) return;

    const total = Object.values(data).reduce((sum: number, val: any) => sum + val, 0);

    container.parentElement!.innerHTML = `
      <h3>Claims by Status</h3>
      <div class="pie-chart-legend">
        ${Object.entries(data).map(([status, count]: [string, any]) => `
          <div class="legend-item">
            <span class="legend-color" style="background: var(--${status}-color)"></span>
            <span class="legend-label">${status}</span>
            <span class="legend-value">${count} (${((count / total) * 100).toFixed(1)}%)</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderARAgingReport(data: any): void {
    const container = document.getElementById('arAgingContainer');
    if (!container) return;

    container.innerHTML = `
      <table class="ar-aging-table">
        <thead>
          <tr>
            <th>Age</th>
            <th>Count</th>
            <th>Amount</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0-30 days</td>
            <td>${data.current.count}</td>
            <td>$${data.current.amount.toLocaleString()}</td>
            <td>${data.current.percentage}%</td>
          </tr>
          <tr>
            <td>31-60 days</td>
            <td>${data.thirty.count}</td>
            <td>$${data.thirty.amount.toLocaleString()}</td>
            <td>${data.thirty.percentage}%</td>
          </tr>
          <tr>
            <td>61-90 days</td>
            <td>${data.sixty.count}</td>
            <td>$${data.sixty.amount.toLocaleString()}</td>
            <td>${data.sixty.percentage}%</td>
          </tr>
          <tr>
            <td>90+ days</td>
            <td>${data.ninety.count}</td>
            <td>$${data.ninety.amount.toLocaleString()}</td>
            <td>${data.ninety.percentage}%</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total</strong></td>
            <td><strong>${data.total.count}</strong></td>
            <td><strong>$${data.total.amount.toLocaleString()}</strong></td>
            <td><strong>100%</strong></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private renderTopPayers(payers: any[]): void {
    const container = document.getElementById('topPayersContainer');
    if (!container) return;

    container.innerHTML = `
      <table class="top-payers-table">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Claims</th>
            <th>Amount</th>
            <th>Avg Days</th>
          </tr>
        </thead>
        <tbody>
          ${payers.map(payer => `
            <tr>
              <td>${payer.name}</td>
              <td>${payer.claimCount}</td>
              <td>$${payer.amount.toLocaleString()}</td>
              <td>${payer.avgDays}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private renderRecentActivity(activities: any[]): void {
    const container = document.getElementById('recentActivityContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="activity-list">
        ${activities.map(activity => `
          <div class="activity-item">
            <div class="activity-icon ${activity.type}">
              <i class="icon-${activity.type}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-title">${activity.title}</div>
              <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderDenials(denials: any[]): void {
    const container = document.getElementById('denialsContainer');
    if (!container) return;

    if (denials.length === 0) {
      container.innerHTML = '<p class="no-data">No denials requiring attention</p>';
      return;
    }

    container.innerHTML = `
      <div class="denials-list">
        ${denials.map(denial => `
          <div class="denial-item alert-${denial.severity}">
            <div class="denial-header">
              <span class="denial-claim">${denial.claimNumber}</span>
              <span class="denial-amount">$${denial.amount.toLocaleString()}</span>
            </div>
            <div class="denial-reason">${denial.reason}</div>
            <div class="denial-actions">
              <button class="btn btn-sm" onclick="window.billingDashboard.viewDenial('${denial.id}')">
                View Details
              </button>
              <button class="btn btn-sm btn-primary" onclick="window.billingDashboard.createAppeal('${denial.id}')">
                Create Appeal
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const newClaimBtn = document.getElementById('newClaimBtn');
    if (newClaimBtn) {
      newClaimBtn.addEventListener('click', () => {
        window.location.hash = '#/billing/claims/new';
      });
    }

    const uploadERABtn = document.getElementById('uploadERABtn');
    if (uploadERABtn) {
      uploadERABtn.addEventListener('click', () => {
        this.showERAUploadModal();
      });
    }
  }

  private showERAUploadModal(): void {
    // Implementation for ERA upload modal
    console.log('Show ERA upload modal');
  }

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private showError(message: string): void {
    const container = this.container.querySelector('.billing-dashboard');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.textContent = message;
      container.insertBefore(errorDiv, container.firstChild);
    }
  }

  // Public methods for global access
  public viewDenial(denialId: string): void {
    window.location.hash = `#/billing/denials/${denialId}`;
  }

  public createAppeal(denialId: string): void {
    window.location.hash = `#/billing/claims/${denialId}/appeal`;
  }
}

// Make instance globally available
declare global {
  interface Window {
    billingDashboard: BillingDashboardPage;
  }
}
