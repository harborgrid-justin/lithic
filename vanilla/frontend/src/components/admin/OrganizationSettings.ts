import adminService from "../../services/AdminService";

/**
 * OrganizationSettings Component
 * Manage organization-level security and compliance settings
 */
export class OrganizationSettings {
  private container: HTMLElement;
  private organizationId: string;
  private settings: any = {};

  constructor(container: HTMLElement, organizationId: string) {
    this.container = container;
    this.organizationId = organizationId;
  }

  async render(): Promise<void> {
    try {
      const response = await adminService.getOrganization(this.organizationId);
      this.settings = response.organization.settings || {};

      this.container.innerHTML = `
        <div class="organization-settings">
          <h3>Organization Settings</h3>

          <form id="settings-form" class="form">
            <!-- Security Settings -->
            <div class="settings-section">
              <h4>Security Settings</h4>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="mfa-required"
                    ${this.settings.mfaRequired ? "checked" : ""}
                  />
                  Require MFA for all users
                </label>
              </div>

              <div class="form-group">
                <label for="session-timeout">Session Timeout (minutes)</label>
                <input
                  type="number"
                  id="session-timeout"
                  class="input"
                  value="${this.settings.sessionTimeout || 30}"
                  min="5"
                  max="120"
                />
              </div>

              <div class="form-group">
                <label for="max-login-attempts">Max Failed Login Attempts</label>
                <input
                  type="number"
                  id="max-login-attempts"
                  class="input"
                  value="${this.settings.maxLoginAttempts || 5}"
                  min="3"
                  max="10"
                />
              </div>
            </div>

            <!-- Password Policy -->
            <div class="settings-section">
              <h4>Password Policy</h4>

              <div class="form-group">
                <label for="password-min-length">Minimum Length</label>
                <input
                  type="number"
                  id="password-min-length"
                  class="input"
                  value="${this.settings.passwordPolicy?.minLength || 12}"
                  min="8"
                  max="32"
                />
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="password-require-special"
                    ${this.settings.passwordPolicy?.requireSpecialChars ? "checked" : ""}
                  />
                  Require special characters
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="password-require-numbers"
                    ${this.settings.passwordPolicy?.requireNumbers ? "checked" : ""}
                  />
                  Require numbers
                </label>
              </div>

              <div class="form-group">
                <label for="password-expiry">Password Expiry (days, 0 = never)</label>
                <input
                  type="number"
                  id="password-expiry"
                  class="input"
                  value="${this.settings.passwordPolicy?.expiryDays || 90}"
                  min="0"
                  max="365"
                />
              </div>
            </div>

            <!-- HIPAA Compliance -->
            <div class="settings-section">
              <h4>HIPAA Compliance</h4>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="auto-logout"
                    ${this.settings.autoLogout !== false ? "checked" : ""}
                  />
                  Auto-logout on inactivity
                </label>
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="audit-phi-access"
                    ${this.settings.auditPHIAccess !== false ? "checked" : ""}
                  />
                  Audit all PHI access
                </label>
              </div>

              <div class="form-group">
                <label for="audit-retention">Audit Log Retention (days)</label>
                <input
                  type="number"
                  id="audit-retention"
                  class="input"
                  value="${this.settings.auditRetentionDays || 2555}"
                  min="365"
                  max="3650"
                />
                <small class="form-hint">HIPAA requires minimum 6 years (2190 days)</small>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn--primary">
                Save Settings
              </button>
              <button type="button" id="cancel-btn" class="btn btn--secondary">
                Cancel
              </button>
            </div>

            <div id="settings-error" class="error-message" style="display: none;"></div>
            <div id="settings-success" class="success-message" style="display: none;"></div>
          </form>
        </div>
      `;

      this.attachEventListeners();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private attachEventListeners(): void {
    const form = document.getElementById("settings-form") as HTMLFormElement;
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.saveSettings();
    });
  }

  private async saveSettings(): Promise<void> {
    const updatedSettings = {
      mfaRequired: (document.getElementById("mfa-required") as HTMLInputElement)
        .checked,
      sessionTimeout: parseInt(
        (document.getElementById("session-timeout") as HTMLInputElement).value,
      ),
      maxLoginAttempts: parseInt(
        (document.getElementById("max-login-attempts") as HTMLInputElement)
          .value,
      ),
      passwordPolicy: {
        minLength: parseInt(
          (document.getElementById("password-min-length") as HTMLInputElement)
            .value,
        ),
        requireSpecialChars: (
          document.getElementById(
            "password-require-special",
          ) as HTMLInputElement
        ).checked,
        requireNumbers: (
          document.getElementById(
            "password-require-numbers",
          ) as HTMLInputElement
        ).checked,
        expiryDays: parseInt(
          (document.getElementById("password-expiry") as HTMLInputElement)
            .value,
        ),
      },
      autoLogout: (document.getElementById("auto-logout") as HTMLInputElement)
        .checked,
      auditPHIAccess: (
        document.getElementById("audit-phi-access") as HTMLInputElement
      ).checked,
      auditRetentionDays: parseInt(
        (document.getElementById("audit-retention") as HTMLInputElement).value,
      ),
    };

    try {
      await adminService.updateOrganization(this.organizationId, {
        settings: updatedSettings,
      });

      this.showSuccess("Settings saved successfully");
    } catch (error: any) {
      this.showFormError(error.message);
    }
  }

  private showFormError(message: string): void {
    const errorDiv = document.getElementById("settings-error");
    const successDiv = document.getElementById("settings-success");

    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
    if (successDiv) {
      successDiv.style.display = "none";
    }
  }

  private showSuccess(message: string): void {
    const errorDiv = document.getElementById("settings-error");
    const successDiv = document.getElementById("settings-success");

    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = "block";
    }
    if (errorDiv) {
      errorDiv.style.display = "none";
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
    this.container.innerHTML = "";
  }
}
