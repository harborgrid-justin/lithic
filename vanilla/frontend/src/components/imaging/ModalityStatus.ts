import { ImagingService } from '../../services/ImagingService';

export class ModalityStatus {
  private imagingService: ImagingService;
  private modalities: any[] = [];

  constructor() {
    this.imagingService = new ImagingService();
  }

  async render(container: HTMLElement) {
    this.modalities = await this.imagingService.getModalities();

    if (this.modalities.length === 0) {
      container.innerHTML = '<div class="empty-state">No modalities configured</div>';
      return;
    }

    container.innerHTML = `
      <div class="modality-status-grid">
        ${this.modalities.map(modality => this.createModalityCard(modality)).join('')}
      </div>
    `;
  }

  private createModalityCard(modality: any): string {
    const statusIcons: Record<string, string> = {
      'ONLINE': '✅',
      'BUSY': '🟡',
      'OFFLINE': '🔴',
      'MAINTENANCE': '🔧',
    };

    return `
      <div class="modality-card ${this.getStatusClass(modality.status)}">
        <div class="modality-status-icon">${statusIcons[modality.status] || '❓'}</div>
        <div class="modality-name">${modality.name}</div>
        <div class="modality-type">${modality.type}</div>
        <div class="modality-stats">
          <div class="stat-item">
            <span class="stat-label">Queue:</span>
            <span class="stat-value">${modality.queuedExams || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Today:</span>
            <span class="stat-value">${modality.todayExams || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ONLINE': 'status-online',
      'BUSY': 'status-busy',
      'OFFLINE': 'status-offline',
      'MAINTENANCE': 'status-maintenance',
    };
    return classes[status] || '';
  }
}
