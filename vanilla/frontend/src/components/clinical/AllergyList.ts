// Allergy List Component - Vanilla TypeScript
export class AllergyList {
  private container: HTMLElement;
  private allergies: any[] = [];

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
  }

  setAllergies(allergies: any[]): void {
    this.allergies = allergies;
    this.render();
  }

  private render(): void {
    if (this.allergies.length === 0) {
      this.container.innerHTML = '<div class="no-allergies">No Known Allergies (NKA)</div>';
      return;
    }

    const allergiesHTML = this.allergies.map(allergy => this.renderAllergy(allergy)).join('');

    this.container.innerHTML = `
      <div class="allergy-list">
        ${allergiesHTML}
      </div>
    `;
  }

  private renderAllergy(allergy: any): string {
    const severityClass = `severity-${allergy.severity}`;
    const typeClass = `type-${allergy.allergenType}`;

    return `
      <div class="allergy-item ${severityClass}">
        <div class="allergy-header">
          <div class="allergen-name">
            <span class="severity-icon">${this.getSeverityIcon(allergy.severity)}</span>
            <strong>${allergy.allergen}</strong>
          </div>
          <span class="allergy-badge ${severityClass}">${allergy.severity}</span>
        </div>
        <div class="allergy-details">
          <div class="allergy-type">
            <span class="type-badge ${typeClass}">${allergy.allergenType}</span>
          </div>
          <div class="allergy-reactions">
            <strong>Reactions:</strong> ${allergy.reaction.join(', ')}
          </div>
          ${allergy.notes ? `<div class="allergy-notes">${allergy.notes}</div>` : ''}
          ${allergy.onsetDate ? `
            <div class="allergy-onset">
              <strong>Onset:</strong> ${new Date(allergy.onsetDate).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      'life-threatening': '⚠️',
      'severe': '🔴',
      'moderate': '🟠',
      'mild': '🟡',
    };
    return icons[severity] || '⚪';
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default AllergyList;
