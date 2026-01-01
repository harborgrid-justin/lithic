/**
 * refills.ts
 * Routes for prescription refill management
 */

import { Router } from "express";
import pharmacyController from "../../controllers/PharmacyController";

const router = Router();

/**
 * @route   GET /api/pharmacy/refills
 * @desc    Get all refill requests with filters
 * @access  Private
 */
router.get("/", pharmacyController.getRefillRequests.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/refills
 * @desc    Create new refill request
 * @access  Private
 */
router.post(
  "/",
  pharmacyController.createRefillRequest.bind(pharmacyController),
);

/**
 * @route   POST /api/pharmacy/refills/:id/approve
 * @desc    Approve refill request
 * @access  Private
 */
router.post(
  "/:id/approve",
  pharmacyController.approveRefillRequest.bind(pharmacyController),
);

/**
 * @route   POST /api/pharmacy/refills/:id/deny
 * @desc    Deny refill request
 * @access  Private
 */
router.post(
  "/:id/deny",
  pharmacyController.denyRefillRequest.bind(pharmacyController),
);

/**
 * @route   GET /api/pharmacy/refills/pending
 * @desc    Get pending refill requests
 * @access  Private
 */
router.get("/pending", async (req, res) => {
  try {
    req.query.status = "pending";
    await pharmacyController.getRefillRequests.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending refills",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route   GET /api/pharmacy/refills/patient/:patientId
 * @desc    Get refill requests for specific patient
 * @access  Private
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    req.query.patientId = req.params.patientId;
    await pharmacyController.getRefillRequests.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient refills",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
