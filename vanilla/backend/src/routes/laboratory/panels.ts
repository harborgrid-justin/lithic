/**
 * Laboratory Panels Routes
 */

import { Router } from 'express';
import { LaboratoryController } from '../../controllers/LaboratoryController';

const router = Router();
const controller = new LaboratoryController();

// Get all panels
router.get('/', controller.getPanels);

// Create panel
router.post('/', controller.createPanel);

// Get panel by ID
router.get('/:panelId', controller.getPanel);

export default router;
