/**
 * Conflict Resolver Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class ConflictResolver {
  private container: HTMLElement;
  private conflicts: any[];
  private onResolve?: (resolution: any) => void;

  constructor(
    container: HTMLElement,
    conflicts: any[],
    options?: {
      onResolve?: (resolution: any) => void;
    },
  ) {
    this.container = container;
    this.conflicts = conflicts;
    this.onResolve = options?.onResolve;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="conflict-resolver">
        <div class="conflict-header">
          <h3>Scheduling Conflicts Detected</h3>
          <p>${this.conflicts.length} conflict(s) found</p>
        </div>

        <div class="conflicts-list">
          ${this.conflicts
            .map(
              (conflict, index) => `
            <div class="conflict-item" data-index="${index}">
              <div class="conflict-icon ${conflict.type}">⚠️</div>
              <div class="conflict-details">
                <h4>${this.getConflictTitle(conflict.type)}</h4>
                <p>${conflict.message}</p>
                ${
                  conflict.conflictingAppointment
                    ? `
                  <div class="conflicting-appointment">
                    <strong>Conflicting with:</strong>
                    ${conflict.conflictingAppointment.patientName} at
                    ${new Date(conflict.conflictingAppointment.startTime).toLocaleString()}
                  </div>
                `
                    : ""
                }
              </div>
              <div class="conflict-actions">
                ${this.renderResolutionOptions(conflict)}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="resolver-actions">
          <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
          <button class="btn btn-primary" id="proceedBtn">Proceed Anyway</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private getConflictTitle(type: string): string {
    const titles: Record<string, string> = {
      "double-booking": "Double Booking",
      "resource-conflict": "Resource Unavailable",
      "provider-unavailable": "Provider Unavailable",
      "facility-closed": "Facility Closed",
    };
    return titles[type] || "Conflict";
  }

  private renderResolutionOptions(conflict: any): string {
    switch (conflict.type) {
      case "double-booking":
        return `
          <button class="btn-small" data-action="find-alternative">Find Alternative Time</button>
          <button class="btn-small" data-action="override">Override</button>
        `;
      case "resource-conflict":
        return `
          <button class="btn-small" data-action="find-resource">Find Alternative Resource</button>
        `;
      default:
        return `<button class="btn-small" data-action="modify">Modify Appointment</button>`;
    }
  }

  private attachEventListeners(): void {
    document.getElementById("cancelBtn")?.addEventListener("click", () => {
      this.container.innerHTML = "";
    });

    document.getElementById("proceedBtn")?.addEventListener("click", () => {
      if (this.onResolve) {
        this.onResolve({ action: "proceed", conflicts: this.conflicts });
      }
    });

    this.container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.handleResolution(action!);
      });
    });
  }

  private handleResolution(action: string): void {
    if (this.onResolve) {
      this.onResolve({ action, conflicts: this.conflicts });
    }
  }

  destroy(): void {}
}
