/**
 * Report Routes - API endpoints for report management
 * Lithic Healthcare Platform
 */

import { Router } from 'express';
import { analyticsController } from '../../controllers/AnalyticsController';

const router = Router();

/**
 * @route   GET /api/analytics/reports
 * @desc    Get all report configurations
 * @query   type - Filter by report type
 * @query   createdBy - Filter by creator
 * @access  Private
 */
router.get('/', analyticsController.getReports);

/**
 * @route   GET /api/analytics/reports/templates
 * @desc    Get available report templates
 * @access  Private
 */
router.get('/templates', analyticsController.getReportTemplates);

/**
 * @route   GET /api/analytics/reports/:id
 * @desc    Get a specific report configuration
 * @access  Private
 */
router.get('/:id', analyticsController.getReport);

/**
 * @route   POST /api/analytics/reports
 * @desc    Create a new report configuration
 * @access  Private
 */
router.post('/', analyticsController.createReport);

/**
 * @route   PUT /api/analytics/reports/:id
 * @desc    Update a report configuration
 * @access  Private
 */
router.put('/:id', analyticsController.updateReport);

/**
 * @route   DELETE /api/analytics/reports/:id
 * @desc    Delete a report configuration
 * @access  Private
 */
router.delete('/:id', analyticsController.deleteReport);

/**
 * @route   POST /api/analytics/reports/:id/generate
 * @desc    Generate a report instance
 * @access  Private
 */
router.post('/:id/generate', analyticsController.generateReport);

/**
 * @route   GET /api/analytics/reports/instances
 * @desc    Get all report instances
 * @query   reportId - Filter by report config ID
 * @query   userId - Filter by user
 * @access  Private
 */
router.get('/instances/all', analyticsController.getReportInstances);

/**
 * @route   GET /api/analytics/reports/instances/:id
 * @desc    Get a specific report instance
 * @access  Private
 */
router.get('/instances/:id', analyticsController.getReportInstance);

export default router;
