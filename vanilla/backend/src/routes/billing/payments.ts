import { Router, Request, Response } from 'express';
import { BillingController } from '../../controllers/BillingController';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();
const billingController = new BillingController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/billing/payments
 * @desc    Get all payments with filtering and pagination
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPayments(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPaymentById(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/payments
 * @desc    Create new payment/post payment
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('createPayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.createPayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/payments/post
 * @desc    Post payment to claim (from ERA or manual entry)
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/post',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('postPayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.postPayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /payments/post:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   PUT /api/billing/payments/:id
 * @desc    Update payment
 * @access  Private (Billing Admin, Admin)
 */
router.put(
  '/:id',
  authorize(['billing_admin', 'admin']),
  validateRequest('updatePayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.updatePayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in PUT /payments/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   DELETE /api/billing/payments/:id
 * @desc    Void/reverse payment
 * @access  Private (Billing Admin, Admin)
 */
router.delete(
  '/:id',
  authorize(['billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.voidPayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in DELETE /payments/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/payments/patient/:patientId
 * @desc    Get payments for specific patient
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/patient/:patientId',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPaymentsByPatient(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments/patient/:patientId:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/payments/claim/:claimId
 * @desc    Get payments for specific claim
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/claim/:claimId',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPaymentsByClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments/claim/:claimId:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/payments/batch
 * @desc    Post batch payments (from ERA)
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/batch',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('batchPayments'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.postBatchPayments(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /payments/batch:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/payments/unapplied
 * @desc    Get unapplied/unposted payments
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/unapplied/list',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getUnappliedPayments(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments/unapplied/list:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/payments/:id/apply
 * @desc    Apply unapplied payment to claim
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/apply',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('applyPayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.applyPayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /payments/:id/apply:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/payments/stats/summary
 * @desc    Get payment statistics summary
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/stats/summary',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPaymentStats(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /payments/stats/summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/payments/:id/refund
 * @desc    Process refund for payment
 * @access  Private (Billing Admin, Admin)
 */
router.post(
  '/:id/refund',
  authorize(['billing_admin', 'admin']),
  validateRequest('refundPayment'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.refundPayment(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /payments/:id/refund:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
