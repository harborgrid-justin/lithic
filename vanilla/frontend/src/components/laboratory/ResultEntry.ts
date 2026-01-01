/**
 * Result Entry Component
 * Form for entering laboratory test results
 */

export class ResultEntry {
  private container: HTMLElement;
  private onSubmit?: (resultData: any) => void;
  private test: any;

  constructor(
    container: HTMLElement,
    options: { onSubmit?: (resultData: any) => void } = {},
  ) {
    this.container = container;
    this.onSubmit = options.onSubmit;
  }

  setTest(test: any): void {
    this.test = test;
    this.render();
  }

  private render(): void {
    if (!this.test) {
      this.container.innerHTML = "<p>No test selected</p>";
      return;
    }

    const html = `
      <div class="result-entry">
        <div class="test-header">
          <h3>${this.test.testName}</h3>
          <span class="test-code">LOINC: ${this.test.loincCode}</span>
        </div>

        <form id="resultEntryForm">
          <div class="form-group">
            <label for="value">Result Value*</label>
            <input type="text" id="value" name="value" required>
          </div>

          <div class="form-group">
            <label for="unit">Unit</label>
            <input type="text" id="unit" name="unit">
          </div>

          <div class="form-group">
            <label for="valueType">Value Type*</label>
            <select id="valueType" name="valueType" required>
              <option value="numeric">Numeric</option>
              <option value="text">Text</option>
              <option value="coded">Coded</option>
            </select>
          </div>

          <div class="form-group">
            <label for="status">Result Status*</label>
            <select id="status" name="status" required>
              <option value="preliminary">Preliminary</option>
              <option value="final">Final</option>
              <option value="corrected">Corrected</option>
            </select>
          </div>

          <div class="form-group">
            <label for="performedBy">Performed By*</label>
            <input type="text" id="performedBy" name="performedBy" required>
          </div>

          <div class="form-group">
            <label for="instrument">Instrument</label>
            <input type="text" id="instrument" name="instrument">
          </div>

          <div class="form-group">
            <label for="method">Method</label>
            <input type="text" id="method" name="method">
          </div>

          <div class="form-group full-width">
            <label for="comments">Comments</label>
            <textarea id="comments" name="comments" rows="3"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Result</button>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector(
      "#resultEntryForm",
    ) as HTMLFormElement;
    const cancelBtn = this.container.querySelector("#cancelBtn");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit(form);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        form?.reset();
      });
    }
  }

  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);

    const value = formData.get("value") as string;
    const valueType = formData.get("valueType") as string;

    const resultData: any = {
      orderId: this.test.orderId,
      testId: this.test.id,
      loincCode: this.test.loincCode,
      testName: this.test.testName,
      value: valueType === "numeric" ? parseFloat(value) : value,
      valueType,
      unit: formData.get("unit") || undefined,
      status: formData.get("status"),
      performedBy: formData.get("performedBy"),
      instrument: formData.get("instrument") || undefined,
      method: formData.get("method") || undefined,
      comments: formData.get("comments") || undefined,
      performedDateTime: new Date(),
      critical: false,
    };

    if (this.onSubmit) {
      this.onSubmit(resultData);
      form.reset();
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
