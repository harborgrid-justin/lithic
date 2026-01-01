/**
 * Lab Order List Component
 * Displays list of laboratory orders
 */

export class LabOrderList {
  private container: HTMLElement;
  private orders: any[] = [];
  private onOrderClick?: (orderId: string) => void;

  constructor(
    container: HTMLElement,
    options: { onOrderClick?: (orderId: string) => void } = {},
  ) {
    this.container = container;
    this.onOrderClick = options.onOrderClick;
  }

  setOrders(orders: any[]): void {
    this.orders = orders;
    this.render();
  }

  private render(): void {
    if (this.orders.length === 0) {
      this.container.innerHTML = `
        <div class="lab-order-list-empty">
          <p>No laboratory orders found</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="lab-order-list">
        <table class="lab-order-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Patient</th>
              <th>MRN</th>
              <th>Tests</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Ordered</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            ${this.orders.map((order) => this.renderOrderRow(order)).join("")}
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderOrderRow(order: any): string {
    const priorityClass = this.getPriorityClass(order.priority);
    const statusClass = this.getStatusClass(order.status);

    return `
      <tr class="lab-order-row" data-order-id="${order.id}">
        <td>
          <span class="order-number">${order.orderNumber}</span>
        </td>
        <td>${order.patientName}</td>
        <td>${order.patientMRN}</td>
        <td>
          <span class="test-count">${order.tests.length} test${order.tests.length !== 1 ? "s" : ""}</span>
        </td>
        <td>
          <span class="priority-badge ${priorityClass}">${order.priority.toUpperCase()}</span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${this.formatStatus(order.status)}</span>
        </td>
        <td>${this.formatDateTime(order.orderDateTime)}</td>
        <td>${order.orderingProviderName}</td>
      </tr>
    `;
  }

  private getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      stat: "priority-stat",
      urgent: "priority-urgent",
      asap: "priority-asap",
      routine: "priority-routine",
    };
    return classes[priority] || "";
  }

  private getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: "status-pending",
      collected: "status-collected",
      received: "status-received",
      processing: "status-processing",
      completed: "status-completed",
      cancelled: "status-cancelled",
      "on-hold": "status-on-hold",
    };
    return classes[status] || "";
  }

  private formatStatus(status: string): string {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private attachEventListeners(): void {
    const rows = this.container.querySelectorAll(".lab-order-row");
    rows.forEach((row) => {
      row.addEventListener("click", () => {
        const orderId = row.getAttribute("data-order-id");
        if (orderId && this.onOrderClick) {
          this.onOrderClick(orderId);
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
