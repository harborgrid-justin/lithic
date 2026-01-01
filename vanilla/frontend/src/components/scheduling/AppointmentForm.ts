/**
 * Appointment Form Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class AppointmentForm {
  private container: HTMLElement;
  private onSubmit: (data: any) => Promise<void>;

  constructor(
    container: HTMLElement,
    options: { onSubmit: (data: any) => Promise<void> },
  ) {
    this.container = container;
    this.onSubmit = options.onSubmit;
  }

  async render(): Promise<void> {
    this.container.innerHTML = `
      <form class="appointment-form" id="appointmentForm">
        <div class="form-section">
          <h3>Patient Information</h3>
          <div class="form-group">
            <label for="patientId">Patient *</label>
            <input type="text" id="patientId" name="patientId" required>
          </div>
        </div>

        <div class="form-section">
          <h3>Appointment Details</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="providerId">Provider *</label>
              <select id="providerId" name="providerId" required>
                <option value="">Select Provider</option>
              </select>
            </div>
            <div class="form-group">
              <label for="appointmentType">Type *</label>
              <select id="appointmentType" name="appointmentType" required>
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="procedure">Procedure</option>
                <option value="lab">Lab Work</option>
                <option value="imaging">Imaging</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Date *</label>
              <input type="date" id="startDate" name="startDate" required>
            </div>
            <div class="form-group">
              <label for="startTime">Time *</label>
              <input type="time" id="startTime" name="startTime" required>
            </div>
            <div class="form-group">
              <label for="duration">Duration (min) *</label>
              <input type="number" id="duration" name="duration" value="30" min="15" step="15" required>
            </div>
          </div>

          <div class="form-group">
            <label for="reason">Reason for Visit *</label>
            <textarea id="reason" name="reason" rows="3" required></textarea>
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="3"></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3>Location</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="facilityId">Facility *</label>
              <select id="facilityId" name="facilityId" required>
                <option value="">Select Facility</option>
              </select>
            </div>
            <div class="form-group">
              <label for="roomNumber">Room</label>
              <input type="text" id="roomNumber" name="roomNumber">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Additional Options</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="telehealth" name="telehealth">
              Telehealth Appointment
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="sendReminder" name="sendReminder" checked>
              Send Appointment Reminder
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Appointment</button>
        </div>
      </form>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = document.getElementById("appointmentForm") as HTMLFormElement;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  private async handleSubmit(): Promise<void> {
    const form = document.getElementById("appointmentForm") as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Combine date and time
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    data.startTime = startDateTime.toISOString();
    delete data.startDate;

    await this.onSubmit(data);
  }

  destroy(): void {}
}
