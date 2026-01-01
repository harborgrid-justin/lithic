import { Router } from "express";
import ClinicalController from "../../controllers/ClinicalController";

const router = Router();

// Create a new allergy
router.post("/", (req, res) => ClinicalController.createAllergy(req, res));

// Get allergies by patient
router.get("/patient/:patientId", (req, res) =>
  ClinicalController.getAllergiesByPatient(req, res),
);

// Update allergy
router.put("/:allergyId", (req, res) =>
  ClinicalController.updateAllergy(req, res),
);

export default router;
