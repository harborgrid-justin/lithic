import { Router } from 'express';
import ClinicalController from '../../controllers/ClinicalController';

const router = Router();

// Create a new order
router.post('/', (req, res) => ClinicalController.createOrder(req, res));

// Get orders by encounter
router.get('/encounter/:encounterId', (req, res) => ClinicalController.getOrdersByEncounter(req, res));

// Get orders by patient
router.get('/patient/:patientId', (req, res) => ClinicalController.getOrdersByPatient(req, res));

// Update order
router.put('/:orderId', (req, res) => ClinicalController.updateOrder(req, res));

// Sign order
router.post('/:orderId/sign', (req, res) => ClinicalController.signOrder(req, res));

// Search CPT codes
router.get('/cpt/search', (req, res) => ClinicalController.searchCPT(req, res));

// Get CPT by code
router.get('/cpt/:code', (req, res) => ClinicalController.getCPTByCode(req, res));

export default router;
