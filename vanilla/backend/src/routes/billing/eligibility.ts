import { Router, Request, Response } from "express";
import { BillingController } from "../../controllers/BillingController";
import { authenticate, authorize } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validation";

const router = Router();
const billingController = new BillingController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/billing/eligibility/check
 * @desc    Check insurance eligibility for patient
 * @access  Private (Billing Staff, Admin, Front Desk)
 */
router.post(
  "/check",
  authorize(["billing_staff", "billing_admin", "admin", "front_desk"]),
  validateRequest("checkEligibility"),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.checkEligibility(req, res);
      return result;
    } catch (error) {
      console.error("Error in POST /eligibility/check:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   POST /api/billing/eligibility/verify
 * @desc    Verify benefits and coverage for specific service
 * @access  Private (Billing Staff, Admin, Front Desk)
 */
router.post(
  "/verify",
  authorize(["billing_staff", "billing_admin", "admin", "front_desk"]),
  validateRequest("verifyBenefits"),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.verifyBenefits(req, res);
      return result;
    } catch (error) {
      console.error("Error in POST /eligibility/verify:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   GET /api/billing/eligibility/patient/:patientId
 * @desc    Get eligibility history for patient
 * @access  Private (Billing Staff, Admin, Front Desk)
 */
router.get(
  "/patient/:patientId",
  authorize(["billing_staff", "billing_admin", "admin", "front_desk"]),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getEligibilityHistory(req, res);
      return result;
    } catch (error) {
      console.error("Error in GET /eligibility/patient/:patientId:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   GET /api/billing/eligibility/:id
 * @desc    Get specific eligibility check result
 * @access  Private (Billing Staff, Admin, Front Desk)
 */
router.get(
  "/:id",
  authorize(["billing_staff", "billing_admin", "admin", "front_desk"]),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getEligibilityById(req, res);
      return result;
    } catch (error) {
      console.error("Error in GET /eligibility/:id:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   POST /api/billing/eligibility/batch
 * @desc    Batch eligibility check for multiple patients
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  "/batch",
  authorize(["billing_staff", "billing_admin", "admin"]),
  validateRequest("batchEligibility"),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.batchEligibilityCheck(req, res);
      return result;
    } catch (error) {
      console.error("Error in POST /eligibility/batch:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   POST /api/billing/eligibility/estimate
 * @desc    Estimate patient responsibility for service
 * @access  Private (Billing Staff, Admin, Front Desk)
 */
router.post(
  "/estimate",
  authorize(["billing_staff", "billing_admin", "admin", "front_desk"]),
  validateRequest("estimateResponsibility"),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.estimatePatientResponsibility(
        req,
        res,
      );
      return result;
    } catch (error) {
      console.error("Error in POST /eligibility/estimate:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   GET /api/billing/eligibility/payer/:payerId/services
 * @desc    Get covered services for specific payer
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  "/payer/:payerId/services",
  authorize(["billing_staff", "billing_admin", "admin"]),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getPayerCoveredServices(req, res);
      return result;
    } catch (error) {
      console.error(
        "Error in GET /eligibility/payer/:payerId/services:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   POST /api/billing/eligibility/:id/refresh
 * @desc    Refresh eligibility check with payer
 * @access  Private (Billing Staff, Admin)
 */
router.post(
  "/:id/refresh",
  authorize(["billing_staff", "billing_admin", "admin"]),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.refreshEligibility(req, res);
      return result;
    } catch (error) {
      console.error("Error in POST /eligibility/:id/refresh:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route   GET /api/billing/eligibility/stats/summary
 * @desc    Get eligibility check statistics
 * @access  Private (Billing Staff, Admin)
 */
router.get(
  "/stats/summary",
  authorize(["billing_staff", "billing_admin", "admin"]),
  async (req: Request, res: Response) => {
    try {
      const result = await billingController.getEligibilityStats(req, res);
      return result;
    } catch (error) {
      console.error("Error in GET /eligibility/stats/summary:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
