/**
 * Laboratory Reference Routes
 * For LOINC codes, reference ranges, and QC
 */

import { Router } from 'express';
import { LaboratoryController } from '../../controllers/LaboratoryController';
import { LOINC_CODES, COMMON_PANELS, searchLOINCCodes } from '../../../../shared/constants/loinc-codes';
import { REFERENCE_RANGES, getReferenceRange } from '../../../../shared/constants/reference-ranges';

const router = Router();
const controller = new LaboratoryController();

// Get all LOINC codes
router.get('/loinc', (req, res) => {
  res.json({
    success: true,
    data: Object.values(LOINC_CODES)
  });
});

// Search LOINC codes
router.get('/loinc/search', (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Query parameter required'
    });
    return;
  }

  const results = searchLOINCCodes(query);
  res.json({
    success: true,
    data: results
  });
});

// Get LOINC code by code
router.get('/loinc/:code', (req, res) => {
  const { code } = req.params;
  const loinc = LOINC_CODES[code];

  if (!loinc) {
    res.status(404).json({
      success: false,
      error: 'LOINC code not found'
    });
    return;
  }

  res.json({
    success: true,
    data: loinc
  });
});

// Get all reference ranges
router.get('/reference-ranges', (req, res) => {
  res.json({
    success: true,
    data: REFERENCE_RANGES
  });
});

// Get reference range for specific test
router.get('/reference-ranges/:loincCode', (req, res) => {
  const { loincCode } = req.params;
  const age = parseInt(req.query.age as string) || 35;
  const gender = (req.query.gender as 'male' | 'female') || 'male';

  const range = getReferenceRange(loincCode, age, gender);

  if (!range) {
    res.status(404).json({
      success: false,
      error: 'Reference range not found'
    });
    return;
  }

  res.json({
    success: true,
    data: range
  });
});

// Get common panels
router.get('/common-panels', (req, res) => {
  res.json({
    success: true,
    data: COMMON_PANELS
  });
});

// Quality Control endpoints
router.post('/qc', controller.recordQC);
router.get('/qc', controller.getQCRecords);
router.get('/qc/failed', controller.getFailedQC);

export default router;
