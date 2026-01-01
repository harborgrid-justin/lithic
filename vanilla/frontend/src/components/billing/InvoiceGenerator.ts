export class InvoiceGenerator {
  private container: HTMLElement;
  constructor(container: HTMLElement) {
    this.container = container;
  }
  render(): void {
    this.container.innerHTML = `
      <div class="invoice-generator">
        <h3>Generate Invoice</h3>
        <form><input type="text" placeholder="Patient ID"/><button class="btn">Generate</button></form>
      </div>
    `;
  }
}
