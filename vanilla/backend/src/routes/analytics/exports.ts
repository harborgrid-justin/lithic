/**
 * Export Routes - API endpoints for data export
 * Lithic Healthcare Platform
 */

import { Router } from "express";
import { analyticsController } from "../../controllers/AnalyticsController";

const router = Router();

/**
 * @route   POST /api/analytics/exports
 * @desc    Create a new export job
 * @body    type - Export type (dashboard, report, dataset)
 * @body    sourceId - ID of the resource to export
 * @body    sourceName - Name of the resource
 * @body    format - Export format (pdf, excel, csv, json, html)
 * @body    parameters - Export parameters
 * @access  Private
 */
router.post("/", analyticsController.createExportJob);

/**
 * @route   GET /api/analytics/exports
 * @desc    Get all export jobs for the current user
 * @access  Private
 */
router.get("/", analyticsController.getExportJobs);

/**
 * @route   GET /api/analytics/exports/:id
 * @desc    Get a specific export job
 * @access  Private
 */
router.get("/:id", analyticsController.getExportJob);

/**
 * @route   POST /api/analytics/exports/:id/cancel
 * @desc    Cancel a running export job
 * @access  Private
 */
router.post("/:id/cancel", analyticsController.cancelExportJob);

/**
 * @route   GET /api/analytics/exports/statistics
 * @desc    Get export statistics
 * @access  Private
 */
router.get("/statistics", analyticsController.getExportStatistics);

/**
 * @route   GET /api/analytics/exports/download/:id
 * @desc    Download an exported file
 * @access  Private
 */
router.get("/download/:id", (req, res) => {
  // In production, this would stream the file from storage
  // For now, return a placeholder response
  res.json({
    success: true,
    message: "File download would be initiated here",
    id: req.params.id,
  });
});

export default router;
