import { Router } from 'express';
import { ImagingController } from '../../controllers/ImagingController';
import { authMiddleware } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();
const controller = new ImagingController();

// Validation schemas
const worklistQuerySchema = z.object({
  modality: z.string().optional(),
  scheduledDate: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  stationName: z.string().optional(),
  performingPhysician: z.string().optional(),
  patientId: z.string().optional(),
  accessionNumber: z.string().optional(),
});

const updateWorklistItemSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  performingPhysicianId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  scheduledDateTime: z.string().datetime().optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const createWorklistItemSchema = z.object({
  orderId: z.string().uuid(),
  modality: z.string(),
  scheduledDateTime: z.string().datetime(),
  scheduledStationName: z.string().optional(),
  performingPhysicianId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  requestedProcedureDescription: z.string(),
  scheduledProcedureStepId: z.string().optional(),
});

// Routes
/**
 * GET /api/imaging/worklist
 * Get DICOM Modality Worklist (MWL) - C-FIND equivalent
 */
router.get(
  '/',
  authMiddleware,
  validateRequest(worklistQuerySchema, 'query'),
  async (req, res) => {
    try {
      const worklist = await controller.getWorklist(req.query);
      res.json(worklist);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch worklist',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/worklist/:id
 * Get specific worklist item
 */
router.get(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const item = await controller.getWorklistItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Worklist item not found' });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist
 * Create new worklist item
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createWorklistItemSchema),
  async (req, res) => {
    try {
      const item = await controller.createWorklistItem(req.body, req.user);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/imaging/worklist/:id
 * Update worklist item
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(updateWorklistItemSchema),
  async (req, res) => {
    try {
      const item = await controller.updateWorklistItem(req.params.id, req.body, req.user);
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist/:id/start
 * Mark worklist item as in progress (MPPS - N-CREATE equivalent)
 */
router.post(
  '/:id/start',
  authMiddleware,
  async (req, res) => {
    try {
      const item = await controller.startWorklistItem(req.params.id, req.user);
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist/:id/complete
 * Mark worklist item as completed (MPPS - N-SET equivalent)
 */
router.post(
  '/:id/complete',
  authMiddleware,
  async (req, res) => {
    try {
      const item = await controller.completeWorklistItem(
        req.params.id,
        req.body.completionNotes,
        req.user
      );
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to complete worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist/:id/cancel
 * Cancel worklist item
 */
router.post(
  '/:id/cancel',
  authMiddleware,
  async (req, res) => {
    try {
      const item = await controller.cancelWorklistItem(
        req.params.id,
        req.body.reason,
        req.user
      );
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to cancel worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/worklist/today
 * Get today's worklist
 */
router.get(
  '/date/today',
  authMiddleware,
  async (req, res) => {
    try {
      const worklist = await controller.getTodayWorklist(req.query.modality as string);
      res.json(worklist);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch today\'s worklist',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/worklist/technician/:technicianId
 * Get worklist for specific technician
 */
router.get(
  '/technician/:technicianId',
  authMiddleware,
  async (req, res) => {
    try {
      const worklist = await controller.getTechnicianWorklist(req.params.technicianId);
      res.json(worklist);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch technician worklist',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/worklist/radiologist/:radiologistId
 * Get reading worklist for radiologist
 */
router.get(
  '/radiologist/:radiologistId',
  authMiddleware,
  async (req, res) => {
    try {
      const worklist = await controller.getRadiologistWorklist(req.params.radiologistId);
      res.json(worklist);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch radiologist worklist',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist/:id/assign
 * Assign worklist item to staff
 */
router.post(
  '/:id/assign',
  authMiddleware,
  async (req, res) => {
    try {
      const item = await controller.assignWorklistItem(
        req.params.id,
        req.body.assigneeId,
        req.body.assigneeType, // 'TECHNICIAN' | 'RADIOLOGIST'
        req.user
      );
      res.json(item);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to assign worklist item',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/imaging/worklist/stats
 * Get worklist statistics
 */
router.get(
  '/analytics/stats',
  authMiddleware,
  async (req, res) => {
    try {
      const stats = await controller.getWorklistStats(req.query);
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch worklist stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/imaging/worklist/bulk-schedule
 * Bulk schedule multiple orders
 */
router.post(
  '/bulk-schedule',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await controller.bulkScheduleOrders(
        req.body.orderIds,
        req.body.schedulingRules,
        req.user
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to bulk schedule orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
