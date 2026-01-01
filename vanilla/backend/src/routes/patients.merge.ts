/**
 * Patient Merge Routes
 */

import { Router } from 'express';
import PatientController from '../controllers/PatientController';

const router = Router();

// POST /api/patients/merge - Merge two patient records
router.post('/', PatientController.mergePatients.bind(PatientController));

export default router;
