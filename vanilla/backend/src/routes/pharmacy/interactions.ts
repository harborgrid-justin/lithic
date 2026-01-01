/**
 * interactions.ts
 * Routes for drug interaction checking
 */

import { Router } from 'express';
import pharmacyController from '../../controllers/PharmacyController';

const router = Router();

/**
 * @route   POST /api/pharmacy/interactions/check
 * @desc    Check drug interactions for a medication
 * @access  Private
 * @body    { medicationId, currentMedications, patientData }
 */
router.post('/check', pharmacyController.checkDrugInteractions.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/interactions/bulk-check
 * @desc    Check interactions for multiple medications
 * @access  Private
 */
router.post('/bulk-check', async (req, res) => {
  try {
    const { medications, patientData } = req.body;

    if (!medications || !Array.isArray(medications)) {
      res.status(400).json({
        success: false,
        error: 'Medications array required',
      });
      return;
    }

    // Check each medication against all others
    const results = [];
    for (let i = 0; i < medications.length; i++) {
      const currentMed = medications[i];
      const otherMeds = medications.filter((_, index) => index !== i);

      req.body = {
        medicationId: currentMed.id,
        currentMedications: otherMeds,
        patientData,
      };

      // Capture response
      const originalJson = res.json;
      let responseData: any;
      res.json = function(data: any) {
        responseData = data;
        return res;
      };

      await pharmacyController.checkDrugInteractions.call(pharmacyController, req, res);

      res.json = originalJson;

      if (responseData && responseData.success) {
        results.push({
          medication: currentMed,
          ...responseData.data,
        });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk interaction check',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
