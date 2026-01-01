import { Router } from 'express';
import { ImagingController } from '../../controllers/ImagingController';
import { authMiddleware } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();
const controller = new ImagingController();

// Validation schemas
const searchStudiesSchema = z.object({
  patientId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  studyDate: z.string().optional(),
  modality: z.string().optional(),
  accessionNumber: z.string().optional(),
  studyDescription: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const createStudySchema = z.object({
  orderId: z.string().uuid(),
  studyInstanceUID: z.string(),
  studyDate: z.string().datetime(),
  studyTime: z.string(),
  accessionNumber: z.string(),
  modality: z.string(),
  studyDescription: z.string(),
  performingPhysician: z.string().optional(),
  operatorName: z.string().optional(),
  numberOfSeries: z.number().int().min(0).optional(),
  numberOfInstances: z.number().int().min(0).optional(),
  institutionName: z.string().optional(),
  stationName: z.string().optional(),
});

const updateStudySchema = z.object({
  studyDescription: z.string().optional(),
  readingStatus: z.enum(['UNREAD', 'PRELIMINARY', 'FINAL', 'AMENDED', 'DICTATED']).optional(),
  assignedRadiologistId: z.string().uuid().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
  qualityScore: z.number().min(0).max(5).optional(),
  technicalNotes: z.string().optional(),
});

// Routes
/**
 * GET /api/imaging/studies
 * Search DICOM studies with QIDO-RS compatible endpoint
 */
router.get(
  '/',
  authMiddleware,
  validateRequest(searchStudiesSchema, 'query'),
  async (req, res) => {
    try {
      const result = await controller.searchStudies(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to search studies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/studies/:studyInstanceUID
 * Get specific DICOM study by UID
 */
router.get(
  '/:studyInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      const study = await controller.getStudyByUID(req.params.studyInstanceUID);
      if (!study) {
        return res.status(404).json({ error: 'Study not found' });
      }
      res.json(study);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch study',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/studies
 * Create/Register new DICOM study
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createStudySchema),
  async (req, res) => {
    try {
      const study = await controller.createStudy(req.body, req.user);
      res.status(201).json(study);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create study',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/imaging/studies/:studyInstanceUID
 * Update study metadata
 */
router.put(
  '/:studyInstanceUID',
  authMiddleware,
  validateRequest(updateStudySchema),
  async (req, res) => {
    try {
      const study = await controller.updateStudy(
        req.params.studyInstanceUID,
        req.body,
        req.user
      );
      res.json(study);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update study',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/studies/:studyInstanceUID/series
 * Get all series for a study
 */
router.get(
  '/:studyInstanceUID/series',
  authMiddleware,
  async (req, res) => {
    try {
      const series = await controller.getStudySeries(req.params.studyInstanceUID);
      res.json(series);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch series',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/studies/:studyInstanceUID/series/:seriesInstanceUID/instances
 * Get all instances for a series
 */
router.get(
  '/:studyInstanceUID/series/:seriesInstanceUID/instances',
  authMiddleware,
  async (req, res) => {
    try {
      const instances = await controller.getSeriesInstances(
        req.params.studyInstanceUID,
        req.params.seriesInstanceUID
      );
      res.json(instances);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch instances',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/studies/:studyInstanceUID/metadata
 * Get complete study metadata (DICOM JSON)
 */
router.get(
  '/:studyInstanceUID/metadata',
  authMiddleware,
  async (req, res) => {
    try {
      const metadata = await controller.getStudyMetadata(req.params.studyInstanceUID);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch study metadata',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/studies/:studyInstanceUID/compare
 * Compare current study with previous studies
 */
router.post(
  '/:studyInstanceUID/compare',
  authMiddleware,
  async (req, res) => {
    try {
      const comparison = await controller.compareStudies(
        req.params.studyInstanceUID,
        req.body.compareStudyUIDs || []
      );
      res.json(comparison);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to compare studies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/studies/:studyInstanceUID/priors
 * Get prior studies for same patient
 */
router.get(
  '/:studyInstanceUID/priors',
  authMiddleware,
  async (req, res) => {
    try {
      const priors = await controller.getPriorStudies(
        req.params.studyInstanceUID,
        req.query.limit ? parseInt(req.query.limit as string) : 5
      );
      res.json(priors);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch prior studies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/imaging/studies/:studyInstanceUID
 * Delete/Archive study (soft delete)
 */
router.delete(
  '/:studyInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      await controller.deleteStudy(req.params.studyInstanceUID, req.user);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete study',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/studies/:studyInstanceUID/share
 * Generate shareable study link
 */
router.post(
  '/:studyInstanceUID/share',
  authMiddleware,
  async (req, res) => {
    try {
      const shareLink = await controller.createStudyShareLink(
        req.params.studyInstanceUID,
        req.body.expiresIn || 7 * 24 * 60 * 60, // 7 days default
        req.user
      );
      res.json(shareLink);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create share link',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
