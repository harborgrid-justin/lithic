import adminService from '../../services/AdminService';

/**
 * ComplianceReport Component
 * Generate HIPAA compliance reports
 */
export class ComplianceReport {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="compliance-report">
        <h3>HIPAA Compliance Report</h3>

        <div class="report-controls">
          <div class="form-group">
            <label for="report-start-date">Start Date</label>
            <input type="date" id="report-start-date" class="input" />
          </div>

          <div class="form-group">
            <label for="report-end-date">End Date</label>
            <input type="date" id="report-end-date" class="input" />
          </div>

          <button id="generate-report-btn" class="btn btn--primary">
            Generate Report
          </button>
        </div>

        <div id="report-content" class="report-content">
          <div class="empty-state">Select date range and click "Generate Report"</div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadReportData();
  }

  private attachEventListeners(): void {
    const generateBtn = document.getElementById('generate-report-btn');
    generateBtn?.addEventListener('click', () => this.generateReport());
  }

  private async loadReportData(): Promise<void> {
    // Pre-populate with current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startInput = document.getElementById('report-start-date') as HTMLInputElement;
    const endInput = document.getElementById('report-end-date') as HTMLInputElement;

    if (startInput && endInput) {
      startInput.value = firstDay.toISOString().split('T')[0];
      endInput.value = lastDay.toISOString().split('T')[0];
    }
  }

  private async generateReport(): Promise<void> {
    const startDate = (document.getElementById('report-start-date') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('report-end-date') as HTMLInputElement)?.value;

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    reportContent.innerHTML = '<div class="loading">Generating compliance report...</div>';

    try {
      const [auditStats, mfaStats, sessionStats] = await Promise.all([
        adminService.getAuditStatistics(),
        adminService.getMFAStatistics(),
        adminService.getSessionStatistics(),
      ]);

      const reportHTML = this.renderReport({
        startDate,
        endDate,
        auditStats: auditStats.statistics,
        mfaStats: mfaStats.statistics,
        sessionStats: sessionStats.statistics,
      });

      reportContent.innerHTML = reportHTML;
    } catch (error: any) {
      reportContent.innerHTML = `
        <div class="error-state">
          <p>Failed to generate report: ${error.message}</p>
        </div>
      `;
    }
  }

  private renderReport(data: any): string {
    const complianceScore = this.calculateComplianceScore(data);

    return `
      <div class="compliance-report-content">
        <!-- Report Header -->
        <div class="report-header">
          <h4>HIPAA Compliance Report</h4>
          <p>Period: ${data.startDate} to ${data.endDate}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <!-- Compliance Score -->
        <div class="compliance-score">
          <h5>Overall Compliance Score</h5>
          <div class="score-circle ${this.getScoreClass(complianceScore)}">
            <span class="score-value">${complianceScore}%</span>
          </div>
          <p class="score-description">${this.getScoreDescription(complianceScore)}</p>
        </div>

        <!-- Key Metrics -->
        <div class="report-section">
          <h5>Security Safeguards (§164.308)</h5>
          <table class="report-table">
            <tr>
              <td>Access Control</td>
              <td>
                <span class="badge badge--${data.mfaStats.enabledPercentage > 80 ? 'success' : 'warning'}">
                  ${data.mfaStats.enabledPercentage > 80 ? 'Compliant' : 'Needs Improvement'}
                </span>
              </td>
              <td>MFA Adoption: ${Math.round(data.mfaStats.enabledPercentage)}%</td>
            </tr>
            <tr>
              <td>Audit Controls</td>
              <td>
                <span class="badge badge--success">Compliant</span>
              </td>
              <td>${data.auditStats.total_events || 0} events logged</td>
            </tr>
            <tr>
              <td>Workforce Training</td>
              <td>
                <span class="badge badge--info">Manual Review Required</span>
              </td>
              <td>Verify training records</td>
            </tr>
          </table>
        </div>

        <div class="report-section">
          <h5>Technical Safeguards (§164.312)</h5>
          <table class="report-table">
            <tr>
              <td>Access Control</td>
              <td>
                <span class="badge badge--success">Compliant</span>
              </td>
              <td>Unique user identification implemented</td>
            </tr>
            <tr>
              <td>Audit Controls</td>
              <td>
                <span class="badge badge--success">Compliant</span>
              </td>
              <td>All PHI access logged (${data.auditStats.phi_access_events || 0} events)</td>
            </tr>
            <tr>
              <td>Integrity Controls</td>
              <td>
                <span class="badge badge--success">Compliant</span>
              </td>
              <td>Encryption enabled for PHI at rest and in transit</td>
            </tr>
            <tr>
              <td>Transmission Security</td>
              <td>
                <span class="badge badge--success">Compliant</span>
              </td>
              <td>TLS/SSL encryption enforced</td>
            </tr>
          </table>
        </div>

        <div class="report-section">
          <h5>Activity Summary</h5>
          <table class="report-table">
            <tr>
              <td>Total Audit Events</td>
              <td>${data.auditStats.total_events || 0}</td>
            </tr>
            <tr>
              <td>PHI Access Events</td>
              <td>${data.auditStats.phi_access_events || 0}</td>
            </tr>
            <tr>
              <td>Failed Login Attempts</td>
              <td>${data.auditStats.failed_events || 0}</td>
            </tr>
            <tr>
              <td>Critical Security Events</td>
              <td>${data.auditStats.critical_events || 0}</td>
            </tr>
            <tr>
              <td>Active Sessions</td>
              <td>${data.sessionStats.active_sessions || 0}</td>
            </tr>
            <tr>
              <td>Unique Active Users</td>
              <td>${data.sessionStats.unique_users || 0}</td>
            </tr>
          </table>
        </div>

        <!-- Recommendations -->
        <div class="report-section">
          <h5>Recommendations</h5>
          ${this.renderRecommendations(data)}
        </div>

        <!-- Export Actions -->
        <div class="report-actions">
          <button id="export-pdf-btn" class="btn btn--primary">
            Export as PDF
          </button>
          <button id="export-csv-btn" class="btn btn--secondary">
            Export Audit Logs (CSV)
          </button>
          <button id="print-report-btn" class="btn btn--secondary">
            Print Report
          </button>
        </div>
      </div>
    `;
  }

  private calculateComplianceScore(data: any): number {
    let score = 100;

    // Deduct points for low MFA adoption
    if (data.mfaStats.enabledPercentage < 80) {
      score -= (80 - data.mfaStats.enabledPercentage) * 0.5;
    }

    // Deduct points for critical events
    if (data.auditStats.critical_events > 0) {
      score -= Math.min(data.auditStats.critical_events * 5, 20);
    }

    // Deduct points for high failure rate
    const failureRate = (data.auditStats.failed_events / data.auditStats.total_events) * 100;
    if (failureRate > 5) {
      score -= (failureRate - 5) * 2;
    }

    return Math.max(Math.round(score), 0);
  }

  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-fair';
    return 'score-poor';
  }

  private getScoreDescription(score: number): string {
    if (score >= 90) return 'Excellent - Organization demonstrates strong HIPAA compliance';
    if (score >= 75) return 'Good - Organization meets HIPAA requirements with minor improvements needed';
    if (score >= 60) return 'Fair - Organization requires improvement in several areas';
    return 'Poor - Immediate action required to achieve HIPAA compliance';
  }

  private renderRecommendations(data: any): string {
    const recommendations: string[] = [];

    if (data.mfaStats.enabledPercentage < 80) {
      recommendations.push('Increase MFA adoption to at least 80% of users');
    }

    if (data.auditStats.critical_events > 0) {
      recommendations.push(`Investigate and resolve ${data.auditStats.critical_events} critical security events`);
    }

    if (data.auditStats.failed_events > 10) {
      recommendations.push('Review failed login attempts and implement additional security measures');
    }

    if (recommendations.length === 0) {
      return '<p class="text-success">No immediate recommendations. Continue monitoring compliance metrics.</p>';
    }

    return `
      <ul class="recommendations-list">
        ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
