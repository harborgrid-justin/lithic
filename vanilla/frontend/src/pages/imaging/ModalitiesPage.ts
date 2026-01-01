import { ImagingService } from "../../services/ImagingService";
import { ModalityStatus } from "../../components/imaging/ModalityStatus";

export class ModalitiesPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private modalityStatus: ModalityStatus;

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.modalityStatus = new ModalityStatus();
  }

  async render() {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "modalities-page";
    wrapper.innerHTML = `
      <div class="page-header">
        <h1>Imaging Modalities</h1>
        <div class="header-actions">
          <button class="btn btn-secondary" data-action="add-modality">Add Modality</button>
          <button class="btn btn-primary" data-action="refresh">Refresh</button>
        </div>
      </div>

      <div class="modalities-overview">
        <div class="overview-stats">
          <div class="stat-card">
            <div class="stat-value" id="total-modalities">-</div>
            <div class="stat-label">Total Modalities</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value" id="online-modalities">-</div>
            <div class="stat-label">Online</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value" id="busy-modalities">-</div>
            <div class="stat-label">Busy</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-value" id="offline-modalities">-</div>
            <div class="stat-label">Offline</div>
          </div>
        </div>
      </div>

      <div class="modalities-grid">
        <div id="modalities-container">
          <div class="loading">Loading modalities...</div>
        </div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();
    await this.loadModalities();
  }

  private attachEventListeners() {
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    refreshBtn?.addEventListener("click", () => this.loadModalities());

    const addModalityBtn = this.container.querySelector(
      '[data-action="add-modality"]',
    );
    addModalityBtn?.addEventListener("click", () =>
      this.showAddModalityDialog(),
    );
  }

  private async loadModalities() {
    try {
      const modalities = await this.imagingService.getModalities();
      this.renderModalities(modalities);
      this.updateStatistics(modalities);
    } catch (error) {
      console.error("Error loading modalities:", error);
      this.showError("Failed to load modalities");
    }
  }

  private renderModalities(modalities: any[]) {
    const container = document.getElementById("modalities-container");
    if (!container) return;

    if (modalities.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No modalities configured</div>';
      return;
    }

    container.innerHTML = modalities
      .map((modality) => this.createModalityCard(modality))
      .join("");
    this.attachModalityActions();
  }

  private createModalityCard(modality: any): string {
    const statusColors: Record<string, string> = {
      ONLINE: "success",
      BUSY: "warning",
      OFFLINE: "danger",
      MAINTENANCE: "secondary",
    };

    return `
      <div class="modality-card ${statusColors[modality.status]}" data-modality-id="${modality.id}">
        <div class="modality-header">
          <div class="modality-icon">${this.getModalityIcon(modality.type)}</div>
          <div class="modality-title">
            <h3>${modality.name}</h3>
            <span class="badge badge-${statusColors[modality.status]}">${modality.status}</span>
          </div>
        </div>

        <div class="modality-details">
          <div class="detail-row">
            <span class="label">Type:</span>
            <span class="value">${modality.type}</span>
          </div>
          <div class="detail-row">
            <span class="label">AE Title:</span>
            <span class="value">${modality.aeTitle || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Station:</span>
            <span class="value">${modality.stationName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Location:</span>
            <span class="value">${modality.location || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="label">IP Address:</span>
            <span class="value">${modality.ipAddress || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Port:</span>
            <span class="value">${modality.port || "N/A"}</span>
          </div>
        </div>

        <div class="modality-stats">
          <div class="stat">
            <div class="stat-value">${modality.todayExams || 0}</div>
            <div class="stat-label">Exams Today</div>
          </div>
          <div class="stat">
            <div class="stat-value">${modality.queuedExams || 0}</div>
            <div class="stat-label">Queued</div>
          </div>
          <div class="stat">
            <div class="stat-value">${modality.avgDuration || "N/A"}</div>
            <div class="stat-label">Avg Duration</div>
          </div>
        </div>

        <div class="modality-actions">
          <button class="btn btn-sm" data-action="view-worklist" data-modality-id="${modality.id}">Worklist</button>
          <button class="btn btn-sm" data-action="test-connection" data-modality-id="${modality.id}">Test</button>
          <button class="btn btn-sm" data-action="edit" data-modality-id="${modality.id}">Edit</button>
        </div>
      </div>
    `;
  }

  private getModalityIcon(type: string): string {
    const icons: Record<string, string> = {
      CT: "🏥",
      MRI: "🧲",
      XRAY: "📷",
      US: "🔊",
      NM: "☢️",
      PET: "⚛️",
      MAMMO: "🎗️",
    };
    return icons[type] || "🔬";
  }

  private updateStatistics(modalities: any[]) {
    const total = modalities.length;
    const online = modalities.filter((m) => m.status === "ONLINE").length;
    const busy = modalities.filter((m) => m.status === "BUSY").length;
    const offline = modalities.filter(
      (m) => m.status === "OFFLINE" || m.status === "MAINTENANCE",
    ).length;

    const totalEl = document.getElementById("total-modalities");
    const onlineEl = document.getElementById("online-modalities");
    const busyEl = document.getElementById("busy-modalities");
    const offlineEl = document.getElementById("offline-modalities");

    if (totalEl) totalEl.textContent = total.toString();
    if (onlineEl) onlineEl.textContent = online.toString();
    if (busyEl) busyEl.textContent = busy.toString();
    if (offlineEl) offlineEl.textContent = offline.toString();
  }

  private attachModalityActions() {
    this.container.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      const modalityId = target.dataset.modalityId;

      if (!modalityId) return;

      if (action === "view-worklist") {
        window.location.href = `#/imaging/worklist?modality=${modalityId}`;
      } else if (action === "test-connection") {
        await this.testConnection(modalityId);
      } else if (action === "edit") {
        this.editModality(modalityId);
      }
    });
  }

  private async testConnection(modalityId: string) {
    try {
      const result =
        await this.imagingService.testModalityConnection(modalityId);
      if (result.success) {
        this.showSuccess("Connection successful");
      } else {
        this.showError(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      this.showError("Failed to test connection");
    }
  }

  private editModality(modalityId: string) {
    // TODO: Show edit modality dialog
    alert(`Edit modality: ${modalityId}`);
  }

  private showAddModalityDialog() {
    // TODO: Show add modality dialog
    alert("Add new modality dialog");
  }

  private showSuccess(message: string) {
    alert(message);
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = "";
  }
}
