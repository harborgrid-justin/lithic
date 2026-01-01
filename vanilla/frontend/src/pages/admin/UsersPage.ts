import { UserManagement } from '../../components/admin/UserManagement';

/**
 * UsersPage
 * User management page
 */
export class UsersPage {
  private container: HTMLElement;
  private userManagement: UserManagement | null = null;
  private onNavigate?: (page: string, params?: any) => void;

  constructor(container: HTMLElement, onNavigate?: (page: string, params?: any) => void) {
    this.container = container;
    this.onNavigate = onNavigate;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="users-page">
        <header class="page-header">
          <h1>User Management</h1>
          <p>Manage users, roles, and permissions</p>
        </header>

        <div id="user-management-container"></div>
      </div>
    `;

    const userContainer = document.getElementById('user-management-container');
    if (userContainer) {
      this.userManagement = new UserManagement(userContainer, (userId) => {
        if (this.onNavigate) {
          if (userId === 'new') {
            this.onNavigate('new-user');
          } else {
            this.onNavigate('user-detail', { userId });
          }
        }
      });
      await this.userManagement.render();
    }
  }

  destroy(): void {
    this.userManagement?.destroy();
    this.container.innerHTML = '';
  }
}
