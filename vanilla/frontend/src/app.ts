/**
 * Main Application Entry Point
 * Lithic Enterprise Healthcare Platform - Vanilla TypeScript
 */

import { ready } from './utils/dom';
import { authService as auth } from './services/auth';
import { Layout } from './components/layout/Layout';
import { SidebarMenuItem } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { toast } from './components/ui/Toast';

import './styles/main.css';

type Page = 'login' | 'register' | 'dashboard';

class App {
  private currentPage: Page = 'login';
  private layout: Layout | null = null;
  private appContainer: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the application
   */
  private async initialize(): Promise<void> {
    ready(() => {
      this.appContainer = document.getElementById('app');

      if (!this.appContainer) {
        console.error('App container not found');
        return;
      }

      this.checkAuthentication();
    });
  }

  /**
   * Check if user is authenticated
   */
  private async checkAuthentication(): Promise<void> {
    const isAuthenticated = auth.isAuthenticated();

    if (isAuthenticated) {
      this.navigateTo('dashboard');
    } else {
      this.navigateTo('login');
    }
  }

  /**
   * Navigate to a page
   */
  private navigateTo(page: Page): void {
    this.currentPage = page;
    this.render();
  }

  /**
   * Render the current page
   */
  private render(): void {
    if (!this.appContainer) return;

    // Clear container
    this.appContainer.innerHTML = '';

    // Render based on current page
    switch (this.currentPage) {
      case 'login':
        this.renderLoginPage();
        break;
      case 'register':
        this.renderRegisterPage();
        break;
      case 'dashboard':
        this.renderDashboardPage();
        break;
    }
  }

  /**
   * Render login page
   */
  private renderLoginPage(): void {
    const loginPage = new LoginPage({
      onLoginSuccess: () => {
        this.navigateTo('dashboard');
      },
      onRegisterClick: () => {
        this.navigateTo('register');
      },
    });

    loginPage.mount(this.appContainer!);
  }

  /**
   * Render register page
   */
  private renderRegisterPage(): void {
    const registerPage = new RegisterPage({
      onRegisterSuccess: () => {
        this.navigateTo('dashboard');
      },
      onLoginClick: () => {
        this.navigateTo('login');
      },
    });

    registerPage.mount(this.appContainer!);
  }

  /**
   * Render dashboard page (with layout)
   */
  private renderDashboardPage(): void {
    const user = auth.getCurrentUser();

    if (!user) {
      this.navigateTo('login');
      return;
    }

    // Create sidebar menu items
    const sidebarItems: SidebarMenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/dashboard',
        active: true,
      },
      {
        id: 'patients',
        label: 'Patients',
        icon: '👥',
        path: '/patients',
      },
      {
        id: 'appointments',
        label: 'Appointments',
        icon: '📅',
        path: '/appointments',
      },
      {
        id: 'medical-records',
        label: 'Medical Records',
        icon: '📋',
        path: '/medical-records',
      },
      {
        id: 'prescriptions',
        label: 'Prescriptions',
        icon: '💊',
        path: '/prescriptions',
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: '💳',
        path: '/billing',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: '📈',
        path: '/reports',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙',
        path: '/settings',
      },
    ];

    // Create layout
    this.layout = new Layout({
      header: {
        title: 'Lithic Healthcare',
        onLogout: this.handleLogout.bind(this),
      },
      sidebar: {
        items: sidebarItems,
        onNavigate: this.handleSidebarNavigation.bind(this),
      },
      footer: {
        copyright: `© ${new Date().getFullYear()} Lithic Healthcare. All rights reserved. HIPAA Compliant.`,
        links: [
          { label: 'Privacy Policy', url: '#' },
          { label: 'Terms of Service', url: '#' },
          { label: 'Support', url: '#' },
        ],
      },
      showSidebar: true,
    });

    this.layout.mount(this.appContainer!);

    // Render dashboard content
    const dashboardPage = new DashboardPage({});
    this.layout.setContent(dashboardPage);
  }

  /**
   * Handle logout
   */
  private async handleLogout(): Promise<void> {
    try {
      await auth.logout();
      toast.success('Logged out successfully');
      this.navigateTo('login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  }

  /**
   * Handle sidebar navigation
   */
  private handleSidebarNavigation(path: string): void {
    console.log('Navigate to:', path);
    toast.info(`Navigation to ${path} coming soon!`);

    // Update active sidebar item
    if (this.layout) {
      this.layout.setActiveSidebarItem(path);
    }

    // TODO: Implement routing and page navigation
  }
}

// Initialize application
new App();

export default App;
