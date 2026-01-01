/**
 * Drag & Drop Calendar Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 * Uses native HTML5 Drag & Drop API
 */

export interface CalendarOptions {
  view: "day" | "week" | "month";
  date: Date;
  onAppointmentClick?: (appointmentId: string) => void;
  onSlotClick?: (startTime: Date) => void;
  onAppointmentDrop?: (
    appointmentId: string,
    newStartTime: Date,
  ) => Promise<void>;
}

export class DragDropCalendar {
  private container: HTMLElement;
  private options: CalendarOptions;
  private appointments: any[] = [];
  private availability: any[] = [];
  private draggedElement: HTMLElement | null = null;
  private draggedAppointmentId: string | null = null;

  constructor(container: HTMLElement, options: CalendarOptions) {
    this.container = container;
    this.options = options;
  }

  async updateData(appointments: any[], availability: any[]): Promise<void> {
    this.appointments = appointments;
    this.availability = availability;
    this.render();
  }

  setView(view: "day" | "week" | "month"): void {
    this.options.view = view;
    this.render();
  }

  setDate(date: Date): void {
    this.options.date = date;
    this.render();
  }

  private render(): void {
    switch (this.options.view) {
      case "day":
        this.renderDayView();
        break;
      case "week":
        this.renderWeekView();
        break;
      case "month":
        this.renderMonthView();
        break;
    }
  }

