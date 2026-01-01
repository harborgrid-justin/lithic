import { ImagingService } from "../../services/ImagingService";
import { ImageThumbnails } from "../../components/imaging/ImageThumbnails";

export class StudyDetailPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private studyInstanceUID: string;
  private thumbnails: ImageThumbnails;

  constructor(container: HTMLElement, studyInstanceUID: string) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.studyInstanceUID = studyInstanceUID;
    this.thumbnails = new ImageThumbnails();
  }

  async render() {
    this.container.innerHTML = "";

    try {
      const study = await this.imagingService.getStudy(this.studyInstanceUID);
      const series = await this.imagingService.getStudySeries(
        this.studyInstanceUID,
      );

      const wrapper = document.createElement("div");
      wrapper.className = "study-detail-page";
      wrapper.innerHTML = `
        <div class="page-header">
          <div class="header-content">
            <button class="btn btn-link" data-action="back">← Back to Studies</button>
            <h1>Study Details</h1>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" data-action="compare">Compare Studies</button>
            <button class="btn btn-secondary" data-action="share">Share</button>
            <button class="btn btn-primary" data-action="open-viewer">Open in Viewer</button>
          </div>
        </div>

        <div class="study-detail-content">
          <div class="detail-section">
            <h2>Study Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Study Instance UID</label>
                <div class="uid-text">${study.studyInstanceUID}</div>
              </div>
              <div class="detail-item">
                <label>Accession Number</label>
                <div>${study.accessionNumber}</div>
              </div>
              <div class="detail-item">
                <label>Study Date/Time</label>
                <div>${this.formatDate(study.studyDate)} ${study.studyTime || ""}</div>
              </div>
              <div class="detail-item">
                <label>Modality</label>
                <div><span class="badge badge-${this.getModalityColor(study.modality)}">${study.modality}</span></div>
              </div>
              <div class="detail-item">
                <label>Study Description</label>
                <div>${study.studyDescription || "N/A"}</div>
              </div>
              <div class="detail-item">
                <label>Reading Status</label>
                <div><span class="badge badge-${this.getStatusColor(study.readingStatus)}">${study.readingStatus}</span></div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Patient Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Patient Name</label>
                <div>${study.patientName}</div>
              </div>
              <div class="detail-item">
                <label>Patient ID</label>
                <div>${study.patientId}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Study Statistics</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Number of Series</label>
                <div>${study.numberOfSeries || series.length}</div>
              </div>
              <div class="detail-item">
                <label>Number of Instances</label>
                <div>${study.numberOfInstances || 0}</div>
              </div>
              <div class="detail-item">
                <label>Institution</label>
                <div>${study.institutionName || "N/A"}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Series (${series.length})</h2>
            <div class="series-list">
              ${series.map((s) => this.createSeriesCard(s)).join("")}
            </div>
          </div>

          <div class="detail-section">
            <h2>Report</h2>
            <div id="report-container">
              <div class="loading">Loading report...</div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Prior Studies</h2>
            <div id="priors-container">
              <div class="loading">Loading prior studies...</div>
            </div>
          </div>
        </div>
      `;

      this.container.appendChild(wrapper);
      this.attachEventListeners();
      await this.loadReport();
      await this.loadPriorStudies();
    } catch (error) {
      console.error("Error loading study:", error);
      this.showError("Failed to load study details");
    }
  }

  private createSeriesCard(series: any): string {
    return `
      <div class="series-card" data-series-uid="${series.seriesInstanceUID}">
        <div class="series-thumbnail" id="series-thumb-${series.seriesInstanceUID}">
          <div class="loading-thumb">Loading...</div>
        </div>
        <div class="series-info">
          <div class="series-description">${series.seriesDescription || "Unnamed Series"}</div>
          <div class="series-meta">
            <span class="badge">${series.modality}</span>
            <span>Series ${series.seriesNumber}</span>
            <span>${series.numberOfInstances} images</span>
          </div>
        </div>
        <div class="series-actions">
          <button class="btn btn-sm" data-action="view-series">View</button>
        </div>
      </div>
    `;
  }

  private async loadReport() {
    try {
      const report = await this.imagingService.getStudyReport(
        this.studyInstanceUID,
      );
      const container = document.getElementById("report-container");

      if (!container) return;

      if (report) {
        container.innerHTML = `
          <div class="report-content">
            <div class="report-header">
              <div>
                <strong>${report.radiologistName}</strong>
                <span class="report-date">${this.formatDate(report.createdAt)}</span>
              </div>
              <span class="badge badge-${this.getStatusColor(report.status)}">${report.status}</span>
            </div>
            ${
              report.findings
                ? `
              <div class="report-section">
                <h4>Findings</h4>
                <p>${report.findings}</p>
              </div>
            `
                : ""
            }
            ${
              report.impression
                ? `
              <div class="report-section">
                <h4>Impression</h4>
                <p>${report.impression}</p>
              </div>
            `
                : ""
            }
            <div class="report-actions">
              <button class="btn btn-secondary btn-sm" data-action="view-full-report">View Full Report</button>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <p>No report available for this study</p>
            <button class="btn btn-primary" data-action="create-report">Create Report</button>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error loading report:", error);
    }
  }

  private async loadPriorStudies() {
    try {
      const priors = await this.imagingService.getPriorStudies(
        this.studyInstanceUID,
        5,
      );
      const container = document.getElementById("priors-container");

      if (!container) return;

      container.innerHTML =
        priors.length > 0
          ? `<div class="priors-list">${priors.map((p) => this.createPriorStudyCard(p)).join("")}</div>`
          : '<div class="empty-state">No prior studies found</div>';
    } catch (error) {
      console.error("Error loading prior studies:", error);
    }
  }

  private createPriorStudyCard(study: any): string {
    return `
      <div class="prior-study-card" data-study-uid="${study.studyInstanceUID}">
        <div class="prior-study-info">
          <div class="prior-study-date">${this.formatDate(study.studyDate)}</div>
          <div class="prior-study-description">${study.studyDescription || "N/A"}</div>
          <span class="badge badge-sm">${study.modality}</span>
        </div>
        <div class="prior-study-actions">
          <button class="btn btn-sm" data-action="view-prior">View</button>
          <button class="btn btn-sm" data-action="compare-prior">Compare</button>
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    const backBtn = this.container.querySelector('[data-action="back"]');
    backBtn?.addEventListener("click", () => {
      window.location.href = "#/imaging/studies";
    });

    const viewerBtn = this.container.querySelector(
      '[data-action="open-viewer"]',
    );
    viewerBtn?.addEventListener("click", () => {
      window.location.href = `#/imaging/viewer/${this.studyInstanceUID}`;
    });

    const compareBtn = this.container.querySelector('[data-action="compare"]');
    compareBtn?.addEventListener("click", () => this.showCompareDialog());

    const shareBtn = this.container.querySelector('[data-action="share"]');
    shareBtn?.addEventListener("click", () => this.shareStudy());

    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      if (action === "view-series") {
        const seriesCard = target.closest(".series-card");
        const seriesUID = seriesCard?.getAttribute("data-series-uid");
        if (seriesUID) this.viewSeries(seriesUID);
      }

      if (action === "view-full-report") {
        this.viewFullReport();
      }

      if (action === "create-report") {
        this.createReport();
      }

      if (action === "view-prior" || action === "compare-prior") {
        const priorCard = target.closest(".prior-study-card");
        const studyUID = priorCard?.getAttribute("data-study-uid");
        if (studyUID) {
          if (action === "view-prior") {
            window.location.href = `#/imaging/studies/${studyUID}`;
          } else {
            this.compareToPrior(studyUID);
          }
        }
      }
    });
  }

  private viewSeries(seriesUID: string) {
    window.location.href = `#/imaging/viewer/${this.studyInstanceUID}?series=${seriesUID}`;
  }

  private viewFullReport() {
    // TODO: Navigate to full report page
    alert("View full report");
  }

  private createReport() {
    window.location.href = `#/imaging/reports/new?study=${this.studyInstanceUID}`;
  }

  private showCompareDialog() {
    // TODO: Implement compare studies dialog
    alert("Compare studies dialog");
  }

  private async shareStudy() {
    try {
      const shareLink = await this.imagingService.createStudyShareLink(
        this.studyInstanceUID,
      );
      prompt("Share this link:", shareLink.shareUrl);
    } catch (error) {
      console.error("Error creating share link:", error);
      this.showError("Failed to create share link");
    }
  }

  private compareToPrior(priorStudyUID: string) {
    window.location.href = `#/imaging/viewer/${this.studyInstanceUID}?compare=${priorStudyUID}`;
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

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = "";
  }
}
