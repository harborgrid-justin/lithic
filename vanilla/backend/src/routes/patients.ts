/**
 * Patient Routes - Main CRUD operations
 */

import { Router } from 'express';
import PatientController from '../controllers/PatientController';

const router = Router();

// GET /api/patients - Get all patients (with pagination)
router.get('/', PatientController.getAllPatients.bind(PatientController));

// GET /api/patients/:id - Get patient by ID
router.get('/:id', PatientController.getPatientById.bind(PatientController));

// POST /api/patients - Create new patient
router.post('/', PatientController.createPatient.bind(PatientController));

// PUT /api/patients/:id - Update patient
router.put('/:id', PatientController.updatePatient.bind(PatientController));

// DELETE /api/patients/:id - Delete patient (soft delete)
router.delete('/:id', PatientController.deletePatient.bind(PatientController));

// GET /api/patients/mrn/:mrn - Get patient by MRN
router.get('/mrn/:mrn', PatientController.getPatientByMRN.bind(PatientController));

// GET /api/patients/:id/audit - Get patient audit log
router.get('/:id/audit', PatientController.getAuditLog.bind(PatientController));

export default router;
