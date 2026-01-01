/**
 * Laboratory Specimens Routes
 */

import { Router } from "express";
import { LaboratoryController } from "../../controllers/LaboratoryController";

const router = Router();
const controller = new LaboratoryController();

// Create specimen
router.post("/", controller.createSpecimen);

// Get specimen by barcode
router.get("/barcode/:barcode", controller.getSpecimenByBarcode);

// Get specimen by ID
router.get("/:specimenId", controller.getSpecimen);

// Get specimens for order
router.get("/order/:orderId", controller.getSpecimensForOrder);

// Receive specimen
router.post("/:specimenId/receive", controller.receiveSpecimen);

// Update specimen status
router.patch("/:specimenId/status", controller.updateSpecimenStatus);

// Reject specimen
router.post("/:specimenId/reject", controller.rejectSpecimen);

// Add quality issue
router.post("/:specimenId/quality-issue", controller.addQualityIssue);

// Get tracking history
router.get("/:specimenId/tracking", controller.getTrackingHistory);

export default router;
