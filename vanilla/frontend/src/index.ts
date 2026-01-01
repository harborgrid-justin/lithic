// Main Application Entry Point - Vanilla TypeScript
import './styles/main.css';
import { ClinicalDashboardPage } from './pages/clinical/ClinicalDashboardPage';

// Simple router
class Router {
  private currentPage: any = null;

  navigate(route: string, params?: any): void {
    // Clean up current page
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    // Hide all page containers
    this.hideAllContainers();

    // Route to appropriate page
    if (route.startsWith('/clinical/dashboard')) {
      this.showDashboard(params);
    } else if (route.startsWith('/clinical/encounters/')) {
      const encounterId = route.split('/').pop();
      if (encounterId === 'new') {
        this.showNewEncounter();
      } else {
        this.showEncounterDetail(encounterId || '');
      }
    } else if (route.startsWith('/clinical/notes')) {
      this.showNotes(params);
    } else if (route.startsWith('/clinical/vitals')) {
      this.showVitals(params);
    } else if (route.startsWith('/clinical/problems')) {
      this.showProblems(params);
    } else if (route.startsWith('/clinical/allergies')) {
      this.showAllergies(params);
    } else if (route.startsWith('/clinical/medications')) {
      this.showMedications(params);
    } else {
      // Default to dashboard
      this.showDashboard(params);
    }
  }

  private hideAllContainers(): void {
    const containers = [
      'clinical-dashboard',
      'encounter-list',
      'encounter-detail',
      'new-encounter',
      'notes-page',
      'vitals-page',
      'problems-page',
      'allergies-page',
      'medications-page',
    ];

    containers.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  private showDashboard(params?: any): void {
    const container = document.getElementById('clinical-dashboard');
    if (container) {
      container.style.display = 'block';
      this.currentPage = new ClinicalDashboardPage('clinical-dashboard', params?.providerId || 'provider-1');
      this.currentPage.init();
    }
  }

  private showEncounterDetail(encounterId: string): void {
    const container = document.getElementById('encounter-detail');
    if (container) {
      container.style.display = 'block';
      // Import and initialize EncounterDetailPage
      import('./pages/clinical/EncounterDetailPage').then(module => {
        this.currentPage = new module.EncounterDetailPage('encounter-detail', encounterId);
        this.currentPage.init();
      });
    }
  }

  private showNewEncounter(): void {
    const container = document.getElementById('new-encounter');
    if (container) {
      container.style.display = 'block';
      // Import and initialize NewEncounterPage
      import('./pages/clinical/NewEncounterPage').then(module => {
        this.currentPage = new module.NewEncounterPage('new-encounter');
        this.currentPage.init();
      });
    }
  }

  private showNotes(params?: any): void {
    const container = document.getElementById('notes-page');
    if (container) {
      container.style.display = 'block';
      // Import and initialize NotesPage
      import('./pages/clinical/NotesPage').then(module => {
        this.currentPage = new module.NotesPage(
          'notes-page',
          params?.encounterId || '',
          params?.patientId || ''
        );
        this.currentPage.init();
      });
    }
  }

  private showVitals(params?: any): void {
    const container = document.getElementById('vitals-page');
    if (container) {
      container.style.display = 'block';
      // Import and initialize VitalsPage
      import('./pages/clinical/VitalsPage').then(module => {
        this.currentPage = new module.VitalsPage(
          'vitals-page',
          params?.patientId || '',
          params?.encounterId
        );
        this.currentPage.init();
      });
    }
  }

  private showProblems(params?: any): void {
    const container = document.getElementById('problems-page');
    if (container) {
      container.style.display = 'block';
      // Import and initialize ProblemsPage
      import('./pages/clinical/ProblemsPage').then(module => {
        this.currentPage = new module.ProblemsPage('problems-page', params?.patientId || '');
        this.currentPage.init();
      });
    }
  }

  private showAllergies(params?: any): void {
    const container = document.getElementById('allergies-page');
    if (container) {
      container.style.display = 'block';
      // Import and initialize AllergiesPage
      import('./pages/clinical/AllergiesPage').then(module => {
        this.currentPage = new module.AllergiesPage('allergies-page', params?.patientId || '');
        this.currentPage.init();
      });
    }
  }

  private showMedications(params?: any): void {
    const container = document.getElementById('medications-page');
    if (container) {
      container.style.display = 'block';
      // Import and initialize MedicationsPage
      import('./pages/clinical/MedicationsPage').then(module => {
        this.currentPage = new module.MedicationsPage('medications-page', params?.patientId || '');
        this.currentPage.init();
      });
    }
  }
}

// Initialize application
const router = new Router();

// Expose router globally for navigation
(window as any).clinicalRouter = router;

// Start application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Lithic Clinical Documentation & EHR System Starting...');

  // Get initial route from URL or default to dashboard
  const initialRoute = window.location.pathname || '/clinical/dashboard';
  router.navigate(initialRoute);
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
  router.navigate(window.location.pathname);
});

export { router };
