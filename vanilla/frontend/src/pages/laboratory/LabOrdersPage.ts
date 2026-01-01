/**
 * Lab Orders Page
 * List and manage laboratory orders
 */

import { labService } from '../../services/LaboratoryService';
import { LabOrderList } from '../../components/laboratory/LabOrderList';

export class LabOrdersPage {
  private container: HTMLElement;
  private orderList: LabOrderList | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="lab-orders-page">
        <div class="page-header">
          <h1>Laboratory Orders</h1>
          <button type="button" class="btn btn-primary" id="newOrderBtn">New Order</button>
        </div>

        <div class="orders-filters">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="collected">Collected</option>
              <option value="received">Received</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="priorityFilter">Priority</label>
            <select id="priorityFilter">
              <option value="">All Priorities</option>
              <option value="stat">STAT</option>
              <option value="urgent">Urgent</option>
              <option value="asap">ASAP</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input type="text" id="searchInput" placeholder="Order #, Patient name, MRN...">
          </div>

          <button type="button" class="btn btn-secondary" id="clearFiltersBtn">Clear Filters</button>
        </div>

        <div id="ordersContainer"></div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadOrders();
    this.attachEventListeners();
  }

  private async loadOrders(filters?: any): Promise<void> {
    try {
      const orders = await labService.getPendingOrders();

      const ordersContainer = this.container.querySelector('#ordersContainer');
      if (ordersContainer) {
        this.orderList = new LabOrderList(ordersContainer as HTMLElement, {
          onOrderClick: (orderId) => this.handleOrderClick(orderId)
        });
        this.orderList.setOrders(orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  private handleOrderClick(orderId: string): void {
    window.location.href = `/laboratory/orders/${orderId}`;
  }

  private attachEventListeners(): void {
    const newOrderBtn = this.container.querySelector('#newOrderBtn');
    const statusFilter = this.container.querySelector('#statusFilter');
    const priorityFilter = this.container.querySelector('#priorityFilter');
    const searchInput = this.container.querySelector('#searchInput');
    const clearFiltersBtn = this.container.querySelector('#clearFiltersBtn');

    if (newOrderBtn) {
      newOrderBtn.addEventListener('click', () => {
        window.location.href = '/laboratory/orders/new';
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => this.applyFilters());
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFilters());
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        (this.container.querySelector('#statusFilter') as HTMLSelectElement).value = '';
        (this.container.querySelector('#priorityFilter') as HTMLSelectElement).value = '';
        (this.container.querySelector('#searchInput') as HTMLInputElement).value = '';
        this.loadOrders();
      });
    }
  }

  private applyFilters(): void {
    const status = (this.container.querySelector('#statusFilter') as HTMLSelectElement)?.value;
    const priority = (this.container.querySelector('#priorityFilter') as HTMLSelectElement)?.value;
    const search = (this.container.querySelector('#searchInput') as HTMLInputElement)?.value;

    this.loadOrders({ status, priority, search });
  }

  destroy(): void {
    if (this.orderList) {
      this.orderList.destroy();
    }
    this.container.innerHTML = '';
  }
}
