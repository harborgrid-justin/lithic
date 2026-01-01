// Clinical Note Display Component - Vanilla TypeScript
export class ClinicalNote {
  private container: HTMLElement;
  private note: any = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
  }

  setNote(note: any): void {
    this.note = note;
    this.render();
  }

  private render(): void {
    if (!this.note) {
      this.container.innerHTML =
        '<div class="empty-state">No note selected</div>';
      return;
    }

    const createdDate = new Date(this.note.createdAt).toLocaleString();
    const statusClass = `status-${this.note.status}`;

    this.container.innerHTML = `
      <div class="clinical-note">
        <div class="note-header">
          <div class="note-title">
            <h3>${this.getNoteTypeLabel(this.note.noteType)}</h3>
            <span class="note-status ${statusClass}">${this.note.status}</span>
          </div>
          <div class="note-meta">
            <div><strong>Created:</strong> ${createdDate}</div>
            <div><strong>Provider:</strong> ${this.note.providerId}</div>
          </div>
        </div>

        ${this.note.noteType === "soap" ? this.renderSOAPNote() : this.renderStandardNote()}

        ${
          this.note.signedAt
            ? `
          <div class="note-signature">
            <div class="signature-line"></div>
            <div class="signature-details">
              <div><strong>Electronically Signed By:</strong> ${this.note.signedBy}</div>
              <div><strong>Date:</strong> ${new Date(this.note.signedAt).toLocaleString()}</div>
              <div class="signature-code">${this.note.signature}</div>
            </div>
          </div>
        `
            : ""
        }

        ${
          this.note.addendum && this.note.addendum.length > 0
            ? `
          <div class="note-addendums">
            <h4>Addendums</h4>
            ${this.note.addendum
              .map(
                (add: string) => `
              <div class="addendum-item">${add}</div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private renderSOAPNote(): string {
    return `
      <div class="note-content soap-format">
        ${
          this.note.subjective
            ? `
          <div class="soap-section">
            <h4>Subjective</h4>
            <div class="soap-content">${this.formatContent(this.note.subjective)}</div>
          </div>
        `
            : ""
        }

        ${
          this.note.objective
            ? `
          <div class="soap-section">
            <h4>Objective</h4>
            <div class="soap-content">${this.formatContent(this.note.objective)}</div>
          </div>
        `
            : ""
        }

        ${
          this.note.assessment
            ? `
          <div class="soap-section">
            <h4>Assessment</h4>
            <div class="soap-content">${this.formatContent(this.note.assessment)}</div>
          </div>
        `
            : ""
        }

        ${
          this.note.plan
            ? `
          <div class="soap-section">
            <h4>Plan</h4>
            <div class="soap-content">${this.formatContent(this.note.plan)}</div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private renderStandardNote(): string {
    return `
      <div class="note-content standard-format">
        ${this.formatContent(this.note.content)}
      </div>
    `;
  }

  private formatContent(content: string): string {
    // Preserve line breaks and basic formatting
    return content.replace(/\n/g, "<br>");
  }

  private getNoteTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      progress: "Progress Note",
      soap: "SOAP Note",
      admission: "Admission Note",
      discharge: "Discharge Summary",
      consult: "Consultation Note",
      procedure: "Procedure Note",
    };
    return labels[type] || type;
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}

export default ClinicalNote;
