/**
 * Appointment Card Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class AppointmentCard {
  private appointment: any;

  constructor(appointment: any) {
    this.appointment = appointment;
  }

  render(): string {
    return `
      <div class="appointment-card status-${this.appointment.status}" data-id="${this.appointment.id}">
        <div class="appointment-header">
          <span class="appointment-time">${this.formatTime(this.appointment.startTime)}</span>
          <span class="status-badge">${this.appointment.status}</span>
        </div>
        <div class="appointment-body">
          <div class="patient-info">
            <strong>${this.appointment.patientName}</strong>
            ${this.appointment.patientId ? `<span class="mrn">MRN: ${this.appointment.patientId}</span>` : ""}
          </div>
          <div class="appointment-details">
            <div class="provider">${this.appointment.providerName}</div>
            <div class="type">${this.appointment.appointmentType}</div>
            <div class="location">${this.appointment.location?.facilityName || ""}</div>
          </div>
          ${this.appointment.reason ? `<div class="reason">${this.appointment.reason}</div>` : ""}
        </div>
        <div class="appointment-actions">
          <button class="btn-small" data-action="view">View</button>
          ${this.renderActionButtons()}
        </div>
      </div>
    `;
  }

  private renderActionButtons(): string {
    const status = this.appointment.status;
    const buttons = [];

    if (status === "scheduled") {
      buttons.push(
        '<button class="btn-small" data-action="confirm">Confirm</button>',
      );
      buttons.push(
        '<button class="btn-small" data-action="check-in">Check In</button>',
      );
    } else if (status === "confirmed") {
      buttons.push(
        '<button class="btn-small" data-action="check-in">Check In</button>',
      );
    } else if (status === "checked-in") {
      buttons.push(
        '<button class="btn-small" data-action="start">Start</button>',
      );
    } else if (status === "in-progress") {
      buttons.push(
        '<button class="btn-small" data-action="complete">Complete</button>',
      );
    }

    return buttons.join("");
  }

  private formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}
