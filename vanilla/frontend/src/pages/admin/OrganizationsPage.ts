import { OrganizationSettings } from '../../components/admin/OrganizationSettings';
import adminService from '../../services/AdminService';

/**
 * OrganizationsPage
 * Organization management and settings
 */
export class OrganizationsPage {
  private container: HTMLElement;
  private organizationSettings: OrganizationSettings | null = null;
  private organizationId: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    // Get current user to determine organization
    try {
      const userResponse = await adminService.getCurrentUser();
      this.organizationId = userResponse.user.organizationId;

      this.container.innerHTML = `
        <div class="organizations-page">
          <header class="page-header">
            <h1>Organization Management</h1>
            <p>Configure organization settings and security policies</p>
          </header>

          <div id="organization-settings-container"></div>
        </div>
      `;

      const settingsContainer = document.getElementById('organization-settings-container');
      if (settingsContainer) {
        this.organizationSettings = new OrganizationSettings(
          settingsContainer,
          this.organizationId
        );
        await this.organizationSettings.render();
      }
    } catch (error: any) {
      this.showError(error.message);
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
    this.organizationSettings?.destroy();
    this.container.innerHTML = '';
  }
}
