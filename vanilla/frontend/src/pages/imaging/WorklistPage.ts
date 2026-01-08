import { ImagingService } from "../../services/ImagingService";
import { RadiologyWorklist } from "../../components/imaging/RadiologyWorklist";

export class WorklistPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private worklist: RadiologyWorklist;
  private currentFilters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.worklist = new RadiologyWorklist();
  }

  async render() {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "worklist-page";
    wrapper.innerHTML = `
      <div class="page-header">
        <h1>Radiology Worklist</h1>
        <div class="header-actions">
          <button class="btn btn-secondary" data-action="bulk-schedule">Bulk Schedule</button>
          <button class="btn btn-primary" data-action="refresh">Refresh</button>
        </div>
      </div>

      <div class="filters-section">
        <div class="filters-group">
          <div class="filter-item">
            <label>Date</label>
            <input type="date" id="filter-date" class="form-input" value="${new Date().toISOString().split("T")[0] || ""}">
          </div>

          <div class="filter-item">
            <label>Modality</label>
            <select id="filter-modality" class="form-select">
              <option value="">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MRI">MRI</option>
              <option value="XRAY">X-Ray</option>
              <option value="US">Ultrasound</option>
              <option value="NM">Nuclear Medicine</option>
              <option value="PET">PET</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Status</label>
            <select id="filter-status" class="form-select">
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Priority</label>
            <select id="filter-priority" class="form-select">
              <option value="">All Priorities</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Station</label>
            <select id="filter-station" class="form-select">
              <option value="">All Stations</option>
              <option value="CT-01">CT-01</option>
              <option value="CT-02">CT-02</option>
              <option value="MRI-01">MRI-01</option>
              <option value="MRI-02">MRI-02</option>
              <option value="XRAY-01">X-Ray-01</option>
              <option value="US-01">US-01</option>
            </select>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" data-action="apply-filters">Apply</button>
            <button class="btn btn-secondary" data-action="clear-filters">Clear</button>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-value" id="stat-scheduled">-</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-in-progress">-</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-completed">-</div>
          <div class="stat-label">Completed Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-waiting">-</div>
          <div class="stat-label">Avg Wait Time</div>
        </div>
      </div>

      <div class="worklist-section">
        <div id="worklist-container"></div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();
    await this.loadWorklist();
    await this.loadStatistics();
  }

  private attachEventListeners() {
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    refreshBtn?.addEventListener("click", () => {
      this.loadWorklist();
      this.loadStatistics();
    });

    const bulkScheduleBtn = this.container.querySelector(
      '[data-action="bulk-schedule"]',
    );
    bulkScheduleBtn?.addEventListener("click", () =>
      this.showBulkScheduleDialog(),
    );

    const applyFiltersBtn = this.container.querySelector(
      '[data-action="apply-filters"]',
    );
    applyFiltersBtn?.addEventListener("click", () => this.applyFilters());

    const clearFiltersBtn = this.container.querySelector(
      '[data-action="clear-filters"]',
    );
    clearFiltersBtn?.addEventListener("click", () => this.clearFilters());
  }

  private async loadWorklist() {
    try {
      const worklistContainer = document.getElementById("worklist-container");
      if (!worklistContainer) return;

      const worklist = await this.imagingService.getWorklist(
        this.currentFilters,
      );
      this.worklist.render(worklistContainer, this.currentFilters);
    } catch (error) {
      console.error("Error loading worklist:", error);
      this.showError("Failed to load worklist");
    }
  }

  private async loadStatistics() {
    try {
      const stats = await this.imagingService.getWorklistStats(
        this.currentFilters,
      );

      const scheduled = document.getElementById("stat-scheduled");
      const inProgress = document.getElementById("stat-in-progress");
      const completed = document.getElementById("stat-completed");
      const waiting = document.getElementById("stat-waiting");

      if (scheduled) scheduled.textContent = stats.scheduled?.toString() || "0";
      if (inProgress)
        inProgress.textContent = stats.inProgress?.toString() || "0";
      if (completed) completed.textContent = stats.completed?.toString() || "0";
      if (waiting) waiting.textContent = stats.avgWaitTime || "0 min";
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }

  private applyFilters() {
    const date = (document.getElementById("filter-date") as HTMLInputElement)
      ?.value;
    const modality = (
      document.getElementById("filter-modality") as HTMLSelectElement
    )?.value;
    const status = (
      document.getElementById("filter-status") as HTMLSelectElement
    )?.value;
    const priority = (
      document.getElementById("filter-priority") as HTMLSelectElement
    )?.value;
    const station = (
      document.getElementById("filter-station") as HTMLSelectElement
    )?.value;

    this.currentFilters = {
      ...(date && { scheduledDate: date }),
      ...(modality && { modality }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(station && { stationName: station }),
    };

    this.loadWorklist();
    this.loadStatistics();
  }

  private clearFilters() {
    (document.getElementById("filter-date") as HTMLInputElement).value =
      new Date().toISOString().split("T")[0] || "";
    (document.getElementById("filter-modality") as HTMLSelectElement).value =
      "";
    (document.getElementById("filter-status") as HTMLSelectElement).value = "";
    (document.getElementById("filter-priority") as HTMLSelectElement).value =
      "";
    (document.getElementById("filter-station") as HTMLSelectElement).value = "";

    this.currentFilters = {};
    this.loadWorklist();
    this.loadStatistics();
  }

  private showBulkScheduleDialog() {
    // TODO: Implement bulk scheduling dialog
    alert("Bulk scheduling dialog");
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = "";
  }
}
