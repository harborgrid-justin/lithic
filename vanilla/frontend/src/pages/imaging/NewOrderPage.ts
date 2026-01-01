import { ImagingService } from '../../services/ImagingService';
import { ImagingOrderForm } from '../../components/imaging/ImagingOrderForm';

export class NewOrderPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private orderForm: ImagingOrderForm;

  constructor(container: HTMLElement) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.orderForm = new ImagingOrderForm();
  }

  async render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'new-order-page';
    wrapper.innerHTML = `
      <div class="page-header">
        <button class="btn btn-link" data-action="back">← Back to Orders</button>
        <h1>New Imaging Order</h1>
      </div>

      <div class="form-container">
        <div id="order-form-container"></div>
      </div>
    `;

    this.container.appendChild(wrapper);
    this.attachEventListeners();

    const formContainer = document.getElementById('order-form-container');
    if (formContainer) {
      await this.orderForm.render(formContainer, this.handleSubmit.bind(this));
    }
  }

  private attachEventListeners() {
    const backBtn = this.container.querySelector('[data-action="back"]');
    backBtn?.addEventListener('click', () => {
      window.location.href = '#/imaging/orders';
    });
  }

  private async handleSubmit(orderData: any) {
    try {
      const order = await this.imagingService.createOrder(orderData);
      this.showSuccess('Order created successfully');
      window.location.href = `#/imaging/orders/${order.id}`;
    } catch (error) {
      console.error('Error creating order:', error);
      this.showError('Failed to create order');
    }
  }

  private showSuccess(message: string) {
    alert(message);
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
