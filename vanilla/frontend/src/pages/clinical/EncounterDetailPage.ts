// Encounter Detail Page - Vanilla TypeScript
import ClinicalService from "../../services/ClinicalService";
import VitalsPanel from "../../components/clinical/VitalsPanel";
import OrdersPanel from "../../components/clinical/OrdersPanel";
import ClinicalNote from "../../components/clinical/ClinicalNote";

export class EncounterDetailPage {
  private container: HTMLElement;
  private encounterId: string;
  private encounter: any = null;
  private vitalsPanel: VitalsPanel | null = null;
  private ordersPanel: OrdersPanel | null = null;

  constructor(containerId: string, encounterId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.encounterId = encounterId;
  }

  async init(): Promise<void> {
    await this.loadEncounter();
    await this.render();
  }

  private async loadEncounter(): Promise<void> {
    try {
      const summary = await ClinicalService.getEncounterSummary(
        this.encounterId,
      );
      this.encounter = summary.encounter;
    } catch (error) {
      console.error("Error loading encounter:", error);
      throw error;
    }
  }

  private async render(): Promise<void> {
    if (!this.encounter) {
      this.container.innerHTML =
        '<div class="error-message">Encounter not found</div>';
      return;
    }

    const encounterDate = new Date(
      this.encounter.encounterDate,
    ).toLocaleDateString();
    const startTime = new Date(this.encounter.startTime).toLocaleTimeString();

    this.container.innerHTML = `
      <div class="encounter-detail-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Encounter Details</h1>
          </div>
          <div class="header-actions">
            ${this.renderActionButtons()}
          </div>
        </header>

        <div class="encounter-summary">
          <div class="summary-card">
            <h3>Encounter Information</h3>
            <div class="info-grid">
              <div><strong>Type:</strong> ${this.encounter.encounterType}</div>
              <div><strong>Status:</strong> <span class="status-${this.encounter.status}">${this.encounter.status}</span></div>
              <div><strong>Date:</strong> ${encounterDate} ${startTime}</div>
              <div><strong>Department:</strong> ${this.encounter.department}</div>
              <div><strong>Chief Complaint:</strong> ${this.encounter.chiefComplaint}</div>
            </div>
          </div>
        </div>

        <div class="encounter-tabs">
          <div class="tab-buttons">
            <button class="tab-btn active" data-tab="vitals">Vitals</button>
            <button class="tab-btn" data-tab="notes">Notes</button>
            <button class="tab-btn" data-tab="orders">Orders</button>
            <button class="tab-btn" data-tab="diagnoses">Diagnoses</button>
          </div>

          <div class="tab-content">
            <div class="tab-panel active" data-panel="vitals">
              <div id="vitals-panel-container"></div>
            </div>

            <div class="tab-panel" data-panel="notes">
              <div id="notes-panel-container">
                <button class="btn btn-primary" id="new-note-btn">New Note</button>
                <div id="notes-list"></div>
              </div>
            </div>

            <div class="tab-panel" data-panel="orders">
              <div id="orders-panel-container"></div>
            </div>

            <div class="tab-panel" data-panel="diagnoses">
              <div id="diagnoses-panel-container">
                <h3>ICD-10 Diagnoses</h3>
                <div id="diagnoses-list"></div>
                <button class="btn btn-primary" id="add-diagnosis-btn">Add Diagnosis</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadEncounterData();
  }

  private renderActionButtons(): string {
    if (this.encounter.status === "scheduled") {
      return '<button class="btn btn-primary" id="start-encounter-btn">Start Encounter</button>';
    } else if (this.encounter.status === "in-progress") {
      return '<button class="btn btn-success" id="complete-encounter-btn">Complete Encounter</button>';
    } else if (
      this.encounter.status === "completed" &&
      !this.encounter.signedAt
    ) {
      return '<button class="btn btn-primary" id="sign-encounter-btn">Sign Encounter</button>';
    }
    return "";
  }

  private async loadEncounterData(): Promise<void> {
    try {
      const summary = await ClinicalService.getEncounterSummary(
        this.encounterId,
      );

      // Load vitals
      this.vitalsPanel = new VitalsPanel(
        "vitals-panel-container",
        async (data) => {
          await this.recordVitals(data);
        },
      );

      // Load orders
      this.ordersPanel = new OrdersPanel(
        "orders-panel-container",
        async (orderId) => {
          await this.signOrder(orderId);
        },
      );

      if (summary.orders) {
        this.ordersPanel.setOrders(summary.orders);
      }

      // Load notes
      if (summary.notes) {
        this.displayNotes(summary.notes);
      }

      // Load diagnoses
      if (this.encounter.icd10Codes) {
        this.displayDiagnoses(this.encounter.icd10Codes);
      }
    } catch (error) {
      console.error("Error loading encounter data:", error);
    }
  }

  private displayNotes(notes: any[]): void {
    const notesList = document.getElementById("notes-list");
    if (!notesList) return;

    if (notes.length === 0) {
      notesList.innerHTML = '<div class="empty-state">No notes recorded</div>';
      return;
    }

    notesList.innerHTML = notes
      .map(
        (note) => `
      <div class="note-item">
        <div class="note-header">
          <strong>${note.noteType}</strong>
          <span class="note-status status-${note.status}">${note.status}</span>
        </div>
        <div class="note-date">${new Date(note.createdAt).toLocaleString()}</div>
        <button class="btn btn-sm view-note-btn" data-note-id="${note.id}">View</button>
      </div>
    `,
      )
      .join("");
  }

  private displayDiagnoses(icd10Codes: string[]): void {
    const diagnosesList = document.getElementById("diagnoses-list");
    if (!diagnosesList) return;

    if (icd10Codes.length === 0) {
      diagnosesList.innerHTML =
        '<div class="empty-state">No diagnoses recorded</div>';
      return;
    }

    diagnosesList.innerHTML = icd10Codes
      .map(
        (code) => `
      <div class="diagnosis-item">
        <span class="diagnosis-code">${code}</span>
      </div>
    `,
      )
      .join("");
  }

  private async recordVitals(data: any): Promise<void> {
    try {
      data.encounterId = this.encounterId;
      data.patientId = this.encounter.patientId;

      await ClinicalService.recordVitals(data);
      alert("Vitals recorded successfully");
      this.vitalsPanel?.reset();
    } catch (error) {
      console.error("Error recording vitals:", error);
      alert("Failed to record vitals");
    }
  }

  private async signOrder(orderId: string): Promise<void> {
    const password = prompt("Enter password to sign order:");
    if (!password) return;

    try {
      await ClinicalService.signOrder(orderId, {
        userId: "current-user",
        password,
      });
      alert("Order signed successfully");
      await this.loadEncounterData();
    } catch (error) {
      console.error("Error signing order:", error);
      alert("Failed to sign order");
    }
  }

  private attachEventListeners(): void {
    // Tab switching
    const tabButtons = this.container.querySelectorAll(".tab-btn");
    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const tab = (e.target as HTMLElement).getAttribute("data-tab");
        this.switchTab(tab || "");
      });
    });

    // Action buttons
    const backBtn = document.getElementById("back-btn");
    backBtn?.addEventListener("click", () => {
      window.history.back();
    });

    const startBtn = document.getElementById("start-encounter-btn");
    startBtn?.addEventListener("click", async () => {
      await this.startEncounter();
    });

    const completeBtn = document.getElementById("complete-encounter-btn");
    completeBtn?.addEventListener("click", async () => {
      await this.completeEncounter();
    });

    const signBtn = document.getElementById("sign-encounter-btn");
    signBtn?.addEventListener("click", async () => {
      await this.signEncounter();
    });

    const newNoteBtn = document.getElementById("new-note-btn");
    newNoteBtn?.addEventListener("click", () => {
      window.location.href = `/clinical/notes/new?encounterId=${this.encounterId}`;
    });
  }

  private switchTab(tab: string): void {
    // Update active tab button
    const tabButtons = this.container.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      if (btn.getAttribute("data-tab") === tab) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update active tab panel
    const tabPanels = this.container.querySelectorAll(".tab-panel");
    tabPanels.forEach((panel) => {
      if (panel.getAttribute("data-panel") === tab) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });
  }

  private async startEncounter(): Promise<void> {
    try {
      await ClinicalService.startEncounter(this.encounterId);
      await this.loadEncounter();
      await this.render();
    } catch (error) {
      console.error("Error starting encounter:", error);
      alert("Failed to start encounter");
    }
  }

  private async completeEncounter(): Promise<void> {
    try {
      await ClinicalService.completeEncounter(this.encounterId);
      await this.loadEncounter();
      await this.render();
    } catch (error) {
      console.error("Error completing encounter:", error);
      alert("Failed to complete encounter");
    }
  }

  private async signEncounter(): Promise<void> {
    const password = prompt("Enter password to sign encounter:");
    if (!password) return;

    try {
      await ClinicalService.signEncounter(this.encounterId, {
        userId: "current-user",
        password,
      });
      await this.loadEncounter();
      await this.render();
    } catch (error) {
      console.error("Error signing encounter:", error);
      alert("Failed to sign encounter");
    }
  }

  destroy(): void {
    this.vitalsPanel?.destroy();
    this.ordersPanel?.destroy();
    this.container.innerHTML = "";
  }
}

export default EncounterDetailPage;
