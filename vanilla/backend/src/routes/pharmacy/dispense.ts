/**
 * dispense.ts
 * Routes for prescription dispensing
 */

import { Router } from "express";
import pharmacyController from "../../controllers/PharmacyController";

const router = Router();

/**
 * @route   POST /api/pharmacy/dispense/:prescriptionId
 * @desc    Dispense a prescription
 * @access  Private
 */
router.post(
  "/:prescriptionId",
  pharmacyController.dispensePrescription.bind(pharmacyController),
);

/**
 * @route   GET /api/pharmacy/dispense/queue
 * @desc    Get dispensing queue (pending prescriptions)
 * @access  Private
 */
router.get("/queue", async (req, res) => {
  try {
    // Return prescriptions with status 'verified' ready for dispensing
    req.query.status = "verified";
    await pharmacyController.getPrescriptions.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dispensing queue",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route   GET /api/pharmacy/dispense/history
 * @desc    Get dispensing history
 * @access  Private
 */
router.get("/history", async (req, res) => {
  try {
    // Return prescriptions with status 'filled'
    req.query.status = "filled";
    await pharmacyController.getPrescriptions.call(
      pharmacyController,
      req,
      res,
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dispensing history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
