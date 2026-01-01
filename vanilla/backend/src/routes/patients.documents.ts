/**
 * Patient Documents Routes
 */

import { Router } from 'express';
import PatientController from '../controllers/PatientController';

const router = Router();

// POST /api/patients/:id/documents - Add document to patient
router.post('/:id', PatientController.addDocument.bind(PatientController));

// GET /api/patients/:id/documents - Get patient documents (handled by main patient route)
// This route would be implemented in the main controller

export default router;
