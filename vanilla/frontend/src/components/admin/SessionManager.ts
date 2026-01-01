import adminService from "../../services/AdminService";

/**
 * SessionManager Component
 * Manage active user sessions
 */
export class SessionManager {
  private container: HTMLElement;
  private sessions: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="session-manager">
        <h3>Active Sessions</h3>
        <div id="sessions-list" class="sessions-list">
          <div class="loading">Loading sessions...</div>
        </div>
      </div>
    `;

    await this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    try {
      const response = await adminService.getSessions();
      this.sessions = response.sessions;
      this.renderSessions();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderSessions(): void {
    const listContainer = document.getElementById("sessions-list");
    if (!listContainer) return;

    if (this.sessions.length === 0) {
      listContainer.innerHTML =
        '<div class="empty-state">No active sessions</div>';
      return;
    }

    const sessionsHTML = this.sessions
      .map(
        (session) => `
      <div class="session-card" data-session-id="${session.id}">
        <div class="session-card__header">
          <h4>${session.deviceInfo?.browser || "Unknown Browser"} on ${session.deviceInfo?.os || "Unknown OS"}</h4>
          <span class="badge badge--success">Active</span>
        </div>
        <div class="session-card__body">
          <p><strong>IP Address:</strong> ${session.ipAddress}</p>
          <p><strong>Device:</strong> ${session.deviceInfo?.device || "Unknown"}</p>
          <p><strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}</p>
          <p><strong>Last Activity:</strong> ${new Date(session.lastActivityAt).toLocaleString()}</p>
        </div>
        <div class="session-card__actions">
          <button
            class="btn btn--sm btn--danger terminate-session"
            data-session-id="${session.id}"
          >
            Terminate Session
          </button>
        </div>
      </div>
    `,
      )
      .join("");

    listContainer.innerHTML = sessionsHTML;
    this.attachSessionEventListeners();
  }

  private attachSessionEventListeners(): void {
    const terminateButtons = document.querySelectorAll(".terminate-session");
    terminateButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const sessionId = (e.target as HTMLElement).dataset.sessionId;
        if (sessionId) {
          await this.terminateSession(sessionId);
        }
      });
    });
  }

  private async terminateSession(sessionId: string): Promise<void> {
    if (!confirm("Are you sure you want to terminate this session?")) {
      return;
    }

    try {
      await adminService.terminateSession(sessionId);
      await this.loadSessions();
    } catch (error: any) {
      alert(`Failed to terminate session: ${error.message}`);
    }
  }

  private showError(message: string): void {
    const listContainer = document.getElementById("sessions-list");
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="error-state">
          <p>Error: ${message}</p>
        </div>
      `;
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
