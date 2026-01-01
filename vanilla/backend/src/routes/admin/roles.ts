import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController';

/**
 * Admin roles routes
 */
export function createAdminRolesRoute(adminController: AdminController): Router {
  const router = Router();

  /**
   * GET /admin/roles
   * Get all roles
   */
  router.get('/', adminController.getRoles);

  return router;
}
