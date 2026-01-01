import { ImagingService } from "../../services/ImagingService";
import { ModalityStatus } from "../../components/imaging/ModalityStatus";
import { RadiologyWorklist } from "../../components/imaging/RadiologyWorklist";

export class ImagingDashboardPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private modalityStatus: ModalityStatus;
  private worklist: RadiologyWorklist;

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.modalityStatus = new ModalityStatus();
    this.worklist = new RadiologyWorklist();
  }

  async render() {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "imaging-dashboard-page";
    wrapper.innerHTML = `
      <div class="dashboard-header">
        <h1>Imaging Dashboard</h1>
        <div class="header-actions">
          <button class="btn btn-primary" data-action="new-order">New Order</button>
          <button class="btn btn-secondary" data-action="refresh">Refresh</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Statistics Cards -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-value" id="pending-orders">-</div>
              <div class="stat-label">Pending Orders</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔬</div>
            <div class="stat-content">
              <div class="stat-value" id="in-progress">-</div>
              <div class="stat-label">In Progress</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value" id="unread-studies">-</div>
              <div class="stat-label">Unread Studies</div>
            </div>
          </div>
          <div class="stat-card critical">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-value" id="critical-results">-</div>
              <div class="stat-label">Critical Results</div>
            </div>
          </div>
        </div>

        <!-- Modality Status -->
        <div class="modality-section">
          <h2>Modality Status</h2>
          <div id="modality-status-container"></div>
        </div>

        <!-- Today's Worklist -->
        <div class="worklist-section">
          <h2>Today's Worklist</h2>
          <div id="worklist-container"></div>
        </div>

        <!-- Recent Studies -->
        <div class="recent-studies-section">
          <h2>Recent Studies</h2>
          <div id="recent-studies-container">
            <div class="studies-list"></div>
          </div>
        </div>

        <!-- Critical Reports -->
        <div class="critical-reports-section">
          <h2>Critical Reports Pending Notification</h2>
          <div id="critical-reports-container">
            <div class="reports-list"></div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(wrapper);
    await this.attachEventListeners();
    await this.loadDashboardData();
  }

  private async loadDashboardData() {
    try {
      // Load statistics
      const stats = await this.imagingService.getDashboardStats();
      this.updateStatistics(stats);

      // Load and render modality status
      const modalityContainer = document.getElementById(
        "modality-status-container",
      );
      if (modalityContainer) {
        this.modalityStatus.render(modalityContainer);
      }

      // Load and render today's worklist
      const worklistContainer = document.getElementById("worklist-container");
      if (worklistContainer) {
        this.worklist.render(worklistContainer, {
          date: new Date().toISOString().split("T")[0],
        });
      }

      // Load recent studies
      await this.loadRecentStudies();

      // Load critical reports
      await this.loadCriticalReports();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  private updateStatistics(stats: any) {
    const pendingOrders = document.getElementById("pending-orders");
    const inProgress = document.getElementById("in-progress");
    const unreadStudies = document.getElementById("unread-studies");
    const criticalResults = document.getElementById("critical-results");

    if (pendingOrders) pendingOrders.textContent = stats.pendingOrders || "0";
    if (inProgress) inProgress.textContent = stats.inProgress || "0";
    if (unreadStudies) unreadStudies.textContent = stats.unreadStudies || "0";
    if (criticalResults)
      criticalResults.textContent = stats.criticalResults || "0";
  }

  private async loadRecentStudies() {
    try {
      const studies = await this.imagingService.getRecentStudies(10);
      const container = this.container.querySelector(
        ".recent-studies-section .studies-list",
      );

      if (!container) return;

      container.innerHTML =
        studies.length > 0
          ? studies.map((study) => this.createStudyCard(study)).join("")
          : '<div class="empty-state">No recent studies</div>';
    } catch (error) {
      console.error("Error loading recent studies:", error);
    }
  }

  private createStudyCard(study: any): string {
    return `
      <div class="study-card" data-study-uid="${study.studyInstanceUID}">
        <div class="study-info">
          <div class="study-patient">
            <strong>${study.patientName}</strong>
            <span class="study-date">${this.formatDate(study.studyDate)}</span>
          </div>
          <div class="study-description">${study.studyDescription || "N/A"}</div>
          <div class="study-meta">
            <span class="badge badge-${this.getModalityColor(study.modality)}">${study.modality}</span>
            <span class="badge badge-${this.getStatusColor(study.readingStatus)}">${study.readingStatus}</span>
            <span class="study-series">${study.numberOfSeries} series, ${study.numberOfInstances} images</span>
          </div>
        </div>
        <div class="study-actions">
          <button class="btn btn-sm" data-action="view-study">View</button>
        </div>
      </div>
    `;
  }

  private async loadCriticalReports() {
    try {
      const reports = await this.imagingService.getCriticalReports();
      const container = this.container.querySelector(
        ".critical-reports-section .reports-list",
      );

      if (!container) return;

      container.innerHTML =
        reports.length > 0
          ? reports.map((report) => this.createReportCard(report)).join("")
          : '<div class="empty-state">No critical reports pending notification</div>';
    } catch (error) {
      console.error("Error loading critical reports:", error);
    }
  }

  private createReportCard(report: any): string {
    return `
      <div class="report-card critical" data-report-id="${report.id}">
        <div class="report-header">
          <div class="report-patient">
            <strong>${report.patientName}</strong>
            <span class="report-date">${this.formatDate(report.createdAt)}</span>
          </div>
          <span class="badge badge-danger">Critical</span>
        </div>
        <div class="report-content">
          <div class="report-modality">${report.modality} - ${report.studyDescription}</div>
          <div class="report-impression">${report.impression}</div>
        </div>
        <div class="report-actions">
          <button class="btn btn-primary btn-sm" data-action="notify">Send Notification</button>
          <button class="btn btn-secondary btn-sm" data-action="view">View Full Report</button>
        </div>
      </div>
    `;
  }

  private async attachEventListeners() {
    // New order button
    const newOrderBtn = this.container.querySelector(
      '[data-action="new-order"]',
    );
    newOrderBtn?.addEventListener("click", () => {
      window.location.href = "#/imaging/orders/new";
    });

    // Refresh button
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    refreshBtn?.addEventListener("click", () => {
      this.loadDashboardData();
    });

    // Study view buttons
    this.container.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const studyCard = target.closest(".study-card");
      const reportCard = target.closest(".report-card");

      if (target.dataset.action === "view-study" && studyCard) {
        const studyUID = studyCard.getAttribute("data-study-uid");
        window.location.href = `#/imaging/studies/${studyUID}`;
      }

      if (target.dataset.action === "notify" && reportCard) {
        const reportId = reportCard.getAttribute("data-report-id");
        await this.notifyCriticalReport(reportId!);
      }

      if (target.dataset.action === "view" && reportCard) {
        const reportId = reportCard.getAttribute("data-report-id");
        window.location.href = `#/imaging/reports/${reportId}`;
      }
    });
  }

  private async notifyCriticalReport(reportId: string) {
    try {
      await this.imagingService.notifyCriticalResult(reportId);
      this.showSuccess("Critical result notification sent");
      await this.loadCriticalReports();
    } catch (error) {
      console.error("Error sending notification:", error);
      this.showError("Failed to send notification");
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private getModalityColor(modality: string): string {
    const colors: Record<string, string> = {
      CT: "blue",
      MRI: "purple",
      XRAY: "green",
      US: "cyan",
      NM: "orange",
      PET: "red",
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

  private showSuccess(message: string) {
    // TODO: Implement toast notification
    alert(message);
  }

  private showError(message: string) {
    // TODO: Implement toast notification
    alert(message);
  }

  destroy() {
    this.container.innerHTML = "";
  }
}
