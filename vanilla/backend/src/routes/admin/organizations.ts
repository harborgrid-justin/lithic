import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController';

/**
 * Admin organizations routes
 */
export function createAdminOrganizationsRoute(adminController: AdminController): Router {
  const router = Router();

  /**
   * GET /admin/organizations/:organizationId
   * Get organization details
   */
  router.get('/:organizationId', adminController.getOrganization);

  /**
   * PUT /admin/organizations/:organizationId
   * Update organization settings
   */
  router.put('/:organizationId', adminController.updateOrganization);

  /**
   * GET /admin/sessions/statistics
   * Get session statistics
   */
  router.get('/sessions/statistics', adminController.getSessionStatistics);

  /**
   * GET /admin/mfa/statistics
   * Get MFA statistics
   */
  router.get('/mfa/statistics', adminController.getMFAStatistics);

  return router;
}
