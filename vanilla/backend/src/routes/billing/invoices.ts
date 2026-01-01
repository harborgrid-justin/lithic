import { Router, Request, Response } from 'express';
import { BillingController } from '../../controllers/BillingController';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();
const billingController = new BillingController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/billing/invoices
 * @desc    Get all invoices with filtering and pagination
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getInvoices(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getInvoiceById(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/invoices
 * @desc    Create new invoice
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('createInvoice'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.createInvoice(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /invoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/invoices/generate
 * @desc    Generate invoice from claim or encounter
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/generate',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('generateInvoice'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.generateInvoice(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /invoices/generate:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   PUT /api/billing/invoices/:id
 * @desc    Update invoice
 * @access  Private (Billing Staff, Admin)
 */
router.put(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('updateInvoice'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.updateInvoice(req, res);
      return result;
    } catch (error) {
      console.error('Error in PUT /invoices/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   DELETE /api/billing/invoices/:id
 * @desc    Delete/void invoice
 * @access  Private (Billing Admin, Admin)
 */
router.delete(
  '/:id',
  authorize(['billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.deleteInvoice(req, res);
      return result;
    } catch (error) {
      console.error('Error in DELETE /invoices/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/invoices/:id/send
 * @desc    Send invoice to patient (email/mail)
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/send',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('sendInvoice'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.sendInvoice(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /invoices/:id/send:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/invoices/:id/pdf
 * @desc    Generate PDF for invoice
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/pdf',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.generateInvoicePDF(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices/:id/pdf:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/invoices/patient/:patientId
 * @desc    Get invoices for specific patient
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/patient/:patientId',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getInvoicesByPatient(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices/patient/:patientId:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/invoices/:id/payment
 * @desc    Record payment against invoice
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/payment',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('invoicePayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.recordInvoicePayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /invoices/:id/payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/invoices/overdue/list
 * @desc    Get overdue invoices
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/overdue/list',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getOverdueInvoices(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices/overdue/list:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/invoices/batch/send
 * @desc    Send batch invoices
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/batch/send',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('batchSendInvoices'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.sendBatchInvoices(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /invoices/batch/send:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/invoices/stats/summary
 * @desc    Get invoice statistics summary
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/stats/summary',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getInvoiceStats(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /invoices/stats/summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
