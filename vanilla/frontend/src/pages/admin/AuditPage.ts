import { AuditLog } from '../../components/admin/AuditLog';

/**
 * AuditPage
 * Comprehensive audit log viewing and filtering
 */
export class AuditPage {
  private container: HTMLElement;
  private auditLog: AuditLog | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="audit-page">
        <header class="page-header">
          <h1>Audit Logs</h1>
          <p>View and analyze system audit trails for HIPAA compliance</p>
        </header>

        <div id="audit-log-container"></div>
      </div>
    `;

    const auditContainer = document.getElementById('audit-log-container');
    if (auditContainer) {
      this.auditLog = new AuditLog(auditContainer);
      await this.auditLog.render();
    }
  }

  destroy(): void {
    this.auditLog?.destroy();
    this.container.innerHTML = '';
  }
}
