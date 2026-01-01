export class StudyList {
  private studies: any[] = [];

  constructor() {}

  render(container: HTMLElement, studies: any) {
    this.studies = studies.data || [];

    if (this.studies.length === 0) {
      container.innerHTML = '<div class="empty-state">No studies found</div>';
      return;
    }

    container.innerHTML = `
      <div class="study-list">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Accession</th>
              <th>Modality</th>
              <th>Description</th>
              <th>Series</th>
              <th>Images</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.studies.map((study) => this.createStudyRow(study)).join("")}
          </tbody>
        </table>
      </div>

      ${
        studies.pagination
          ? `
        <div class="pagination">
          <button class="btn btn-sm" data-page="${studies.pagination.page - 1}" ${studies.pagination.page === 1 ? "disabled" : ""}>
            Previous
          </button>
          <span class="pagination-info">
            Page ${studies.pagination.page} of ${studies.pagination.totalPages}
          </span>
          <button class="btn btn-sm" data-page="${studies.pagination.page + 1}" ${studies.pagination.page === studies.pagination.totalPages ? "disabled" : ""}>
            Next
          </button>
        </div>
      `
          : ""
      }
    `;

    this.attachEventListeners(container);
  }

  private createStudyRow(study: any): string {
    return `
      <tr data-study-uid="${study.studyInstanceUID}" class="study-row">
        <td>${this.formatDate(study.studyDate)}</td>
        <td>${study.patientName}</td>
        <td>${study.accessionNumber}</td>
        <td><span class="badge badge-${this.getModalityColor(study.modality)}">${study.modality}</span></td>
        <td>${study.studyDescription || "N/A"}</td>
        <td>${study.numberOfSeries || 0}</td>
        <td>${study.numberOfInstances || 0}</td>
        <td><span class="badge badge-${this.getStatusColor(study.readingStatus)}">${study.readingStatus}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="view" data-study-uid="${study.studyInstanceUID}">View</button>
          <button class="btn btn-sm btn-secondary" data-action="viewer" data-study-uid="${study.studyInstanceUID}">Viewer</button>
        </td>
      </tr>
    `;
  }

  private attachEventListeners(container: HTMLElement) {
    container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const studyUID = target.dataset.studyUid;

      if (target.dataset.action === "view" && studyUID) {
        window.location.href = `#/imaging/studies/${studyUID}`;
      }

      if (target.dataset.action === "viewer" && studyUID) {
        window.location.href = `#/imaging/viewer/${studyUID}`;
      }

      if (target.dataset.page) {
        const page = parseInt(target.dataset.page);
        if (page > 0) {
          console.log("Load page:", page);
        }
      }
    });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private getModalityColor(modality: string): string {
    const colors: Record<string, string> = {
      CT: "blue",
      MRI: "purple",
      XRAY: "green",
      US: "cyan",
    };
    return colors[modality] || "gray";
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      UNREAD: "warning",
      PRELIMINARY: "info",
      FINAL: "success",
      AMENDED: "secondary",
    };
    return colors[status] || "gray";
  }
}
