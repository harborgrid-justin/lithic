// Orders Panel Component - Vanilla TypeScript
export class OrdersPanel {
  private container: HTMLElement;
  private orders: any[] = [];
  private onSign?: (orderId: string) => void;

  constructor(containerId: string, onSign?: (orderId: string) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onSign = onSign;
  }

  setOrders(orders: any[]): void {
    this.orders = orders;
    this.render();
  }

  private render(): void {
    if (this.orders.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No orders</div>';
      return;
    }

    const ordersByType = this.groupOrdersByType();
    const ordersHTML = Object.entries(ordersByType)
      .map(([type, orders]) => this.renderOrderGroup(type, orders as any[]))
      .join('');

    this.container.innerHTML = `
      <div class="orders-panel">
        ${ordersHTML}
      </div>
    `;

    this.attachEventListeners();
  }

  private groupOrdersByType(): Record<string, any[]> {
    return this.orders.reduce((acc, order) => {
      if (!acc[order.orderType]) {
        acc[order.orderType] = [];
      }
      acc[order.orderType].push(order);
      return acc;
    }, {} as Record<string, any[]>);
  }

  private renderOrderGroup(type: string, orders: any[]): string {
    const typeLabels: Record<string, string> = {
      lab: 'Laboratory',
      imaging: 'Imaging',
      procedure: 'Procedures',
      medication: 'Medications',
      referral: 'Referrals',
      dme: 'DME/Equipment',
    };

    const ordersHTML = orders.map(order => this.renderOrder(order)).join('');

    return `
      <div class="order-group">
        <h4 class="order-group-title">${typeLabels[type] || type}</h4>
        <div class="order-group-items">
          ${ordersHTML}
        </div>
      </div>
    `;
  }

  private renderOrder(order: any): string {
    const orderedDate = new Date(order.orderedAt).toLocaleString();
    const statusClass = `status-${order.status}`;
    const priorityClass = `priority-${order.priority}`;

    return `
      <div class="order-item ${statusClass}" data-order-id="${order.id}">
        <div class="order-header">
          <div class="order-name">
            <strong>${order.orderName}</strong>
            ${order.cptCode ? `<span class="cpt-code">${order.cptCode}</span>` : ''}
          </div>
          <div class="order-badges">
            <span class="badge ${priorityClass}">${order.priority}</span>
            <span class="badge ${statusClass}">${order.status}</span>
          </div>
        </div>

        <div class="order-details">
          <div class="order-date">
            <strong>Ordered:</strong> ${orderedDate}
          </div>
          ${order.scheduledDate ? `
            <div class="order-scheduled">
              <strong>Scheduled:</strong> ${new Date(order.scheduledDate).toLocaleString()}
            </div>
          ` : ''}
          ${order.icd10Codes && order.icd10Codes.length > 0 ? `
            <div class="order-diagnoses">
              <strong>Diagnoses:</strong> ${order.icd10Codes.join(', ')}
            </div>
          ` : ''}
          ${order.instructions ? `
            <div class="order-instructions">
              <strong>Instructions:</strong> ${order.instructions}
            </div>
          ` : ''}
          ${order.results ? `
            <div class="order-results">
              <strong>Results:</strong> ${order.results}
            </div>
          ` : ''}
          <div class="order-provider">
            <strong>Ordered by:</strong> ${order.orderedBy}
          </div>
          ${order.signedBy ? `
            <div class="order-signed">
              ✓ Signed by ${order.signedBy}
            </div>
          ` : ''}
        </div>

        ${order.status === 'pending' && !order.signedBy ? `
          <div class="order-actions">
            <button class="btn btn-sm sign-order-btn" data-order-id="${order.id}">
              Sign Order
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const signButtons = this.container.querySelectorAll('.sign-order-btn');
    signButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const orderId = (e.target as HTMLElement).getAttribute('data-order-id');
        if (orderId && this.onSign) {
          this.onSign(orderId);
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default OrdersPanel;
