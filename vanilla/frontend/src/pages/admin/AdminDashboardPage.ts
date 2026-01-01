import { SecurityDashboard } from '../../components/admin/SecurityDashboard';
import { AuditLog } from '../../components/admin/AuditLog';

/**
 * AdminDashboardPage
 * Main admin dashboard with security overview and recent activity
 */
export class AdminDashboardPage {
  private container: HTMLElement;
  private securityDashboard: SecurityDashboard | null = null;
  private auditLog: AuditLog | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="admin-dashboard-page">
        <header class="page-header">
          <h1>Admin Dashboard</h1>
          <p>Security, compliance, and user management overview</p>
        </header>

        <div id="security-dashboard-container"></div>

        <div class="dashboard-section">
          <h2>Recent Audit Activity</h2>
          <div id="audit-log-container"></div>
        </div>
      </div>
    `;

    // Render security dashboard
    const securityContainer = document.getElementById('security-dashboard-container');
    if (securityContainer) {
      this.securityDashboard = new SecurityDashboard(securityContainer);
      await this.securityDashboard.render();
    }

    // Render audit log
    const auditContainer = document.getElementById('audit-log-container');
    if (auditContainer) {
      this.auditLog = new AuditLog(auditContainer);
      await this.auditLog.render();
    }
  }

  destroy(): void {
    this.securityDashboard?.destroy();
    this.auditLog?.destroy();
    this.container.innerHTML = '';
  }
}
