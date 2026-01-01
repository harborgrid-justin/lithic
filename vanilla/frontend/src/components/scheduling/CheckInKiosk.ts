/**
 * Check-In Kiosk Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';

export class CheckInKiosk {
  private container: HTMLElement;
  private schedulingService: SchedulingService;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="check-in-kiosk">
        <div class="kiosk-header">
          <h1>Patient Check-In</h1>
        </div>

        <div class="search-patient">
          <h3>Find Your Appointment</h3>
          <div class="search-options">
            <div class="search-option">
              <label>Search by Name or Date of Birth</label>
              <input type="text" id="patientSearch" placeholder="Enter name or DOB">
              <button class="btn btn-primary" id="searchBtn">Search</button>
            </div>
            <div class="divider">OR</div>
            <div class="search-option">
              <label>Scan QR Code</label>
              <div class="qr-scanner" id="qrScanner">
                <div class="scanner-placeholder">QR Scanner</div>
              </div>
            </div>
          </div>
        </div>

        <div class="appointments-found" id="appointmentsFound" style="display: none;">
          <h3>Your Appointments Today</h3>
          <div id="appointmentsList"></div>
        </div>

        <div class="check-in-success" id="checkInSuccess" style="display: none;">
          <div class="success-icon">✓</div>
          <h2>Check-In Successful!</h2>
          <p>Please have a seat in the waiting area.</p>
          <p class="room-info" id="roomInfo"></p>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.getElementById('searchBtn')?.addEventListener('click', async () => {
      const query = (document.getElementById('patientSearch') as HTMLInputElement).value;
      await this.searchAppointments(query);
    });
  }

  private async searchAppointments(query: string): Promise<void> {
    try {
      const appointments = await this.schedulingService.searchTodayAppointments(query);
      this.displayAppointments(appointments);
    } catch (error) {
      console.error('Error searching appointments:', error);
    }
  }

  private displayAppointments(appointments: any[]): void {
    const foundSection = document.getElementById('appointmentsFound')!;
    const listContainer = document.getElementById('appointmentsList')!;

    if (appointments.length === 0) {
      listContainer.innerHTML = '<p>No appointments found for today.</p>';
      foundSection.style.display = 'block';
      return;
    }

    listContainer.innerHTML = appointments.map(apt => `
      <div class="appointment-option" data-id="${apt.id}">
        <div class="appointment-time">${new Date(apt.startTime).toLocaleTimeString()}</div>
        <div class="appointment-details">
          <div>${apt.providerName}</div>
          <div>${apt.appointmentType}</div>
        </div>
        <button class="btn btn-primary" onclick="this.checkIn('${apt.id}')">Check In</button>
      </div>
    `).join('');

    foundSection.style.display = 'block';
  }

  private async checkIn(appointmentId: string): Promise<void> {
    try {
      await this.schedulingService.checkIn(appointmentId);
      this.showSuccess();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please see the front desk.');
    }
  }

  private showSuccess(): void {
    document.getElementById('appointmentsFound')!.style.display = 'none';
    const successSection = document.getElementById('checkInSuccess')!;
    successSection.style.display = 'block';

    setTimeout(() => {
      this.render(); // Reset after 5 seconds
    }, 5000);
  }

  destroy(): void {}
}
