/**
 * Laboratory Results Routes
 */

import { Router } from "express";
import { LaboratoryController } from "../../controllers/LaboratoryController";

const router = Router();
const controller = new LaboratoryController();

// Add result
router.post("/", controller.addResult);

// Get critical results
router.get("/critical", controller.getCriticalResults);

// Search results
router.get("/search", controller.searchResults);

// Verify result
router.post("/:resultId/verify", controller.verifyResult);

// Get results for order
router.get("/order/:orderId", controller.getResultsForOrder);

// Get results for patient
router.get("/patient/:patientId", controller.getResultsForPatient);

// Generate HL7 result message
router.get("/order/:orderId/hl7", controller.generateHL7Result);

export default router;
