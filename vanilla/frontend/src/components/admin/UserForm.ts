import adminService from '../../services/AdminService';

/**
 * UserForm Component
 * Form for creating and editing users
 */
export class UserForm {
  private container: HTMLElement;
  private userId?: string;
  private onSave?: () => void;
  private onCancel?: () => void;

  constructor(
    container: HTMLElement,
    userId?: string,
    onSave?: () => void,
    onCancel?: () => void
  ) {
    this.container = container;
    this.userId = userId;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  async render(): Promise<void> {
    const isEdit = !!this.userId;
    let userData: any = {};
    let roles: any[] = [];

    if (isEdit) {
      try {
        const response = await adminService.getUser(this.userId!);
        userData = response.user;
      } catch (error: any) {
        this.showError(error.message);
        return;
      }
    }

    try {
      const rolesResponse = await adminService.getRoles();
      roles = rolesResponse.roles;
    } catch (error: any) {
      this.showError('Failed to load roles');
    }

    this.container.innerHTML = `
      <div class="user-form">
        <h2>${isEdit ? 'Edit User' : 'Create New User'}</h2>

        <form id="user-form" class="form">
          <div class="form-group">
            <label for="email">Email *</label>
            <input
              type="email"
              id="email"
              class="input"
              value="${userData.email || ''}"
              ${isEdit ? 'disabled' : ''}
              required
            />
          </div>

          ${!isEdit ? `
            <div class="form-group">
              <label for="password">Password *</label>
              <input
                type="password"
                id="password"
                class="input"
                minlength="12"
                required
              />
              <small class="form-hint">Minimum 12 characters with uppercase, lowercase, number, and special character</small>
            </div>
          ` : ''}

          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              class="input"
              value="${userData.firstName || ''}"
              required
            />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              class="input"
              value="${userData.lastName || ''}"
              required
            />
          </div>

          <div class="form-group">
            <label>Roles</label>
            <div id="roles-checkboxes" class="checkbox-group">
              ${roles.map((role) => `
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    name="roles"
                    value="${role.name}"
                    ${userData.roles?.includes(role.name) ? 'checked' : ''}
                  />
                  <span>${role.name}</span>
                  <small>${role.description}</small>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn--primary">
              ${isEdit ? 'Update User' : 'Create User'}
            </button>
            <button type="button" id="cancel-btn" class="btn btn--secondary">
              Cancel
            </button>
          </div>

          <div id="form-error" class="error-message" style="display: none;"></div>
        </form>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = document.getElementById('user-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-btn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    cancelBtn?.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
    });
  }

  private async handleSubmit(): Promise<void> {
    const form = document.getElementById('user-form') as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const roles = formData.getAll('roles') as string[];

    try {
      if (this.userId) {
        // Update user
        await adminService.updateUser(this.userId, {
          firstName,
          lastName,
        });

        // Update roles if changed
        // This would require comparing with current roles and updating accordingly
      } else {
        // Create user
        await adminService.createUser({
          email,
          password,
          firstName,
          lastName,
          roles,
        });
      }

      if (this.onSave) {
        this.onSave();
      }
    } catch (error: any) {
      this.showFormError(error.message);
    }
  }

  private showFormError(message: string): void {
    const errorDiv = document.getElementById('form-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
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
    this.container.innerHTML = '';
  }
}
