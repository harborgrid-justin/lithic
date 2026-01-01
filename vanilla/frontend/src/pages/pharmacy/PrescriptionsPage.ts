/**
 * PrescriptionsPage.ts
 * List and manage all prescriptions
 */

import pharmacyService, {
  type Prescription,
} from "../../services/PharmacyService";

export class PrescriptionsPage {
  private container: HTMLElement;
  private prescriptions: Prescription[] = [];
  private filters = {
    status: "",
    priority: "",
    isControlled: "",
  };

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Container ${containerId} not found`);
    this.container = element;
  }

  async init(): Promise<void> {
    await this.loadPrescriptions();
    this.render();
    this.attachEventListeners();
  }

  private async loadPrescriptions(): Promise<void> {
    try {
      const filterParams: any = {};
      if (this.filters.status) filterParams.status = this.filters.status;
      if (this.filters.priority) filterParams.priority = this.filters.priority;
      if (this.filters.isControlled)
        filterParams.isControlled = this.filters.isControlled === "true";

      this.prescriptions = await pharmacyService.getPrescriptions(filterParams);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
      this.prescriptions = [];
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="prescriptions-page">
        <header class="page-header">
          <h1>Prescriptions</h1>
          <button class="btn btn-primary" data-action="new-prescription">
            + New Prescription
          </button>
        </header>

        <div class="filters-bar">
          <select class="filter-select" data-filter="status">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="filled">Filled</option>
            <option value="partially_filled">Partially Filled</option>
            <option value="cancelled">Cancelled</option>
            <option value="on_hold">On Hold</option>
          </select>

          <select class="filter-select" data-filter="priority">
            <option value="">All Priorities</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>

          <select class="filter-select" data-filter="isControlled">
            <option value="">All Types</option>
            <option value="true">Controlled Only</option>
            <option value="false">Non-Controlled Only</option>
          </select>

          <input type="search" class="search-input" placeholder="Search by Rx#, patient name..." />
        </div>

        <div class="prescriptions-table">
          ${this.renderTable()}
        </div>
      </div>

      <style>
        .prescriptions-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #0066cc;
          color: white;
        }

        .btn-primary:hover {
          background: #0052a3;
        }

        .filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .filter-select, .search-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .search-input {
          flex: 1;
          max-width: 300px;
        }

        .prescriptions-table {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          border-bottom: 1px solid #e0e0e0;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .rx-number {
          font-weight: 600;
          color: #0066cc;
          cursor: pointer;
        }

        .rx-number:hover {
          text-decoration: underline;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-pending { background: #fff3cd; color: #856404; }
        .status-verified { background: #d1ecf1; color: #0c5460; }
        .status-filled { background: #d4edda; color: #155724; }
        .status-partially_filled { background: #d1ecf1; color: #0c5460; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .status-on_hold { background: #e2e3e5; color: #383d41; }

        .priority-stat { color: #dc3545; font-weight: 600; }
        .priority-urgent { color: #ff9800; font-weight: 600; }
        .priority-routine { color: #666; }

        .controlled-indicator {
          color: #9c27b0;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
      </style>
    `;
  }

  private renderTable(): string {
    if (this.prescriptions.length === 0) {
      return `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
          <h3>No prescriptions found</h3>
          <p>Try adjusting your filters or create a new prescription.</p>
        </div>
      `;
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Rx Number</th>
            <th>Patient</th>
            <th>Medication</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Written Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.prescriptions
            .map(
              (rx) => `
            <tr data-rx-id="${rx.id}">
              <td>
                <span class="rx-number">${rx.rxNumber}</span>
                ${rx.isControlled ? '<span class="controlled-indicator"> 🔒</span>' : ""}
              </td>
              <td>${rx.patientName || rx.patientId}</td>
              <td>${rx.medication?.name || rx.medicationId}</td>
              <td>${rx.quantity}</td>
              <td>
                <span class="status-badge status-${rx.status}">
                  ${rx.status.replace("_", " ").toUpperCase()}
                </span>
              </td>
              <td class="priority-${rx.priority}">${rx.priority.toUpperCase()}</td>
              <td>${new Date(rx.writtenDate).toLocaleDateString()}</td>
              <td>
                <button class="btn-link" data-action="view" data-id="${rx.id}">View</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  private attachEventListeners(): void {
    // New prescription button
    const newBtn = this.container.querySelector(
      '[data-action="new-prescription"]',
    );
    if (newBtn) {
      newBtn.addEventListener("click", () => {
        window.location.hash = "#/pharmacy/prescriptions/new";
      });
    }

    // Filter changes
    const filterSelects = this.container.querySelectorAll("[data-filter]");
    filterSelects.forEach((select) => {
      select.addEventListener("change", async (e) => {
        const target = e.target as HTMLSelectElement;
        const filterName = target.dataset.filter as keyof typeof this.filters;
        this.filters[filterName] = target.value;
        await this.loadPrescriptions();
        this.render();
        this.attachEventListeners();
      });
    });

    // View prescription
    const viewButtons = this.container.querySelectorAll('[data-action="view"]');
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const id = target.dataset.id;
        window.location.hash = `#/pharmacy/prescriptions/${id}`;
      });
    });

    // Row click
    const rxNumbers = this.container.querySelectorAll(".rx-number");
    rxNumbers.forEach((rxNum) => {
      rxNum.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const row = target.closest("tr");
        const id = row?.dataset.rxId;
        if (id) {
          window.location.hash = `#/pharmacy/prescriptions/${id}`;
        }
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
