/**
 * Calendar Component (Basic View - Day/Week/Month)
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class Calendar {
  private container: HTMLElement;
  private currentDate: Date;
  private currentView: "day" | "week" | "month";
  private onDateSelect?: (date: Date) => void;

  constructor(
    container: HTMLElement,
    options?: {
      initialDate?: Date;
      initialView?: "day" | "week" | "month";
      onDateSelect?: (date: Date) => void;
    },
  ) {
    this.container = container;
    this.currentDate = options?.initialDate || new Date();
    this.currentView = options?.initialView || "month";
    this.onDateSelect = options?.onDateSelect;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="calendar-component">
        <div class="calendar-controls">
          <button class="nav-btn" id="prevBtn">‹</button>
          <span class="calendar-title">${this.getTitle()}</span>
          <button class="nav-btn" id="nextBtn">›</button>
        </div>
        <div class="calendar-body-container" id="calendarBody"></div>
      </div>
    `;

    this.renderBody();
    this.attachEventListeners();
  }

  private renderBody(): void {
    const body = document.getElementById("calendarBody")!;

    switch (this.currentView) {
      case "month":
        body.innerHTML = this.renderMonthView();
        break;
      case "week":
        body.innerHTML = this.renderWeekView();
        break;
      case "day":
        body.innerHTML = this.renderDayView();
        break;
    }
  }

  private renderMonthView(): string {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1 - firstDay;

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(year, month, currentDay);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = this.isToday(date);

        days.push(`
          <div class="calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""}"
               data-date="${date.toISOString()}">
            ${date.getDate()}
          </div>
        `);
        currentDay++;
      }
      weeks.push(`<div class="calendar-week">${days.join("")}</div>`);
    }

    return `
      <div class="calendar-month">
        <div class="calendar-weekdays">
          ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="weekday">${d}</div>`).join("")}
        </div>
        ${weeks.join("")}
      </div>
    `;
  }

  private renderWeekView(): string {
    return '<div class="calendar-week-view">Week view - To be implemented</div>';
  }

  private renderDayView(): string {
    return '<div class="calendar-day-view">Day view - To be implemented</div>';
  }

  private attachEventListeners(): void {
    document.getElementById("prevBtn")?.addEventListener("click", () => {
      this.navigate(-1);
    });

    document.getElementById("nextBtn")?.addEventListener("click", () => {
      this.navigate(1);
    });

    this.container.querySelectorAll(".calendar-day").forEach((day) => {
      day.addEventListener("click", (e) => {
        const dateStr = (e.currentTarget as HTMLElement).dataset.date;
        if (dateStr && this.onDateSelect) {
          this.onDateSelect(new Date(dateStr));
        }
      });
    });
  }

  private navigate(direction: number): void {
    switch (this.currentView) {
      case "month":
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        break;
      case "week":
        this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
        break;
      case "day":
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        break;
    }
    this.render();
  }

  private getTitle(): string {
    switch (this.currentView) {
      case "month":
        return this.currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "week":
        return `Week of ${this.currentDate.toLocaleDateString()}`;
      case "day":
        return this.currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
    }
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  destroy(): void {}
}
