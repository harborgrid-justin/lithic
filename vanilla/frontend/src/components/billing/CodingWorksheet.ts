export class CodingWorksheet {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  render(): void {
    this.container.innerHTML = `
      <div class="coding-worksheet">
        <div class="code-section">
          <h4>CPT Codes</h4>
          <div id="cptCodes"></div>
        </div>
        <div class="code-section">
          <h4>ICD-10 Codes</h4>
          <div id="icdCodes"></div>
        </div>
      </div>
    `;
  }
}
