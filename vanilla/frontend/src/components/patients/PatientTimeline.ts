/**
 * PatientTimeline Component - Displays patient activity timeline
 */

import { AuditLog } from "../../types/Patient";
import PatientService from "../../services/PatientService";

export class PatientTimeline {
  private container: HTMLElement;
  private patientId: string;
  private auditLogs: AuditLog[] = [];

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    this.patientId = patientId;
  }

  /**
   * Load and display timeline
   */
  public async load(): Promise<void> {
    try {
      const response = await PatientService.getAuditLog(this.patientId);

      if (response.success && response.data) {
        this.auditLogs = response.data;
        this.render();
      } else {
        throw new Error(response.error || "Failed to load timeline");
      }
    } catch (error) {
      this.container.innerHTML = `
        <div class="error-message">
          Failed to load timeline: ${error instanceof Error ? error.message : "Unknown error"}
        </div>
      `;
    }
  }

  /**
   * Render the timeline
   */
  private render(): void {
    if (this.auditLogs.length === 0) {
      this.container.innerHTML =
        '<div class="no-timeline">No activity recorded</div>';
      return;
    }

    // Sort logs by date descending
    const sortedLogs = [...this.auditLogs].sort((a, b) => {
      return (
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );
    });

    this.container.innerHTML = `
      <div class="patient-timeline">
        <h3>Activity Timeline</h3>
        <div class="timeline-items">
          ${sortedLogs.map((log) => this.renderTimelineItem(log)).join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render a single timeline item
   */
  private renderTimelineItem(log: AuditLog): string {
    const date = new Date(log.performedAt);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    const icon = this.getActionIcon(log.action);
    const actionText = this.getActionText(log);

    return `
      <div class="timeline-item action-${log.action}">
        <div class="timeline-marker">
          <span class="timeline-icon">${icon}</span>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-action">${actionText}</span>
            <span class="timeline-date">${formattedDate} ${formattedTime}</span>
          </div>
          <div class="timeline-meta">
            <span class="timeline-user">By: ${log.performedBy}</span>
          </div>
          ${log.changes ? this.renderChanges(log.changes) : ""}
        </div>
      </div>
    `;
  }

  /**
   * Get icon for action type
   */
  private getActionIcon(action: AuditLog["action"]): string {
    const icons: Record<string, string> = {
      created: "➕",
      updated: "✏️",
      viewed: "👁️",
      merged: "🔀",
      deleted: "🗑️",
      exported: "📤",
    };
    return icons[action] || "•";
  }

  /**
   * Get human-readable action text
   */
  private getActionText(log: AuditLog): string {
    const actions: Record<string, string> = {
      created: "Patient record created",
      updated: "Patient record updated",
      viewed: "Patient record viewed",
      merged: "Patient record merged",
      deleted: "Patient record deleted",
      exported: "Patient data exported",
    };
    return actions[log.action] || log.action;
  }

  /**
   * Render changes details
   */
  private renderChanges(changes: Record<string, any>): string {
    const changeEntries = Object.entries(changes);

    if (changeEntries.length === 0) {
      return "";
    }

    return `
      <div class="timeline-changes">
        <details>
          <summary>View changes</summary>
          <ul class="changes-list">
            ${changeEntries
              .map(([field, change]) => {
                if (typeof change === "object" && change.from !== undefined) {
                  return `
                  <li>
                    <strong>${this.formatFieldName(field)}:</strong>
                    <span class="change-from">${this.formatValue(change.from)}</span>
                    →
                    <span class="change-to">${this.formatValue(change.to)}</span>
                  </li>
                `;
                } else {
                  return `
                  <li>
                    <strong>${this.formatFieldName(field)}:</strong>
                    ${this.formatValue(change)}
                  </li>
                `;
                }
              })
              .join("")}
          </ul>
        </details>
      </div>
    `;
  }

  /**
   * Format field name for display
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "(empty)";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Refresh timeline
   */
  public async refresh(): Promise<void> {
    await this.load();
  }
}
