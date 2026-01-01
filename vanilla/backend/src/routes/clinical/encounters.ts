import { Router } from "express";
import EncounterController from "../../controllers/EncounterController";

const router = Router();

// Create a new encounter
router.post("/", (req, res) => EncounterController.createEncounter(req, res));

// Get encounter by ID
router.get("/:encounterId", (req, res) =>
  EncounterController.getEncounterById(req, res),
);

// Get encounters by patient
router.get("/patient/:patientId", (req, res) =>
  EncounterController.getEncountersByPatient(req, res),
);

// Get encounters by provider
router.get("/provider/:providerId", (req, res) =>
  EncounterController.getEncountersByProvider(req, res),
);

// Get encounters by date range
router.get("/provider/:providerId/date-range", (req, res) =>
  EncounterController.getEncountersByDateRange(req, res),
);

// Get encounter summary
router.get("/:encounterId/summary", (req, res) =>
  EncounterController.getEncounterSummary(req, res),
);

// Update encounter
router.put("/:encounterId", (req, res) =>
  EncounterController.updateEncounter(req, res),
);

// Start encounter
router.post("/:encounterId/start", (req, res) =>
  EncounterController.startEncounter(req, res),
);

// Complete encounter
router.post("/:encounterId/complete", (req, res) =>
  EncounterController.completeEncounter(req, res),
);

// Sign encounter
router.post("/:encounterId/sign", (req, res) =>
  EncounterController.signEncounter(req, res),
);

// Cancel encounter
router.post("/:encounterId/cancel", (req, res) =>
  EncounterController.cancelEncounter(req, res),
);

// Add diagnosis codes
router.post("/:encounterId/diagnoses", (req, res) =>
  EncounterController.addDiagnosisCodes(req, res),
);

// Add procedure codes
router.post("/:encounterId/procedures", (req, res) =>
  EncounterController.addProcedureCodes(req, res),
);

// Get dashboard stats
router.get("/dashboard/stats", (req, res) =>
  EncounterController.getDashboardStats(req, res),
);

export default router;
