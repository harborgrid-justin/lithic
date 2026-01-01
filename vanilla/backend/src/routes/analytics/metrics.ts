/**
 * Metrics Routes - API endpoints for metrics and analytics data
 * Lithic Healthcare Platform
 */

import { Router } from 'express';
import { analyticsController } from '../../controllers/AnalyticsController';

const router = Router();

/**
 * @route   GET /api/analytics/metrics
 * @desc    Get all available metrics
 * @query   category - Filter by metric category
 * @access  Private
 */
router.get('/', analyticsController.getMetrics);

/**
 * @route   GET /api/analytics/metrics/:id
 * @desc    Get a specific metric definition
 * @access  Private
 */
router.get('/:id', analyticsController.getMetric);

/**
 * @route   POST /api/analytics/metrics/:id/calculate
 * @desc    Calculate a metric value
 * @access  Private
 */
router.post('/:id/calculate', analyticsController.calculateMetric);

/**
 * @route   GET /api/analytics/metrics/quality/measures
 * @desc    Get quality measures (HEDIS, CMS, etc.)
 * @query   category - Filter by measure category
 * @query   status - Filter by compliance status
 * @query   startDate - Period start date
 * @query   endDate - Period end date
 * @access  Private
 */
router.get('/quality/measures', analyticsController.getQualityMeasures);

/**
 * @route   POST /api/analytics/metrics/quality/measures/:id/calculate
 * @desc    Calculate/recalculate a quality measure
 * @access  Private
 */
router.post('/quality/measures/:id/calculate', analyticsController.calculateQualityMeasure);

/**
 * @route   GET /api/analytics/metrics/financial
 * @desc    Get financial metrics
 * @query   startDate - Required start date
 * @query   endDate - Required end date
 * @access  Private
 */
router.get('/financial', analyticsController.getFinancialMetrics);

/**
 * @route   GET /api/analytics/metrics/operational
 * @desc    Get operational metrics
 * @query   startDate - Required start date
 * @query   endDate - Required end date
 * @access  Private
 */
router.get('/operational', analyticsController.getOperationalMetrics);

/**
 * @route   GET /api/analytics/metrics/population-health
 * @desc    Get population health metrics
 * @query   populationId - Optional population filter
 * @access  Private
 */
router.get('/population-health', analyticsController.getPopulationHealthMetrics);

export default router;
