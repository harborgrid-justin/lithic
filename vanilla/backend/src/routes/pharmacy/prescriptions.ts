/**
 * prescriptions.ts
 * Routes for prescription management
 */

import { Router } from "express";
import pharmacyController from "../../controllers/PharmacyController";

const router = Router();

/**
 * @route   GET /api/pharmacy/prescriptions
 * @desc    Get all prescriptions with filters
 * @access  Private
 */
router.get("/", pharmacyController.getPrescriptions.bind(pharmacyController));

/**
 * @route   GET /api/pharmacy/prescriptions/:id
 * @desc    Get prescription by ID
 * @access  Private
 */
router.get("/:id", pharmacyController.getPrescription.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/prescriptions
 * @desc    Create new prescription
 * @access  Private
 */
router.post(
  "/",
  pharmacyController.createPrescription.bind(pharmacyController),
);

/**
 * @route   PATCH /api/pharmacy/prescriptions/:id/status
 * @desc    Update prescription status
 * @access  Private
 */
router.patch(
  "/:id/status",
  pharmacyController.updatePrescriptionStatus.bind(pharmacyController),
);

/**
 * @route   POST /api/pharmacy/prescriptions/:id/validate
 * @desc    Validate prescription
 * @access  Private
 */
router.post("/:id/validate", async (req, res) => {
  // Validation logic handled in controller
  res.status(501).json({ message: "Use POST /prescriptions for validation" });
});

export default router;
