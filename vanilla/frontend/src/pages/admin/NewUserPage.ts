import { UserForm } from "../../components/admin/UserForm";

/**
 * NewUserPage
 * Create new user page
 */
export class NewUserPage {
  private container: HTMLElement;
  private userForm: UserForm | null = null;
  private onNavigate?: (page: string) => void;

  constructor(container: HTMLElement, onNavigate?: (page: string) => void) {
    this.container = container;
    this.onNavigate = onNavigate;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="new-user-page">
        <header class="page-header">
          <h1>Create New User</h1>
          <p>Add a new user to the system</p>
        </header>

        <div id="user-form-container"></div>
      </div>
    `;

    const formContainer = document.getElementById("user-form-container");
    if (formContainer) {
      this.userForm = new UserForm(
        formContainer,
        undefined,
        () => {
          // On save
          if (this.onNavigate) {
            this.onNavigate("users");
          }
        },
        () => {
          // On cancel
          if (this.onNavigate) {
            this.onNavigate("users");
          }
        },
      );
      await this.userForm.render();
    }
  }

  destroy(): void {
    this.userForm?.destroy();
    this.container.innerHTML = "";
  }
}
