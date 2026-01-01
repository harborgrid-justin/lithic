/**
 * Specimen Tracker Component
 * Tracks specimen lifecycle and status
 */

export class SpecimenTracker {
  private container: HTMLElement;
  private specimen: any;
  private trackingHistory: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setSpecimen(specimen: any, trackingHistory: any[] = []): void {
    this.specimen = specimen;
    this.trackingHistory = trackingHistory;
    this.render();
  }

  private render(): void {
    if (!this.specimen) {
      this.container.innerHTML = "<p>No specimen selected</p>";
      return;
    }

    const html = `
      <div class="specimen-tracker">
        <div class="specimen-header">
          <div class="specimen-info">
            <h3>Specimen ${this.specimen.specimenNumber}</h3>
            <div class="barcode">${this.specimen.barcode}</div>
          </div>
          <div class="specimen-status">
            <span class="status-badge status-${this.specimen.status}">${this.formatStatus(this.specimen.status)}</span>
          </div>
        </div>

        <div class="specimen-details">
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value">${this.formatSpecimenType(this.specimen.specimenType)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Container:</span>
            <span class="value">${this.specimen.containerType}</span>
          </div>
          <div class="detail-row">
            <span class="label">Collected:</span>
            <span class="value">${this.formatDateTime(this.specimen.collectionDateTime)} by ${this.specimen.collectedBy}</span>
          </div>
          ${
            this.specimen.receivedDateTime
              ? `
            <div class="detail-row">
              <span class="label">Received:</span>
              <span class="value">${this.formatDateTime(this.specimen.receivedDateTime)} by ${this.specimen.receivedBy}</span>
            </div>
          `
              : ""
          }
          ${
            this.specimen.volume
              ? `
            <div class="detail-row">
              <span class="label">Volume:</span>
              <span class="value">${this.specimen.volume} ${this.specimen.volumeUnit}</span>
            </div>
          `
              : ""
          }
          ${
            this.specimen.temperature
              ? `
            <div class="detail-row">
              <span class="label">Temperature:</span>
              <span class="value">${this.specimen.temperature}°C</span>
            </div>
          `
              : ""
          }
        </div>

        ${
          this.specimen.qualityIssues && this.specimen.qualityIssues.length > 0
            ? `
          <div class="quality-issues">
            <h4>Quality Issues</h4>
            ${this.specimen.qualityIssues.map((issue: any) => this.renderQualityIssue(issue)).join("")}
          </div>
        `
            : ""
        }

        ${
          this.specimen.status === "rejected"
            ? `
          <div class="rejection-info">
            <h4>Rejection Information</h4>
            <p>${this.specimen.rejectionReason}</p>
          </div>
        `
            : ""
        }

        <div class="tracking-timeline">
          <h4>Tracking History</h4>
          <div class="timeline">
            ${this.trackingHistory.map((event) => this.renderTimelineEvent(event)).join("")}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  private renderQualityIssue(issue: any): string {
    const severityClass = `severity-${issue.severity}`;
    return `
      <div class="quality-issue ${severityClass}">
        <div class="issue-header">
          <span class="issue-type">${this.formatIssueType(issue.type)}</span>
          <span class="issue-severity ${severityClass}">${issue.severity.toUpperCase()}</span>
        </div>
        <p>${issue.description}</p>
        <small>Detected by ${issue.detectedBy} on ${this.formatDateTime(issue.detectedAt)}</small>
      </div>
    `;
  }

  private renderTimelineEvent(event: any): string {
    return `
      <div class="timeline-event">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="event-header">
            <strong>${this.formatEventType(event.eventType)}</strong>
            <span class="event-time">${this.formatDateTime(event.timestamp)}</span>
          </div>
          <div class="event-details">
            <div>Location: ${event.location}</div>
            <div>Performed by: ${event.performedBy}</div>
            ${event.notes ? `<div>Notes: ${event.notes}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  private formatStatus(status: string): string {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatSpecimenType(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatIssueType(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatEventType(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
