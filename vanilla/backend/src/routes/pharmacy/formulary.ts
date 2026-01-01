/**
 * formulary.ts
 * Routes for drug formulary management
 */

import { Router } from 'express';
import pharmacyController from '../../controllers/PharmacyController';

const router = Router();

/**
 * @route   GET /api/pharmacy/formulary
 * @desc    Get all formulary entries with filters
 * @access  Private
 */
router.get('/', pharmacyController.getFormulary.bind(pharmacyController));

/**
 * @route   GET /api/pharmacy/formulary/medication/:medicationId
 * @desc    Get formulary entry for specific medication
 * @access  Private
 */
router.get('/medication/:medicationId', pharmacyController.getFormularyEntry.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/formulary
 * @desc    Create new formulary entry
 * @access  Private
 */
router.post('/', pharmacyController.createFormularyEntry.bind(pharmacyController));

/**
 * @route   GET /api/pharmacy/formulary/tier/:tier
 * @desc    Get formulary entries by tier
 * @access  Private
 */
router.get('/tier/:tier', async (req, res) => {
  try {
    req.query.tier = req.params.tier;
    await pharmacyController.getFormulary.call(pharmacyController, req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch formulary tier',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/pharmacy/formulary/status/:status
 * @desc    Get formulary entries by status
 * @access  Private
 */
router.get('/status/:status', async (req, res) => {
  try {
    req.query.status = req.params.status;
    await pharmacyController.getFormulary.call(pharmacyController, req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch formulary status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
