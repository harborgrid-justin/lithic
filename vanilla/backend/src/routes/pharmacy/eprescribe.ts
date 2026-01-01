/**
 * eprescribe.ts
 * Routes for e-prescribing (NCPDP SCRIPT standard)
 */

import { Router } from "express";
import pharmacyController from "../../controllers/PharmacyController";

const router = Router();

/**
 * @route   GET /api/pharmacy/eprescribe
 * @desc    Get all e-prescriptions with filters
 * @access  Private
 */
router.get("/", pharmacyController.getEPrescriptions.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/eprescribe
 * @desc    Process incoming e-prescription (NCPDP message)
 * @access  Private
 */
router.post(
  "/",
  pharmacyController.processEPrescription.bind(pharmacyController),
);

/**
 * @route   POST /api/pharmacy/eprescribe/:id/accept
 * @desc    Accept e-prescription
 * @access  Private
 */
router.post(
  "/:id/accept",
  pharmacyController.acceptEPrescription.bind(pharmacyController),
);

/**
 * @route   POST /api/pharmacy/eprescribe/:id/reject
 * @desc    Reject e-prescription
 * @access  Private
 */
router.post(
  "/:id/reject",
  pharmacyController.rejectEPrescription.bind(pharmacyController),
);

/**
 * @route   GET /api/pharmacy/eprescribe/pending
 * @desc    Get pending e-prescriptions
 * @access  Private
 */
router.get("/pending", async (req, res) => {
  try {
    req.query.status = "pending";
    await pharmacyController.getEPrescriptions.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending e-prescriptions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route   GET /api/pharmacy/eprescribe/type/:messageType
 * @desc    Get e-prescriptions by message type
 * @access  Private
 */
router.get("/type/:messageType", async (req, res) => {
  try {
    req.query.messageType = req.params.messageType;
    await pharmacyController.getEPrescriptions.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch e-prescriptions by type",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route   GET /api/pharmacy/eprescribe/controlled
 * @desc    Get controlled substance e-prescriptions (EPCS)
 * @access  Private
 */
router.get("/controlled", async (req, res) => {
  try {
    // In a real implementation, this would filter for EPCS (Electronic Prescriptions for Controlled Substances)
    // which require additional security measures and two-factor authentication
    req.query.status = "pending";
    await pharmacyController.getEPrescriptions.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch controlled substance e-prescriptions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
