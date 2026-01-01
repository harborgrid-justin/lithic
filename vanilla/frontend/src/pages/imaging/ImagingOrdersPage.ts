import { ImagingService } from "../../services/ImagingService";
import { ImagingOrderList } from "../../components/imaging/ImagingOrderList";

export class ImagingOrdersPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private orderList: ImagingOrderList;
  private currentFilters: any = {};

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.orderList = new ImagingOrderList();
  }

  async render() {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "imaging-orders-page";
    wrapper.innerHTML = `
      <div class="page-header">
        <h1>Imaging Orders</h1>
        <button class="btn btn-primary" data-action="new-order">New Order</button>
      </div>

      <div class="filters-section">
        <div class="filters-group">
          <div class="filter-item">
            <label>Status</label>
            <select id="filter-status" class="form-select">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
              <option value="MAMMO">Mammography</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Priority</label>
            <select id="filter-priority" class="form-select">
              <option value="">All Priorities</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
              <option value="ASAP">ASAP</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Start Date</label>
            <input type="date" id="filter-start-date" class="form-input">
          </div>

          <div class="filter-item">
            <label>End Date</label>
            <input type="date" id="filter-end-date" class="form-input">
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" data-action="apply-filters">Apply</button>
            <button class="btn btn-secondary" data-action="clear-filters">Clear</button>
          </div>
        </div>
      </div>

      <div class="orders-section">
        <div id="orders-container"></div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();
    await this.loadOrders();
  }

  private attachEventListeners() {
    const newOrderBtn = this.container.querySelector(
      '[data-action="new-order"]',
    );
    newOrderBtn?.addEventListener("click", () => {
      window.location.href = "#/imaging/orders/new";
    });

    const applyFiltersBtn = this.container.querySelector(
      '[data-action="apply-filters"]',
    );
    applyFiltersBtn?.addEventListener("click", () => {
      this.applyFilters();
    });

    const clearFiltersBtn = this.container.querySelector(
      '[data-action="clear-filters"]',
    );
    clearFiltersBtn?.addEventListener("click", () => {
      this.clearFilters();
    });
  }

  private async loadOrders() {
    try {
      const ordersContainer = document.getElementById("orders-container");
      if (!ordersContainer) return;

      const orders = await this.imagingService.getOrders(this.currentFilters);
      this.orderList.render(ordersContainer, orders);
    } catch (error) {
      console.error("Error loading orders:", error);
      this.showError("Failed to load orders");
    }
  }

  private applyFilters() {
    const status = (
      document.getElementById("filter-status") as HTMLSelectElement
    )?.value;
    const modality = (
      document.getElementById("filter-modality") as HTMLSelectElement
    )?.value;
    const priority = (
      document.getElementById("filter-priority") as HTMLSelectElement
    )?.value;
    const startDate = (
      document.getElementById("filter-start-date") as HTMLInputElement
    )?.value;
    const endDate = (
      document.getElementById("filter-end-date") as HTMLInputElement
    )?.value;

    this.currentFilters = {
      ...(status && { status }),
      ...(modality && { modality }),
      ...(priority && { priority }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };

    this.loadOrders();
  }

  private clearFilters() {
    (document.getElementById("filter-status") as HTMLSelectElement).value = "";
    (document.getElementById("filter-modality") as HTMLSelectElement).value =
      "";
    (document.getElementById("filter-priority") as HTMLSelectElement).value =
      "";
    (document.getElementById("filter-start-date") as HTMLInputElement).value =
      "";
    (document.getElementById("filter-end-date") as HTMLInputElement).value = "";

    this.currentFilters = {};
    this.loadOrders();
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = "";
  }
}
