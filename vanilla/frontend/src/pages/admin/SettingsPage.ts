import { MFASetup } from "../../components/admin/MFASetup";
import { SessionManager } from "../../components/admin/SessionManager";
import adminService from "../../services/AdminService";

/**
 * SettingsPage
 * User account settings and preferences
 */
export class SettingsPage {
  private container: HTMLElement;
  private mfaSetup: MFASetup | null = null;
  private sessionManager: SessionManager | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="settings-page">
        <header class="page-header">
          <h1>Account Settings</h1>
          <p>Manage your account security and preferences</p>
        </header>

        <div class="settings-content">
          <!-- Profile Section -->
          <div class="settings-section">
            <h3>Profile Information</h3>
            <div id="profile-info">
              <div class="loading">Loading profile...</div>
            </div>
          </div>

          <!-- Password Change -->
          <div class="settings-section">
            <h3>Change Password</h3>
            <form id="change-password-form" class="form">
              <div class="form-group">
                <label for="old-password">Current Password</label>
                <input
                  type="password"
                  id="old-password"
                  class="input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  class="input"
                  minlength="12"
                  required
                />
                <small class="form-hint">
                  Minimum 12 characters with uppercase, lowercase, number, and special character
                </small>
              </div>

              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  class="input"
                  minlength="12"
                  required
                />
              </div>

              <button type="submit" class="btn btn--primary">
                Change Password
              </button>

              <div id="password-error" class="error-message" style="display: none;"></div>
              <div id="password-success" class="success-message" style="display: none;"></div>
            </form>
          </div>

          <!-- MFA Setup -->
          <div class="settings-section">
            <div id="mfa-setup-container"></div>
          </div>

          <!-- Active Sessions -->
          <div class="settings-section">
            <h3>Active Sessions</h3>
            <div id="session-manager-container"></div>
          </div>

          <!-- Preferences -->
          <div class="settings-section">
            <h3>Preferences</h3>
            <form id="preferences-form" class="form">
              <div class="form-group">
                <label>
                  <input type="checkbox" id="email-notifications" checked />
                  Email notifications
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" id="security-alerts" checked />
                  Security alerts
                </label>
              </div>

              <div class="form-group">
                <label for="timezone">Timezone</label>
                <select id="timezone" class="input">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>

              <button type="submit" class="btn btn--primary">
                Save Preferences
              </button>
            </form>
          </div>

          <!-- Danger Zone -->
          <div class="settings-section settings-section--danger">
            <h3>Danger Zone</h3>
            <p>These actions are irreversible. Proceed with caution.</p>
            <button id="logout-all-btn" class="btn btn--danger">
              Logout All Sessions
            </button>
          </div>
        </div>
      </div>
    `;

    await this.loadProfile();
    this.attachEventListeners();

    // Render MFA setup
    const mfaContainer = document.getElementById("mfa-setup-container");
    if (mfaContainer) {
      this.mfaSetup = new MFASetup(mfaContainer);
      await this.mfaSetup.render();
    }

    // Render session manager
    const sessionContainer = document.getElementById(
      "session-manager-container",
    );
    if (sessionContainer) {
      this.sessionManager = new SessionManager(sessionContainer);
      await this.sessionManager.render();
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      const response = await adminService.getCurrentUser();
      const user = response.user;

      const profileInfo = document.getElementById("profile-info");
      if (profileInfo) {
        profileInfo.innerHTML = `
          <dl class="info-list">
            <dt>Name</dt>
            <dd>${user.firstName} ${user.lastName}</dd>

            <dt>Email</dt>
            <dd>${user.email}</dd>

            <dt>Organization</dt>
            <dd>${user.organizationId}</dd>

            <dt>Roles</dt>
            <dd>${user.roles?.join(", ") || "No roles assigned"}</dd>

            <dt>Last Login</dt>
            <dd>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</dd>
          </dl>
        `;
      }
    } catch (error: any) {
      const profileInfo = document.getElementById("profile-info");
      if (profileInfo) {
        profileInfo.innerHTML = `<p class="error-text">Failed to load profile: ${error.message}</p>`;
      }
    }
  }

  private attachEventListeners(): void {
    const passwordForm = document.getElementById(
      "change-password-form",
    ) as HTMLFormElement;
    const preferencesForm = document.getElementById(
      "preferences-form",
    ) as HTMLFormElement;
    const logoutAllBtn = document.getElementById("logout-all-btn");

    passwordForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.changePassword();
    });

    preferencesForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.savePreferences();
    });

    logoutAllBtn?.addEventListener("click", () => this.logoutAllSessions());
  }

  private async changePassword(): Promise<void> {
    const oldPassword = (
      document.getElementById("old-password") as HTMLInputElement
    ).value;
    const newPassword = (
      document.getElementById("new-password") as HTMLInputElement
    ).value;
    const confirmPassword = (
      document.getElementById("confirm-password") as HTMLInputElement
    ).value;

    const errorDiv = document.getElementById("password-error");
    const successDiv = document.getElementById("password-success");

    // Validate
    if (newPassword !== confirmPassword) {
      if (errorDiv) {
        errorDiv.textContent = "New passwords do not match";
        errorDiv.style.display = "block";
      }
      if (successDiv) successDiv.style.display = "none";
      return;
    }

    try {
      await adminService.changePassword(oldPassword, newPassword);

      if (successDiv) {
        successDiv.textContent = "Password changed successfully";
        successDiv.style.display = "block";
      }
      if (errorDiv) errorDiv.style.display = "none";

      // Clear form
      (
        document.getElementById("change-password-form") as HTMLFormElement
      ).reset();
    } catch (error: any) {
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = "block";
      }
      if (successDiv) successDiv.style.display = "none";
    }
  }

  private savePreferences(): void {
    const emailNotifications = (
      document.getElementById("email-notifications") as HTMLInputElement
    ).checked;
    const securityAlerts = (
      document.getElementById("security-alerts") as HTMLInputElement
    ).checked;
    const timezone = (document.getElementById("timezone") as HTMLSelectElement)
      .value;

    // In production, this would save to backend
    console.log("Saving preferences:", {
      emailNotifications,
      securityAlerts,
      timezone,
    });

    alert("Preferences saved successfully");
  }

  private async logoutAllSessions(): Promise<void> {
    if (
      !confirm(
        "Are you sure you want to logout all sessions? You will need to login again.",
      )
    ) {
      return;
    }

    try {
      const response = await adminService.getCurrentUser();
      await adminService.terminateUserSessions(response.user.id);

      // Redirect to login
      await adminService.logout();
      window.location.href = "/login";
    } catch (error: any) {
      alert(`Failed to logout all sessions: ${error.message}`);
    }
  }

  destroy(): void {
    this.mfaSetup?.destroy();
    this.sessionManager?.destroy();
    this.container.innerHTML = "";
  }
}
