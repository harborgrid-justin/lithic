import { SecurityDashboard } from '../../components/admin/SecurityDashboard';
import { ComplianceReport } from '../../components/admin/ComplianceReport';

/**
 * SecurityPage
 * Security overview and compliance reporting
 */
export class SecurityPage {
  private container: HTMLElement;
  private securityDashboard: SecurityDashboard | null = null;
  private complianceReport: ComplianceReport | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="security-page">
        <header class="page-header">
          <h1>Security & Compliance</h1>
          <p>Monitor security metrics and generate compliance reports</p>
        </header>

        <div id="security-dashboard-container"></div>

        <div class="section-divider"></div>

        <div id="compliance-report-container"></div>
      </div>
    `;

    // Render security dashboard
    const dashboardContainer = document.getElementById('security-dashboard-container');
    if (dashboardContainer) {
      this.securityDashboard = new SecurityDashboard(dashboardContainer);
      await this.securityDashboard.render();
    }

    // Render compliance report
    const reportContainer = document.getElementById('compliance-report-container');
    if (reportContainer) {
      this.complianceReport = new ComplianceReport(reportContainer);
      await this.complianceReport.render();
    }
  }

  destroy(): void {
    this.securityDashboard?.destroy();
    this.complianceReport?.destroy();
    this.container.innerHTML = '';
  }
}
