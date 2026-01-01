/**
 * Calendar Page - Multi-view Scheduling Calendar
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from "../../services/SchedulingService";
import { DragDropCalendar } from "../../components/scheduling/DragDropCalendar";

export class CalendarPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;
  private calendar: DragDropCalendar | null = null;
  private currentView: "day" | "week" | "month" = "week";
  private currentDate: Date = new Date();
  private selectedProvider: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="calendar-page">
        <!-- Calendar Header -->
        <div class="calendar-header">
          <div class="header-left">
            <h1>Scheduling Calendar</h1>
            <div class="date-display" id="dateDisplay"></div>
          </div>
          <div class="header-controls">
            <div class="view-selector">
              <button class="view-btn ${this.currentView === "day" ? "active" : ""}" data-view="day">Day</button>
              <button class="view-btn ${this.currentView === "week" ? "active" : ""}" data-view="week">Week</button>
              <button class="view-btn ${this.currentView === "month" ? "active" : ""}" data-view="month">Month</button>
            </div>
            <div class="date-navigation">
              <button class="nav-btn" id="prevBtn">‹</button>
              <button class="nav-btn" id="todayBtn">Today</button>
              <button class="nav-btn" id="nextBtn">›</button>
            </div>
            <select class="provider-filter" id="providerFilter">
              <option value="">All Providers</option>
            </select>
            <button class="btn btn-primary" id="newAppointmentBtn">+ New Appointment</button>
          </div>
        </div>

        <!-- Filters -->
        <div class="calendar-filters">
          <div class="filter-group">
            <label>Facility:</label>
            <select id="facilityFilter">
              <option value="">All Facilities</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Specialty:</label>
            <select id="specialtyFilter">
              <option value="">All Specialties</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status:</label>
            <select id="statusFilter">
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">Checked In</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <!-- Calendar Container -->
        <div class="calendar-container" id="calendarContainer">
          <div class="loading">Loading calendar...</div>
        </div>

        <!-- Legend -->
        <div class="calendar-legend">
          <div class="legend-item"><span class="dot status-scheduled"></span> Scheduled</div>
          <div class="legend-item"><span class="dot status-confirmed"></span> Confirmed</div>
          <div class="legend-item"><span class="dot status-checked-in"></span> Checked In</div>
          <div class="legend-item"><span class="dot status-in-progress"></span> In Progress</div>
          <div class="legend-item"><span class="dot status-completed"></span> Completed</div>
          <div class="legend-item"><span class="dot status-cancelled"></span> Cancelled</div>
          <div class="legend-item"><span class="dot status-no-show"></span> No Show</div>
        </div>
      </div>
    `;

    await this.initializeCalendar();
    this.attachEventListeners();
    this.updateDateDisplay();
  }

  private async initializeCalendar(): Promise<void> {
    const container = document.getElementById("calendarContainer")!;
    this.calendar = new DragDropCalendar(container, {
      view: this.currentView,
      date: this.currentDate,
      onAppointmentClick: (appointmentId) =>
        this.handleAppointmentClick(appointmentId),
      onSlotClick: (startTime) => this.handleSlotClick(startTime),
      onAppointmentDrop: (appointmentId, newStartTime) =>
        this.handleAppointmentDrop(appointmentId, newStartTime),
    });

    await this.loadCalendarData();
    await this.loadProviders();
  }

  private attachEventListeners(): void {
    // View selection
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const view = (e.target as HTMLElement).dataset.view as
          | "day"
          | "week"
          | "month";
        this.changeView(view);
      });
    });

    // Navigation
    document
      .getElementById("prevBtn")
      ?.addEventListener("click", () => this.navigateDate(-1));
    document
      .getElementById("nextBtn")
      ?.addEventListener("click", () => this.navigateDate(1));
    document
      .getElementById("todayBtn")
      ?.addEventListener("click", () => this.goToToday());

    // Filters
    document
      .getElementById("providerFilter")
      ?.addEventListener("change", (e) => {
        this.selectedProvider = (e.target as HTMLSelectElement).value || null;
        this.loadCalendarData();
      });

    document
      .getElementById("facilityFilter")
      ?.addEventListener("change", () => this.loadCalendarData());
    document
      .getElementById("specialtyFilter")
      ?.addEventListener("change", () => this.loadCalendarData());
    document
      .getElementById("statusFilter")
      ?.addEventListener("change", () => this.loadCalendarData());

    // New appointment
    document
      .getElementById("newAppointmentBtn")
      ?.addEventListener("click", () => {
        window.location.hash = "/scheduling/appointments/new";
      });
  }

  private async loadCalendarData(): Promise<void> {
    try {
      const { startDate, endDate } = this.getDateRange();
      const filters = this.getFilters();

      const appointments = await this.schedulingService.getAppointments({
        startDate,
        endDate,
        ...filters,
      });

      const availability = await this.schedulingService.getAvailability({
        startDate,
        endDate,
        providerId: this.selectedProvider || undefined,
      });

      this.calendar?.updateData(appointments, availability);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }

  private async loadProviders(): Promise<void> {
    try {
      const providers = await this.schedulingService.getProviders();
      const select = document.getElementById(
        "providerFilter",
      ) as HTMLSelectElement;

      select.innerHTML =
        '<option value="">All Providers</option>' +
        providers
          .map(
            (p) =>
              `<option value="${p.id}">${p.fullName} - ${p.specialty}</option>`,
          )
          .join("");
    } catch (error) {
      console.error("Error loading providers:", error);
    }
  }

  private getDateRange(): { startDate: Date; endDate: Date } {
    const startDate = new Date(this.currentDate);
    const endDate = new Date(this.currentDate);

    switch (this.currentView) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  private getFilters(): any {
    return {
      providerId:
        (document.getElementById("providerFilter") as HTMLSelectElement)
          .value || undefined,
      facilityId:
        (document.getElementById("facilityFilter") as HTMLSelectElement)
          .value || undefined,
      specialty:
        (document.getElementById("specialtyFilter") as HTMLSelectElement)
          .value || undefined,
      status:
        (document.getElementById("statusFilter") as HTMLSelectElement).value ||
        undefined,
    };
  }

  private changeView(view: "day" | "week" | "month"): void {
    this.currentView = view;
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === view);
    });
    this.calendar?.setView(view);
    this.updateDateDisplay();
    this.loadCalendarData();
  }

  private navigateDate(direction: number): void {
    switch (this.currentView) {
      case "day":
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        break;
      case "week":
        this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
        break;
      case "month":
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        break;
    }
    this.calendar?.setDate(this.currentDate);
    this.updateDateDisplay();
    this.loadCalendarData();
  }

  private goToToday(): void {
    this.currentDate = new Date();
    this.calendar?.setDate(this.currentDate);
    this.updateDateDisplay();
    this.loadCalendarData();
  }

  private updateDateDisplay(): void {
    const display = document.getElementById("dateDisplay")!;
    const { startDate, endDate } = this.getDateRange();

    switch (this.currentView) {
      case "day":
        display.textContent = startDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        break;
      case "week":
        display.textContent = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        break;
      case "month":
        display.textContent = startDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        break;
    }
  }

  private handleAppointmentClick(appointmentId: string): void {
    window.location.hash = `/scheduling/appointments/${appointmentId}`;
  }

  private handleSlotClick(startTime: Date): void {
    const params = new URLSearchParams({
      startTime: startTime.toISOString(),
      providerId: this.selectedProvider || "",
    });
    window.location.hash = `/scheduling/appointments/new?${params.toString()}`;
  }

  private async handleAppointmentDrop(
    appointmentId: string,
    newStartTime: Date,
  ): Promise<void> {
    try {
      await this.schedulingService.rescheduleAppointment(
        appointmentId,
        newStartTime,
      );
      this.loadCalendarData();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      alert("Failed to reschedule appointment. Please try again.");
      this.loadCalendarData(); // Reload to revert changes
    }
  }

  destroy(): void {
    this.calendar?.destroy();
  }
}
