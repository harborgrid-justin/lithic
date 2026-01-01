/**
 * ClaimForm Component - Form for creating/editing claims
 */

export class ClaimForm {
  private container: HTMLElement;
  private onSubmit?: (data: any) => void;

  constructor(
    container: HTMLElement,
    options?: { onSubmit?: (data: any) => void },
  ) {
    this.container = container;
    this.onSubmit = options?.onSubmit;
  }

  render(claim?: any): void {
    this.container.innerHTML = `
      <form class="claim-form" id="claimFormComponent">
        <div class="form-row">
          <label>Patient ID</label>
          <input type="text" name="patientId" value="${claim?.patientId || ""}" required />
        </div>
        <div class="form-row">
          <label>Service Date</label>
          <input type="date" name="serviceDate" value="${claim?.serviceDate || ""}" required />
        </div>
        <div class="form-row">
          <label>Diagnosis Codes</label>
          <input type="text" name="diagnosisCodes" value="${claim?.diagnosisCodes?.join(", ") || ""}" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Submit</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        </div>
      </form>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector(
      "#claimFormComponent",
    ) as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      if (this.onSubmit) this.onSubmit(data);
    });

    const cancelBtn = this.container.querySelector("#cancelBtn");
    cancelBtn?.addEventListener("click", () => {
      history.back();
    });
  }
}
