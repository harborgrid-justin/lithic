/**
 * Dashboard Routes - API endpoints for dashboard management
 * Lithic Healthcare Platform
 */

import { Router } from 'express';
import { analyticsController } from '../../controllers/AnalyticsController';

const router = Router();

/**
 * @route   GET /api/analytics/dashboards
 * @desc    Get all dashboards for the current user
 * @query   category - Filter by metric category
 * @access  Private
 */
router.get('/', analyticsController.getDashboards);

/**
 * @route   GET /api/analytics/dashboards/:id
 * @desc    Get a specific dashboard by ID
 * @access  Private
 */
router.get('/:id', analyticsController.getDashboard);

/**
 * @route   POST /api/analytics/dashboards
 * @desc    Create a new dashboard
 * @access  Private
 */
router.post('/', analyticsController.createDashboard);

/**
 * @route   PUT /api/analytics/dashboards/:id
 * @desc    Update a dashboard
 * @access  Private
 */
router.put('/:id', analyticsController.updateDashboard);

/**
 * @route   DELETE /api/analytics/dashboards/:id
 * @desc    Delete a dashboard
 * @access  Private
 */
router.delete('/:id', analyticsController.deleteDashboard);

/**
 * @route   POST /api/analytics/dashboards/:id/duplicate
 * @desc    Duplicate a dashboard
 * @access  Private
 */
router.post('/:id/duplicate', analyticsController.duplicateDashboard);

/**
 * @route   POST /api/analytics/dashboards/widget-data
 * @desc    Get data for a specific widget configuration
 * @access  Private
 */
router.post('/widget-data', analyticsController.getWidgetData);

export default router;
