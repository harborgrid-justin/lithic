import adminService from "../../services/AdminService";

/**
 * RoleManager Component
 * Manages user roles and role assignments
 */
export class RoleManager {
  private container: HTMLElement;
  private userId?: string;
  private roles: any[] = [];

  constructor(container: HTMLElement, userId?: string) {
    this.container = container;
    this.userId = userId;
  }

  async render(): Promise<void> {
    try {
      const response = await adminService.getRoles();
      this.roles = response.roles;

      this.container.innerHTML = `
        <div class="role-manager">
          <h3>Role Management</h3>
          <div class="roles-grid">
            ${this.roles.map((role) => this.renderRoleCard(role)).join("")}
          </div>
        </div>
      `;

      if (this.userId) {
        await this.loadUserRoles();
      }
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderRoleCard(role: any): string {
    return `
      <div class="role-card" data-role-id="${role.id}">
        <div class="role-card__header">
          <h4>${role.name}</h4>
          <span class="badge badge--${role.isSystem ? "primary" : "secondary"}">
            ${role.isSystem ? "System" : "Custom"}
          </span>
        </div>
        <p class="role-card__description">${role.description}</p>
        <div class="role-card__permissions">
          <strong>Permissions:</strong>
          <ul>
            ${role.permissions
              .slice(0, 5)
              .map(
                (p: any) => `
              <li>${p.resource}:${p.action}</li>
            `,
              )
              .join("")}
            ${role.permissions.length > 5 ? `<li>+${role.permissions.length - 5} more</li>` : ""}
          </ul>
        </div>
      </div>
    `;
  }

  private async loadUserRoles(): Promise<void> {
    if (!this.userId) return;

    try {
      const response = await adminService.getUser(this.userId);
      const userRoles = response.user.roles;

      // Highlight assigned roles
      userRoles.forEach((roleName: string) => {
        const roleCard = document.querySelector(
          `[data-role-name="${roleName}"]`,
        );
        roleCard?.classList.add("role-card--assigned");
      });
    } catch (error) {
      console.error("Failed to load user roles:", error);
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
