import { Router } from "express";
import ClinicalController from "../../controllers/ClinicalController";

const router = Router();

// Record vital signs
router.post("/", (req, res) => ClinicalController.recordVitals(req, res));

// Get vitals by encounter
router.get("/encounter/:encounterId", (req, res) =>
  ClinicalController.getVitalsByEncounter(req, res),
);

// Get vitals by patient
router.get("/patient/:patientId", (req, res) =>
  ClinicalController.getVitalsByPatient(req, res),
);

export default router;
