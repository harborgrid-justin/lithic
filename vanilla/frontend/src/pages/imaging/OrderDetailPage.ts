import { ImagingService } from "../../services/ImagingService";

export class OrderDetailPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private orderId: string;

  constructor(container: HTMLElement, orderId: string) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.orderId = orderId;
  }

  async render() {
    this.container.innerHTML = "";

    try {
      const order = await this.imagingService.getOrder(this.orderId);

      const wrapper = document.createElement("div");
      wrapper.className = "order-detail-page";
      wrapper.innerHTML = `
        <div class="page-header">
          <div class="header-content">
            <button class="btn btn-link" data-action="back">← Back to Orders</button>
            <h1>Order Details</h1>
          </div>
          <div class="header-actions">
            ${this.renderOrderActions(order)}
          </div>
        </div>

        <div class="order-detail-content">
          <div class="detail-section">
            <h2>Order Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Order ID</label>
                <div>${order.id}</div>
              </div>
              <div class="detail-item">
                <label>Accession Number</label>
                <div>${order.accessionNumber || "N/A"}</div>
              </div>
              <div class="detail-item">
                <label>Status</label>
                <div><span class="badge badge-${this.getStatusColor(order.status)}">${order.status}</span></div>
              </div>
              <div class="detail-item">
                <label>Priority</label>
                <div><span class="badge badge-${this.getPriorityColor(order.priority)}">${order.priority}</span></div>
              </div>
              <div class="detail-item">
                <label>Created</label>
                <div>${this.formatDate(order.createdAt)}</div>
              </div>
              <div class="detail-item">
                <label>Scheduled</label>
                <div>${order.scheduledDateTime ? this.formatDate(order.scheduledDateTime) : "Not scheduled"}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Patient Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Patient Name</label>
                <div>${order.patientName}</div>
              </div>
              <div class="detail-item">
                <label>Patient ID</label>
                <div>${order.patientId}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Procedure Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Modality</label>
                <div><span class="badge badge-${this.getModalityColor(order.modality)}">${order.modality}</span></div>
              </div>
              <div class="detail-item">
                <label>Procedure Code</label>
                <div>${order.procedureCode}</div>
              </div>
              <div class="detail-item">
                <label>Body Part</label>
                <div>${order.bodyPart}</div>
              </div>
              <div class="detail-item">
                <label>Laterality</label>
                <div>${order.laterality || "N/A"}</div>
              </div>
              <div class="detail-item">
                <label>Contrast</label>
                <div>${order.contrast ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Clinical Information</h2>
            <div class="detail-item full-width">
              <label>Clinical Indication</label>
              <div class="clinical-text">${order.clinicalIndication}</div>
            </div>
            ${
              order.specialInstructions
                ? `
              <div class="detail-item full-width">
                <label>Special Instructions</label>
                <div class="clinical-text">${order.specialInstructions}</div>
              </div>
            `
                : ""
            }
          </div>

          <div class="detail-section">
            <h2>Ordering Provider</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Provider Name</label>
                <div>${order.orderingProviderName}</div>
              </div>
              <div class="detail-item">
                <label>Provider ID</label>
                <div>${order.orderingProviderId}</div>
              </div>
            </div>
          </div>

          ${
            order.assignedTechnicianId || order.assignedRadiologistId
              ? `
            <div class="detail-section">
              <h2>Assigned Staff</h2>
              <div class="detail-grid">
                ${
                  order.assignedTechnicianId
                    ? `
                  <div class="detail-item">
                    <label>Technician</label>
                    <div>${order.assignedTechnicianName || order.assignedTechnicianId}</div>
                  </div>
                `
                    : ""
                }
                ${
                  order.assignedRadiologistId
                    ? `
                  <div class="detail-item">
                    <label>Radiologist</label>
                    <div>${order.assignedRadiologistName || order.assignedRadiologistId}</div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }

          <div class="detail-section">
            <h2>Order History</h2>
            <div id="order-history-container">
              <div class="loading">Loading history...</div>
            </div>
          </div>
        </div>
      `;

      this.container.appendChild(wrapper);
      this.attachEventListeners();
      await this.loadOrderHistory();
    } catch (error) {
      console.error("Error loading order:", error);
      this.showError("Failed to load order details");
    }
  }

  private renderOrderActions(order: any): string {
    const actions = [];

    if (order.status === "PENDING") {
      actions.push(
        '<button class="btn btn-primary" data-action="schedule">Schedule</button>',
      );
      actions.push(
        '<button class="btn btn-danger" data-action="cancel">Cancel</button>',
      );
    }

    if (order.status === "SCHEDULED") {
      actions.push(
        '<button class="btn btn-success" data-action="start">Start Exam</button>',
      );
      actions.push(
        '<button class="btn btn-secondary" data-action="reschedule">Reschedule</button>',
      );
      actions.push(
        '<button class="btn btn-danger" data-action="cancel">Cancel</button>',
      );
    }

    if (order.status === "IN_PROGRESS") {
      actions.push(
        '<button class="btn btn-success" data-action="complete">Complete</button>',
      );
    }

    return actions.join("");
  }

  private async loadOrderHistory() {
    try {
      const history = await this.imagingService.getOrderHistory(this.orderId);
      const container = document.getElementById("order-history-container");

      if (!container) return;

      container.innerHTML =
        history.length > 0
          ? `<div class="timeline">${history.map((h) => this.createHistoryItem(h)).join("")}</div>`
          : '<div class="empty-state">No history available</div>';
    } catch (error) {
      console.error("Error loading order history:", error);
    }
  }

  private createHistoryItem(historyItem: any): string {
    return `
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-header">
            <strong>${historyItem.action}</strong>
            <span class="timeline-date">${this.formatDate(historyItem.performedAt)}</span>
          </div>
          <div class="timeline-user">by ${historyItem.performedBy}</div>
          ${historyItem.notes ? `<div class="timeline-notes">${historyItem.notes}</div>` : ""}
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    const backBtn = this.container.querySelector('[data-action="back"]');
    backBtn?.addEventListener("click", () => {
      window.location.href = "#/imaging/orders";
    });

    this.container.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      if (action === "schedule") await this.scheduleOrder();
      if (action === "start") await this.startOrder();
      if (action === "complete") await this.completeOrder();
      if (action === "cancel") await this.cancelOrder();
    });
  }

  private async scheduleOrder() {
    // TODO: Show scheduling modal
    window.location.href = `#/imaging/orders/${this.orderId}/schedule`;
  }

  private async startOrder() {
    if (!confirm("Start this imaging exam?")) return;

    try {
      await this.imagingService.startOrder(this.orderId);
      this.showSuccess("Order started");
      await this.render();
    } catch (error) {
      console.error("Error starting order:", error);
      this.showError("Failed to start order");
    }
  }

  private async completeOrder() {
    if (!confirm("Mark this order as completed?")) return;

    try {
      await this.imagingService.completeOrder(this.orderId);
      this.showSuccess("Order completed");
      await this.render();
    } catch (error) {
      console.error("Error completing order:", error);
      this.showError("Failed to complete order");
    }
  }

  private async cancelOrder() {
    const reason = prompt("Reason for cancellation:");
    if (!reason) return;

    try {
      await this.imagingService.cancelOrder(this.orderId);
      this.showSuccess("Order cancelled");
      await this.render();
    } catch (error) {
      console.error("Error cancelling order:", error);
      this.showError("Failed to cancel order");
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

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: "warning",
      SCHEDULED: "info",
      IN_PROGRESS: "primary",
      COMPLETED: "success",
      CANCELLED: "danger",
    };
    return colors[status] || "secondary";
  }

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      ROUTINE: "secondary",
      URGENT: "warning",
      STAT: "danger",
      ASAP: "danger",
    };
    return colors[priority] || "secondary";
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
