/**
 * inventory.ts
 * Routes for pharmacy inventory management
 */

import { Router } from 'express';
import pharmacyController from '../../controllers/PharmacyController';

const router = Router();

/**
 * @route   GET /api/pharmacy/inventory
 * @desc    Get all inventory items with filters
 * @access  Private
 */
router.get('/', pharmacyController.getInventory.bind(pharmacyController));

/**
 * @route   GET /api/pharmacy/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Private
 */
router.get('/:id', pharmacyController.getInventoryItem.bind(pharmacyController));

/**
 * @route   POST /api/pharmacy/inventory
 * @desc    Create new inventory item
 * @access  Private
 */
router.post('/', pharmacyController.createInventoryItem.bind(pharmacyController));

/**
 * @route   PATCH /api/pharmacy/inventory/:id/quantity
 * @desc    Update inventory quantity
 * @access  Private
 */
router.patch('/:id/quantity', pharmacyController.updateInventoryQuantity.bind(pharmacyController));

/**
 * @route   GET /api/pharmacy/inventory/alerts/low-stock
 * @desc    Get low stock alerts
 * @access  Private
 */
router.get('/alerts/low-stock', async (req, res) => {
  try {
    req.query.lowStock = 'true';
    await pharmacyController.getInventory.call(pharmacyController, req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock alerts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/pharmacy/inventory/alerts/expiring
 * @desc    Get expiring medication alerts
 * @access  Private
 */
router.get('/alerts/expiring', async (req, res) => {
  try {
    req.query.expiringSoon = 'true';
    await pharmacyController.getInventory.call(pharmacyController, req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring medications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
