/**
 * Patient Insurance Routes
 */

import { Router } from "express";
import PatientController from "../controllers/PatientController";

const router = Router();

// POST /api/patients/:id/insurance - Add or update insurance
router.post("/:id", PatientController.updateInsurance.bind(PatientController));

// PUT /api/patients/:id/insurance - Update insurance
router.put("/:id", PatientController.updateInsurance.bind(PatientController));

export default router;
