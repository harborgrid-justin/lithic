/**
 * Scheduled Reports Routes - API endpoints for scheduled report management
 * Lithic Healthcare Platform
 */

import { Router } from "express";
import { analyticsController } from "../../controllers/AnalyticsController";

const router = Router();

/**
 * @route   GET /api/analytics/scheduled
 * @desc    Get all scheduled reports
 * @query   reportId - Filter by report configuration ID
 * @access  Private
 */
router.get("/", analyticsController.getScheduledReports);

/**
 * @route   POST /api/analytics/scheduled
 * @desc    Create a new scheduled report
 * @body    reportConfigId - ID of the report configuration
 * @body    schedule - Schedule configuration
 * @access  Private
 */
router.post("/", analyticsController.createScheduledReport);

/**
 * @route   PUT /api/analytics/scheduled/:id
 * @desc    Update a scheduled report
 * @access  Private
 */
router.put("/:id", analyticsController.updateScheduledReport);

/**
 * @route   DELETE /api/analytics/scheduled/:id
 * @desc    Delete a scheduled report
 * @access  Private
 */
router.delete("/:id", analyticsController.deleteScheduledReport);

/**
 * @route   POST /api/analytics/scheduled/:id/toggle
 * @desc    Enable or disable a scheduled report
 * @body    isActive - Boolean flag
 * @access  Private
 */
router.post("/:id/toggle", analyticsController.toggleScheduledReport);

/**
 * @route   GET /api/analytics/audit
 * @desc    Get analytics audit log
 * @query   resourceType - Filter by resource type
 * @query   resourceId - Filter by resource ID
 * @query   userId - Filter by user
 * @query   startDate - Filter by date range start
 * @query   endDate - Filter by date range end
 * @access  Private (Admin)
 */
router.get("/audit", analyticsController.getAuditLog);

export default router;
