/**
 * Patient Search Routes
 */

import { Router } from 'express';
import PatientController from '../controllers/PatientController';

const router = Router();

// POST /api/patients/search - Search patients with advanced filters
router.post('/', PatientController.searchPatients.bind(PatientController));

// GET /api/patients/search - Search patients with query parameters
router.get('/', PatientController.searchPatients.bind(PatientController));

// POST /api/patients/search/duplicates - Find potential duplicate patients
router.post('/duplicates', PatientController.findDuplicates.bind(PatientController));

export default router;
