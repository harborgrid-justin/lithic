export class InsurancePage {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="insurance-page">
        <h1>Insurance Verification</h1>
        <div class="verification-form">
          <input type="text" placeholder="Patient name or ID" />
          <button class="btn btn-primary">Check Eligibility</button>
        </div>
        <div id="verificationResults"></div>
      </div>
    `;
  }
}
