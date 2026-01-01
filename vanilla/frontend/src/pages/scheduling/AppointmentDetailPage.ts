/**
 * Appointment Detail Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';

export class AppointmentDetailPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;
  private appointmentId: string;

  constructor(container: HTMLElement, appointmentId: string) {
    this.container = container;
    this.appointmentId = appointmentId;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    try {
      const appointment = await this.schedulingService.getAppointment(this.appointmentId);

      this.container.innerHTML = `
        <div class="appointment-detail-page">
          <div class="page-header">
            <h1>Appointment Details</h1>
            <div class="actions">
              <button class="btn" id="editBtn">Edit</button>
              <button class="btn" id="printBtn">Print</button>
              <button class="btn btn-danger" id="cancelBtn">Cancel Appointment</button>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <h2>Appointment Information</h2>
              <div class="info-row"><label>Date & Time:</label><span>${new Date(appointment.startTime).toLocaleString()}</span></div>
              <div class="info-row"><label>Duration:</label><span>${appointment.duration} minutes</span></div>
              <div class="info-row"><label>Type:</label><span>${appointment.appointmentType}</span></div>
              <div class="info-row"><label>Status:</label><span class="status-badge status-${appointment.status}">${appointment.status}</span></div>
              <div class="info-row"><label>Reason:</label><span>${appointment.reason}</span></div>
              ${appointment.notes ? `<div class="info-row"><label>Notes:</label><span>${appointment.notes}</span></div>` : ''}
            </div>

            <div class="detail-card">
              <h2>Patient Information</h2>
              <div class="info-row"><label>Name:</label><span>${appointment.patientName}</span></div>
              <div class="info-row"><label>MRN:</label><span>${appointment.patientId}</span></div>
              <button class="btn-link" onclick="window.location.hash='/patients/${appointment.patientId}'">View Patient Record</button>
            </div>

            <div class="detail-card">
              <h2>Provider</h2>
              <div class="info-row"><label>Name:</label><span>${appointment.providerName}</span></div>
              ${appointment.specialty ? `<div class="info-row"><label>Specialty:</label><span>${appointment.specialty}</span></div>` : ''}
            </div>

            <div class="detail-card">
              <h2>Location</h2>
              <div class="info-row"><label>Facility:</label><span>${appointment.location.facilityName}</span></div>
              ${appointment.location.roomNumber ? `<div class="info-row"><label>Room:</label><span>${appointment.location.roomNumber}</span></div>` : ''}
              ${appointment.location.floor ? `<div class="info-row"><label>Floor:</label><span>${appointment.location.floor}</span></div>` : ''}
            </div>

            ${appointment.telehealth?.enabled ? `
              <div class="detail-card">
                <h2>Telehealth</h2>
                <div class="info-row"><label>Provider:</label><span>${appointment.telehealth.provider}</span></div>
                ${appointment.telehealth.meetingUrl ? `
                  <div class="info-row"><label>Meeting URL:</label><a href="${appointment.telehealth.meetingUrl}" target="_blank">Join Meeting</a></div>
                ` : ''}
              </div>
            ` : ''}

            <div class="detail-card">
              <h2>Insurance</h2>
              <div class="info-row"><label>Verified:</label><span>${appointment.insuranceVerified ? 'Yes' : 'No'}</span></div>
              ${appointment.copayAmount ? `<div class="info-row"><label>Copay:</label><span>$${appointment.copayAmount}</span></div>` : ''}
              ${appointment.copayPaid !== undefined ? `<div class="info-row"><label>Copay Paid:</label><span>${appointment.copayPaid ? 'Yes' : 'No'}</span></div>` : ''}
            </div>

            ${appointment.resources && appointment.resources.length > 0 ? `
              <div class="detail-card">
                <h2>Resources</h2>
                ${appointment.resources.map((r: any) => `
                  <div class="resource-item">${r.resourceName} (${r.resourceType})</div>
                `).join('')}
              </div>
            ` : ''}

            <div class="detail-card">
              <h2>Timeline</h2>
              <div class="timeline">
                <div class="timeline-item">
                  <span class="time">${new Date(appointment.createdAt).toLocaleString()}</span>
                  <span class="event">Appointment created by ${appointment.createdBy}</span>
                </div>
                ${appointment.checkInTime ? `
                  <div class="timeline-item">
                    <span class="time">${new Date(appointment.checkInTime).toLocaleString()}</span>
                    <span class="event">Patient checked in</span>
                  </div>
                ` : ''}
                ${appointment.checkOutTime ? `
                  <div class="timeline-item">
                    <span class="time">${new Date(appointment.checkOutTime).toLocaleString()}</span>
                    <span class="event">Patient checked out</span>
                  </div>
                ` : ''}
                ${appointment.cancelledAt ? `
                  <div class="timeline-item">
                    <span class="time">${new Date(appointment.cancelledAt).toLocaleString()}</span>
                    <span class="event">Cancelled: ${appointment.cancellationReason}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            ${appointment.reminders && appointment.reminders.length > 0 ? `
              <div class="detail-card">
                <h2>Reminders</h2>
                ${appointment.reminders.map((r: any) => `
                  <div class="reminder-item">
                    <span>${r.type}</span> - <span>${r.status}</span> - <span>${new Date(r.sentAt).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          ${['scheduled', 'confirmed'].includes(appointment.status) ? `
            <div class="quick-actions-bar">
              <button class="btn btn-success" id="checkInBtn">Check In</button>
              <button class="btn" id="confirmBtn">Confirm</button>
              <button class="btn" id="rescheduleBtn">Reschedule</button>
              <button class="btn" id="sendReminderBtn">Send Reminder</button>
            </div>
          ` : ''}
        </div>
      `;

      this.attachEventListeners(appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
      this.container.innerHTML = '<div class="error">Failed to load appointment details</div>';
    }
  }

  private attachEventListeners(appointment: any): void {
    document.getElementById('editBtn')?.addEventListener('click', () => {
      window.location.hash = `/scheduling/appointments/${this.appointmentId}/edit`;
    });

    document.getElementById('printBtn')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('cancelBtn')?.addEventListener('click', async () => {
      const reason = prompt('Cancellation reason:');
      if (reason) {
        await this.schedulingService.cancelAppointment(this.appointmentId, reason);
        window.location.reload();
      }
    });

    document.getElementById('checkInBtn')?.addEventListener('click', async () => {
      await this.schedulingService.checkIn(this.appointmentId);
      window.location.reload();
    });

    document.getElementById('confirmBtn')?.addEventListener('click', async () => {
      await this.schedulingService.confirmAppointment(this.appointmentId);
      window.location.reload();
    });

    document.getElementById('rescheduleBtn')?.addEventListener('click', () => {
      // Open reschedule modal
    });

    document.getElementById('sendReminderBtn')?.addEventListener('click', async () => {
      await this.schedulingService.sendReminder(this.appointmentId);
      alert('Reminder sent successfully');
    });
  }

  destroy(): void {}
}
