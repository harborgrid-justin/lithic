/**
 * PatientForm Component - Form for creating/editing patients
 */

import { Patient } from '../../types/Patient';
import PatientService from '../../services/PatientService';

export class PatientForm {
  private container: HTMLElement;
  private patient: Patient | null = null;
  private onSubmit?: (patient: Patient) => void;
  private onCancel?: () => void;

  constructor(
    containerId: string,
    onSubmit?: (patient: Patient) => void,
    onCancel?: () => void
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  /**
   * Set patient data for editing
   */
  public setPatient(patient: Patient): void {
    this.patient = patient;
    this.render();
    this.populateForm();
  }

  /**
   * Render the form
   */
  public render(): void {
    const isEdit = !!this.patient;

    this.container.innerHTML = `
      <form class="patient-form" id="patientForm">
        <h2>${isEdit ? 'Edit Patient' : 'New Patient'}</h2>

        <div class="form-section">
          <h3>Personal Information</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input type="text" id="firstName" name="firstName" required>
            </div>

            <div class="form-group">
              <label for="middleName">Middle Name</label>
              <input type="text" id="middleName" name="middleName">
            </div>

            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input type="text" id="lastName" name="lastName" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dateOfBirth">Date of Birth *</label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" required>
            </div>

            <div class="form-group">
              <label for="gender">Gender *</label>
              <select id="gender" name="gender" required>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div class="form-group">
              <label for="bloodType">Blood Type</label>
              <select id="bloodType" name="bloodType">
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="maritalStatus">Marital Status</label>
              <select id="maritalStatus" name="maritalStatus">
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="preferredLanguage">Preferred Language</label>
              <input type="text" id="preferredLanguage" name="preferredLanguage">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Contact Information</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone *</label>
              <input type="tel" id="phone" name="phone" required>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email">
            </div>
          </div>

          <div class="form-group">
            <label for="street">Street Address *</label>
            <input type="text" id="street" name="street" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">City *</label>
              <input type="text" id="city" name="city" required>
            </div>

            <div class="form-group">
              <label for="state">State *</label>
              <input type="text" id="state" name="state" required>
            </div>

            <div class="form-group">
              <label for="zipCode">ZIP Code *</label>
              <input type="text" id="zipCode" name="zipCode" required>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Emergency Contact</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="emergencyName">Contact Name</label>
              <input type="text" id="emergencyName" name="emergencyName">
            </div>

            <div class="form-group">
              <label for="emergencyRelationship">Relationship</label>
              <input type="text" id="emergencyRelationship" name="emergencyRelationship">
            </div>

            <div class="form-group">
              <label for="emergencyPhone">Contact Phone</label>
              <input type="tel" id="emergencyPhone" name="emergencyPhone">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Clinical Information</h3>

          <div class="form-group">
            <label for="allergies">Allergies (comma-separated)</label>
            <input type="text" id="allergies" name="allergies" placeholder="e.g., Penicillin, Latex">
          </div>

          <div class="form-group">
            <label for="medications">Current Medications (comma-separated)</label>
            <input type="text" id="medications" name="medications" placeholder="e.g., Aspirin, Lisinopril">
          </div>

          <div class="form-group">
            <label for="conditions">Medical Conditions (comma-separated)</label>
            <input type="text" id="conditions" name="conditions" placeholder="e.g., Diabetes, Hypertension">
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary">
            ${isEdit ? 'Update Patient' : 'Create Patient'}
          </button>
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
        </div>

        <div class="form-message" id="formMessage"></div>
      </form>
    `;

    this.attachEventListeners();
  }

  /**
   * Populate form with patient data
   */
  private populateForm(): void {
    if (!this.patient) return;

    const form = this.container.querySelector('form') as HTMLFormElement;
    if (!form) return;

    // Personal info
    (form.elements.namedItem('firstName') as HTMLInputElement).value = this.patient.firstName;
    (form.elements.namedItem('middleName') as HTMLInputElement).value = this.patient.middleName || '';
    (form.elements.namedItem('lastName') as HTMLInputElement).value = this.patient.lastName;
    (form.elements.namedItem('dateOfBirth') as HTMLInputElement).value =
      new Date(this.patient.dateOfBirth).toISOString().split('T')[0];
    (form.elements.namedItem('gender') as HTMLSelectElement).value = this.patient.gender;
    (form.elements.namedItem('bloodType') as HTMLSelectElement).value = this.patient.bloodType || '';
    (form.elements.namedItem('maritalStatus') as HTMLSelectElement).value = this.patient.maritalStatus || '';
    (form.elements.namedItem('preferredLanguage') as HTMLInputElement).value = this.patient.preferredLanguage || '';

    // Contact info
    (form.elements.namedItem('phone') as HTMLInputElement).value = this.patient.contact.phone;
    (form.elements.namedItem('email') as HTMLInputElement).value = this.patient.contact.email || '';
    (form.elements.namedItem('street') as HTMLInputElement).value = this.patient.address.street;
    (form.elements.namedItem('city') as HTMLInputElement).value = this.patient.address.city;
    (form.elements.namedItem('state') as HTMLInputElement).value = this.patient.address.state;
    (form.elements.namedItem('zipCode') as HTMLInputElement).value = this.patient.address.zipCode;

    // Emergency contact
    if (this.patient.contact.emergencyContact) {
      (form.elements.namedItem('emergencyName') as HTMLInputElement).value =
        this.patient.contact.emergencyContact.name;
      (form.elements.namedItem('emergencyRelationship') as HTMLInputElement).value =
        this.patient.contact.emergencyContact.relationship;
      (form.elements.namedItem('emergencyPhone') as HTMLInputElement).value =
        this.patient.contact.emergencyContact.phone;
    }

    // Clinical info
    (form.elements.namedItem('allergies') as HTMLInputElement).value =
      this.patient.allergies?.join(', ') || '';
    (form.elements.namedItem('medications') as HTMLInputElement).value =
      this.patient.medications?.join(', ') || '';
    (form.elements.namedItem('conditions') as HTMLInputElement).value =
      this.patient.conditions?.join(', ') || '';
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const form = this.container.querySelector('form') as HTMLFormElement;
    const cancelBtn = this.container.querySelector('#cancelBtn') as HTMLButtonElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    cancelBtn.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
    });
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(): Promise<void> {
    const form = this.container.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    const messageEl = this.container.querySelector('#formMessage') as HTMLElement;

    try {
      const patientData: any = {
        firstName: formData.get('firstName'),
        middleName: formData.get('middleName'),
        lastName: formData.get('lastName'),
        dateOfBirth: new Date(formData.get('dateOfBirth') as string),
        gender: formData.get('gender'),
        bloodType: formData.get('bloodType') || undefined,
        maritalStatus: formData.get('maritalStatus') || undefined,
        preferredLanguage: formData.get('preferredLanguage') || undefined,
        contact: {
          phone: formData.get('phone'),
          email: formData.get('email') || undefined,
          emergencyContact: undefined,
        },
        address: {
          street: formData.get('street'),
          city: formData.get('city'),
          state: formData.get('state'),
          zipCode: formData.get('zipCode'),
          country: 'USA',
        },
        allergies: this.parseCommaSeparated(formData.get('allergies') as string),
        medications: this.parseCommaSeparated(formData.get('medications') as string),
        conditions: this.parseCommaSeparated(formData.get('conditions') as string),
        insurance: this.patient?.insurance || [],
      };

      // Emergency contact
      if (formData.get('emergencyName')) {
        patientData.contact.emergencyContact = {
          name: formData.get('emergencyName'),
          relationship: formData.get('emergencyRelationship'),
          phone: formData.get('emergencyPhone'),
        };
      }

      let response;
      if (this.patient) {
        response = await PatientService.updatePatient(this.patient.id, patientData);
      } else {
        response = await PatientService.createPatient(patientData);
      }

      if (response.success && response.data) {
        messageEl.className = 'form-message success';
        messageEl.textContent = response.message || 'Patient saved successfully';

        if (this.onSubmit) {
          this.onSubmit(response.data);
        }
      } else {
        throw new Error(response.error || 'Failed to save patient');
      }
    } catch (error) {
      messageEl.className = 'form-message error';
      messageEl.textContent = error instanceof Error ? error.message : 'An error occurred';
    }
  }

  /**
   * Parse comma-separated string into array
   */
  private parseCommaSeparated(value: string | null): string[] | undefined {
    if (!value) return undefined;
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Clear the form
   */
  public clear(): void {
    this.patient = null;
    this.container.innerHTML = '';
  }
}
