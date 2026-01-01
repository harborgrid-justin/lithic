import { PermissionMatrix } from "../../components/admin/PermissionMatrix";

/**
 * PermissionsPage
 * Permission matrix and management page
 */
export class PermissionsPage {
  private container: HTMLElement;
  private permissionMatrix: PermissionMatrix | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="permissions-page">
        <header class="page-header">
          <h1>Permission Management</h1>
          <p>View and configure granular permissions</p>
        </header>

        <div id="permission-matrix-container"></div>
      </div>
    `;

    const matrixContainer = document.getElementById(
      "permission-matrix-container",
    );
    if (matrixContainer) {
      this.permissionMatrix = new PermissionMatrix(matrixContainer);
      await this.permissionMatrix.render();
    }
  }

  destroy(): void {
    this.permissionMatrix?.destroy();
    this.container.innerHTML = "";
  }
}
