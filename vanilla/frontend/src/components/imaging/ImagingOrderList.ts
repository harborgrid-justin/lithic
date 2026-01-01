export class ImagingOrderList {
  private orders: any[] = [];
  private onOrderClick?: (orderId: string) => void;

  constructor() {}

  render(container: HTMLElement, orders: any) {
    this.orders = orders.data || [];

    if (this.orders.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No imaging orders found</div>';
      return;
    }

    container.innerHTML = `
      <div class="order-list">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Patient</th>
              <th>Modality</th>
              <th>Procedure</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.orders.map((order) => this.createOrderRow(order)).join("")}
          </tbody>
        </table>
      </div>

      ${
        orders.pagination
          ? `
        <div class="pagination">
          <button class="btn btn-sm" data-page="${orders.pagination.page - 1}" ${orders.pagination.page === 1 ? "disabled" : ""}>
            Previous
          </button>
          <span class="pagination-info">
            Page ${orders.pagination.page} of ${orders.pagination.totalPages}
          </span>
          <button class="btn btn-sm" data-page="${orders.pagination.page + 1}" ${orders.pagination.page === orders.pagination.totalPages ? "disabled" : ""}>
            Next
          </button>
        </div>
      `
          : ""
      }
    `;

    this.attachEventListeners(container);
  }

  private createOrderRow(order: any): string {
    return `
      <tr data-order-id="${order.id}" class="order-row">
        <td>${order.accessionNumber || order.id.slice(0, 8)}</td>
        <td>${order.patientName}</td>
        <td><span class="badge badge-${this.getModalityColor(order.modality)}">${order.modality}</span></td>
        <td>${order.procedureCode} - ${order.bodyPart}</td>
        <td><span class="badge badge-${this.getPriorityColor(order.priority)}">${order.priority}</span></td>
        <td><span class="badge badge-${this.getStatusColor(order.status)}">${order.status}</span></td>
        <td>${order.scheduledDateTime ? this.formatDate(order.scheduledDateTime) : "Not scheduled"}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="view" data-order-id="${order.id}">View</button>
        </td>
      </tr>
    `;
  }

  private attachEventListeners(container: HTMLElement) {
    container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.dataset.action === "view") {
        const orderId = target.dataset.orderId;
        if (orderId) {
          window.location.href = `#/imaging/orders/${orderId}`;
        }
      }

      if (target.dataset.page) {
        const page = parseInt(target.dataset.page);
        if (page > 0) {
          // TODO: Emit event to reload with new page
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

  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      ROUTINE: "secondary",
      URGENT: "warning",
      STAT: "danger",
      ASAP: "danger",
    };
    return colors[priority] || "secondary";
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
}
