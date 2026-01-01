import adminService from "../../services/AdminService";
import { RoleManager } from "../../components/admin/RoleManager";
import { SessionManager } from "../../components/admin/SessionManager";

/**
 * UserDetailPage
 * View and edit user details
 */
export class UserDetailPage {
  private container: HTMLElement;
  private userId: string;
  private user: any = null;
  private roleManager: RoleManager | null = null;
  private sessionManager: SessionManager | null = null;

  constructor(container: HTMLElement, userId: string) {
    this.container = container;
    this.userId = userId;
  }

  async render(): Promise<void> {
    try {
      const response = await adminService.getUser(this.userId);
      this.user = response.user;

      this.container.innerHTML = `
        <div class="user-detail-page">
          <header class="page-header">
            <h1>${this.user.firstName} ${this.user.lastName}</h1>
            <p>${this.user.email}</p>
          </header>

          <div class="user-detail-content">
            <!-- User Info Card -->
            <div class="user-info-card">
              <h3>User Information</h3>
              <dl class="info-list">
                <dt>Status</dt>
                <dd>
                  <span class="badge badge--${this.user.isActive ? "success" : "danger"}">
                    ${this.user.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>

                <dt>MFA Status</dt>
                <dd>
                  <span class="badge badge--${this.user.isMFAEnabled ? "success" : "warning"}">
                    ${this.user.isMFAEnabled ? "Enabled" : "Disabled"}
                  </span>
                </dd>

                <dt>Organization ID</dt>
                <dd>${this.user.organizationId}</dd>

                <dt>Last Login</dt>
                <dd>${this.user.lastLogin ? new Date(this.user.lastLogin).toLocaleString() : "Never"}</dd>

                <dt>Created At</dt>
                <dd>${new Date(this.user.createdAt).toLocaleString()}</dd>

                <dt>Roles</dt>
                <dd>${this.user.roles?.join(", ") || "No roles assigned"}</dd>
              </dl>

              <div class="user-actions">
                <button id="reset-password-btn" class="btn btn--warning">
                  Reset Password
                </button>
                <button id="toggle-status-btn" class="btn btn--${this.user.isActive ? "danger" : "success"}">
                  ${this.user.isActive ? "Deactivate" : "Activate"} User
                </button>
                <button id="terminate-sessions-btn" class="btn btn--danger">
                  Terminate All Sessions
                </button>
              </div>
            </div>

            <!-- Role Management -->
            <div id="role-manager-container"></div>

            <!-- Session Management -->
            <div id="session-manager-container"></div>
          </div>
        </div>
      `;

      this.attachEventListeners();

      // Render role manager
      const roleContainer = document.getElementById("role-manager-container");
      if (roleContainer) {
        this.roleManager = new RoleManager(roleContainer, this.userId);
        await this.roleManager.render();
      }

      // Render session manager
      const sessionContainer = document.getElementById(
        "session-manager-container",
      );
      if (sessionContainer) {
        this.sessionManager = new SessionManager(sessionContainer);
        await this.sessionManager.render();
      }
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private attachEventListeners(): void {
    const resetPasswordBtn = document.getElementById("reset-password-btn");
    const toggleStatusBtn = document.getElementById("toggle-status-btn");
    const terminateSessionsBtn = document.getElementById(
      "terminate-sessions-btn",
    );

    resetPasswordBtn?.addEventListener("click", () => this.resetPassword());
    toggleStatusBtn?.addEventListener("click", () => this.toggleStatus());
    terminateSessionsBtn?.addEventListener("click", () =>
      this.terminateSessions(),
    );
  }

  private async resetPassword(): Promise<void> {
    const newPassword = prompt("Enter new password for user:");
    if (!newPassword) return;

    try {
      await adminService.resetUserPassword(this.userId, newPassword);
      alert("Password reset successfully");
    } catch (error: any) {
      alert(`Failed to reset password: ${error.message}`);
    }
  }

  private async toggleStatus(): Promise<void> {
    const action = this.user.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      if (this.user.isActive) {
        await adminService.deactivateUser(this.userId);
      } else {
        await adminService.activateUser(this.userId);
      }

      await this.render();
    } catch (error: any) {
      alert(`Failed to ${action} user: ${error.message}`);
    }
  }

  private async terminateSessions(): Promise<void> {
    if (
      !confirm("Are you sure you want to terminate all sessions for this user?")
    )
      return;

    try {
      await adminService.terminateUserSessions(this.userId);
      alert("All sessions terminated successfully");
      await this.render();
    } catch (error: any) {
      alert(`Failed to terminate sessions: ${error.message}`);
    }
  }

  private showError(message: string): void {
    this.container.innerHTML = `
      <div class="error-state">
        <p>Error: ${message}</p>
      </div>
    `;
  }

  destroy(): void {
    this.roleManager?.destroy();
    this.sessionManager?.destroy();
    this.container.innerHTML = "";
  }
}
