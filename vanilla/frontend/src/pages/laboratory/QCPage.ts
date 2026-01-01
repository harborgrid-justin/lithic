/**
 * Quality Control Page
 * Manage and monitor laboratory quality control
 */

import { labService } from "../../services/LaboratoryService";

export class QCPage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="qc-page">
        <div class="page-header">
          <h1>Quality Control</h1>
          <button type="button" class="btn btn-primary" id="recordQCBtn">Record QC</button>
        </div>

        <div class="qc-stats">
          <div class="stat-card">
            <div class="stat-value" id="todayQCCount">-</div>
            <div class="stat-label">QC Tests Today</div>
          </div>

          <div class="stat-card">
            <div class="stat-value" id="passedCount">-</div>
            <div class="stat-label">Passed</div>
          </div>

          <div class="stat-card">
            <div class="stat-value" id="failedCount">-</div>
            <div class="stat-label">Failed</div>
          </div>

          <div class="stat-card">
            <div class="stat-value" id="passRate">-%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
        </div>

        <div class="qc-content">
          <div class="qc-filters">
            <div class="filter-group">
              <label for="testFilter">Test Code</label>
              <input type="text" id="testFilter" placeholder="Enter test code...">
            </div>

            <div class="filter-group">
              <label for="dateFromFilter">Date From</label>
              <input type="date" id="dateFromFilter">
            </div>

            <div class="filter-group">
              <label for="dateToFilter">Date To</label>
              <input type="date" id="dateToFilter">
            </div>

            <button type="button" class="btn btn-primary" id="searchBtn">Search</button>
            <button type="button" class="btn btn-secondary" id="clearBtn">Clear</button>
          </div>

          <div id="qcRecordsContainer"></div>

          <div id="qcFormModal" class="modal" style="display: none;">
            <div class="modal-content">
              <div class="modal-header">
                <h2>Record QC</h2>
                <button type="button" class="close-btn" id="closeModalBtn">&times;</button>
              </div>
              <div class="modal-body">
                <form id="qcForm">
                  <div class="form-group">
                    <label for="qcTestCode">Test Code*</label>
                    <input type="text" id="qcTestCode" required>
                  </div>

                  <div class="form-group">
                    <label for="qcTestName">Test Name*</label>
                    <input type="text" id="qcTestName" required>
                  </div>

                  <div class="form-group">
                    <label for="qcControlLevel">Control Level*</label>
                    <select id="qcControlLevel" required>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="qcLotNumber">Lot Number*</label>
                    <input type="text" id="qcLotNumber" required>
                  </div>

                  <div class="form-group">
                    <label for="qcExpirationDate">Expiration Date*</label>
                    <input type="date" id="qcExpirationDate" required>
                  </div>

                  <div class="form-group">
                    <label for="qcExpectedValue">Expected Value*</label>
                    <input type="number" step="0.01" id="qcExpectedValue" required>
                  </div>

                  <div class="form-group">
                    <label for="qcMeasuredValue">Measured Value*</label>
                    <input type="number" step="0.01" id="qcMeasuredValue" required>
                  </div>

                  <div class="form-group">
                    <label for="qcUnit">Unit*</label>
                    <input type="text" id="qcUnit" required>
                  </div>

                  <div class="form-group">
                    <label for="qcRangeMin">Acceptable Range Min*</label>
                    <input type="number" step="0.01" id="qcRangeMin" required>
                  </div>

                  <div class="form-group">
                    <label for="qcRangeMax">Acceptable Range Max*</label>
                    <input type="number" step="0.01" id="qcRangeMax" required>
                  </div>

                  <div class="form-group">
                    <label for="qcPerformedBy">Performed By*</label>
                    <input type="text" id="qcPerformedBy" required>
                  </div>

                  <div class="form-group">
                    <label for="qcInstrument">Instrument</label>
                    <input type="text" id="qcInstrument">
                  </div>

                  <div class="form-group full-width">
                    <label for="qcComments">Comments</label>
                    <textarea id="qcComments" rows="3"></textarea>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">Record QC</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadQCRecords();
    this.attachEventListeners();
  }

  private async loadQCRecords(
    testCode?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<void> {
    try {
      const records = await labService.getQCRecords(testCode, dateFrom, dateTo);

      const recordsContainer = this.container.querySelector(
        "#qcRecordsContainer",
      );
      if (recordsContainer) {
        recordsContainer.innerHTML =
          records.length > 0
            ? this.renderQCTable(records)
            : "<p>No QC records found</p>";
      }

      this.updateStats(records);
    } catch (error) {
      console.error("Error loading QC records:", error);
    }
  }

  private renderQCTable(records: any[]): string {
    return `
      <table class="qc-table">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Test</th>
            <th>Level</th>
            <th>Lot</th>
            <th>Expected</th>
            <th>Measured</th>
            <th>Acceptable Range</th>
            <th>Result</th>
            <th>Performed By</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => this.renderQCRow(record)).join("")}
        </tbody>
      </table>
    `;
  }

  private renderQCRow(record: any): string {
    const resultClass = record.passed ? "qc-passed" : "qc-failed";
    const resultText = record.passed ? "PASS" : "FAIL";

    return `
      <tr class="${resultClass}">
        <td>${this.formatDateTime(record.performedDateTime)}</td>
        <td>
          <strong>${record.testName}</strong><br>
          <small>${record.testCode}</small>
        </td>
        <td>${this.formatControlLevel(record.controlLevel)}</td>
        <td>${record.lotNumber}</td>
        <td>${record.expectedValue} ${record.unit}</td>
        <td>${record.measuredValue} ${record.unit}</td>
        <td>${record.acceptableRange.min} - ${record.acceptableRange.max}</td>
        <td>
          <span class="qc-result-badge ${resultClass}">${resultText}</span>
        </td>
        <td>${record.performedBy}</td>
      </tr>
    `;
  }

  private updateStats(records: any[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = records.filter(
      (r) => new Date(r.performedDateTime) >= today,
    );
    const passed = todayRecords.filter((r) => r.passed).length;
    const failed = todayRecords.filter((r) => !r.passed).length;
    const passRate =
      todayRecords.length > 0
        ? Math.round((passed / todayRecords.length) * 100)
        : 0;

    this.updateStat("todayQCCount", todayRecords.length);
    this.updateStat("passedCount", passed);
    this.updateStat("failedCount", failed);
    this.updateStat("passRate", passRate + "%");
  }

  private updateStat(elementId: string, value: string | number): void {
    const element = this.container.querySelector(`#${elementId}`);
    if (element) {
      element.textContent = value.toString();
    }
  }

  private formatControlLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private showQCForm(): void {
    const modal = this.container.querySelector("#qcFormModal") as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  private hideQCForm(): void {
    const modal = this.container.querySelector("#qcFormModal") as HTMLElement;
    if (modal) {
      modal.style.display = "none";
    }

    const form = this.container.querySelector("#qcForm") as HTMLFormElement;
    if (form) {
      form.reset();
    }
  }

  private async handleQCSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const qcData = {
      testCode: formData.get("qcTestCode") as string,
      testName: formData.get("qcTestName") as string,
      controlLevel: formData.get("qcControlLevel") as "low" | "normal" | "high",
      lotNumber: formData.get("qcLotNumber") as string,
      expirationDate: new Date(formData.get("qcExpirationDate") as string),
      expectedValue: parseFloat(formData.get("qcExpectedValue") as string),
      measuredValue: parseFloat(formData.get("qcMeasuredValue") as string),
      unit: formData.get("qcUnit") as string,
      acceptableRange: {
        min: parseFloat(formData.get("qcRangeMin") as string),
        max: parseFloat(formData.get("qcRangeMax") as string),
      },
      performedBy: formData.get("qcPerformedBy") as string,
      instrument: formData.get("qcInstrument") as string,
      comments: formData.get("qcComments") as string,
      performedDateTime: new Date(),
    };

    try {
      await labService.recordQC(qcData);
      alert("QC record saved successfully!");
      this.hideQCForm();
      this.loadQCRecords();
    } catch (error: any) {
      console.error("Error recording QC:", error);
      alert("Error recording QC: " + error.message);
    }
  }

  private attachEventListeners(): void {
    const recordQCBtn = this.container.querySelector("#recordQCBtn");
    const closeModalBtn = this.container.querySelector("#closeModalBtn");
    const cancelFormBtn = this.container.querySelector("#cancelFormBtn");
    const qcForm = this.container.querySelector("#qcForm");
    const searchBtn = this.container.querySelector("#searchBtn");
    const clearBtn = this.container.querySelector("#clearBtn");

    if (recordQCBtn) {
      recordQCBtn.addEventListener("click", () => this.showQCForm());
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => this.hideQCForm());
    }

    if (cancelFormBtn) {
      cancelFormBtn.addEventListener("click", () => this.hideQCForm());
    }

    if (qcForm) {
      qcForm.addEventListener("submit", (e) => this.handleQCSubmit(e));
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const testCode = (
          this.container.querySelector("#testFilter") as HTMLInputElement
        )?.value;
        const dateFrom = (
          this.container.querySelector("#dateFromFilter") as HTMLInputElement
        )?.value;
        const dateTo = (
          this.container.querySelector("#dateToFilter") as HTMLInputElement
        )?.value;

        this.loadQCRecords(
          testCode || undefined,
          dateFrom ? new Date(dateFrom) : undefined,
          dateTo ? new Date(dateTo) : undefined,
        );
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        (
          this.container.querySelector("#testFilter") as HTMLInputElement
        ).value = "";
        (
          this.container.querySelector("#dateFromFilter") as HTMLInputElement
        ).value = "";
        (
          this.container.querySelector("#dateToFilter") as HTMLInputElement
        ).value = "";
        this.loadQCRecords();
      });
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
