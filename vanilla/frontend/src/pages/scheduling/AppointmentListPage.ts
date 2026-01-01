/**
 * Appointment List Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from "../../services/SchedulingService";

export class AppointmentListPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;
  private currentPage = 1;
  private pageSize = 20;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="appointment-list-page">
        <div class="page-header">
          <h1>Appointments</h1>
          <button class="btn btn-primary" id="newBtn">+ New Appointment</button>
        </div>

        <div class="filters-bar">
          <input type="text" id="searchInput" placeholder="Search by patient name, MRN..." class="search-input">
          <select id="statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select id="providerFilter" class="filter-select">
            <option value="">All Providers</option>
          </select>
          <input type="date" id="dateFilter" class="filter-input">
          <button id="clearFilters" class="btn btn-secondary">Clear Filters</button>
        </div>

        <div class="table-container">
          <table class="appointments-table">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAll"></th>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="appointmentsBody">
              <tr><td colspan="8" class="loading">Loading appointments...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="pagination"></div>

        <div class="batch-actions" id="batchActions" style="display: none;">
          <span id="selectedCount">0 selected</span>
          <button class="btn" data-action="confirm">Confirm</button>
          <button class="btn" data-action="cancel">Cancel</button>
          <button class="btn" data-action="reschedule">Reschedule</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadAppointments();
  }

  private attachEventListeners(): void {
    document.getElementById("newBtn")?.addEventListener("click", () => {
      window.location.hash = "/scheduling/appointments/new";
    });

    document
      .getElementById("searchInput")
      ?.addEventListener("input", () => this.loadAppointments());
    document
      .getElementById("statusFilter")
      ?.addEventListener("change", () => this.loadAppointments());
    document
      .getElementById("providerFilter")
      ?.addEventListener("change", () => this.loadAppointments());
    document
      .getElementById("dateFilter")
      ?.addEventListener("change", () => this.loadAppointments());
    document
      .getElementById("clearFilters")
      ?.addEventListener("click", () => this.clearFilters());

    document.getElementById("selectAll")?.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      document.querySelectorAll(".row-checkbox").forEach((cb) => {
        (cb as HTMLInputElement).checked = checked;
      });
      this.updateBatchActions();
    });
  }

  private async loadAppointments(): Promise<void> {
    try {
      const filters = {
        search: (document.getElementById("searchInput") as HTMLInputElement)
          .value,
        status: (document.getElementById("statusFilter") as HTMLSelectElement)
          .value,
        providerId: (
          document.getElementById("providerFilter") as HTMLSelectElement
        ).value,
        date: (document.getElementById("dateFilter") as HTMLInputElement).value,
      };

      const result = await this.schedulingService.getAppointments({
        ...filters,
        limit: this.pageSize,
        offset: (this.currentPage - 1) * this.pageSize,
      });

      this.renderAppointments(result.data);
      this.renderPagination(result.total);
    } catch (error) {
      console.error("Error loading appointments:", error);
    }
  }

  private renderAppointments(appointments: any[]): void {
    const tbody = document.getElementById("appointmentsBody")!;

    if (appointments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="empty-state">No appointments found</td></tr>';
      return;
    }

    tbody.innerHTML = appointments
      .map(
        (apt) => `
      <tr data-id="${apt.id}">
        <td><input type="checkbox" class="row-checkbox" data-id="${apt.id}"></td>
        <td>${new Date(apt.startTime).toLocaleString()}</td>
        <td><a href="#/patients/${apt.patientId}">${apt.patientName}</a></td>
        <td>${apt.providerName}</td>
        <td>${apt.appointmentType}</td>
        <td>${apt.location.facilityName}</td>
        <td><span class="status-badge status-${apt.status}">${apt.status}</span></td>
        <td>
          <button class="btn-icon" onclick="window.location.hash='/scheduling/appointments/${apt.id}'">View</button>
          <button class="btn-icon" data-action="edit" data-id="${apt.id}">Edit</button>
        </td>
      </tr>
    `,
      )
      .join("");

    tbody.querySelectorAll(".row-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => this.updateBatchActions());
    });
  }

  private renderPagination(total: number): void {
    const container = document.getElementById("pagination")!;
    const totalPages = Math.ceil(total / this.pageSize);

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <button ${this.currentPage === 1 ? "disabled" : ""} onclick="this.previousPage()">Previous</button>
      <span>Page ${this.currentPage} of ${totalPages}</span>
      <button ${this.currentPage === totalPages ? "disabled" : ""} onclick="this.nextPage()">Next</button>
    `;
  }

  private updateBatchActions(): void {
    const selected = document.querySelectorAll(".row-checkbox:checked");
    const batchActions = document.getElementById("batchActions")!;
    const selectedCount = document.getElementById("selectedCount")!;

    if (selected.length > 0) {
      batchActions.style.display = "flex";
      selectedCount.textContent = `${selected.length} selected`;
    } else {
      batchActions.style.display = "none";
    }
  }

  private clearFilters(): void {
    (document.getElementById("searchInput") as HTMLInputElement).value = "";
    (document.getElementById("statusFilter") as HTMLSelectElement).value = "";
    (document.getElementById("providerFilter") as HTMLSelectElement).value = "";
    (document.getElementById("dateFilter") as HTMLInputElement).value = "";
    this.loadAppointments();
  }

  destroy(): void {}
}
