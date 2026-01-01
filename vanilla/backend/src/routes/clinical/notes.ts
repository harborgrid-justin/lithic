import { Router } from 'express';
import ClinicalController from '../../controllers/ClinicalController';

const router = Router();

// Create a new note
router.post('/', (req, res) => ClinicalController.createNote(req, res));

// Get note by ID
router.get('/:noteId', (req, res) => ClinicalController.getNoteById(req, res));

// Get notes by encounter
router.get('/encounter/:encounterId', (req, res) => ClinicalController.getNotesByEncounter(req, res));

// Get notes by patient
router.get('/patient/:patientId', (req, res) => ClinicalController.getNotesByPatient(req, res));

// Update note
router.put('/:noteId', (req, res) => ClinicalController.updateNote(req, res));

// Sign note
router.post('/:noteId/sign', (req, res) => ClinicalController.signNote(req, res));

// Add addendum to note
router.post('/:noteId/addendum', (req, res) => ClinicalController.addAddendum(req, res));

// Get templates
router.get('/templates/list', (req, res) => ClinicalController.getTemplates(req, res));

// Get template by ID
router.get('/templates/:templateId', (req, res) => ClinicalController.getTemplateById(req, res));

export default router;
