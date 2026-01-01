// Billing Service - Handles all billing-related business logic

import {
  Invoice,
  Payment,
  FeeSchedule,
  SuperBill,
  RevenueMetrics,
  ARAgingBucket,
} from "@/types/billing";
import { formatCurrency, generateInvoiceNumber } from "@/lib/billing-utils";

class BillingService {
  private apiBase = "/api/billing";

  // Invoice Operations
  async getInvoices(): Promise<Invoice[]> {
    const response = await fetch(`${this.apiBase}/invoices`);
    if (!response.ok) throw new Error("Failed to fetch invoices");
    return response.json();
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await fetch(`${this.apiBase}/invoices/${id}`);
    if (!response.ok) throw new Error("Failed to fetch invoice");
    return response.json();
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await fetch(`${this.apiBase}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create invoice");
    return response.json();
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await fetch(`${this.apiBase}/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update invoice");
    return response.json();
  }

  async sendInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: "sent" });
  }

  async markInvoiceAsPaid(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: "paid" });
  }

  // Payment Operations
  async getPayments(): Promise<Payment[]> {
    const response = await fetch(`${this.apiBase}/payments`);
    if (!response.ok) throw new Error("Failed to fetch payments");
    return response.json();
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const response = await fetch(`${this.apiBase}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create payment");
    return response.json();
  }

  async postPayment(
    claimId: string,
    amount: number,
    method: string,
  ): Promise<Payment> {
    return this.createPayment({
      claimId,
      amount,
      paymentMethod: method as any,
      paymentDate: new Date().toISOString(),
      postedBy: "current-user", // Should come from auth context
    });
  }

  // Revenue & Reporting
  async getRevenueMetrics(
    startDate: string,
    endDate: string,
  ): Promise<RevenueMetrics> {
    const response = await fetch(
      `${this.apiBase}/reports/revenue?startDate=${startDate}&endDate=${endDate}`,
    );
    if (!response.ok) throw new Error("Failed to fetch revenue metrics");
    return response.json();
  }

  async getARAgingReport(): Promise<ARAgingBucket[]> {
    const response = await fetch(`${this.apiBase}/reports/ar-aging`);
    if (!response.ok) throw new Error("Failed to fetch AR aging report");
    return response.json();
  }

  // Fee Schedule Operations
  async getFeeSchedules(): Promise<FeeSchedule[]> {
    const response = await fetch(`${this.apiBase}/fee-schedules`);
    if (!response.ok) throw new Error("Failed to fetch fee schedules");
    return response.json();
  }

  async getFeeScheduleById(id: string): Promise<FeeSchedule> {
    const response = await fetch(`${this.apiBase}/fee-schedules/${id}`);
    if (!response.ok) throw new Error("Failed to fetch fee schedule");
    return response.json();
  }

  // SuperBill Operations
  async getSuperBills(): Promise<SuperBill[]> {
    const response = await fetch(`${this.apiBase}/superbills`);
    if (!response.ok) throw new Error("Failed to fetch superbills");
    return response.json();
  }

  async createSuperBill(data: Partial<SuperBill>): Promise<SuperBill> {
    const response = await fetch(`${this.apiBase}/superbills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create superbill");
    return response.json();
  }

  async convertSuperBillToClaim(superbillId: string): Promise<string> {
    const response = await fetch(
      `${this.apiBase}/superbills/${superbillId}/convert`,
      {
        method: "POST",
      },
    );
    if (!response.ok) throw new Error("Failed to convert superbill to claim");
    const data = await response.json();
    return data.claimId;
  }

  // Utility Functions
  calculateInvoiceBalance(invoice: Invoice): number {
    return invoice.total - invoice.paidAmount;
  }

  isInvoiceOverdue(invoice: Invoice): boolean {
    if (invoice.status === "paid" || invoice.status === "cancelled")
      return false;
    return new Date(invoice.dueDate) < new Date();
  }

  calculateTotalRevenue(payments: Payment[]): number {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  groupPaymentsByMonth(payments: Payment[]): Record<string, number> {
    return payments.reduce(
      (acc, payment) => {
        const month = new Date(payment.paymentDate).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + payment.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

export const billingService = new BillingService();
export default billingService;
