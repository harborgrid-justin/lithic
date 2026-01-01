/**
 * PatientList Component - Displays a list of patients
 */

import { Patient } from "../../types/Patient";

export class PatientList {
  private container: HTMLElement;
  private patients: Patient[] = [];
  private onPatientClick?: (patient: Patient) => void;

  constructor(
    containerId: string,
    onPatientClick?: (patient: Patient) => void,
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    this.onPatientClick = onPatientClick;
  }

  /**
   * Set patients data
   */
  public setPatients(patients: Patient[]): void {
    this.patients = patients;
    this.render();
  }

  /**
   * Render the patient list
   */
  private render(): void {
    if (this.patients.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>No patients found</p>
        </div>
      `;
      return;
    }

    const table = document.createElement("table");
    table.className = "patient-list-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>MRN</th>
          <th>Name</th>
          <th>DOB</th>
          <th>Gender</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${this.patients.map((patient) => this.renderPatientRow(patient)).join("")}
      </tbody>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(table);

    // Attach click handlers
    this.attachEventListeners();
  }

  /**
   * Render a single patient row
   */
  private renderPatientRow(patient: Patient): string {
    const dob = new Date(patient.dateOfBirth).toLocaleDateString();
    const statusClass = `status-${patient.status}`;

    return `
      <tr data-patient-id="${patient.id}">
        <td class="mrn">${patient.mrn}</td>
        <td class="name">${patient.firstName} ${patient.lastName}</td>
        <td class="dob">${dob}</td>
        <td class="gender">${patient.gender}</td>
        <td class="phone">${patient.contact.phone}</td>
        <td class="status ${statusClass}">${patient.status}</td>
        <td class="actions">
          <button class="btn-view" data-patient-id="${patient.id}">View</button>
          <button class="btn-edit" data-patient-id="${patient.id}">Edit</button>
        </td>
      </tr>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const viewButtons = this.container.querySelectorAll(".btn-view");
    viewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const patientId = target.getAttribute("data-patient-id");
        if (patientId && this.onPatientClick) {
          const patient = this.patients.find((p) => p.id === patientId);
          if (patient) {
            this.onPatientClick(patient);
          }
        }
      });
    });
  }

  /**
   * Clear the list
   */
  public clear(): void {
    this.patients = [];
    this.container.innerHTML = "";
  }
}
