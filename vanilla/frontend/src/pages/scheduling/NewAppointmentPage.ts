/**
 * New Appointment Page
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

import { SchedulingService } from '../../services/SchedulingService';
import { AppointmentForm } from '../../components/scheduling/AppointmentForm';
import { TimeSlotPicker } from '../../components/scheduling/TimeSlotPicker';

export class NewAppointmentPage {
  private container: HTMLElement;
  private schedulingService: SchedulingService;
  private appointmentForm: AppointmentForm | null = null;
  private timeSlotPicker: TimeSlotPicker | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.schedulingService = new SchedulingService();
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="new-appointment-page">
        <div class="page-header">
          <h1>New Appointment</h1>
          <button class="btn btn-secondary" onclick="history.back()">Cancel</button>
        </div>

        <div class="appointment-form-container" id="formContainer"></div>
      </div>
    `;

    const formContainer = document.getElementById('formContainer')!;
    this.appointmentForm = new AppointmentForm(formContainer, {
      onSubmit: async (data) => {
        try {
          await this.schedulingService.createAppointment(data);
          window.location.hash = '/scheduling/appointments';
        } catch (error) {
          console.error('Error creating appointment:', error);
          alert('Failed to create appointment. Please try again.');
        }
      }
    });

    await this.appointmentForm.render();
  }

  destroy(): void {
    this.appointmentForm?.destroy();
  }
}
