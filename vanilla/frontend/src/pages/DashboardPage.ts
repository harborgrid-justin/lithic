/**
 * Dashboard Page Component
 */

import { Component } from "../components/base/Component";
import { createElement } from "../utils/dom";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Badge } from "../components/ui/Badge";
import { authService as auth } from "../services/auth";
import { formatDate, formatTime } from "../utils/format";

export interface DashboardPageProps {}

interface DashboardPageState {
  loading: boolean;
}

export class DashboardPage extends Component<
  DashboardPageProps,
  DashboardPageState
> {
  constructor(props: DashboardPageProps) {
    super(props, {
      loading: false,
    });
  }

  protected getClassName(): string {
    return "dashboard-page";
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();
    this.removeAllChildren();

    const container = createElement("div", {
      className: "dashboard-container",
    });

    // Header
    const header = this.createHeader();
    container.appendChild(header);

    // Stats cards
    const statsGrid = this.createStatsGrid();
    container.appendChild(statsGrid);

    // Recent activity
    const activitySection = this.createActivitySection();
    container.appendChild(activitySection);

    this.element.appendChild(container);
  }

  private createHeader(): HTMLElement {
    const header = createElement("div", {
      className: "dashboard-header",
    });

    const user = auth.getCurrentUser();

    const title = createElement("h1", {
      className: "dashboard-title",
      textContent: `Welcome back, ${user?.firstName || "User"}!`,
    });

    const subtitle = createElement("p", {
      className: "dashboard-subtitle",
      textContent: "Here's what's happening with your healthcare today.",
    });

    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  private createStatsGrid(): HTMLElement {
    const grid = createElement("div", {
      className: "dashboard-stats-grid",
    });

    const stats = [
      {
        title: "Total Patients",
        value: "1,234",
        change: "+12%",
        trend: "up",
        icon: "👥",
      },
      {
        title: "Appointments Today",
        value: "24",
        change: "+5%",
        trend: "up",
        icon: "📅",
      },
      {
        title: "Pending Tasks",
        value: "8",
        change: "-3%",
        trend: "down",
        icon: "✓",
      },
      {
        title: "Messages",
        value: "15",
        change: "+8%",
        trend: "up",
        icon: "✉",
      },
    ];

    stats.forEach((stat) => {
      const statCard = new Card({
        className: "dashboard-stat-card",
        padding: "md",
      });

      const content = createElement("div", {
        className: "stat-content",
      });

      const iconEl = createElement("div", {
        className: "stat-icon",
        innerHTML: stat.icon,
      });

      const details = createElement("div", {
        className: "stat-details",
      });

      const titleEl = createElement("div", {
        className: "stat-title",
        textContent: stat.title,
      });

      const valueEl = createElement("div", {
        className: "stat-value",
        textContent: stat.value,
      });

      const changeEl = createElement("div", {
        className: `stat-change stat-change-${stat.trend}`,
        textContent: stat.change,
      });

      details.appendChild(titleEl);
      details.appendChild(valueEl);
      details.appendChild(changeEl);

      content.appendChild(iconEl);
      content.appendChild(details);

      statCard.setContent([content]);

      const cardContainer = createElement("div");
      this.addChild(statCard, cardContainer);
      grid.appendChild(cardContainer);
    });

    return grid;
  }

  private createActivitySection(): HTMLElement {
    const section = createElement("div", {
      className: "dashboard-activity-section",
    });

    const card = new Card({
      title: "Recent Appointments",
      subtitle: "View and manage your upcoming appointments",
      actions: [
        {
          label: "View All",
          onClick: () => {
            console.log("View all appointments");
          },
        },
      ],
    });

    const tableData = [
      {
        id: "1",
        patient: "John Doe",
        date: "2024-01-15",
        time: "10:00 AM",
        type: "Consultation",
        status: "confirmed",
        doctor: "Dr. Smith",
      },
      {
        id: "2",
        patient: "Jane Smith",
        date: "2024-01-15",
        time: "11:30 AM",
        type: "Follow-up",
        status: "scheduled",
        doctor: "Dr. Johnson",
      },
      {
        id: "3",
        patient: "Bob Wilson",
        date: "2024-01-15",
        time: "02:00 PM",
        type: "Procedure",
        status: "in-progress",
        doctor: "Dr. Williams",
      },
      {
        id: "4",
        patient: "Alice Brown",
        date: "2024-01-15",
        time: "03:30 PM",
        type: "Emergency",
        status: "cancelled",
        doctor: "Dr. Davis",
      },
    ];

    const table = new DataTable({
      columns: [
        {
          key: "patient",
          label: "Patient",
          sortable: true,
        },
        {
          key: "date",
          label: "Date",
          sortable: true,
          render: (value) => formatDate(new Date(value)),
        },
        {
          key: "time",
          label: "Time",
        },
        {
          key: "type",
          label: "Type",
        },
        {
          key: "status",
          label: "Status",
          render: (value) => {
            const badge = new Badge({
              label: value,
              variant: this.getStatusVariant(value),
              size: "sm",
            });

            const container = createElement("div");
            badge.mount(container);
            return container;
          },
        },
        {
          key: "doctor",
          label: "Doctor",
        },
      ],
      data: tableData,
      searchable: true,
      searchPlaceholder: "Search appointments...",
      pagination: true,
      pageSize: 5,
      striped: true,
      hoverable: true,
      onRowClick: (row) => {
        console.log("Appointment clicked:", row);
      },
    });

    const tableContainer = createElement("div");
    this.addChild(table, tableContainer);

    card.setContent([tableContainer]);

    const cardContainer = createElement("div");
    this.addChild(card, cardContainer);
    section.appendChild(cardContainer);

    return section;
  }

  private getStatusVariant(
    status: string,
  ): "success" | "warning" | "danger" | "info" {
    const variants: Record<string, "success" | "warning" | "danger" | "info"> =
      {
        confirmed: "success",
        scheduled: "info",
        "in-progress": "warning",
        cancelled: "danger",
        completed: "success",
      };

    return variants[status] || "info";
  }
}

export default DashboardPage;
