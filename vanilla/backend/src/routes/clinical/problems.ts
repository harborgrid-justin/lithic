import { Router } from 'express';
import ClinicalController from '../../controllers/ClinicalController';

const router = Router();

// Create a new problem
router.post('/', (req, res) => ClinicalController.createProblem(req, res));

// Get problems by patient
router.get('/patient/:patientId', (req, res) => ClinicalController.getProblemsByPatient(req, res));

// Update problem
router.put('/:problemId', (req, res) => ClinicalController.updateProblem(req, res));

// Search ICD-10 codes
router.get('/icd10/search', (req, res) => ClinicalController.searchICD10(req, res));

// Get ICD-10 by code
router.get('/icd10/:code', (req, res) => ClinicalController.getICD10ByCode(req, res));

export default router;
