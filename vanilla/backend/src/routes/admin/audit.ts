import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController';

/**
 * Admin audit logs routes
 */
export function createAdminAuditRoute(adminController: AdminController): Router {
  const router = Router();

  /**
   * GET /admin/audit-logs
   * Get audit logs with filtering
   */
  router.get('/', adminController.getAuditLogs);

  /**
   * GET /admin/audit-logs/statistics
   * Get audit log statistics
   */
  router.get('/statistics', adminController.getAuditStatistics);

  /**
   * POST /admin/audit-logs/export
   * Export audit logs
   */
  router.post('/export', adminController.exportAuditLogs);

  return router;
}
