/**
 * Scheduling Dashboard Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from "../../services/SchedulingService";

export class SchedulingDashboardPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="scheduling-dashboard">
        <div class="dashboard-header">
          <h1>Scheduling Dashboard</h1>
          <div class="header-actions">
            <button class="btn btn-primary" id="newAppointmentBtn">
              <span class="icon">+</span>
              New Appointment
            </button>
            <button class="btn btn-secondary" id="refreshBtn">
              <span class="icon">⟳</span>
              Refresh
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-label">Today's Appointments</div>
              <div class="stat-value" id="todayTotal">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✓</div>
            <div class="stat-content">
              <div class="stat-label">Checked In</div>
              <div class="stat-value" id="checkedIn">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏰</div>
            <div class="stat-content">
              <div class="stat-label">In Progress</div>
              <div class="stat-value" id="inProgress">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-label">Waiting Room</div>
              <div class="stat-value" id="waitingRoom">--</div>
            </div>
          </div>

          <div class="stat-card alert">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-label">No Shows</div>
              <div class="stat-value" id="noShows">--</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-label">Waitlist</div>
              <div class="stat-value" id="waitlist">--</div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
          <!-- Today's Schedule -->
          <div class="dashboard-card">
            <div class="card-header">
              <h2>Today's Schedule</h2>
              <a href="#/scheduling/calendar" class="link">View Calendar</a>
            </div>
            <div class="card-body">
              <div id="todaySchedule" class="schedule-list">
                <div class="loading">Loading schedule...</div>
              </div>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="dashboard-card">
            <div class="card-header">
              <h2>Upcoming Appointments</h2>
              <a href="#/scheduling/appointments" class="link">View All</a>
            </div>
            <div class="card-body">
              <div id="upcomingAppointments" class="appointments-list">
                <div class="loading">Loading appointments...</div>
              </div>
            </div>
          </div>

          <!-- Priority Waitlist -->
          <div class="dashboard-card">
            <div class="card-header">
              <h2>Priority Waitlist</h2>
              <a href="#/scheduling/waitlist" class="link">Manage Waitlist</a>
            </div>
            <div class="card-body">
              <div id="priorityWaitlist" class="waitlist-items">
                <div class="loading">Loading waitlist...</div>
              </div>
            </div>
          </div>

          <!-- Alerts & Notifications -->
          <div class="dashboard-card">
            <div class="card-header">
              <h2>Alerts</h2>
            </div>
            <div class="card-body">
              <div id="alertsList" class="alerts-list">
                <div class="loading">Loading alerts...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <button class="action-btn" data-action="new-appointment">
              <span class="icon">📅</span>
              <span>New Appointment</span>
            </button>
            <button class="action-btn" data-action="check-in">
              <span class="icon">✓</span>
              <span>Check In Patient</span>
            </button>
            <button class="action-btn" data-action="view-calendar">
              <span class="icon">📆</span>
              <span>View Calendar</span>
            </button>
            <button class="action-btn" data-action="manage-waitlist">
              <span class="icon">📋</span>
              <span>Manage Waitlist</span>
            </button>
            <button class="action-btn" data-action="providers">
              <span class="icon">👨‍⚕️</span>
              <span>Providers</span>
            </button>
            <button class="action-btn" data-action="resources">
              <span class="icon">🏥</span>
              <span>Resources</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadDashboardData();
  }

  private attachEventListeners(): void {
    // New appointment button
    document
      .getElementById("newAppointmentBtn")
      ?.addEventListener("click", () => {
        window.location.hash = "/scheduling/appointments/new";
      });

    // Refresh button
    document
      .getElementById("refreshBtn")
      ?.addEventListener("click", async () => {
        await this.loadDashboardData();
      });

    // Quick action buttons
    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.handleQuickAction(action || "");
      });
    });
  }

  private async loadDashboardData(): Promise<void> {
    try {
      // Load statistics
      const stats = await this.schedulingService.getDashboardStats();
      this.updateStats(stats);

      // Load today's schedule
      const todaySchedule = await this.schedulingService.getTodaySchedule();
      this.renderTodaySchedule(todaySchedule);

      // Load upcoming appointments
      const upcoming = await this.schedulingService.getUpcomingAppointments(7);
      this.renderUpcomingAppointments(upcoming);

      // Load priority waitlist
      const waitlist = await this.schedulingService.getPriorityWaitlist();
      this.renderWaitlist(waitlist);

      // Load alerts
      const alerts = this.generateAlerts(stats);
      this.renderAlerts(alerts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  private updateStats(stats: any): void {
    document.getElementById("todayTotal")!.textContent =
      stats.today.totalAppointments.toString();
    document.getElementById("checkedIn")!.textContent =
      stats.today.checkedIn.toString();
    document.getElementById("inProgress")!.textContent =
      stats.today.inProgress.toString();
    document.getElementById("waitingRoom")!.textContent = (
      stats.today.checkedIn - stats.today.inProgress
    ).toString();
    document.getElementById("noShows")!.textContent =
      stats.today.noShows.toString();
    document.getElementById("waitlist")!.textContent =
      stats.waitlist.active.toString();
  }

  private renderTodaySchedule(appointments: any[]): void {
    const container = document.getElementById("todaySchedule")!;

    if (appointments.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No appointments scheduled for today</div>';
      return;
    }

    container.innerHTML = appointments
      .map(
        (apt) => `
      <div class="schedule-item" data-id="${apt.id}">
        <div class="time">${this.formatTime(apt.startTime)}</div>
        <div class="details">
          <div class="patient-name">${apt.patientName}</div>
          <div class="provider">${apt.providerName}</div>
          <div class="type">${apt.appointmentType}</div>
        </div>
        <div class="status status-${apt.status}">${apt.status}</div>
      </div>
    `,
      )
      .join("");
  }

  private renderUpcomingAppointments(appointments: any[]): void {
    const container = document.getElementById("upcomingAppointments")!;

    if (appointments.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No upcoming appointments</div>';
      return;
    }

    container.innerHTML = appointments
      .slice(0, 5)
      .map(
        (apt) => `
      <div class="appointment-item" data-id="${apt.id}">
        <div class="date">${this.formatDate(apt.startTime)}</div>
        <div class="patient">${apt.patientName}</div>
        <div class="provider">${apt.providerName}</div>
        ${!apt.confirmed ? '<span class="badge badge-warning">Not Confirmed</span>' : ""}
      </div>
    `,
      )
      .join("");
  }

  private renderWaitlist(entries: any[]): void {
    const container = document.getElementById("priorityWaitlist")!;

    if (entries.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No waitlist entries</div>';
      return;
    }

    container.innerHTML = entries
      .slice(0, 5)
      .map(
        (entry) => `
      <div class="waitlist-item priority-${entry.priority}" data-id="${entry.id}">
        <div class="priority-badge">${entry.priority}</div>
        <div class="patient">${entry.patientName}</div>
        <div class="reason">${entry.reason}</div>
        <button class="btn-small" data-action="notify">Notify</button>
      </div>
    `,
      )
      .join("");
  }

  private renderAlerts(alerts: any[]): void {
    const container = document.getElementById("alertsList")!;

    if (alerts.length === 0) {
      container.innerHTML = '<div class="empty-state">No alerts</div>';
      return;
    }

    container.innerHTML = alerts
      .map(
        (alert) => `
      <div class="alert-item alert-${alert.type}">
        <div class="alert-icon">${alert.icon}</div>
        <div class="alert-message">${alert.message}</div>
      </div>
    `,
      )
      .join("");
  }

  private generateAlerts(stats: any): any[] {
    const alerts = [];

    if (stats.upcoming.needingConfirmation > 0) {
      alerts.push({
        type: "warning",
        icon: "⚠️",
        message: `${stats.upcoming.needingConfirmation} appointments need confirmation`,
      });
    }

    if (stats.upcoming.needingInsuranceVerification > 0) {
      alerts.push({
        type: "warning",
        icon: "💳",
        message: `${stats.upcoming.needingInsuranceVerification} appointments need insurance verification`,
      });
    }

    if (stats.waitlist.urgent > 0) {
      alerts.push({
        type: "urgent",
        icon: "🚨",
        message: `${stats.waitlist.urgent} urgent waitlist entries`,
      });
    }

    return alerts;
  }

  private handleQuickAction(action: string): void {
    const routes: Record<string, string> = {
      "new-appointment": "/scheduling/appointments/new",
      "check-in": "/scheduling/check-in",
      "view-calendar": "/scheduling/calendar",
      "manage-waitlist": "/scheduling/waitlist",
      providers: "/scheduling/providers",
      resources: "/scheduling/resources",
    };

    if (routes[action]) {
      window.location.hash = routes[action];
    }
  }

  private formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  private showError(message: string): void {
    const alert = document.createElement("div");
    alert.className = "alert alert-error";
    alert.textContent = message;
    this.container.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
  }

  destroy(): void {
    // Cleanup
  }
}
