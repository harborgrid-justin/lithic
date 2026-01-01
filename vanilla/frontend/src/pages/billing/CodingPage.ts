export class CodingPage {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="coding-page">
        <h1>Medical Coding Worksheet</h1>
        <div class="coding-search">
          <div class="search-section">
            <h3>CPT Codes</h3>
            <input type="text" placeholder="Search CPT codes..." />
            <div id="cptResults"></div>
          </div>
          <div class="search-section">
            <h3>ICD-10 Codes</h3>
            <input type="text" placeholder="Search ICD-10 codes..." />
            <div id="icdResults"></div>
          </div>
        </div>
      </div>
    `;
  }
}
