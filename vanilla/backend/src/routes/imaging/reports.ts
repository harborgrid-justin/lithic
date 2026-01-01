import { Router } from 'express';
import { ImagingController } from '../../controllers/ImagingController';
import { authMiddleware } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();
const controller = new ImagingController();

// Validation schemas
const createReportSchema = z.object({
  studyInstanceUID: z.string(),
  orderId: z.string().uuid().optional(),
  reportType: z.enum(['PRELIMINARY', 'FINAL', 'ADDENDUM', 'CORRECTION']),
  findings: z.string().min(10),
  impression: z.string().min(10),
  recommendation: z.string().optional(),
  technique: z.string().optional(),
  comparison: z.string().optional(),
  clinicalHistory: z.string().optional(),
  templateId: z.string().uuid().optional(),
  criticalResult: z.boolean().optional(),
  criticalResultNotifiedTo: z.string().optional(),
  criticalResultNotifiedAt: z.string().datetime().optional(),
});

const updateReportSchema = z.object({
  reportType: z.enum(['PRELIMINARY', 'FINAL', 'ADDENDUM', 'CORRECTION']).optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
  recommendation: z.string().optional(),
  technique: z.string().optional(),
  comparison: z.string().optional(),
  status: z.enum(['DRAFT', 'PRELIMINARY', 'FINAL', 'AMENDED', 'CORRECTED']).optional(),
  criticalResult: z.boolean().optional(),
});

const searchReportsSchema = z.object({
  studyInstanceUID: z.string().optional(),
  patientId: z.string().uuid().optional(),
  radiologistId: z.string().uuid().optional(),
  status: z.string().optional(),
  reportType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  criticalOnly: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const addendumSchema = z.object({
  addendumText: z.string().min(10),
  reason: z.string().min(5),
});

// Routes
/**
 * GET /api/imaging/reports
 * Get all radiology reports with filtering
 */
router.get(
  '/',
  authMiddleware,
  validateRequest(searchReportsSchema, 'query'),
  async (req, res) => {
    try {
      const result = await controller.getReports(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch reports',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/reports/:id
 * Get specific report by ID
 */
router.get(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const report = await controller.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/reports/study/:studyInstanceUID
 * Get report for specific study
 */
router.get(
  '/study/:studyInstanceUID',
  authMiddleware,
  async (req, res) => {
    try {
      const report = await controller.getReportByStudyUID(req.params.studyInstanceUID);
      if (!report) {
        return res.status(404).json({ error: 'Report not found for this study' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports
 * Create new radiology report
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createReportSchema),
  async (req, res) => {
    try {
      const report = await controller.createReport(req.body, req.user);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/imaging/reports/:id
 * Update radiology report
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(updateReportSchema),
  async (req, res) => {
    try {
      const report = await controller.updateReport(req.params.id, req.body, req.user);
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports/:id/sign
 * Sign and finalize report
 */
router.post(
  '/:id/sign',
  authMiddleware,
  async (req, res) => {
    try {
      const report = await controller.signReport(
        req.params.id,
        req.body.signature,
        req.user
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to sign report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports/:id/addendum
 * Add addendum to existing report
 */
router.post(
  '/:id/addendum',
  authMiddleware,
  validateRequest(addendumSchema),
  async (req, res) => {
    try {
      const report = await controller.addReportAddendum(
        req.params.id,
        req.body.addendumText,
        req.body.reason,
        req.user
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to add addendum',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports/:id/correct
 * Correct/amend existing report
 */
router.post(
  '/:id/correct',
  authMiddleware,
  async (req, res) => {
    try {
      const report = await controller.correctReport(
        req.params.id,
        req.body.correctedFindings,
        req.body.correctedImpression,
        req.body.correctionReason,
        req.user
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to correct report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/reports/:id/history
 * Get report version history
 */
router.get(
  '/:id/history',
  authMiddleware,
  async (req, res) => {
    try {
      const history = await controller.getReportHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch report history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/reports/:id/pdf
 * Generate PDF version of report
 */
router.get(
  '/:id/pdf',
  authMiddleware,
  async (req, res) => {
    try {
      const pdfBuffer = await controller.generateReportPDF(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports/:id/notify
 * Send critical result notification
 */
router.post(
  '/:id/notify',
  authMiddleware,
  async (req, res) => {
    try {
      await controller.notifyCriticalResult(
        req.params.id,
        req.body.notifyTo,
        req.body.notificationMethod,
        req.user
      );
      res.json({ success: true, message: 'Notification sent' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to send notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/reports/templates
 * Get report templates
 */
router.get(
  '/templates/list',
  authMiddleware,
  async (req, res) => {
    try {
      const templates = await controller.getReportTemplates(req.query.modality as string);
      res.json(templates);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/reports/:id/voice-dictation
 * Save voice dictation for report
 */
router.post(
  '/:id/voice-dictation',
  authMiddleware,
  async (req, res) => {
    try {
      const report = await controller.saveVoiceDictation(
        req.params.id,
        req.body.transcription,
        req.body.audioUrl,
        req.user
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to save voice dictation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
