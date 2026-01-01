/**
 * New Lab Order Page
 * Create new laboratory order
 */

import { labService } from "../../services/LaboratoryService";
import { LabOrderForm } from "../../components/laboratory/LabOrderForm";

export class NewLabOrderPage {
  private container: HTMLElement;
  private orderForm: LabOrderForm | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="new-lab-order-page">
        <div class="page-header">
          <button type="button" class="btn-back" id="backBtn">← Back to Orders</button>
          <h1>New Laboratory Order</h1>
        </div>

        <div id="orderFormContainer"></div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadPanels();
    this.attachEventListeners();
  }

  private async loadPanels(): Promise<void> {
    try {
      const panels = await labService.getPanels();

      const formContainer = this.container.querySelector("#orderFormContainer");
      if (formContainer) {
        this.orderForm = new LabOrderForm(formContainer as HTMLElement, {
          onSubmit: (orderData) => this.handleSubmit(orderData),
        });
        this.orderForm.setPanels(panels);
      }
    } catch (error) {
      console.error("Error loading panels:", error);
    }
  }

  private async handleSubmit(orderData: any): Promise<void> {
    try {
      const order = await labService.createOrder(orderData);
      alert("Order created successfully!");
      window.location.href = `/laboratory/orders/${order.id}`;
    } catch (error: any) {
      console.error("Error creating order:", error);
      alert("Error creating order: " + error.message);
    }
  }

  private attachEventListeners(): void {
    const backBtn = this.container.querySelector("#backBtn");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "/laboratory/orders";
      });
    }
  }

  destroy(): void {
    if (this.orderForm) {
      this.orderForm.destroy();
    }
    this.container.innerHTML = "";
  }
}
