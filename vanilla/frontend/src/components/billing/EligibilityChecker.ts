export class EligibilityChecker {
  private container: HTMLElement;
  constructor(container: HTMLElement) { this.container = container; }
  render(): void {
    this.container.innerHTML = `
      <div class="eligibility-checker">
        <h3>Check Eligibility</h3>
        <form>
          <input type="text" placeholder="Patient ID" name="patientId"/>
          <input type="text" placeholder="Insurance ID" name="insuranceId"/>
          <button type="submit" class="btn btn-primary">Check</button>
        </form>
        <div id="eligibilityResults"></div>
      </div>
    `;
  }
}
