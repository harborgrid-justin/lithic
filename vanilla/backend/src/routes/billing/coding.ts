import { Router, Request, Response } from 'express';
import { BillingController } from '../../controllers/BillingController';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();
const billingController = new BillingController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/billing/coding/cpt/search
 * @desc    Search CPT codes
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.get(
  '/cpt/search',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider', 'nurse']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.searchCPTCodes(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/cpt/search:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/cpt/:code
 * @desc    Get CPT code details
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.get(
  '/cpt/:code',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider', 'nurse']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getCPTCodeDetails(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/cpt/:code:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/icd/search
 * @desc    Search ICD-10 codes
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.get(
  '/icd/search',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider', 'nurse']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.searchICDCodes(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/icd/search:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/icd/:code
 * @desc    Get ICD-10 code details
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.get(
  '/icd/:code',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider', 'nurse']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getICDCodeDetails(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/icd/:code:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/coding/validate
 * @desc    Validate code combination (CPT + ICD)
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/validate',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('validateCoding'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.validateCodeCombination(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /coding/validate:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/coding/suggest
 * @desc    Suggest codes based on encounter/diagnosis
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.post(
  '/suggest',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider']),
  validateRequest('suggestCodes'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.suggestCodes(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /coding/suggest:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/modifiers
 * @desc    Get list of CPT modifiers
 * @access  Private (Billing Staff, Admin, Providers)
 */
router.get(
  '/modifiers',
  authorize(['billing_staff', 'billing_admin', 'admin', 'provider']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getCPTModifiers(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/modifiers:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/fee-schedule
 * @desc    Get fee schedule for codes
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/fee-schedule',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getFeeSchedule(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/fee-schedule:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/coding/crosswalk
 * @desc    Crosswalk ICD-9 to ICD-10 or vice versa
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/crosswalk',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('codeCrosswalk'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.crosswalkCodes(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /coding/crosswalk:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/ncci/edits
 * @desc    Get NCCI (National Correct Coding Initiative) edits
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/ncci/edits',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getNCCIEdits(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/ncci/edits:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/coding/audit
 * @desc    Audit coding for claim or encounter
 * @access  Private (Billing Admin, Admin)
 */
router.post(
  '/audit',
  authorize(['billing_admin', 'admin']),
  validateRequest('auditCoding'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.auditCoding(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /coding/audit:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/coding/bundles
 * @desc    Get bundled code packages
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/bundles',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getCodeBundles(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /coding/bundles:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
