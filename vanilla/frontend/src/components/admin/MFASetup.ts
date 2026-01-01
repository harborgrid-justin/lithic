import adminService from "../../services/AdminService";

/**
 * MFASetup Component
 * Setup and manage MFA for user
 */
export class MFASetup {
  private container: HTMLElement;
  private mfaEnabled: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    try {
      const statusResponse = await adminService.getMFAStatus();
      this.mfaEnabled = statusResponse.enabled;

      this.container.innerHTML = `
        <div class="mfa-setup">
          <h3>Multi-Factor Authentication (MFA)</h3>

          <div class="mfa-status">
            <span class="badge badge--${this.mfaEnabled ? "success" : "warning"}">
              ${this.mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          ${this.mfaEnabled ? this.renderDisableForm() : this.renderEnableForm()}
        </div>
      `;

      this.attachEventListeners();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderEnableForm(): string {
    return `
      <div class="mfa-enable">
        <p>Enable MFA to add an extra layer of security to your account.</p>
        <button id="setup-mfa-btn" class="btn btn--primary">
          Setup MFA
        </button>

        <div id="mfa-setup-wizard" style="display: none;">
          <div class="mfa-step">
            <h4>Step 1: Scan QR Code</h4>
            <div id="qr-code-container"></div>
            <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
          </div>

          <div class="mfa-step">
            <h4>Step 2: Save Backup Codes</h4>
            <div id="backup-codes-container"></div>
            <p class="warning">Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.</p>
          </div>

          <div class="mfa-step">
            <h4>Step 3: Verify</h4>
            <input
              type="text"
              id="verify-token"
              class="input"
              placeholder="Enter 6-digit code"
              maxlength="6"
            />
            <button id="enable-mfa-btn" class="btn btn--success">
              Enable MFA
            </button>
          </div>

          <div id="mfa-error" class="error-message" style="display: none;"></div>
        </div>
      </div>
    `;
  }

  private renderDisableForm(): string {
    return `
      <div class="mfa-disable">
        <p>MFA is currently enabled on your account.</p>

        <div class="form-group">
          <label for="disable-token">Enter MFA code to disable</label>
          <input
            type="text"
            id="disable-token"
            class="input"
            placeholder="Enter 6-digit code"
            maxlength="6"
          />
        </div>

        <button id="disable-mfa-btn" class="btn btn--danger">
          Disable MFA
        </button>

        <button id="regenerate-codes-btn" class="btn btn--secondary">
          Regenerate Backup Codes
        </button>

        <div id="mfa-error" class="error-message" style="display: none;"></div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const setupBtn = document.getElementById("setup-mfa-btn");
    const enableBtn = document.getElementById("enable-mfa-btn");
    const disableBtn = document.getElementById("disable-mfa-btn");
    const regenerateBtn = document.getElementById("regenerate-codes-btn");

    setupBtn?.addEventListener("click", () => this.setupMFA());
    enableBtn?.addEventListener("click", () => this.enableMFA());
    disableBtn?.addEventListener("click", () => this.disableMFA());
    regenerateBtn?.addEventListener("click", () =>
      this.regenerateBackupCodes(),
    );
  }

  private async setupMFA(): Promise<void> {
    try {
      const response = await adminService.setupMFA();

      // Show QR code
      const qrContainer = document.getElementById("qr-code-container");
      if (qrContainer) {
        qrContainer.innerHTML = `<img src="${response.qrCode}" alt="MFA QR Code" />`;
      }

      // Show backup codes
      const codesContainer = document.getElementById("backup-codes-container");
      if (codesContainer) {
        codesContainer.innerHTML = `
          <div class="backup-codes">
            ${response.backupCodes
              .map(
                (code: string) => `
              <div class="backup-code">${code}</div>
            `,
              )
              .join("")}
          </div>
        `;
      }

      // Show wizard
      const wizard = document.getElementById("mfa-setup-wizard");
      if (wizard) {
        wizard.style.display = "block";
      }

      // Hide setup button
      const setupBtn = document.getElementById("setup-mfa-btn");
      if (setupBtn) {
        setupBtn.style.display = "none";
      }
    } catch (error: any) {
      this.showMFAError(error.message);
    }
  }

  private async enableMFA(): Promise<void> {
    const tokenInput = document.getElementById(
      "verify-token",
    ) as HTMLInputElement;
    const token = tokenInput?.value;

    if (!token || token.length !== 6) {
      this.showMFAError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await adminService.enableMFA(token);
      alert("MFA enabled successfully!");
      await this.render();
    } catch (error: any) {
      this.showMFAError(error.message);
    }
  }

  private async disableMFA(): Promise<void> {
    const tokenInput = document.getElementById(
      "disable-token",
    ) as HTMLInputElement;
    const token = tokenInput?.value;

    if (!token || token.length !== 6) {
      this.showMFAError("Please enter a valid 6-digit code");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to disable MFA? This will reduce your account security.",
      )
    ) {
      return;
    }

    try {
      await adminService.disableMFA(token);
      alert("MFA disabled successfully");
      await this.render();
    } catch (error: any) {
      this.showMFAError(error.message);
    }
  }

  private async regenerateBackupCodes(): Promise<void> {
    if (
      !confirm(
        "Are you sure you want to regenerate backup codes? Old codes will no longer work.",
      )
    ) {
      return;
    }

    try {
      const response = await adminService.regenerateBackupCodes();

      const codesHTML = `
        <div class="backup-codes-modal">
          <h4>New Backup Codes</h4>
          <div class="backup-codes">
            ${response.backupCodes
              .map(
                (code: string) => `
              <div class="backup-code">${code}</div>
            `,
              )
              .join("")}
          </div>
          <p class="warning">Save these codes in a safe place. They will not be shown again.</p>
          <button id="close-codes-modal" class="btn btn--primary">Close</button>
        </div>
      `;

      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = codesHTML;
      document.body.appendChild(modal);

      const closeBtn = document.getElementById("close-codes-modal");
      closeBtn?.addEventListener("click", () => modal.remove());
    } catch (error: any) {
      this.showMFAError(error.message);
    }
  }

  private showMFAError(message: string): void {
    const errorDiv = document.getElementById("mfa-error");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
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
