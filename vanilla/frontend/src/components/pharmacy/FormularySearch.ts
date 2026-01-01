/**
 * FormularySearch.ts
 * Formulary search and lookup component
 */

export class FormularySearch {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="formulary-search">
        <h3>Formulary Search</h3>
        <p>Search drug formulary with tier info and restrictions - Under Construction</p>
      </div>
    `;
  }
}