  private renderDayView(): void {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

    this.container.innerHTML = `
      <div class="calendar-day-view">
        <div class="time-column">
          ${hours
            .map(
              (hour) => `
            <div class="time-slot" data-hour="${hour}">
              ${this.formatHour(hour)}
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="appointments-column" data-droppable="true">
          ${hours
            .map(
              (hour) => `
            <div class="hour-slot" data-hour="${hour}" data-date="${this.options.date.toISOString()}">
              ${this.renderAppointmentsForHour(hour)}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    this.attachDragDropListeners();
  }

  private renderWeekView(): void {
    const weekStart = this.getWeekStart(this.options.date);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    const hours = Array.from({ length: 16 }, (_, i) => i + 6);

    this.container.innerHTML = `
      <div class="calendar-week-view">
        <div class="calendar-header">
          <div class="time-header"></div>
          ${weekDays
            .map(
              (date) => `
            <div class="day-header">
              <div class="day-name">${date.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div class="day-date">${date.getDate()}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="calendar-body">
          <div class="time-column">
            ${hours
              .map(
                (hour) => `
              <div class="time-slot">${this.formatHour(hour)}</div>
            `,
              )
              .join("")}
          </div>
          ${weekDays
            .map(
              (date) => `
            <div class="day-column" data-date="${date.toISOString()}" data-droppable="true">
              ${hours
                .map(
                  (hour) => `
                <div class="hour-slot" data-hour="${hour}" data-date="${date.toISOString()}">
                  ${this.renderAppointmentsForSlot(date, hour)}
                </div>
              `,
                )
                .join("")}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    this.attachDragDropListeners();
  }

  private renderMonthView(): void {
    const monthStart = new Date(
      this.options.date.getFullYear(),
      this.options.date.getMonth(),
      1,
    );
    const monthEnd = new Date(
      this.options.date.getFullYear(),
      this.options.date.getMonth() + 1,
      0,
    );

    const firstDayOfWeek = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();

    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - firstDayOfWeek);

    const weeks = [];
    let currentDate = new Date(calendarStart);

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(days);
    }

    this.container.innerHTML = `
      <div class="calendar-month-view">
        <div class="month-header">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            .map(
              (day) => `
            <div class="day-header">${day}</div>
          `,
            )
            .join("")}
        </div>
        <div class="month-body">
          ${weeks
            .map(
              (week) => `
            <div class="week-row">
              ${week.map((date) => this.renderMonthDay(date)).join("")}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    this.attachDragDropListeners();
  }

  private renderMonthDay(date: Date): string {
    const isCurrentMonth = date.getMonth() === this.options.date.getMonth();
    const dayAppointments = this.getAppointmentsForDate(date);

    return `
      <div class="month-day ${!isCurrentMonth ? "other-month" : ""}"
           data-date="${date.toISOString()}"
           data-droppable="true">
        <div class="day-number">${date.getDate()}</div>
        <div class="day-appointments">
          ${dayAppointments
            .slice(0, 3)
            .map(
              (apt) => `
            <div class="appointment-pill"
                 data-id="${apt.id}"
                 draggable="true"
                 style="background-color: ${this.getStatusColor(apt.status)}">
              ${new Date(apt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${apt.patientName}
            </div>
          `,
            )
            .join("")}
          ${dayAppointments.length > 3 ? `<div class="more-appointments">+${dayAppointments.length - 3} more</div>` : ""}
        </div>
      </div>
    `;
  }

  private renderAppointmentsForHour(hour: number): string {
    const startTime = new Date(this.options.date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1);

    const appointments = this.appointments.filter((apt) => {
      const aptStart = new Date(apt.startTime);
      return aptStart >= startTime && aptStart < endTime;
    });

    return appointments.map((apt) => this.renderAppointmentCard(apt)).join("");
  }

  private renderAppointmentsForSlot(date: Date, hour: number): string {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1);

    const appointments = this.appointments.filter((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptDate = new Date(
        aptStart.getFullYear(),
        aptStart.getMonth(),
        aptStart.getDate(),
      );
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      return (
        aptDate.getTime() === checkDate.getTime() &&
        aptStart >= slotStart &&
        aptStart < slotEnd
      );
    });

    return appointments.map((apt) => this.renderAppointmentCard(apt)).join("");
  }

  private renderAppointmentCard(appointment: any): string {
    const startTime = new Date(appointment.startTime);
    const duration = appointment.duration;
    const height = (duration / 60) * 60; // 60px per hour

    return `
      <div class="appointment-card status-${appointment.status}"
           data-id="${appointment.id}"
           draggable="true"
           style="height: ${height}px; min-height: 40px;">
        <div class="appointment-time">${startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
        <div class="appointment-patient">${appointment.patientName}</div>
        <div class="appointment-provider">${appointment.providerName}</div>
        <div class="appointment-type">${appointment.appointmentType}</div>
      </div>
    `;
  }

  private getAppointmentsForDate(date: Date): any[] {
    return this.appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  }

  private attachDragDropListeners(): void {
    // Make appointment cards draggable
    this.container.querySelectorAll('[draggable="true"]').forEach((element) => {
      element.addEventListener("dragstart", (e) =>
        this.handleDragStart(e as DragEvent),
      );
      element.addEventListener("dragend", (e) =>
        this.handleDragEnd(e as DragEvent),
      );
    });

    // Make time slots droppable
    this.container
      .querySelectorAll('[data-droppable="true"], .hour-slot, .month-day')
      .forEach((element) => {
        element.addEventListener("dragover", (e) =>
          this.handleDragOver(e as DragEvent),
        );
        element.addEventListener("drop", (e) =>
          this.handleDrop(e as DragEvent),
        );
        element.addEventListener("dragleave", (e) =>
          this.handleDragLeave(e as DragEvent),
        );
      });

    // Click handlers
    this.container
      .querySelectorAll(".appointment-card, .appointment-pill")
      .forEach((element) => {
        element.addEventListener("click", (e) => {
          e.stopPropagation();
          const appointmentId = (e.currentTarget as HTMLElement).dataset.id;
          if (appointmentId && this.options.onAppointmentClick) {
            this.options.onAppointmentClick(appointmentId);
          }
        });
      });

    this.container
      .querySelectorAll(".hour-slot, .month-day")
      .forEach((element) => {
        element.addEventListener("click", (e) => {
          if (
            (e.target as HTMLElement).classList.contains("hour-slot") ||
            (e.target as HTMLElement).classList.contains("month-day")
          ) {
            const dateStr = (e.currentTarget as HTMLElement).dataset.date;
            const hour = (e.currentTarget as HTMLElement).dataset.hour;
            if (dateStr && this.options.onSlotClick) {
              const slotTime = new Date(dateStr);
              if (hour) {
                slotTime.setHours(parseInt(hour));
              }
              this.options.onSlotClick(slotTime);
            }
          }
        });
      });
  }

  private handleDragStart(e: DragEvent): void {
    this.draggedElement = e.target as HTMLElement;
    this.draggedAppointmentId = this.draggedElement.dataset.id || null;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", this.draggedAppointmentId || "");
    }

    this.draggedElement.classList.add("dragging");
  }

  private handleDragEnd(e: DragEvent): void {
    if (this.draggedElement) {
      this.draggedElement.classList.remove("dragging");
    }

    // Remove all drop-target highlights
    this.container.querySelectorAll(".drop-target").forEach((el) => {
      el.classList.remove("drop-target");
    });

    this.draggedElement = null;
    this.draggedAppointmentId = null;
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    const dropTarget = e.currentTarget as HTMLElement;
    dropTarget.classList.add("drop-target");
  }

  private handleDragLeave(e: DragEvent): void {
    const dropTarget = e.currentTarget as HTMLElement;
    dropTarget.classList.remove("drop-target");
  }

  private async handleDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    const dropTarget = e.currentTarget as HTMLElement;
    dropTarget.classList.remove("drop-target");

    if (!this.draggedAppointmentId) return;

    // Calculate new start time
    const dateStr = dropTarget.dataset.date;
    const hourStr = dropTarget.dataset.hour;

    if (!dateStr) return;

    const newStartTime = new Date(dateStr);
    if (hourStr) {
      newStartTime.setHours(parseInt(hourStr));
    }

    // Call the drop handler
    if (this.options.onAppointmentDrop) {
      try {
        await this.options.onAppointmentDrop(
          this.draggedAppointmentId,
          newStartTime,
        );
      } catch (error) {
        console.error("Error handling appointment drop:", error);
      }
    }
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private formatHour(hour: number): string {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: "#3b82f6",
      confirmed: "#10b981",
      "checked-in": "#f59e0b",
      "in-progress": "#8b5cf6",
      completed: "#6b7280",
      cancelled: "#ef4444",
      "no-show": "#dc2626",
    };
    return colors[status] || "#6b7280";
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
