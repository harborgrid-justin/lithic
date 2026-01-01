/**
 * PaymentPosting Component - Post payments to claims
 */

export class PaymentPosting {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="payment-posting-component">
        <h3>Post Payment</h3>
        <form id="paymentPostingForm">
          <div class="form-group">
            <label>Claim ID</label>
            <input type="text" name="claimId" required />
          </div>
          <div class="form-group">
            <label>Payment Amount</label>
            <input type="number" name="amount" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod">
              <option value="insurance">Insurance</option>
              <option value="patient">Patient</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div class="form-group">
            <label>Check/Reference Number</label>
            <input type="text" name="checkNumber" />
          </div>
          <button type="submit" class="btn btn-primary">Post Payment</button>
        </form>
      </div>
    `;
  }
}
