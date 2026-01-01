import { ImagingService } from '../../services/ImagingService';

export class RadiologyWorklist {
  private imagingService: ImagingService;
  private worklist: any[] = [];

  constructor() {
    this.imagingService = new ImagingService();
  }

  async render(container: HTMLElement, filters?: any) {
    const data = await this.imagingService.getWorklist(filters || {});
    this.worklist = data.data || [];

    if (this.worklist.length === 0) {
      container.innerHTML = '<div class="empty-state">No worklist items found</div>';
      return;
    }

    container.innerHTML = `
      <div class="worklist">
        <table class="data-table worklist-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Procedure</th>
              <th>Modality</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Technician</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.worklist.map(item => this.createWorklistRow(item)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.attachEventListeners(container);
  }

  private createWorklistRow(item: any): string {
    return `
      <tr data-item-id="${item.id}" class="worklist-row ${this.getRowClass(item.priority)}">
        <td>${this.formatTime(item.scheduledDateTime)}</td>
        <td>
          <div class="patient-info">
            <strong>${item.patientName}</strong>
            <small>${item.patientId || ''}</small>
          </div>
        </td>
        <td>${item.requestedProcedureDescription}</td>
        <td><span class="badge badge-${this.getModalityColor(item.modality)}">${item.modality}</span></td>
        <td><span class="badge badge-${this.getPriorityColor(item.priority)}">${item.priority}</span></td>
        <td><span class="badge badge-${this.getStatusColor(item.status)}">${item.status}</span></td>
        <td>${item.technicianName || 'Unassigned'}</td>
        <td>
          <div class="action-buttons">
            ${this.renderActions(item)}
          </div>
        </td>
      </tr>
    `;
  }

  private renderActions(item: any): string {
    const actions = [];

    if (item.status === 'SCHEDULED') {
      actions.push(`<button class="btn btn-sm btn-success" data-action="start" data-item-id="${item.id}">Start</button>`);
    }

    if (item.status === 'IN_PROGRESS') {
      actions.push(`<button class="btn btn-sm btn-primary" data-action="complete" data-item-id="${item.id}">Complete</button>`);
    }

    actions.push(`<button class="btn btn-sm btn-secondary" data-action="view" data-item-id="${item.id}">View</button>`);

    return actions.join('');
  }

  private attachEventListeners(container: HTMLElement) {
    container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const itemId = target.dataset.itemId;

      if (!itemId) return;

      if (action === 'start') {
        await this.startItem(itemId);
      } else if (action === 'complete') {
        await this.completeItem(itemId);
      } else if (action === 'view') {
        this.viewItem(itemId);
      }
    });
  }

  private async startItem(itemId: string) {
    try {
      await this.imagingService.startWorklistItem(itemId);
      alert('Exam started');
      // TODO: Refresh worklist
    } catch (error) {
      console.error('Error starting item:', error);
      alert('Failed to start exam');
    }
  }

  private async completeItem(itemId: string) {
    try {
      await this.imagingService.completeWorklistItem(itemId);
      alert('Exam completed');
      // TODO: Refresh worklist
    } catch (error) {
      console.error('Error completing item:', error);
      alert('Failed to complete exam');
    }
  }

  private viewItem(itemId: string) {
    window.location.href = `#/imaging/worklist/${itemId}`;
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getRowClass(priority: string): string {
    return priority === 'STAT' || priority === 'URGENT' ? 'priority-high' : '';
  }

  private getModalityColor(modality: string): string {
    const colors: Record<string, string> = {
      'CT': 'blue',
      'MRI': 'purple',
      'XRAY': 'green',
      'US': 'cyan',
    };
    return colors[modality] || 'gray';
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'ROUTINE': 'secondary',
      'URGENT': 'warning',
      'STAT': 'danger',
    };
    return colors[priority] || 'secondary';
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'SCHEDULED': 'info',
      'IN_PROGRESS': 'primary',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return colors[status] || 'secondary';
  }
}
