// Problem List Component - Vanilla TypeScript
export class ProblemList {
  private container: HTMLElement;
  private problems: any[] = [];
  private onUpdate?: (problemId: string, status: string) => void;

  constructor(containerId: string, onUpdate?: (problemId: string, status: string) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onUpdate = onUpdate;
  }

  setProblems(problems: any[]): void {
    this.problems = problems;
    this.render();
  }

  private render(): void {
    if (this.problems.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No problems recorded</div>';
      return;
    }

    const problemsHTML = this.problems.map(problem => this.renderProblem(problem)).join('');

    this.container.innerHTML = `
      <div class="problem-list">
        ${problemsHTML}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderProblem(problem: any): string {
    const onsetDate = new Date(problem.onsetDate).toLocaleDateString();
    const statusClass = `status-${problem.status}`;
    const severityClass = `severity-${problem.severity}`;

    return `
      <div class="problem-item ${statusClass}" data-problem-id="${problem.id}">
        <div class="problem-header">
          <div class="problem-name">
            <strong>${problem.problemName}</strong>
            <span class="icd-code">${problem.icd10Code}</span>
          </div>
          <div class="problem-badges">
            <span class="badge ${severityClass}">${problem.severity}</span>
            <span class="badge ${statusClass}">${problem.status}</span>
          </div>
        </div>
        <div class="problem-details">
          <div><strong>Onset:</strong> ${onsetDate}</div>
          ${problem.resolvedDate ? `<div><strong>Resolved:</strong> ${new Date(problem.resolvedDate).toLocaleDateString()}</div>` : ''}
          ${problem.notes ? `<div class="problem-notes">${problem.notes}</div>` : ''}
        </div>
        ${problem.status === 'active' ? `
          <div class="problem-actions">
            <button class="btn btn-sm resolve-btn" data-problem-id="${problem.id}">
              Mark Resolved
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const resolveButtons = this.container.querySelectorAll('.resolve-btn');
    resolveButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const problemId = (e.target as HTMLElement).getAttribute('data-problem-id');
        if (problemId && this.onUpdate) {
          this.onUpdate(problemId, 'resolved');
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default ProblemList;
