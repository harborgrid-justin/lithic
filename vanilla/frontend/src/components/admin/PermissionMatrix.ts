import adminService from "../../services/AdminService";

/**
 * PermissionMatrix Component
 * Displays permission matrix for roles
 */
export class PermissionMatrix {
  private container: HTMLElement;
  private roles: any[] = [];
  private permissions: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions(),
      ]);

      this.roles = rolesResponse.roles;
      this.permissions = permissionsResponse.permissions;

      this.container.innerHTML = `
        <div class="permission-matrix">
          <h3>Permission Matrix</h3>
          <div class="matrix-table-container">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  ${this.permissions.actions
                    .map(
                      (action: string) => `
                    <th>${action}</th>
                  `,
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${this.permissions.resources
                  .map(
                    (resource: string) => `
                  <tr>
                    <td><strong>${resource}</strong></td>
                    ${this.permissions.actions
                      .map(
                        (action: string) => `
                      <td class="matrix-cell">
                        <input
                          type="checkbox"
                          data-resource="${resource}"
                          data-action="${action}"
                          disabled
                        />
                      </td>
                    `,
                      )
                      .join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="matrix-legend">
            <span class="badge badge--info">View-only matrix</span>
            <p>Customize permissions per role in the Role Manager</p>
          </div>
        </div>
      `;
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
    this.container.innerHTML = "";
  }
}
