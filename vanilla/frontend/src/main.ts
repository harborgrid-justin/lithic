import './styles/main.css';
import { Router } from './router.js';
import { authService } from './services/auth.js';

// Initialize application
class App {
  private router: Router;

  constructor() {
    this.router = new Router();
    this.init();
  }

  private async init() {
    console.log('Lithic Healthcare Platform - Initializing...');

    // Check authentication status
    const isAuthenticated = await authService.checkAuth();

    if (!isAuthenticated && !window.location.pathname.startsWith('/auth')) {
      // Redirect to login if not authenticated
      this.router.navigate('/auth/login');
    } else {
      // Initialize router
      this.setupRoutes();
      this.router.init();
    }

    // Setup global error handler
    this.setupErrorHandler();

    // Setup session timeout
    this.setupSessionTimeout();

    console.log('Lithic Healthcare Platform - Ready');
  }

  private setupRoutes() {
    // Auth routes
    this.router.register('/auth/login', () => this.renderLoginPage());
    this.router.register('/auth/logout', () => this.handleLogout());

    // Dashboard
    this.router.register('/', () => this.renderDashboard());
    this.router.register('/dashboard', () => this.renderDashboard());

    // Patient Management
    this.router.register('/patients', () => this.renderPatientsPage());
    this.router.register('/patients/:id', (params) => this.renderPatientDetailPage(params.id));

    // Clinical
    this.router.register('/clinical', () => this.renderClinicalPage());

    // Scheduling
    this.router.register('/scheduling', () => this.renderSchedulingPage());

    // Billing
    this.router.register('/billing', () => this.renderBillingPage());

    // Laboratory
    this.router.register('/laboratory', () => this.renderLaboratoryPage());

    // Pharmacy
    this.router.register('/pharmacy', () => this.renderPharmacyPage());

    // Imaging
    this.router.register('/imaging', () => this.renderImagingPage());

    // Analytics
    this.router.register('/analytics', () => this.renderAnalyticsPage());

    // Admin
    this.router.register('/admin', () => this.renderAdminPage());

    // 404 Not Found
    this.router.register('*', () => this.render404Page());
  }

  private setupErrorHandler() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showToast('An unexpected error occurred', 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showToast('An unexpected error occurred', 'error');
    });
  }

  private setupSessionTimeout() {
    // HIPAA compliance: 15-minute session timeout
    const TIMEOUT_MINUTES = 15;
    let timeoutId: number;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        this.showToast('Session expired due to inactivity', 'warning');
        this.handleLogout();
      }, TIMEOUT_MINUTES * 60 * 1000);
    };

    // Reset timeout on user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout();
  }

  // Page Renderers (placeholder implementations - agents will implement)
  private renderLoginPage() {
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `
        <div class="page-container">
          <div class="login-container">
            <h2>Lithic Healthcare Platform</h2>
            <form id="login-form" class="login-form">
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
              </div>
              <button type="submit" class="btn btn-primary">Login</button>
            </form>
          </div>
        </div>
      `;
      
      document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Agent 1 will implement authentication
        this.showToast('Login functionality pending - Agent 1', 'info');
      });
    }
  }

  private async handleLogout() {
    await authService.logout();
    this.router.navigate('/auth/login');
  }

  private renderDashboard() {
    this.renderPage('Dashboard', '<p>Dashboard - Coming soon</p>');
  }

  private renderPatientsPage() {
    this.renderPage('Patient Management', '<p>Patient Management - Agent 2</p>');
  }

  private renderPatientDetailPage(id: string) {
    this.renderPage(`Patient Details - ${id}`, `<p>Patient ID: ${id} - Agent 2</p>`);
  }

  private renderClinicalPage() {
    this.renderPage('Clinical Documentation', '<p>Clinical Module - Agent 3</p>');
  }

  private renderSchedulingPage() {
    this.renderPage('Scheduling', '<p>Scheduling Module - Agent 4</p>');
  }

  private renderBillingPage() {
    this.renderPage('Billing & Claims', '<p>Billing Module - Agent 5</p>');
  }

  private renderLaboratoryPage() {
    this.renderPage('Laboratory', '<p>Laboratory Module - Agent 6</p>');
  }

  private renderPharmacyPage() {
    this.renderPage('Pharmacy', '<p>Pharmacy Module - Agent 7</p>');
  }

  private renderImagingPage() {
    this.renderPage('Imaging & Radiology', '<p>Imaging Module - Agent 8</p>');
  }

  private renderAnalyticsPage() {
    this.renderPage('Analytics & Reports', '<p>Analytics Module - Agent 9</p>');
  }

  private renderAdminPage() {
    this.renderPage('Administration', '<p>Admin Module - Agent 10</p>');
  }

  private render404Page() {
    this.renderPage('404 - Not Found', '<p>The page you are looking for does not exist.</p>');
  }

  private renderPage(title: string, content: string) {
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `
        <div class="page-container">
          <div class="page-header">
            <h1>${title}</h1>
          </div>
          <div class="page-content">
            ${content}
          </div>
        </div>
      `;
    }
    document.title = `${title} - Lithic Healthcare`;
  }

  private showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

export default App;
