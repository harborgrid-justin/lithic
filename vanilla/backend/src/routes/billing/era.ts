import { Router, Request, Response } from 'express';
import { BillingController } from '../../controllers/BillingController';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import multer from 'multer';

const router = Router();
const billingController = new BillingController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept EDI 835 files and text files
    if (file.mimetype === 'text/plain' ||
        file.mimetype === 'application/octet-stream' ||
        file.originalname.endsWith('.835') ||
        file.originalname.endsWith('.edi') ||
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only EDI 835 files are allowed.'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/billing/era/upload
 * @desc    Upload and process EDI 835 ERA file
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/upload',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  upload.single('eraFile'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.uploadERA(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /era/upload:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era
 * @desc    Get all ERA files with filtering and pagination
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERAs(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/:id
 * @desc    Get ERA by ID
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERAById(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/:id:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/era/:id/process
 * @desc    Process ERA and post payments
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/process',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.processERA(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /era/:id/process:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/era/:id/auto-post
 * @desc    Automatically post payments from ERA
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/auto-post',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  validateRequest('autoPostERA'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.autoPostERA(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /era/:id/auto-post:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/:id/payments
 * @desc    Get payments from specific ERA
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/payments',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERAPayments(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/:id/payments:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/:id/adjustments
 * @desc    Get adjustments from specific ERA
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/adjustments',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERAAdjustments(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/:id/adjustments:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/era/:id/match
 * @desc    Match ERA payments to claims
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  '/:id/match',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.matchERAToClaims(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /era/:id/match:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/:id/denials
 * @desc    Get denials from specific ERA
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/denials',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERADenials(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/:id/denials:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/:id/raw
 * @desc    Get raw EDI 835 file content
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/:id/raw',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getRawERA(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/:id/raw:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/unprocessed/list
 * @desc    Get unprocessed ERA files
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/unprocessed/list',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getUnprocessedERAs(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/unprocessed/list:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   POST /api/billing/era/:id/reconcile
 * @desc    Reconcile ERA with bank deposits
 * @access  Private (Billing Admin, Admin)
 */
router.post(
  '/:id/reconcile',
  authorize(['billing_admin', 'admin']),
  validateRequest('reconcileERA'),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.reconcileERA(req, res);
      return result;
    } catch (error) {
      console.error('Error in POST /era/:id/reconcile:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route   GET /api/billing/era/stats/summary
 * @desc    Get ERA processing statistics
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  '/stats/summary',
  authorize(['billing_staff', 'billing_admin', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getERAStats(req, res);
      return result;
    } catch (error) {
      console.error('Error in GET /era/stats/summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
