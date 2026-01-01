// Vitals Page - Vanilla TypeScript
import ClinicalService from "../../services/ClinicalService";
import VitalsPanel from "../../components/clinical/VitalsPanel";
import VitalsChart from "../../components/clinical/VitalsChart";

export class VitalsPage {
  private container: HTMLElement;
  private patientId: string;
  private encounterId?: string;
  private vitalsPanel: VitalsPanel | null = null;
  private vitalsChart: VitalsChart | null = null;

  constructor(containerId: string, patientId: string, encounterId?: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.patientId = patientId;
    this.encounterId = encounterId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadVitals();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="vitals-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Vital Signs</h1>
          </div>
        </header>

        <div class="vitals-content">
          <div class="vitals-input-section">
            <h2>Record New Vitals</h2>
            <div id="vitals-panel-container"></div>
          </div>

          <div class="vitals-history-section">
            <h2>Vitals History</h2>
            <div id="vitals-chart-container"></div>
            <div id="vitals-table-container"></div>
          </div>
        </div>
      </div>
    `;

    this.vitalsPanel = new VitalsPanel(
      "vitals-panel-container",
      async (data) => {
        await this.recordVitals(data);
      },
    );

    this.vitalsChart = new VitalsChart("vitals-chart-container");

    this.attachEventListeners();
  }

  private async loadVitals(): Promise<void> {
    try {
      const vitals = await ClinicalService.getVitalsByPatient(
        this.patientId,
        20,
      );

      if (vitals.length > 0) {
        this.vitalsChart?.setVitals(vitals);
        this.displayVitalsTable(vitals);
      }
    } catch (error) {
      console.error("Error loading vitals:", error);
    }
  }

  private displayVitalsTable(vitals: any[]): void {
    const tableContainer = document.getElementById("vitals-table-container");
    if (!tableContainer) return;

    if (vitals.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">No vital signs recorded</div>';
      return;
    }

    const tableHTML = `
      <table class="vitals-table">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Temp</th>
            <th>Pulse</th>
            <th>Resp</th>
            <th>BP</th>
            <th>O2 Sat</th>
            <th>Weight</th>
            <th>BMI</th>
            <th>Pain</th>
          </tr>
        </thead>
        <tbody>
          ${vitals.map((vital) => this.renderVitalRow(vital)).join("")}
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = tableHTML;
  }

  private renderVitalRow(vital: any): string {
    const date = new Date(vital.recordedAt).toLocaleString();

    return `
      <tr>
        <td>${date}</td>
        <td>${vital.temperature ? `${vital.temperature}°${vital.temperatureUnit}` : "-"}</td>
        <td>${vital.pulse || "-"}</td>
        <td>${vital.respiratoryRate || "-"}</td>
        <td>${
          vital.bloodPressureSystolic && vital.bloodPressureDiastolic
            ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
            : "-"
        }</td>
        <td>${vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "-"}</td>
        <td>${vital.weight ? `${vital.weight} ${vital.weightUnit}` : "-"}</td>
        <td>${vital.bmi || "-"}</td>
        <td>${vital.painLevel !== undefined ? `${vital.painLevel}/10` : "-"}</td>
      </tr>
    `;
  }

  private async recordVitals(data: any): Promise<void> {
    try {
      data.patientId = this.patientId;
      if (this.encounterId) {
        data.encounterId = this.encounterId;
      }

      await ClinicalService.recordVitals(data);
      alert("Vitals recorded successfully");
      this.vitalsPanel?.reset();
      await this.loadVitals();
    } catch (error) {
      console.error("Error recording vitals:", error);
      alert("Failed to record vitals");
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById("back-btn");
    backBtn?.addEventListener("click", () => {
      window.history.back();
    });
  }

  destroy(): void {
    this.vitalsPanel?.destroy();
    this.vitalsChart?.destroy();
    this.container.innerHTML = "";
  }
}

export default VitalsPage;
