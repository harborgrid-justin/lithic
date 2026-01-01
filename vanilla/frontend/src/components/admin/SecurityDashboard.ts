import adminService from "../../services/AdminService";

/**
 * SecurityDashboard Component
 * Displays security metrics and statistics
 */
export class SecurityDashboard {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    try {
      const [auditStats, sessionStats, mfaStats] = await Promise.all([
        adminService.getAuditStatistics(),
        adminService.getSessionStatistics(),
        adminService.getMFAStatistics(),
      ]);

      this.container.innerHTML = `
        <div class="security-dashboard">
          <h2>Security Dashboard</h2>

          <div class="dashboard-grid">
            <!-- Audit Statistics -->
            <div class="dashboard-card">
              <h3>Audit Activity</h3>
              <div class="stats-grid">
                <div class="stat">
                  <span class="stat-value">${auditStats.statistics.total_events || 0}</span>
                  <span class="stat-label">Total Events</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${auditStats.statistics.phi_access_events || 0}</span>
                  <span class="stat-label">PHI Access Events</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${auditStats.statistics.failed_events || 0}</span>
                  <span class="stat-label">Failed Events</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${auditStats.statistics.critical_events || 0}</span>
                  <span class="stat-label">Critical Events</span>
                </div>
              </div>
            </div>

            <!-- Session Statistics -->
            <div class="dashboard-card">
              <h3>Session Activity</h3>
              <div class="stats-grid">
                <div class="stat">
                  <span class="stat-value">${sessionStats.statistics.active_sessions || 0}</span>
                  <span class="stat-label">Active Sessions</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${sessionStats.statistics.unique_users || 0}</span>
                  <span class="stat-label">Unique Users</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${Math.round(sessionStats.statistics.avg_session_duration / 60) || 0}m</span>
                  <span class="stat-label">Avg Session Duration</span>
                </div>
              </div>
            </div>

            <!-- MFA Statistics -->
            <div class="dashboard-card">
              <h3>MFA Adoption</h3>
              <div class="stats-grid">
                <div class="stat">
                  <span class="stat-value">${mfaStats.statistics.enabledUsers || 0}</span>
                  <span class="stat-label">MFA Enabled Users</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${Math.round(mfaStats.statistics.enabledPercentage) || 0}%</span>
                  <span class="stat-label">Adoption Rate</span>
                </div>
                <div class="stat">
                  <span class="stat-value">${mfaStats.statistics.totalUsers || 0}</span>
                  <span class="stat-label">Total Users</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${Math.round(mfaStats.statistics.enabledPercentage) || 0}%"></div>
              </div>
            </div>

            <!-- Security Alerts -->
            <div class="dashboard-card">
              <h3>Security Alerts</h3>
              <div id="security-alerts">
                ${this.renderSecurityAlerts(auditStats.statistics)}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderSecurityAlerts(stats: any): string {
    const alerts: string[] = [];

    if (stats.failed_events > 10) {
      alerts.push(`
        <div class="alert alert--warning">
          <strong>Warning:</strong> ${stats.failed_events} failed authentication attempts detected
        </div>
      `);
    }

    if (stats.critical_events > 0) {
      alerts.push(`
        <div class="alert alert--danger">
          <strong>Critical:</strong> ${stats.critical_events} critical security events require attention
        </div>
      `);
    }

    if (alerts.length === 0) {
      return '<div class="alert alert--success">No security alerts</div>';
    }

    return alerts.join("");
  }

  private showError(message: string): void {
    this.container.innerHTML = `
      <div class="error-state">
        <p>Error: ${message}</p>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
