export class ImagingOrderForm {
  private onSubmit?: (data: any) => Promise<void>;

  constructor() {}

  async render(container: HTMLElement, onSubmit: (data: any) => Promise<void>) {
    this.onSubmit = onSubmit;

    container.innerHTML = `
      <form class="imaging-order-form" id="order-form">
        <div class="form-section">
          <h3>Patient Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="patient-id">Patient ID *</label>
              <input type="text" id="patient-id" name="patientId" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="patient-search">Search Patient</label>
              <button type="button" class="btn btn-secondary" data-action="search-patient">Search</button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Procedure Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="modality">Modality *</label>
              <select id="modality" name="modality" class="form-select" required>
                <option value="">Select Modality</option>
                <option value="CT">CT</option>
                <option value="MRI">MRI</option>
                <option value="XRAY">X-Ray</option>
                <option value="US">Ultrasound</option>
                <option value="NM">Nuclear Medicine</option>
                <option value="PET">PET</option>
                <option value="MAMMO">Mammography</option>
                <option value="FLUORO">Fluoroscopy</option>
              </select>
            </div>

            <div class="form-group">
              <label for="procedure-code">Procedure Code *</label>
              <input type="text" id="procedure-code" name="procedureCode" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="body-part">Body Part *</label>
              <input type="text" id="body-part" name="bodyPart" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="laterality">Laterality</label>
              <select id="laterality" name="laterality" class="form-select">
                <option value="NA">N/A</option>
                <option value="LEFT">Left</option>
                <option value="RIGHT">Right</option>
                <option value="BILATERAL">Bilateral</option>
                <option value="UNILATERAL">Unilateral</option>
              </select>
            </div>

            <div class="form-group">
              <label for="contrast">Contrast</label>
              <input type="checkbox" id="contrast" name="contrast">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Order Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="priority">Priority *</label>
              <select id="priority" name="priority" class="form-select" required>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
                <option value="ASAP">ASAP</option>
              </select>
            </div>

            <div class="form-group">
              <label for="ordering-provider">Ordering Provider ID *</label>
              <input type="text" id="ordering-provider" name="orderingProviderId" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="scheduled-datetime">Scheduled Date/Time</label>
              <input type="datetime-local" id="scheduled-datetime" name="scheduledDateTime" class="form-input">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Clinical Information</h3>
          <div class="form-group">
            <label for="clinical-indication">Clinical Indication *</label>
            <textarea id="clinical-indication" name="clinicalIndication" class="form-textarea" rows="4" required></textarea>
          </div>

          <div class="form-group">
            <label for="special-instructions">Special Instructions</label>
            <textarea id="special-instructions" name="specialInstructions" class="form-textarea" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label for="icd-codes">ICD Codes (comma separated)</label>
            <input type="text" id="icd-codes" name="icdCodes" class="form-input" placeholder="e.g., Z00.00, Z01.01">
          </div>
        </div>

        <div class="form-section">
          <h3>Additional Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="transport-required">Transport Required</label>
              <input type="checkbox" id="transport-required" name="transportRequired">
            </div>

            <div class="form-group">
              <label for="isolation-precautions">Isolation Precautions</label>
              <input type="text" id="isolation-precautions" name="isolationPrecautions" class="form-input">
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Order</button>
        </div>
      </form>
    `;

    this.attachEventListeners(container);
  }

  private attachEventListeners(container: HTMLElement) {
    const form = container.querySelector("#order-form") as HTMLFormElement;

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit(form);
    });

    const cancelBtn = container.querySelector('[data-action="cancel"]');
    cancelBtn?.addEventListener("click", () => {
      window.location.href = "#/imaging/orders";
    });

    const searchPatientBtn = container.querySelector(
      '[data-action="search-patient"]',
    );
    searchPatientBtn?.addEventListener("click", () => {
      // TODO: Implement patient search dialog
      alert("Patient search dialog");
    });
  }

  private async handleSubmit(form: HTMLFormElement) {
    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      if (key === "icdCodes") {
        data[key] = value
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      } else if (key === "contrast" || key === "transportRequired") {
        data[key] = formData.get(key) === "on";
      } else {
        data[key] = value;
      }
    });

    if (this.onSubmit) {
      await this.onSubmit(data);
    }
  }
}
