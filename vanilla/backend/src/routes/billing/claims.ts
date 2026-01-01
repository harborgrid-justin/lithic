import { Router, Request, Response } from 'express';
import { ClaimsController } from '../../controllers/ClaimsController';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();
const claimsController = new ClaimsController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/billing/claims
 * @desc    Get all claims with filtering and pagination
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.getClaims(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/claims/:id
 * @desc    Get claim by ID
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.getClaimById(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/claims
 * @desc    Create new claim
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('createClaim'),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.createClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /claims:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   PUT /api/billing/claims/:id
 * @desc    Update claim
 * @access  Private (Billing Staff, Admin)
 */
router.put(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('updateClaim'),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.updateClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in PUT /claims/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   DELETE /api/billing/claims/:id
 * @desc    Delete/void claim
 * @access  Private (Billing Admin, Admin)
 */
router.delete(
  '/:id',
  authorize(['billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.deleteClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in DELETE /claims/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/claims/:id/submit
 * @desc    Submit claim to payer (generate EDI 837)
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/submit',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.submitClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /claims/:id/submit:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/claims/:id/resubmit
 * @desc    Resubmit denied/rejected claim
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/resubmit',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.resubmitClaim(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /claims/:id/resubmit:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/claims/:id/status
 * @desc    Check claim status with payer
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/status',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.checkClaimStatus(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims/:id/status:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/claims/:id/history
 * @desc    Get claim history and audit trail
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/history',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.getClaimHistory(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims/:id/history:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/claims/:id/appeal
 * @desc    Create appeal for denied claim
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/appeal',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('createAppeal'),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.createAppeal(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /claims/:id/appeal:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/claims/batch/:batchId
 * @desc    Get claims by batch ID
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/batch/:batchId',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.getClaimsByBatch(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims/batch/:batchId:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/claims/batch/submit
 * @desc    Submit batch of claims
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/batch/submit',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('submitBatch'),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.submitBatchClaims(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /claims/batch/submit:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/claims/stats/summary
 * @desc    Get claims statistics summary
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/stats/summary',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await claimsController.getClaimsStats(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /claims/stats/summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
