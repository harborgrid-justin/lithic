/**
 * PatientCard Component - Displays patient summary card
 */

import { Patient } from '../../types/Patient';

export class PatientCard {
  private container: HTMLElement;
  private patient: Patient | null = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
  }

  /**
   * Set patient data
   */
  public setPatient(patient: Patient): void {
    this.patient = patient;
    this.render();
  }

  /**
   * Render the patient card
   */
  private render(): void {
    if (!this.patient) {
      this.container.innerHTML = '<div class="no-patient">No patient selected</div>';
      return;
    }

    const dob = new Date(this.patient.dateOfBirth).toLocaleDateString();
    const age = this.calculateAge(new Date(this.patient.dateOfBirth));

    this.container.innerHTML = `
      <div class="patient-card">
        <div class="patient-header">
          <div class="patient-avatar">
            ${this.getInitials(this.patient.firstName, this.patient.lastName)}
          </div>
          <div class="patient-info">
            <h2>${this.patient.firstName} ${this.patient.lastName}</h2>
            <p class="mrn">MRN: ${this.patient.mrn}</p>
            <span class="status-badge status-${this.patient.status}">${this.patient.status}</span>
          </div>
        </div>

        <div class="patient-details">
          <div class="detail-row">
            <span class="label">Date of Birth:</span>
            <span class="value">${dob} (${age} years old)</span>
          </div>
          <div class="detail-row">
            <span class="label">Gender:</span>
            <span class="value">${this.patient.gender}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone:</span>
            <span class="value">${this.patient.contact.phone}</span>
          </div>
          ${this.patient.contact.email ? `
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${this.patient.contact.email}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span class="label">Address:</span>
            <span class="value">
              ${this.patient.address.street}<br>
              ${this.patient.address.city}, ${this.patient.address.state} ${this.patient.address.zipCode}
            </span>
          </div>
          ${this.patient.bloodType ? `
            <div class="detail-row">
              <span class="label">Blood Type:</span>
              <span class="value">${this.patient.bloodType}</span>
            </div>
          ` : ''}
        </div>

        ${this.patient.allergies && this.patient.allergies.length > 0 ? `
          <div class="patient-alerts">
            <h3>Allergies</h3>
            <div class="alert-badges">
              ${this.patient.allergies.map(allergy => `
                <span class="alert-badge">${allergy}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="patient-actions">
          <button class="btn-primary" onclick="window.location.href='/patients/${this.patient.id}/edit'">
            Edit Patient
          </button>
          <button class="btn-secondary" onclick="window.location.href='/patients/${this.patient.id}/demographics'">
            Demographics
          </button>
          <button class="btn-secondary" onclick="window.location.href='/patients/${this.patient.id}/insurance'">
            Insurance
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get initials from name
   */
  private getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Clear the card
   */
  public clear(): void {
    this.patient = null;
    this.container.innerHTML = '';
  }
}
