import { Router } from "express";
import ClinicalController from "../../controllers/ClinicalController";

const router = Router();

// Create a new medication
router.post("/", (req, res) => ClinicalController.createMedication(req, res));

// Get medications by patient
router.get("/patient/:patientId", (req, res) =>
  ClinicalController.getMedicationsByPatient(req, res),
);

// Update medication
router.put("/:medicationId", (req, res) =>
  ClinicalController.updateMedication(req, res),
);

export default router;
