/**
 * Critical Alerts Component
 * Display and manage critical lab results requiring immediate attention
 */

export class CriticalAlerts {
  private container: HTMLElement;
  private alerts: any[] = [];
  private onAcknowledge?: (resultId: string) => void;

  constructor(
    container: HTMLElement,
    options: { onAcknowledge?: (resultId: string) => void } = {},
  ) {
    this.container = container;
    this.onAcknowledge = options.onAcknowledge;
  }

  setAlerts(alerts: any[]): void {
    this.alerts = alerts;
    this.render();
  }

  private render(): void {
    if (this.alerts.length === 0) {
      this.container.innerHTML = `
        <div class="critical-alerts-empty">
          <p>No critical alerts</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="critical-alerts">
        <div class="alerts-header">
          <h3>Critical Results</h3>
          <span class="alert-count">${this.alerts.length} Critical</span>
        </div>

        <div class="alerts-list">
          ${this.alerts.map((alert) => this.renderAlert(alert)).join("")}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderAlert(alert: any): string {
    const urgencyClass = this.getUrgencyClass(alert);
    const timeAgo = this.getTimeAgo(alert.performedDateTime);

    return `
      <div class="critical-alert ${urgencyClass}" data-result-id="${alert.id}">
        <div class="alert-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 22h20L12 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="17" r="1" fill="currentColor"/>
          </svg>
        </div>

        <div class="alert-content">
          <div class="alert-header">
            <strong>${alert.testName}</strong>
            <span class="alert-time">${timeAgo}</span>
          </div>

          <div class="alert-details">
            <div class="alert-value">
              <span class="label">Result:</span>
              <span class="value critical-value">${alert.value} ${alert.unit || ""}</span>
              ${alert.abnormalFlag ? `<span class="flag-badge">${alert.abnormalFlag}</span>` : ""}
            </div>

            <div class="alert-range">
              <span class="label">Reference Range:</span>
              <span class="value">${this.formatReferenceRange(alert.referenceRange)}</span>
            </div>

            <div class="alert-patient">
              <span class="label">Patient:</span>
              <span class="value">${this.getPatientInfo(alert)}</span>
            </div>
          </div>

          ${
            alert.comments
              ? `
            <div class="alert-comments">
              <strong>Comments:</strong> ${alert.comments}
            </div>
          `
              : ""
          }

          <div class="alert-actions">
            <button type="button" class="btn-acknowledge" data-result-id="${alert.id}">
              Acknowledge & Notify Provider
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private getUrgencyClass(alert: any): string {
    // Critical-critical (HH, LL) vs just critical (H, L with critical flag)
    if (alert.abnormalFlag === "HH" || alert.abnormalFlag === "LL") {
      return "urgency-severe";
    }
    return "urgency-high";
  }

  private getTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  private formatReferenceRange(range?: any): string {
    if (!range) return "N/A";
    if (range.text) return range.text;
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} - ${range.max}`;
    }
    if (range.max !== undefined) return `< ${range.max}`;
    if (range.min !== undefined) return `> ${range.min}`;
    return "N/A";
  }

  private getPatientInfo(alert: any): string {
    // In a real implementation, this would fetch patient info from the order
    return "Patient information from order";
  }

  private attachEventListeners(): void {
    const acknowledgeBtns = this.container.querySelectorAll(".btn-acknowledge");

    acknowledgeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const resultId = btn.getAttribute("data-result-id");
        if (resultId && this.onAcknowledge) {
          this.onAcknowledge(resultId);
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
