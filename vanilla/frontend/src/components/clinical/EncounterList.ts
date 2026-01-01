// Encounter List Component - Vanilla TypeScript
export class EncounterList {
  private container: HTMLElement;
  private encounters: any[] = [];
  private onEncounterClick?: (encounterId: string) => void;

  constructor(containerId: string, onEncounterClick?: (encounterId: string) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onEncounterClick = onEncounterClick;
  }

  setEncounters(encounters: any[]): void {
    this.encounters = encounters;
    this.render();
  }

  private render(): void {
    if (this.encounters.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>No encounters found</p>
        </div>
      `;
      return;
    }

    const encountersHTML = this.encounters.map(encounter => this.renderEncounter(encounter)).join('');

    this.container.innerHTML = `
      <div class="encounter-list">
        ${encountersHTML}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderEncounter(encounter: any): string {
    const date = new Date(encounter.encounterDate).toLocaleDateString();
    const time = new Date(encounter.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const statusClass = `status-${encounter.status}`;
    const statusLabel = this.getStatusLabel(encounter.status);

    return `
      <div class="encounter-card" data-encounter-id="${encounter.id}">
        <div class="encounter-header">
          <div class="encounter-type">${encounter.encounterType}</div>
          <span class="encounter-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="encounter-body">
          <div class="encounter-date">
            <strong>Date:</strong> ${date} ${time}
          </div>
          <div class="encounter-chief-complaint">
            <strong>Chief Complaint:</strong> ${encounter.chiefComplaint}
          </div>
          <div class="encounter-department">
            <strong>Department:</strong> ${encounter.department}
          </div>
          ${encounter.icd10Codes && encounter.icd10Codes.length > 0 ? `
            <div class="encounter-diagnoses">
              <strong>Diagnoses:</strong> ${encounter.icd10Codes.join(', ')}
            </div>
          ` : ''}
        </div>
        <div class="encounter-footer">
          <button class="btn btn-primary view-encounter-btn" data-encounter-id="${encounter.id}">
            View Details
          </button>
        </div>
      </div>
    `;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'scheduled': 'Scheduled',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  }

  private attachEventListeners(): void {
    const buttons = this.container.querySelectorAll('.view-encounter-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const encounterId = (e.target as HTMLElement).getAttribute('data-encounter-id');
        if (encounterId && this.onEncounterClick) {
          this.onEncounterClick(encounterId);
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default EncounterList;
