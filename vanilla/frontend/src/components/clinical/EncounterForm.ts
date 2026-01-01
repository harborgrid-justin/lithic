// Encounter Form Component - Vanilla TypeScript
export class EncounterForm {
  private container: HTMLElement;
  private onSubmit?: (data: any) => void;

  constructor(containerId: string, onSubmit?: (data: any) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onSubmit = onSubmit;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <form id="encounter-form" class="clinical-form">
        <div class="form-section">
          <h3>Encounter Information</h3>

          <div class="form-group">
            <label for="patientId">Patient ID *</label>
            <input type="text" id="patientId" name="patientId" required>
          </div>

          <div class="form-group">
            <label for="providerId">Provider ID *</label>
            <input type="text" id="providerId" name="providerId" required>
          </div>

          <div class="form-group">
            <label for="facilityId">Facility ID *</label>
            <input type="text" id="facilityId" name="facilityId" required>
          </div>

          <div class="form-group">
            <label for="encounterType">Encounter Type *</label>
            <select id="encounterType" name="encounterType" required>
              <option value="">Select type...</option>
              <option value="inpatient">Inpatient</option>
              <option value="outpatient">Outpatient</option>
              <option value="emergency">Emergency</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </div>

          <div class="form-group">
            <label for="department">Department *</label>
            <input type="text" id="department" name="department" required>
          </div>

          <div class="form-group">
            <label for="appointmentType">Appointment Type *</label>
            <input type="text" id="appointmentType" name="appointmentType" required>
          </div>

          <div class="form-group">
            <label for="encounterDate">Encounter Date *</label>
            <input type="date" id="encounterDate" name="encounterDate" required>
          </div>

          <div class="form-group">
            <label for="startTime">Start Time *</label>
            <input type="time" id="startTime" name="startTime" required>
          </div>

          <div class="form-group">
            <label for="chiefComplaint">Chief Complaint *</label>
            <textarea id="chiefComplaint" name="chiefComplaint" rows="4" required></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create Encounter</button>
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        </div>
      </form>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#encounter-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(form);
    });

    const cancelBtn = this.container.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      form?.reset();
    });
  }

  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Combine date and time for startTime
    const date = data.encounterDate;
    const time = data.startTime;
    data.startTime = `${date}T${time}:00`;

    if (this.onSubmit) {
      this.onSubmit(data);
    }
  }

  reset(): void {
    const form = this.container.querySelector('#encounter-form') as HTMLFormElement;
    form?.reset();
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default EncounterForm;
