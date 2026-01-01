import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController';

/**
 * Admin permissions routes
 */
export function createAdminPermissionsRoute(adminController: AdminController): Router {
  const router = Router();

  /**
   * GET /admin/permissions
   * Get all available permissions
   */
  router.get('/', adminController.getPermissions);

  return router;
}
