import adminService from "../../services/AdminService";

/**
 * UserManagement Component
 * Displays and manages users in a table format
 */
export class UserManagement {
  private container: HTMLElement;
  private users: any[] = [];
  private onUserSelect?: (userId: string) => void;

  constructor(container: HTMLElement, onUserSelect?: (userId: string) => void) {
    this.container = container;
    this.onUserSelect = onUserSelect;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="user-management">
        <div class="user-management__header">
          <h2>User Management</h2>
          <div class="user-management__actions">
            <input
              type="text"
              id="user-search"
              class="input"
              placeholder="Search users..."
            />
            <button id="create-user-btn" class="btn btn--primary">
              Create User
            </button>
          </div>
        </div>

        <div id="users-table" class="user-management__table">
          <div class="loading">Loading users...</div>
        </div>

        <div id="pagination" class="pagination"></div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadUsers();
  }

  private attachEventListeners(): void {
    const searchInput = document.getElementById(
      "user-search",
    ) as HTMLInputElement;
    const createBtn = document.getElementById("create-user-btn");

    // Search debounce
    let searchTimeout: any;
    searchInput?.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.loadUsers((e.target as HTMLInputElement).value);
      }, 300);
    });

    createBtn?.addEventListener("click", () => {
      if (this.onUserSelect) {
        this.onUserSelect("new");
      }
    });
  }

  async loadUsers(search?: string): Promise<void> {
    try {
      const params: any = { limit: 50, offset: 0 };
      if (search) params.search = search;

      const response = await adminService.getUsers(params);
      this.users = response.users;
      this.renderTable();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private renderTable(): void {
    const tableContainer = document.getElementById("users-table");
    if (!tableContainer) return;

    if (this.users.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">No users found</div>';
      return;
    }

    const tableHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Organization</th>
            <th>Status</th>
            <th>MFA</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.users.map((user) => this.renderUserRow(user)).join("")}
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = tableHTML;
    this.attachTableEventListeners();
  }

  private renderUserRow(user: any): string {
    const lastLogin = user.lastLogin
      ? new Date(user.lastLogin).toLocaleString()
      : "Never";

    return `
      <tr data-user-id="${user.id}">
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.organizationId}</td>
        <td>
          <span class="badge badge--${user.isActive ? "success" : "danger"}">
            ${user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <span class="badge badge--${user.isMFAEnabled ? "success" : "warning"}">
            ${user.isMFAEnabled ? "Enabled" : "Disabled"}
          </span>
        </td>
        <td>${lastLogin}</td>
        <td>
          <button class="btn btn--sm btn--primary view-user" data-user-id="${user.id}">
            View
          </button>
          <button class="btn btn--sm btn--${user.isActive ? "warning" : "success"} toggle-status" data-user-id="${user.id}">
            ${user.isActive ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
    `;
  }

  private attachTableEventListeners(): void {
    // View user buttons
    const viewButtons = document.querySelectorAll(".view-user");
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = (e.target as HTMLElement).dataset.userId;
        if (userId && this.onUserSelect) {
          this.onUserSelect(userId);
        }
      });
    });

    // Toggle status buttons
    const toggleButtons = document.querySelectorAll(".toggle-status");
    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const userId = (e.target as HTMLElement).dataset.userId;
        if (userId) {
          await this.toggleUserStatus(userId);
        }
      });
    });
  }

  private async toggleUserStatus(userId: string): Promise<void> {
    try {
      const user = this.users.find((u) => u.id === userId);
      if (!user) return;

      if (user.isActive) {
        await adminService.deactivateUser(userId);
      } else {
        await adminService.activateUser(userId);
      }

      await this.loadUsers();
    } catch (error: any) {
      this.showError(error.message);
    }
  }

  private showError(message: string): void {
    const tableContainer = document.getElementById("users-table");
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="error-state">
          <p>Error: ${message}</p>
          <button id="retry-btn" class="btn btn--primary">Retry</button>
        </div>
      `;

      const retryBtn = document.getElementById("retry-btn");
      retryBtn?.addEventListener("click", () => this.loadUsers());
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
