import { Request, Response } from 'express';
import { BillingService } from '../services/BillingService';
import { EDIService } from '../services/EDIService';

export class BillingController {
  private billingService: BillingService;
  private ediService: EDIService;

  constructor() {
    this.billingService = new BillingService();
    this.ediService = new EDIService();
  }

  // ==================== PAYMENTS ====================

  async getPayments(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, status, paymentMethod, startDate, endDate, patientId, claimId } = req.query;

      const filters = {
        status: status as string,
        paymentMethod: paymentMethod as string,
        startDate: startDate as string,
        endDate: endDate as string,
        patientId: patientId as string,
        claimId: claimId as string
      };

      const result = await this.billingService.getPayments(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (error) {
      console.error('Error in getPayments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPaymentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const payment = await this.billingService.getPaymentById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createPayment(req: Request, res: Response): Promise<Response> {
    try {
      const paymentData = req.body;
      const userId = (req as any).user?.id;

      const payment = await this.billingService.createPayment(paymentData, userId);

      return res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error) {
      console.error('Error in createPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async postPayment(req: Request, res: Response): Promise<Response> {
    try {
      const paymentData = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.postPaymentToClaim(paymentData, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment posted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in postPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to post payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePayment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = (req as any).user?.id;

      const payment = await this.billingService.updatePayment(id, updates, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment updated successfully',
        data: payment
      });
    } catch (error) {
      console.error('Error in updatePayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async voidPayment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      await this.billingService.voidPayment(id, reason, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment voided successfully'
      });
    } catch (error) {
      console.error('Error in voidPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to void payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPaymentsByPatient(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const payments = await this.billingService.getPaymentsByPatient(patientId);

      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getPaymentsByPatient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPaymentsByClaim(req: Request, res: Response): Promise<Response> {
    try {
      const { claimId } = req.params;
      const payments = await this.billingService.getPaymentsByClaim(claimId);

      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getPaymentsByClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve claim payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async postBatchPayments(req: Request, res: Response): Promise<Response> {
    try {
      const { payments } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.postBatchPayments(payments, userId);

      return res.status(200).json({
        success: true,
        message: 'Batch payments posted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in postBatchPayments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to post batch payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getUnappliedPayments(req: Request, res: Response): Promise<Response> {
    try {
      const payments = await this.billingService.getUnappliedPayments();

      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getUnappliedPayments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve unapplied payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async applyPayment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { claimId } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.applyPayment(id, claimId, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment applied successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in applyPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to apply payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async refundPayment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { amount, reason, method } = req.body;
      const userId = (req as any).user?.id;

      const refund = await this.billingService.refundPayment(id, amount, reason, method, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: refund
      });
    } catch (error) {
      console.error('Error in refundPayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refund payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPaymentStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.billingService.getPaymentStats(
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getPaymentStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ==================== INVOICES ====================

  async getInvoices(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, status, patientId, startDate, endDate } = req.query;

      const filters = {
        status: status as string,
        patientId: patientId as string,
        startDate: startDate as string,
        endDate: endDate as string
      };

      const result = await this.billingService.getInvoices(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.invoices,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getInvoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInvoiceById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const invoice = await this.billingService.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const invoiceData = req.body;
      const userId = (req as any).user?.id;

      const invoice = await this.billingService.createInvoice(invoiceData, userId);

      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in createInvoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async generateInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { claimId, encounterId } = req.body;
      const userId = (req as any).user?.id;

      const invoice = await this.billingService.generateInvoiceFromClaim(claimId || encounterId, userId);

      return res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in generateInvoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = (req as any).user?.id;

      const invoice = await this.billingService.updateInvoice(id, updates, userId);

      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error in updateInvoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      await this.billingService.deleteInvoice(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { method, email } = req.body;
      const userId = (req as any).user?.id;

      await this.billingService.sendInvoice(id, method, email, userId);

      return res.status(200).json({
        success: true,
        message: 'Invoice sent successfully'
      });
    } catch (error) {
      console.error('Error in sendInvoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async generateInvoicePDF(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const pdfBuffer = await this.billingService.generateInvoicePDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in generateInvoicePDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invoice PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInvoicesByPatient(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const invoices = await this.billingService.getInvoicesByPatient(patientId);

      return res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error) {
      console.error('Error in getInvoicesByPatient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient invoices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async recordInvoicePayment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const paymentData = req.body;
      const userId = (req as any).user?.id;

      const payment = await this.billingService.recordInvoicePayment(id, paymentData, userId);

      return res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment
      });
    } catch (error) {
      console.error('Error in recordInvoicePayment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getOverdueInvoices(req: Request, res: Response): Promise<Response> {
    try {
      const invoices = await this.billingService.getOverdueInvoices();

      return res.status(200).json({
        success: true,
        data: invoices
      });
    } catch (error) {
      console.error('Error in getOverdueInvoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve overdue invoices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendBatchInvoices(req: Request, res: Response): Promise<Response> {
    try {
      const { invoiceIds, method } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.sendBatchInvoices(invoiceIds, method, userId);

      return res.status(200).json({
        success: true,
        message: 'Batch invoices sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in sendBatchInvoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send batch invoices',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getInvoiceStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.billingService.getInvoiceStats(
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getInvoiceStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoice statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ==================== ELIGIBILITY ====================

  async checkEligibility(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, insuranceId, serviceDate } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.checkEligibility(patientId, insuranceId, serviceDate, userId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in checkEligibility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check eligibility',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async verifyBenefits(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, insuranceId, serviceType, procedureCodes } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.billingService.verifyBenefits(
        patientId,
        insuranceId,
        serviceType,
        procedureCodes,
        userId
      );

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in verifyBenefits:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify benefits',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getEligibilityHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const history = await this.billingService.getEligibilityHistory(patientId);

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getEligibilityHistory:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve eligibility history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getEligibilityById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const eligibility = await this.billingService.getEligibilityById(id);

      if (!eligibility) {
        return res.status(404).json({
          success: false,
          message: 'Eligibility record not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: eligibility
      });
    } catch (error) {
      console.error('Error in getEligibilityById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve eligibility',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async batchEligibilityCheck(req: Request, res: Response): Promise<Response> {
    try {
      const { patients } = req.body;
      const userId = (req as any).user?.id;

      const results = await this.billingService.batchEligibilityCheck(patients, userId);

      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error in batchEligibilityCheck:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to perform batch eligibility check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async estimatePatientResponsibility(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId, insuranceId, procedureCodes, charges } = req.body;

      const estimate = await this.billingService.estimatePatientResponsibility(
        patientId,
        insuranceId,
        procedureCodes,
        charges
      );

      return res.status(200).json({
        success: true,
        data: estimate
      });
    } catch (error) {
      console.error('Error in estimatePatientResponsibility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to estimate patient responsibility',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPayerCoveredServices(req: Request, res: Response): Promise<Response> {
    try {
      const { payerId } = req.params;
      const services = await this.billingService.getPayerCoveredServices(payerId);

      return res.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Error in getPayerCoveredServices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve covered services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async refreshEligibility(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const result = await this.billingService.refreshEligibility(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Eligibility refreshed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in refreshEligibility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh eligibility',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getEligibilityStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.billingService.getEligibilityStats(
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getEligibilityStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve eligibility statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ==================== CODING ====================

  async searchCPTCodes(req: Request, res: Response): Promise<Response> {
    try {
      const { query, category, limit = 20 } = req.query;
      const codes = await this.billingService.searchCPTCodes(
        query as string,
        category as string,
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        data: codes
      });
    } catch (error) {
      console.error('Error in searchCPTCodes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search CPT codes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCPTCodeDetails(req: Request, res: Response): Promise<Response> {
    try {
      const { code } = req.params;
      const details = await this.billingService.getCPTCodeDetails(code);

      if (!details) {
        return res.status(404).json({
          success: false,
          message: 'CPT code not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Error in getCPTCodeDetails:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve CPT code details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async searchICDCodes(req: Request, res: Response): Promise<Response> {
    try {
      const { query, version = 'ICD-10', limit = 20 } = req.query;
      const codes = await this.billingService.searchICDCodes(
        query as string,
        version as string,
        parseInt(limit as string)
      );

      return res.status(200).json({
        success: true,
        data: codes
      });
    } catch (error) {
      console.error('Error in searchICDCodes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search ICD codes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getICDCodeDetails(req: Request, res: Response): Promise<Response> {
    try {
      const { code } = req.params;
      const details = await this.billingService.getICDCodeDetails(code);

      if (!details) {
        return res.status(404).json({
          success: false,
          message: 'ICD code not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('Error in getICDCodeDetails:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ICD code details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async validateCodeCombination(req: Request, res: Response): Promise<Response> {
    try {
      const { cptCodes, icdCodes } = req.body;
      const validation = await this.billingService.validateCodeCombination(cptCodes, icdCodes);

      return res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error in validateCodeCombination:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate code combination',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async suggestCodes(req: Request, res: Response): Promise<Response> {
    try {
      const { encounterData, diagnosis, procedures } = req.body;
      const suggestions = await this.billingService.suggestCodes(encounterData, diagnosis, procedures);

      return res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Error in suggestCodes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to suggest codes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCPTModifiers(req: Request, res: Response): Promise<Response> {
    try {
      const modifiers = await this.billingService.getCPTModifiers();

      return res.status(200).json({
        success: true,
        data: modifiers
      });
    } catch (error) {
      console.error('Error in getCPTModifiers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve CPT modifiers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getFeeSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { payerId, codes } = req.query;
      const feeSchedule = await this.billingService.getFeeSchedule(
        payerId as string,
        codes as string
      );

      return res.status(200).json({
        success: true,
        data: feeSchedule
      });
    } catch (error) {
      console.error('Error in getFeeSchedule:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve fee schedule',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async crosswalkCodes(req: Request, res: Response): Promise<Response> {
    try {
      const { code, fromVersion, toVersion } = req.body;
      const crosswalked = await this.billingService.crosswalkCodes(code, fromVersion, toVersion);

      return res.status(200).json({
        success: true,
        data: crosswalked
      });
    } catch (error) {
      console.error('Error in crosswalkCodes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to crosswalk codes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getNCCIEdits(req: Request, res: Response): Promise<Response> {
    try {
      const { code1, code2 } = req.query;
      const edits = await this.billingService.getNCCIEdits(code1 as string, code2 as string);

      return res.status(200).json({
        success: true,
        data: edits
      });
    } catch (error) {
      console.error('Error in getNCCIEdits:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve NCCI edits',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async auditCoding(req: Request, res: Response): Promise<Response> {
    try {
      const { claimId, encounterId } = req.body;
      const userId = (req as any).user?.id;

      const auditResult = await this.billingService.auditCoding(claimId || encounterId, userId);

      return res.status(200).json({
        success: true,
        data: auditResult
      });
    } catch (error) {
      console.error('Error in auditCoding:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to audit coding',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCodeBundles(req: Request, res: Response): Promise<Response> {
    try {
      const { specialty, type } = req.query;
      const bundles = await this.billingService.getCodeBundles(specialty as string, type as string);

      return res.status(200).json({
        success: true,
        data: bundles
      });
    } catch (error) {
      console.error('Error in getCodeBundles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve code bundles',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ==================== ERA ====================

  async uploadERA(req: Request, res: Response): Promise<Response> {
    try {
      const file = req.file;
      const userId = (req as any).user?.id;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const result = await this.ediService.parseERA835(file.buffer.toString('utf-8'), userId);

      return res.status(200).json({
        success: true,
        message: 'ERA file uploaded and parsed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in uploadERA:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERAs(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, status, payerId, startDate, endDate } = req.query;

      const filters = {
        status: status as string,
        payerId: payerId as string,
        startDate: startDate as string,
        endDate: endDate as string
      };

      const result = await this.ediService.getERAs(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.eras,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getERAs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERAs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERAById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const era = await this.ediService.getERAById(id);

      if (!era) {
        return res.status(404).json({
          success: false,
          message: 'ERA not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: era
      });
    } catch (error) {
      console.error('Error in getERAById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async processERA(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const result = await this.ediService.processERA(id, userId);

      return res.status(200).json({
        success: true,
        message: 'ERA processed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in processERA:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async autoPostERA(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { autoResolveAdjustments } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.ediService.autoPostERA(id, autoResolveAdjustments, userId);

      return res.status(200).json({
        success: true,
        message: 'ERA auto-posted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in autoPostERA:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to auto-post ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERAPayments(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const payments = await this.ediService.getERAPayments(id);

      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getERAPayments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERA payments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERAAdjustments(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const adjustments = await this.ediService.getERAAdjustments(id);

      return res.status(200).json({
        success: true,
        data: adjustments
      });
    } catch (error) {
      console.error('Error in getERAAdjustments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERA adjustments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async matchERAToClaims(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await this.ediService.matchERAToClaims(id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in matchERAToClaims:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to match ERA to claims',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERADenials(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const denials = await this.ediService.getERADenials(id);

      return res.status(200).json({
        success: true,
        data: denials
      });
    } catch (error) {
      console.error('Error in getERADenials:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERA denials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getRawERA(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const rawData = await this.ediService.getRawERA(id);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=era-${id}.txt`);
      return res.send(rawData);
    } catch (error) {
      console.error('Error in getRawERA:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve raw ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getUnprocessedERAs(req: Request, res: Response): Promise<Response> {
    try {
      const eras = await this.ediService.getUnprocessedERAs();

      return res.status(200).json({
        success: true,
        data: eras
      });
    } catch (error) {
      console.error('Error in getUnprocessedERAs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve unprocessed ERAs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async reconcileERA(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { depositAmount, depositDate, bankAccount } = req.body;
      const userId = (req as any).user?.id;

      const result = await this.ediService.reconcileERA(
        id,
        depositAmount,
        depositDate,
        bankAccount,
        userId
      );

      return res.status(200).json({
        success: true,
        message: 'ERA reconciled successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in reconcileERA:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reconcile ERA',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getERAStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.ediService.getERAStats(
        startDate as string,
        endDate as string
      );

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getERAStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ERA statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
