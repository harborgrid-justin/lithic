import { RoleManager } from "../../components/admin/RoleManager";

/**
 * RolesPage
 * Role management page
 */
export class RolesPage {
  private container: HTMLElement;
  private roleManager: RoleManager | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="roles-page">
        <header class="page-header">
          <h1>Role Management</h1>
          <p>View and manage system roles and permissions</p>
        </header>

        <div id="role-manager-container"></div>
      </div>
    `;

    const roleContainer = document.getElementById("role-manager-container");
    if (roleContainer) {
      this.roleManager = new RoleManager(roleContainer);
      await this.roleManager.render();
    }
  }

  destroy(): void {
    this.roleManager?.destroy();
    this.container.innerHTML = "";
  }
}
