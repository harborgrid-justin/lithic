/**
 * Lab Order Detail Page
 * View and manage individual laboratory order
 */

import { labService } from "../../services/LaboratoryService";
import { ResultViewer } from "../../components/laboratory/ResultViewer";
import { SpecimenTracker } from "../../components/laboratory/SpecimenTracker";

export class LabOrderDetailPage {
  private container: HTMLElement;
  private orderId: string;
  private order: any = null;
  private resultViewer: ResultViewer | null = null;

  constructor(container: HTMLElement, orderId: string) {
    this.container = container;
    this.orderId = orderId;
  }

  async render(): Promise<void> {
    const html = `
      <div class="lab-order-detail-page">
        <div class="page-header">
          <button type="button" class="btn-back" id="backBtn">← Back to Orders</button>
          <h1>Order Details</h1>
          <div class="header-actions">
            <button type="button" class="btn btn-secondary" id="printBtn">Print</button>
            <button type="button" class="btn btn-secondary" id="hl7Btn">Generate HL7</button>
            <button type="button" class="btn btn-danger" id="cancelBtn">Cancel Order</button>
          </div>
        </div>

        <div id="orderContent">Loading...</div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadOrder();
    this.attachEventListeners();
  }

  private async loadOrder(): Promise<void> {
    try {
      this.order = await labService.getOrder(this.orderId);
      const results = await labService.getResultsForOrder(this.orderId);
      const specimens = await labService.getSpecimensForOrder(this.orderId);

      const orderContent = this.container.querySelector("#orderContent");
      if (orderContent) {
        orderContent.innerHTML = this.renderOrderContent(
          this.order,
          results,
          specimens,
        );
        this.initializeComponents(results);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      const orderContent = this.container.querySelector("#orderContent");
      if (orderContent) {
        orderContent.innerHTML =
          '<p class="error">Error loading order details</p>';
      }
    }
  }

  private renderOrderContent(
    order: any,
    results: any[],
    specimens: any[],
  ): string {
    return `
      <div class="order-details">
        <div class="detail-section">
          <h2>Order Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Order Number:</span>
              <span class="value">${order.orderNumber}</span>
            </div>
            <div class="detail-item">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Priority:</span>
              <span class="value">
                <span class="priority-badge priority-${order.priority}">${order.priority.toUpperCase()}</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Order Date:</span>
              <span class="value">${this.formatDateTime(order.orderDateTime)}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2>Patient Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Name:</span>
              <span class="value">${order.patientName}</span>
            </div>
            <div class="detail-item">
              <span class="label">MRN:</span>
              <span class="value">${order.patientMRN}</span>
            </div>
            <div class="detail-item">
              <span class="label">Patient ID:</span>
              <span class="value">${order.patientId}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h2>Provider Information</h2>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Ordering Provider:</span>
              <span class="value">${order.orderingProviderName}</span>
            </div>
            <div class="detail-item">
              <span class="label">Provider ID:</span>
              <span class="value">${order.orderingProviderId}</span>
            </div>
          </div>
        </div>

        ${
          order.clinicalInfo
            ? `
          <div class="detail-section">
            <h2>Clinical Information</h2>
            <p>${order.clinicalInfo}</p>
          </div>
        `
            : ""
        }

        ${
          order.diagnosis
            ? `
          <div class="detail-section">
            <h2>Diagnosis</h2>
            <p>${order.diagnosis}</p>
          </div>
        `
            : ""
        }

        <div class="detail-section">
          <h2>Tests Ordered</h2>
          <div class="tests-list">
            ${order.tests.map((test: any) => this.renderTest(test)).join("")}
          </div>
        </div>

        ${
          results.length > 0
            ? `
          <div class="detail-section">
            <h2>Results</h2>
            <div id="resultsContainer"></div>
          </div>
        `
            : ""
        }

        ${
          specimens.length > 0
            ? `
          <div class="detail-section">
            <h2>Specimens</h2>
            <div class="specimens-list">
              ${specimens
                .map(
                  (spec: any) => `
                <div class="specimen-item">
                  <strong>${spec.specimenNumber}</strong>
                  <span>${this.formatSpecimenType(spec.specimenType)}</span>
                  <span class="status-badge status-${spec.status}">${this.formatStatus(spec.status)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private renderTest(test: any): string {
    return `
      <div class="test-item">
        <div class="test-info">
          <strong>${test.testName}</strong>
          <span class="test-code">${test.loincCode}</span>
        </div>
        <div class="test-status">
          <span class="status-badge status-${test.status}">${this.formatStatus(test.status)}</span>
        </div>
      </div>
    `;
  }

  private initializeComponents(results: any[]): void {
    const resultsContainer = this.container.querySelector("#resultsContainer");
    if (resultsContainer && results.length > 0) {
      this.resultViewer = new ResultViewer(resultsContainer as HTMLElement);
      this.resultViewer.setResults(results);
    }
  }

  private formatStatus(status: string): string {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatSpecimenType(type: string): string {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private attachEventListeners(): void {
    const backBtn = this.container.querySelector("#backBtn");
    const printBtn = this.container.querySelector("#printBtn");
    const hl7Btn = this.container.querySelector("#hl7Btn");
    const cancelBtn = this.container.querySelector("#cancelBtn");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "/laboratory/orders";
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", () => this.handlePrint());
    }

    if (hl7Btn) {
      hl7Btn.addEventListener("click", () => this.handleHL7());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.handleCancel());
    }
  }

  private handlePrint(): void {
    window.print();
  }

  private async handleHL7(): Promise<void> {
    try {
      const hl7Data = await labService.generateHL7Order(this.orderId);
      alert("HL7 Message:\n\n" + hl7Data.hl7Message);
    } catch (error) {
      console.error("Error generating HL7:", error);
      alert("Error generating HL7 message");
    }
  }

  private async handleCancel(): Promise<void> {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
      await labService.cancelOrder(this.orderId, reason);
      alert("Order cancelled successfully");
      this.loadOrder();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Error cancelling order");
    }
  }

  destroy(): void {
    if (this.resultViewer) {
      this.resultViewer.destroy();
    }
    this.container.innerHTML = "";
  }
}
